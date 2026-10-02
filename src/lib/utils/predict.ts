import type { HistoryEntry } from '$lib/types';

const STOP = new Set(['und', 'oder', 'der', 'die', 'das', 'mit', 'für', 'von', 'the', 'and', 'for', 'follow', 'up']);

export function keywords(title: string): string[] {
	return title
		.toLowerCase()
		.split(/[^\p{L}\d]+/u)
		.filter((w) => w.length >= 3 && !STOP.has(w));
}

function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	const mid = Math.floor(s.length / 2);
	return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface Prediction {
	minutes: number;
	basis: number; // how many similar tasks
}

/** Realistic duration from similar finished tasks (shared keywords, else shared tags). */
export function predictDuration(title: string, tags: string[], history: HistoryEntry[]): Prediction | null {
	const kw = keywords(title);
	let similar = kw.length ? history.filter((h) => keywords(h.title).some((k) => kw.includes(k))) : [];
	if (!similar.length && tags.length) similar = history.filter((h) => h.tags.some((t) => tags.includes(t)));
	if (!similar.length) return null;
	return { minutes: Math.max(5, Math.round(median(similar.map((h) => h.actual)) / 5) * 5), basis: similar.length };
}

/** actual / estimate over all history. 1.3 = you need 30% longer than you think. */
export function estimationFactor(history: HistoryEntry[]): number | null {
	const valid = history.filter((h) => h.estimate > 0 && h.actual > 0);
	if (valid.length < 3) return null;
	return median(valid.map((h) => h.actual / h.estimate));
}
