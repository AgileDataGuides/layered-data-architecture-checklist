import type { Checklist, Layer, Policy } from '$lib/types';
import { agileDataChecklist, patterns as allPatterns, lookups, dictionary, defaultPolicies, defaultCategories } from '$lib/data';
import { buildXlsxBlob, downloadXlsx, type SheetSpec } from '$lib/cp-shared-xlsx';

export interface ChecklistStoreOptions {
	onPersist?: (saved: Record<string, Checklist>, currentId: string) => void;
	loadSaved?: () => Record<string, Checklist>;
	onPersistPolicies?: (policies: Policy[], categories: string[]) => void;
	loadPolicies?: () => Policy[];
	loadCategories?: () => string[];
}

export function createChecklistStore(options: ChecklistStoreOptions = {}) {
	const CURRENT_KEY = 'layer-arch-current-id';
	const SAVED_KEY = 'layer-arch-saved';
	const POLICIES_KEY = 'layer-checklist-policies';
	const CATEGORIES_KEY = 'layer-checklist-policy-categories';

	function createId(name: string): string {
		return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'architecture';
	}

	function stripDateTimeSuffix(name: string): string {
	return name.replace(/-\d{4}-\d{2}-\d{2}-\d{6}$/, '');
}

function uniqueId(name: string, existing: string[]): string {
		let base = createId(name);
		if (!existing.includes(base)) return base;
		let i = 2;
		while (existing.includes(`${base}-${i}`)) i++;
		return `${base}-${i}`;
	}

	// --- Persistence ---

	function doLoadSaved(): Record<string, Checklist> {
		if (options.loadSaved) return options.loadSaved();
		if (typeof window === 'undefined') return {};
		const raw = localStorage.getItem(SAVED_KEY);
		if (!raw) return {};
		try {
			return JSON.parse(raw);
		} catch {
			return {};
		}
	}

	function persistAll() {
		markDirty();
		if (options.onPersist) {
			options.onPersist($state.snapshot(saved), checklist.id);
			return;
		}
		if (typeof window === 'undefined') return;
		localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
		localStorage.setItem(CURRENT_KEY, checklist.id);
	}

	// --- Policy Persistence ---

	function doLoadPolicies(): Policy[] {
		if (options.loadPolicies) return options.loadPolicies();
		if (typeof window === 'undefined') return structuredClone(defaultPolicies);
		const raw = localStorage.getItem(POLICIES_KEY);
		if (raw) {
			try { return JSON.parse(raw); } catch { /* fall through */ }
		}
		return structuredClone(defaultPolicies);
	}

	function doLoadCategories(): string[] {
		if (options.loadCategories) return options.loadCategories();
		if (typeof window === 'undefined') return structuredClone(defaultCategories);
		const raw = localStorage.getItem(CATEGORIES_KEY);
		if (raw) {
			try { return JSON.parse(raw); } catch { /* fall through */ }
		}
		return structuredClone(defaultCategories);
	}

	function persistPolicies() {
		if (options.onPersistPolicies) {
			options.onPersistPolicies($state.snapshot(policies), $state.snapshot(categories));
			return;
		}
		if (typeof window === 'undefined') return;
		localStorage.setItem(POLICIES_KEY, JSON.stringify(policies));
		localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
	}

	// --- State ---

	// Returns an entry of `saved`, never a copy, so `checklist` and
	// `saved[checklist.id]` are one proxy and every edit reaches persistAll.
	function initCurrent(): Checklist {
		if (typeof window !== 'undefined' && !options.loadSaved) {
			const currentId = localStorage.getItem(CURRENT_KEY);
			if (currentId && saved[currentId]) return saved[currentId];
		}
		const first = Object.keys(saved)[0];
		if (first) return saved[first];
		// First run: seed with AgileData example
		const example = structuredClone(agileDataChecklist);
		saved[example.id] = example;
		if (!options.onPersist) {
			if (typeof window !== 'undefined') {
				localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
				localStorage.setItem(CURRENT_KEY, example.id);
			}
		} else {
			options.onPersist($state.snapshot(saved), example.id);
		}
		return saved[example.id];
	}

	let saved = $state<Record<string, Checklist>>(doLoadSaved());
	let checklist = $state<Checklist>(initCurrent());
	let policies = $state<Policy[]>(doLoadPolicies());
	let categories = $state<string[]>(doLoadCategories());
	let dirty = $state(false);

	function markDirty() { dirty = true; }
	function markClean() { dirty = false; }

	// --- Public API ---

	function getChecklist(): Checklist {
		return checklist;
	}

	function getSavedList(): { id: string; name: string }[] {
		return Object.values(saved).map((c) => ({ id: c.id, name: c.name }));
	}

	function switchTo(id: string) {
		if (saved[id]) {
			checklist = saved[id];
			persistAll();
		}
	}

	function createBlankLayer(name: string, order: number): Layer {
		return { id: createId(name), name, order, values: {}, notes: {}, policies: {} };
	}

	function newArchitecture(archName?: string) {
		const name = archName || 'New Architecture';
		const ids = Object.keys(saved);
		const id = uniqueId(name, ids);
		const arch: Checklist = {
			version: '1.0',
			id,
			name,
			description: '',
			layers: [
				createBlankLayer('Layer 1', 1),
				createBlankLayer('Layer 2', 2),
				createBlankLayer('Layer 3', 3),
				createBlankLayer('Layer 4', 4)
			]
		};
		saved[id] = arch;
		// The entry, never the raw object: `checklist = arch` would wrap it in a
		// second proxy, and edits to that one never reach `saved`
		checklist = saved[id];
		persistAll();
	}

	function loadExample() {
		const example = structuredClone(agileDataChecklist);
		if (saved[example.id]) {
			checklist = saved[example.id];
		} else {
			saved[example.id] = example;
			checklist = saved[example.id];
		}
		persistAll();
	}

	function loadChecklist(imported: Checklist) {
		// A hand-written file can leave out any of these, and every cell edit writes into them
		for (const layer of imported.layers) {
			if (!layer.values) layer.values = {};
			if (!layer.notes) layer.notes = {};
			if (!layer.policies) layer.policies = {};
		}
		imported.name = stripDateTimeSuffix(imported.name);
		const ids = Object.keys(saved);
		if (ids.includes(imported.id)) {
			imported.id = uniqueId(imported.name, ids);
		}
		saved[imported.id] = imported;
		checklist = saved[imported.id];
		persistAll();
	}

	function deleteArchitecture(id: string) {
		if (!saved[id]) return;
		delete saved[id];
		const remaining = Object.values(saved);
		if (remaining.length > 0) {
			checklist = remaining[0];
		} else {
			newArchitecture();
			return;
		}
		persistAll();
	}

	function setChecklistMeta(name: string, description: string) {
		const oldId = checklist.id;
		const newId = createId(name);
		checklist.name = name;
		checklist.description = description;
		if (newId !== oldId) {
			delete saved[oldId];
			checklist.id = uniqueId(name, Object.keys(saved));
			saved[checklist.id] = checklist;
		}
		persistAll();
	}

	function addLayer() {
		const order = checklist.layers.length + 1;
		checklist.layers.push(createBlankLayer(`Layer ${order}`, order));
		persistAll();
	}

	function removeLayer(index: number) {
		checklist.layers.splice(index, 1);
		checklist.layers.forEach((l, i) => (l.order = i + 1));
		persistAll();
	}

	function moveLayer(fromIndex: number, toIndex: number) {
		if (fromIndex === toIndex) return;
		const [layer] = checklist.layers.splice(fromIndex, 1);
		checklist.layers.splice(toIndex, 0, layer);
		checklist.layers.forEach((l, i) => (l.order = i + 1));
		persistAll();
	}

	function setPatternOrder(orderedIds: string[]) {
		checklist.patternOrder = orderedIds;
		persistAll();
	}

	function setLayerName(index: number, name: string) {
		checklist.layers[index].name = name;
		checklist.layers[index].id = createId(name);
		persistAll();
	}

	function setCellValues(layerIndex: number, patternId: string, values: string[]) {
		checklist.layers[layerIndex].values[patternId] = values;
		persistAll();
	}

	function setCellNote(layerIndex: number, patternId: string, note: string) {
		if (note) {
			checklist.layers[layerIndex].notes[patternId] = note;
		} else {
			delete checklist.layers[layerIndex].notes[patternId];
		}
		persistAll();
	}

	function setCellPolicies(layerIndex: number, patternId: string, policyIds: string[]) {
		if (!checklist.layers[layerIndex].policies) checklist.layers[layerIndex].policies = {};
		if (policyIds.length > 0) {
			checklist.layers[layerIndex].policies[patternId] = policyIds;
		} else {
			delete checklist.layers[layerIndex].policies[patternId];
		}
		persistAll();
	}

	// --- Policy API ---

	function getPolicies(): Policy[] {
		return policies;
	}

	function getCategories(): string[] {
		return categories;
	}

	function addPolicy(data: Omit<Policy, 'id'>): Policy {
		const id = uniqueId(data.name, policies.map((p) => p.id));
		const policy: Policy = { id, ...data };
		policies.push(policy);
		persistPolicies();
		return policy;
	}

	function updatePolicy(id: string, updates: Partial<Omit<Policy, 'id'>>) {
		const idx = policies.findIndex((p) => p.id === id);
		if (idx === -1) return;
		policies[idx] = { ...policies[idx], ...updates };
		persistPolicies();
	}

	function removePolicy(id: string) {
		policies = policies.filter((p) => p.id !== id);
		for (const layer of checklist.layers) {
			if (!layer.policies) continue;
			for (const patternId of Object.keys(layer.policies)) {
				layer.policies[patternId] = layer.policies[patternId].filter((pid) => pid !== id);
				if (layer.policies[patternId].length === 0) delete layer.policies[patternId];
			}
		}
		persistPolicies();
		persistAll();
	}

	function addCategory(category: string) {
		if (categories.includes(category)) return;
		categories.push(category);
		categories.sort((a, b) => a.localeCompare(b));
		persistPolicies();
	}

	function removeCategory(category: string) {
		categories = categories.filter((c) => c !== category);
		persistPolicies();
	}

	function setPoliciesFn(newPolicies: Policy[]) {
		policies = newPolicies;
		persistPolicies();
	}

	function setCategoriesFn(newCategories: string[]) {
		categories = newCategories;
		persistPolicies();
	}

	function resetPolicies() {
		policies = structuredClone(defaultPolicies);
		categories = structuredClone(defaultCategories);
		if (!options.onPersistPolicies) {
			localStorage.removeItem(POLICIES_KEY);
			localStorage.removeItem(CATEGORIES_KEY);
		} else {
			options.onPersistPolicies($state.snapshot(policies), $state.snapshot(categories));
		}
	}

	// --- Export ---

	function exportAsJson(): string {
		return JSON.stringify(checklist, null, 2);
	}

	function exportAsCsv(): string {
		const headers = ['Pattern', ...checklist.layers.map((l) => l.name)];
		const rows = allPatterns.map((p) => {
			const cells = checklist.layers.map((l) => {
				const vals = l.values[p.id] ?? [];
				return `"${vals.join(', ')}"`;
			});
			return `"${p.name}",${cells.join(',')}`;
		});
		return [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
	}

	async function exportAsXlsx() {
		const sheets: SheetSpec[] = [];

		// Sheet 1: Architecture checklist
		const archHeaders = ['Pattern', ...checklist.layers.map((l) => l.name)];
		const archData = allPatterns.map((p) => {
			const row: string[] = [p.name];
			checklist.layers.forEach((l) => {
				row.push((l.values[p.id] ?? []).join(', '));
			});
			return row;
		});
		sheets.push({ title: checklist.name, rows: [archHeaders, ...archData] });

		// Sheet 2: Notes (only when any layer has notes for any pattern)
		const notesHeaders = ['Pattern', ...checklist.layers.map((l) => l.name)];
		const notesData = allPatterns.map((p) => {
			const row: string[] = [p.name];
			checklist.layers.forEach((l) => {
				row.push(l.notes[p.id] ?? '');
			});
			return row;
		});
		const hasAnyNotes = notesData.some((r) => r.slice(1).some((c) => c));
		if (hasAnyNotes) {
			sheets.push({ title: 'Notes', rows: [notesHeaders, ...notesData] });
		}

		// Sheet 3: Lookups
		const maxLen = Math.max(...Object.values(lookups).map((v) => v.length), 0);
		const lookupHeaders = allPatterns.map((p) => p.name);
		const lookupRows: string[][] = [];
		for (let i = 0; i < maxLen; i++) {
			lookupRows.push(allPatterns.map((p) => (lookups[p.id] ?? [])[i] ?? ''));
		}
		sheets.push({ title: 'Lookups', rows: [lookupHeaders, ...lookupRows] });

		// Sheet 4: Dictionary
		const dictRows: string[][] = [['Pattern / Value', 'Description']];
		allPatterns.forEach((p) => {
			dictRows.push([p.name, dictionary.patterns[p.id] ?? '']);
			const vals = lookups[p.id] ?? [];
			vals.forEach((v) => {
				dictRows.push([`  ${v}`, dictionary.values[p.id]?.[v] ?? '']);
			});
		});
		sheets.push({ title: 'Dictionary', rows: dictRows });

		// Sheet 5+6: Policies + Policy Attachments
		if (policies.length > 0) {
			const policyHeaders = ['Name', 'Category', 'Description', 'Rule'];
			const policyData = policies.map((p) => [p.name, p.category, p.description, p.rule]);
			sheets.push({ title: 'Policies', rows: [policyHeaders, ...policyData] });

			const attachHeaders = ['Pattern', ...checklist.layers.map((l) => l.name)];
			const attachData = allPatterns.map((p) => {
				const row: string[] = [p.name];
				checklist.layers.forEach((l) => {
					const ids = l.policies?.[p.id] ?? [];
					const names = ids.map((id) => policies.find((pol) => pol.id === id)?.name ?? id);
					row.push(names.join(', '));
				});
				return row;
			});
			const hasAttachments = attachData.some((r) => r.slice(1).some((c) => c));
			if (hasAttachments) {
				sheets.push({ title: 'Policy Attachments', rows: [attachHeaders, ...attachData] });
			}
		}

		const blob = await buildXlsxBlob(sheets);
		const slug = checklist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '') || 'export';
		const d = new Date();
		const ts = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
		downloadXlsx(blob, `${slug}-checklist-${ts}.xlsx`);
	}

	// Return public API
	return {
		getChecklist,
		getSavedList,
		switchTo,
		newArchitecture,
		loadExample,
		loadChecklist,
		deleteArchitecture,
		setChecklistMeta,
		addLayer,
		removeLayer,
		moveLayer,
		setPatternOrder,
		setLayerName,
		setCellValues,
		setCellNote,
		setCellPolicies,
		getPolicies,
		getCategories,
		addPolicy,
		updatePolicy,
		removePolicy,
		addCategory,
		removeCategory,
		setPolicies: setPoliciesFn,
		setCategories: setCategoriesFn,
		resetPolicies,
		exportAsJson,
		exportAsCsv,
		exportAsXlsx,
		isDirty: () => dirty,
		markClean
	};
}

// Export type for context consumers
export type ChecklistStore = ReturnType<typeof createChecklistStore>;
