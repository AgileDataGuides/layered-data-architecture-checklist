<script lang="ts">
	// One pattern in a step: its name, what it means, then a row per layer
	// with the layer's values and its note. Each row writes the same cell the
	// Checklist grid shows.
	import { PICK_HINT } from '../../../canon/steps';
	import type { ChecklistView, StepActions, StepPattern } from '../../../model/steps-view';
	import { CARD, INPUT, LAYER_LABEL, LIST_DIVIDER, ROW_ACTION, TEXT } from '../../../ui/tokens';
	import ValuePicker from './ValuePicker.svelte';

	let {
		pattern,
		view,
		actions
	}: {
		pattern: StepPattern;
		view: ChecklistView;
		actions: StepActions;
	} = $props();

	// The layer whose note is open for editing
	let editingNote = $state<string | null>(null);
	// Escape closes the note without saving, even if the browser blurs the field as it goes
	let cancelled = false;

	function saveNote(layerKey: string, text: string) {
		editingNote = null;
		if (cancelled) {
			cancelled = false;
			return;
		}
		const current = view.layers.find((l) => l.key === layerKey)?.notes[pattern.id] ?? '';
		if (text.trim() !== current) actions.setNote(layerKey, pattern.id, text.trim());
	}
</script>

<section class={CARD}>
	<div class="flex items-baseline gap-2">
		<h3 class={TEXT.patternName}>{pattern.name}</h3>
		<span class={TEXT.pickHint}>{pattern.multiSelect ? PICK_HINT.many : PICK_HINT.one}</span>
	</div>
	{#if view.dictionary.patterns[pattern.id]}
		<p class="{TEXT.description} mt-0.5">{view.dictionary.patterns[pattern.id]}</p>
	{/if}

	<ul class="{LIST_DIVIDER} mt-2">
		{#each view.layers as layer (layer.key)}
			{@const note = layer.notes[pattern.id] ?? ''}
			<li class="flex items-start gap-3 py-2">
				<span class="{LAYER_LABEL} {TEXT.layerName}">{layer.name}</span>
				<div class="flex-1 min-w-0 space-y-1.5">
					<ValuePicker
						options={view.lookups[pattern.id] ?? []}
						selected={layer.values[pattern.id] ?? []}
						multiSelect={pattern.multiSelect}
						descriptions={view.dictionary.values[pattern.id]}
						onChange={(values) => actions.setValues(layer.key, pattern.id, values)}
					/>
					{#if editingNote === layer.key}
						<!-- svelte-ignore a11y_autofocus -->
						<textarea
							class={INPUT.textarea}
							rows="2"
							placeholder="Why this value for {layer.name}?"
							aria-label="Note on {pattern.name} for {layer.name}"
							autofocus
							value={note}
							onblur={(e) => saveNote(layer.key, e.currentTarget.value)}
							onkeydown={(e) => {
								if (e.key === 'Escape') {
									cancelled = true;
									editingNote = null;
								}
							}}
						></textarea>
					{:else if note}
						<p class={TEXT.note}>{note}</p>
					{/if}
				</div>
				{#if editingNote !== layer.key}
					<button
						type="button"
						class="{ROW_ACTION.neutral} shrink-0 pt-1"
						onclick={() => {
							// A browser that fires no blur as the field goes leaves an Escape's flag set
							cancelled = false;
							editingNote = layer.key;
						}}
					>
						{note ? 'Edit note' : 'Add note'}
					</button>
				{/if}
			</li>
		{/each}
	</ul>
</section>
