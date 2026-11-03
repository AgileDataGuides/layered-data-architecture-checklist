// The design tokens the Steps tab uses, copied from design/tokens.md.
//
// tokens.md is AUTHORITATIVE: if this file and tokens.md disagree, tokens.md
// wins. They live here, not imported from @context-plane/shared/design-tokens,
// because scripts/publish-app.sh does not bundle that module into the public
// repo. The Concept Model and the Information Product Canvas keep their own
// copies for the same reason.

/** tokens.md buttons */
export const BUTTON = {
	/** buttons.success_create_outlined */
	add: 'px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 transition-colors'
};

/** tokens.md form_inputs */
export const INPUT = {
	/** form_inputs.text */
	text: 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white',
	/** form_inputs.textarea */
	textarea: 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white'
};

/** tokens.md checklist_steps.pattern_card: one pattern in a step, or one step's gaps in Check (DESIGN_SYSTEM.md § 20) */
export const CARD = 'bg-white rounded-lg shadow-sm border border-slate-200 p-3';

/** tokens.md cards.list_divider: the hairline between a pattern card's layer rows */
export const LIST_DIVIDER = 'divide-y divide-slate-100';

/** tokens.md typography */
export const TEXT = {
	/** typography.label_section_header: a pattern's name on its card */
	patternName: 'text-sm font-semibold text-slate-700',
	/** typography.card_desc: "Pick one" beside a pattern's name */
	pickHint: 'text-[10px] text-slate-400 leading-tight',
	/** typography.small in slate-500: a pattern's description */
	description: 'text-xs text-slate-500 leading-relaxed',
	/** typography.card_title: a layer's name at the start of its row */
	layerName: 'text-xs font-medium text-slate-800 leading-tight',
	/** typography.small + placeholder_italic_unset */
	empty: 'text-xs text-slate-300 italic',
	/** typography.small in slate-600: a saved note under a layer row */
	note: 'text-xs text-slate-600 whitespace-pre-wrap'
};

/** tokens.md checklist_steps.layer_label: the column the layer names sit in */
export const LAYER_LABEL = 'w-32 shrink-0 pt-1';

/** tokens.md checklist_steps.layer_number: a layer's place in the order, in Step 1, with typography.card_desc */
export const LAYER_NUMBER = 'w-4 shrink-0 text-right';

/** tokens.md checklist_steps.gap_pattern: the column a pattern's name sits in on a Check card */
export const GAP_PATTERN = 'w-48 shrink-0';

/** tokens.md choice_chips: a value a layer can be given */
export const CHIP = {
	wrapper: 'inline-flex flex-wrap gap-1',
	base: 'px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors',
	active: 'bg-blue-50 text-blue-700 border-blue-300',
	inactive: 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
};

/** tokens.md event_matrix.hover_card (checklist_steps.value_hover_card): what a value means, on hover or focus over its chip */
export const HOVER_CARD = {
	card: 'fixed z-50 w-60 pointer-events-none bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5 text-[11px] leading-relaxed text-slate-700',
	title: 'font-semibold text-slate-800 mb-1',
	/** The card's width in pixels, w-60, to keep it inside the window */
	width: 240
};

/** tokens.md state_chips */
export const STATE_CHIP = {
	base: 'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border',
	positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	warning: 'bg-amber-50 text-amber-700 border-amber-200'
};

/** tokens.md row_actions */
export const ROW_ACTION = {
	neutral: 'text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors',
	danger: 'text-[11px] font-medium text-red-600 hover:text-red-700 transition-colors'
};

/** tokens.md step_rail: the steps down the left of the Steps tab (DESIGN_SYSTEM.md § 18 Step Rail, § 20). */
export const STEP_RAIL = {
	container: 'w-72 shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto',
	row: 'w-full text-left flex items-start gap-2 px-3 py-2 border-l-2 transition-colors',
	rowActive: 'bg-white border-blue-600',
	rowInactive: 'border-transparent hover:bg-slate-100',
	labelActive: 'text-xs font-semibold text-slate-800',
	labelInactive: 'text-xs font-medium text-slate-600',
	status: 'text-[10px] text-slate-400 leading-tight',
	dotStarted: 'mt-1 w-2 h-2 shrink-0 rounded-full bg-slate-600',
	dotEmpty: 'mt-1 w-2 h-2 shrink-0 rounded-full border border-slate-300'
};

/** tokens.md step_panel: the header of the selected step (DESIGN_SYSTEM.md § 18 Step Panel). */
export const STEP_PANEL = {
	label: 'text-xs font-semibold text-slate-500',
	question: 'text-base font-semibold text-slate-800',
	description: 'text-xs text-slate-500 leading-relaxed',
	guide: 'text-xs text-slate-700 leading-relaxed',
	body: 'px-6 py-5'
};

/** tokens.md step_nav: Back and Next under the selected step (DESIGN_SYSTEM.md § 18 Step Nav). */
export const STEP_NAV = {
	bar: 'shrink-0 flex items-center justify-between gap-3 px-6 py-2.5 border-t border-slate-200 bg-white',
	/** buttons.secondary_slate, with room for the arrow */
	button:
		'inline-flex items-center gap-1.5 min-w-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors',
	label: 'truncate',
	/** Heroicons outline arrow-left / arrow-right */
	icon: 'w-4 h-4 shrink-0'
};
