/** Views. The stack is home; everything else lives behind the menu. */
export type View = 'stack' | 'matrix' | 'day' | 'threads' | 'stats';

export const VIEW_TITLES: Record<View, string> = {
	stack: 'Stapel',
	matrix: 'Matrix',
	day: 'Heute',
	threads: 'Stränge',
	stats: 'Rückblick'
};

export type Sheet =
	| { type: 'task'; id?: string; threadId?: string }
	| { type: 'push'; id: string }
	| { type: 'done'; id: string }
	| { type: 'thread'; id?: string }
	| { type: 'settings' };

class UiStore {
	view = $state<View>('stack');
	menuOpen = $state(false);
	/** Chrome/Android install prompt, captured from `beforeinstallprompt` */
	installPrompt = $state<(Event & { prompt: () => Promise<void> }) | null>(null);
	sheet = $state<Sheet | null>(null);
	searchOpen = $state(false);
	celebrate = $state(0);
	toast = $state<{ text: string; action?: { label: string; run: () => void } } | null>(null);
	#toastTimer: ReturnType<typeof setTimeout> | undefined;

	go(view: View) {
		this.view = view;
		this.menuOpen = false;
		if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
	}

	open(sheet: Sheet) {
		this.menuOpen = false;
		this.sheet = sheet;
	}

	close() {
		this.sheet = null;
	}

	notify(text: string, action?: { label: string; run: () => void }) {
		this.toast = { text, action };
		clearTimeout(this.#toastTimer);
		this.#toastTimer = setTimeout(() => (this.toast = null), 5000);
	}
}

export const ui = new UiStore();
