<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { randomQuote } from '$lib/data/seed';
	import JustDoCard from '../JustDoCard.svelte';
	import TaskRow from '../TaskRow.svelte';
	import FilterBar from '../FilterBar.svelte';

	let { onDone }: { onDone: (id: string) => void } = $props();

	const stack = $derived(app.visibleStack);
	const top = $derived(stack.ready[0]);
	const rest = $derived(stack.ready.slice(1));
	let showLater = $state(false);
	const quote = randomQuote();
	const filtered = $derived(app.filter !== 'all' || !!app.threadFilter || !!app.search.trim());
</script>

<section class="stack">
	<FilterBar />

	{#if top}
		{#key top.task.id}
			<div class="enter"><JustDoCard item={top} {onDone} /></div>
		{/key}
	{:else}
		<div class="empty">
			<div class="big">{filtered ? '∅' : '✓'}</div>
			<h2>{filtered ? 'Nichts passt zum Filter' : 'Stapel leer. Stark.'}</h2>
			{#if app.settings.quotes}<p class="quote">„{quote}“</p>{/if}
			{#if filtered}
				<button
					class="btn"
					onclick={() => {
						app.filter = 'all';
						app.threadFilter = null;
						app.search = '';
					}}>Filter zurücksetzen</button
				>
			{:else}
				<button class="btn primary" onclick={() => ui.open({ type: 'task' })}>Neue Aufgabe</button>
			{/if}
		</div>
	{/if}

	{#if rest.length}
		<h3>Danach <span>{rest.length}</span></h3>
		<ol class="list">
			{#each rest as s, i (s.task.id)}
				<TaskRow task={s.task} rank={i + 2} />
			{/each}
		</ol>
	{/if}

	{#if stack.later.length}
		<button class="later-toggle" onclick={() => (showLater = !showLater)} aria-expanded={showLater}>
			Später / wartet <span>{stack.later.length}</span>
		</button>
		{#if showLater}
			<ul class="list">
				{#each stack.later as u (u.task.id)}
					<TaskRow task={u.task} reason={u.until ? `${u.reason} bis ${u.until.toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}` : u.reason} />
				{/each}
			</ul>
		{/if}
	{/if}
</section>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.enter {
		animation: rise 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
	}
	@keyframes rise {
		from {
			transform: translateY(24px) scale(0.97);
			opacity: 0;
		}
	}
	h3,
	.later-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 8px 0 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.later-toggle {
		border: 0;
		background: none;
		padding: 6px 0;
	}
	h3 span,
	.later-toggle span {
		font-weight: 600;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.empty {
		text-align: center;
		padding: 40px 16px;
		background: var(--surface);
		border-radius: var(--radius);
	}
	.big {
		font-size: 3rem;
		font-weight: 900;
		color: var(--green);
	}
	.empty h2 {
		margin: 4px 0 8px;
	}
	.quote {
		color: var(--muted);
		font-style: italic;
		margin: 0 0 16px;
	}
</style>
