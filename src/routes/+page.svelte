<script lang="ts">
	import { taskStore } from '$lib/stores/tasks.svelte';
	import TaskCard from '$lib/components/TaskCard.svelte';
	import AddTaskForm from '$lib/components/AddTaskForm.svelte';
	import LocationSelector from '$lib/components/LocationSelector.svelte';
	import AnimationCanvas from '$lib/components/AnimationCanvas.svelte';
	import BatchView from '$lib/components/BatchView.svelte';
	import StatsBar from '$lib/components/StatsBar.svelte';

	let showAddForm = $state(false);
	let animating = $state(false);
	let completingId = $state<string | null>(null);
	let activeTab = $state<'stack' | 'projects' | 'categories' | 'tags'>('stack');

	const scoredTasks = $derived(taskStore.scoredTasks);

	function handleComplete(id: string) {
		completingId = id;
		animating = true;
	}

	function onAnimationDone() {
		if (completingId) {
			taskStore.completeTask(completingId);
			completingId = null;
		}
		animating = false;
	}
</script>

<svelte:head>
	<title>StackDO – Dein Smart Task Manager</title>
	<meta name="description" content="Intelligenter Aufgabenplaner mit Smart Scoring" />
</svelte:head>

<AnimationCanvas active={animating} onDone={onAnimationDone} />

<div class="app">
	<header class="app-header">
		<div class="header-top">
			<h1 class="app-title">Stack<span class="accent">DO</span></h1>
			<span class="time-badge">
				{new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
			</span>
		</div>
		<LocationSelector />
	</header>

	<StatsBar />

	<nav class="tab-bar">
		<button class="tab" class:active={activeTab === 'stack'} onclick={() => activeTab = 'stack'}>
			Stapel
		</button>
		<button class="tab" class:active={activeTab === 'projects'} onclick={() => activeTab = 'projects'}>
			Projekte
		</button>
		<button class="tab" class:active={activeTab === 'categories'} onclick={() => activeTab = 'categories'}>
			Kategorien
		</button>
		<button class="tab" class:active={activeTab === 'tags'} onclick={() => activeTab = 'tags'}>
			Tags
		</button>
	</nav>

	<main class="main-content">
		{#if activeTab === 'stack'}
			{#if scoredTasks.length === 0}
				<div class="empty-state">
					<div class="empty-icon">🎉</div>
					<h2>Alles erledigt!</h2>
					<p>Keine Aufgaben für deinen aktuellen Standort.</p>
				</div>
			{:else}
				<div class="task-stack">
					{#each scoredTasks as task, i (task.id)}
						{@const isLast = i === scoredTasks.length - 1}
						<div
							class="stack-item"
							class:completing={completingId === task.id}
							style:--depth={scoredTasks.length - 1 - i}
							style:z-index={i + 1}
						>
							<TaskCard
								{task}
								isCurrentTask={isLast}
								index={i}
								total={scoredTasks.length}
								onComplete={handleComplete}
							/>
						</div>
					{/each}
				</div>
			{/if}
		{:else if activeTab === 'projects'}
			<BatchView mode="projects" />
		{:else if activeTab === 'categories'}
			<BatchView mode="categories" />
		{:else}
			<BatchView mode="tags" />
		{/if}
	</main>

	<footer class="app-footer">
		<button class="add-btn" onclick={() => showAddForm = true}>
			<span class="add-icon">+</span>
			<span class="add-label">Neue Aufgabe</span>
		</button>
	</footer>

	{#if showAddForm}
		<AddTaskForm onClose={() => showAddForm = false} />
	{/if}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #ffffff;
		color: #073B4C;
		-webkit-font-smoothing: antialiased;
	}

	.app {
		max-width: 500px;
		margin: 0 auto;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 16px;
		padding-bottom: 90px;
		gap: 12px;
	}

	.app-header {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.app-title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 900;
		color: #073B4C;
		letter-spacing: -0.5px;
	}

	.accent {
		color: #06D6A0;
	}

	.time-badge {
		font-size: 0.82rem;
		font-weight: 700;
		color: #5a7a8a;
		background: #f0f4f8;
		padding: 4px 12px;
		border-radius: 8px;
	}

	.tab-bar {
		display: flex;
		gap: 4px;
		background: #f0f4f8;
		padding: 4px;
		border-radius: 12px;
	}

	.tab {
		flex: 1;
		padding: 8px 4px;
		border: none;
		background: transparent;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 600;
		color: #5a7a8a;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tab.active {
		background: white;
		color: #073B4C;
		box-shadow: 0 1px 4px rgba(7, 59, 76, 0.08);
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.task-stack {
		display: flex;
		flex-direction: column;
		gap: 0;
		position: relative;
	}

	.stack-item {
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
		transform-origin: bottom center;
	}

	.stack-item {
		transform: scale(calc(1 - var(--depth) * 0.015));
		opacity: calc(1 - var(--depth) * 0.08);
	}

	.stack-item.completing {
		animation: completeSlide 0.5s ease forwards;
	}

	@keyframes completeSlide {
		0% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.05) translateY(-10px); opacity: 0.8; }
		100% { transform: scale(0.9) translateY(20px); opacity: 0; }
	}

	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		text-align: center;
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 12px;
	}

	.empty-state h2 {
		margin: 0;
		font-size: 1.3rem;
		color: #073B4C;
	}

	.empty-state p {
		margin: 8px 0 0;
		color: #a0b4c0;
		font-size: 0.9rem;
	}

	.app-footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 12px 16px;
		padding-bottom: max(12px, env(safe-area-inset-bottom));
		display: flex;
		justify-content: center;
		z-index: 50;
		background: linear-gradient(transparent, white 30%);
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 28px;
		background: #073B4C;
		border: none;
		border-radius: 16px;
		color: white;
		font-size: 0.92rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 8px 24px rgba(7, 59, 76, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.add-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(7, 59, 76, 0.4);
	}

	.add-btn:active {
		transform: scale(0.96);
	}

	.add-icon {
		font-size: 1.3rem;
		font-weight: 300;
		line-height: 1;
	}

	.add-label {
		letter-spacing: 0.3px;
	}
</style>
