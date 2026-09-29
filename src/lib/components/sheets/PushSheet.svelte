<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { addDays, hmToMin } from '$lib/utils/time';
	import BottomSheet from './BottomSheet.svelte';

	let { id }: { id: string } = $props();

	const task = $derived(app.tasks.find((t) => t.id === id));
	let waitingFor = $state('');
	let delegateTo = $state('');

	const at = (dayOffset: number, hm: string) => {
		const d = addDays(new Date(), dayOffset);
		const m = hmToMin(hm);
		d.setHours(Math.floor(m / 60), m % 60, 0, 0);
		return d;
	};

	const options = $derived.by(() => {
		const now = new Date();
		const tonight = at(0, '18:00');
		const monday = at(((8 - now.getDay()) % 7) || 7, app.settings.dayStart);
		return [
			{ label: '15 Minuten', sub: 'kurz was anderes', until: new Date(Date.now() + 15 * 60000) },
			{ label: '1 Stunde', sub: 'später heute', until: new Date(Date.now() + 3600000) },
			...(tonight > now ? [{ label: 'Heute Abend', sub: '18:00', until: tonight }] : []),
			{ label: 'Morgen', sub: app.settings.dayStart, until: at(1, app.settings.dayStart) },
			{ label: 'Nächste Woche', sub: 'Montag', until: monday }
		];
	});

	function push(until: Date, reason?: string) {
		app.push(id, until, reason);
		ui.close();
		ui.notify('Zurückgestellt', { label: 'Rückgängig', run: () => app.unpush(id) });
	}
</script>

<BottomSheet title="Später">
	{#if task}
		<p class="t">{task.title}</p>
		<div class="grid">
			{#each options as o (o.label)}
				<button class="opt" onclick={() => push(o.until)}>
					<strong>{o.label}</strong><span>{o.sub}</span>
				</button>
			{/each}
		</div>
		<span class="label">Warte auf …</span>
		<form
			class="row wait"
			onsubmit={(e) => {
				e.preventDefault();
				push(at(2, app.settings.dayStart), waitingFor.trim() ? `wartet auf ${waitingFor.trim()}` : 'wartet');
			}}
		>
			<input class="field" bind:value={waitingFor} placeholder="Antwort von Tom, Lieferung …" />
			<button class="btn primary">2 Tage</button>
		</form>
		<span class="label">Delegieren an … (Eisenhower)</span>
		<form
			class="row wait"
			onsubmit={(e) => {
				e.preventDefault();
				if (!delegateTo.trim()) return;
				app.delegate(id, delegateTo.trim());
				ui.close();
				ui.notify(`An ${delegateTo.trim()} delegiert – Check-in in 3 Tagen`);
			}}
		>
			<input class="field" bind:value={delegateTo} placeholder="Name" />
			<button class="btn primary" disabled={!delegateTo.trim()}>Abgeben</button>
		</form>
		{#if task.pushHistory.length >= 3}
			<p class="nudge">Schon {task.pushHistory.length}× verschoben. Zu groß? Löschen? Oder einfach 5 Minuten anfangen.</p>
		{/if}
	{/if}
</BottomSheet>

<style>
	.t {
		margin: 4px 0 12px;
		font-weight: 600;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 8px;
	}
	.opt {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		padding: 12px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface-2);
		text-align: left;
	}
	.opt span {
		font-size: 0.78rem;
		color: var(--muted);
	}
	.wait {
		flex-wrap: nowrap;
	}
	.wait .btn {
		white-space: nowrap;
	}
	.nudge {
		margin: 14px 0 0;
		padding: 10px;
		border-left: 3px solid var(--amber);
		background: var(--surface-2);
		font-size: 0.85rem;
	}
</style>
