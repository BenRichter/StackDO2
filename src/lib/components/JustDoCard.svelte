<script lang="ts">
	import type { ScoredTask } from '$lib/utils/scoring';
	import { BABYSTEP_LIMIT } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { finishTask } from '$lib/stores/actions';
	import { fmtClock, fmtDuration, loggedMinutes } from '$lib/utils/time';
	import Icon from './Icon.svelte';
	import TaskMeta from './TaskMeta.svelte';

	let { item }: { item: ScoredTask } = $props();

	// Done effects – short and crisp, not a circus
	const FX = ['glow', 'squash', 'burn', 'hammer'] as const;
	let fx = $state<(typeof FX)[number] | null>(null);

	function done() {
		if (fx) return;
		if (!app.settings.animations) return finishTask(task.id);
		fx = FX[Math.floor(Math.random() * FX.length)];
		setTimeout(() => finishTask(task.id), 520);
	}

	const task = $derived(item.task);
	const running = $derived(app.timer?.taskId === task.id);
	const thread = $derived(app.thread(task.threadId));

	let tick = $state(Date.now());
	let showWhy = $state(false);
	let showNotes = $state(false);

	$effect(() => {
		if (!running) return;
		const i = setInterval(() => (tick = Date.now()), 1000);
		return () => clearInterval(i);
	});

	const elapsedMs = $derived.by(() => {
		void tick;
		return loggedMinutes(task.timeLog, new Date()) * 60000;
	});
	const estimateMs = $derived(task.estimate * 60000);
	const progress = $derived(Math.min(1, elapsedMs / estimateMs));
	const over = $derived(elapsedMs > estimateMs);

	// gentle buzz once when the estimate runs out
	let buzzed = $state<string | null>(null);
	$effect(() => {
		if (running && over && buzzed !== task.id) {
			buzzed = task.id;
			navigator.vibrate?.([80, 60, 80]);
		}
	});
</script>

<article class="card fx-{fx}" class:running class:lefty={app.settings.leftHanded} style:--c={thread?.color}>
	<div class="shine" aria-hidden="true"></div>
	<header>
		<span class="kicker">
			{#if running}Läuft{:else}Jetzt dran{/if}
			{#if thread}<span class="dot"></span>{thread.name}{/if}
		</span>
		<button class="icon-btn" onclick={() => (showWhy = !showWhy)} aria-label="Warum diese Aufgabe?" aria-expanded={showWhy}>
			<Icon name="info" size={18} />
		</button>
	</header>

	<h2>{task.title}</h2>
	<TaskMeta {task} showThread={false} />
	{#if thread?.goal?.text}
		<p class="why-goal"><Icon name="target" size={14} /> Wofür: {thread.goal.text}</p>
	{/if}

	{#if showWhy}
		<div class="why">
			<strong>Score {item.score}</strong>
			{#each item.parts as p (p.label)}
				<span>{p.label} {p.value > 0 ? '+' : ''}{p.value}</span>
			{/each}
		</div>
	{/if}

	{#if task.notes}
		<button class="notes" class:open={showNotes} onclick={() => (showNotes = !showNotes)}>{task.notes}</button>
	{/if}

	{#if task.estimate > BABYSTEP_LIMIT}
		<div class="babysteps">
			<Icon name="alert" size={16} /> Zu groß für einen Schritt. Babysteps!
			<button class="btn ghost" onclick={() => app.split(task.id)}><Icon name="scissors" size={16} /> Aufteilen</button>
		</div>
	{/if}

	<div class="timer" aria-live="off">
		<div class="bar"><div class="fill" class:over style:width="{progress * 100}%"></div></div>
		<div class="times">
			<span class="clock">{fmtClock(elapsedMs)}</span>
			<span class="est">
				{#if over}+{fmtClock(elapsedMs - estimateMs)} über Schätzung{:else}noch {fmtClock(estimateMs - elapsedMs)} von {fmtDuration(task.estimate)}{/if}
			</span>
		</div>
	</div>

	<div class="actions">
		<button class="start" onclick={() => app.toggle(task.id)} aria-pressed={running}>
			<Icon name={running ? 'pause' : 'play'} size={22} fill />
			{running ? 'Pause' : 'Start'}
		</button>
		<button class="done" onclick={done}>
			<Icon name="check" size={22} /> Erledigt
		</button>
	</div>
	<div class="secondary">
		<button class="btn ghost" onclick={() => ui.open({ type: 'push', id: task.id })}>
			<Icon name="push" size={16} /> Später
		</button>
		<button class="btn ghost" onclick={() => ui.open({ type: 'task', id: task.id })}>
			<Icon name="edit" size={16} /> Bearbeiten
		</button>
	</div>
</article>

<style>
	.card {
		position: relative;
		overflow: hidden;
		padding: 16px 18px 12px;
		border-radius: 14px;
		background: var(--prime);
		color: var(--prime-ink);
		box-shadow:
			0 10px 30px -8px rgba(240, 83, 58, 0.55),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}
	.why-goal {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 10px 0 0;
		font-size: 0.85rem;
		font-weight: 600;
		opacity: 0.85;
	}
	/* done effects */
	.fx-glow {
		animation: glow 0.52s ease-out forwards;
	}
	@keyframes glow {
		40% {
			box-shadow: 0 0 0 6px #fff, 0 0 60px 20px #ffb347;
			filter: brightness(1.25);
		}
		100% {
			box-shadow: 0 0 0 0 #fff, 0 0 90px 40px transparent;
			opacity: 0;
			transform: scale(1.04);
		}
	}
	.fx-squash {
		transform-origin: bottom center;
		animation: squash 0.52s cubic-bezier(0.6, -0.3, 0.7, 0.2) forwards;
	}
	@keyframes squash {
		30% {
			transform: scale(1.04, 0.9);
		}
		100% {
			transform: scale(1.25, 0.02);
			opacity: 0.2;
		}
	}
	.fx-burn {
		animation: burn 0.52s ease-in forwards;
	}
	@keyframes burn {
		0% {
			filter: none;
		}
		50% {
			filter: sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.2);
		}
		100% {
			filter: sepia(1) saturate(6) brightness(0.2) blur(4px);
			opacity: 0;
			transform: translateY(-20px) scale(0.96);
			clip-path: inset(0 0 100% 0);
		}
	}
	.fx-hammer {
		animation: hammer 0.52s cubic-bezier(0.3, 1.6, 0.6, 1) forwards;
	}
	@keyframes hammer {
		0% {
			transform: rotate(0);
		}
		25% {
			transform: rotate(-3deg) translateY(-8px);
		}
		45% {
			transform: rotate(0) translateY(6px) scaleY(0.94);
		}
		100% {
			transform: translateY(120px) rotate(4deg);
			opacity: 0;
		}
	}
	.shine {
		position: absolute;
		inset: -40% -20% auto auto;
		width: 70%;
		height: 120%;
		background: radial-gradient(closest-side, rgba(255, 255, 255, 0.45), transparent);
		pointer-events: none;
		transform: rotate(20deg);
	}
	.card.running .shine {
		animation: shimmer 3.5s ease-in-out infinite;
	}
	@keyframes shimmer {
		50% {
			transform: translateX(-60%) rotate(20deg);
			opacity: 0.6;
		}
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	header .icon-btn {
		color: var(--prime-ink);
		opacity: 0.7;
	}
	header .icon-btn:hover {
		background: rgba(255, 255, 255, 0.25);
		color: var(--prime-ink);
	}
	.kicker {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--c, #fff);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.7);
		margin-left: 4px;
	}
	h2 {
		margin: 6px 0 10px;
		font-size: 1.45rem;
		line-height: 1.2;
		font-weight: 800;
		letter-spacing: -0.01em;
		overflow-wrap: anywhere;
	}
	.card :global(.badge) {
		background: rgba(255, 255, 255, 0.55);
		color: var(--prime-ink);
	}
	.why {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
		margin-top: 10px;
		font-size: 0.78rem;
		padding: 8px 10px;
		background: rgba(255, 255, 255, 0.35);
		border-radius: 6px;
	}
	.notes {
		display: block;
		width: 100%;
		margin-top: 10px;
		padding: 0;
		border: 0;
		background: none;
		text-align: left;
		font-size: 0.88rem;
		line-height: 1.4;
		white-space: pre-wrap;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.notes.open {
		display: block;
	}
	.babysteps {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 10px;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.babysteps .btn {
		margin-left: auto;
		color: var(--prime-ink);
		padding: 6px 8px;
	}
	.timer {
		margin-top: 14px;
	}
	.bar {
		height: 6px;
		background: rgba(255, 255, 255, 0.4);
		border-radius: 3px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--prime-ink);
		transition: width 1s linear;
	}
	.fill.over {
		background: #8b0000;
	}
	.times {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-top: 6px;
	}
	.clock {
		font-size: 1.6rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.est {
		font-size: 0.78rem;
		font-weight: 600;
		opacity: 0.85;
	}
	.actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-top: 12px;
	}
	.lefty .actions {
		direction: rtl;
	}
	.actions button {
		direction: ltr;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 54px;
		border: 0;
		border-radius: 10px;
		font-size: 1.05rem;
		font-weight: 800;
	}
	.start {
		background: rgba(255, 255, 255, 0.9);
		color: var(--prime-ink);
	}
	.start[aria-pressed='true'] {
		background: rgba(255, 255, 255, 0.55);
	}
	.done {
		background: var(--prime-ink);
		color: #fff;
	}
	.actions button:active {
		transform: scale(0.97);
	}
	.secondary {
		display: flex;
		justify-content: space-between;
		margin-top: 6px;
	}
	.lefty .secondary {
		flex-direction: row-reverse;
	}
	.secondary .btn {
		color: var(--prime-ink);
		padding: 8px 6px;
	}
</style>
