import type { Task, Location, UserContext } from '$lib/types';
import { filterAndScoreTasks } from '$lib/utils/scoring';

const STORAGE_KEY = 'stackdo2-tasks';
const LOCATION_KEY = 'stackdo2-location';

function loadTasks(): Task[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return getSampleTasks();
	try {
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

function saveTasks(tasks: Task[]) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadLocation(): Location {
	if (typeof localStorage === 'undefined') return 'home';
	return (localStorage.getItem(LOCATION_KEY) as Location) || 'home';
}

function generateId(): string {
	return crypto.randomUUID();
}

function getSampleTasks(): Task[] {
	const today = new Date().toISOString().split('T')[0];
	const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
	const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

	return [
		{
			id: generateId(), title: 'E-Mails beantworten', priority: 'high', location: 'work',
			quadrant: 'q1', tags: ['mail'], project: 'Kommunikation', category: 'Büro',
			dueDate: today, estimatedMinutes: 30, recurrence: 'daily',
			createdAt: new Date().toISOString(), completed: false,
			preferredTimeOfDay: ['morning']
		},
		{
			id: generateId(), title: 'Projektpräsentation erstellen', priority: 'high', location: 'work',
			quadrant: 'q2', tags: ['design', 'write'], project: 'Q1 Report', category: 'Büro',
			dueDate: tomorrow, estimatedMinutes: 120, recurrence: 'none',
			createdAt: new Date().toISOString(), completed: false,
			preferredTimeOfDay: ['morning']
		},
		{
			id: generateId(), title: 'Rasen mähen', priority: 'medium', location: 'garden',
			quadrant: 'q3', tags: ['clean'], category: 'Haushalt',
			estimatedMinutes: 45, recurrence: 'weekly',
			createdAt: new Date().toISOString(), completed: false,
			preferredSeasons: ['spring', 'summer'],
			preferredTimeOfDay: ['morning', 'afternoon']
		},
		{
			id: generateId(), title: 'Einkaufsliste schreiben', priority: 'medium', location: 'home',
			quadrant: 'q3', tags: ['write', 'plan'], category: 'Haushalt',
			dueDate: today, estimatedMinutes: 10, recurrence: 'weekly',
			createdAt: new Date().toISOString(), completed: false,
			preferredTimeOfDay: ['evening']
		},
		{
			id: generateId(), title: 'Code Review für Feature Branch', priority: 'high', location: 'work',
			quadrant: 'q1', tags: ['code', 'review'], project: 'App Relaunch', category: 'Entwicklung',
			dueDate: today, estimatedMinutes: 60, recurrence: 'none',
			createdAt: new Date().toISOString(), completed: false,
			preferredTimeOfDay: ['morning', 'afternoon']
		},
		{
			id: generateId(), title: 'Blumen gießen', priority: 'low', location: 'garden',
			quadrant: 'q4', tags: ['clean'], category: 'Haushalt',
			estimatedMinutes: 10, recurrence: 'daily',
			createdAt: new Date().toISOString(), completed: false,
			preferredSeasons: ['summer'],
			preferredTimeOfDay: ['morning', 'evening']
		},
		{
			id: generateId(), title: 'Wochenplanung erstellen', priority: 'medium', location: 'anywhere',
			quadrant: 'q2', tags: ['plan', 'write'], category: 'Produktivität',
			dueDate: nextWeek, estimatedMinutes: 20, recurrence: 'weekly',
			createdAt: new Date().toISOString(), completed: false,
			preferredTimeOfDay: ['morning']
		},
		{
			id: generateId(), title: 'Küche aufräumen', priority: 'low', location: 'home',
			quadrant: 'q4', tags: ['clean'], category: 'Haushalt',
			estimatedMinutes: 25, recurrence: 'daily',
			createdAt: new Date().toISOString(), completed: false,
			preferredTimeOfDay: ['evening']
		}
	];
}

class TaskStore {
	tasks = $state<Task[]>([]);
	currentLocation = $state<Location>('home');
	completedAnimation = $state<string | null>(null);

	constructor() {
		if (typeof window !== 'undefined') {
			this.tasks = loadTasks();
			this.currentLocation = loadLocation();
		}
	}

	get context(): UserContext {
		return {
			currentLocation: this.currentLocation,
			currentTime: new Date()
		};
	}

	get scoredTasks(): Task[] {
		return filterAndScoreTasks(this.tasks, this.context);
	}

	get currentTask(): Task | null {
		const scored = this.scoredTasks;
		return scored.length > 0 ? scored[scored.length - 1] : null;
	}

	get completedToday(): number {
		const today = new Date().toISOString().split('T')[0];
		return this.tasks.filter((t) => t.completedAt?.startsWith(today)).length;
	}

	get totalActive(): number {
		return this.tasks.filter((t) => !t.completed).length;
	}

	get projectGroups(): Record<string, Task[]> {
		const groups: Record<string, Task[]> = {};
		for (const t of this.scoredTasks) {
			const key = t.project || 'Ohne Projekt';
			if (!groups[key]) groups[key] = [];
			groups[key].push(t);
		}
		return groups;
	}

	get categoryGroups(): Record<string, Task[]> {
		const groups: Record<string, Task[]> = {};
		for (const t of this.scoredTasks) {
			const key = t.category || 'Ohne Kategorie';
			if (!groups[key]) groups[key] = [];
			groups[key].push(t);
		}
		return groups;
	}

	get tagGroups(): Record<string, Task[]> {
		const groups: Record<string, Task[]> = {};
		for (const t of this.scoredTasks) {
			for (const tag of t.tags) {
				if (!groups[tag]) groups[tag] = [];
				groups[tag].push(t);
			}
		}
		return groups;
	}

	setLocation(loc: Location) {
		this.currentLocation = loc;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(LOCATION_KEY, loc);
		}
	}

	addTask(task: Omit<Task, 'id' | 'createdAt' | 'completed'>) {
		const newTask: Task = {
			...task,
			id: generateId(),
			createdAt: new Date().toISOString(),
			completed: false
		};
		this.tasks = [...this.tasks, newTask];
		saveTasks(this.tasks);
	}

	completeTask(id: string) {
		const task = this.tasks.find((t) => t.id === id);
		if (!task) return;

		// Handle recurring tasks
		if (task.recurrence !== 'none') {
			const nextDue = this.getNextRecurrence(task);
			const newTask: Task = {
				...task,
				id: generateId(),
				dueDate: nextDue,
				completed: false,
				completedAt: undefined,
				snoozedUntil: undefined,
				skippedUntil: undefined,
				createdAt: new Date().toISOString()
			};
			this.tasks = [
				...this.tasks.map((t) =>
					t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
				),
				newTask
			];
		} else {
			this.tasks = this.tasks.map((t) =>
				t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
			);
		}
		saveTasks(this.tasks);
	}

	snoozeTask(id: string, minutes: number = 60) {
		const until = new Date(Date.now() + minutes * 60000).toISOString();
		this.tasks = this.tasks.map((t) =>
			t.id === id ? { ...t, snoozedUntil: until } : t
		);
		saveTasks(this.tasks);
	}

	skipTask(id: string, minutes: number = 5) {
		const until = new Date(Date.now() + minutes * 60000).toISOString();
		this.tasks = this.tasks.map((t) =>
			t.id === id ? { ...t, skippedUntil: until } : t
		);
		saveTasks(this.tasks);
	}

	deleteTask(id: string) {
		this.tasks = this.tasks.filter((t) => t.id !== id);
		saveTasks(this.tasks);
	}

	updateTask(id: string, updates: Partial<Task>) {
		this.tasks = this.tasks.map((t) =>
			t.id === id ? { ...t, ...updates } : t
		);
		saveTasks(this.tasks);
	}

	private getNextRecurrence(task: Task): string | undefined {
		if (!task.dueDate) return undefined;
		const due = new Date(task.dueDate);
		switch (task.recurrence) {
			case 'daily': due.setDate(due.getDate() + 1); break;
			case 'weekly': due.setDate(due.getDate() + 7); break;
			case 'monthly': due.setMonth(due.getMonth() + 1); break;
			default: return undefined;
		}
		return due.toISOString().split('T')[0];
	}
}

export const taskStore = new TaskStore();
