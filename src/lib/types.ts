export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Location = 'anywhere' | 'work' | 'home' | 'garden' | 'errands';
export type EisenhowerQuadrant = 'q1' | 'q2' | 'q3' | 'q4'; // q1=urgent+important, q2=important, q3=urgent, q4=neither
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
export type AnimationType = 'confetti' | 'explosion' | 'snippets' | 'fireworks' | 'stars';

export interface Task {
	id: string;
	title: string;
	description?: string;
	priority: Priority;
	location: Location;
	quadrant: EisenhowerQuadrant;
	tags: string[];
	project?: string;
	category?: string;
	color?: string;
	dueDate?: string; // ISO date string
	estimatedMinutes: number;
	recurrence: RecurrenceType;
	createdAt: string;
	completedAt?: string;
	snoozedUntil?: string; // ISO datetime string
	skippedUntil?: string; // ISO datetime string
	completed: boolean;
	score?: number;
	// Season preferences
	preferredSeasons?: ('spring' | 'summer' | 'autumn' | 'winter')[];
	// Time-of-day preferences
	preferredTimeOfDay?: ('morning' | 'afternoon' | 'evening')[];
}

export interface UserContext {
	currentLocation: Location;
	currentTime: Date;
}

export const TAG_PRESETS = ['mail', 'write', 'design', 'code', 'call', 'plan', 'research', 'review', 'clean', 'fix', 'buy', 'cook'] as const;

export const PRIORITY_LABELS: Record<Priority, string> = {
	low: 'Niedrig',
	medium: 'Mittel',
	high: 'Hoch',
	urgent: 'Dringend'
};

export const LOCATION_LABELS: Record<Location, string> = {
	anywhere: 'Überall',
	work: 'Arbeit',
	home: 'Zuhause',
	garden: 'Garten',
	errands: 'Unterwegs'
};

export const QUADRANT_LABELS: Record<EisenhowerQuadrant, string> = {
	q1: 'Dringend & Wichtig',
	q2: 'Wichtig',
	q3: 'Dringend',
	q4: 'Weder noch'
};

export const QUADRANT_COLORS: Record<EisenhowerQuadrant, string> = {
	q1: '#EF476F', // red-pink
	q2: '#06D6A0', // green
	q3: '#FFD166', // yellow
	q4: '#118AB2'  // blue
};
