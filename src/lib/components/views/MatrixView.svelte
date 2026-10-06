<script lang="ts">
	import type { Task } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { finishTask } from '$lib/stores/actions';
	import { QUADRANTS, quadrant, type Quadrant } from '$lib/utils/scoring';
	import { fmtDuration } from '$lib/utils/time';
	import Icon, { type IconName } from '../Icon.svelte';

	// Layout like the classic matrix: urgency up, importance right
	const ORDER: { q: Quadrant; icon: IconName }[] = [
		{ q: 'delegate', icon: 'users' },
		{ q: 'do', icon: 'check' },
		{ q: 'drop', icon: 'trash' },
		{ q: 'plan', icon: 'calendar' }
	];

	const groups = $derived.by(() => {
		const g: Record<Quadrant, Task[]> = { do: [], plan: [], delegate: [], drop: [] };
		for (const s of app.visibleStack.ready) g[quadrant(s.task, app.now)].push(s.task);
		return g;
	});

	function remove(t: Task) {
		const snapshot = $state.snapshot(t) as Task;
		app.deleteTask(t.id);
		ui.notify('Gestrichen', { label: 'Rückgängig', run: () => app.tasks.push(snapshot) });
	}
</script>

<div class="matrix">
	<span class="axis y">Dringend ↑</span>
	<div class="grid">
		{#each ORDER as { q, icon } (q)}
			<section class="quad {q}">
				<header>
					<Icon name={icon} size={16} />
					<strong>{QUADRANTS[q].label}</strong>
					<span>{groups[q].length}</span>
				</header>
				<p class="hint">{QUADRANTS[q].hint}</p>
				<ul>
					{#each groups[q] as t (t.id)}
						<li style:--c={app.thread(t.threadId)?.color}>
							<button class="t" onclick={() => ui.open({ type: 'task', id: t.id })}>
								<span class="dot"></span>{t.title}
								<em>{fmtDuration(t.estimate)}</em>
							</button>
							{#if q === 'do'}
								<button class="act" onclick={() => finishTask(t.id)} aria-label="Erledigt"><Icon name="check" size={15} /></button>
							{:else if q === 'plan'}
								<button class="act" onclick={() => ui.open({ type: 'push', id: t.id })} aria-label="Terminieren"><Icon name="calendar" size={15} /></button>
							{:else if q === 'delegate'}
								<button class="act" onclick={() => ui.open({ type: 'push', id: t.id })} aria-label="Delegieren"><Icon name="users" size={15} /></button>
							{:else}
								<button class="act" onclick={() => remove(t)} aria-label="Streichen"><Icon name="trash" size={15} /></button>
							{/if}
						</li>
					{:else}
						<li class="empty">—</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
	<span class="axis x">Wichtig →</span>
</div>

<style>
	.matrix {
		display: grid;
		grid-template-columns: 18px 1fr;
		gap: 4px;
	}
	.axis {
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--prime-solid);
	}
	.axis.y {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		text-align: right;
	}
	.axis.x {
		grid-column: 2;
		text-align: right;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.quad {
		min-width: 0;
		padding: 10px;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	.quad.do {
		box-shadow:
			inset 0 0 0 2px var(--prime-solid),
			var(--shadow);
	}
	.quad.drop {
		opacity: 0.75;
	}
	header {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
		color: var(--prime-solid);
	}
	header strong {
		flex: 1;
		color: var(--ink);
	}
	header span {
		color: var(--muted);
		font-weight: 700;
	}
	.hint {
		margin: 2px 0 6px;
		font-size: 0.7rem;
		color: var(--muted);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	li {
		display: flex;
		align-items: center;
	}
	.t {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 2px;
		border: 0;
		background: none;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.t em {
		margin-left: auto;
		padding-left: 4px;
		font-style: normal;
		font-weight: 500;
		font-size: 0.7rem;
		color: var(--muted);
	}
	.dot {
		flex: none;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--c);
	}
	.act {
		flex: none;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 6px;
		background: none;
		color: var(--muted);
	}
	.act:hover {
		background: var(--surface-2);
		color: var(--ink);
	}
	.empty {
		color: var(--line);
		font-size: 0.8rem;
	}
</style>
