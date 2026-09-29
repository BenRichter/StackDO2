<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { randomQuote } from '$lib/data/seed';
	import { relativeDue } from '$lib/utils/time';
	import JustDoCard from '../JustDoCard.svelte';
	import TaskRow from '../TaskRow.svelte';
	import FilterBar from '../FilterBar.svelte';
	import Icon from '../Icon.svelte';
	import MatrixView from './MatrixView.svelte';

	const stack = $derived(app.visibleStack);
	const top = $derived(stack.ready[0]);
	const rest = $derived(stack.ready.slice(1));
	let showLater = $state(false);
	const quote = randomQuote();
	const filtered = $derived(app.filter !== 'all' || !!app.threadFilter || !!app.search.trim());
	const main = $derived(app.mainGoal);
</script>

<section class="stack">
	{#if main && !filtered}
		<button class="goal" style:--c={main.thread.color} onclick={() => ui.open({ type: 'thread', id: main.thread.id })}>
			<Icon name="target" size={18} />
			<span class="g-body">
				<span class="g-label">Dein Ziel · {main.thread.name}{main.goal.deadline ? ` · ${relativeDue(main.goal.deadline, app.now).replace('heute', 'bis heute')}` : ''}</span>
				<span class="g-text">{main.goal.text}</span>
				{#if main.goal.stretch}<span class="g-stretch">Stretch: {main.goal.stretch}</span>{/if}
			</span>
		</button>
	{/if}

	<div class="seg" role="tablist" aria-label="Ansicht">
		<button role="tab" aria-selected={ui.stackMode === 'stack'} onclick={() => (ui.stackMode = 'stack')}><Icon name="stack" size={15} /> Stapel</button>
		<button role="tab" aria-selected={ui.stackMode === 'matrix'} onclick={() => (ui.stackMode = 'matrix')}><Icon name="grid" size={15} /> Matrix</button>
	</div>

	{#if ui.stackMode === 'matrix'}
		<MatrixView />
	{:else}
		{#if top}
			{#key top.task.id}
				<div class="enter"><JustDoCard item={top} /></div>
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
				<Icon name={showLater ? 'up' : 'down'} size={14} />
			</button>
			{#if showLater}
				<ul class="list">
					{#each stack.later as u (u.task.id)}
						<TaskRow
							task={u.task}
							reason={u.until
								? `${u.task.delegatedTo ? `delegiert an ${u.task.delegatedTo}` : u.reason} bis ${u.until.toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`
								: u.reason}
						/>
					{/each}
				</ul>
			{/if}
		{/if}
	{/if}

	<div class="filters"><FilterBar /></div>
</section>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.goal {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 12px 14px;
		border: 0;
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--c) 10%, var(--surface));
		color: var(--c);
		text-align: left;
	}
	.g-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.g-label {
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.g-text {
		color: var(--ink);
		font-weight: 700;
	}
	.g-stretch {
		color: var(--muted);
		font-size: 0.8rem;
	}
	.seg {
		display: flex;
		align-self: flex-start;
		padding: 3px;
		background: var(--surface-2);
		border-radius: 10px;
	}
	.seg button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border: 0;
		border-radius: 8px;
		background: none;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--muted);
	}
	.seg button[aria-selected='true'] {
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
		margin: 10px 0 0;
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--ink);
	}
	.later-toggle {
		border: 0;
		background: none;
		padding: 6px 0;
		color: var(--muted);
	}
	h3 span,
	.later-toggle span {
		font-weight: 600;
		color: var(--muted);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
	}
	.filters {
		position: sticky;
		bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 8px);
		margin-top: 4px;
		padding: 8px 0;
		background: linear-gradient(transparent, var(--bg) 14px);
		z-index: 5;
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
