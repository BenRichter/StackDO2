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

	const task = $derived(item.task);
	const running = $derived(app.timer?.taskId === task.id);
	const thread = $derived(app.thread(task.threadId));

	// Done effects – short and crisp, not a circus
	const FX = ['glow', 'squash', 'burn', 'hammer'] as const;
	let fx = $state<(typeof FX)[number] | 'fly' | null>(null);

	function done(viaSwipe = false) {
		if (fx) return;
		if (!app.settings.animations && !viaSwipe) return finishTask(task.id);
		fx = viaSwipe ? 'fly' : FX[Math.floor(Math.random() * FX.length)];
		setTimeout(() => finishTask(task.id), viaSwipe ? 260 : 520);
	}

	// ── swipe: right = done, left = later ──────────────────
	const THRESHOLD = 110;
	let dx = $state(0);
	let dragging = $state(false);
	let startX = 0;
	let startY = 0;
	let horizontal: boolean | null = null;

	function down(e: PointerEvent) {
		if ((e.target as HTMLElement).closest('button, a, input')) return;
		dragging = true;
		horizontal = null;
		startX = e.clientX;
		startY = e.clientY;
	}
	function move(e: PointerEvent) {
		if (!dragging) return;
		const x = e.clientX - startX;
		const y = e.clientY - startY;
		if (horizontal === null && Math.abs(x) + Math.abs(y) > 8) {
			horizontal = Math.abs(x) > Math.abs(y);
			if (horizontal) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		}
		if (horizontal) dx = x;
	}
	function up() {
		if (!dragging) return;
		dragging = false;
		if (dx > THRESHOLD) {
			done(true);
			return;
		}
		if (dx < -THRESHOLD) ui.open({ type: 'push', id: task.id });
		dx = 0;
	}

	// ── timer ──────────────────────────────────────────────
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
	const started = $derived(elapsedMs > 0);

	// gentle buzz once when the estimate runs out
	let buzzed = $state<string | null>(null);
	$effect(() => {
		if (running && over && buzzed !== task.id) {
			buzzed = task.id;
			navigator.vibrate?.([80, 60, 80]);
		}
	});
</script>

<div class="swipe-zone">
	<span class="hint left" style:opacity={Math.min(1, dx / THRESHOLD)}><Icon name="check" size={22} /> Erledigt</span>
	<span class="hint right" style:opacity={Math.min(1, -dx / THRESHOLD)}>Später <Icon name="push" size={22} /></span>

	<article
		class="card fx-{fx}"
		class:running
		class:dragging
		class:lefty={app.settings.leftHanded}
		style:--c={thread?.color}
		style:transform={dx ? `translateX(${dx}px) rotate(${dx / 25}deg)` : undefined}
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
	>
		<div class="shine" aria-hidden="true"></div>
		<header>
			<span class="kicker">
				{#if thread}<span class="dot"></span>{thread.name}{/if}
				{#if running}<span class="live">läuft</span>{/if}
			</span>
			<button class="why-btn" onclick={() => (showWhy = !showWhy)} aria-label="Warum diese Aufgabe?" aria-expanded={showWhy}>
				<Icon name="info" size={18} />
			</button>
		</header>

		<h2>{task.title}</h2>
		<TaskMeta {task} showThread={false} />

		{#if showWhy}
			<div class="why">
				{#each item.parts as p (p.label)}
					<span>{p.label} <b>{p.value > 0 ? '+' : ''}{p.value}</b></span>
				{/each}
			</div>
		{/if}

		{#if thread?.goal?.text}
			<p class="goal"><Icon name="target" size={14} /> {thread.goal.text}</p>
		{/if}

		{#if task.notes}
			<button class="notes" class:open={showNotes} onclick={() => (showNotes = !showNotes)}>{task.notes}</button>
		{/if}

		{#if task.estimate > BABYSTEP_LIMIT}
			<button class="babysteps" onclick={() => app.split(task.id)}>
				<Icon name="scissors" size={15} /> Zu groß – in Babysteps aufteilen
			</button>
		{/if}

		{#if started || running}
			<div class="timer" aria-live="off">
				<span class="clock">{fmtClock(elapsedMs)}</span>
				<span class="est">{#if over}+{fmtClock(elapsedMs - estimateMs)} drüber{:else}noch {fmtClock(estimateMs - elapsedMs)}{/if}</span>
				<div class="bar"><div class="fill" class:over style:width="{progress * 100}%"></div></div>
			</div>
		{/if}

		<div class="actions">
			<button class="start" onclick={() => app.toggle(task.id)} aria-pressed={running}>
				<Icon name={running ? 'pause' : 'play'} size={20} fill />
				{running ? 'Pause' : started ? 'Weiter' : `Start · ${fmtDuration(task.estimate)}`}
			</button>
			<button class="done" onclick={() => done()} aria-label="Erledigt">
				<Icon name="check" size={24} />
			</button>
		</div>

		<footer>
			<button onclick={() => ui.open({ type: 'push', id: task.id })}>Später</button>
			<span class="swipe-tip" aria-hidden="true">← wischen →</span>
			<button onclick={() => ui.open({ type: 'task', id: task.id })}>Bearbeiten</button>
		</footer>
	</article>
</div>

<style>
	.swipe-zone {
		position: relative;
	}
	.hint {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 800;
		pointer-events: none;
	}
	.hint.left {
		left: 8px;
		color: var(--green);
	}
	.hint.right {
		right: 8px;
		color: var(--muted);
	}
	.card {
		position: relative;
		overflow: hidden;
		padding: 18px 20px 10px;
		border-radius: 24px;
		background: var(--prime);
		color: var(--prime-ink);
		box-shadow:
			0 18px 40px -16px rgba(255, 110, 60, 0.55),
			inset 0 1px 0 rgba(255, 255, 255, 0.6);
		touch-action: pan-y;
		user-select: none;
		transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2);
	}
	.card.dragging {
		transition: none;
	}
	.shine {
		position: absolute;
		inset: -40% -20% auto auto;
		width: 70%;
		height: 120%;
		background: radial-gradient(closest-side, rgba(255, 255, 255, 0.5), transparent);
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
		min-height: 28px;
	}
	.kicker {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-size: 0.82rem;
		font-weight: 700;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--c, #fff);
		box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
	}
	.live {
		padding: 1px 7px;
		border-radius: 2px;
		background: var(--prime-ink);
		color: #fff;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.why-btn {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--prime-ink);
		opacity: 0.55;
	}
	.why-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.3);
	}
	h2 {
		margin: 8px 0 8px;
		font-size: 1.6rem;
		line-height: 1.15;
		font-weight: 800;
		letter-spacing: -0.015em;
		overflow-wrap: anywhere;
	}
	.card :global(.meta) {
		color: var(--prime-ink);
		opacity: 0.75;
	}
	.why {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		margin-top: 10px;
		padding: 8px 10px;
		font-size: 0.78rem;
		background: rgba(255, 255, 255, 0.4);
		border-radius: 10px;
	}
	.goal {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 12px 0 0;
		font-size: 0.85rem;
		font-weight: 600;
		opacity: 0.8;
	}
	.notes {
		display: -webkit-box;
		width: 100%;
		margin-top: 10px;
		padding: 0;
		border: 0;
		background: none;
		text-align: left;
		font-size: 0.88rem;
		line-height: 1.45;
		white-space: pre-wrap;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		opacity: 0.85;
	}
	.notes.open {
		display: block;
	}
	.babysteps {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 12px;
		padding: 6px 10px;
		border: 0;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.5);
		color: var(--prime-ink);
		font-size: 0.82rem;
		font-weight: 700;
	}
	.timer {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: baseline;
		gap: 4px 10px;
		margin-top: 14px;
	}
	.clock {
		font-size: 1.9rem;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.est {
		font-size: 0.8rem;
		font-weight: 600;
		opacity: 0.8;
	}
	.bar {
		grid-column: 1 / -1;
		height: 4px;
		background: rgba(255, 255, 255, 0.45);
		border-radius: 2px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--prime-ink);
		transition: width 1s linear;
	}
	.fill.over {
		background: #a01b00;
	}
	.actions {
		display: grid;
		grid-template-columns: 1fr 60px;
		gap: 10px;
		margin-top: 16px;
	}
	.lefty .actions {
		grid-template-columns: 60px 1fr;
	}
	.lefty .done {
		order: -1;
	}
	.actions button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 56px;
		border: 0;
		border-radius: 16px;
		font-size: 1.05rem;
		font-weight: 800;
		transition: transform 0.1s;
	}
	.actions button:active {
		transform: scale(0.96);
	}
	.start {
		background: rgba(255, 255, 255, 0.92);
		color: var(--prime-ink);
	}
	.start[aria-pressed='true'] {
		background: rgba(255, 255, 255, 0.55);
	}
	.done {
		background: var(--prime-ink);
		color: #fff;
	}
	footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 6px;
	}
	.lefty footer {
		flex-direction: row-reverse;
	}
	footer button {
		padding: 8px 4px;
		border: 0;
		background: none;
		color: var(--prime-ink);
		font-size: 0.85rem;
		font-weight: 700;
		opacity: 0.7;
	}
	footer button:hover {
		opacity: 1;
	}
	.swipe-tip {
		font-size: 0.72rem;
		opacity: 0.45;
	}
	/* done effects */
	.fx-fly {
		transition: transform 0.26s ease-in, opacity 0.26s ease-in !important;
		transform: translateX(120%) rotate(12deg) !important;
		opacity: 0;
	}
	.fx-glow {
		animation: glow 0.52s ease-out forwards;
	}
	@keyframes glow {
		40% {
			box-shadow:
				0 0 0 6px #fff,
				0 0 60px 20px #ffc58a;
			filter: brightness(1.2);
		}
		100% {
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
		50% {
			filter: sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.2);
		}
		100% {
			filter: sepia(1) saturate(6) brightness(0.2) blur(4px);
			opacity: 0;
			transform: translateY(-20px) scale(0.96);
		}
	}
	.fx-hammer {
		animation: hammer 0.52s cubic-bezier(0.3, 1.6, 0.6, 1) forwards;
	}
	@keyframes hammer {
		25% {
			transform: rotate(-3deg) translateY(-8px);
		}
		45% {
			transform: translateY(6px) scaleY(0.94);
		}
		100% {
			transform: translateY(120px) rotate(4deg);
			opacity: 0;
		}
	}
</style>
