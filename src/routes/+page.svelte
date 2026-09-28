<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui, type Tab } from '$lib/stores/ui.svelte';
	import Icon, { type IconName } from '$lib/components/Icon.svelte';
	import AnimationCanvas from '$lib/components/AnimationCanvas.svelte';
	import StackView from '$lib/components/views/StackView.svelte';
	import DayView from '$lib/components/views/DayView.svelte';
	import ThreadsView from '$lib/components/views/ThreadsView.svelte';
	import StatsView from '$lib/components/views/StatsView.svelte';
	import TaskSheet from '$lib/components/sheets/TaskSheet.svelte';
	import PushSheet from '$lib/components/sheets/PushSheet.svelte';
	import DoneSheet from '$lib/components/sheets/DoneSheet.svelte';
	import ThreadSheet from '$lib/components/sheets/ThreadSheet.svelte';
	import SettingsSheet from '$lib/components/sheets/SettingsSheet.svelte';
	import { fly } from 'svelte/transition';

	const TABS: { id: Tab; label: string; icon: IconName }[] = [
		{ id: 'stack', label: 'Stapel', icon: 'stack' },
		{ id: 'day', label: 'Tag', icon: 'clock' },
		{ id: 'threads', label: 'Stränge', icon: 'threads' },
		{ id: 'stats', label: 'Statistik', icon: 'chart' }
	];

	let searchEl = $state<HTMLInputElement>();

	function done(id: string) {
		const task = app.tasks.find((t) => t.id === id);
		app.complete(id);
		if (app.settings.animations) ui.celebrate++;
		// tutorial finished → retire its thread
		if (task?.tutorial && !app.tasks.some((t) => t.tutorial && !t.completedAt)) {
			app.updateThread('tutorial', { archived: true });
			ui.notify('Tutorial durch. Ab jetzt: nicht wählen, machen.');
		}
		ui.open({ type: 'done', id });
	}

	function toggleSearch() {
		ui.searchOpen = !ui.searchOpen;
		if (ui.searchOpen) {
			ui.tab = 'stack';
			queueMicrotask(() => searchEl?.focus());
		} else app.search = '';
	}

	function onKey(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (ui.sheet || e.metaKey || e.ctrlKey || e.altKey || target.closest('input, textarea, select, [contenteditable]')) return;
		const top = app.stack.ready[0];
		if (e.key === 'n') {
			e.preventDefault();
			ui.open({ type: 'task' });
		} else if (e.key === '/') {
			e.preventDefault();
			if (!ui.searchOpen) toggleSearch();
			else searchEl?.focus();
		} else if (e.key === ' ' && top && ui.tab === 'stack' && target.tagName !== 'BUTTON') {
			e.preventDefault();
			app.toggle(top.task.id);
		} else if (e.key >= '1' && e.key <= '4') {
			ui.tab = TABS[Number(e.key) - 1].id;
		}
	}
</script>

<svelte:window onkeydown={onKey} />
<svelte:head>
	<title>{app.timer ? `▶ ${app.tasks.find((t) => t.id === app.timer?.taskId)?.title ?? ''} · ` : ''}StackDO</title>
</svelte:head>

<AnimationCanvas trigger={ui.celebrate} />

<div class="app" class:sheet-open={!!ui.sheet}>
	<header class="top">
		<h1>Stack<span>DO</span></h1>
		<div class="tools">
			<button class="icon-btn" onclick={toggleSearch} aria-label="Suche" aria-pressed={ui.searchOpen}><Icon name="search" /></button>
			<button class="icon-btn" onclick={() => ui.open({ type: 'settings' })} aria-label="Einstellungen"><Icon name="settings" /></button>
		</div>
	</header>

	{#if ui.searchOpen}
		<div class="search" transition:fly={{ y: -8, duration: 150 }}>
			<Icon name="search" size={16} />
			<input bind:this={searchEl} bind:value={app.search} placeholder="Aufgaben, Notizen, #tags, Stränge …" aria-label="Suche" />
			<button class="icon-btn" onclick={toggleSearch} aria-label="Suche schließen"><Icon name="x" size={16} /></button>
		</div>
	{/if}

	<main>
		{#if ui.tab === 'stack'}
			<StackView onDone={done} />
		{:else if ui.tab === 'day'}
			<DayView />
		{:else if ui.tab === 'threads'}
			<ThreadsView />
		{:else}
			<StatsView />
		{/if}
	</main>
</div>

<nav class="nav" aria-label="Ansichten">
	{#each TABS.slice(0, 2) as t (t.id)}
		<button class:active={ui.tab === t.id} onclick={() => (ui.tab = t.id)} aria-current={ui.tab === t.id ? 'page' : undefined}>
			<Icon name={t.icon} /><span>{t.label}</span>
		</button>
	{/each}
	<button class="fab" onclick={() => ui.open({ type: 'task' })} aria-label="Neue Aufgabe (N)"><Icon name="plus" size={28} /></button>
	{#each TABS.slice(2) as t (t.id)}
		<button class:active={ui.tab === t.id} onclick={() => (ui.tab = t.id)} aria-current={ui.tab === t.id ? 'page' : undefined}>
			<Icon name={t.icon} /><span>{t.label}</span>
		</button>
	{/each}
</nav>

{#if ui.sheet?.type === 'task'}
	{#key ui.sheet.id ?? 'new'}
		<TaskSheet id={ui.sheet.id} threadId={ui.sheet.threadId} />
	{/key}
{:else if ui.sheet?.type === 'push'}
	<PushSheet id={ui.sheet.id} />
{:else if ui.sheet?.type === 'done'}
	<DoneSheet id={ui.sheet.id} />
{:else if ui.sheet?.type === 'thread'}
	<ThreadSheet id={ui.sheet.id} />
{:else if ui.sheet?.type === 'settings'}
	<SettingsSheet />
{/if}

{#if ui.toast}
	<div class="toast" role="status" transition:fly={{ y: 20, duration: 150 }}>
		<span>{ui.toast.text}</span>
		{#if ui.toast.action}
			<button
				onclick={() => {
					ui.toast?.action?.run();
					ui.toast = null;
				}}>{ui.toast.action.label}</button
			>
		{/if}
	</div>
{/if}

<style>
	.app {
		max-width: 560px;
		margin: 0 auto;
		padding: 12px 16px calc(var(--nav-h) + 32px);
		min-height: 100dvh;
	}
	.app.sheet-open {
		padding-bottom: 70dvh;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4px 0 12px;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: -0.03em;
	}
	h1 span {
		background: var(--prime);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.tools {
		display: flex;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 4px 0 12px;
		margin-bottom: 12px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 8px;
		color: var(--muted);
	}
	.search input {
		flex: 1;
		border: 0;
		background: none;
		padding: 10px 0;
		outline: none;
		color: var(--ink);
	}
	.nav {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 40;
		display: grid;
		grid-template-columns: 1fr 1fr 72px 1fr 1fr;
		align-items: center;
		max-width: 560px;
		margin: 0 auto;
		height: calc(var(--nav-h) + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: var(--surface);
		border-top: 1px solid var(--line);
	}
	.nav button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		border: 0;
		background: none;
		color: var(--muted);
		font-size: 0.68rem;
		font-weight: 600;
		padding: 6px 0;
	}
	.nav button.active {
		color: var(--blue);
	}
	.nav .fab {
		justify-self: center;
		width: 58px;
		height: 58px;
		margin-top: -26px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: var(--ink);
		color: var(--surface);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
		transition: transform 0.15s;
	}
	.nav .fab:active {
		transform: scale(0.92);
	}
	.toast {
		position: fixed;
		left: 50%;
		bottom: calc(var(--nav-h) + 16px);
		transform: translateX(-50%);
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		background: var(--ink);
		color: var(--surface);
		border-radius: 8px;
		box-shadow: var(--shadow);
		font-size: 0.9rem;
		max-width: calc(100% - 32px);
	}
	.toast button {
		border: 0;
		background: none;
		color: #ffb347;
		font-weight: 800;
	}
</style>
