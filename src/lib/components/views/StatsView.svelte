<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { estimationFactor } from '$lib/utils/predict';
	import { addDays, dateKey, fmtDuration } from '$lib/utils/time';
	import { QUOTES } from '$lib/data/seed';

	let range = $state<7 | 30>(7);

	const days = $derived.by(() => {
		const out: { key: string; label: string; count: number; minutes: number }[] = [];
		for (let i = range - 1; i >= 0; i--) {
			const d = addDays(app.now, -i);
			out.push({
				key: dateKey(d),
				label: range === 7 ? d.toLocaleDateString('de-DE', { weekday: 'short' }) : String(d.getDate()),
				count: 0,
				minutes: 0
			});
		}
		const byKey = new Map(out.map((d) => [d.key, d]));
		for (const h of app.history) {
			const d = byKey.get(dateKey(new Date(h.completedAt)));
			if (d) {
				d.count++;
				d.minutes += h.actual;
			}
		}
		return out;
	});

	const inRange = $derived(app.history.filter((h) => new Date(h.completedAt) >= addDays(app.now, -range)));
	const total = $derived(days.reduce((s, d) => s + d.count, 0));
	const totalMin = $derived(days.reduce((s, d) => s + d.minutes, 0));
	const maxCount = $derived(Math.max(1, ...days.map((d) => d.count)));
	const activeDays = $derived(days.filter((d) => d.count).length);

	const perThread = $derived.by(() => {
		const m = new Map<string, number>();
		for (const h of inRange) m.set(h.threadId, (m.get(h.threadId) ?? 0) + h.actual);
		const max = Math.max(1, ...m.values());
		return app.threads
			.filter((t) => m.has(t.id))
			.map((t) => ({ th: t, minutes: m.get(t.id)!, share: m.get(t.id)! / max, factor: estimationFactor(inRange.filter((h) => h.threadId === t.id)) }))
			.sort((a, b) => b.minutes - a.minutes);
	});

	const factor = $derived(estimationFactor(app.history));
	const misses = $derived(
		[...inRange]
			.filter((h) => h.estimate > 0)
			.sort((a, b) => b.actual / b.estimate - a.actual / a.estimate)
			.slice(0, 3)
			.filter((h) => h.actual > h.estimate * 1.2)
	);

	const tip = QUOTES[new Date().getDate() % QUOTES.length];
</script>

<section class="stats">
	<div class="seg" role="tablist">
		<button role="tab" aria-selected={range === 7} onclick={() => (range = 7)}>Woche</button>
		<button role="tab" aria-selected={range === 30} onclick={() => (range = 30)}>Monat</button>
	</div>

	<div class="kpis">
		<div><strong>{total}</strong><span>erledigt</span></div>
		<div><strong>{fmtDuration(totalMin)}</strong><span>erfasst</span></div>
		<div><strong>{activeDays}/{range}</strong><span>aktive Tage</span></div>
	</div>

	<figure class="card">
		<figcaption>Erledigte Aufgaben pro Tag</figcaption>
		<div class="bars" class:dense={range === 30}>
			{#each days as d (d.key)}
				<div class="col" title="{d.key}: {d.count} erledigt · {fmtDuration(d.minutes)}">
					<span class="val">{d.count || ''}</span>
					<div class="bar" style:height="{(d.count / maxCount) * 100}%" class:today={d.key === dateKey(app.now)}></div>
					<span class="lbl">{d.label}</span>
				</div>
			{/each}
		</div>
	</figure>

	<figure class="card">
		<figcaption>Zeit pro Strang</figcaption>
		{#each perThread as p (p.th.id)}
			<div class="hbar" title="{p.th.name}: {fmtDuration(p.minutes)}">
				<span class="name"><span class="dot" style:background={p.th.color}></span>{p.th.name}</span>
				<div class="track"><div style:width="{p.share * 100}%" style:background={p.th.color}></div></div>
				<span class="num">{fmtDuration(p.minutes)}</span>
			</div>
		{:else}
			<p class="muted">Noch nichts erledigt in diesem Zeitraum.</p>
		{/each}
	</figure>

	<figure class="card">
		<figcaption>Schätzung vs. Realität</figcaption>
		{#if factor}
			<p class="big">×{factor.toFixed(2)}</p>
			<p class="muted">
				{#if factor > 1.1}Du brauchst im Schnitt {Math.round((factor - 1) * 100)}% länger als geschätzt. Die Prognose beim Anlegen rechnet das ein.
				{:else if factor < 0.9}Du bist schneller als du denkst – schätz ruhig knapper.
				{:else}Deine Schätzungen sind ziemlich genau. Stark.{/if}
			</p>
			{#each perThread.filter((p) => p.factor) as p (p.th.id)}
				<p class="row-f"><span class="dot" style:background={p.th.color}></span>{p.th.name}<b>×{p.factor!.toFixed(2)}</b></p>
			{/each}
			{#if misses.length}
				<p class="sub">Am meisten unterschätzt</p>
				{#each misses as h (h.taskId + h.completedAt)}
					<p class="row-f">{h.title}<b>{fmtDuration(h.estimate)} → {fmtDuration(h.actual)}</b></p>
				{/each}
			{/if}
		{:else}
			<p class="muted">Ab 3 erledigten Aufgaben siehst du hier, wie gut du schätzt. Tipp: ▶ Start drücken, dann misst StackDO die echte Zeit.</p>
		{/if}
	</figure>

	{#if app.settings.quotes}
		<blockquote>{tip}</blockquote>
	{/if}
</section>

<style>
	.stats {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.seg {
		display: flex;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 8px;
		padding: 3px;
		align-self: flex-start;
	}
	.seg button {
		border: 0;
		background: none;
		padding: 6px 14px;
		border-radius: 6px;
		font-weight: 600;
		color: var(--muted);
	}
	.seg button[aria-selected='true'] {
		background: var(--ink);
		color: var(--surface);
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
		font-size: 1.2rem;
	}
	.kpis span,
	.muted {
		font-size: 0.78rem;
		color: var(--muted);
	}
	.card {
		margin: 0;
		padding: 12px;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}
	figcaption {
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		margin-bottom: 10px;
	}
	.bars {
		display: flex;
		align-items: stretch;
		gap: 2px;
		height: 140px;
	}
	.col {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		min-width: 0;
	}
	.bar {
		width: 70%;
		max-width: 28px;
		min-height: 1px;
		background: var(--blue);
		border-radius: 4px 4px 0 0;
	}
	.bar.today {
		background: var(--prime-solid);
	}
	.col:hover .bar {
		filter: brightness(1.15);
	}
	.val,
	.lbl {
		font-size: 0.68rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.lbl {
		margin-top: 4px;
		border-top: 1px solid var(--line);
		width: 100%;
		text-align: center;
		padding-top: 2px;
	}
	.dense .val {
		visibility: hidden;
	}
	.dense .col:hover .val {
		visibility: visible;
	}
	.dense .lbl {
		font-size: 0.55rem;
	}
	.hbar {
		display: grid;
		grid-template-columns: minmax(0, 8.5em) 1fr auto;
		align-items: center;
		gap: 8px;
		margin: 6px 0;
		font-size: 0.85rem;
	}
	.name {
		display: flex;
		align-items: center;
		gap: 6px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.dot {
		flex: none;
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.track {
		height: 10px;
		background: var(--surface-2);
	}
	.track div {
		height: 100%;
		border-radius: 0 4px 4px 0;
	}
	.num {
		font-variant-numeric: tabular-nums;
		color: var(--muted);
		font-size: 0.8rem;
	}
	.big {
		margin: 0;
		font-size: 2rem;
		font-weight: 800;
	}
	.sub {
		margin: 12px 0 4px;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--muted);
	}
	.row-f {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 4px 0;
		font-size: 0.85rem;
	}
	.row-f b {
		margin-left: auto;
		font-variant-numeric: tabular-nums;
	}
	blockquote {
		margin: 4px 0;
		padding: 10px 14px;
		border-left: 3px solid var(--green);
		color: var(--muted);
		font-style: italic;
	}
</style>
