// THE one file for the guided steps' wording.
//
// Every step name, question, one-line description, line of step guidance and
// the patterns each step asks about live here, so a change to the wording or
// to which pattern sits in which step is a one-file edit.
//
// No written method for the Layered Data Architecture Checklist exists yet,
// so the steps group its patterns by theme, close to the patterns' own order:
// name the layers, govern them, model the data, store it, process it, set the
// change rules, build trust in it, give people access, then check for gaps.
// A pattern type a team adds in Manage Pattern Types lands in Other Patterns.
//
// Copy rules for anything a person reads: British spelling, "the
// organisation" never "the business", no em dashes, step labels in the form
// "Step 3 - Model the Data".

export type StepId =
	| 'layers'
	| 'governance'
	| 'modeling'
	| 'storage'
	| 'processing'
	| 'change'
	| 'trust'
	| 'access'
	| 'other'
	| 'check';

export interface StepCanon {
	id: StepId;
	name: string;
	/** The question the step asks, the most prominent line of its panel. */
	question: string;
	/** One or two lines on what the step captures. */
	description: string;
	/** More help under the description, where a step needs it. */
	guide?: string;
	/** The patterns the step asks about. Other Patterns and Check work theirs out from the rest. */
	patternIds: string[];
}

export const STEPS: StepCanon[] = [
	{
		id: 'layers',
		name: 'Name the Layers',
		question: 'Which layers does your data move through?',
		description:
			'The layers your data passes through, in order, from where it lands to where people use it, and the other names people use for each layer.',
		guide:
			'Start with the layer the data lands in and end with the layer people read from. The AgileData example has six: Landing, History, Designed, Consume, Cached and Last Mile. An alias maps your name to the name another team or vendor uses, for example Bronze or Silver.',
		patternIds: ['alias']
	},
	{
		id: 'governance',
		name: 'Govern the Layers',
		question: 'Which layers must every team use, and which hold personal data?',
		description:
			'Whether the use of each layer is Enforced, Advised or Optional, and whether it holds Personally Identifiable Information (PII).',
		patternIds: ['layer-governance-policy', 'contains-pii']
	},
	{
		id: 'modeling',
		name: 'Model the Data',
		question: 'How is the data in each layer designed?',
		description:
			'The modeling patterns each layer uses, and whether its design follows the source systems or the core business concepts of the organisation.',
		patternIds: ['concept-modeling-patterns', 'physical-data-structure', 'source-driven', 'integrates-core-business-concepts']
	},
	{
		id: 'storage',
		name: 'Store the Data',
		question: 'Where is the data in each layer kept, and for how long?',
		description:
			'Whether each layer keeps its data, the technology and format it is stored in, and how long it is kept before it is archived or deleted.',
		patternIds: ['data-persistence', 'data-storage-technology', 'data-storage-format', 'default-retention-period']
	},
	{
		id: 'processing',
		name: 'Process the Data',
		question: 'How does data get into each layer?',
		description: 'The technology that reads and writes each layer, how often it runs, and how it finds the data that changed.',
		patternIds: ['data-compute-technology', 'data-processing', 'change-detection']
	},
	{
		id: 'change',
		name: 'Set the Change Rules',
		question: 'What can change as data moves into each layer?',
		description:
			'Whether a layer can be rebuilt from scratch, rename fields, update values in place, add new data or calculate metrics.',
		patternIds: ['destructive-rebuilds', 'rename-fields', 'data-value-updates', 'derived-data', 'calculate-metrics']
	},
	{
		id: 'trust',
		name: 'Build Trust in the Data',
		question: 'How do you know the data in each layer is right?',
		description:
			'How each layer is audited and reconciled, and whether alerts fire when data breaks a Data Contract or a data quality rule.',
		patternIds: ['auditable', 'reconciliation-pattern', 'data-contract-alerts', 'data-quality-alerts']
	},
	{
		id: 'access',
		name: 'Give People Access',
		question: 'Who uses the data in each layer, and with which tools?',
		description: 'The Personas who can read or write the data in each layer, and the Last Mile tools they use to get to it.',
		patternIds: ['persona-access-read', 'persona-access-write', 'last-mile-tools']
	},
	{
		id: 'other',
		name: 'Other Patterns',
		question: 'What else does your team record about each layer?',
		description: 'The pattern types your team added that no other step asks about.',
		patternIds: []
	},
	{
		id: 'check',
		name: 'Check the Checklist',
		question: 'Is anything missing?',
		description:
			'Every pattern that has no value yet for a layer, step by step. A gap is a prompt, never a block: some patterns do not apply to every layer.',
		patternIds: []
	}
];

// ── Vocabulary ───────────────────────────────────────────────────────

/** The add field's placeholder in Step 1. Enter adds and keeps the cursor in the field. */
export const ADD_LAYER_PLACEHOLDER = 'Add a layer, for example Landing, press Enter';

/** A pattern with this many options or fewer shows every option as a chip. A longer list opens on click. */
export const CHIP_LIMIT = 8;

export const PICK_HINT = {
	one: 'Pick one',
	many: 'Pick one or more'
} as const;

export const EMPTY = {
	value: 'No value yet',
	layers: 'No layers yet. Add the first layer above.',
	needsLayers: 'No layers yet. Add them in Step 1.',
	noMatch: 'No value matches.',
	/** The hover card for a value with no description, such as one a team added */
	description: 'No description yet. Add one in Manage Patterns.',
	noGaps: 'No gaps found'
} as const;
