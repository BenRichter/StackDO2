import type { AppData, HistoryEntry, Settings, Task, Thread } from '$lib/types';
import { DEFAULT_SETTINGS, THREAD_COLORS } from '$lib/types';
import { seedTasks, seedThreads, uid } from '$lib/data/seed';
import { buildStack, type ScoreContext } from '$lib/utils/scoring';
import { planDay } from '$lib/utils/plan';
import { nextDue } from '$lib/utils/recurrence';
import { addDays, dateKey, hmToMin, loggedMinutes } from '$lib/utils/time';

const KEY = 'stackdo:v2';
const LEGACY_KEY = 'stackdo2-tasks';

export type Filter = 'all' | 'quick' | 'short' | 'important' | 'due';

/** Migrates tasks from the v1 app (project/category/priority) into threads. */
function migrateLegacy(raw: string): Pick<AppData, 'threads' | 'tasks'> | null {
	try {
		const old = JSON.parse(raw) as Record<string, any>[];
		const threads: Thread[] = [];
		const threadFor = (name: string) => {
			let th = threads.find((t) => t.name === name);
			if (!th) {
				th = { id: uid(), name, color: THREAD_COLORS[threads.length % THREAD_COLORS.length], rank: threads.length };
				threads.push(th);
			}
			return th.id;
		};
		const imp: Record<string, number> = { low: 2, medium: 3, high: 4, urgent: 5 };
		const tasks: Task[] = old
			.filter((t) => !t.completed)
			.map((t) => ({
				id: t.id ?? uid(),
				title: t.title,
				notes: t.description,
				threadId: threadFor(t.project || t.category || 'Leben'),
				tags: t.tags ?? [],
				importance: imp[t.priority] ?? 3,
				dueDate: t.dueDate,
				estimate: t.estimatedMinutes || 15,
				recurrence: t.recurrence ?? 'none',
				createdAt: t.createdAt ?? new Date().toISOString(),
				timeLog: [],
				pushHistory: []
			}));
		return { threads, tasks };
	} catch {
		return null;
	}
}

function load(): AppData {
	const fresh = (): AppData => ({
		version: 2,
		threads: seedThreads(),
		tasks: seedTasks(),
		history: [],
		settings: { ...DEFAULT_SETTINGS, lastThreadId: 'selfcare' }
	});
	if (typeof localStorage === 'undefined') return fresh();
	try {
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const data = JSON.parse(raw) as AppData;
			return { ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } };
		}
		const legacy = localStorage.getItem(LEGACY_KEY);
		const migrated = legacy && migrateLegacy(legacy);
		if (migrated && migrated.tasks.length) {
			const base = fresh();
			return {
				...base,
				threads: [...base.threads.slice(0, 1), ...migrated.threads.map((t) => ({ ...t, rank: t.rank + 1 }))],
				tasks: [...base.tasks, ...migrated.tasks]
			};
		}
	} catch (e) {
		console.error('StackDO: could not load data', e);
	}
	return fresh();
}

class AppStore {
	threads = $state<Thread[]>([]);
	tasks = $state<Task[]>([]);
	history = $state<HistoryEntry[]>([]);
	settings = $state<Settings>({ ...DEFAULT_SETTINGS });
	timer = $state<AppData['timer']>(undefined);

	/** ticks every 30s so time-based availability & scoring stay fresh */
	now = $state(new Date());

	// UI state (not persisted)
	search = $state('');
	filter = $state<Filter>('all');
	threadFilter = $state<string | null>(null);
	/** undo buffer for the last completion */
	lastCompleted = $state<{ task: Task; spawnedId?: string } | null>(null);

	constructor() {
		if (typeof window === 'undefined') return;
		this.hydrate(load());
		this.cleanup();
		setInterval(() => (this.now = new Date()), 30_000);
		window.addEventListener('storage', (e) => {
			if (e.key === KEY && e.newValue) this.hydrate(JSON.parse(e.newValue));
		});
		$effect.root(() => {
			$effect(() => {
				const snapshot = this.snapshot();
				try {
					localStorage.setItem(KEY, JSON.stringify(snapshot));
				} catch (e) {
					console.error('StackDO: could not save', e);
				}
			});
		});
	}

	hydrate(data: AppData) {
		this.threads = data.threads;
		this.tasks = data.tasks.map((t) => ({ ...t, timeLog: t.timeLog ?? [], pushHistory: t.pushHistory ?? [] }));
		this.history = data.history ?? [];
		this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
		this.timer = data.timer;
	}

	snapshot(): AppData {
		return {
			version: 2,
			threads: this.threads,
			tasks: this.tasks,
			history: this.history,
			settings: this.settings,
			timer: this.timer
		};
	}

	// ── derived ────────────────────────────────────────────

	get activeThreads() {
		return this.threads.filter((t) => !t.archived).sort((a, b) => a.rank - b.rank);
	}

	thread(id: string | undefined) {
		return this.threads.find((t) => t.id === id);
	}

	get lastDone() {
		const last = [...this.history].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
		// flow bonus only while the last completion is fresh (< 2h)
		if (!last || this.now.getTime() - new Date(last.completedAt).getTime() > 2 * 3600_000) return undefined;
		return { threadId: last.threadId, tags: last.tags };
	}

	get ctx(): ScoreContext {
		return { now: this.now, threads: this.threads, lastDone: this.lastDone, runningTaskId: this.timer?.taskId };
	}

	get stack() {
		return buildStack(this.tasks, this.ctx);
	}

	/** Stack after search / filter chips. The "just do" card always uses the unfiltered-by-chip top unless filtered. */
	get visibleStack() {
		const q = this.search.trim().toLowerCase();
		const match = (t: Task) => {
			if (q && !`${t.title} ${t.notes ?? ''} ${t.tags.join(' ')} ${this.thread(t.threadId)?.name ?? ''}`.toLowerCase().includes(q))
				return false;
			if (this.threadFilter && t.threadId !== this.threadFilter) return false;
			if (this.settings.hideRecurring && t.recurrence !== 'none') return false;
			switch (this.filter) {
				case 'quick':
					return t.estimate <= 30;
				case 'short':
					return t.estimate < 120;
				case 'important':
					return t.importance >= 4;
				case 'due':
					return !!t.dueDate && t.dueDate <= dateKey(addDays(this.now, 1));
			}
			return true;
		};
		const { ready, later } = this.stack;
		return { ready: ready.filter((s) => match(s.task)), later: later.filter((u) => match(u.task)) };
	}

	get dayPlan() {
		return planDay(this.tasks, this.ctx, this.settings.dayStart, this.settings.dayEnd);
	}

	get doneToday() {
		const today = dateKey(this.now);
		return this.history.filter((h) => dateKey(new Date(h.completedAt)) === today);
	}

	get tags() {
		const set = new Set<string>();
		for (const t of this.tasks) t.tags.forEach((x) => set.add(x));
		for (const h of this.history) h.tags.forEach((x) => set.add(x));
		return [...set].sort();
	}

	// ── tasks ─────────────────────────────────────────────

	addTask(input: Partial<Task> & { title: string }): Task {
		const threadId = input.threadId ?? this.settings.lastThreadId ?? this.activeThreads[0]?.id;
		const task: Task = {
			id: uid(),
			tags: [],
			importance: 3,
			estimate: 15,
			recurrence: 'none',
			timeLog: [],
			pushHistory: [],
			...input,
			threadId: threadId!,
			createdAt: new Date().toISOString()
		};
		this.tasks.push(task);
		this.settings.lastThreadId = task.threadId;
		return task;
	}

	updateTask(id: string, patch: Partial<Task>) {
		const i = this.tasks.findIndex((t) => t.id === id);
		if (i >= 0) this.tasks[i] = { ...this.tasks[i], ...patch };
		if (patch.threadId) this.settings.lastThreadId = patch.threadId;
	}

	deleteTask(id: string) {
		if (this.timer?.taskId === id) this.timer = undefined;
		this.tasks = this.tasks.filter((t) => t.id !== id);
	}

	duplicate(id: string) {
		const t = this.tasks.find((x) => x.id === id);
		if (!t) return;
		const { id: _i, completedAt: _c, actual: _a, pushedUntil: _p, createdAt: _cr, ...rest } = t;
		return this.addTask({ ...rest, timeLog: [], pushHistory: [] });
	}

	/** Babysteps: split a big task into parts of ≤ `size` minutes. */
	split(id: string, size = 60) {
		const t = this.tasks.find((x) => x.id === id);
		if (!t) return;
		const n = Math.ceil(t.estimate / size);
		const per = Math.max(5, Math.round(t.estimate / n / 5) * 5);
		for (let i = n; i >= 1; i--) {
			const { id: _i, createdAt: _c, ...rest } = t;
			this.addTask({ ...rest, title: `${t.title} (${i}/${n})`, estimate: per, timeLog: [], pushHistory: [] });
		}
		this.deleteTask(id);
	}

	// ── timer ─────────────────────────────────────────────

	start(id: string) {
		if (this.timer?.taskId === id) return;
		this.stop();
		const start = new Date().toISOString();
		const t = this.tasks.find((x) => x.id === id);
		if (!t) return;
		t.timeLog.push({ start });
		this.timer = { taskId: id, start };
	}

	stop() {
		if (!this.timer) return;
		const t = this.tasks.find((x) => x.id === this.timer!.taskId);
		const open = t?.timeLog.find((e) => !e.end);
		if (open) open.end = new Date().toISOString();
		this.timer = undefined;
	}

	toggle(id: string) {
		if (this.timer?.taskId === id) this.stop();
		else this.start(id);
	}

	tracked(id: string) {
		const t = this.tasks.find((x) => x.id === id);
		return t ? loggedMinutes(t.timeLog, this.now) : 0;
	}

	// ── completion ────────────────────────────────────────

	complete(id: string) {
		const t = this.tasks.find((x) => x.id === id);
		if (!t) return;
		if (this.timer?.taskId === id) this.stop();
		const snapshot = $state.snapshot(t) as Task;
		const tracked = loggedMinutes(t.timeLog);
		const actual = tracked >= 1 ? Math.round(tracked) : t.estimate;
		const completedAt = new Date().toISOString();
		this.updateTask(id, { completedAt, actual });
		this.history.push({
			taskId: id,
			title: t.title,
			threadId: t.threadId,
			tags: [...t.tags],
			estimate: t.estimate,
			actual,
			completedAt
		});

		let spawnedId: string | undefined;
		if (t.recurrence !== 'none') {
			const { id: _i, completedAt: _c, actual: _a, pushedUntil: _p, createdAt: _cr, ...rest } = snapshot;
			spawnedId = this.addTask({
				...rest,
				dueDate: nextDue(t.recurrence, t.dueDate),
				timeLog: [],
				pushHistory: []
			}).id;
		}
		this.lastCompleted = { task: snapshot, spawnedId };
	}

	/** Correct the real duration after the fact ("wie lange hat's wirklich gedauert?"). */
	setActual(id: string, minutes: number) {
		this.updateTask(id, { actual: minutes });
		const h = this.history.findLast((x) => x.taskId === id);
		if (h) h.actual = minutes;
	}

	undoComplete() {
		const last = this.lastCompleted;
		if (!last) return;
		this.tasks = this.tasks.filter((t) => t.id !== last.spawnedId);
		this.updateTask(last.task.id, { completedAt: undefined, actual: undefined });
		const i = this.history.findLastIndex((h) => h.taskId === last.task.id);
		if (i >= 0) this.history.splice(i, 1);
		this.lastCompleted = null;
	}

	followUp(id: string, days: number) {
		const t = this.tasks.find((x) => x.id === id);
		if (!t) return;
		const when = addDays(new Date(), days);
		when.setHours(Math.floor(hmToMin(this.settings.dayStart) / 60) + 2, 0, 0, 0);
		this.addTask({
			title: `↪ Nachhaken: ${t.title.replace(/^↪ Nachhaken: /, '')}`,
			threadId: t.threadId,
			tags: t.tags,
			importance: Math.max(3, t.importance),
			estimate: 10,
			dueDate: dateKey(when),
			pushedUntil: when.toISOString(),
			followUpOf: t.id
		});
	}

	// ── push back ─────────────────────────────────────────

	push(id: string, until: Date, reason?: string) {
		const t = this.tasks.find((x) => x.id === id);
		if (!t) return;
		if (this.timer?.taskId === id) this.stop();
		this.updateTask(id, {
			pushedUntil: until.toISOString(),
			pushHistory: [...t.pushHistory, { at: new Date().toISOString(), until: until.toISOString(), reason }]
		});
	}

	unpush(id: string) {
		this.updateTask(id, { pushedUntil: undefined });
	}

	// ── threads ───────────────────────────────────────────

	addThread(name: string, color?: string) {
		const th: Thread = {
			id: uid(),
			name,
			color: color ?? THREAD_COLORS[this.threads.length % THREAD_COLORS.length],
			rank: this.threads.length
		};
		this.threads.push(th);
		return th;
	}

	updateThread(id: string, patch: Partial<Thread>) {
		const i = this.threads.findIndex((t) => t.id === id);
		if (i >= 0) this.threads[i] = { ...this.threads[i], ...patch };
	}

	moveThread(id: string, dir: -1 | 1) {
		const list = this.activeThreads;
		const i = list.findIndex((t) => t.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= list.length) return;
		[list[i], list[j]] = [list[j], list[i]];
		list.forEach((t, rank) => this.updateThread(t.id, { rank }));
	}

	/** Deleting a thread moves its open tasks to the next thread – nothing gets lost. */
	deleteThread(id: string) {
		const fallback = this.activeThreads.find((t) => t.id !== id);
		if (!fallback) return;
		this.tasks = this.tasks.map((t) => (t.threadId === id ? { ...t, threadId: fallback.id } : t));
		this.threads = this.threads.filter((t) => t.id !== id);
		if (this.settings.lastThreadId === id) this.settings.lastThreadId = fallback.id;
	}

	// ── housekeeping ──────────────────────────────────────

	/** Drop completed tasks older than N days. History entries stay for stats + predictions. */
	cleanup() {
		const limit = Date.now() - this.settings.cleanupDays * 86400_000;
		this.tasks = this.tasks.filter((t) => !t.completedAt || new Date(t.completedAt).getTime() > limit);
		if (this.history.length > 5000) this.history = this.history.slice(-5000);
	}

	restartTutorial() {
		if (!this.thread('tutorial')) this.threads.push({ ...seedThreads()[0], rank: -1 });
		else this.updateThread('tutorial', { archived: false, rank: -1 });
		this.activeThreads.forEach((t, rank) => this.updateThread(t.id, { rank }));
		this.tasks = [...this.tasks.filter((t) => !t.tutorial), ...seedTasks()];
	}

	importData(json: string) {
		const data = JSON.parse(json) as AppData;
		if (data.version !== 2 || !Array.isArray(data.tasks) || !Array.isArray(data.threads)) throw new Error('Unbekanntes Format');
		this.hydrate(data);
	}

	reset() {
		localStorage.removeItem(KEY);
		this.hydrate(load());
	}
}

export const app = new AppStore();
