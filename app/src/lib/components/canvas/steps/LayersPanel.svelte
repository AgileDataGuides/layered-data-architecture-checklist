<script lang="ts">
	// Step 1: the layers in order. Rename a layer in place, move it up or
	// down, remove it, or add one at the end. Enter adds and keeps the cursor
	// in the field, so a team can type every layer in one go. The checklist
	// always keeps at least one layer, the same as the grid.
	import { ADD_LAYER_PLACEHOLDER, EMPTY } from '../../../canon/steps';
	import type { ChecklistView, StepActions } from '../../../model/steps-view';
	import { BUTTON, CARD, INPUT, LAYER_NUMBER, LIST_DIVIDER, ROW_ACTION, TEXT } from '../../../ui/tokens';

	let { view, actions }: { view: ChecklistView; actions: StepActions } = $props();

	let newName = $state('');

	function add() {
		const name = newName.trim();
		if (!name) return;
		actions.addLayer(name);
		newName = '';
	}

	function rename(key: string, input: HTMLInputElement) {
		const name = input.value.trim();
		const layer = view.layers.find((l) => l.key === key);
		if (!layer) return;
		if (!name) {
			input.value = layer.name;
			return;
		}
		if (name !== layer.name) actions.renameLayer(key, name);
	}

	function remove(key: string) {
		const layer = view.layers.find((l) => l.key === key);
		if (!layer) return;
		const filled = Object.values(layer.values).filter((v) => v.length > 0).length;
		if (filled > 0 && !confirm(`Remove the ${layer.name} layer and its ${filled} answered patterns?`)) return;
		actions.removeLayer(key);
	}
</script>

<section class={CARD}>
	<div class="flex gap-2">
		<input
			class={INPUT.text}
			type="text"
			placeholder={ADD_LAYER_PLACEHOLDER}
			aria-label="New layer name"
			bind:value={newName}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					add();
				}
			}}
		/>
		<button type="button" class="{BUTTON.add} shrink-0" onclick={add}>Add</button>
	</div>

	{#if view.layers.length === 0}
		<p class="{TEXT.empty} mt-3">{EMPTY.layers}</p>
	{:else}
		<ol class="{LIST_DIVIDER} mt-2">
			{#each view.layers as layer, i (layer.key)}
				<li class="flex items-center gap-3 py-2">
					<span class="{TEXT.pickHint} {LAYER_NUMBER}">{i + 1}</span>
					<input
						class="{INPUT.text} max-w-xs"
						type="text"
						value={layer.name}
						aria-label="Name of layer {i + 1}"
						onchange={(e) => rename(layer.key, e.currentTarget)}
						onkeydown={(e) => {
							if (e.key === 'Enter') e.currentTarget.blur();
						}}
					/>
					<div class="flex items-center gap-3 ml-auto shrink-0">
						{#if i > 0}
							<button type="button" class={ROW_ACTION.neutral} onclick={() => actions.moveLayer(layer.key, i - 1)}>Move up</button>
						{/if}
						{#if i < view.layers.length - 1}
							<button type="button" class={ROW_ACTION.neutral} onclick={() => actions.moveLayer(layer.key, i + 1)}>Move down</button>
						{/if}
						{#if view.layers.length > 1}
							<button type="button" class={ROW_ACTION.danger} onclick={() => remove(layer.key)}>Remove</button>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</section>
