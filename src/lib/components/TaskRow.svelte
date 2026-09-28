<script lang="ts">
	import type { Task } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import Icon from './Icon.svelte';
	import TaskMeta from './TaskMeta.svelte';

	let { task, reason, rank }: { task: Task; reason?: string; rank?: number } = $props();

	const thread = $derived(app.thread(task.threadId));
</script>

<li class="row-item" class:later={!!reason} style:--c={thread?.color ?? 'var(--line)'}>
	<button class="main" onclick={() => ui.open({ type: 'task', id: task.id })}>
		{#if rank != null}<span class="rank">{rank}</span>{/if}
		<span class="body">
			<span class="title">{task.title}</span>
			<TaskMeta {task} />
			{#if reason}<span class="reason">{reason}</span>{/if}
		</span>
	</button>
	{#if reason === 'zurückgestellt'}
		<button class="icon-btn" onclick={() => app.unpush(task.id)} aria-label="Wieder in den Stapel" title="Wieder in den Stapel">
			<Icon name="up" />
		</button>
	{:else if !reason}
		<button class="icon-btn" onclick={() => app.start(task.id)} aria-label="Jetzt starten" title="Jetzt starten">
			<Icon name="play" size={18} />
		</button>
	{/if}
</li>

<style>
	.row-item {
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--surface);
		border-left: 4px solid var(--c);
		border-radius: 6px;
		box-shadow: var(--shadow);
		padding-right: 4px;
	}
	.later {
		opacity: 0.65;
		box-shadow: none;
		border: 1px dashed var(--line);
		border-left: 4px solid var(--c);
	}
	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 10px 12px;
		border: 0;
		background: none;
		text-align: left;
	}
	.rank {
		font-size: 0.75rem;
		font-weight: 800;
		color: var(--muted);
		min-width: 1.2em;
		padding-top: 2px;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
	}
	.title {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.reason {
		font-size: 0.75rem;
		color: var(--muted);
	}
</style>
