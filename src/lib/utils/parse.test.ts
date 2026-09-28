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
