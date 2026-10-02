/** Local-time date helpers. Everything user-facing is local (Europe/Berlin etc.), never UTC. */

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string, time = '00:00'): Date {
	const [y, m, d] = key.split('-').map(Number);
	const [h, min] = time.split(':').map(Number);
	return new Date(y, m - 1, d, h || 0, min || 0);
}

export function addDays(d: Date, days: number): Date {
	const r = new Date(d);
	r.setDate(r.getDate() + days);
	return r;
}

/** Whole calendar days from a to b (b - a). */
export function daysBetween(a: Date, b: Date): number {
	const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
	const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate());
	return Math.round((bDay.getTime() - aDay.getTime()) / 86400000);
}

/** "HH:MM" -> minutes since midnight */
export function hmToMin(hm: string): number {
	const [h, m] = hm.split(':').map(Number);
	return (h || 0) * 60 + (m || 0);
}

export function minToHm(min: number): string {
	const m = ((Math.round(min) % 1440) + 1440) % 1440;
	return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function minutesOfDay(d: Date): number {
	return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function atMinute(day: Date, min: number): Date {
	return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, min);
}

export function fmtDuration(min: number): string {
	min = Math.round(min);
	if (min < 60) return `${min} min`;
	const h = Math.floor(min / 60);
	const m = min % 60;
	return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtClock(ms: number): string {
	const neg = ms < 0;
	const s = Math.floor(Math.abs(ms) / 1000);
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	const body = h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
	return neg ? `-${body}` : body;
}

export function relativeDue(dueDate: string, now = new Date()): string {
	const diff = daysBetween(now, parseDateKey(dueDate));
	if (diff < -1) return `${-diff} Tage überfällig`;
	if (diff === -1) return 'gestern fällig';
	if (diff === 0) return 'heute';
	if (diff === 1) return 'morgen';
	if (diff < 7) return parseDateKey(dueDate).toLocaleDateString('de-DE', { weekday: 'long' });
	return parseDateKey(dueDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

/** Minutes logged in the given entries, open entries counted until `now`. */
export function loggedMinutes(entries: { start: string; end?: string }[], now = new Date()): number {
	let ms = 0;
	for (const e of entries) {
		const end = e.end ? new Date(e.end) : now;
		ms += end.getTime() - new Date(e.start).getTime();
	}
	return ms / 60000;
}
