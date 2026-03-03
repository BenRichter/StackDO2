<script lang="ts">
	import type { Location } from '$lib/types';
	import { LOCATION_LABELS } from '$lib/types';
	import { taskStore } from '$lib/stores/tasks.svelte';

	const icons: Record<Location, string> = {
		anywhere: '🌍',
		work: '💼',
		home: '🏠',
		garden: '🌱',
		errands: '🚗'
	};
</script>

<div class="location-bar">
	{#each Object.entries(LOCATION_LABELS) as [loc, label]}
		<button
			class="loc-btn"
			class:active={taskStore.currentLocation === loc}
			onclick={() => taskStore.setLocation(loc as Location)}
		>
			<span class="loc-icon">{icons[loc as Location]}</span>
			<span class="loc-label">{label}</span>
		</button>
	{/each}
</div>

<style>
	.location-bar {
		display: flex;
		gap: 4px;
		padding: 4px;
		background: #f0f4f8;
		border-radius: 14px;
		overflow-x: auto;
	}

	.loc-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 8px 6px;
		background: transparent;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 0;
	}

	.loc-btn.active {
		background: white;
		box-shadow: 0 2px 8px rgba(7, 59, 76, 0.1);
	}

	.loc-icon {
		font-size: 1.1rem;
	}

	.loc-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: #5a7a8a;
		white-space: nowrap;
	}

	.loc-btn.active .loc-label {
		color: #073B4C;
	}
</style>
