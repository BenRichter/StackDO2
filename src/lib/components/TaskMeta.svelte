<script lang="ts">
	import type { Task } from '$lib/types';
	import { BABYSTEP_LIMIT } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { fmtDuration, relativeDue } from '$lib/utils/time';
	import Icon from './Icon.svelte';

	/** One quiet line of meta: thread · duration · due · recurring · tags. Only what helps decide. */
	let { task, showThread = true }: { task: Task; showThread?: boolean } = $props();

	const thread = $derived(app.thread(task.threadId));
	const due = $derived(task.dueDate ? relativeDue(task.dueDate, app.now) : null);
	const hot = $derived(!!due && (due === 'heute' || due.includes('fällig')));
</script>

<span class="meta">
	{#if showThread && thread}
		<span class="item"><span class="dot" style:background={thread.color}></span>{thread.name}</span>
	{/if}
	<span class="item" class:warn={task.estimate > BABYSTEP_LIMIT}>{fmtDuration(task.estimate)}</span>
	{#if due}
		<span class="item" class:hot>{due}{task.dueTime ? ` ${task.dueTime}` : ''}</span>
	{/if}
	{#if task.importance >= 4}
		<span class="item imp" title="Wichtigkeit {task.importance}/5">{'!'.repeat(task.importance - 3)}</span>
	{/if}
	{#if task.recurrence !== 'none'}
		<span class="item" title="wiederkehrend"><Icon name="repeat" size={12} /></span>
	{/if}
	{#if task.notes}
		<span class="item" title="Notiz"><Icon name="note" size={12} /></span>
	{/if}
	{#each task.tags.slice(0, 2) as tag (tag)}
		<span class="item tag">#{tag}</span>
	{/each}
</span>

<style>
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px 0;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.item {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.item + .item::before {
		content: '·';
		margin: 0 6px;
		color: var(--muted);
		font-weight: 400;
		opacity: 0.6;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.hot {
		color: var(--red);
		font-weight: 700;
	}
	.warn {
		color: #a87600;
		font-weight: 700;
	}
	.imp {
		color: var(--red);
		font-weight: 800;
	}
</style>
