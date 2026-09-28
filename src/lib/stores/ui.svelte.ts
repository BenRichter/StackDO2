export type Tab = 'stack' | 'day' | 'threads' | 'stats';

export type Sheet =
	| { type: 'task'; id?: string; threadId?: string }
	| { type: 'push'; id: string }
	| { type: 'done'; id: string }
	| { type: 'thread'; id?: string }
	| { type: 'settings' };

class UiStore {
	tab = $state<Tab>('stack');
	sheet = $state<Sheet | null>(null);
	searchOpen = $state(false);
	celebrate = $state(0);
	toast = $state<{ text: string; action?: { label: string; run: () => void } } | null>(null);
	#toastTimer: ReturnType<typeof setTimeout> | undefined;

	open(sheet: Sheet) {
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
