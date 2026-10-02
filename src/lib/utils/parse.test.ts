import { describe, expect, it } from 'vitest';
import { parseQuick } from './parse';

const threads = [
	{ id: 'w', name: 'Arbeit', color: '#000', rank: 0 },
	{ id: 'f', name: 'Familie', color: '#000', rank: 1 }
];
const monday = new Date(2026, 8, 28, 10, 0);

describe('parseQuick', () => {
	it('parses all tokens', () => {
		const p = parseQuick('Angebot an Tom #mail !4 30m morgen 14:00 +arb', threads, monday);
		expect(p).toEqual({
			title: 'Angebot an Tom',
			tags: ['mail'],
			importance: 4,
			estimate: 30,
			dueDate: '2026-09-29',
			dueTime: '14:00',
			threadId: 'w'
		});
	});

	it('handles hours and weekdays', () => {
		expect(parseQuick('x 1.5h', threads, monday).estimate).toBe(90);
		expect(parseQuick('x 1h30', threads, monday).estimate).toBe(90);
		expect(parseQuick('x 2h', threads, monday).estimate).toBe(120);
		expect(parseQuick('x fr', threads, monday).dueDate).toBe('2026-10-02');
		expect(parseQuick('x mo', threads, monday).dueDate).toBe('2026-10-05'); // next Monday, not today
	});

	it('keeps unknown +words and plain text', () => {
		const p = parseQuick('C++ lernen +xyz', threads, monday);
		expect(p.title).toBe('C++ lernen +xyz');
		expect(p.threadId).toBeUndefined();
	});
});

describe('natural language', () => {
	const p = (s: string) => parseQuick(s, threads, monday); // Monday 28 Sep 2026, 10:00

	it('recurrence: jeden Mo / jeden Tag / täglich / jede Woche', () => {
		expect(p('Wochenplanung jeden Mo')).toMatchObject({ title: 'Wochenplanung', recurrence: 'weekly', dueDate: '2026-09-28' });
		expect(p('Gießen jeden Freitag')).toMatchObject({ recurrence: 'weekly', dueDate: '2026-10-02' });
		expect(p('Zähne jeden Tag um 7')).toMatchObject({ title: 'Zähne', recurrence: 'daily', dueTime: '07:00' });
		expect(p('Meditieren täglich')).toMatchObject({ title: 'Meditieren', recurrence: 'daily' });
		expect(p('Mails jeden Werktag')).toMatchObject({ recurrence: 'weekdays' });
		expect(p('Miete jeden Monat')).toMatchObject({ recurrence: 'monthly' });
	});

	it('relative dates: in 3 Tagen / in zwei Wochen / nächste Woche / nächsten Freitag', () => {
		expect(p('Paket in 3 Tagen')).toMatchObject({ title: 'Paket', dueDate: '2026-10-01' });
		expect(p('Review in zwei Wochen')).toMatchObject({ dueDate: '2026-10-12' });
		expect(p('Steuer in einem Monat')).toMatchObject({ dueDate: '2026-10-28' });
		expect(p('Planung nächste Woche')).toMatchObject({ title: 'Planung', dueDate: '2026-10-05' });
		expect(p('Party nächsten Freitag')).toMatchObject({ dueDate: '2026-10-02' });
		expect(p('Abrechnung nächsten Monat')).toMatchObject({ dueDate: '2026-10-01' });
	});

	it('explicit dates and prepositions: am 12.10. / bis Freitag / bis morgen', () => {
		expect(p('Zahnarzt am 12.10.')).toMatchObject({ title: 'Zahnarzt', dueDate: '2026-10-12' });
		expect(p('Urlaub 3.1.')).toMatchObject({ dueDate: '2027-01-03' }); // already past → next year
		expect(p('Vertrag 15.11.2027')).toMatchObject({ dueDate: '2027-11-15' });
		expect(p('Bericht bis Freitag')).toMatchObject({ title: 'Bericht', dueDate: '2026-10-02' });
		expect(p('Angebot bis morgen')).toMatchObject({ title: 'Angebot', dueDate: '2026-09-29' });
		expect(p('Kino am So')).toMatchObject({ title: 'Kino', dueDate: '2026-10-04' });
	});

	it('times and durations in words', () => {
		expect(p('Call um 14:30')).toMatchObject({ title: 'Call', dueTime: '14:30' });
		expect(p('Call 9 Uhr')).toMatchObject({ dueTime: '09:00' });
		expect(p('Lesen 30 min')).toMatchObject({ title: 'Lesen', estimate: 30 });
		expect(p('Aufräumen 1,5 Std')).toMatchObject({ estimate: 90 });
		expect(p('Sport eine Stunde')).toMatchObject({ title: 'Sport', estimate: 60 });
		expect(p('Mail halbe Stunde')).toMatchObject({ estimate: 30 });
	});

	it('irgendwann parks the task', () => {
		expect(p('Spanisch lernen irgendwann')).toMatchObject({ title: 'Spanisch lernen', someday: true });
	});

	it('keeps everyday words that look like weekdays', () => {
		expect(p('Mach das so')).toMatchObject({ title: 'Mach das so' });
		expect(p('Todo do it')).toMatchObject({ title: 'Todo do it' });
		expect(p('Mach das so').dueDate).toBeUndefined();
		expect(p('Kosten 12.5 Euro').dueDate).toBeUndefined();
	});

	it('combines everything', () => {
		expect(p('Angebot an Tom #mail !4 30 min nächsten Freitag 14 Uhr +arb')).toEqual({
			title: 'Angebot an Tom',
			tags: ['mail'],
			importance: 4,
			estimate: 30,
			dueDate: '2026-10-02',
			dueTime: '14:00',
			threadId: 'w'
		});
	});
});
