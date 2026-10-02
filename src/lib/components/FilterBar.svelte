<script lang="ts">
	import { app, type Filter } from '$lib/stores/app.svelte';
	import Icon from './Icon.svelte';

	const FILTERS: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'Alle' },
		{ id: 'quick', label: 'Quick Wins ≤30m' },
		{ id: 'short', label: '< 2h' },
		{ id: 'important', label: 'Wichtig' },
		{ id: 'due', label: 'Fällig' }
	];
</script>

<div class="bar" role="toolbar" aria-label="Filter">
	{#each FILTERS as f (f.id)}
		<button class="chip" aria-pressed={app.filter === f.id} onclick={() => (app.filter = f.id)}>
			{#if f.id === 'quick'}<Icon name="zap" size={13} />{/if}{f.label}
		</button>
	{/each}
	<button
		class="chip"
		aria-pressed={app.settings.hideRecurring}
		onclick={() => (app.settings.hideRecurring = !app.settings.hideRecurring)}
		title="Wiederkehrende ausblenden"
	>
		<Icon name="repeat" size={13} />
		{app.settings.hideRecurring ? 'ausgeblendet' : 'ausblenden'}
	</button>
	<span class="sep"></span>
	{#each app.activeThreads as th (th.id)}
		<button
			class="chip thread"
			style:--c={th.color}
			aria-pressed={app.threadFilter === th.id}
			onclick={() => (app.threadFilter = app.threadFilter === th.id ? null : th.id)}
		>
			<span class="dot"></span>{th.name}
		</button>
	{/each}
</div>

<style>
	.bar {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scrollbar-width: none;
		padding: 2px 18px;
		margin: 0 -18px;
	}
	.bar::-webkit-scrollbar {
		display: none;
	}
	.sep {
		flex: 0 0 1px;
		background: var(--line);
		margin: 4px 2px;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c);
	}
	.thread[aria-pressed='true'] {
		background: var(--c);
		border-color: var(--c);
		color: #fff;
	}
	.thread[aria-pressed='true'] .dot {
		background: #fff;
	}
</style>
