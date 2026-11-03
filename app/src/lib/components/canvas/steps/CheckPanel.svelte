<script lang="ts">
	// The last step: one card per step that still has gaps. Each card lists its
	// patterns with the layers that have no value yet, and links to the step
	// that fills them. A gap is a prompt, never a block.
	import { EMPTY } from '../../../canon/steps';
	import { allGaps, count, stepLabel, type ChecklistView, type VisibleStep } from '../../../model/steps-view';
	import { CARD, GAP_PATTERN, LIST_DIVIDER, ROW_ACTION, STATE_CHIP, TEXT } from '../../../ui/tokens';

	let {
		view,
		steps,
		onGoToStep
	}: {
		view: ChecklistView;
		steps: VisibleStep[];
		onGoToStep: (step: VisibleStep) => void;
	} = $props();

	const gaps = $derived(allGaps(view, steps));
</script>

{#if view.layers.length === 0}
	<p class={TEXT.empty}>{EMPTY.needsLayers}</p>
{:else if gaps.length === 0}
	<span class="{STATE_CHIP.base} {STATE_CHIP.positive}">{EMPTY.noGaps}</span>
{:else}
	<div class="space-y-3">
		{#each gaps as { step, gaps: patternGaps, count: n } (step.id)}
			<section class={CARD}>
				<div class="flex items-center justify-between gap-3">
					<h3 class={TEXT.patternName}>{stepLabel(step)}</h3>
					<span class="{STATE_CHIP.base} {STATE_CHIP.warning}">{count(n, 'gap')}</span>
				</div>
				<ul class="{LIST_DIVIDER} mt-2">
					{#each patternGaps as gap (gap.pattern.id)}
						<li class="flex items-start gap-3 py-1.5">
							<span class="{GAP_PATTERN} {TEXT.layerName}">{gap.pattern.name}</span>
							<span class={TEXT.description}>{gap.layers.join(', ')}</span>
						</li>
					{/each}
				</ul>
				<button type="button" class="{ROW_ACTION.neutral} mt-2" onclick={() => onGoToStep(step)}>Go to {stepLabel(step)}</button>
			</section>
		{/each}
	</div>
{/if}
