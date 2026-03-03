<script lang="ts">
	import type { Priority, Location, EisenhowerQuadrant, RecurrenceType } from '$lib/types';
	import { TAG_PRESETS, PRIORITY_LABELS, LOCATION_LABELS, QUADRANT_LABELS } from '$lib/types';
	import { taskStore } from '$lib/stores/tasks.svelte';

	let { onClose }: { onClose: () => void } = $props();

	let title = $state('');
	let description = $state('');
	let priority = $state<Priority>('medium');
	let location = $state<Location>('anywhere');
	let quadrant = $state<EisenhowerQuadrant>('q2');
	let selectedTags = $state<string[]>([]);
	let project = $state('');
	let category = $state('');
	let dueDate = $state('');
	let estimatedMinutes = $state(30);
	let recurrence = $state<RecurrenceType>('none');
	let expanded = $state(false);

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	function handleSubmit() {
		if (!title.trim()) return;
		taskStore.addTask({
			title: title.trim(),
			description: description.trim() || undefined,
			priority,
			location,
			quadrant,
			tags: selectedTags,
			project: project.trim() || undefined,
			category: category.trim() || undefined,
			dueDate: dueDate || undefined,
			estimatedMinutes,
			recurrence
		});
		onClose();
	}
</script>

<div class="form-overlay" onclick={onClose} onkeydown={(e) => e.key === 'Escape' && onClose()} role="button" tabindex="-1">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="form-container" onclick={(e) => e.stopPropagation()} onkeydown={() => {}}>
		<div class="form-header">
			<h2>Neue Aufgabe</h2>
			<button class="close-btn" onclick={onClose}>✕</button>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
			<div class="form-field">
				<input
					type="text"
					placeholder="Aufgabe eingeben..."
					bind:value={title}
					class="input-title"
				/>
			</div>

			<div class="form-field">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label>Priorität</label>
				<div class="pill-group">
					{#each (['low', 'medium', 'high', 'urgent'] as const) as p}
						<button
							type="button"
							class="pill priority-{p}"
							class:active={priority === p}
							onclick={() => priority = p}
						>{PRIORITY_LABELS[p]}</button>
					{/each}
				</div>
			</div>

			<div class="form-field">
				<!-- svelte-ignore a11y_label_has_associated_control -->
				<label>Tags</label>
				<div class="pill-group">
					{#each TAG_PRESETS as tag}
						<button
							type="button"
							class="pill tag-pill"
							class:active={selectedTags.includes(tag)}
							onclick={() => toggleTag(tag)}
						>#{tag}</button>
					{/each}
				</div>
			</div>

			<div class="form-row">
				<div class="form-field half">
					<label for="due-date">Fälligkeit</label>
					<input id="due-date" type="date" bind:value={dueDate} class="input-field" />
				</div>
				<div class="form-field half">
					<label for="est-minutes">Dauer (Min)</label>
					<input id="est-minutes" type="number" bind:value={estimatedMinutes} min="5" step="5" class="input-field" />
				</div>
			</div>

			<div class="form-row">
				<div class="form-field half">
					<label for="task-location">Ort</label>
					<select id="task-location" bind:value={location} class="input-field">
						{#each Object.entries(LOCATION_LABELS) as [val, label]}
							<option value={val}>{label}</option>
						{/each}
					</select>
				</div>
				<div class="form-field half">
					<label for="task-recurrence">Wiederholung</label>
					<select id="task-recurrence" bind:value={recurrence} class="input-field">
						<option value="none">Einmalig</option>
						<option value="daily">Täglich</option>
						<option value="weekly">Wöchentlich</option>
						<option value="monthly">Monatlich</option>
					</select>
				</div>
			</div>

			{#if !expanded}
				<button type="button" class="expand-btn" onclick={() => expanded = true}>
					Mehr Optionen
				</button>
			{:else}
				<div class="form-field">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label>Eisenhower</label>
					<div class="pill-group">
						{#each (['q1', 'q2', 'q3', 'q4'] as const) as q}
							<button
								type="button"
								class="pill quadrant-{q}"
								class:active={quadrant === q}
								onclick={() => quadrant = q}
							>{QUADRANT_LABELS[q]}</button>
						{/each}
					</div>
				</div>

				<div class="form-field">
					<input type="text" placeholder="Beschreibung (optional)" bind:value={description} class="input-field" />
				</div>

				<div class="form-row">
					<div class="form-field half">
						<input type="text" placeholder="Projekt" bind:value={project} class="input-field" />
					</div>
					<div class="form-field half">
						<input type="text" placeholder="Kategorie" bind:value={category} class="input-field" />
					</div>
				</div>
			{/if}

			<button type="submit" class="submit-btn" disabled={!title.trim()}>
				Aufgabe hinzufügen
			</button>
		</form>
	</div>
</div>

<style>
	.form-overlay {
		position: fixed;
		inset: 0;
		background: rgba(7, 59, 76, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 100;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.form-container {
		background: white;
		border-radius: 24px 24px 0 0;
		padding: 24px;
		width: 100%;
		max-width: 500px;
		max-height: 85vh;
		overflow-y: auto;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.form-header h2 {
		margin: 0;
		font-size: 1.2rem;
		color: #073B4C;
	}

	.close-btn {
		background: #f0f4f8;
		border: none;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		font-size: 1rem;
		cursor: pointer;
		color: #5a7a8a;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.form-field {
		margin-bottom: 14px;
	}

	.form-field label {
		display: block;
		font-size: 0.78rem;
		font-weight: 600;
		color: #5a7a8a;
		margin-bottom: 6px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.form-row {
		display: flex;
		gap: 12px;
	}

	.form-field.half {
		flex: 1;
	}

	.input-title {
		width: 100%;
		padding: 14px 16px;
		border: 2px solid #e4eaf0;
		border-radius: 14px;
		font-size: 1rem;
		font-weight: 600;
		color: #073B4C;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.2s;
	}

	.input-title:focus {
		border-color: #118AB2;
	}

	.input-title::placeholder {
		color: #a0b4c0;
		font-weight: 400;
	}

	.input-field {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid #e4eaf0;
		border-radius: 10px;
		font-size: 0.88rem;
		color: #073B4C;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.2s;
		background: white;
	}

	.input-field:focus {
		border-color: #118AB2;
	}

	.pill-group {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.pill {
		padding: 6px 12px;
		border: 2px solid #e4eaf0;
		border-radius: 10px;
		background: white;
		font-size: 0.78rem;
		font-weight: 500;
		color: #5a7a8a;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.pill:hover {
		border-color: #c0d0dc;
	}

	.pill.active {
		border-color: #118AB2;
		background: #118AB210;
		color: #118AB2;
	}

	.pill.active.priority-urgent { border-color: #EF476F; background: #EF476F15; color: #EF476F; }
	.pill.active.priority-high { border-color: #FFD166; background: #FFD16625; color: #b8860b; }
	.pill.active.priority-medium { border-color: #06D6A0; background: #06D6A015; color: #0a8f6a; }
	.pill.active.priority-low { border-color: #118AB2; background: #118AB215; color: #118AB2; }

	.pill.active.quadrant-q1 { border-color: #EF476F; background: #EF476F15; color: #EF476F; }
	.pill.active.quadrant-q2 { border-color: #06D6A0; background: #06D6A015; color: #0a8f6a; }
	.pill.active.quadrant-q3 { border-color: #FFD166; background: #FFD16625; color: #b8860b; }
	.pill.active.quadrant-q4 { border-color: #118AB2; background: #118AB215; color: #118AB2; }

	.pill.tag-pill.active {
		border-color: #06D6A0;
		background: #06D6A015;
		color: #0a8f6a;
	}

	.expand-btn {
		width: 100%;
		padding: 10px;
		background: none;
		border: 2px dashed #e4eaf0;
		border-radius: 10px;
		font-size: 0.82rem;
		color: #118AB2;
		cursor: pointer;
		margin-bottom: 14px;
		font-weight: 500;
	}

	.expand-btn:hover {
		border-color: #118AB2;
		background: #118AB208;
	}

	.submit-btn {
		width: 100%;
		padding: 14px;
		background: #06D6A0;
		border: none;
		border-radius: 14px;
		font-size: 1rem;
		font-weight: 700;
		color: white;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		box-shadow: 0 4px 14px rgba(6, 214, 160, 0.3);
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(6, 214, 160, 0.4);
	}

	.submit-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
