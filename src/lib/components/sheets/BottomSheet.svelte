<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { ui } from '$lib/stores/ui.svelte';
	import Icon from '../Icon.svelte';

	let { title, children, footer }: { title: string; children: Snippet; footer?: Snippet } = $props();
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && ui.close()} />

<!-- A docked panel, no dimming overlay: the stack stays visible above it. -->
<div class="sheet" role="dialog" aria-label={title} transition:fly={{ y: 400, duration: 220 }}>
	<header>
		<span class="grip" aria-hidden="true"></span>
		<h2>{title}</h2>
		<button class="icon-btn" onclick={() => ui.close()} aria-label="Schließen"><Icon name="x" /></button>
	</header>
	<div class="content">{@render children()}</div>
	{#if footer}<footer>{@render footer()}</footer>{/if}
</div>

<style>
	.sheet {
		position: fixed;
		left: 50%;
		bottom: 0;
		transform: translateX(-50%);
		width: min(560px, 100%);
		max-height: 82dvh;
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-top: 1px solid var(--line);
		border-radius: 14px 14px 0 0;
		box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.18);
		z-index: 60;
	}
	header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 8px 4px 16px;
	}
	.grip {
		position: absolute;
		top: 6px;
		left: 50%;
		width: 36px;
		height: 4px;
		margin-left: -18px;
		border-radius: 2px;
		background: var(--line);
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.content {
		overflow-y: auto;
		padding: 0 16px 16px;
		overscroll-behavior: contain;
	}
	footer {
		display: flex;
		gap: 8px;
		padding: 10px 16px max(12px, env(safe-area-inset-bottom));
		border-top: 1px solid var(--line);
	}
</style>
