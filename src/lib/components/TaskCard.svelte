<script lang="ts">
	import type { Task } from '$lib/types';
	import { QUADRANT_COLORS, QUADRANT_LABELS, LOCATION_LABELS, PRIORITY_LABELS } from '$lib/types';
	import { taskStore } from '$lib/stores/tasks.svelte';

	let {
		task,
		isCurrentTask = false,
		index = 0,
		total = 1,
		onComplete
	}: {
		task: Task;
		isCurrentTask?: boolean;
		index?: number;
		total?: number;
		onComplete?: (id: string) => void;
	} = $props();

	let touchStartX = $state(0);
	let touchCurrentX = $state(0);
	let swiping = $state(false);
	let swipeDirection = $state<'left' | 'right' | null>(null);

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchCurrentX = touchStartX;
		swiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!swiping) return;
		touchCurrentX = e.touches[0].clientX;
		const diff = touchCurrentX - touchStartX;
		if (Math.abs(diff) > 30) {
			swipeDirection = diff > 0 ? 'right' : 'left';
		} else {
			swipeDirection = null;
		}
	}

	function handleTouchEnd() {
		if (!swiping) return;
		swiping = false;
		const diff = touchCurrentX - touchStartX;
		if (diff > 80) {
			// Swipe right = snooze 1h
			taskStore.snoozeTask(task.id, 60);
		} else if (diff < -80) {
			// Swipe left = skip 5 min
			taskStore.skipTask(task.id, 5);
		}
		swipeDirection = null;
		touchCurrentX = touchStartX;
	}

	function handleComplete() {
		if (onComplete) onComplete(task.id);
	}

	const swipeOffset = $derived(swiping ? touchCurrentX - touchStartX : 0);

	const dueLabel = $derived.by(() => {
		if (!task.dueDate) return null;
		const today = new Date().toISOString().split('T')[0];
		const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
		if (task.dueDate < today) return 'Überfällig';
		if (task.dueDate === today) return 'Heute';
		if (task.dueDate === tomorrow) return 'Morgen';
		return new Date(task.dueDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	});

	const dueClass = $derived.by(() => {
		if (!task.dueDate) return '';
		const today = new Date().toISOString().split('T')[0];
		if (task.dueDate < today) return 'overdue';
		if (task.dueDate === today) return 'due-today';
		return '';
	});
</script>

<div
	class="task-card"
	class:current-task={isCurrentTask}
	class:swiping
	class:swipe-right={swipeDirection === 'right'}
	class:swipe-left={swipeDirection === 'left'}
	style:transform={swiping ? `translateX(${swipeOffset}px)` : ''}
	style:--stack-offset={`${(total - 1 - index) * 2}px`}
	style:--quadrant-color={QUADRANT_COLORS[task.quadrant]}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	role="article"
>
	<div class="quadrant-indicator"></div>

	<div class="card-content">
		<div class="card-header">
			<h3 class="task-title">{task.title}</h3>
			{#if task.score != null}
				<span class="score-badge">{task.score}</span>
			{/if}
		</div>

		{#if task.description}
			<p class="task-description">{task.description}</p>
		{/if}

		<div class="task-meta">
			<span class="meta-pill priority-{task.priority}">{PRIORITY_LABELS[task.priority]}</span>
			<span class="meta-pill location">{LOCATION_LABELS[task.location]}</span>
			<span class="meta-pill quadrant">{QUADRANT_LABELS[task.quadrant]}</span>
			{#if task.estimatedMinutes}
				<span class="meta-pill duration">{task.estimatedMinutes} Min</span>
			{/if}
			{#if dueLabel}
				<span class="meta-pill due {dueClass}">{dueLabel}</span>
			{/if}
			{#if task.recurrence !== 'none'}
				<span class="meta-pill recurrence">↻ {task.recurrence === 'daily' ? 'Täglich' : task.recurrence === 'weekly' ? 'Wöchentlich' : 'Monatlich'}</span>
			{/if}
		</div>

		<div class="task-tags">
			{#each task.tags as tag}
				<span class="tag">#{tag}</span>
			{/each}
			{#if task.project}
				<span class="tag project-tag">{task.project}</span>
			{/if}
			{#if task.category}
				<span class="tag category-tag">{task.category}</span>
			{/if}
		</div>

		{#if isCurrentTask}
			<div class="task-actions">
				<button class="btn btn-complete" onclick={handleComplete}>
					Erledigt
				</button>
				<button class="btn btn-snooze" onclick={() => taskStore.snoozeTask(task.id, 60)}>
					1h zurück
				</button>
				<button class="btn btn-skip" onclick={() => taskStore.skipTask(task.id, 5)}>
					Überspringen
				</button>
			</div>
		{/if}
	</div>

	{#if swiping}
		<div class="swipe-hint">
			{#if swipeDirection === 'right'}
				<span class="swipe-label snooze-label">1h zurückstellen</span>
			{:else if swipeDirection === 'left'}
				<span class="swipe-label skip-label">5 Min überspringen</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.task-card {
		position: relative;
		background: white;
		border-radius: 16px;
		box-shadow: 0 2px 8px rgba(7, 59, 76, 0.08);
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
		margin-bottom: 8px;
		border: 1px solid rgba(7, 59, 76, 0.06);
	}

	.task-card.current-task {
		box-shadow: 0 8px 32px rgba(7, 59, 76, 0.15);
		border: 2px solid var(--quadrant-color, #118AB2);
		transform: scale(1.02);
	}

	.task-card.swiping {
		transition: none;
	}

	.quadrant-indicator {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 5px;
		background: var(--quadrant-color);
		border-radius: 16px 0 0 16px;
	}

	.card-content {
		padding: 14px 16px 14px 20px;
	}

	.current-task .card-content {
		padding: 20px 20px 20px 24px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 8px;
	}

	.task-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: #073B4C;
		line-height: 1.3;
	}

	.current-task .task-title {
		font-size: 1.15rem;
	}

	.task-description {
		margin: 6px 0 0;
		font-size: 0.82rem;
		color: #5a7a8a;
		line-height: 1.4;
	}

	.score-badge {
		flex-shrink: 0;
		background: #073B4C;
		color: white;
		font-size: 0.7rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 10px;
		min-width: 20px;
		text-align: center;
	}

	.task-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 10px;
	}

	.meta-pill {
		font-size: 0.7rem;
		padding: 2px 8px;
		border-radius: 8px;
		font-weight: 500;
		background: #f0f4f8;
		color: #5a7a8a;
	}

	.meta-pill.priority-urgent { background: #EF476F20; color: #EF476F; font-weight: 700; }
	.meta-pill.priority-high { background: #FFD16630; color: #b8860b; }
	.meta-pill.priority-medium { background: #06D6A020; color: #0a8f6a; }
	.meta-pill.priority-low { background: #118AB220; color: #118AB2; }

	.meta-pill.due.overdue { background: #EF476F20; color: #EF476F; font-weight: 700; }
	.meta-pill.due.due-today { background: #FFD16640; color: #b8860b; font-weight: 600; }

	.meta-pill.recurrence { background: #118AB215; color: #118AB2; }

	.task-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 8px;
	}

	.tag {
		font-size: 0.68rem;
		padding: 2px 7px;
		border-radius: 6px;
		background: #06D6A015;
		color: #0a8f6a;
		font-weight: 500;
	}

	.tag.project-tag {
		background: #118AB215;
		color: #118AB2;
	}

	.tag.category-tag {
		background: #EF476F12;
		color: #c4395e;
	}

	.task-actions {
		display: flex;
		gap: 8px;
		margin-top: 14px;
	}

	.btn {
		padding: 10px 18px;
		border: none;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.btn:active {
		transform: scale(0.96);
	}

	.btn-complete {
		background: #06D6A0;
		color: white;
		flex: 1;
		box-shadow: 0 4px 14px rgba(6, 214, 160, 0.3);
	}

	.btn-complete:hover {
		box-shadow: 0 6px 20px rgba(6, 214, 160, 0.4);
	}

	.btn-snooze {
		background: #FFD166;
		color: #073B4C;
	}

	.btn-snooze:hover {
		box-shadow: 0 4px 14px rgba(255, 209, 102, 0.4);
	}

	.btn-skip {
		background: #f0f4f8;
		color: #5a7a8a;
	}

	.btn-skip:hover {
		background: #e4eaf0;
	}

	.swipe-hint {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		pointer-events: none;
		z-index: -1;
	}

	.swipe-label {
		padding: 6px 16px;
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.snooze-label {
		margin-left: 12px;
		background: #FFD166;
		color: #073B4C;
	}

	.swipe-label.skip-label {
		margin-left: auto;
		margin-right: 12px;
		background: #f0f4f8;
		color: #5a7a8a;
	}

	.task-card.swipe-right {
		background: #FFD16610;
	}

	.task-card.swipe-left {
		background: #f0f4f810;
	}
</style>
