import type { Recurrence } from '$lib/types';
import { addDays, dateKey, parseDateKey } from './time';

/** Next due date after completing a recurring task. Never lands in the past. */
export function nextDue(recurrence: Recurrence, dueDate: string | undefined, now = new Date()): string | undefined {
	if (recurrence === 'none') return undefined;
	const today = dateKey(now);
	let d = parseDateKey(dueDate && dueDate > today ? dueDate : today);
	const step = () => {
		switch (recurrence) {
			case 'daily':
				d = addDays(d, 1);
				break;
			case 'weekdays':
				do d = addDays(d, 1);
				while (d.getDay() === 0 || d.getDay() === 6);
				break;
			case 'weekly':
				d = addDays(d, 7);
				break;
			case 'monthly':
				d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
				break;
		}
	};
	step();
	while (dateKey(d) <= today) step();
	return dateKey(d);
}
