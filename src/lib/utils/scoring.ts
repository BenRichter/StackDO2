import type { Task, UserContext } from '$lib/types';

function getSeason(date: Date): 'spring' | 'summer' | 'autumn' | 'winter' {
	const month = date.getMonth();
	if (month >= 2 && month <= 4) return 'spring';
	if (month >= 5 && month <= 7) return 'summer';
	if (month >= 8 && month <= 10) return 'autumn';
	return 'winter';
}

function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' {
	const hour = date.getHours();
	if (hour >= 6 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 18) return 'afternoon';
	return 'evening';
}

function daysBetween(a: Date, b: Date): number {
	const msPerDay = 86400000;
	const aDay = new Date(a.getFullYear(), a.getMonth(), a.getDate());
	const bDay = new Date(b.getFullYear(), b.getMonth(), b.getDate());
	return Math.round((bDay.getTime() - aDay.getTime()) / msPerDay);
}

export function calculateScore(task: Task, ctx: UserContext): number {
	let score = 0;
	const now = ctx.currentTime;

	// Priority scoring
	switch (task.priority) {
		case 'urgent': score += 45; break;
		case 'high': score += 40; break;
		case 'medium': score += 20; break;
		case 'low': score += 5; break;
	}

	// Due date scoring
	if (task.dueDate) {
		const due = new Date(task.dueDate);
		const daysUntilDue = daysBetween(now, due);

		if (daysUntilDue < 0) {
			score += 50; // overdue
		} else if (daysUntilDue === 0) {
			score += 45; // due today
		} else if (daysUntilDue === 1) {
			score += 35; // due tomorrow
		} else if (daysUntilDue <= 3) {
			score += 25;
		} else if (daysUntilDue <= 7) {
			score += 15;
		}
	}

	// Eisenhower quadrant
	switch (task.quadrant) {
		case 'q1': score += 20; break;
		case 'q2': score += 10; break;
		case 'q3': score += 8; break;
		case 'q4': score += 0; break;
	}

	// Time-of-day + complexity bonus (Eat That Frog logic)
	const hour = now.getHours();
	if (hour >= 8 && hour < 12 && task.estimatedMinutes > 60) {
		score += 15; // complex tasks in the morning
	}
	if (hour >= 14 && hour < 16 && task.estimatedMinutes <= 30) {
		score += 10; // short tasks in the afternoon dip
	}
	if (hour >= 18 && task.estimatedMinutes <= 15) {
		score += 8; // very short tasks in the evening
	}

	// Preferred time-of-day match
	const timeOfDay = getTimeOfDay(now);
	if (task.preferredTimeOfDay?.includes(timeOfDay)) {
		score += 10;
	}

	// Season match
	const season = getSeason(now);
	if (task.preferredSeasons?.includes(season)) {
		score += 5;
	}

	// Location match bonus
	if (task.location === ctx.currentLocation) {
		score += 12;
	} else if (task.location === 'anywhere') {
		score += 6;
	}

	return score;
}

export function filterAndScoreTasks(tasks: Task[], ctx: UserContext): Task[] {
	const now = ctx.currentTime;

	return tasks
		.filter((t) => {
			if (t.completed) return false;
			// Filter snoozed
			if (t.snoozedUntil && new Date(t.snoozedUntil) > now) return false;
			// Filter skipped
			if (t.skippedUntil && new Date(t.skippedUntil) > now) return false;
			// Filter by location: show 'anywhere' tasks + matching location
			if (t.location !== 'anywhere' && t.location !== ctx.currentLocation) return false;
			return true;
		})
		.map((t) => ({ ...t, score: calculateScore(t, ctx) }))
		.sort((a, b) => (a.score ?? 0) - (b.score ?? 0)); // ascending: lowest score first, highest at bottom
}
