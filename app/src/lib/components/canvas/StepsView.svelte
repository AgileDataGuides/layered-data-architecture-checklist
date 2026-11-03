<script lang="ts">
	// The Steps tab: the Layered Data Architecture Checklist filled in one
	// step at a time. A rail of steps on the left, the selected step's panel on
	// the right, Back and Next under the panel. A checklist, never a wizard:
	// every step is reachable at any time and no step blocks another. Each
	// row's status line reads off the checklist, so the Steps tab and the
	// Checklist grid are two views of the same layers and values.
	//
	// It takes a ChecklistView and a set of actions, never a store or an
	// adapter, so the standalone page and ChecklistLayout (in the Context
	// Plane) each feed it from their own storage.
	//
	// Relative imports, never $lib: the Context Plane imports this view
	// through ChecklistLayout, and $lib there is its own folder.
	import { STEP_NAV, STEP_PANEL, STEP_RAIL, TEXT } from '../../ui/tokens';
	import { EMPTY, STEPS, type StepId } from '../../canon/steps';
	import {
		stepLabel,
		stepStatus,
		visibleSteps,
		type ChecklistView,
		type StepActions,
		type VisibleStep
	} from '../../model/steps-view';
	import LayersPanel from './steps/LayersPanel.svelte';
	import PatternCard from './steps/PatternCard.svelte';
	import CheckPanel from './steps/CheckPanel.svelte';

	let {
		view,
		actions,
		selected = $bindable()
	}: {
		view: ChecklistView;
		actions: StepActions;
		/** The selected step. A host can bind it; an unknown value falls back to the remembered step. */
		selected?: string;
	} = $props();

	const steps = $derived(visibleSteps(view.patterns));

	// Without a step from the host, the selected step is a per-viewer convenience, remembered in this browser
	const STORAGE_KEY = 'lda-active-step';

	function remembered(): StepId {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			const known = STEPS.find((s) => s.id === saved);
			if (known) return known.id;
		} catch {
			// no storage: start at Step 1
		}
		return 'layers';
	}

	if (!selected) selected = remembered();
	// A step can disappear when its patterns are turned off. Then Step 1 shows.
	const stepIndex = $derived(Math.max(0, steps.findIndex((s) => s.id === selected)));
	const step = $derived(steps[stepIndex]);

	function select(target: VisibleStep) {
		selected = target.id;
		try {
			localStorage.setItem(STORAGE_KEY, target.id);
		} catch {
			// no storage: the choice lasts until reload
		}
	}

	// Back and Next: the steps either side of this one
	const previous = $derived(stepIndex > 0 ? steps[stepIndex - 1] : undefined);
	const next = $derived(stepIndex < steps.length - 1 ? steps[stepIndex + 1] : undefined);

	// A step opens at its top, whether it was picked on the rail or with Back and Next.
	// Keyed on the id, never the step object: every edit rebuilds the view, and with it
	// the step objects, so keying on the object jumps the panel to the top on each click.
	const stepId = $derived(step.id);
	let scroller = $state<HTMLElement>();
	$effect(() => {
		void stepId;
		scroller?.scrollTo({ top: 0 });
	});

	const statuses = $derived(new Map(steps.map((s) => [s.id, stepStatus(view, s, steps)])));
</script>

<div class="flex h-full min-h-0">
	<nav class={STEP_RAIL.container} aria-label="The steps">
		<ul class="py-2">
			{#each steps as s (s.id)}
				{@const active = s.id === step.id}
				{@const status = statuses.get(s.id)}
				<li>
					<button
						type="button"
						aria-current={active ? 'step' : undefined}
						class="{STEP_RAIL.row} {active ? STEP_RAIL.rowActive : STEP_RAIL.rowInactive}"
						onclick={() => select(s)}
					>
						<span class={status?.started ? STEP_RAIL.dotStarted : STEP_RAIL.dotEmpty}></span>
						<span class="min-w-0">
							<span class="block {active ? STEP_RAIL.labelActive : STEP_RAIL.labelInactive}">{stepLabel(s)}</span>
							<span class="block {STEP_RAIL.status}">{status?.line}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	</nav>

	<section class="flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-50">
		<div bind:this={scroller} class="flex-1 overflow-y-auto {STEP_PANEL.body}">
			<header class="space-y-1 pb-3 mb-4 border-b border-slate-200">
				<p class={STEP_PANEL.label}>{stepLabel(step)}</p>
				<h2 class={STEP_PANEL.question}>{step.question}</h2>
				<p class={STEP_PANEL.description}>{step.description}</p>
				{#if step.guide}
					<p class={STEP_PANEL.guide}>{step.guide}</p>
				{/if}
			</header>
			<div class="max-w-4xl space-y-3">
				{#if step.id === 'check'}
					<CheckPanel {view} {steps} onGoToStep={select} />
				{:else}
					{#if step.id === 'layers'}
						<LayersPanel {view} {actions} />
					{:else if view.layers.length === 0}
						<p class={TEXT.empty}>{EMPTY.needsLayers}</p>
					{/if}
					{#if view.layers.length > 0}
						{#each step.patterns as pattern (pattern.id)}
							<PatternCard {pattern} {view} {actions} />
						{/each}
					{/if}
				{/if}
			</div>
		</div>

		<nav class={STEP_NAV.bar} aria-label="Move between steps">
			{#if previous}
				{@const to = previous}
				<button type="button" class={STEP_NAV.button} title="Back: {stepLabel(to)}" onclick={() => select(to)}>
					<svg class={STEP_NAV.icon} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
					</svg>
					<span class={STEP_NAV.label}>Back: {stepLabel(to)}</span>
				</button>
			{:else}
				<span></span>
			{/if}
			{#if next}
				{@const to = next}
				<button type="button" class={STEP_NAV.button} title="Next: {stepLabel(to)}" onclick={() => select(to)}>
					<span class={STEP_NAV.label}>Next: {stepLabel(to)}</span>
					<svg class={STEP_NAV.icon} fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
					</svg>
				</button>
			{/if}
		</nav>
	</section>
</div>
