<script lang="ts">
	import { taskStore } from '$lib/stores/tasks.svelte';

	const completedToday = $derived(taskStore.completedToday);
	const totalActive = $derived(taskStore.totalActive);
	const progress = $derived(totalActive + completedToday > 0 ? completedToday / (totalActive + completedToday) : 0);
</script>

<div class="stats-bar">
	<div class="stat">
		<span class="stat-value">{completedToday}</span>
		<span class="stat-label">Erledigt</span>
	</div>
	<div class="progress-container">
		<div class="progress-bar">
			<div class="progress-fill" style:width="{progress * 100}%"></div>
		</div>
		<span class="progress-text">{Math.round(progress * 100)}%</span>
	</div>
	<div class="stat">
		<span class="stat-value">{totalActive}</span>
		<span class="stat-label">Offen</span>
	</div>
</div>

<style>
	.stats-bar {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		background: white;
		border-radius: 14px;
		box-shadow: 0 2px 8px rgba(7, 59, 76, 0.06);
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 48px;
	}

	.stat-value {
		font-size: 1.2rem;
		font-weight: 800;
		color: #073B4C;
	}

	.stat-label {
		font-size: 0.65rem;
		font-weight: 600;
		color: #a0b4c0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.progress-container {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: #f0f4f8;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #06D6A0, #118AB2);
		border-radius: 4px;
		transition: width 0.5s ease;
	}

	.progress-text {
		font-size: 0.75rem;
		font-weight: 700;
		color: #5a7a8a;
		min-width: 32px;
		text-align: right;
	}
</style>
