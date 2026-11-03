/**
 * Effective patterns / lookups / dictionary — defaults merged with the
 * user's localStorage overrides written by AdminPanel.
 *
 * Why this exists: ChecklistTable used to import directly from `$lib/data`,
 * which is a static module load. When AdminPanel removed pattern types or
 * edited lookup values, those changes landed in localStorage but the canvas
 * never refreshed because module-level imports don't re-run.
 *
 * Now the canvas reads from `effectiveData` (this module). On AdminPanel
 * `save()`, it calls `effectiveData.refresh()` which re-reads localStorage
 * and updates the reactive `$state`. The canvas re-renders automatically.
 *
 * Same-tab updates (user is on Manage Patterns, removes a pattern, switches
 * to Checklist tab) AND cross-tab updates (window 'storage' event listener)
 * both work.
 */

import {
	patterns as defaultPatterns,
	lookups as defaultLookups,
	dictionary as defaultDict
} from '$lib/data';
import type { Pattern, Lookups, Dictionary } from '$lib/types';

const PATTERNS_KEY = 'layer-checklist-patterns-overrides';
const LOOKUPS_KEY = 'layer-checklist-lookups-overrides';
const DICT_VALUES_KEY = 'layer-checklist-dict-overrides';
const DICT_PATTERN_DESC_KEY = 'layer-checklist-pattern-desc-overrides';
/**
 * Pattern IDs the user has explicitly hard-deleted via the trash icon
 * in Manage Pattern Types. The migration below (`loadPatternTypes`)
 * respects this list — defaults whose ID is here will NOT be reinstated
 * as toggled-off chips. This is the difference between toggling off
 * (reversible, pattern stays in catalog) and deleting (permanent until
 * Reset to Defaults).
 */
const DELETED_KEY = 'layer-checklist-deleted-pattern-ids';

function load<T>(key: string, fallback: T): T {
	if (typeof window === 'undefined') return structuredClone(fallback);
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : structuredClone(fallback);
	} catch {
		return structuredClone(fallback);
	}
}

/**
 * Load saved pattern types and reconcile them against the defaults shipped
 * with the SA app. The reconciliation is the heart of the toggle UX:
 *
 *   - Saved patterns missing the `enabled` field are treated as `enabled:
 *     true` (back-compat for users who have a localStorage state from
 *     before the toggle existed).
 *
 *   - Default patterns NOT present in saved (i.e. the user previously
 *     "removed" them via the old × button) are added back with `enabled:
 *     false`. This is what surfaces previously-deleted pattern types in
 *     the Manage Pattern Types list as toggled-off entries — making the
 *     "I deleted it and can't get it back" trap a thing of the past.
 *
 *   - Saved patterns NOT in defaults (custom patterns the user added) are
 *     preserved as-is with `enabled: true` if missing.
 *
 * Result: the returned array contains every pattern the user has ever had
 * — defaults plus their additions — with explicit enabled flags, sorted
 * by `order`.
 */
function loadPatternTypes(): Pattern[] {
	const saved = load<Pattern[]>(PATTERNS_KEY, defaultPatterns);
	const deleted = new Set<string>(load<string[]>(DELETED_KEY, []));
	const defaultsById = new Map(defaultPatterns.map((p) => [p.id, p]));
	// Refresh `order` from defaults so saved snapshots pick up master schema
	// reorders (e.g. when a new Pattern Type is inserted in the middle of the
	// list, the patterns after it get bumped). Other fields are preserved so
	// user renames / multiSelect edits survive. Custom patterns the user
	// added (not in defaults) keep their original order.
	const normalized: Pattern[] = saved.map((p) => ({
		...p,
		order: defaultsById.get(p.id)?.order ?? p.order,
		enabled: p.enabled ?? true
	}));
	const savedIds = new Set(normalized.map((p) => p.id));
	// Reinstate defaults that aren't currently saved, UNLESS they've been
	// explicitly hard-deleted via the trash icon — those stay gone until
	// Reset to Defaults clears the blacklist.
	//
	// Reinstated patterns are `enabled: true` so newly-shipped default
	// patterns (e.g. a new Pattern Type added to the master patterns.json
	// after the user already has a saved override) appear on the canvas
	// immediately. The pre-toggle "×" button era used `enabled: false`
	// here, but that silently hid every future shipped pattern from users
	// who had ever touched the patterns UI.
	const reinstated: Pattern[] = defaultPatterns
		.filter((p) => !savedIds.has(p.id) && !deleted.has(p.id))
		.map((p) => ({ ...p, enabled: true }));
	return [...normalized, ...reinstated].sort((a, b) => a.order - b.order);
}

class EffectiveData {
	patterns = $state<Pattern[]>(loadPatternTypes());
	lookups = $state<Lookups>(load(LOOKUPS_KEY, defaultLookups));
	dictValues = $state<Record<string, Record<string, string>>>(
		load(DICT_VALUES_KEY, defaultDict.values)
	);
	patternDescs = $state<Record<string, string>>(
		load(DICT_PATTERN_DESC_KEY, defaultDict.patterns)
	);

	get dictionary(): Dictionary {
		return { patterns: this.patternDescs, values: this.dictValues };
	}

	/**
	 * Patterns that should be visible on the canvas — the subset of the
	 * full catalog with `enabled !== false`. ChecklistTable should read
	 * from this; AdminPanel reads `.patterns` (the full catalog, including
	 * disabled entries) so the toggle UI can show every pattern.
	 */
	get visiblePatterns(): Pattern[] {
		return this.patterns.filter((p) => p.enabled !== false);
	}

	/**
	 * Re-read all overrides from localStorage and update reactive state.
	 * Call after AdminPanel's save() so other components (ChecklistTable,
	 * etc.) see the latest user customisations.
	 */
	refresh() {
		this.patterns = loadPatternTypes();
		this.lookups = load(LOOKUPS_KEY, defaultLookups);
		this.dictValues = load(DICT_VALUES_KEY, defaultDict.values);
		this.patternDescs = load(DICT_PATTERN_DESC_KEY, defaultDict.patterns);
	}
}

export const effectiveData = new EffectiveData();

// Listen for cross-tab changes (the 'storage' event only fires on OTHER
// tabs of the same origin, so this catches "user edited patterns in tab A
// while looking at the canvas in tab B" scenarios). Same-tab updates flow
// through the explicit refresh() call from AdminPanel.
if (typeof window !== 'undefined') {
	window.addEventListener('storage', (e) => {
		if (
			e.key === PATTERNS_KEY ||
			e.key === LOOKUPS_KEY ||
			e.key === DICT_VALUES_KEY ||
			e.key === DICT_PATTERN_DESC_KEY ||
			e.key === DELETED_KEY
		) {
			effectiveData.refresh();
		}
	});
}
