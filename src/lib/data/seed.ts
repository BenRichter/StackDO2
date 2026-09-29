import type { Task, Thread } from '$lib/types';
import { dateKey } from '$lib/utils/time';

export const uid = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2) + Date.now().toString(36);

export function seedThreads(): Thread[] {
	return [
		{ id: 'tutorial', name: 'StackDO lernen', color: '#e26f1f', rank: 0 },
		{
			id: 'selfcare',
			name: 'Self Care',
			color: '#00a32a',
			rank: 1,
			goal: {
				text: 'Fit & ausgeschlafen durch den Winter',
				measure: '3× Sport pro Woche, 7h Schlaf',
				stretch: 'Halbmarathon im Frühling'
			}
		},
		{
			id: 'work',
			name: 'Arbeit',
			color: '#2271b1',
			rank: 2,
			window: { from: '08:00', to: '17:00', days: [1, 2, 3, 4, 5] }
		},
		{ id: 'family', name: 'Familie', color: '#c9356e', rank: 3 },
		{ id: 'life', name: 'Leben', color: '#8c5fd1', rank: 4 }
	];
}

/** The tutorial is just the first few tasks of the stack. Do them, and you know the app. */
export function seedTasks(now = new Date()): Task[] {
	const base = (title: string, notes: string, estimate: number, importance: number, tags: string[] = []): Task => ({
		id: uid(),
		title,
		notes,
		threadId: 'tutorial',
		tags,
		importance,
		estimate,
		recurrence: 'none',
		createdAt: now.toISOString(),
		timeLog: [],
		pushHistory: [],
		tutorial: true
	});
	const today = dateKey(now);
	return [
		{
			...base(
				'Drück ▶ Start – und dann ✓ Erledigt',
				'Oben liegt immer genau EINE Aufgabe: die nächste. Nicht wählen – einfach machen. Start misst die echte Zeit, das macht deine Schätzungen besser.',
				2,
				5
			),
			dueDate: today
		},
		base(
			'Lege deine Stränge an',
			'Tab „Stränge“: Leben, Arbeit, Familie … Reihenfolge = Priorität. Arbeit hat ein Zeitfenster (Blocker) – deren Aufgaben kommen nur in diesem Fenster.',
			5,
			4
		),
		base(
			'Schnell-Eingabe probieren: „Mail an Tom #mail !4 15m morgen +Arbeit“',
			'#tag · !1–!5 Wichtigkeit · 15m/1h Dauer · heute/morgen/mo–so · 14:00 · +Strang',
			3,
			4,
			['write']
		),
		base(
			'Aufgabe zurückstellen (⏷)',
			'Geht gerade nicht? Zurückstellen: 1h, heute Abend, morgen, nächste Woche oder „warte auf …“. Der Verlauf bleibt erhalten.',
			2,
			3
		),
		base(
			'Blick auf die Tagesuhr',
			'Tab „Tag“: 24h-Uhr mit Blockern (Arbeit), deinem Plan ab jetzt und dem, was wirklich passiert ist.',
			2,
			3
		),
		base(
			'Setz dir ein Ziel für einen Strang',
			'Stränge → Strang antippen → Ziel (SMART): Was genau? Woran messbar? Bis wann? Plus Stretch-Ziel. Aus dem Ziel werden mit „Ziel → Plan“ direkt Aufgaben. Das Ziel erscheint als Erinnerung auf der Karte.',
			5,
			3
		),
		base(
			'Eisenhower-Matrix ansehen',
			'Stapel → „Matrix“: Sofort erledigen · Terminieren · Delegieren · Ignorieren. Der Stapel sortiert danach – die Matrix zeigt dir, was du abgeben oder streichen kannst.',
			2,
			3
		),
		base(
			'Große Aufgabe? Babysteps!',
			'Alles über 2h wird als zu groß markiert. Im Bearbeiten-Panel: ✂ Aufteilen.',
			2,
			2
		)
	];
}

export const QUOTES = [
	'Nicht wählen. Machen.',
	'Das Hindernis ist der Weg. — Mark Aurel',
	'Eat the frog: das Schwerste zuerst.',
	'Erledigt ist besser als perfekt.',
	'Wir leiden öfter in der Vorstellung als in der Wirklichkeit. — Seneca',
	'Unter 2 Minuten? Sofort machen.',
	'Fokus heißt Nein sagen – zu allem außer dem Nächsten.',
	'Wer viele Fäden hält, braucht eine Schnur.',
	'Schätze, miss, lerne.',
	'Nicht die Zeit ist knapp, sondern die Aufmerksamkeit.',
	'Kleine Schritte, großer Flow.',
	'Du musst nicht motiviert sein. Nur anfangen.'
];

export const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];
