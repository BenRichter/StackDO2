import type { Task, Thread } from '$lib/types';
import { BABYSTEP_LIMIT } from '$lib/types';
import { dateKey, daysBetween, hmToMin, minutesOfDay, parseDateKey } from './time';

export interface ScoreContext {
	now: Date;
	threads: Thread[];
	/** last completed task, used for flow / batch bonus */
	lastDone?: Pick<Task, 'threadId' | 'tags'>;
	runningTaskId?: string;
}

export interface ScorePart {
	label: string;
	value: number;
}

export interface ScoredTask {
	task: Task;
	score: number;
	parts: ScorePart[];
}

export type Unavailable = { task: Task; reason: string; until?: Date };

/** Is a thread's blocker window open at `now`? Threads without window are always open. */
export function threadOpen(thread: Thread | undefined, now: Date): boolean {
	if (!thread?.window) return true;
	const { from, to, days } = thread.window;
	if (days.length && !days.includes(now.getDay())) return false;
	const m = minutesOfDay(now);
	const f = hmToMin(from);
	const t = hmToMin(to);
	return f <= t ? m >= f && m < t : m >= f || m < t; // supports windows across midnight
}

/** Why a task cannot be done right now – or null if it can. */
export function unavailableReason(task: Task, thread: Thread | undefined, now: Date): string | null {
	if (task.completedAt) return 'erledigt';
	if (task.pushedUntil && new Date(task.pushedUntil) > now) return 'zurückgestellt';
	if (task.recurrence !== 'none' && task.dueDate) {
		const today = dateKey(now);
		if (task.dueDate > today) return 'wiederkehrend';
		if (task.dueDate === today && task.dueTime && minutesOfDay(now) < hmToMin(task.dueTime) - 15)
			return `ab ${task.dueTime}`;
	}
	if (!threadOpen(thread, now)) return `${thread!.name} ${thread!.window!.from}–${thread!.window!.to}`;
	return null;
}

/** Relative thread weight: top-ranked active thread 30, last one ~30/n. */
export function threadWeight(threadId: string, threads: Thread[]): number {
	const active = threads.filter((t) => !t.archived).sort((a, b) => a.rank - b.rank);
	const idx = active.findIndex((t) => t.id === threadId);
	if (idx < 0) return 0;
	return Math.round(30 * (1 - idx / active.length));
}

export function urgency(task: Task, now: Date): number {
	if (!task.dueDate) return 0;
	const days = daysBetween(now, parseDateKey(task.dueDate));
	if (days < 0) return 40 + Math.min(-days, 10) * 2;
	if (days === 0) {
		if (task.dueTime && task.recurrence === 'none') {
			const left = hmToMin(task.dueTime) - minutesOfDay(now);
			if (left < 120) return 45;
		}
		return 35;
	}
	if (days === 1) return 22;
	if (days <= 3) return 14;
	if (days <= 7) return 7;
	return 0;
}

export function scoreTask(task: Task, ctx: ScoreContext): ScoredTask {
	const parts: ScorePart[] = [];
	const add = (label: string, value: number) => {
		if (value) parts.push({ label, value });
	};

	if (ctx.runningTaskId === task.id) add('läuft gerade', 1000);

	add('Strang', threadWeight(task.threadId, ctx.threads));
	add('Wichtig', (task.importance - 1) * 7);
	add('Dringend', urgency(task, ctx.now));

	// A blocker window is that thread's time: while it's open, its tasks come first
	const thread = ctx.threads.find((t) => t.id === task.threadId);
	if (thread?.window && threadOpen(thread, ctx.now)) add('Zeitfenster', 20);

	// Quick wins float up, monsters sink (and get the babysteps hint)
	if (task.estimate <= 15) add('Quick Win', 8);
	else if (task.estimate <= 30) add('kurz', 5);
	else if (task.estimate > BABYSTEP_LIMIT) add('zu groß', -5);

	// Eat the frog: big important stuff before noon
	if (ctx.now.getHours() < 12 && task.estimate >= 60 && task.importance >= 4) add('Frosch', 10);

	// Flow: stay in the same thread, batch similar kinds of work
	if (ctx.lastDone) {
		if (ctx.lastDone.threadId === task.threadId) add('Flow', 8);
		if (task.tags.some((t) => ctx.lastDone!.tags.includes(t))) add('Batch', 6);
	}

	// Nothing starves forever
	const age = daysBetween(new Date(task.createdAt), ctx.now);
	add('Alter', Math.round(Math.min(Math.max(age, 0), 14) * 0.5));

	const score = parts.reduce((s, p) => s + p.value, 0);
	return { task, score, parts };
}

/** The stack: every open task, available ones sorted best-first; the first one is "just do". */
export function buildStack(tasks: Task[], ctx: ScoreContext): { ready: ScoredTask[]; later: Unavailable[] } {
	const byId = new Map(ctx.threads.map((t) => [t.id, t]));
	const ready: ScoredTask[] = [];
	const later: Unavailable[] = [];
	for (const task of tasks) {
		if (task.completedAt) continue;
		const thread = byId.get(task.threadId);
		if (thread?.archived) continue;
		const reason = ctx.runningTaskId === task.id ? null : unavailableReason(task, thread, ctx.now);
		if (reason) later.push({ task, reason, until: task.pushedUntil ? new Date(task.pushedUntil) : undefined });
		else ready.push(scoreTask(task, ctx));
	}
	ready.sort((a, b) => b.score - a.score || a.task.estimate - b.task.estimate);
	later.sort((a, b) => (a.until?.getTime() ?? Infinity) - (b.until?.getTime() ?? Infinity));
	return { ready, later };
}
