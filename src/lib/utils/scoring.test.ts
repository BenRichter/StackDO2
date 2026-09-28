import { describe, expect, it } from 'vitest';
import type { Task, Thread } from '$lib/types';
import { buildStack, threadOpen, threadWeight, unavailableReason } from './scoring';

const threads: Thread[] = [
	{ id: 'a', name: 'Leben', color: '#000', rank: 0 },
	{ id: 'b', name: 'Arbeit', color: '#111', rank: 1, window: { from: '08:00', to: '17:00', days: [1, 2, 3, 4, 5] } },
	{ id: 'c', name: 'Familie', color: '#222', rank: 2 }
];

let n = 0;
const task = (p: Partial<Task> = {}): Task => ({
	id: `t${n++}`,
	title: 'x',
	threadId: 'a',
	tags: [],
	importance: 3,
	estimate: 30,
	recurrence: 'none',
	createdAt: '2026-09-28T06:00:00',
	timeLog: [],
	pushHistory: [],
	...p
});

// Monday 28 Sep 2026, 10:00 local
const monday10 = new Date(2026, 8, 28, 10, 0);
const saturday10 = new Date(2026, 9, 3, 10, 0);

describe('threads', () => {
	it('weights by relative rank', () => {
		expect(threadWeight('a', threads)).toBe(30);
		expect(threadWeight('b', threads)).toBe(20);
		expect(threadWeight('c', threads)).toBe(10);
	});

	it('respects blocker windows and weekdays', () => {
		expect(threadOpen(threads[1], monday10)).toBe(true);
		expect(threadOpen(threads[1], new Date(2026, 8, 28, 18, 0))).toBe(false);
		expect(threadOpen(threads[1], saturday10)).toBe(false);
		expect(threadOpen(threads[0], saturday10)).toBe(true);
	});

	it('supports windows across midnight', () => {
		const night: Thread = { id: 'n', name: 'Nacht', color: '#000', rank: 0, window: { from: '22:00', to: '02:00', days: [] } };
		expect(threadOpen(night, new Date(2026, 8, 28, 23, 0))).toBe(true);
		expect(threadOpen(night, new Date(2026, 8, 28, 1, 0))).toBe(true);
		expect(threadOpen(night, new Date(2026, 8, 28, 12, 0))).toBe(false);
	});
});

describe('availability', () => {
	it('hides pushed tasks until their time', () => {
		const t = task({ pushedUntil: new Date(2026, 8, 28, 11, 0).toISOString() });
		expect(unavailableReason(t, threads[0], monday10)).toBe('zurückgestellt');
		expect(unavailableReason(t, threads[0], new Date(2026, 8, 28, 12, 0))).toBeNull();
	});

	it('hides future recurring instances and habits before their time', () => {
		expect(unavailableReason(task({ recurrence: 'daily', dueDate: '2026-09-29' }), threads[0], monday10)).toBe('wiederkehrend');
		expect(unavailableReason(task({ recurrence: 'daily', dueDate: '2026-09-28', dueTime: '18:00' }), threads[0], monday10)).toBe('ab 18:00');
		expect(unavailableReason(task({ recurrence: 'daily', dueDate: '2026-09-28', dueTime: '10:10' }), threads[0], monday10)).toBeNull();
	});

	it('non-recurring tasks with a future due date are still doable', () => {
		expect(unavailableReason(task({ dueDate: '2026-10-10' }), threads[0], monday10)).toBeNull();
	});
});

describe('buildStack', () => {
	it('puts the most valuable task on top', () => {
		const low = task({ threadId: 'c', importance: 2 });
		const urgent = task({ threadId: 'c', importance: 3, dueDate: '2026-09-27' });
		const important = task({ threadId: 'a', importance: 5 });
		const { ready } = buildStack([low, urgent, important], { now: monday10, threads });
		expect(ready.map((s) => s.task.id)).toEqual([urgent.id, important.id, low.id]);
	});

	it('running task always wins and completed ones vanish', () => {
		const a = task({ importance: 5, dueDate: '2026-09-20' });
		const b = task({ importance: 1 });
		const c = task({ completedAt: monday10.toISOString() });
		const { ready } = buildStack([a, b, c], { now: monday10, threads, runningTaskId: b.id });
		expect(ready.map((s) => s.task.id)).toEqual([b.id, a.id]);
	});

	it('work tasks go to "later" outside the window', () => {
		const w = task({ threadId: 'b' });
		const { ready, later } = buildStack([w], { now: saturday10, threads });
		expect(ready).toHaveLength(0);
		expect(later[0].reason).toContain('Arbeit');
	});

	it('flow & batch bonus keep you in the same thread / kind of work', () => {
		const same = task({ threadId: 'c', tags: ['mail'] });
		const other = task({ threadId: 'c', tags: ['code'] });
		const { ready } = buildStack([other, same], { now: monday10, threads, lastDone: { threadId: 'a', tags: ['mail'] } });
		expect(ready[0].task.id).toBe(same.id);
		expect(ready[0].parts.find((p) => p.label === 'Batch')?.value).toBeGreaterThan(0);
	});

	it('boosts tasks of a thread whose window is open', () => {
		const work = task({ threadId: 'b', importance: 3 });
		const life = task({ threadId: 'a', importance: 3 });
		const { ready } = buildStack([life, work], { now: monday10, threads });
		expect(ready[0].task.id).toBe(work.id);
	});

	it('skips archived threads', () => {
		const t = task({ threadId: 'z' });
		const { ready, later } = buildStack([t], { now: monday10, threads: [...threads, { id: 'z', name: 'Z', color: '#000', rank: 3, archived: true }] });
		expect(ready).toHaveLength(0);
		expect(later).toHaveLength(0);
	});
});
