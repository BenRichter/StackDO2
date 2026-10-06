import type { Task } from '$lib/types';
import type { Block } from './plan';
import { atMinute } from './time';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dateOnly = (key: string) => key.replace(/-/g, '');

/** iCalendar export: today's planned blocks as timed events + open tasks with due date as all-day events. */
export function buildIcs(tasks: Task[], plan: Block[], day = new Date()): string {
	const now = stamp(new Date());
	const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//StackDO//DE', 'CALSCALE:GREGORIAN'];
	for (const b of plan) {
		lines.push(
			'BEGIN:VEVENT',
			`UID:plan-${b.taskId}-${b.start}@stackdo`,
			`DTSTAMP:${now}`,
			`DTSTART:${stamp(atMinute(day, b.start))}`,
			`DTEND:${stamp(atMinute(day, b.end))}`,
			`SUMMARY:${esc(b.label)}`,
			'END:VEVENT'
		);
	}
	for (const t of tasks) {
		if (t.completedAt || !t.dueDate) continue;
		lines.push(
			'BEGIN:VEVENT',
			`UID:due-${t.id}@stackdo`,
			`DTSTAMP:${now}`,
			`DTSTART;VALUE=DATE:${dateOnly(t.dueDate)}`,
			`SUMMARY:${esc('☐ ' + t.title)}`,
			...(t.notes ? [`DESCRIPTION:${esc(t.notes)}`] : []),
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.join('\r\n');
}

export function download(filename: string, content: string, type: string) {
	const url = URL.createObjectURL(new Blob([content], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
