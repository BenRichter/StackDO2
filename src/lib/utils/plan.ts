import type { Task, Thread } from '$lib/types';
import { dateKey, hmToMin, loggedMinutes, minutesOfDay } from './time';
import { scoreTask, type ScoreContext } from './scoring';

export interface Block {
	kind: 'blocker' | 'plan' | 'done';
	start: number; // minutes since midnight
	end: number;
	color: string;
	label: string;
	taskId?: string;
}

export interface DayPlan {
	blockers: Block[];
	plan: Block[];
	done: Block[];
	/** tasks that don't fit into today anymore */
	overflow: Task[];
	freeMinutes: number;
	plannedMinutes: number;
	doneMinutes: number;
}

type Seg = { start: number; end: number };

function subtract(segs: Seg[], cut: Seg): Seg[] {
	const out: Seg[] = [];
	for (const s of segs) {
		if (cut.end <= s.start || cut.start >= s.end) out.push(s);
		else {
			if (cut.start > s.start) out.push({ start: s.start, end: cut.start });
			if (cut.end < s.end) out.push({ start: cut.end, end: s.end });
		}
	}
	return out;
}

function windowToday(thread: Thread, day: Date): Seg[] {
	const w = thread.window;
	if (!w || thread.archived) return [];
	if (w.days.length && !w.days.includes(day.getDay())) return [];
	const f = hmToMin(w.from);
	const t = hmToMin(w.to);
	return f <= t ? [{ start: f, end: t }] : [{ start: 0, end: t }, { start: f, end: 1440 }];
}

/** Lays today's stack out on the clock: blockers own their windows, the rest fills the free time. */
export function planDay(
	tasks: Task[],
	ctx: ScoreContext,
	dayStart: string,
	dayEnd: string
): DayPlan {
	const now = ctx.now;
	const nowMin = minutesOfDay(now);
	const today = dateKey(now);
	const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	const threadById = new Map(ctx.threads.map((t) => [t.id, t]));

	// Zones: each blocker thread owns its window; "free" is the waking day minus all windows.
	const zones = new Map<string, Seg[]>();
	const blockers: Block[] = [];
	let free: Seg[] = [{ start: hmToMin(dayStart), end: hmToMin(dayEnd) }];
	for (const th of ctx.threads) {
		const segs = windowToday(th, now);
		if (!segs.length) continue;
		zones.set(th.id, segs);
		for (const s of segs) {
			blockers.push({ kind: 'blocker', ...s, color: th.color, label: th.name });
			free = subtract(free, s);
		}
	}
	zones.set('free', free);
	const cursor = new Map<string, number>();

	const doable = tasks
		.filter((t) => {
			if (t.completedAt || t.someday || threadById.get(t.threadId)?.archived) return false;
			if (t.pushedUntil && new Date(t.pushedUntil) >= endOfToday) return false;
			if (t.recurrence !== 'none' && t.dueDate && t.dueDate > today) return false;
			return true;
		})
		.map((t) => scoreTask(t, ctx))
		.sort((a, b) => b.score - a.score);

	const plan: Block[] = [];
	const overflow: Task[] = [];
	let plannedMinutes = 0;

	for (const { task } of doable) {
		const th = threadById.get(task.threadId);
		const zoneKey = th && zones.has(th.id) && th.window ? th.id : 'free';
		const segs = zones.get(zoneKey)!;
		let earliest = Math.max(cursor.get(zoneKey) ?? nowMin, nowMin);
		if (task.pushedUntil) earliest = Math.max(earliest, minutesOfDay(new Date(task.pushedUntil)));
		if (task.recurrence !== 'none' && task.dueTime && task.dueDate === today)
			earliest = Math.max(earliest, hmToMin(task.dueTime));

		let remaining =
			ctx.runningTaskId === task.id
				? Math.max(5, task.estimate - loggedMinutes(task.timeLog, now))
				: task.estimate;
		const pieces: Block[] = [];
		for (const s of segs) {
			if (remaining <= 0) break;
			const start = Math.max(s.start, earliest);
			if (start >= s.end) continue;
			const end = Math.min(s.end, start + remaining);
			pieces.push({ kind: 'plan', start, end, color: th?.color ?? '#999', label: task.title, taskId: task.id });
			remaining -= end - start;
			earliest = end;
		}
		if (remaining > 0) {
			overflow.push(task);
			continue;
		}
		plan.push(...pieces);
		plannedMinutes += task.estimate;
		cursor.set(zoneKey, earliest);
	}

	// What really happened today (timer logs)
	const done: Block[] = [];
	let doneMinutes = 0;
	for (const t of tasks) {
		for (const e of t.timeLog) {
			const s = new Date(e.start);
			if (dateKey(s) !== today) continue;
			const endD = e.end ? new Date(e.end) : now;
			const start = minutesOfDay(s);
			const end = Math.max(start + 1, minutesOfDay(endD));
			doneMinutes += end - start;
			done.push({
				kind: 'done',
				start,
				end,
				color: threadById.get(t.threadId)?.color ?? '#999',
				label: t.title,
				taskId: t.id
			});
		}
	}

	const freeMinutes = [...zones.values()]
		.flat()
		.reduce((sum, s) => sum + Math.max(0, s.end - Math.max(s.start, nowMin)), 0);

	return { blockers, plan, done, overflow, freeMinutes, plannedMinutes, doneMinutes };
}
