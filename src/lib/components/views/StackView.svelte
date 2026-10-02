<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { randomQuote } from '$lib/data/seed';
	import { fmtDuration } from '$lib/utils/time';
	import JustDoCard from '../JustDoCard.svelte';
	import TaskRow from '../TaskRow.svelte';
	import Icon from '../Icon.svelte';

	const stack = $derived(app.visibleStack);
	const top = $derived(stack.ready[0]);
	const rest = $derived(stack.ready.slice(1));
	/** the next two cards peek out under the top one – it's a stack, not a list */
	const peek = $derived(rest.slice(0, 2));
	let showLater = $state(false);
	const quote = randomQuote();
	const filtered = $derived(app.filter !== 'all' || !!app.threadFilter || !!app.search.trim());
	const restMinutes = $derived(rest.reduce((s, r) => s + r.task.estimate, 0));

	function resetFilters() {
		app.filter = 'all';
		app.threadFilter = null;
		app.search = '';
	}
</script>

<section class="stack">
	{#if top}
		<div class="pile" style:--peek={peek.length}>
			{#each peek as p, i (p.task.id)}
				<div class="peek p{i + 1}" style:--c={app.thread(p.task.threadId)?.color} aria-hidden="true"></div>
			{/each}
			{#key top.task.id}
				<div class="enter"><JustDoCard item={top} /></div>
			{/key}
		</div>
	{:else}
		<div class="empty">
			<div class="big">{filtered ? '∅' : '✓'}</div>
			<h2>{filtered ? 'Nichts passt zum Filter' : 'Alles erledigt.'}</h2>
			<p class="quote">{filtered ? 'Filter zurücksetzen, dann geht’s weiter.' : app.settings.quotes ? `„${quote}“` : 'Gönn dir eine Pause.'}</p>
			{#if filtered}
				<button class="btn" onclick={resetFilters}>Filter zurücksetzen</button>
			{/if}
		</div>
	{/if}

	{#if rest.length}
		<div class="section-head">
			<h3>Danach</h3>
			<span>{rest.length} · {fmtDuration(restMinutes)}</span>
		</div>
		<ol class="list">
			{#each rest as s (s.task.id)}
				<TaskRow task={s.task} />
			{/each}
		</ol>
	{/if}

	{#if stack.later.length}
		<button class="later-toggle" onclick={() => (showLater = !showLater)} aria-expanded={showLater}>
			Später & wartend · {stack.later.length}
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

	{#if app.somedayTasks.length && !filtered}
		<button class="someday-link" onclick={() => ui.go('inbox')}>
			<Icon name="inbox" size={15} /> Irgendwann · {app.somedayTasks.length} geparkt
		</button>
	{/if}

	{#if filtered && top}
		<button class="filter-pill" onclick={resetFilters}><Icon name="x" size={13} /> Filter aktiv</button>
	{/if}
</section>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.pile {
		position: relative;
		padding-bottom: calc(var(--peek) * 9px);
	}
	.peek {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 60px;
		border-radius: 24px;
		background: var(--surface);
		box-shadow: var(--shadow);
		border-top: 3px solid var(--c);
	}
	.peek.p1 {
		margin: 0 12px;
		bottom: calc((var(--peek) - 1) * 9px);
		opacity: 0.95;
	}
	.peek.p2 {
		margin: 0 26px;
		opacity: 0.7;
	}
	.enter {
		position: relative;
		animation: rise 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.15);
	}
	@keyframes rise {
		from {
			transform: translateY(18px) scale(0.96);
			opacity: 0;
		}
	}
	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin: 14px 4px 0;
	}
	h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 800;
	}
	.section-head span {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.later-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		align-self: center;
		padding: 8px 12px;
		border: 0;
		border-radius: 999px;
		background: none;
		color: var(--muted);
		font-size: 0.85rem;
		font-weight: 700;
	}
	.someday-link {
		display: flex;
		align-items: center;
		gap: 6px;
		align-self: center;
		padding: 6px 12px;
		border: 0;
		background: none;
		color: var(--muted);
		font-size: 0.82rem;
		font-weight: 600;
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
	.filter-pill {
		position: fixed;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		border: 0;
		border-radius: 999px;
		background: var(--ink);
		color: var(--surface);
		font-size: 0.78rem;
		font-weight: 700;
	}
	.empty {
		text-align: center;
		padding: 56px 20px;
		background: var(--surface);
		border-radius: 24px;
		box-shadow: var(--shadow);
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
		margin: 0 0 16px;
	}
</style>
