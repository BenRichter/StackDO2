import type { Recurrence, Thread } from '$lib/types';
import { addDays, dateKey } from './time';

export interface QuickParse {
	title: string;
	tags: string[];
	importance?: number;
	estimate?: number;
	dueDate?: string;
	dueTime?: string;
	threadId?: string;
	recurrence?: Recurrence;
	/** park it in "Irgendwann" instead of the stack */
	someday?: boolean;
}

// Word boundaries that understand umlauts (\b doesn't)
const B = '(?<![\\p{L}\\d])';
const E = '(?![\\p{L}\\d])';
const DAY = 'montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so';
const DAY_INDEX: Record<string, number> = { so: 0, mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6 };
const NUM: Record<string, number> = {
	ein: 1, eine: 1, einem: 1, einer: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10
};
const NUM_RE = Object.keys(NUM).join('|');

const re = (src: string) => new RegExp(src, 'iu');
const dayIndex = (word: string) => DAY_INDEX[word.toLowerCase().slice(0, 2)];
const toNum = (s: string) => NUM[s.toLowerCase()] ?? Number(s.replace(',', '.'));

/** Next given weekday; `includeToday` for "jeden Mo" (today counts), not for "mo" (= the coming one). */
function nextWeekday(now: Date, day: number, includeToday: boolean): string {
	const diff = (day - now.getDay() + 7) % 7;
	return dateKey(addDays(now, diff === 0 && !includeToday ? 7 : diff));
}

function relativeDay(word: string, now: Date): string | undefined {
	const w = word.toLowerCase();
	if (w === 'heute') return dateKey(now);
	if (w === 'morgen') return dateKey(addDays(now, 1));
	if (w === 'übermorgen') return dateKey(addDays(now, 2));
	const idx = dayIndex(w);
	return idx === undefined ? undefined : nextWeekday(now, idx, false);
}

type Rule = { re: RegExp; apply: (m: RegExpMatchArray, out: QuickParse, now: Date) => boolean | void };

/** Multi-word natural language, matched before the single-token pass. Returning false keeps the text. */
const RULES: Rule[] = [
	// jeden Tag / jeden Mo / jede Woche / alle Werktage …
	{
		re: re(`${B}(?:jede[nrs]?|alle)\\s+(tag|werktag|woche|monat|${DAY})\\.?${E}`),
		apply: (m, out, now) => {
			const w = m[1].toLowerCase();
			if (w === 'tag') out.recurrence = 'daily';
			else if (w === 'werktag') out.recurrence = 'weekdays';
			else if (w === 'woche') out.recurrence = 'weekly';
			else if (w === 'monat') out.recurrence = 'monthly';
			else {
				out.recurrence = 'weekly';
				out.dueDate = nextWeekday(now, dayIndex(w), true);
			}
		}
	},
	{
		re: re(`${B}(täglich|werktags|wöchentlich|monatlich)${E}`),
		apply: (m, out) => {
			out.recurrence = ({ täglich: 'daily', werktags: 'weekdays', wöchentlich: 'weekly', monatlich: 'monthly' } as const)[
				m[1].toLowerCase() as 'täglich'
			];
		}
	},
	// in 3 Tagen / in zwei Wochen / in einem Monat
	{
		re: re(`${B}in\\s+(\\d+|${NUM_RE})\\s+(tag|tage|tagen|woche|wochen|monat|monaten)${E}`),
		apply: (m, out, now) => {
			const n = toNum(m[1]);
			const unit = m[2].toLowerCase();
			out.dueDate = unit.startsWith('tag')
				? dateKey(addDays(now, n))
				: unit.startsWith('woche')
					? dateKey(addDays(now, n * 7))
					: dateKey(new Date(now.getFullYear(), now.getMonth() + n, now.getDate()));
		}
	},
	// nächste Woche / nächsten Monat / nächsten Freitag
	{
		re: re(`${B}(?:(?:am|bis|ab)\\s+)?(?:nächste[nrs]?|kommende[nrs]?)\\s+(woche|monat|${DAY})\\.?${E}`),
		apply: (m, out, now) => {
			const w = m[1].toLowerCase();
			if (w === 'woche') out.dueDate = nextWeekday(now, 1, false);
			else if (w === 'monat') out.dueDate = dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 1));
			else out.dueDate = nextWeekday(now, dayIndex(w), false);
		}
	},
	// am 12.10. / 12.10.2026 / bis 3.11.
	{
		re: re(`${B}(?:(?:am|bis|ab)\\s+)?(\\d{1,2})\\.(\\d{1,2})\\.(\\d{4}|\\d{2})?(?!\\d)`),
		apply: (m, out, now) => {
			const day = Number(m[1]);
			const month = Number(m[2]);
			if (day < 1 || day > 31 || month < 1 || month > 12) return false;
			let year = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : now.getFullYear();
			let d = new Date(year, month - 1, day);
			if (!m[3] && dateKey(d) < dateKey(now)) d = new Date(++year, month - 1, day);
			out.dueDate = dateKey(d);
		}
	},
	// am Freitag / bis morgen / ab Mo
	{
		re: re(`${B}(?:am|bis|ab)\\s+(heute|morgen|übermorgen|${DAY})\\.?${E}`),
		apply: (m, out, now) => {
			out.dueDate = relativeDay(m[1], now);
		}
	},
	// 14 Uhr / um 9 / um 14:30 / 7:15 Uhr
	{
		re: re(`${B}(?:(?:um|ab|bis)\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*uhr${E}`),
		apply: (m, out) => setTime(m, out)
	},
	{
		re: re(`${B}um\\s+(\\d{1,2})(?::(\\d{2}))?${E}`),
		apply: (m, out) => setTime(m, out)
	},
	// 30 min / 1,5 std / 2 stunden / halbe Stunde
	{
		re: re(`${B}(\\d+(?:[.,]\\d+)?)\\s*(min|minute|minuten)${E}`),
		apply: (m, out) => {
			out.estimate = Math.round(toNum(m[1]));
		}
	},
	{
		re: re(`${B}(\\d+(?:[.,]\\d+)?|eine|einer)\\s*(std|stunde|stunden)${E}`),
		apply: (m, out) => {
			out.estimate = Math.round(toNum(m[1]) * 60);
		}
	},
	{
		re: re(`${B}(halbe stunde|viertelstunde)${E}`),
		apply: (m, out) => {
			out.estimate = m[1].toLowerCase().startsWith('halbe') ? 30 : 15;
		}
	},
	{
		re: re(`${B}(irgendwann|someday|inbox)${E}`),
		apply: (_m, out) => {
			out.someday = true;
		}
	}
];

function setTime(m: RegExpMatchArray, out: QuickParse): boolean {
	const h = Number(m[1]);
	const min = m[2] ? Number(m[2]) : 0;
	if (h > 23 || min > 59) return false;
	out.dueTime = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
	return true;
}

/**
 * Quick-add in plain German, e.g. "Angebot an Tom #mail !4 30 min nächsten Freitag 14 Uhr +Arbeit".
 *  Tokens: #tag · !1–!5 · 30m / 1.5h / 1h30 · heute / morgen / übermorgen / mo…sa · 14:00 · +Strang
 *  Phrases: jeden Mo / jeden Tag / täglich · in 3 Tagen · nächste Woche · am 12.10. · bis Freitag · um 9 / 14 Uhr ·
 *           30 min / 2 Stunden / halbe Stunde · irgendwann
 */
export function parseQuick(input: string, threads: Thread[], now = new Date()): QuickParse {
	const out: QuickParse = { title: '', tags: [] };
	let rest = ` ${input.trim()} `;

	for (const rule of RULES) {
		const m = rest.match(rule.re);
		if (m && m.index !== undefined && rule.apply(m, out, now) !== false) {
			rest = rest.slice(0, m.index) + ' ' + rest.slice(m.index + m[0].length);
		}
	}

	const words: string[] = [];
	for (const raw of rest.trim().split(/\s+/)) {
		const w = raw.toLowerCase();
		let m: RegExpMatchArray | null;
		if (!raw) continue;
		if ((m = raw.match(/^#([\p{L}\d_-]+)$/u))) out.tags.push(m[1].toLowerCase());
		else if ((m = w.match(/^!([1-5])$/))) out.importance = Number(m[1]);
		else if ((m = w.match(/^(\d+(?:[.,]\d+)?)h(?:(\d+)m?)?$/)))
			out.estimate = Math.round(parseFloat(m[1].replace(',', '.')) * 60 + (m[2] ? Number(m[2]) : 0));
		else if ((m = w.match(/^(\d+)(m|min)$/))) out.estimate = Number(m[1]);
		else if ((m = w.match(/^([01]?\d|2[0-3]):([0-5]\d)$/))) out.dueTime = `${m[1].padStart(2, '0')}:${m[2]}`;
		// "so" and "do" are everyday words – only as weekday with am/bis/ab/jeden (handled above)
		else if (/^(heute|morgen|übermorgen|mo|di|mi|fr|sa|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)$/.test(w))
			out.dueDate = relativeDay(w, now);
		else if (raw.startsWith('+') && raw.length > 1) {
			const q = raw.slice(1).toLowerCase();
			const th = threads.find((t) => !t.archived && t.name.toLowerCase().startsWith(q));
			if (th) out.threadId = th.id;
			else words.push(raw);
		} else words.push(raw);
	}
	out.title = words.join(' ').replace(/\s+(am|bis|um|ab|in)$/i, '').trim();
	return out;
}
