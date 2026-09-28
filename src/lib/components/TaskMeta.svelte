<script lang="ts">
	import type { Task } from '$lib/types';
	import { BABYSTEP_LIMIT, RECURRENCE_LABELS } from '$lib/types';
	import { app } from '$lib/stores/app.svelte';
	import { fmtDuration, relativeDue } from '$lib/utils/time';
	import Icon from './Icon.svelte';

	let { task, showThread = true }: { task: Task; showThread?: boolean } = $props();

	const thread = $derived(app.thread(task.threadId));
	const today = $derived(app.now);
	const overdue = $derived(!!task.dueDate && relativeDue(task.dueDate, today).includes('fällig'));
</script>

<div class="meta row">
	{#if showThread && thread}
		<span class="badge thread" style:--c={thread.color}>{thread.name}</span>
	{/if}
	<span class="badge" class:warn={task.estimate > BABYSTEP_LIMIT}>{fmtDuration(task.estimate)}</span>
	{#if task.dueDate}
		<span class="badge" class:hot={overdue || relativeDue(task.dueDate, today) === 'heute'}>
			<Icon name="calendar" size={11} />
			{relativeDue(task.dueDate, today)}{task.dueTime ? ` ${task.dueTime}` : ''}
		</span>
	{/if}
	{#if task.importance >= 4}
		<span class="badge imp" title="Wichtigkeit {task.importance}/5">{'!'.repeat(task.importance - 2)}</span>
	{/if}
	{#if task.recurrence !== 'none'}
		<span class="badge"><Icon name="repeat" size={11} /> {RECURRENCE_LABELS[task.recurrence]}</span>
	{/if}
	{#if task.pushHistory.length}
		<span class="badge" title="{task.pushHistory.length}× zurückgestellt"><Icon name="push" size={11} />{task.pushHistory.length}</span>
	{/if}
	{#each task.tags as tag (tag)}
		<span class="badge tag">#{tag}</span>
	{/each}
	{#if task.notes}
		<span class="badge" title="Notiz"><Icon name="note" size={11} /></span>
	{/if}
</div>

<style>
	.meta {
		gap: 4px;
	}
	.thread {
		background: color-mix(in srgb, var(--c) 14%, transparent);
		color: var(--c);
	}
	.hot {
		background: color-mix(in srgb, var(--red) 14%, transparent);
		color: var(--red);
	}
	.warn {
		background: color-mix(in srgb, var(--amber) 22%, transparent);
		color: #8a6100;
	}
	.imp {
		color: var(--red);
		letter-spacing: -1px;
	}
	.tag {
		background: color-mix(in srgb, var(--green) 12%, transparent);
		color: var(--green);
	}
</style>
