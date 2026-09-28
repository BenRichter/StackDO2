import type { Thread } from '$lib/types';
import { addDays, dateKey } from './time';

export interface QuickParse {
	title: string;
	tags: string[];
	importance?: number;
	estimate?: number;
	dueDate?: string;
	dueTime?: string;
	threadId?: string;
}

const WEEKDAYS = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];

/**
 * Quick-add syntax, e.g. "Angebot an Tom #mail !4 30m morgen +Arbeit".
 *  #tag · !1–!5 importance · 30m / 1.5h / 1h30 estimate · heute/morgen/übermorgen/mo…so date · 14:00 time · +Strang
 */
export function parseQuick(input: string, threads: Thread[], now = new Date()): QuickParse {
	const out: QuickParse = { title: '', tags: [] };
	const words: string[] = [];

	for (const raw of input.trim().split(/\s+/)) {
		const w = raw.toLowerCase();
		let m: RegExpMatchArray | null;
		if (!raw) continue;
		if ((m = raw.match(/^#([\p{L}\d_-]+)$/u))) out.tags.push(m[1].toLowerCase());
		else if ((m = w.match(/^!([1-5])$/))) out.importance = Number(m[1]);
		else if ((m = w.match(/^(\d+(?:[.,]\d+)?)h(?:(\d+)m?)?$/)))
			out.estimate = Math.round(parseFloat(m[1].replace(',', '.')) * 60 + (m[2] ? Number(m[2]) : 0));
		else if ((m = w.match(/^(\d+)(m|min)$/))) out.estimate = Number(m[1]);
		else if ((m = w.match(/^([01]?\d|2[0-3]):([0-5]\d)$/))) out.dueTime = `${m[1].padStart(2, '0')}:${m[2]}`;
		else if (w === 'heute') out.dueDate = dateKey(now);
		else if (w === 'morgen') out.dueDate = dateKey(addDays(now, 1));
		else if (w === 'übermorgen') out.dueDate = dateKey(addDays(now, 2));
		else if (WEEKDAYS.includes(w)) {
			const diff = (WEEKDAYS.indexOf(w) - now.getDay() + 7) % 7 || 7;
			out.dueDate = dateKey(addDays(now, diff));
		} else if (raw.startsWith('+') && raw.length > 1) {
			const q = raw.slice(1).toLowerCase();
			const th = threads.find((t) => !t.archived && t.name.toLowerCase().startsWith(q));
			if (th) out.threadId = th.id;
			else words.push(raw);
		} else words.push(raw);
	}
	out.title = words.join(' ');
	return out;
}
