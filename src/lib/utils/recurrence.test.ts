import { describe, expect, it } from 'vitest';
import { nextDue } from './recurrence';

const friday = new Date(2026, 9, 2, 12, 0);

describe('nextDue', () => {
	it('steps by recurrence', () => {
		expect(nextDue('daily', '2026-10-02', friday)).toBe('2026-10-03');
		expect(nextDue('weekdays', '2026-10-02', friday)).toBe('2026-10-05');
		expect(nextDue('weekly', '2026-10-02', friday)).toBe('2026-10-09');
		expect(nextDue('monthly', '2026-10-02', friday)).toBe('2026-11-02');
		expect(nextDue('none', '2026-10-02', friday)).toBeUndefined();
	});

	it('never schedules into the past when done late', () => {
		expect(nextDue('daily', '2026-09-20', friday)).toBe('2026-10-03');
		expect(nextDue('weekly', '2026-09-20', friday)).toBe('2026-10-09');
	});
});
