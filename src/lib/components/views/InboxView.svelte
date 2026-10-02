<script lang="ts">
	import { app } from '$lib/stores/app.svelte';
	import { ui } from '$lib/stores/ui.svelte';
	import { parseQuick } from '$lib/utils/parse';
	import TaskRow from '../TaskRow.svelte';
	import Icon from '../Icon.svelte';

	/** Quick capture: type, Enter, done. Refine later. */
	let text = $state('');

	function capture(e: SubmitEvent) {
		e.preventDefault();
		const p = parseQuick(text, app.threads);
		const title = p.title || text.trim();
		if (!title) return;
		app.addTask({
			title,
			someday: true,
			tags: p.tags,
			...(p.threadId && { threadId: p.threadId }),
			...(p.importance && { importance: p.importance }),
			...(p.estimate && { estimate: p.estimate }),
			...(p.dueDate && { dueDate: p.dueDate }),
			...(p.dueTime && { dueTime: p.dueTime }),
			...(p.recurrence && { recurrence: p.recurrence })
		});
		text = '';
	}

	const parked = $derived(app.somedayTasks);
</script>

<section class="inbox">
	<p class="intro">Alles, was dir einfällt – raus aus dem Kopf. Kommt nicht auf den Stapel, bis du es sortierst.</p>

	<form class="capture" onsubmit={capture}>
		<Icon name="plus" size={18} />
		<input bind:value={text} placeholder="Idee, Gedanke, „irgendwann mal …“" aria-label="Schnell notieren" enterkeyhint="done" />
		{#if text.trim()}<button class="btn primary">Parken</button>{/if}
	</form>

	{#if parked.length}
		<ul class="list">
			{#each parked as t (t.id)}
				<TaskRow task={t} parked />
			{/each}
		</ul>
		<p class="hint">Antippen zum Sortieren (Strang, Dauer, Datum) · <Icon name="stack" size={13} /> legt es auf den Stapel.</p>
	{:else}
		<div class="empty">
			<Icon name="inbox" size={34} />
			<p>Leer. Kopf frei.</p>
			<button class="btn" onclick={() => ui.open({ type: 'task', someday: true })}>Etwas parken</button>
		</div>
	{/if}
</section>

<style>
	.inbox {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.intro,
	.hint {
		margin: 0;
		color: var(--muted);
		font-size: 0.88rem;
	}
	.hint {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-wrap: wrap;
		font-size: 0.78rem;
	}
	.capture {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 6px 4px 14px;
		background: var(--surface);
		border-radius: 16px;
		box-shadow: var(--shadow);
		color: var(--muted);
	}
	.capture input {
		flex: 1;
		min-width: 0;
		padding: 12px 0;
		border: 0;
		background: none;
		outline: none;
		color: var(--ink);
	}
	.capture .btn {
		border-radius: 12px;
		padding: 8px 12px;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 40px 16px;
		color: var(--muted);
		background: var(--surface);
		border-radius: var(--radius);
	}
	.empty p {
		margin: 0;
		font-weight: 700;
	}
</style>
