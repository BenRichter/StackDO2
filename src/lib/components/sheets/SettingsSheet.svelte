<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { buildIcs, download } from '$lib/utils/ics';
	import { dateKey } from '$lib/utils/time';
	import BottomSheet from './BottomSheet.svelte';
	import Icon from '../Icon.svelte';

	let fileInput = $state<HTMLInputElement>();

	const standalone =
		matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
	const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

	async function install() {
		await ui.installPrompt?.prompt();
		ui.installPrompt = null;
	}

	function exportJson() {
		download(`stackdo-${dateKey()}.json`, JSON.stringify(app.snapshot(), null, 2), 'application/json');
	}

	function exportIcs() {
		download(`stackdo-${dateKey()}.ics`, buildIcs(app.tasks, app.dayPlan.plan), 'text/calendar');
	}

	async function importJson(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		try {
			app.importData(await file.text());
			ui.notify('Backup geladen');
			ui.close();
		} catch (err) {
			alert(`Import fehlgeschlagen: ${(err as Error).message}`);
		}
	}
</script>

<BottomSheet title="Menü">
	<span class="label">App</span>
	{#if standalone}
		<p class="ok"><Icon name="check" size={16} /> Als App installiert – läuft auch offline.</p>
	{:else if ui.installPrompt}
		<button class="btn primary wide" onclick={install}><Icon name="install" size={18} /> App installieren</button>
		<p class="hint">Eigenes Icon auf dem Homescreen, eigenes Fenster, offline nutzbar. Lange drücken auf das Icon: „Neue Aufgabe“ direkt.</p>
	{:else if ios}
		<p class="hint">Installieren: in Safari <b>Teilen</b> → <b>Zum Home-Bildschirm</b>.</p>
	{:else}
		<p class="hint">Installieren: im Browser-Menü <b>App installieren</b> / <b>Zum Startbildschirm hinzufügen</b>. Funktioniert offline.</p>
	{/if}

	<span class="label">Arbeitszeit pro Tag</span>
	<div class="row">
		<input class="field sm" type="number" min="1" max="16" bind:value={app.settings.workHours} /> Stunden
	</div>
	<p class="hint">Zeitfenster pro Strang (z.B. Arbeit 8–17 Uhr) stellst du im Tab „Stränge“ ein.</p>

	<span class="label">Wachzeit (Tagesuhr)</span>
	<div class="row nowrap">
		<input class="field" type="time" bind:value={app.settings.dayStart} aria-label="Tagesbeginn" />
		–
		<input class="field" type="time" bind:value={app.settings.dayEnd} aria-label="Tagesende" />
	</div>

	<span class="label">Bedienung</span>
	<label class="switch"><input type="checkbox" bind:checked={app.settings.leftHanded} /> Linkshänder (Erledigt links)</label>
	<label class="switch"><input type="checkbox" bind:checked={app.settings.animations} /> Erledigt-Animationen</label>
	<label class="switch"><input type="checkbox" bind:checked={app.settings.quotes} /> Zitate & Tipps</label>
	<label class="switch"><input type="checkbox" bind:checked={app.settings.hideRecurring} /> Wiederkehrende ausblenden</label>

	<span class="label">Aufräumen</span>
	<div class="row">
		Erledigte löschen nach <input class="field sm" type="number" min="1" bind:value={app.settings.cleanupDays} /> Tagen
	</div>
	<p class="hint">Statistik & Zeit-Prognosen bleiben erhalten.</p>

	<span class="label">Daten</span>
	<div class="row">
		<button class="btn" onclick={exportIcs}><Icon name="calendar" size={16} /> Kalender (.ics)</button>
		<button class="btn" onclick={exportJson}><Icon name="download" size={16} /> Backup</button>
		<button class="btn" onclick={() => fileInput?.click()}><Icon name="upload" size={16} /> Import</button>
		<input bind:this={fileInput} type="file" accept="application/json" hidden onchange={importJson} />
	</div>
	<p class="hint">Alles bleibt lokal auf diesem Gerät (offline). Kein Konto, kein Server.</p>

	<div class="row danger-zone">
		<button class="btn" onclick={() => { app.restartTutorial(); ui.close(); ui.tab = 'stack'; }}>Tutorial neu starten</button>
		<button class="btn danger" onclick={() => confirm('Wirklich alles löschen?') && (app.reset(), ui.close())}>Alles zurücksetzen</button>
	</div>
</BottomSheet>

<style>
	.wide {
		width: 100%;
		min-height: 48px;
	}
	.ok {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		color: var(--green);
		font-weight: 600;
	}
	.sm {
		width: 72px;
		padding: 6px 8px;
	}
	.nowrap {
		flex-wrap: nowrap;
	}
	.switch {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 6px 0;
		font-size: 0.92rem;
	}
	.hint {
		margin: 6px 0 0;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.danger-zone {
		margin-top: 24px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
</style>
