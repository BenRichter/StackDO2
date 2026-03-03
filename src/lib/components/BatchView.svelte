<script lang="ts">
	import { taskStore } from '$lib/stores/tasks.svelte';
	import { QUADRANT_COLORS } from '$lib/types';

	let { mode = 'projects' }: { mode?: 'projects' | 'categories' | 'tags' } = $props();

	const PROJECT_COLORS = ['#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C'];

	const groups = $derived.by(() => {
		switch (mode) {
			case 'projects': return taskStore.projectGroups;
			case 'categories': return taskStore.categoryGroups;
			case 'tags': return taskStore.tagGroups;
		}
	});

	function getColor(index: number): string {
		return PROJECT_COLORS[index % PROJECT_COLORS.length];
	}
</script>

<div class="batch-view">
	{#each Object.entries(groups) as [name, tasks], i}
		<div class="batch-group">
			<div class="group-header" style:--group-color={getColor(i)}>
				<span class="group-dot"></span>
				<h3>{name}</h3>
				<span class="group-count">{tasks.length}</span>
			</div>
			<div class="group-tasks">
				{#each tasks as task}
					<div class="mini-task" style:border-left-color={QUADRANT_COLORS[task.quadrant]}>
						<span class="mini-title">{task.title}</span>
						{#if task.score != null}
							<span class="mini-score">{task.score}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if Object.keys(groups).length === 0}
		<div class="empty-batch">
			<p>Keine Aufgaben in dieser Ansicht</p>
		</div>
	{/if}
</div>

<style>
	.batch-view {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.batch-group {
		background: white;
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(7, 59, 76, 0.06);
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 14px;
		background: #f8fafb;
		border-bottom: 1px solid #eef2f5;
	}

	.group-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--group-color);
		flex-shrink: 0;
	}

	.group-header h3 {
		margin: 0;
		font-size: 0.88rem;
		font-weight: 700;
		color: #073B4C;
		flex: 1;
	}

	.group-count {
		font-size: 0.72rem;
		font-weight: 700;
		background: #e4eaf0;
		color: #5a7a8a;
		padding: 2px 8px;
		border-radius: 8px;
	}

	.group-tasks {
		padding: 6px;
	}

	.mini-task {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		border-left: 3px solid #ccc;
		border-radius: 0 8px 8px 0;
		margin: 3px 0;
		transition: background 0.15s;
	}

	.mini-task:hover {
		background: #f8fafb;
	}

	.mini-title {
		font-size: 0.82rem;
		color: #073B4C;
		font-weight: 500;
	}

	.mini-score {
		font-size: 0.68rem;
		font-weight: 700;
		color: #5a7a8a;
		background: #f0f4f8;
		padding: 2px 6px;
		border-radius: 6px;
	}

	.empty-batch {
		text-align: center;
		padding: 40px 20px;
		color: #a0b4c0;
		font-size: 0.9rem;
	}
</style>
