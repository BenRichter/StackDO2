<script lang="ts">
	import { THREAD_COLORS } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import BottomSheet from './BottomSheet.svelte';
	import Icon from '../Icon.svelte';

	let { id }: { id?: string } = $props();

	const existing = app.threads.find((t) => t.id === id);
	let name = $state(existing?.name ?? '');
	let color = $state(existing?.color ?? THREAD_COLORS[app.threads.length % THREAD_COLORS.length]);
	let blocker = $state(!!existing?.window);
	let from = $state(existing?.window?.from ?? '08:00');
	let to = $state(existing?.window?.to ?? '17:00');
	let days = $state<number[]>(existing?.window?.days ?? [1, 2, 3, 4, 5]);

	const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	const openTasks = existing ? app.tasks.filter((t) => t.threadId === existing.id && !t.completedAt).length : 0;

	function save() {
		if (!name.trim()) return;
		const patch = {
			name: name.trim(),
			color,
			window: blocker ? { from, to, days: [...days].sort() } : undefined
		};
		if (existing) app.updateThread(existing.id, patch);
		else {
			const th = app.addThread(patch.name, color);
			app.updateThread(th.id, patch);
		}
		ui.close();
	}

	function remove() {
		if (!existing) return;
		if (openTasks && !confirm(`${openTasks} offene Aufgaben wandern in den nächsten Strang. Löschen?`)) return;
		app.deleteThread(existing.id);
		ui.close();
	}
</script>

<BottomSheet title={existing ? 'Strang bearbeiten' : 'Neuer Strang'}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			save();
		}}
	>
		<span class="label">Name</span>
		<input class="field" bind:value={name} placeholder="Leben, Arbeit, Familie, Self Care …" />

		<span class="label">Farbe</span>
		<div class="row">
			{#each THREAD_COLORS as c (c)}
				<button type="button" class="swatch" style:background={c} aria-pressed={color === c} aria-label="Farbe {c}" onclick={() => (color = c)}></button>
			{/each}
			<input type="color" bind:value={color} aria-label="Eigene Farbe" />
		</div>

		<span class="label">Blocker / Zeitfenster</span>
		<label class="switch">
			<input type="checkbox" bind:checked={blocker} />
			Aufgaben nur in diesem Fenster (z.B. Arbeit)
		</label>
		{#if blocker}
			<div class="row win">
				<input type="time" class="field" bind:value={from} aria-label="Von" />
				<span>–</span>
				<input type="time" class="field" bind:value={to} aria-label="Bis" />
			</div>
			<div class="row">
				{#each [1, 2, 3, 4, 5, 6, 0] as d (d)}
					<button
						type="button"
						class="chip"
						aria-pressed={days.includes(d)}
						onclick={() => (days = days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}>{DAY_LABELS[d]}</button
					>
				{/each}
			</div>
		{/if}

		{#if existing}
			<div class="row tools">
				<button type="button" class="btn" onclick={() => { app.updateThread(existing.id, { archived: !existing.archived }); ui.close(); }}>
					{existing.archived ? 'Reaktivieren' : 'Pausieren'}
				</button>
				<button type="button" class="btn danger" onclick={remove}><Icon name="trash" size={16} /> Löschen</button>
			</div>
		{/if}

		<button class="btn primary save" disabled={!name.trim()}><Icon name="check" size={18} /> Speichern</button>
	</form>
</BottomSheet>

<style>
	.swatch {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 3px solid var(--surface);
		box-shadow: 0 0 0 1px var(--line);
	}
	.swatch[aria-pressed='true'] {
		box-shadow: 0 0 0 2px var(--ink);
	}
	input[type='color'] {
		width: 40px;
		height: 32px;
		border: 0;
		background: none;
	}
	.switch {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 0.9rem;
	}
	.win {
		flex-wrap: nowrap;
		margin: 8px 0;
	}
	.tools {
		margin-top: 16px;
	}
	.save {
		width: 100%;
		min-height: 48px;
		margin-top: 16px;
	}
</style>
