<script lang="ts">
	/**
	 * ChecklistLayout — renders the Data Architecture Layers Checklist as a canvas.
	 * This is the single source of truth component, used by both the standalone
	 * checklist app and the Context Plane (via package export).
	 *
	 * All mutations go through getContext<DataAdapter>('dataAdapter').
	 *
	 * Reference data (patterns, lookups, dictionary) is loaded from the checklist
	 * app's data directory via the $data vite alias.
	 */
	import { getContext } from 'svelte';
	import type { DataAdapter, ContextNode, ContextLink } from '$lib/cp-shared';
	import { getNodeLabels } from '$lib/cp-shared';
	import ChecklistPatternsTab from './ChecklistPatternsTab.svelte';
	import ChecklistPoliciesTab from './ChecklistPoliciesTab.svelte';
	import StepsView from './StepsView.svelte';
	import { stepsTabLabel, type ChecklistView, type StepActions } from '../../model/steps-view';
	import { buildXlsxBlob, downloadXlsx, type SheetSpec } from '$lib/cp-shared-xlsx';

	// Static reference data from the checklist app's data directory
	import patternsJson from '$data/lookups/patterns.json';
	import lookupsJson from '$data/lookups/lookups.json';
	import dictionaryJson from '$data/lookups/dictionary.json';

	interface Pattern {
		id: string;
		name: string;
		order: number;
		multiSelect: boolean;
		/**
		 * Per-architecture toggle controlling whether this pattern shows on the
		 * canvas. Missing = `true` (back-compat). Set on the per-architecture
		 * `checklist_config` node's `patternTypes` array via the Manage Pattern
		 * Types UI in `ChecklistPatternsTab.svelte`.
		 */
		enabled?: boolean;
	}

	const staticPatterns: Pattern[] = (patternsJson as { patterns: Pattern[] }).patterns;
	const lookups: Record<string, string[]> = lookupsJson as Record<string, string[]>;
	const dictionary: { patterns: Record<string, string>; values: Record<string, Record<string, string>> } = dictionaryJson as any;

	let {
		nodes,
		links,
		onSelectNode,
		onAddNode,
		onAddExisting,
		onExportJson,
		onImportJson,
		showSwitcher = true,
		showToolbar = true,
		showTabs = true,
		controlledModelId = null,
		onModelListChange
	}: {
		nodes: ContextNode[];
		links: ContextLink[];
		onSelectNode: (id: string) => void;
		onAddNode: (entityLabel: string, name: string) => void;
		onAddExisting: (entityLabel: string) => void;
		onExportJson?: (archName: string) => void;
		onImportJson?: () => Promise<void>;
		showSwitcher?: boolean;
		showToolbar?: boolean;
		showTabs?: boolean;
		controlledModelId?: string | null;
		onModelListChange?: (models: { id: string; name: string }[], selectedId: string | null) => void;
	} = $props();

	let importing = $state(false);

	// ── Tab state ──
	type TabId = 'checklist' | 'steps' | 'patterns' | 'policies';
	// The Steps tab is the way in, so it is the first tab and the canvas opens on it
	let activeTab = $state<TabId>('steps');

	const adapter = getContext<DataAdapter>('dataAdapter');

	// ── Derived: reconstruct checklist from nodes/links ──

	// Find architecture nodes
	const archNodes = $derived(nodes.filter((n) => getNodeLabels(n).includes('checklist_architecture')));
	let selectedArchId = $state<string | null>(null);

	// Auto-select first architecture (or use externally controlled ID)
	$effect(() => {
		if (controlledModelId !== null) {
			selectedArchId = controlledModelId;
		} else if (archNodes.length > 0 && (!selectedArchId || !archNodes.find((n) => n.id === selectedArchId))) {
			selectedArchId = archNodes[0].id;
		}
	});

	// Notify parent of model list / selection changes
	$effect(() => {
		if (onModelListChange) {
			onModelListChange(
				archNodes.map((n) => ({ id: n.id, name: n.name })),
				selectedArchId
			);
		}
	});

	const selectedArch = $derived(archNodes.find((n) => n.id === selectedArchId) ?? null);

	// ─── Per-architecture pattern config ──────────────────────
	// The Manage Pattern Types tab (ChecklistPatternsTab.svelte) writes
	// `patternTypes: Pattern[]` onto a `checklist_config` node linked to the
	// selected architecture via `has_checklist_config`. Each entry carries an
	// optional `enabled` flag — `false` means hide from the canvas. We mirror
	// that derivation here so the canvas (table columns, exports, lookups
	// section, dictionary section) reflects the user's per-architecture choices.
	const configNode = $derived(
		selectedArchId
			? (() => {
					const configLinkIds = links
						.filter((l) => l.label === 'has_checklist_config' && l.source_id === selectedArchId)
						.map((l) => l.destination_id);
					return nodes.find(
						(n) => getNodeLabels(n).includes('checklist_config') && configLinkIds.includes(n.id)
					) ?? null;
				})()
			: null
	);
	// Merge configured patternTypes with staticPatterns so new master patterns
	// (e.g. a freshly added Pattern Type in patterns.json) auto-appear on existing
	// architectures that already have a `checklist_config` snapshot. Configured
	// entries win (preserving per-arch toggles/edits); missing static entries are
	// appended in master order.
	const localPatterns = $derived.by<Pattern[]>(() => {
		const configured = configNode?.properties?.patternTypes as Pattern[] | undefined;
		if (!configured || configured.length === 0) return [...staticPatterns];
		const configuredIds = new Set(configured.map((p) => p.id));
		const missing = staticPatterns.filter((p) => !configuredIds.has(p.id));
		return [...configured, ...missing];
	});
	// Patterns visible on the canvas — filters out `enabled: false` entries so
	// toggling off in the Manage Pattern Types UI hides the column. Manage
	// Pattern Types itself reads `localPatterns` so its toggle UI shows every
	// entry regardless of enabled state.
	const patterns = $derived(localPatterns.filter((p) => p.enabled !== false));

	// Get layer nodes linked to the selected architecture
	const layerLinks = $derived(
		selectedArchId
			? links.filter((l) => l.source_id === selectedArchId && l.label === 'has_layer')
			: []
	);
	const layerNodeIds = $derived(new Set(layerLinks.map((l) => l.destination_id)));
	const layerNodes = $derived(
		nodes
			.filter((n) => layerNodeIds.has(n.id) && getNodeLabels(n).includes('checklist_layer'))
			.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0))
	);

	// ── Cell data extraction ──

	function getLayerValues(layer: ContextNode, patternId: string): string[] {
		const values = layer.properties?.values as Record<string, string[]> | undefined;
		return values?.[patternId] ?? [];
	}

	function getLayerNote(layer: ContextNode, patternId: string): string {
		const notes = layer.properties?.notes as Record<string, string> | undefined;
		return notes?.[patternId] ?? '';
	}

	function getLayerPolicies(layer: ContextNode, patternId: string): string[] {
		const policies = layer.properties?.policies as Record<string, string[]> | undefined;
		return policies?.[patternId] ?? [];
	}

	// ── Policy nodes linked to the architecture ──
	interface PolicyItem {
		id: string;
		name: string;
		description: string;
		category: string;
	}

	const policyNodes = $derived(
		selectedArchId
			? (() => {
					const policyLinkIds = links
						.filter((l) => l.label === 'has_policy' && l.source_id === selectedArchId)
						.map((l) => l.destination_id);
					return nodes.filter(
						(n) => getNodeLabels(n).includes('checklist_policy') && policyLinkIds.includes(n.id)
					);
				})()
			: []
	);

	const allPolicies = $derived<PolicyItem[]>(
		policyNodes.map((n) => ({
			id: n.id,
			name: n.name,
			description: n.description ?? '',
			category: (n.properties?.category as string) ?? ''
		}))
	);

	// ── Mutations ──

	async function handleCellChange(layerNode: ContextNode, patternId: string, newValues: string[]) {
		const currentValues = (layerNode.properties?.values as Record<string, string[]>) || {};
		const updatedValues = { ...currentValues, [patternId]: newValues };
		await adapter.updateNode(layerNode.id, {
			label: 'checklist_layer',
			name: layerNode.name,
			properties: { ...layerNode.properties, values: updatedValues }
		});
	}

	async function handleNoteChange(layerNode: ContextNode, patternId: string, note: string) {
		const currentNotes = (layerNode.properties?.notes as Record<string, string>) || {};
		const updatedNotes = { ...currentNotes };
		if (note) {
			updatedNotes[patternId] = note;
		} else {
			delete updatedNotes[patternId];
		}
		await adapter.updateNode(layerNode.id, {
			label: 'checklist_layer',
			name: layerNode.name,
			properties: { ...layerNode.properties, notes: updatedNotes }
		});
	}

	async function handleLayerNameChange(layerNode: ContextNode, newName: string) {
		await adapter.updateNode(layerNode.id, {
			label: 'checklist_layer',
			name: newName
		});
	}

	async function handleAddLayer(name?: string) {
		if (!selectedArchId) return;
		const order = layerNodes.length + 1;
		const newLayer = await adapter.createNode({
			label: 'checklist_layer',
			name: name || `Layer ${order}`,
			properties: { order, values: {}, notes: {}, policies: {} }
		});
		await adapter.createLink({
			source_id: selectedArchId,
			destination_id: newLayer.id,
			label: 'has_layer'
		});
	}

	async function handleRemoveLayer(layerNode: ContextNode) {
		// Delete the has_layer link first, then the node
		const link = layerLinks.find((l) => l.destination_id === layerNode.id);
		if (link) await adapter.deleteLink(link.id);
		await adapter.deleteNode(layerNode.id);
	}

	async function handleCreateArchitecture() {
		const archName = prompt('Architecture name:');
		if (!archName) return;
		onAddNode('checklist_architecture', archName);
	}

	async function handleDeleteArchitecture() {
		if (!selectedArchId || !selectedArch) return;
		if (!confirm(`Delete architecture "${selectedArch.name}"? This will also remove all its layers.`)) return;
		// Delete all layer links and nodes first
		for (const layer of layerNodes) {
			const link = layerLinks.find((l) => l.destination_id === layer.id);
			if (link) await adapter.deleteLink(link.id);
			await adapter.deleteNode(layer.id);
		}
		await adapter.deleteNode(selectedArchId);
		selectedArchId = null;
	}

	// ── Architecture switcher ──
	let showArchSwitcher = $state(false);

	// ── Editable name / description ──
	let editingArchName = $state(false);
	let editingArchNameValue = $state('');
	let editingArchDesc = $state(false);
	let editingArchDescValue = $state('');

	function autofocus(node: HTMLInputElement | HTMLTextAreaElement) {
		node.focus();
		if ('select' in node) node.select();
	}

	async function handleArchNameChange(newName: string) {
		editingArchName = false;
		if (!selectedArchId || !newName.trim()) return;
		await adapter.updateNode(selectedArchId, {
			label: 'checklist_architecture',
			name: newName.trim()
		});
	}

	async function handleArchDescChange(newDesc: string) {
		editingArchDesc = false;
		if (!selectedArchId) return;
		await adapter.updateNode(selectedArchId, {
			label: 'checklist_architecture',
			name: selectedArch?.name ?? '',
			description: newDesc.trim()
		});
	}

	// ── Drag-and-drop reordering ──
	let dragId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);
	let dropPosition = $state<'before' | 'after'>('before');

	function clearDragState() {
		dragId = null;
		dropTargetId = null;
		dropPosition = 'before';
	}

	function handleDragStart(e: DragEvent, id: string) {
		dragId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}

	function handleDragOverCol(e: DragEvent, targetId: string) {
		if (!dragId || dragId === targetId) return;
		e.preventDefault();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		dropPosition = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
		dropTargetId = targetId;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (!dragId || !dropTargetId || dragId === dropTargetId) { clearDragState(); return; }
		const sorted = [...layerNodes];
		const dragIdx = sorted.findIndex((n) => n.id === dragId);
		let dropIdx = sorted.findIndex((n) => n.id === dropTargetId);
		if (dragIdx === -1 || dropIdx === -1) { clearDragState(); return; }
		const [moved] = sorted.splice(dragIdx, 1);
		dropIdx = sorted.findIndex((n) => n.id === dropTargetId);
		const insertIdx = dropPosition === 'after' ? dropIdx + 1 : dropIdx;
		sorted.splice(insertIdx, 0, moved);
		await saveLayerOrder(sorted);
		clearDragState();
	}

	/** Writes each layer's place in the list as its order, where it changed. */
	async function saveLayerOrder(sorted: ContextNode[]) {
		for (let i = 0; i < sorted.length; i++) {
			const node = sorted[i];
			const newOrder = i + 1;
			if ((node.properties?.order as number) !== newOrder) {
				await adapter.updateNode(node.id, {
					properties: { ...node.properties, order: newOrder }
				});
			}
		}
	}

	// ── Cell dropdown state ──
	let openDropdown = $state<string | null>(null);

	function toggleDropdown(key: string) {
		openDropdown = openDropdown === key ? null : key;
	}

	function selectValue(layerNode: ContextNode, patternId: string, value: string, multiSelect: boolean) {
		const current = getLayerValues(layerNode, patternId);
		let newValues: string[];
		if (multiSelect) {
			if (current.includes(value)) {
				newValues = current.filter((v) => v !== value);
			} else {
				newValues = [...current, value];
			}
		} else {
			newValues = current.includes(value) ? [] : [value];
		}
		handleCellChange(layerNode, patternId, newValues);
		if (!multiSelect) openDropdown = null;
	}

	// ── Policy popover ──
	let openPolicy = $state<string | null>(null);
	let policySearch = $state('');

	function togglePolicy(layerNode: ContextNode, patternId: string, policyId: string) {
		const current = getLayerPolicies(layerNode, patternId);
		let updated: string[];
		if (current.includes(policyId)) {
			updated = current.filter((id) => id !== policyId);
		} else {
			updated = [...current, policyId];
		}
		handleCellPoliciesChange(layerNode, patternId, updated);
	}

	async function handleCellPoliciesChange(layerNode: ContextNode, patternId: string, policyIds: string[]) {
		const currentPolicies = (layerNode.properties?.policies as Record<string, string[]>) || {};
		const updatedPolicies = { ...currentPolicies };
		if (policyIds.length > 0) {
			updatedPolicies[patternId] = policyIds;
		} else {
			delete updatedPolicies[patternId];
		}
		await adapter.updateNode(layerNode.id, {
			label: 'checklist_layer',
			name: layerNode.name,
			properties: { ...layerNode.properties, policies: updatedPolicies }
		});
	}

	// ── Notes popover ──
	let openNote = $state<string | null>(null);
	let noteText = $state('');

	function openNoteEditor(key: string, currentNote: string) {
		openNote = key;
		noteText = currentNote;
	}

	function saveNote(layerNode: ContextNode, patternId: string) {
		handleNoteChange(layerNode, patternId, noteText);
		openNote = null;
	}

	// ── Pattern row drag-and-drop ──
	let patternDragId = $state<string | null>(null);
	let patternDropTargetId = $state<string | null>(null);
	let patternDropPosition = $state<'before' | 'after'>('before');

	function clearPatternDragState() {
		patternDragId = null;
		patternDropTargetId = null;
		patternDropPosition = 'before';
	}

	function handlePatternDragStart(e: DragEvent, id: string) {
		patternDragId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', id);
		}
	}

	function handlePatternDragOverRow(e: DragEvent, targetId: string) {
		if (!patternDragId || patternDragId === targetId) return;
		e.preventDefault();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		patternDropPosition = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
		patternDropTargetId = targetId;
	}

	async function handlePatternDrop(e: DragEvent) {
		e.preventDefault();
		if (!patternDragId || !patternDropTargetId || patternDragId === patternDropTargetId) { clearPatternDragState(); return; }
		const sorted = [...sortedPatterns];
		const dragIdx = sorted.findIndex((p) => p.id === patternDragId);
		let dropIdx = sorted.findIndex((p) => p.id === patternDropTargetId);
		if (dragIdx === -1 || dropIdx === -1) { clearPatternDragState(); return; }
		const [moved] = sorted.splice(dragIdx, 1);
		dropIdx = sorted.findIndex((p) => p.id === patternDropTargetId);
		const insertIdx = patternDropPosition === 'after' ? dropIdx + 1 : dropIdx;
		sorted.splice(insertIdx, 0, moved);
		// Persist pattern order on the architecture node
		if (selectedArchId) {
			const newOrder = sorted.map((p) => p.id);
			const archNode = archNodes.find((n) => n.id === selectedArchId);
			await adapter.updateNode(selectedArchId, {
				properties: { ...archNode?.properties, patternOrder: newOrder }
			});
		}
		clearPatternDragState();
	}

	// ── Sorted patterns (respecting custom order stored on architecture) ──
	const sortedPatterns = $derived.by(() => {
		const customOrder = selectedArch?.properties?.patternOrder as string[] | undefined;
		if (!customOrder || customOrder.length === 0) return [...patterns];
		const orderMap = new Map(customOrder.map((id, i) => [id, i]));
		return [...patterns].sort((a, b) => {
			const oa = orderMap.get(a.id) ?? 999;
			const ob = orderMap.get(b.id) ?? 999;
			return oa - ob;
		});
	});

	// ── Search filter for pattern rows ──
	let patternSearchQuery = $state('');

	const filteredPatterns = $derived.by(() => {
		const q = patternSearchQuery.toLowerCase().trim();
		if (!q) return sortedPatterns;
		return sortedPatterns.filter((p) => p.name.toLowerCase().includes(q));
	});

	// ── Steps tab: the same layers and cells, through the same handlers as the grid ──
	const stepsView = $derived<ChecklistView>({
		layers: layerNodes.map((n) => ({
			key: n.id,
			name: n.name,
			values: (n.properties?.values as Record<string, string[]> | undefined) ?? {},
			notes: (n.properties?.notes as Record<string, string> | undefined) ?? {}
		})),
		patterns: sortedPatterns,
		lookups,
		dictionary
	});

	function layerByKey(key: string): ContextNode | undefined {
		return layerNodes.find((n) => n.id === key);
	}

	const stepActions: StepActions = {
		setValues: (key, patternId, values) => {
			const layer = layerByKey(key);
			if (layer) handleCellChange(layer, patternId, values);
		},
		setNote: (key, patternId, note) => {
			const layer = layerByKey(key);
			if (layer) handleNoteChange(layer, patternId, note);
		},
		addLayer: (name) => handleAddLayer(name),
		renameLayer: (key, name) => {
			const layer = layerByKey(key);
			if (layer) handleLayerNameChange(layer, name);
		},
		moveLayer: (key, toIndex) => {
			const sorted = [...layerNodes];
			const from = sorted.findIndex((n) => n.id === key);
			if (from === -1 || toIndex < 0 || toIndex >= sorted.length) return;
			const [moved] = sorted.splice(from, 1);
			sorted.splice(toIndex, 0, moved);
			saveLayerOrder(sorted);
		},
		removeLayer: (key) => {
			const layer = layerByKey(key);
			if (layer) handleRemoveLayer(layer);
		}
	};

	// ── Export helpers ──

	function exportTimestamp(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
	}

	function slugifyName(name: string): string {
		return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '') || 'export';
	}

	function downloadFile(content: string | ArrayBuffer, filename: string, type: string) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function handleExportCsv() {
		if (!selectedArch) return;
		const headers = ['Pattern', ...layerNodes.map((l) => l.name)];
		const rows = patterns.map((p) => {
			const cells = layerNodes.map((l) => {
				const vals = getLayerValues(l, p.id);
				return `"${vals.join(', ')}"`;
			});
			return `"${p.name}",${cells.join(',')}`;
		});
		const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
		const slug = slugifyName(selectedArch.name);
		downloadFile(csv, `${slug}-checklist-${exportTimestamp()}.csv`, 'text/csv');
	}

	async function handleExportExcel() {
		if (!selectedArch) return;
		const sheets: SheetSpec[] = [];

		// Sheet 1: Architecture Checklist
		const archHeaders = ['Pattern', ...layerNodes.map((l) => l.name)];
		const archData = patterns.map((p) => {
			const row: string[] = [p.name];
			layerNodes.forEach((l) => {
				row.push(getLayerValues(l, p.id).join(', '));
			});
			return row;
		});
		sheets.push({ title: selectedArch.name || 'Checklist', rows: [archHeaders, ...archData] });

		// Sheet 2: Notes (only if any exist)
		const notesHeaders = ['Pattern', ...layerNodes.map((l) => l.name)];
		const notesData = patterns.map((p) => {
			const row: string[] = [p.name];
			layerNodes.forEach((l) => {
				row.push(getLayerNote(l, p.id));
			});
			return row;
		});
		const hasAnyNotes = notesData.some((r) => r.slice(1).some((c) => c));
		if (hasAnyNotes) {
			sheets.push({ title: 'Notes', rows: [notesHeaders, ...notesData] });
		}

		// Sheet 3: Lookups
		const maxLen = Math.max(...Object.values(lookups).map((v) => v.length), 0);
		const lookupHeaders = patterns.map((p) => p.name);
		const lookupRows: string[][] = [];
		for (let i = 0; i < maxLen; i++) {
			lookupRows.push(patterns.map((p) => (lookups[p.id] ?? [])[i] ?? ''));
		}
		sheets.push({ title: 'Lookups', rows: [lookupHeaders, ...lookupRows] });

		// Sheet 4: Dictionary
		const dictRows: string[][] = [['Pattern / Value', 'Description']];
		patterns.forEach((p) => {
			dictRows.push([p.name, dictionary.patterns[p.id] ?? '']);
			const vals = lookups[p.id] ?? [];
			vals.forEach((v) => {
				dictRows.push([`  ${v}`, dictionary.values[p.id]?.[v] ?? '']);
			});
		});
		sheets.push({ title: 'Dictionary', rows: dictRows });

		const blob = await buildXlsxBlob(sheets);
		const slug = slugifyName(selectedArch.name);
		downloadXlsx(blob, `${slug}-checklist-${exportTimestamp()}.xlsx`);
	}
</script>

<div class="flex-1 overflow-hidden p-4 flex flex-col min-h-0">
	{#if showSwitcher}
	<!-- Tier 1: Header — Architecture switcher + New + Delete -->
	<div class="bg-white border border-slate-200 rounded-lg px-4 py-2.5 mb-2">
		<div class="flex items-center gap-2">
			<div class="relative" data-arch-switcher>
				<button
					onclick={() => (showArchSwitcher = !showArchSwitcher)}
					class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
				>
					<div class="text-left">
						<div class="text-sm font-semibold text-slate-800 leading-tight">{selectedArch?.name ?? 'No architecture'}</div>
						<div class="text-[10px] text-slate-400 leading-tight">Switch Architecture Checklist</div>
					</div>
					<svg class="w-4 h-4 text-slate-400 transition-transform {showArchSwitcher ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if showArchSwitcher}
					<div class="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 min-w-[200px]">
						{#each archNodes as arch}
							<button
								onclick={() => { selectedArchId = arch.id; showArchSwitcher = false; }}
								class="w-full text-left px-4 py-2 text-sm transition-colors {arch.id === selectedArchId ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}"
							>
								{arch.name}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button
				class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-cyan-700 border border-cyan-300 hover:bg-cyan-50 transition-colors"
				onclick={handleCreateArchitecture}
			>
				New Checklist
			</button>
			{#if selectedArch && archNodes.length > 0}
				<button
					class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-red-500 border border-red-300 hover:bg-red-50 transition-colors"
					onclick={handleDeleteArchitecture}
				>
					Delete
				</button>
			{/if}
		</div>
	</div>
	{/if}

	{#if !selectedArch && showSwitcher}
		<div class="text-center py-12 text-slate-400">
			<p class="text-lg mb-2">No architecture found</p>
			<p class="text-sm">Create a new architecture to get started with the checklist.</p>
		</div>
	{/if}

	{#if selectedArch && showToolbar}
		<!-- Tier 2: Toolbar — Name/Desc + Export buttons -->
		<div class="bg-white border border-slate-200 rounded-lg mb-2">
			<div class="flex items-center justify-between px-4 py-2.5">
				<div class="flex items-center gap-3 min-w-0">
					<div class="min-w-0">
						{#if editingArchName}
							<input
								use:autofocus
								type="text"
								bind:value={editingArchNameValue}
								onblur={() => handleArchNameChange(editingArchNameValue)}
								onkeydown={(e) => { if (e.key === 'Enter') handleArchNameChange(editingArchNameValue); if (e.key === 'Escape') { editingArchName = false; } }}
								class="text-sm font-semibold text-slate-800 px-1 border border-blue-400 rounded outline-none w-64"
							/>
						{:else}
							<button
								class="text-sm font-semibold text-slate-800 leading-tight cursor-pointer hover:text-slate-600 transition-colors text-left truncate max-w-md"
								onclick={() => { editingArchNameValue = selectedArch!.name; editingArchName = true; }}
								title="Click to edit name"
							>{selectedArch.name}</button>
						{/if}
						{#if editingArchDesc}
							<input
								use:autofocus
								type="text"
								bind:value={editingArchDescValue}
								onblur={() => handleArchDescChange(editingArchDescValue)}
								onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleArchDescChange(editingArchDescValue); } if (e.key === 'Escape') { editingArchDesc = false; } }}
								placeholder="Add a description..."
								class="text-[10px] text-slate-500 px-1 border border-blue-400 rounded outline-none w-full mt-0.5"
							/>
						{:else}
							<button
								class="block text-[10px] leading-tight mt-0.5 truncate max-w-md text-left cursor-pointer transition-colors {selectedArch.description ? 'text-slate-400 hover:text-slate-600' : 'text-slate-300 italic hover:text-slate-500'}"
								onclick={() => { editingArchDescValue = selectedArch!.description || ''; editingArchDesc = true; }}
								title="Click to edit description"
							>{selectedArch.description || 'Click to add a description'}</button>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2 shrink-0">
					{#if onExportJson}
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
							onclick={() => onExportJson(selectedArch?.name ?? '')}
						>
							Export JSON
						</button>
					{/if}
					<button
						class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
						onclick={handleExportCsv}
					>
						Export CSV
					</button>
					<button
						class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors"
						onclick={handleExportExcel}
					>
						Export Excel
					</button>
					{#if onImportJson}
						<button
							class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
							disabled={importing}
							onclick={async () => { importing = true; try { await onImportJson!(); } finally { importing = false; } }}
						>
							{importing ? 'Importing...' : 'Import JSON'}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if (selectedArch || !showSwitcher) && showTabs}
		<!-- Tier 3: Tabs -->
		<div class="flex gap-0 px-4 border-b border-slate-200 mb-3">
			<button
				class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'steps' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
				onclick={() => (activeTab = 'steps')}
			>{stepsTabLabel(sortedPatterns)}</button>
			<button
				class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'checklist' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
				onclick={() => (activeTab = 'checklist')}
			>Checklist</button>
			<button
				class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'patterns' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
				onclick={() => (activeTab = 'patterns')}
			>Manage Patterns</button>
			<button
				class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'policies' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
				onclick={() => (activeTab = 'policies')}
			>Manage Policies</button>
		</div>
	{/if}

	{#if activeTab === 'patterns'}
		<ChecklistPatternsTab {nodes} {links} {selectedArchId} />
	{:else if activeTab === 'policies'}
		<ChecklistPoliciesTab {nodes} {links} {selectedArchId} />
	{:else if activeTab === 'steps'}
		{#if selectedArch}
			<div class="flex-1 min-h-0 overflow-hidden flex flex-col">
				<StepsView view={stepsView} actions={stepActions} />
			</div>
		{:else}
			<!-- The Context Plane can show the tabs before any architecture exists. Same block as the switcher's "No architecture found" -->
			<div class="text-center py-12 text-slate-400">
				<p class="text-sm">No architecture checklist yet.</p>
			</div>
		{/if}
	{:else if selectedArch || !showSwitcher}
		<!-- Pattern search -->
		{#if patterns.length >= 5}
			<div class="mb-2 relative max-w-xs">
				<svg class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
				<input bind:value={patternSearchQuery} type="text" placeholder="Search pattern rules..." class="w-full pl-7 pr-6 py-1.5 text-xs border rounded-md bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none border-slate-200" />
				{#if patternSearchQuery}
					<button onclick={() => (patternSearchQuery = '')} class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
				{/if}
			</div>
		{/if}

		<!-- Matrix table -->
		<div class="overflow-auto flex-1 min-h-0">
			<table class="checklist-canvas-table">
				<thead>
					<tr>
						<th class="sticky left-0 z-20 first-col-header">
							Layers / Pattern Rules
						</th>
						{#each layerNodes as layer, li}
							<th
								class="layer-col-header {dragId === layer.id ? 'opacity-30' : ''} {dropTargetId === layer.id ? (dropPosition === 'before' ? 'border-l-2 !border-l-blue-500' : 'border-r-2 !border-r-blue-500') : ''}"
								ondragover={(e) => handleDragOverCol(e, layer.id)}
								ondrop={handleDrop}
							>
								<span
									class="inline-flex items-center justify-center w-4 h-3 text-[11px] text-white/50 hover:text-white/80 cursor-grab select-none absolute top-0.5 left-0.5"
									draggable="true"
									ondragstart={(e) => handleDragStart(e, layer.id)}
									ondragend={clearDragState}
									role="img"
									aria-label="Drag to reorder"
								>⠿</span>
								<div class="flex items-center gap-1">
									<input
										class="layer-name-input"
										value={layer.name}
										onchange={(e) => handleLayerNameChange(layer, e.currentTarget.value)}
									/>
									{#if layerNodes.length > 1}
										<button
											class="remove-layer-btn"
											title="Remove layer"
											onclick={() => handleRemoveLayer(layer)}
										>
											&times;
										</button>
									{/if}
								</div>
							</th>
						{/each}
						<th class="add-layer-header">
							<button class="add-layer-btn" onclick={() => handleAddLayer()}>+ Add Layer</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPatterns as pattern}
						<tr
							class="{patternDragId === pattern.id ? 'opacity-30' : ''} {patternDropTargetId === pattern.id ? (patternDropPosition === 'before' ? 'pattern-drop-before' : 'pattern-drop-after') : ''}"
							ondragover={(e) => handlePatternDragOverRow(e, pattern.id)}
							ondrop={handlePatternDrop}
						>
							<td class="pattern-cell sticky left-0 z-10">
								<div class="flex items-stretch">
									{#if sortedPatterns.length > 1}
										<span
											class="inline-flex items-center justify-center w-5 shrink-0 text-[10px] text-slate-400 hover:text-slate-600 cursor-grab select-none"
											draggable="true"
											ondragstart={(e) => handlePatternDragStart(e, pattern.id)}
											ondragend={clearPatternDragState}
											role="img"
											aria-label="Drag to reorder"
										>⠿</span>
									{/if}
									<div class="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-cyan-300 bg-white hover:bg-cyan-50/30 transition-colors" title={dictionary.patterns[pattern.id] || ''}>
										<div class="tooltip">
											<span class="pattern-name">{pattern.name}</span>
											{#if dictionary.patterns[pattern.id]}
												<span class="tooltip-text">{dictionary.patterns[pattern.id]}</span>
											{/if}
										</div>
									</div>
								</div>
							</td>
							{#each layerNodes as layer, li}
								{@const cellKey = `${layer.id}-${pattern.id}`}
								{@const values = getLayerValues(layer, pattern.id)}
								{@const note = getLayerNote(layer, pattern.id)}
								{@const options = lookups[pattern.id] ?? []}
								{@const cellPolicies = getLayerPolicies(layer, pattern.id)}
								<td class="value-cell relative">
									<div class="cell-with-notes">
										<!-- Value dropdown -->
										<div class="flex-1 relative">
											<button
												class="cell-dropdown-trigger"
												onclick={() => toggleDropdown(cellKey)}
											>
												{#if values.length > 0}
													<span class="cell-values">
														{#each values as value}
															<span class="chip">{value}</span>
														{/each}
													</span>
												{:else}
													<span class="empty-cell">—</span>
												{/if}
											</button>
											{#if openDropdown === cellKey}
												<!-- svelte-ignore a11y_no_static_element_interactions -->
												<div class="dropdown-panel">
													{#each options as opt}
														{@const selected = values.includes(opt)}
														<button
															class="dropdown-option {selected ? 'selected' : ''}"
															onclick={() => selectValue(layer, pattern.id, opt, pattern.multiSelect)}
														>
															{#if pattern.multiSelect}
																<span class="checkbox {selected ? 'checked' : ''}">
																	{#if selected}✓{/if}
																</span>
															{:else}
																<span class="radio {selected ? 'checked' : ''}"></span>
															{/if}
															<div class="option-content">
																<span class="option-name {selected ? 'selected' : ''}">{opt}</span>
																{#if dictionary.values[pattern.id]?.[opt]}
																	<span class="option-desc">{dictionary.values[pattern.id][opt]}</span>
																{/if}
															</div>
														</button>
													{/each}
													{#if options.length === 0}
														<p class="dropdown-empty">No options</p>
													{/if}
												</div>
											{/if}
										</div>
										<!-- Policy shield indicator -->
										<div class="relative">
											<button
												class="policy-btn {cellPolicies.length > 0 ? 'has-policies' : ''}"
												title={cellPolicies.length > 0 ? `${cellPolicies.length} policies attached` : 'Attach policies'}
												onclick={() => { openPolicy = openPolicy === cellKey ? null : cellKey; policySearch = ''; }}
											>
												&#x1F6E1;
												{#if cellPolicies.length > 0}
													<span class="policy-count">{cellPolicies.length}</span>
												{/if}
											</button>
											{#if openPolicy === cellKey}
												<!-- svelte-ignore a11y_no_static_element_interactions -->
												<div class="policy-panel">
													<input
														type="text"
														class="policy-search"
														placeholder="Search policies..."
														bind:value={policySearch}
													/>
													<div class="policy-list">
														{#each allPolicies.filter((p) => !policySearch || p.name.toLowerCase().includes(policySearch.toLowerCase()) || p.category.toLowerCase().includes(policySearch.toLowerCase())) as policy}
															{@const isChecked = cellPolicies.includes(policy.id)}
															<button
																class="policy-option {isChecked ? 'selected' : ''}"
																onclick={() => togglePolicy(layer, pattern.id, policy.id)}
															>
																<span class="checkbox {isChecked ? 'checked' : ''}">
																	{#if isChecked}✓{/if}
																</span>
																<div class="policy-option-content">
																	<span class="policy-option-name">{policy.name}</span>
																	{#if policy.category}
																		<span class="policy-option-category">{policy.category}</span>
																	{/if}
																	{#if policy.description}
																		<span class="policy-option-desc">{policy.description}</span>
																	{/if}
																</div>
															</button>
														{/each}
														{#if allPolicies.length === 0}
															<p class="dropdown-empty">No policies defined. Add policies in the Manage Policies tab.</p>
														{/if}
													</div>
												</div>
											{/if}
										</div>
										<!-- Note indicator -->
										<button
											class="note-btn {note ? 'has-note' : ''}"
											title={note || 'Add note'}
											onclick={() => openNoteEditor(cellKey, note)}
										>
											&#9998;
										</button>
									</div>
									{#if openNote === cellKey}
										<div class="note-popover">
											<textarea
												class="note-textarea"
												rows="3"
												bind:value={noteText}
											></textarea>
											<div class="note-actions">
												<button class="note-save" onclick={() => saveNote(layer, pattern.id)}>Save</button>
												<button class="note-cancel" onclick={() => (openNote = null)}>Cancel</button>
											</div>
										</div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Click-away handler for dropdowns -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if openDropdown || openNote || openPolicy || showArchSwitcher}
	<div
		class="fixed inset-0 z-40"
		onclick={() => { openDropdown = null; if (openNote) openNote = null; openPolicy = null; showArchSwitcher = false; }}
	></div>
{/if}

<style>
	/* ── Table ── */
	.checklist-canvas-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	.checklist-canvas-table th,
	.checklist-canvas-table td {
		border: 1px solid #dee2e6;
		padding: 0.5rem 0.75rem;
		text-align: left;
		vertical-align: top;
	}

	/* ── Header ── */
	.first-col-header {
		background: #020617;
		color: white;
		font-weight: 600;
		font-size: 0.8125rem;
		min-width: 200px;
		position: sticky;
		top: 0;
		left: 0;
		/* z-20 (above body .pattern-cell which has z-10). The
		   top-left corner cell sits at the intersection of vertical
		   sticky headers (z-10) and horizontal sticky body column
		   (also z-10) — equal z-index + DOM-order tiebreak made the
		   tbody cell render OVER the header. Higher z fixes that. */
		z-index: 20;
	}

	.layer-col-header {
		background: #0f172a;
		color: white;
		font-weight: 600;
		font-size: 0.8125rem;
		min-width: 180px;
		position: relative;
		cursor: grab;
		user-select: none;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.layer-name-input {
		background: transparent;
		border: none;
		color: white;
		font: inherit;
		font-weight: 600;
		font-size: 0.8125rem;
		width: calc(100% - 2.5rem);
		padding: 0;
		cursor: text;
	}

	.layer-name-input:focus {
		outline: 1px solid rgba(255, 255, 255, 0.5);
		border-radius: 2px;
	}

	.remove-layer-btn {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.75rem;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		flex-shrink: 0;
	}

	.remove-layer-btn:hover {
		color: #fca5a5;
	}

	.add-layer-header {
		/* Sticky so the header freezes at the top during vertical scroll
		   like .first-col-header and .layer-col-header. There's no
		   global `thead th { position: sticky }` selector in this
		   scoped stylesheet, so each header class has to opt in. */
		position: sticky;
		top: 0;
		z-index: 10;
		min-width: auto;
		padding: 0.5rem !important;
		background: white;
		border: none;
		vertical-align: middle;
	}

	.add-layer-btn {
		white-space: nowrap;
		padding: 0.375rem 0.75rem;
		border: 1px solid #dee2e6;
		border-radius: 6px;
		background: white;
		color: #212529;
		font-size: 0.8125rem;
		cursor: pointer;
		font-family: inherit;
	}

	.add-layer-btn:hover {
		background: #f8f9fa;
	}

	/* ── Body rows ── */
	.checklist-canvas-table tbody tr:nth-child(even) {
		background: #f8f9fa;
	}

	.checklist-canvas-table tbody tr:hover {
		background: #e7f1ff;
	}

	/* ── Pattern cell (first column) ── */
	.pattern-cell {
		background: white;
		font-weight: 600;
		white-space: nowrap;
		padding: 0.375rem 0.5rem !important;
	}

	.checklist-canvas-table tbody tr:nth-child(even) .pattern-cell {
		background: #f8f9fa;
	}

	.checklist-canvas-table tbody tr:hover .pattern-cell {
		background: #e7f1ff;
	}

	.pattern-name {
		font-weight: 600;
		cursor: help;
	}

	/* ── Pattern row drop indicators ── */
	:global(.pattern-drop-before) {
		border-top: 2px solid #0891b2 !important;
	}

	:global(.pattern-drop-after) {
		border-bottom: 2px solid #0891b2 !important;
	}

	/* ── Tooltip ── */
	.tooltip {
		position: relative;
	}

	.tooltip-text {
		visibility: hidden;
		opacity: 0;
		position: absolute;
		z-index: 100;
		background: #212529;
		color: white;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 400;
		line-height: 1.4;
		max-width: 320px;
		width: max-content;
		left: 0;
		top: calc(100% + 4px);
		transition: opacity 0.15s;
		pointer-events: none;
	}

	.tooltip:hover .tooltip-text {
		visibility: visible;
		opacity: 1;
	}

	/* ── Value cell ── */
	.value-cell {
		position: relative;
	}

	.cell-with-notes {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.cell-dropdown-trigger {
		width: 100%;
		text-align: left;
		font-size: 0.8125rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		min-height: 24px;
	}

	.cell-values {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.chip {
		display: inline-block;
		background: #e7f1ff;
		color: #0066cc;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.empty-cell {
		color: #6c757d;
		font-style: italic;
	}

	/* ── Dropdown panel ── */
	.dropdown-panel {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 50;
		margin-top: 2px;
		width: 18rem;
		max-height: 18rem;
		overflow-y: auto;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		padding: 0.25rem 0;
	}

	.dropdown-option {
		width: 100%;
		text-align: left;
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		border: none;
		background: none;
		cursor: pointer;
		font-family: inherit;
		border-bottom: 1px solid #f1f5f9;
	}

	.dropdown-option:last-child {
		border-bottom: none;
	}

	.dropdown-option:hover {
		background: #f8fafc;
	}

	.dropdown-option.selected {
		background: #ecfdf5;
	}

	.checkbox {
		width: 0.875rem;
		height: 0.875rem;
		border: 1px solid #cbd5e1;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 2px;
		font-size: 0.625rem;
	}

	.checkbox.checked {
		background: #0891b2;
		border-color: #0891b2;
		color: white;
	}

	.radio {
		width: 0.75rem;
		height: 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.radio.checked {
		background: #0891b2;
		border-color: #0891b2;
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.option-name {
		font-weight: 600;
		color: #334155;
	}

	.option-name.selected {
		color: #0891b2;
	}

	.option-desc {
		font-size: 0.6875rem;
		color: #94a3b8;
		line-height: 1.3;
	}

	.dropdown-empty {
		padding: 0.5rem;
		font-size: 0.75rem;
		color: #94a3b8;
		font-style: italic;
	}

	/* ── Policy shield indicator ── */
	.policy-btn {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1.25rem;
		min-width: 1.25rem;
		border-radius: 10px;
		font-size: 0.6875rem;
		color: #cbd5e1;
		background: none;
		border: 1px solid transparent;
		cursor: pointer;
		padding: 0 2px;
		gap: 1px;
		position: relative;
	}

	.policy-btn:hover {
		color: #94a3b8;
	}

	.policy-btn.has-policies {
		background: #d1ecf1;
		border-color: #17a2b8;
		color: #0c5460;
	}

	.policy-count {
		font-size: 0.5625rem;
		font-weight: 700;
		line-height: 1;
	}

	.policy-panel {
		position: absolute;
		top: 100%;
		right: 0;
		z-index: 50;
		margin-top: 4px;
		width: 20rem;
		max-height: 22rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
	}

	.policy-search {
		width: 100%;
		font: inherit;
		font-size: 0.75rem;
		border: none;
		border-bottom: 1px solid #e2e8f0;
		padding: 0.5rem;
		outline: none;
	}

	.policy-search:focus {
		border-bottom-color: #0891b2;
	}

	.policy-list {
		overflow-y: auto;
		max-height: 18rem;
		padding: 0.25rem 0;
	}

	.policy-option {
		width: 100%;
		text-align: left;
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		border: none;
		background: none;
		cursor: pointer;
		font-family: inherit;
		border-bottom: 1px solid #f1f5f9;
	}

	.policy-option:last-child {
		border-bottom: none;
	}

	.policy-option:hover {
		background: #f8fafc;
	}

	.policy-option.selected {
		background: #ecfdf5;
	}

	.policy-option-content {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.policy-option-name {
		font-weight: 600;
		color: #334155;
	}

	.policy-option-category {
		font-size: 0.625rem;
		color: #0891b2;
		font-weight: 500;
	}

	.policy-option-desc {
		font-size: 0.625rem;
		color: #94a3b8;
		line-height: 1.3;
	}

	/* ── Note indicator ── */
	.note-btn {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: 0.75rem;
		color: #cbd5e1;
		background: none;
		border: 1px solid transparent;
		cursor: pointer;
		padding: 0;
	}

	.note-btn:hover {
		color: #94a3b8;
	}

	.note-btn.has-note {
		background: #fff3cd;
		border-color: #ffc107;
		color: #856404;
	}

	.note-popover {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 50;
		margin-top: 4px;
		width: 16rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		padding: 0.5rem;
	}

	.note-textarea {
		width: 100%;
		font: inherit;
		font-size: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		padding: 0.375rem;
		resize: none;
	}

	.note-actions {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	.note-save {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		background: #0891b2;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-family: inherit;
	}

	.note-cancel {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		cursor: pointer;
		font-family: inherit;
	}
</style>
