/** A "Strang" (thread): a life area / project that tasks hang on. Rank = relative priority (0 = top). */
export interface Thread {
	id: string;
	name: string;
	color: string;
	rank: number;
	/** Blocker window, e.g. work 08:00–17:00. Tasks of this thread are only available inside it. */
	window?: { from: string; to: string; days: number[] };
	archived?: boolean;
}

export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface TimeEntry {
	start: string; // ISO
	end?: string; // ISO, open while running
}

export interface PushEntry {
	at: string; // ISO
	until: string; // ISO
	reason?: string;
}

export interface Task {
	id: string;
	title: string;
	notes?: string;
	threadId: string;
	tags: string[];
	/** 1–5, 5 = most important (Eisenhower "wichtig") */
	importance: number;
	/** YYYY-MM-DD local (Eisenhower "dringend") */
	dueDate?: string;
	/** HH:MM local; for recurring habits = time it becomes available */
	dueTime?: string;
	/** estimated minutes */
	estimate: number;
	recurrence: Recurrence;
	createdAt: string;
	completedAt?: string;
	/** real minutes, confirmed after done */
	actual?: number;
	timeLog: TimeEntry[];
	pushedUntil?: string;
	pushHistory: PushEntry[];
	followUpOf?: string;
	tutorial?: boolean;
}

/** Compact record of a finished task. Survives the 30-day cleanup; feeds stats + estimate predictions. */
export interface HistoryEntry {
	taskId: string;
	title: string;
	threadId: string;
	tags: string[];
	estimate: number;
	actual: number;
	completedAt: string;
}

export interface Settings {
	workHours: number;
	dayStart: string;
	dayEnd: string;
	leftHanded: boolean;
	animations: boolean;
	quotes: boolean;
	hideRecurring: boolean;
	cleanupDays: number;
	lastThreadId?: string;
}

export interface RunningTimer {
	taskId: string;
	start: string;
}

export interface AppData {
	version: 2;
	threads: Thread[];
	tasks: Task[];
	history: HistoryEntry[];
	settings: Settings;
	timer?: RunningTimer;
}

export const DEFAULT_SETTINGS: Settings = {
	workHours: 8,
	dayStart: '07:00',
	dayEnd: '22:00',
	leftHanded: false,
	animations: true,
	quotes: true,
	hideRecurring: false,
	cleanupDays: 30
};

export const THREAD_COLORS = [
	'#2271b1',
	'#00a32a',
	'#d63638',
	'#dba617',
	'#8c5fd1',
	'#e26f1f',
	'#0e9aa7',
	'#c9356e'
];

export const TAG_PRESETS = ['mail', 'call', 'write', 'design', 'code', 'plan', 'buy', 'clean', 'cook', 'read'];

export const ESTIMATE_PRESETS = [5, 15, 30, 60, 90, 120];

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
	none: 'Einmalig',
	daily: 'Täglich',
	weekdays: 'Werktags',
	weekly: 'Wöchentlich',
	monthly: 'Monatlich'
};

/** Above this estimate the app suggests babysteps. */
export const BABYSTEP_LIMIT = 120;
