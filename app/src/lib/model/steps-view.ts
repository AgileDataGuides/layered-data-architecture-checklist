// What the Steps tab reads and writes, kept apart from where it is stored.
//
// The standalone page builds a ChecklistView from its store, and
// ChecklistLayout builds one from the DataAdapter's nodes, so the same
// StepsView works in both. Nothing here is stored: each step's status line
// and the Check step's gaps are derived from the checklist every time.

import { STEPS, type StepCanon, type StepId } from '../canon/steps';

export interface StepPattern {
	id: string;
	name: string;
	multiSelect: boolean;
}

export interface StepLayer {
	/** Unique within the checklist. The host maps it back to its own layer. */
	key: string;
	name: string;
	values: Record<string, string[]>;
	notes: Record<string, string>;
}

export interface ChecklistView {
	layers: StepLayer[];
	/** The patterns shown on the checklist, in its order. Patterns turned off are not here. */
	patterns: StepPattern[];
	lookups: Record<string, string[]>;
	dictionary: { patterns: Record<string, string>; values: Record<string, Record<string, string>> };
}

export interface StepActions {
	setValues: (layerKey: string, patternId: string, values: string[]) => void;
	setNote: (layerKey: string, patternId: string, note: string) => void;
	addLayer: (name: string) => void;
	renameLayer: (layerKey: string, name: string) => void;
	moveLayer: (layerKey: string, toIndex: number) => void;
	removeLayer: (layerKey: string) => void;
}

export interface VisibleStep extends StepCanon {
	number: number;
	/** The checklist's patterns this step asks about, in the checklist's order. */
	patterns: StepPattern[];
}

export interface StepStatus {
	/** Something has been captured for this step. */
	started: boolean;
	line: string;
}

export interface PatternGap {
	pattern: StepPattern;
	/** The names of the layers with no value for this pattern. */
	layers: string[];
}

export interface StepGaps {
	step: VisibleStep;
	gaps: PatternGap[];
	count: number;
}

export function count(n: number, singular: string, plural = `${singular}s`): string {
	return `${n} ${n === 1 ? singular : plural}`;
}

/** Sort patterns by a checklist's saved pattern order. Patterns missing from the order go last. */
export function sortByOrder<T extends { id: string }>(patterns: T[], order: string[] | undefined): T[] {
	if (!order || order.length === 0) return [...patterns];
	const position = new Map(order.map((id, i) => [id, i]));
	return [...patterns].sort((a, b) => (position.get(a.id) ?? 999) - (position.get(b.id) ?? 999));
}

/**
 * The steps to show, numbered in order. Name the Layers and Check the
 * Checklist always show. A pattern step shows when at least one of its
 * patterns is on. Other Patterns takes every pattern no other step asks about.
 */
export function visibleSteps(patterns: StepPattern[]): VisibleStep[] {
	const claimed = new Set(STEPS.flatMap((s) => s.patternIds));
	const steps: VisibleStep[] = [];
	for (const step of STEPS) {
		const own =
			step.id === 'other'
				? patterns.filter((p) => !claimed.has(p.id))
				: patterns.filter((p) => step.patternIds.includes(p.id));
		const always = step.id === 'layers' || step.id === 'check';
		if (!always && own.length === 0) continue;
		steps.push({ ...step, number: steps.length + 1, patterns: own });
	}
	return steps;
}

/** The tab's name, "9 Steps" for the AgileData example. It counts the steps shown, so an added or hidden step changes it. */
export function stepsTabLabel(patterns: StepPattern[]): string {
	return `${visibleSteps(patterns).length} Steps`;
}

/** "Step 3 - Model the Data" */
export function stepLabel(step: VisibleStep): string {
	return `Step ${step.number} - ${step.name}`;
}

export function hasValue(layer: StepLayer, patternId: string): boolean {
	return (layer.values[patternId]?.length ?? 0) > 0;
}

function answered(view: ChecklistView, step: VisibleStep): number {
	let n = 0;
	for (const layer of view.layers) {
		for (const pattern of step.patterns) if (hasValue(layer, pattern.id)) n++;
	}
	return n;
}

/** The gaps in one step: each of its patterns with the layers that have no value for it. */
export function stepGaps(view: ChecklistView, step: VisibleStep): StepGaps {
	const gaps = step.patterns
		.map((pattern) => ({
			pattern,
			layers: view.layers.filter((layer) => !hasValue(layer, pattern.id)).map((layer) => layer.name)
		}))
		.filter((gap) => gap.layers.length > 0);
	return { step, gaps, count: gaps.reduce((n, gap) => n + gap.layers.length, 0) };
}

/** Every step's gaps, for the Check step. Steps with no gaps are left out. */
export function allGaps(view: ChecklistView, steps: VisibleStep[]): StepGaps[] {
	return steps.filter((s) => s.id !== 'check').map((s) => stepGaps(view, s)).filter((g) => g.count > 0);
}

export function stepStatus(view: ChecklistView, step: VisibleStep, steps: VisibleStep[]): StepStatus {
	const layers = view.layers.length;
	const id: StepId = step.id;

	if (id === 'layers') {
		const parts = [layers === 0 ? 'No layers yet' : count(layers, 'layer')];
		if (layers > 0 && step.patterns.length > 0) {
			const withAlias = view.layers.filter((l) => step.patterns.some((p) => hasValue(l, p.id))).length;
			parts.push(`${withAlias} with an alias`);
		}
		return { started: layers > 0, line: parts.join(', ') };
	}

	if (id === 'check') {
		const gaps = allGaps(view, steps).reduce((n, g) => n + g.count, 0);
		if (layers === 0) return { started: false, line: 'No layers yet' };
		return { started: gaps === 0, line: gaps === 0 ? 'No gaps' : `${count(gaps, 'gap')} to look at` };
	}

	if (layers === 0) return { started: false, line: 'No layers yet' };
	const done = answered(view, step);
	return { started: done > 0, line: `${done} of ${layers * step.patterns.length} answered` };
}
