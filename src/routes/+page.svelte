<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { app } from '$lib/stores/app.svelte';
	import { ui, VIEW_TITLES, type View } from '$lib/stores/ui.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import MenuDrawer from '$lib/components/MenuDrawer.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import AnimationCanvas from '$lib/components/AnimationCanvas.svelte';
	import StackView from '$lib/components/views/StackView.svelte';
	import MatrixView from '$lib/components/views/MatrixView.svelte';
	import InboxView from '$lib/components/views/InboxView.svelte';
	import DayView from '$lib/components/views/DayView.svelte';
	import ThreadsView from '$lib/components/views/ThreadsView.svelte';
	import StatsView from '$lib/components/views/StatsView.svelte';
	import TaskSheet from '$lib/components/sheets/TaskSheet.svelte';
	import PushSheet from '$lib/components/sheets/PushSheet.svelte';
	import DoneSheet from '$lib/components/sheets/DoneSheet.svelte';
	import ThreadSheet from '$lib/components/sheets/ThreadSheet.svelte';
	import SettingsSheet from '$lib/components/sheets/SettingsSheet.svelte';

	const greeting = $derived.by(() => {
		const h = app.now.getHours();
		return h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : h < 22 ? 'Guten Abend' : 'Gute Nacht';
	});
	const dateLine = $derived(app.now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }));
	const openCount = $derived(app.stack.ready.length);

	onMount(() => {
		// PWA shortcuts: ?new opens the add panel, ?view=day jumps to a view
		const params = new URLSearchParams(location.search);
		if (params.has('new')) ui.open({ type: 'task' });
		const view = (params.get('view') ?? params.get('tab')) as View | null;
		if (view && view in VIEW_TITLES) ui.view = view;
	});

	let searchEl = $state<HTMLInputElement>();

	function toggleSearch() {
		ui.searchOpen = !ui.searchOpen;
		if (ui.searchOpen) {
			ui.go('stack');
			queueMicrotask(() => searchEl?.focus());
		} else app.search = '';
	}

	const KEYS: Record<string, View> = { i: 'inbox', m: 'matrix', h: 'day', s: 'threads', r: 'stats' };

	function onKey(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (e.metaKey || e.ctrlKey || e.altKey || target.closest('input, textarea, select, [contenteditable]')) return;
		if (ui.sheet || ui.menuOpen) return;
		const top = app.stack.ready[0];
		if (e.key === 'n') {
			e.preventDefault();
			ui.open({ type: 'task' });
		} else if (e.key === '/') {
			e.preventDefault();
			if (!ui.searchOpen) toggleSearch();
			else searchEl?.focus();
		} else if (e.key === ' ' && top && ui.view === 'stack' && target.tagName !== 'BUTTON') {
			e.preventDefault();
			app.toggle(top.task.id);
		} else if (e.key === 'Escape') {
			if (ui.searchOpen) toggleSearch();
			else ui.go('stack');
		} else if (KEYS[e.key]) {
			ui.go(ui.view === KEYS[e.key] ? 'stack' : KEYS[e.key]);
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
		<button class="menu" onclick={() => (ui.menuOpen = true)} aria-label="Menü öffnen" aria-expanded={ui.menuOpen} title="Menü">
			<Logo size={24} />
		</button>
		{#if ui.view === 'stack'}
			<button class="icon-btn" onclick={toggleSearch} aria-label="Suchen & filtern" aria-pressed={ui.searchOpen}>
				<Icon name={ui.searchOpen ? 'x' : 'search'} />
			</button>
		{/if}
	</header>

	{#if ui.view === 'stack'}
		{#if ui.searchOpen}
			<div class="search-panel" transition:fly={{ y: -8, duration: 150 }}>
				<label class="search">
					<Icon name="search" size={16} />
					<input bind:this={searchEl} bind:value={app.search} placeholder="Suchen: Aufgabe, #tag, Strang …" aria-label="Suche" />
				</label>
				<FilterBar />
			</div>
		{:else}
			<div class="hello">
				<h1>{greeting}.</h1>
				<p>{dateLine}{openCount ? ` · ${openCount} offen` : ''}</p>
			</div>
		{/if}
	{:else}
		<div class="subhead">
			<button class="back" onclick={() => ui.go('stack')} aria-label="Zurück zum Stapel"><Icon name="back" size={22} /></button>
			<h1>{VIEW_TITLES[ui.view]}</h1>
		</div>
	{/if}

	<main>
		{#if ui.view === 'stack'}
			<StackView />
		{:else if ui.view === 'inbox'}
			<InboxView />
		{:else if ui.view === 'matrix'}
			<MatrixView />
		{:else if ui.view === 'day'}
			<DayView />
		{:else if ui.view === 'threads'}
			<ThreadsView />
		{:else}
			<StatsView />
		{/if}
	</main>
</div>

{#if !ui.sheet}
	<button class="fab" onclick={() => ui.open({ type: 'task', someday: ui.view === 'inbox' })} aria-label="Neue Aufgabe (N)" transition:fly={{ y: 80, duration: 180 }}>
		<Icon name="plus" size={28} />
	</button>
{/if}

{#if ui.menuOpen}
	<MenuDrawer />
{/if}

{#if ui.sheet?.type === 'task'}
	{#key ui.sheet.id ?? 'new'}
		<TaskSheet id={ui.sheet.id} threadId={ui.sheet.threadId} someday={ui.sheet.someday} />
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
		padding: max(10px, env(safe-area-inset-top)) 18px 120px;
		min-height: 100dvh;
	}
	.app.sheet-open {
		padding-bottom: 70dvh;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 48px;
	}
	.menu {
		display: flex;
		align-items: center;
		padding: 8px 10px 8px 0;
		border: 0;
		background: none;
	}
	.hello {
		margin: 10px 2px 22px;
	}
	.hello h1,
	.subhead h1 {
		margin: 0;
		font-size: 1.9rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.1;
	}
	.hello p {
		margin: 4px 0 0;
		color: var(--muted);
		font-weight: 600;
	}
	.subhead {
		display: flex;
		align-items: center;
		gap: 4px;
		margin: 6px 0 18px -8px;
	}
	.back {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--ink);
	}
	.back:hover {
		background: var(--surface-2);
	}
	.search-panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 6px 0 18px;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 14px;
		background: var(--surface);
		border-radius: 14px;
		box-shadow: var(--shadow);
		color: var(--muted);
	}
	.search input {
		flex: 1;
		border: 0;
		background: none;
		padding: 13px 0;
		outline: none;
		color: var(--ink);
	}
	.fab {
		position: fixed;
		left: 50%;
		bottom: max(22px, calc(env(safe-area-inset-bottom) + 12px));
		z-index: 40;
		width: 62px;
		height: 62px;
		margin-left: -31px;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 50%;
		background: var(--ink);
		color: var(--surface);
		box-shadow: 0 10px 26px rgba(35, 32, 28, 0.3);
		transition: transform 0.15s;
	}
	.fab:hover {
		transform: translateY(-2px);
	}
	.fab:active {
		transform: scale(0.92);
	}
	.toast {
		position: fixed;
		left: 50%;
		bottom: 100px;
		transform: translateX(-50%);
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 16px;
		background: var(--ink);
		color: var(--surface);
		border-radius: 14px;
		box-shadow: var(--shadow);
		font-size: 0.9rem;
		max-width: calc(100% - 32px);
	}
	.toast button {
		border: 0;
		background: none;
		color: #ffbf80;
		font-weight: 800;
	}
</style>
