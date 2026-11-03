<script lang="ts">
	import { patterns, lookups, dictionary } from '$lib/data';
	import { effectiveData } from '$lib/data/effective.svelte';
	import type { Pattern } from '$lib/types';

	const LOOKUPS_KEY = 'layer-checklist-lookups-overrides';
	const DICT_KEY = 'layer-checklist-dict-overrides';
	const PATTERN_DESC_KEY = 'layer-checklist-pattern-desc-overrides';
	const PATTERNS_KEY = 'layer-checklist-patterns-overrides';
	// Pattern IDs hard-deleted via the trash icon. Kept separate from
	// the toggle (`enabled` field) so we can distinguish "user wants this
	// hidden but might want it back" from "user wants this gone forever
	// even after the migration runs". The migration in effective.svelte.ts
	// reads this same key and skips reinstating default patterns whose
	// IDs are in this list.
	const DELETED_KEY = 'layer-checklist-deleted-pattern-ids';

	// Deep clone the imported data so we can modify it
	let localLookups = $state<Record<string, string[]>>(loadOverrides(LOOKUPS_KEY, lookups));
	let localDictValues = $state<Record<string, Record<string, string>>>(loadOverrides(DICT_KEY, dictionary.values));
	let localPatternDescs = $state<Record<string, string>>(loadOverrides(PATTERN_DESC_KEY, dictionary.patterns));
	// Source from effectiveData so previously-removed patterns reappear
	// toggled-off (the migration in effective.svelte.ts merges defaults
	// with the user's localStorage state). Without this, AdminPanel would
	// only show the already-saved subset and the user could never get
	// removed patterns back without Reset to Defaults.
	//
	// Use `$state.snapshot()` (NOT `structuredClone`). The shared
	// `effectiveData.patterns` is a Svelte 5 `$state` proxy, which
	// `structuredClone` throws DataCloneError on — that error broke the
	// Manage Patterns tab mount entirely until this was fixed.
	// `$state.snapshot()` is the documented Svelte 5 way to get a
	// non-reactive deep copy of a reactive value.
	let localPatterns = $state<Pattern[]>($state.snapshot(effectiveData.patterns) as Pattern[]);
	// Hard-delete blacklist — IDs the user has trashed. The migration in
	// effective.svelte.ts skips reinstating defaults whose ID is here.
	let deletedIds = $state<string[]>(loadOverrides(DELETED_KEY, [] as string[]));

	let selectedPattern = $state<string>(localPatterns[0]?.id ?? patterns[0].id);
	let newValue = $state('');
	let newDescription = $state('');
	let editingValue = $state<string | null>(null);
	let editDescription = $state('');
	let editingPatternDesc = $state(false);
	let editPatternDescValue = $state('');
	let search = $state('');
	let switcherOpen = $state(false);
	let highlightValue = $state<string | null>(null);

	// Manage Pattern Types state
	let showPatternTypes = $state(false);
	let newPatternName = $state('');
	let newPatternMultiSelect = $state(true);
	let editingPatternTypeId = $state<string | null>(null);
	let editPatternTypeName = $state('');
	let editPatternTypeMultiSelect = $state(false);

	function navigateToValue(patternId: string, value: string) {
		selectedPattern = patternId;
		search = '';
		highlightValue = value;
		// Wait for DOM update then scroll into view
		requestAnimationFrame(() => {
			const el = document.querySelector(`[data-value="${CSS.escape(value)}"]`);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				// Clear highlight after animation
				setTimeout(() => { highlightValue = null; }, 2000);
			}
		});
	}

	function handleClickOutsideSwitcher(e: MouseEvent) {
		if (switcherOpen && !(e.target as HTMLElement)?.closest('[data-pattern-switcher]')) {
			switcherOpen = false;
		}
	}

	function loadOverrides<T>(key: string, defaults: T): T {
		if (typeof window === 'undefined') return structuredClone(defaults);
		const raw = localStorage.getItem(key);
		if (raw) {
			try {
				return JSON.parse(raw);
			} catch { /* fall through */ }
		}
		return structuredClone(defaults);
	}

	function save() {
		localStorage.setItem(LOOKUPS_KEY, JSON.stringify(localLookups));
		localStorage.setItem(DICT_KEY, JSON.stringify(localDictValues));
		localStorage.setItem(PATTERN_DESC_KEY, JSON.stringify(localPatternDescs));
		localStorage.setItem(PATTERNS_KEY, JSON.stringify(localPatterns));
		localStorage.setItem(DELETED_KEY, JSON.stringify(deletedIds));
		// Push the new overrides into the reactive store so consumers
		// (ChecklistTable on the Checklist tab) re-render with the latest
		// pattern types / lookups / dictionary without needing a page
		// reload. Without this, removing a pattern type here wouldn't
		// disappear from the canvas until the next full reload.
		effectiveData.refresh();
	}

	function patternName(id: string): string {
		return localPatterns.find((p) => p.id === id)?.name ?? id;
	}

	function toKebabCase(str: string): string {
		return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	}

	function addPatternType() {
		const name = newPatternName.trim();
		if (!name) return;
		const id = toKebabCase(name);
		if (localPatterns.some((p) => p.id === id)) {
			alert(`A pattern type with ID "${id}" already exists.`);
			return;
		}
		const order = localPatterns.length + 1;
		localPatterns = [...localPatterns, { id, name, order, multiSelect: newPatternMultiSelect }];
		// Initialize empty lookups and descriptions for the new pattern
		if (!localLookups[id]) localLookups[id] = [];
		if (!localDictValues[id]) localDictValues[id] = {};
		if (!localPatternDescs[id]) localPatternDescs[id] = '';
		newPatternName = '';
		newPatternMultiSelect = true;
		save();
	}

	/**
	 * Toggle whether a pattern type is shown on the canvas. Reversible:
	 * the pattern stays in the catalog with its values + descriptions
	 * intact, just gets `enabled: false` so the canvas hides it.
	 *
	 * Replaces the old `removePatternType` which deleted the pattern
	 * outright (along with its values + descriptions) and was effectively
	 * irreversible — Reset to Defaults was the only way back, and that
	 * wiped every other customisation too.
	 */
	function togglePatternType(id: string) {
		localPatterns = localPatterns.map((p) =>
			p.id === id ? { ...p, enabled: p.enabled === false ? true : false } : p
		);
		save();
	}

	/**
	 * Permanently delete a pattern type. Unlike `togglePatternType` (which
	 * just sets `enabled: false` and leaves the chip dimmed in the catalog),
	 * this removes the pattern entirely AND adds its ID to the
	 * `deletedIds` blacklist so the migration in effective.svelte.ts won't
	 * reinstate it on next page load.
	 *
	 * Reset to Defaults clears the blacklist, restoring everything.
	 */
	function deletePatternType(id: string) {
		const name = patternName(id);
		if (!confirm(
			`Permanently delete pattern type "${name}"?\n\n` +
				`This removes its values and descriptions and prevents it from ` +
				`reappearing on next load. Use the toggle instead if you might ` +
				`want it back later. Reset to Defaults will restore everything.`
		)) return;

		localPatterns = localPatterns.filter((p) => p.id !== id);
		// Recompute order on remaining patterns
		localPatterns = localPatterns.map((p, i) => ({ ...p, order: i + 1 }));
		// Clean up associated lookup values + descriptions
		delete localLookups[id];
		delete localDictValues[id];
		delete localPatternDescs[id];
		// Add to blacklist so migration won't reinstate this default
		if (!deletedIds.includes(id)) {
			deletedIds = [...deletedIds, id];
		}
		// If the deleted pattern was the selected one, switch to first
		if (selectedPattern === id) {
			selectedPattern = localPatterns[0]?.id ?? '';
		}
		save();
	}

	function startEditPatternType(p: Pattern) {
		editingPatternTypeId = p.id;
		editPatternTypeName = p.name;
		editPatternTypeMultiSelect = p.multiSelect;
	}

	function saveEditPatternType() {
		if (!editingPatternTypeId) return;
		const name = editPatternTypeName.trim();
		if (!name) return;
		localPatterns = localPatterns.map((p) =>
			p.id === editingPatternTypeId ? { ...p, name, multiSelect: editPatternTypeMultiSelect } : p
		);
		editingPatternTypeId = null;
		save();
	}

	function cancelEditPatternType() {
		editingPatternTypeId = null;
	}

	let currentValues = $derived(localLookups[selectedPattern] ?? []);
	let currentDescriptions = $derived(localDictValues[selectedPattern] ?? {});

	type SearchResult = { value: string; patternId: string; description: string };
	let globalSearchResults = $derived<SearchResult[]>(
		search
			? localPatterns.flatMap((p) => {
					const q = search.toLowerCase();
					const vals = localLookups[p.id] ?? [];
					const descs = localDictValues[p.id] ?? {};
					return vals
						.filter((v) => v.toLowerCase().includes(q) || (descs[v] ?? '').toLowerCase().includes(q))
						.map((v) => ({ value: v, patternId: p.id, description: descs[v] ?? '' }));
				})
			: []
	);

	function addValue() {
		const trimmed = newValue.trim();
		if (!trimmed || currentValues.includes(trimmed)) return;
		if (!localLookups[selectedPattern]) localLookups[selectedPattern] = [];
		localLookups[selectedPattern].push(trimmed);
		localLookups[selectedPattern].sort((a, b) => a.localeCompare(b));
		if (!localDictValues[selectedPattern]) localDictValues[selectedPattern] = {};
		localDictValues[selectedPattern][trimmed] = newDescription.trim() || 'TBD';
		newValue = '';
		newDescription = '';
		save();
	}

	function removeValue(value: string) {
		localLookups[selectedPattern] = localLookups[selectedPattern].filter((v) => v !== value);
		if (localDictValues[selectedPattern]) {
			delete localDictValues[selectedPattern][value];
		}
		save();
	}

	function startEdit(value: string) {
		editingValue = value;
		editDescription = currentDescriptions[value] ?? '';
	}

	function saveEdit() {
		if (editingValue && localDictValues[selectedPattern]) {
			localDictValues[selectedPattern][editingValue] = editDescription;
			save();
		}
		editingValue = null;
		editDescription = '';
	}

	function cancelEdit() {
		editingValue = null;
		editDescription = '';
	}

	function exportLookups() {
		download(JSON.stringify(localLookups, null, 2), 'lookups.json', 'application/json');
	}

	function exportDictionary() {
		const full = { patterns: localPatternDescs, values: localDictValues };
		download(JSON.stringify(full, null, 2), 'dictionary.json', 'application/json');
	}

	function exportAll() {
		const bundle = {
			patternTypes: localPatterns,
			lookups: localLookups,
			dictionary: { patterns: localPatternDescs, values: localDictValues }
		};
		download(JSON.stringify(bundle, null, 2), `checklist-patterns-${exportTimestamp()}.json`, 'application/json');
	}

	/**
	 * Export a single pattern type (definition + values + descriptions) to a
	 * portable JSON file. Lets the user share, back up, or migrate one specific
	 * pattern without bundling everything else. Import via "Import Patterns" —
	 * the importer auto-detects single-pattern bundles vs all-bundles.
	 */
	function exportPatternType(patternId: string) {
		const p = localPatterns.find((x) => x.id === patternId);
		if (!p) {
			alert(`Pattern "${patternId}" not found.`);
			return;
		}
		const bundle = {
			patternType: p,
			values: localLookups[patternId] ?? [],
			description: localPatternDescs[patternId] ?? '',
			valueDescriptions: localDictValues[patternId] ?? {}
		};
		download(
			JSON.stringify(bundle, null, 2),
			`pattern-${patternId}-${exportTimestamp()}.json`,
			'application/json'
		);
	}

	async function saveAll() {
		try {
			const res = await fetch('/api/save-lookups', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					patternTypes: localPatterns,
					lookups: localLookups,
					dictionary: { patterns: localPatternDescs, values: localDictValues }
				})
			});
			if (!res.ok) {
				const err = await res.json();
				alert(`Save failed: ${err.error || res.statusText}`);
			}
		} catch {
			// Server endpoint not available (static build) — fall back to downloads
			exportLookups();
			exportDictionary();
			exportAll();
		}
	}

	function importFile(accept: string, onLoad: (text: string) => void) {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const text = await file.text();
			onLoad(text);
		};
		input.click();
	}

	function importLookups() {
		importFile('.json', (text) => {
			try {
				const data = JSON.parse(text);
				if (typeof data !== 'object' || Array.isArray(data)) {
					alert('Invalid lookups file — expected a JSON object');
					return;
				}
				localLookups = data;
				save();
			} catch {
				alert('Could not parse JSON file');
			}
		});
	}

	function importDictionary() {
		importFile('.json', (text) => {
			try {
				const data = JSON.parse(text);
				if (data.values && typeof data.values === 'object') {
					localDictValues = data.values;
					if (data.patterns && typeof data.patterns === 'object') {
						localPatternDescs = data.patterns;
					}
				} else if (typeof data === 'object' && !Array.isArray(data)) {
					localDictValues = data;
				} else {
					alert('Invalid dictionary file');
					return;
				}
				save();
			} catch {
				alert('Could not parse JSON file');
			}
		});
	}

	/**
	 * Import a JSON bundle. Auto-detects two shapes:
	 *
	 *   ALL-bundle (plural `patternTypes`)
	 *     { patternTypes: Pattern[],
	 *       lookups: Record<patternId, string[]>,
	 *       dictionary: { patterns: Record<id,string>, values: Record<id,Record<value,string>> } }
	 *
	 *   SINGLE-bundle (singular `patternType`)
	 *     { patternType: Pattern,
	 *       values: string[],
	 *       description: string,
	 *       valueDescriptions: Record<value,string> }
	 *
	 * For a single-bundle, if a pattern with the same id already exists the
	 * user is prompted to confirm replacement; otherwise the pattern is added
	 * as a new chip.
	 */
	function importBundle() {
		importFile('.json', (text) => {
			try {
				const data = JSON.parse(text);

				// SINGLE-bundle shape — one pattern
				if (data.patternType && typeof data.patternType.id === 'string') {
					const incoming = data.patternType as Pattern;
					const existing = localPatterns.find((p) => p.id === incoming.id);
					if (existing) {
						if (!confirm(`A pattern type with ID "${incoming.id}" already exists ("${existing.name}"). Replace it with the imported one?`)) return;
						localPatterns = localPatterns.map((p) =>
							p.id === incoming.id ? { ...p, ...incoming } : p
						);
					} else {
						const order = localPatterns.length + 1;
						localPatterns = [...localPatterns, { ...incoming, order }];
					}
					localLookups = {
						...localLookups,
						[incoming.id]: Array.isArray(data.values) ? data.values : []
					};
					if (typeof data.description === 'string') {
						localPatternDescs = { ...localPatternDescs, [incoming.id]: data.description };
					}
					if (typeof data.valueDescriptions === 'object' && data.valueDescriptions !== null) {
						localDictValues = { ...localDictValues, [incoming.id]: data.valueDescriptions };
					}
					selectedPattern = incoming.id;
					save();
					alert(`Pattern "${incoming.name}" ${existing ? 'replaced' : 'added'} successfully.`);
					return;
				}

				// ALL-bundle shape
				if (data.lookups && data.dictionary?.values) {
					localLookups = data.lookups;
					localDictValues = data.dictionary.values;
					if (data.dictionary.patterns && typeof data.dictionary.patterns === 'object') {
						localPatternDescs = data.dictionary.patterns;
					}
					if (Array.isArray(data.patternTypes)) {
						localPatterns = data.patternTypes;
					}
					save();
				} else {
					alert('Invalid bundle file — expected { patternType, values, ... } for single pattern OR { patternTypes, lookups, dictionary } for all patterns.');
				}
			} catch {
				alert('Could not parse JSON file');
			}
		});
	}

	function resetToDefaults() {
		if (!confirm('Reset all lookups, dictionary, and pattern types to built-in defaults?')) return;
		localLookups = structuredClone(lookups);
		localDictValues = structuredClone(dictionary.values);
		localPatternDescs = structuredClone(dictionary.patterns);
		localPatterns = structuredClone(patterns);
		// Clear hard-delete blacklist too so any previously-trashed default
		// patterns reappear in the catalog.
		deletedIds = [];
		localStorage.removeItem(LOOKUPS_KEY);
		localStorage.removeItem(DICT_KEY);
		localStorage.removeItem(PATTERN_DESC_KEY);
		localStorage.removeItem(PATTERNS_KEY);
		localStorage.removeItem(DELETED_KEY);
		selectedPattern = localPatterns[0]?.id ?? '';
		// Push the cleared state into the reactive store so the canvas
		// re-renders immediately with the full default catalog.
		effectiveData.refresh();
	}

	function exportTimestamp(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
	}

	function download(content: string, filename: string, type: string) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:window onclick={handleClickOutsideSwitcher} />

<div class="admin">
	<div class="flex flex-wrap items-center justify-between gap-3 mb-4 rounded-lg px-4 py-3" style="background: var(--color-surface); border: 1px solid var(--color-border);">
		<div class="flex items-center gap-2 flex-wrap">
			<div class="relative" data-pattern-switcher>
				<button type="button" class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
					onclick={() => { switcherOpen = !switcherOpen; }}>
					<div class="text-left">
						<div class="text-sm font-semibold text-slate-800 leading-tight">{patternName(selectedPattern)}</div>
						<div class="text-[10px] text-slate-400 leading-tight">Switch Pattern Type</div>
					</div>
					<svg class="w-4 h-4 text-slate-400 transition-transform {switcherOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				{#if switcherOpen}
					<div class="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 min-w-[250px] max-h-[400px] overflow-y-auto">
						{#each localPatterns as p}
							<button type="button" class="w-full text-left px-4 py-2 text-sm transition-colors {selectedPattern === p.id ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}"
								onclick={() => { selectedPattern = p.id; search = ''; switcherOpen = false; }}>
								{p.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<input type="text" placeholder="Search values..." bind:value={search} class="text-sm px-3 py-1.5 border border-slate-300 rounded-lg bg-white min-w-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-cyan-700 border border-cyan-300 hover:bg-cyan-50 transition-colors" onclick={saveAll}>Save</button>
			<button
				type="button"
				class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
				onclick={() => exportPatternType(selectedPattern)}
				title="Export just the currently-selected pattern type (use Import Patterns to bring it back)"
			>Export this Pattern Type</button>
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-red-500 border border-red-300 hover:bg-red-50 transition-colors" onclick={resetToDefaults}>Reset to Defaults</button>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors" onclick={() => (showPatternTypes = !showPatternTypes)}>
				{showPatternTypes ? 'Hide' : 'Manage'} Pattern Types
			</button>
			<button
				type="button"
				class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
				onclick={exportAll}
				title="Export every pattern type, its values and descriptions to a single JSON file"
			>Export all Pattern Types</button>
			<button
				type="button"
				class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
				onclick={importBundle}
				title="Import a JSON file. Auto-detects whether it's an all-patterns bundle or a single-pattern bundle."
			>Import Patterns</button>
		</div>
		<div class="w-full border-t pt-2 -mb-1" style="border-color: var(--color-border);">
			{#if editingPatternDesc}
				<textarea
					bind:value={editPatternDescValue}
					rows="2"
					class="w-full text-sm text-slate-600 px-2 py-1 border border-blue-400 rounded outline-none resize-none"
					onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); localPatternDescs[selectedPattern] = editPatternDescValue.trim(); save(); editingPatternDesc = false; } if (e.key === 'Escape') { editingPatternDesc = false; } }}
					onblur={() => { localPatternDescs[selectedPattern] = editPatternDescValue.trim(); save(); editingPatternDesc = false; }}
				></textarea>
			{:else}
				<p
					class="text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors"
					onclick={() => { editPatternDescValue = localPatternDescs[selectedPattern] ?? ''; editingPatternDesc = true; }}
					title="Click to edit description"
				>{localPatternDescs[selectedPattern] || 'Click to add a description'}</p>
			{/if}
		</div>
	</div>

	{#if showPatternTypes}
		<div class="pattern-types-section">
			<h3>Pattern Types</h3>
			<div class="pt-chip-list">
				{#each localPatterns as p}
					{#if editingPatternTypeId === p.id}
						<div class="pt-edit-inline">
							<input type="text" bind:value={editPatternTypeName} class="pt-edit-input"
								onkeydown={(e) => { if (e.key === 'Enter') saveEditPatternType(); if (e.key === 'Escape') cancelEditPatternType(); }} />
							<label class="pt-multi-label">
								<input type="checkbox" bind:checked={editPatternTypeMultiSelect} />
								<span>Multi</span>
							</label>
							<button type="button" class="pt-edit-save" onclick={saveEditPatternType}>✓</button>
							<button type="button" class="pt-edit-cancel" onclick={cancelEditPatternType}>✕</button>
						</div>
					{:else}
						{@const isEnabled = p.enabled !== false}
						<span class="pt-chip {isEnabled ? '' : 'pt-chip-disabled'}" title="{p.id} · {p.multiSelect ? 'Multi-select' : 'Single-select'} · {isEnabled ? 'Shown on canvas' : 'Hidden from canvas'}">
							{p.name}
							<span class="pt-chip-badge">{p.multiSelect ? 'M' : 'S'}</span>
							<button type="button" class="pt-chip-edit" onclick={() => startEditPatternType(p)} aria-label="Edit pattern type">✎</button>
							<!--
								Trash button — permanent delete. Sits BEFORE the toggle so
								the destructive action is on the inside (less reach) and the
								more-frequent reversible toggle is on the rightmost edge of
								the chip. Uses the slate-400 / red-500 hover pattern that
								matches other destructive icon buttons in the codebase (BEM
								remove, IPC remove). Heroicons outline, w-3 h-3 for
								chip-density.
							-->
							<button
								type="button"
								class="pt-chip-trash"
								onclick={() => deletePatternType(p.id)}
								aria-label="Delete pattern type permanently"
								title="Delete permanently (use the toggle to hide instead)"
							>
								<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6" />
									<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
									<path d="M10 11v6" />
									<path d="M14 11v6" />
									<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
								</svg>
							</button>
							<!--
								Toggle switch (design system: tokens.md `toggle_switch`).
								Click anywhere on the wrapper toggles enabled. Pattern stays
								in the catalog regardless of state — toggling off just hides
								it from the canvas. Reversible. Sits last so it's the
								rightmost element of the chip.
							-->
							<button
								type="button"
								role="switch"
								aria-checked={isEnabled}
								aria-label="Show on canvas"
								class="relative inline-flex items-center shrink-0 pl-1 pr-1 py-0.5 rounded-md hover:bg-slate-50 transition-colors"
								onclick={() => togglePatternType(p.id)}
							>
								<span class="relative inline-block h-4 w-7 rounded-full transition-colors {isEnabled ? 'bg-blue-600' : 'bg-slate-300'}">
									<span class="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform {isEnabled ? 'translate-x-3' : 'translate-x-0'}"></span>
								</span>
							</button>
						</span>
					{/if}
				{/each}
			</div>
			<div class="pt-add">
				<input
					type="text"
					placeholder="New pattern type..."
					bind:value={newPatternName}
					onkeydown={(e) => e.key === 'Enter' && addPatternType()}
				/>
				<label class="pt-multi-label">
					<input type="checkbox" bind:checked={newPatternMultiSelect} />
					<span>Multi-select</span>
				</label>
				<button type="button" onclick={addPatternType}>Add</button>
			</div>
		</div>
	{/if}

	<div class="flex flex-col gap-6">
		<div class="values-section">
			{#if search}
				<h3>Search results for "{search}" <span class="text-sm font-normal text-slate-400">({globalSearchResults.length} match{globalSearchResults.length !== 1 ? 'es' : ''})</span></h3>

				<div class="values-list">
					{#each globalSearchResults as result}
						<div class="value-row cursor-pointer hover:bg-slate-50" onclick={() => navigateToValue(result.patternId, result.value)}>
							<div class="value-display">
								<span class="value-name">{result.value}</span>
								<span class="value-desc">{result.description || 'No description'}</span>
							</div>
							<span class="text-xs text-slate-400 whitespace-nowrap">{patternName(result.patternId)}</span>
						</div>
					{/each}
					{#if globalSearchResults.length === 0}
						<p class="empty">No matching values across any pattern type.</p>
					{/if}
				</div>
			{:else}
				<h3>Values for "{patternName(selectedPattern)}"</h3>

				<div class="add-form">
					<input
						type="text"
						placeholder="New value name"
						bind:value={newValue}
						onkeydown={(e) => e.key === 'Enter' && addValue()}
					/>
					<input
						type="text"
						placeholder="Description"
						bind:value={newDescription}
						onkeydown={(e) => e.key === 'Enter' && addValue()}
						class="desc-field"
					/>
					<button type="button" onclick={addValue}>Add</button>
				</div>

				<div class="values-list">
					{#each currentValues as value}
						<div class="value-row {highlightValue === value ? 'highlight' : ''}" data-value={value}>
							<div class="value-display">
								<span class="value-name">{value}</span>
								{#if editingValue === value}
									<textarea
										bind:value={editDescription}
										rows="2"
										onblur={saveEdit}
										onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === 'Escape') { cancelEdit(); } }}
										class="value-desc-input"
									></textarea>
								{:else}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<span
										class="value-desc clickable {currentDescriptions[value] ? '' : 'italic'}"
										onclick={() => startEdit(value)}
										title="Click to edit description"
									>{currentDescriptions[value] || 'Click to add a description'}</span>
								{/if}
							</div>
							<div class="value-actions">
								<button type="button" class="small danger" onclick={() => removeValue(value)}>Delete</button>
							</div>
						</div>
					{/each}
					{#if currentValues.length === 0}
						<p class="empty">No values defined for this pattern.</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>

</div>

<style>
	.admin {
		max-width: 100%;
	}

	.values-section h3 {
		font-size: 1rem;
		margin-bottom: 0.75rem;
	}

	.add-form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.add-form input {
		font: inherit;
		font-size: 0.8125rem;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}

	.add-form input:first-child {
		width: 200px;
	}

	.add-form .desc-field {
		flex: 1;
		min-width: 200px;
	}

	.add-form button {
		padding: 0.375rem 1rem;
		font-size: 0.8125rem;
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		background: var(--color-primary);
		color: white;
		cursor: pointer;
		font-family: inherit;
	}

	.values-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.value-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		transition: background-color 0.3s ease;
		padding: 0.625rem 0.75rem;
		border: 1px solid var(--color-border);
		border-bottom: none;
	}

	.value-row:first-child {
		border-radius: 6px 6px 0 0;
	}

	.value-row:last-child {
		border-bottom: 1px solid var(--color-border);
		border-radius: 0 0 6px 6px;
	}

	.value-row:only-child {
		border-radius: 6px;
		border-bottom: 1px solid var(--color-border);
	}

	.value-row.highlight {
		background-color: #eff6ff;
		border-color: #93c5fd;
	}

	.value-display {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.value-name {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.value-desc {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		line-height: 1.4;
	}

	.value-desc.clickable {
		cursor: pointer;
		transition: color 0.15s;
	}

	.value-desc.clickable:hover {
		color: #334155;
	}

	.value-desc.italic {
		font-style: italic;
	}

	.value-desc-input {
		font: inherit;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
		padding: 0.25rem 0.375rem;
		border: 1px solid #60a5fa;
		border-radius: 4px;
		resize: vertical;
		width: 100%;
		outline: none;
	}

	.value-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	button.small {
		padding: 0.25rem 0.5rem;
		font-size: 0.6875rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-family: inherit;
	}

	button.small:hover {
		background: var(--color-surface);
	}

	button.small.danger:hover {
		background: #fee;
		border-color: #c00;
		color: #c00;
	}

	.empty {
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		font-style: italic;
		padding: 1rem;
	}

	/* ── Manage Pattern Types ── */
	.pattern-types-section {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.pattern-types-section h3 {
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.pt-chip-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.pt-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}

	/* Toggled-off pattern types: visibly dimmed so users can scan the
	   list and see at a glance which patterns are hidden from the
	   canvas. Uses 0.5 to match the design system's `disabled:opacity-50`
	   convention used elsewhere on disabled-state buttons. The toggle
	   switch itself stays bright (interactive). */
	.pt-chip-disabled {
		opacity: 0.5;
	}

	.pt-chip-disabled .pt-chip-badge {
		background: transparent;
	}

	/* Trash button on each chip — destructive permanent-delete action.
	   Uses the standard slate-400 default / red-500 hover pattern used
	   elsewhere for destructive icon buttons (matches BEM/IPC remove
	   icons before they were replaced with delete-from-modal). */
	.pt-chip-trash {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		cursor: pointer;
		padding: 0.125rem;
		color: #94a3b8; /* slate-400 — subtle by default */
		line-height: 1;
		border-radius: 4px;
		transition: color 0.15s, background-color 0.15s;
	}

	.pt-chip-trash:hover {
		color: #ef4444; /* red-500 — destructive on hover */
		background: #fef2f2; /* red-50 — soft hover bg */
	}

	.pt-chip-badge {
		font-size: 0.5625rem;
		font-weight: 600;
		color: var(--color-text-muted);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0 0.25rem;
		line-height: 1.4;
	}

	.pt-chip-edit {
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		padding: 0;
		line-height: 1;
	}

	.pt-chip-edit:hover {
		color: var(--color-primary);
	}

	.pt-chip-remove {
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		padding: 0;
		line-height: 1;
	}

	.pt-chip-remove:hover {
		color: #c00;
	}

	.pt-edit-inline {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.125rem 0.5rem;
		background: white;
		border: 1px solid #93c5fd;
		border-radius: 12px;
	}

	.pt-edit-input {
		font: inherit;
		font-size: 0.75rem;
		padding: 0.125rem 0.25rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		width: 140px;
	}

	.pt-edit-save {
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.75rem;
		color: var(--color-primary);
		padding: 0;
		font-weight: 600;
	}

	.pt-edit-cancel {
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		padding: 0;
	}

	.pt-edit-cancel:hover {
		color: #c00;
	}

	.pt-add {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.pt-add input[type="text"] {
		font: inherit;
		font-size: 0.8125rem;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		width: 180px;
	}

	.pt-add button {
		padding: 0.3rem 0.75rem;
		font-size: 0.8125rem;
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		background: var(--color-primary);
		color: white;
		cursor: pointer;
		font-family: inherit;
	}

	.pt-multi-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		cursor: pointer;
		white-space: nowrap;
	}

	.pt-multi-label input[type="checkbox"] {
		cursor: pointer;
	}
</style>
