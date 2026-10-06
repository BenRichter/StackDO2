<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { fmtDuration, hmToMin, minToHm, minutesOfDay } from '$lib/utils/time';
	import type { Block } from '$lib/utils/plan';

	const plan = $derived(app.dayPlan);
	const nowMin = $derived(minutesOfDay(app.now));

	const C = 160; // center
	// ring radii
	const R_BLOCK = 138;
	const R_PLAN = 112;
	const R_DONE = 88;

	const angle = (min: number) => (min / 1440) * 2 * Math.PI - Math.PI / 2;
	const pt = (min: number, r: number) => [C + r * Math.cos(angle(min)), C + r * Math.sin(angle(min))];

	function arc(start: number, end: number, r: number) {
		const e = Math.min(end, start + 1439.9);
		const [x1, y1] = pt(start, r);
		const [x2, y2] = pt(e, r);
		const large = e - start > 720 ? 1 : 0;
		return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
	}

	const sleep = $derived.by(() => {
		const s = hmToMin(app.settings.dayEnd);
		const e = hmToMin(app.settings.dayStart);
		return s > e ? [{ start: s, end: 1440 }, { start: 0, end: e }] : [{ start: s, end: e }];
	});

	const load = $derived(plan.freeMinutes ? plan.plannedMinutes / plan.freeMinutes : 0);
	const hand = $derived(pt(nowMin, 150));

	/** agenda: merge split pieces of the same task */
	const agenda = $derived.by(() => {
		const out: Block[] = [];
		for (const b of [...plan.plan].sort((a, b) => a.start - b.start)) {
			const prev = out.at(-1);
			if (prev && prev.taskId === b.taskId) prev.end = b.end;
			else out.push({ ...b });
		}
		return out;
	});

	const workMinutes = $derived.by(() => {
		const workIds = new Set(app.threads.filter((t) => t.window).map((t) => t.id));
		return plan.done.filter((b) => b.taskId && workIds.has(app.tasks.find((t) => t.id === b.taskId)?.threadId ?? '')).reduce((s, b) => s + b.end - b.start, 0);
	});
</script>

<section class="day">
	<div class="clock-wrap">
		<svg viewBox="0 0 320 320" role="img" aria-label="Tagesuhr">
			<circle cx={C} cy={C} r="152" class="face" />
			{#each sleep as s, i (i)}
				<path d={arc(s.start, s.end, R_PLAN)} class="sleep" />
			{/each}
			{#each Array.from({ length: 24 }, (_, h) => h) as h (h)}
				{@const [x1, y1] = pt(h * 60, 150)}
				{@const [x2, y2] = pt(h * 60, h % 6 ? 145 : 140)}
				<line {x1} {y1} {x2} {y2} class="tick" />
				{#if h % 3 === 0}
					{@const [tx, ty] = pt(h * 60, 128)}
					<text x={tx} y={ty} class="hour">{h}</text>
				{/if}
			{/each}
			{#each plan.blockers as b, i (i)}
				<path d={arc(b.start, b.end, R_BLOCK)} stroke={b.color} class="blocker"><title>{b.label} {minToHm(b.start)}–{minToHm(b.end)}</title></path>
			{/each}
			{#each plan.plan as b, i (i)}
				<path d={arc(b.start, b.end, R_PLAN)} stroke={b.color} class="plan"><title>{minToHm(b.start)} {b.label}</title></path>
			{/each}
			{#each plan.done as b, i (i)}
				<path d={arc(b.start, b.end, R_DONE)} stroke={b.color} class="done"><title>✓ {b.label}</title></path>
			{/each}
			<line x1={C} y1={C} x2={hand[0]} y2={hand[1]} class="hand" />
			<circle cx={C} cy={C} r="4" class="pin" />
			<text x={C} y={C - 16} class="center big">{minToHm(nowMin)}</text>
			<text x={C} y={C + 6} class="center">{fmtDuration(plan.freeMinutes)} frei</text>
			<text x={C} y={C + 24} class="center" class:over={load > 1}>{Math.round(load * 100)}% verplant</text>
		</svg>
		<ul class="legend">
			<li><span class="sw blocker-sw"></span>Blocker</li>
			<li><span class="sw plan-sw"></span>Plan ab jetzt</li>
			<li><span class="sw done-sw"></span>Gemacht (Timer)</li>
		</ul>
	</div>

	<div class="kpis">
		<div><strong>{app.doneToday.length}</strong><span>erledigt</span></div>
		<div><strong>{fmtDuration(plan.doneMinutes)}</strong><span>fokussiert</span></div>
		<div><strong>{fmtDuration(workMinutes)}</strong><span>von {app.settings.workHours}h Arbeit</span></div>
	</div>

	{#if load > 1}
		<p class="warning">Mehr geplant als Zeit da ist. {plan.overflow.length} Aufgaben passen heute nicht mehr – ist okay, der Stapel sortiert morgen neu.</p>
	{/if}

	<h3>Plan</h3>
	<ol class="agenda">
		{#each agenda as b, i (i)}
			<li style:--c={b.color}>
				<button onclick={() => b.taskId && ui.open({ type: 'task', id: b.taskId })}>
					<time>{minToHm(b.start)}</time>
					<span>{b.label}</span>
					<em>{fmtDuration(b.end - b.start)}</em>
				</button>
			</li>
		{:else}
			<li class="none">Nichts mehr geplant für heute.</li>
		{/each}
	</ol>
	{#if plan.overflow.length}
		<p class="overflow">Passt nicht mehr: {plan.overflow.map((t) => t.title).join(', ')}</p>
	{/if}
</section>

<style>
	.day {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.clock-wrap {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 12px;
		box-shadow: var(--shadow);
	}
	svg {
		display: block;
		width: 100%;
		max-width: 360px;
		margin: 0 auto;
	}
	.face {
		fill: var(--surface-2);
	}
	.sleep {
		fill: none;
		stroke: var(--line);
		stroke-width: 70;
		opacity: 0.5;
	}
	.tick {
		stroke: var(--muted);
		stroke-width: 1;
	}
	.hour {
		font-size: 11px;
		fill: var(--muted);
		text-anchor: middle;
		dominant-baseline: middle;
	}
	.blocker {
		fill: none;
		stroke-width: 10;
		opacity: 0.35;
	}
	.plan {
		fill: none;
		stroke-width: 18;
		opacity: 0.85;
	}
	.done {
		fill: none;
		stroke-width: 12;
		stroke-dasharray: 3 2;
	}
	.hand {
		stroke: var(--prime-solid);
		stroke-width: 3;
		stroke-linecap: round;
	}
	.pin {
		fill: var(--prime-solid);
	}
	.center {
		text-anchor: middle;
		font-size: 11px;
		fill: var(--muted);
		font-weight: 600;
	}
	.center.big {
		font-size: 22px;
		fill: var(--ink);
		font-weight: 800;
	}
	.center.over {
		fill: var(--red);
	}
	.legend {
		display: flex;
		justify-content: center;
		gap: 14px;
		list-style: none;
		padding: 0;
		margin: 8px 0 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.sw {
		width: 14px;
		height: 6px;
		background: var(--blue);
	}
	.blocker-sw {
		opacity: 0.35;
	}
	.done-sw {
		background: repeating-linear-gradient(90deg, var(--blue) 0 3px, transparent 3px 5px);
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.kpis div {
		display: flex;
		flex-direction: column;
		padding: 10px;
		background: var(--surface);
		border-radius: 8px;
	}
	.kpis strong {
		font-size: 1.15rem;
	}
	.kpis span {
		font-size: 0.72rem;
		color: var(--muted);
	}
	.warning {
		margin: 0;
		padding: 10px 12px;
		border-left: 3px solid var(--red);
		background: var(--surface);
		font-size: 0.85rem;
	}
	h3 {
		margin: 8px 0 0;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.agenda {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.agenda button {
		display: flex;
		gap: 10px;
		align-items: baseline;
		width: 100%;
		padding: 10px 12px;
		border: 0;
		border-left: 4px solid var(--c);
		border-radius: 6px;
		background: var(--surface);
		text-align: left;
	}
	time {
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		color: var(--muted);
	}
	.agenda span {
		flex: 1;
		font-weight: 600;
	}
	em {
		font-style: normal;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.none,
	.overflow {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
