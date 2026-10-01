<script lang="ts">
	import type { Task } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { finishTask } from '$lib/stores/actions';
	import Icon from './Icon.svelte';
	import TaskMeta from './TaskMeta.svelte';

	let { task, reason, rank }: { task: Task; reason?: string; rank?: number } = $props();

	const thread = $derived(app.thread(task.threadId));
	/** thread color, graded by importance: 1 = faint, 5 = full */
	const tint = $derived(`${task.importance * 9}%`);
</script>

<li class="row-item" class:later={!!reason} style:--c={thread?.color ?? 'var(--muted)'} style:--tint={tint}>
	<button class="check" onclick={() => finishTask(task.id)} aria-label="„{task.title}“ erledigen" title="Erledigt">
		<Icon name="check" size={14} />
	</button>
	<button class="main" onclick={() => ui.open({ type: 'task', id: task.id })}>
		<span class="title">{#if rank != null}<span class="rank">{rank}</span>{/if}{task.title}</span>
		<TaskMeta {task} />
		{#if reason}<span class="reason">{reason}</span>{/if}
	</button>
	{#if reason === 'zurückgestellt' || task.delegatedTo}
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
		align-items: flex-start;
		gap: 2px;
		padding: 4px 4px 4px 12px;
		background: var(--surface);
	}
	.row-item + :global(.row-item) {
		border-top: 1px solid var(--line-soft);
	}
	.later {
		opacity: 0.6;
	}
	.check {
		flex: none;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		margin-top: 10px;
		border-radius: 50%;
		border: 2px solid var(--c);
		background: color-mix(in srgb, var(--c) var(--tint), transparent);
		color: transparent;
		padding: 0;
		transition: background 0.15s, color 0.15s;
	}
	.check:hover,
	.check:focus-visible {
		background: var(--c);
		color: #fff;
	}
	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 5px;
		padding: 10px 8px;
		border: 0;
		background: none;
		text-align: left;
	}
	.rank {
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--muted);
		margin-right: 6px;
	}
	.title {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.reason {
		font-size: 0.75rem;
		color: var(--muted);
	}
	.icon-btn {
		margin-top: 2px;
	}
</style>
