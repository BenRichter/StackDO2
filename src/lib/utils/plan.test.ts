import { describe, expect, it } from 'vitest';
import type { Task, Thread } from '$lib/types';
import { planDay } from './plan';

const threads: Thread[] = [
	{ id: 'life', name: 'Leben', color: '#0a0', rank: 0 },
	{ id: 'work', name: 'Arbeit', color: '#00a', rank: 1, window: { from: '08:00', to: '17:00', days: [1, 2, 3, 4, 5] } }
];
let n = 0;
const task = (p: Partial<Task>): Task => ({
	id: `t${n++}`,
	title: 'x',
	threadId: 'life',
	tags: [],
	importance: 3,
	estimate: 30,
	recurrence: 'none',
	createdAt: '2026-09-28T06:00:00',
	timeLog: [],
	pushHistory: [],
	...p
});

describe('planDay', () => {
	const monday7 = new Date(2026, 8, 28, 7, 0);

	it('blockers own their window; private tasks go around them', () => {
		const work = task({ threadId: 'work', estimate: 60 });
		const life1 = task({ estimate: 45, importance: 5 });
		const life2 = task({ estimate: 30 });
		const p = planDay([work, life1, life2], { now: monday7, threads }, '07:00', '22:00');
		expect(p.blockers).toEqual([expect.objectContaining({ start: 480, end: 1020, label: 'Arbeit' })]);
		const byTask = Object.fromEntries(p.plan.map((b) => [b.taskId, b]));
		expect(byTask[work.id]).toMatchObject({ start: 480, end: 540 });
		expect(byTask[life1.id]).toMatchObject({ start: 420, end: 465 });
		// 15 min left before work, then continues after 17:00
		expect(p.plan.filter((b) => b.taskId === life2.id).map((b) => [b.start, b.end])).toEqual([
			[465, 480],
			[1020, 1035]
		]);
		expect(p.overflow).toHaveLength(0);
	});

	it('reports overflow when the day is full', () => {
		const late = new Date(2026, 8, 28, 21, 30);
		const p = planDay([task({ estimate: 60 })], { now: late, threads }, '07:00', '22:00');
		expect(p.overflow).toHaveLength(1);
	});

	it('skips tasks pushed beyond today and future recurring instances', () => {
		const pushed = task({ pushedUntil: new Date(2026, 8, 29, 9, 0).toISOString() });
		const habit = task({ recurrence: 'daily', dueDate: '2026-09-29' });
		const p = planDay([pushed, habit], { now: monday7, threads }, '07:00', '22:00');
		expect(p.plan).toHaveLength(0);
	});
});
