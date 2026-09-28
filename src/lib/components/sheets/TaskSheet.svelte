<script lang="ts">
	import type { Recurrence, Task } from '$lib/types';
	import { BABYSTEP_LIMIT, ESTIMATE_PRESETS, RECURRENCE_LABELS, TAG_PRESETS } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { parseQuick } from '$lib/utils/parse';
	import { estimationFactor, predictDuration } from '$lib/utils/predict';
	import { addDays, dateKey, fmtDuration, loggedMinutes } from '$lib/utils/time';
	import BottomSheet from './BottomSheet.svelte';
	import Icon from '../Icon.svelte';

	let { id, threadId: presetThread }: { id?: string; threadId?: string } = $props();

	const existing = app.tasks.find((t) => t.id === id);
	const isEdit = !!existing;

	let title = $state(existing?.title ?? '');
	// svelte-ignore state_referenced_locally
	let threadId = $state(existing?.threadId ?? presetThread ?? app.settings.lastThreadId ?? app.activeThreads[0]?.id);
	let importance = $state(existing?.importance ?? 3);
	let estimate = $state(existing?.estimate ?? 15);
	let dueDate = $state(existing?.dueDate ?? '');
	let dueTime = $state(existing?.dueTime ?? '');
	let recurrence = $state<Recurrence>(existing?.recurrence ?? 'none');
	let tags = $state<string[]>([...(existing?.tags ?? [])]);
	let notes = $state(existing?.notes ?? '');
	let customTag = $state('');
	let titleEl = $state<HTMLInputElement>();
	let focused = $state(false);

	$effect(() => {
		if (!isEdit) titleEl?.focus();
	});

	const parsed = $derived(parseQuick(title, app.threads));
	const hasTokens = $derived(parsed.title !== title.trim());

	const allTags = $derived([...new Set([...TAG_PRESETS, ...app.tags, ...tags])]);

	/** Drop-up with defaults from earlier tasks ("Standard-Aufgaben"). */
	const suggestions = $derived.by(() => {
		const q = parsed.title.toLowerCase();
		if (isEdit || q.length < 2) return [];
		const seen = new Set<string>();
		const out: { title: string; threadId: string; tags: string[]; estimate: number; importance?: number }[] = [];
		const pool = [
			...[...app.history].reverse().map((h) => ({ ...h, estimate: h.actual, importance: undefined as number | undefined })),
			...app.tasks.map((t) => ({ ...t }))
		];
		for (const s of pool) {
			const key = s.title.toLowerCase();
			if (!key.includes(q) || key === q || seen.has(key)) continue;
			seen.add(key);
			out.push({ title: s.title, threadId: s.threadId, tags: s.tags, estimate: s.estimate, importance: s.importance });
			if (out.length >= 4) break;
		}
		return out;
	});

	function applySuggestion(s: (typeof suggestions)[number]) {
		title = s.title;
		if (app.thread(s.threadId)) threadId = s.threadId;
		tags = [...s.tags];
		estimate = s.estimate;
		if (s.importance) importance = s.importance;
		titleEl?.focus();
	}

	const prediction = $derived(predictDuration(parsed.title, [...tags, ...parsed.tags], app.history));
	const factor = $derived(estimationFactor(app.history));

	function toggleTag(tag: string) {
		tags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
	}

	function addCustomTag() {
		const t = customTag.trim().replace(/^#/, '').toLowerCase();
		if (t && !tags.includes(t)) tags = [...tags, t];
		customTag = '';
	}

	const today = dateKey();
	const dueChips = [
		{ label: 'Keins', value: '' },
		{ label: 'Heute', value: today },
		{ label: 'Morgen', value: dateKey(addDays(new Date(), 1)) },
		{ label: '+1 Woche', value: dateKey(addDays(new Date(), 7)) }
	];

	function save(close = true) {
		const p = parsed;
		const cleanTitle = p.title || title.trim();
		if (!cleanTitle) return;
		const data: Partial<Task> & { title: string } = {
			title: cleanTitle,
			threadId: p.threadId ?? threadId,
			importance: p.importance ?? importance,
			estimate: Math.max(1, p.estimate ?? estimate),
			dueDate: (p.dueDate ?? dueDate) || undefined,
			dueTime: (p.dueTime ?? dueTime) || undefined,
			recurrence,
			tags: [...new Set([...tags, ...p.tags])],
			notes: notes.trim() || undefined
		};
		if (data.recurrence !== 'none' && !data.dueDate) data.dueDate = today;
		if (existing) app.updateTask(existing.id, data);
		else app.addTask(data);
		if (close) ui.close();
		else {
			title = '';
			notes = '';
			tags = [];
			titleEl?.focus();
			ui.notify('Hinzugefügt');
		}
	}

	function remove() {
		if (!existing) return;
		const snapshot = $state.snapshot(existing) as Task;
		app.deleteTask(existing.id);
		ui.close();
		ui.notify('Gelöscht', { label: 'Rückgängig', run: () => app.tasks.push(snapshot) });
	}
</script>

<BottomSheet title={isEdit ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			save();
		}}
	>
		<div class="title-wrap">
			{#if focused && suggestions.length}
				<ul class="dropup" role="listbox" aria-label="Vorlagen">
					{#each suggestions as s (s.title)}
						<li>
							<button type="button" onmousedown={(e) => e.preventDefault()} onclick={() => applySuggestion(s)}>
								<span class="dot" style:background={app.thread(s.threadId)?.color}></span>
								<span class="s-title">{s.title}</span>
								<span class="badge">{fmtDuration(s.estimate)}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<input
				bind:this={titleEl}
				bind:value={title}
				onfocus={() => (focused = true)}
				onblur={() => (focused = false)}
				class="field title"
				placeholder="Was ist zu tun?  #tag !4 30m morgen +Strang"
				aria-label="Titel"
				enterkeyhint="done"
			/>
		</div>
		{#if hasTokens}
			<div class="parsed row">
				<span class="badge">erkannt:</span>
				{#if parsed.threadId}<span class="badge">+{app.thread(parsed.threadId)?.name}</span>{/if}
				{#each parsed.tags as t (t)}<span class="badge">#{t}</span>{/each}
				{#if parsed.importance}<span class="badge">!{parsed.importance}</span>{/if}
				{#if parsed.estimate}<span class="badge">{fmtDuration(parsed.estimate)}</span>{/if}
				{#if parsed.dueDate}<span class="badge">{parsed.dueDate}</span>{/if}
				{#if parsed.dueTime}<span class="badge">{parsed.dueTime}</span>{/if}
			</div>
		{/if}

		<span class="label">Strang</span>
		<div class="row">
			{#each app.activeThreads as th (th.id)}
				<button type="button" class="chip th" style:--c={th.color} aria-pressed={(parsed.threadId ?? threadId) === th.id} onclick={() => (threadId = th.id)}>
					<span class="dot" style:background={th.color}></span>{th.name}
				</button>
			{/each}
		</div>

		<span class="label">Wichtig</span>
		<div class="row">
			{#each [1, 2, 3, 4, 5] as n (n)}
				<button type="button" class="chip num" aria-pressed={(parsed.importance ?? importance) === n} onclick={() => (importance = n)}>{n}</button>
			{/each}
			<span class="hint">{['', 'egal', 'nice', 'normal', 'wichtig', 'essenziell'][parsed.importance ?? importance]}</span>
		</div>

		<span class="label">Dauer</span>
		<div class="row">
			{#each ESTIMATE_PRESETS as m (m)}
				<button type="button" class="chip" aria-pressed={(parsed.estimate ?? estimate) === m} onclick={() => (estimate = m)}>{fmtDuration(m)}</button>
			{/each}
			<input type="number" min="1" class="field num-in" bind:value={estimate} aria-label="Minuten" />
		</div>
		{#if prediction && Math.abs(prediction.minutes - estimate) >= 5}
			<button type="button" class="hint-btn" onclick={() => (estimate = prediction.minutes)}>
				<Icon name="chart" size={14} /> Erfahrung: ~{fmtDuration(prediction.minutes)} ({prediction.basis} ähnliche) – übernehmen
			</button>
		{:else if factor && factor > 1.15}
			<button type="button" class="hint-btn" onclick={() => (estimate = Math.round((estimate * factor) / 5) * 5)}>
				<Icon name="chart" size={14} /> Du brauchst meist ×{factor.toFixed(1)} – realistisch {fmtDuration(Math.round((estimate * factor) / 5) * 5)}
			</button>
		{/if}
		{#if (parsed.estimate ?? estimate) > BABYSTEP_LIMIT}
			<p class="warn"><Icon name="alert" size={14} /> Über 2h – teil das in Babysteps.
				{#if existing}<button type="button" class="btn ghost" onclick={() => { save(false); app.split(existing.id); ui.close(); }}><Icon name="scissors" size={14} /> Aufteilen</button>{/if}
			</p>
		{/if}

		<span class="label">Fällig</span>
		<div class="row">
			{#each dueChips as c (c.label)}
				<button type="button" class="chip" aria-pressed={dueDate === c.value} onclick={() => (dueDate = c.value)}>{c.label}</button>
			{/each}
		</div>
		<div class="row two">
			<input type="date" class="field" bind:value={dueDate} aria-label="Datum" />
			<input type="time" class="field" bind:value={dueTime} aria-label="Uhrzeit" />
		</div>

		<span class="label">Wiederholen</span>
		<div class="row">
			{#each Object.entries(RECURRENCE_LABELS) as [k, label] (k)}
				<button type="button" class="chip" aria-pressed={recurrence === k} onclick={() => (recurrence = k as Recurrence)}>{label}</button>
			{/each}
		</div>
		{#if recurrence !== 'none'}<p class="hint">Mit Uhrzeit = Gewohnheit: erscheint ab dieser Zeit im Stapel.</p>{/if}

		<span class="label">Tags (Batch)</span>
		<div class="row">
			{#each allTags as t (t)}
				<button type="button" class="chip" aria-pressed={tags.includes(t) || parsed.tags.includes(t)} onclick={() => toggleTag(t)}>#{t}</button>
			{/each}
			<input
				class="field tag-in"
				placeholder="+ tag"
				bind:value={customTag}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						addCustomTag();
					}
				}}
				onblur={addCustomTag}
				aria-label="Neuer Tag"
			/>
		</div>

		<span class="label">Notiz</span>
		<textarea class="field" rows="3" bind:value={notes} placeholder="Details, Links, nächster Schritt …"></textarea>

		{#if existing}
			<div class="history">
				<span class="label">Verlauf</span>
				<p>Erstellt {new Date(existing.createdAt).toLocaleDateString('de-DE')} · Zeit erfasst {fmtDuration(loggedMinutes(existing.timeLog))}</p>
				{#each existing.pushHistory as p, i (i)}
					<p>⏷ {new Date(p.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} → {new Date(p.until).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}{p.reason ? ` · ${p.reason}` : ''}</p>
				{/each}
			</div>
			<div class="row tools">
				<button type="button" class="btn" onclick={() => { app.duplicate(existing.id); ui.close(); ui.notify('Kopie angelegt'); }}><Icon name="copy" size={16} /> Kopieren</button>
				<button type="button" class="btn danger" onclick={remove}><Icon name="trash" size={16} /> Löschen</button>
			</div>
		{/if}

		<div class="submit">
			{#if !isEdit}
				<button type="button" class="btn" onclick={() => save(false)} disabled={!title.trim()}>+ Weitere</button>
			{/if}
			<button type="submit" class="btn primary" disabled={!title.trim()}>
				<Icon name="check" size={18} />{isEdit ? 'Speichern' : 'Auf den Stapel'}
			</button>
		</div>
	</form>
</BottomSheet>

<style>
	.title-wrap {
		position: relative;
		margin-top: 8px;
	}
	.title {
		font-size: 1.05rem;
		font-weight: 600;
		padding: 12px;
	}
	.dropup {
		position: absolute;
		left: 0;
		right: 0;
		bottom: calc(100% + 4px);
		margin: 0;
		padding: 4px;
		list-style: none;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 8px;
		box-shadow: var(--shadow);
		z-index: 2;
	}
	.dropup button {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px;
		border: 0;
		background: none;
		text-align: left;
		border-radius: 6px;
	}
	.dropup button:hover {
		background: var(--surface-2);
	}
	.s-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
	}
	.parsed {
		margin-top: 6px;
		gap: 4px;
	}
	.th[aria-pressed='true'] {
		background: var(--c);
		border-color: var(--c);
	}
	.th[aria-pressed='true'] .dot {
		background: #fff !important;
	}
	.num {
		min-width: 38px;
		justify-content: center;
	}
	.num-in {
		width: 80px;
		padding: 6px 8px;
	}
	.tag-in {
		width: 90px;
		padding: 6px 8px;
		border-radius: 999px;
	}
	.two {
		margin-top: 6px;
		flex-wrap: nowrap;
	}
	.hint {
		font-size: 0.78rem;
		color: var(--muted);
		margin: 6px 0 0;
	}
	.hint-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		padding: 6px 8px;
		border: 1px dashed var(--blue);
		border-radius: 6px;
		background: none;
		color: var(--blue);
		font-size: 0.8rem;
		font-weight: 600;
	}
	.warn {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 8px 0 0;
		color: #8a6100;
		font-size: 0.85rem;
		font-weight: 600;
	}
	textarea {
		resize: vertical;
	}
	.history p {
		margin: 2px 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.tools {
		margin-top: 12px;
	}
	.submit {
		position: sticky;
		bottom: -16px;
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin: 16px -16px -16px;
		padding: 12px 16px max(12px, env(safe-area-inset-bottom));
		background: var(--surface);
		border-top: 1px solid var(--line);
	}
	.submit .primary {
		flex: 1;
		min-height: 48px;
	}
	button:disabled {
		opacity: 0.5;
	}
</style>
