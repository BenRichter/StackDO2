import { describe, expect, it } from 'vitest';
import type { HistoryEntry } from '$lib/types';
import { estimationFactor, predictDuration } from './predict';

const h = (title: string, estimate: number, actual: number, tags: string[] = []): HistoryEntry => ({
	taskId: title,
	title,
	threadId: 'a',
	tags,
	estimate,
	actual,
	completedAt: '2026-09-01T10:00:00Z'
});

describe('predict', () => {
	const history = [h('Rechnung schreiben', 15, 30), h('Rechnung prüfen', 10, 20), h('Mail an Anna', 5, 10, ['mail'])];

	it('predicts from shared keywords', () => {
		expect(predictDuration('Rechnung Müller', [], history)).toEqual({ minutes: 25, basis: 2 });
	});

	it('falls back to tags', () => {
		expect(predictDuration('Newsletter', ['mail'], history)).toEqual({ minutes: 10, basis: 1 });
		expect(predictDuration('Newsletter', [], history)).toBeNull();
	});

	it('computes the estimation factor', () => {
		expect(estimationFactor(history)).toBe(2);
		expect(estimationFactor(history.slice(0, 2))).toBeNull();
	});
});
