<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { scoreTask, threadWeight } from '$lib/utils/scoring';
	import { fmtDuration } from '$lib/utils/time';
	import Icon from '../Icon.svelte';

	const DAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	const strands = $derived(
		app.activeThreads.map((th) => {
			const open = app.tasks
				.filter((t) => t.threadId === th.id && !t.completedAt)
				.map((t) => scoreTask(t, app.ctx))
				.sort((a, b) => b.score - a.score)
				.map((s) => s.task);
			return { th, open, total: open.reduce((s, t) => s + t.estimate, 0), weight: threadWeight(th.id, app.threads) };
		})
	);
	const paused = $derived(app.threads.filter((t) => t.archived));
	const maxWeight = 30;
</script>

<section class="threads">
	<p class="intro">Deine Stränge laufen parallel. Oben = wichtiger. Jede Aufgabe hängt an einer Schnur.</p>

	{#each strands as { th, open, total, weight }, i (th.id)}
		<article class="strand" style:--c={th.color}>
			<header>
				<span class="rank">{i + 1}</span>
				<button class="name" onclick={() => ui.open({ type: 'thread', id: th.id })}>
					<strong>{th.name}</strong>
					<span class="sub">
						{open.length} offen · {fmtDuration(total)}
						{#if th.window}· ⛔ {th.window.from}–{th.window.to} {th.window.days.map((d) => DAY[d]).join(' ')}{/if}
					</span>
				</button>
				<div class="order">
					<button class="icon-btn" disabled={i === 0} onclick={() => app.moveThread(th.id, -1)} aria-label="{th.name} höher priorisieren"><Icon name="up" size={18} /></button>
					<button class="icon-btn" disabled={i === strands.length - 1} onclick={() => app.moveThread(th.id, 1)} aria-label="{th.name} niedriger priorisieren"><Icon name="down" size={18} /></button>
				</div>
			</header>
			{#if th.goal?.text}
				<p class="goal"><Icon name="target" size={13} /> {th.goal.text}{th.goal.deadline ? ` · bis ${new Date(th.goal.deadline).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}` : ''}</p>
			{/if}
			<div class="weight" title="Gewicht im Stapel"><div style:width="{(weight / maxWeight) * 100}%"></div></div>
			<div class="string">
				<span class="cord" aria-hidden="true"></span>
				{#each open as t (t.id)}
					<button
						class="bead"
						class:running={app.timer?.taskId === t.id}
						style:--s="{Math.min(34, 12 + Math.sqrt(t.estimate) * 2.2)}px"
						title="{t.title} · {fmtDuration(t.estimate)}"
						aria-label={t.title}
						onclick={() => ui.open({ type: 'task', id: t.id })}
					></button>
				{/each}
				<button class="bead add" onclick={() => ui.open({ type: 'task', threadId: th.id })} aria-label="Aufgabe zu {th.name}"><Icon name="plus" size={14} /></button>
			</div>
			{#if open.length}
				<p class="next">Als nächstes: {open[0].title}</p>
			{/if}
		</article>
	{/each}

	<button class="btn add-thread" onclick={() => ui.open({ type: 'thread' })}><Icon name="plus" size={16} /> Strang anlegen</button>

	{#if paused.length}
		<h3>Pausiert</h3>
		{#each paused as th (th.id)}
			<button class="paused" style:--c={th.color} onclick={() => ui.open({ type: 'thread', id: th.id })}>
				<span class="dot"></span>{th.name}
			</button>
		{/each}
	{/if}
</section>

<style>
	.threads {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.intro {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.strand {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 10px 12px 12px;
		box-shadow: var(--shadow);
	}
	header {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.rank {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--c);
		color: #fff;
		font-weight: 800;
		font-size: 0.85rem;
		flex: none;
	}
	.name {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		border: 0;
		background: none;
		text-align: left;
		padding: 0;
	}
	.sub {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.order {
		display: flex;
	}
	.order .icon-btn {
		width: 34px;
		height: 34px;
	}
	.order .icon-btn:disabled {
		opacity: 0.25;
	}
	.goal {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 8px 0 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--c);
	}
	.weight {
		height: 3px;
		background: var(--surface-2);
		margin: 8px 0 4px;
	}
	.weight div {
		height: 100%;
		background: var(--c);
	}
	.string {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		padding: 10px 0 4px;
		min-height: 44px;
	}
	.cord {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 2px;
		margin-top: 3px;
		background: var(--c);
		opacity: 0.4;
	}
	.bead {
		position: relative;
		width: var(--s);
		height: var(--s);
		border-radius: 50%;
		border: 2px solid var(--surface);
		background: var(--c);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
		padding: 0;
		transition: transform 0.15s;
	}
	.bead:hover {
		transform: scale(1.15);
	}
	.bead.running {
		animation: pulse 1.2s infinite;
	}
	@keyframes pulse {
		50% {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--c) 30%, transparent);
		}
	}
	.bead.add {
		--s: 26px;
		display: grid;
		place-items: center;
		background: var(--surface);
		border: 2px dashed var(--c);
		color: var(--c);
		box-shadow: none;
	}
	.next {
		margin: 6px 0 0;
		font-size: 0.8rem;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.add-thread {
		border-style: dashed;
	}
	h3 {
		margin: 12px 0 0;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.paused {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border: 1px dashed var(--line);
		border-radius: 8px;
		background: none;
		color: var(--muted);
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--c);
		opacity: 0.5;
	}
</style>
