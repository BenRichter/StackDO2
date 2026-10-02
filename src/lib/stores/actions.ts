import { app } from './app.svelte';
import { ui } from './ui.svelte';

/** Complete a task from anywhere: celebrate, retire the tutorial when done, ask for real time + follow-up. */
export function finishTask(id: string) {
	const task = app.tasks.find((t) => t.id === id);
	if (!task || task.completedAt) return;
	app.complete(id);
	if (app.settings.animations) ui.celebrate++;
	if (task.tutorial && !app.tasks.some((t) => t.tutorial && !t.completedAt)) {
		app.updateThread('tutorial', { archived: true });
		ui.notify('Tutorial durch. Ab jetzt: nicht wählen, machen.');
	}
	ui.open({ type: 'done', id });
}
