<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { fmtDuration } from '$lib/utils/time';
	import BottomSheet from './BottomSheet.svelte';
	import Icon from '../Icon.svelte';

	let { id }: { id: string } = $props();

	const task = app.tasks.find((t) => t.id === id);
	let actual = $state(task?.actual ?? task?.estimate ?? 15);
	const tracked = (task?.timeLog.length ?? 0) > 0;

	// Mails, calls and waiting-on-others usually need a nudge later
	const followUpLikely = !!task && (task.tags.some((t) => ['mail', 'call'].includes(t)) || !!task.followUpOf);
	let followUp = $state<number>(followUpLikely ? 3 : 0);

	const actualOptions = $derived(
		[...new Set([task?.estimate ?? 15, Math.round(((task?.estimate ?? 15) * 1.5) / 5) * 5, (task?.estimate ?? 15) * 2, actual])].sort((a, b) => a - b)
	);

	function finish() {
		if (!task) return ui.close();
		app.setActual(id, Math.max(1, actual));
		if (followUp) app.followUp(id, followUp);
		ui.close();
	}
</script>

<BottomSheet title="Erledigt ✓">
	{#if task}
		<p class="t">{task.title}</p>

		<span class="label">Wie lange wirklich?</span>
		<div class="row">
			{#each actualOptions as m (m)}
				<button class="chip" aria-pressed={actual === m} onclick={() => (actual = m)}>
					{fmtDuration(m)}{m === task.estimate ? ' (geschätzt)' : ''}
				</button>
			{/each}
			<input class="field num" type="number" min="1" bind:value={actual} aria-label="Minuten" />
		</div>
		<p class="hint">
			{#if tracked}Gemessen: {fmtDuration(task.actual ?? actual)}.{/if}
			{#if actual > task.estimate * 1.2}
				{Math.round((actual / task.estimate - 1) * 100)}% länger als geschätzt – die Prognose lernt mit.
			{:else if actual < task.estimate * 0.8}
				Schneller als gedacht. 💪
			{:else}
				Gut geschätzt.
			{/if}
		</p>

		<span class="label">Follow-up?</span>
		<div class="row">
			{#each [[0, 'Nein'], [1, 'Morgen'], [3, 'In 3 Tagen'], [7, 'In 1 Woche']] as [d, label] (d)}
				<button class="chip" aria-pressed={followUp === d} onclick={() => (followUp = d as number)}>{label}</button>
			{/each}
		</div>

		<div class="submit">
			<button class="btn" onclick={() => { app.undoComplete(); ui.close(); }}><Icon name="undo" size={16} /> Doch nicht</button>
			<button class="btn primary" onclick={finish}><Icon name="check" size={18} /> Weiter</button>
		</div>
	{/if}
</BottomSheet>

<style>
	.t {
		margin: 4px 0 0;
		font-weight: 600;
		text-decoration: line-through;
		color: var(--muted);
	}
	.num {
		width: 80px;
		padding: 6px 8px;
	}
	.hint {
		margin: 8px 0 0;
		font-size: 0.82rem;
		color: var(--muted);
	}
	.submit {
		display: flex;
		gap: 8px;
		margin-top: 20px;
	}
	.submit .primary {
		flex: 1;
		min-height: 48px;
	}
</style>
