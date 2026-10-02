<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { app } from '$lib/stores/app.svelte';
	import { ui, type View } from '$lib/stores/ui.svelte';
	import { relativeDue } from '$lib/utils/time';
	import Icon, { type IconName } from './Icon.svelte';
	import Logo from './Logo.svelte';

	const ITEMS: { view: View; label: string; sub: string; icon: IconName }[] = [
		{ view: 'stack', label: 'Stapel', sub: 'Was jetzt dran ist', icon: 'stack' },
		{ view: 'inbox', label: 'Irgendwann', sub: 'Inbox: geparkt, später sortieren', icon: 'inbox' },
		{ view: 'matrix', label: 'Matrix', sub: 'Eisenhower: wichtig × dringend', icon: 'grid' },
		{ view: 'day', label: 'Heute', sub: 'Tagesuhr & Plan', icon: 'clock' },
		{ view: 'threads', label: 'Stränge & Ziele', sub: 'Lebensbereiche priorisieren', icon: 'threads' },
		{ view: 'stats', label: 'Rückblick', sub: 'Erledigt, Zeit, Schätzungen', icon: 'chart' }
	];

	const main = $derived(app.mainGoal);
	const standalone =
		typeof window !== 'undefined' &&
		(matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

	async function install() {
		await ui.installPrompt?.prompt();
		ui.installPrompt = null;
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (ui.menuOpen = false)} />

<!-- invisible click-catcher: closes the drawer, no dimming (same calm as the bottom panels) -->
<button class="catcher" aria-label="Menü schließen" onclick={() => (ui.menuOpen = false)} transition:fade={{ duration: 120 }}></button>

<nav class="drawer" aria-label="Menü" transition:fly={{ x: -320, duration: 220, opacity: 1 }}>
	<div class="head">
		<Logo size={26} />
		<button class="icon-btn" onclick={() => (ui.menuOpen = false)} aria-label="Menü schließen"><Icon name="x" /></button>
	</div>

	{#if main}
		<button class="goal" style:--c={main.thread.color} onclick={() => ui.open({ type: 'thread', id: main.thread.id })}>
			<span class="g-label"><Icon name="target" size={13} /> Dein Ziel{main.goal.deadline ? ` · ${relativeDue(main.goal.deadline, app.now)}` : ''}</span>
			<span class="g-text">{main.goal.text}</span>
			{#if main.goal.stretch}<span class="g-stretch">Stretch: {main.goal.stretch}</span>{/if}
		</button>
	{/if}

	<ul>
		{#each ITEMS as it (it.view)}
			<li>
				<button class="item" aria-current={ui.view === it.view ? 'page' : undefined} onclick={() => ui.go(it.view)}>
					<Icon name={it.icon} />
					<span><strong>{it.label}</strong><small>{it.sub}</small></span>
					{#if it.view === 'inbox' && app.somedayTasks.length}<em class="count">{app.somedayTasks.length}</em>{/if}
				</button>
			</li>
		{/each}
	</ul>

	<div class="bottom">
		{#if !standalone && ui.installPrompt}
			<button class="item" onclick={install}><Icon name="install" /><span><strong>App installieren</strong><small>Homescreen, offline</small></span></button>
		{/if}
		<button class="item" onclick={() => ui.open({ type: 'settings' })}>
			<Icon name="gear" /><span><strong>Einstellungen</strong><small>Zeiten, Export, Installation</small></span>
		</button>
	</div>
</nav>

<style>
	.catcher {
		position: fixed;
		inset: 0;
		z-index: 70;
		border: 0;
		background: rgba(35, 32, 28, 0.04);
		cursor: default;
	}
	.drawer {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		z-index: 71;
		width: min(320px, 86vw);
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: max(16px, env(safe-area-inset-top)) 12px max(16px, env(safe-area-inset-bottom));
		background: var(--surface);
		box-shadow: 12px 0 40px rgba(60, 40, 20, 0.12);
		border-radius: 0 24px 24px 0;
		overflow-y: auto;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 4px 8px 8px;
	}
	.goal {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin: 0 4px 6px;
		padding: 12px 14px;
		border: 0;
		border-radius: 16px;
		background: color-mix(in srgb, var(--c) 10%, var(--surface));
		text-align: left;
	}
	.g-label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--c);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.g-text {
		font-weight: 700;
	}
	.g-stretch {
		font-size: 0.78rem;
		color: var(--muted);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 14px;
		width: 100%;
		padding: 12px;
		border: 0;
		border-radius: 14px;
		background: none;
		text-align: left;
		color: var(--muted);
	}
	.item span {
		display: flex;
		flex-direction: column;
	}
	.item strong {
		color: var(--ink);
		font-size: 1rem;
	}
	.item small {
		font-size: 0.76rem;
	}
	.item:hover {
		background: var(--surface-2);
	}
	.item[aria-current='page'] {
		background: var(--surface-2);
		color: var(--prime-solid);
	}
	.count {
		margin-left: auto;
		min-width: 24px;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--ink);
		font-style: normal;
		font-size: 0.8rem;
		font-weight: 700;
		text-align: center;
	}
	.bottom {
		margin-top: auto;
		padding-top: 8px;
		border-top: 1px solid var(--line-soft);
	}
</style>
