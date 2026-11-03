<script lang="ts">
	import { getContext } from 'svelte';
	import type { ChecklistStore } from '$lib/stores/checklist.svelte';
	import { effectiveData } from '$lib/data/effective.svelte';

	// Reactive — picks up AdminPanel's localStorage overrides via
	// effectiveData.refresh(). Same-tab Manage Patterns edits flow through
	// the explicit refresh() call AdminPanel makes after save(); cross-tab
	// updates flow through the 'storage' event listener inside
	// effective.svelte.ts. Either way, the canvas re-renders without
	// requiring a manual page reload.
	//
	// We use `visiblePatterns` (not `patterns`) so toggled-off pattern
	// types in Manage Pattern Types don't appear on the canvas. AdminPanel
	// reads the full `patterns` list so its toggle UI can show every
	// pattern regardless of enabled state.
	const patterns = $derived(effectiveData.visiblePatterns);
	const lookups = $derived(effectiveData.lookups);
	const dictionary = $derived(effectiveData.dictionary);
	import CellDropdown from './CellDropdown.svelte';
	import NotesPopover from './NotesPopover.svelte';
	import PolicyBadge from './PolicyBadge.svelte';

	const store = getContext<ChecklistStore>('checklistStore');

	let checklist = $derived(store.getChecklist());
	let allPolicies = $derived(store.getPolicies());
	let editingName = $state(false);
	let editingDesc = $state(false);
	let nameInput = $state('');
	let descInput = $state('');

	// Drag-to-reorder state (layers)
	let dragFrom = $state<number | null>(null);
	let dragOver = $state<number | null>(null);

	// Pattern row drag-and-drop
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

	function handlePatternDrop(e: DragEvent) {
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
		store.setPatternOrder(sorted.map((p) => p.id));
		clearPatternDragState();
	}

	// Sorted patterns respecting custom order
	const sortedPatterns = $derived.by(() => {
		const customOrder = checklist.patternOrder;
		if (!customOrder || customOrder.length === 0) return [...patterns];
		const orderMap = new Map(customOrder.map((id: string, i: number) => [id, i]));
		return [...patterns].sort((a, b) => {
			const oa = orderMap.get(a.id) ?? 999;
			const ob = orderMap.get(b.id) ?? 999;
			return oa - ob;
		});
	});

	// Drag-to-resize state
	let resizing = $state<number | null>(null);
	let colWidths = $state<Record<number, number>>({});
	let resizeStartX = 0;
	let resizeStartWidth = 0;

	function startEditName() {
		nameInput = checklist.name;
		editingName = true;
	}

	function saveName() {
		store.setChecklistMeta(nameInput.trim(), checklist.description);
		editingName = false;
	}

	function startEditDesc() {
		descInput = checklist.description;
		editingDesc = true;
	}

	function saveDesc() {
		store.setChecklistMeta(checklist.name, descInput.trim());
		editingDesc = false;
	}

	// Reorder handlers
	function onDragStart(e: DragEvent, index: number) {
		dragFrom = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(index));
		}
	}

	function onDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOver = index;
	}

	function onDrop(e: DragEvent, toIndex: number) {
		e.preventDefault();
		if (dragFrom !== null && dragFrom !== toIndex) {
			store.moveLayer(dragFrom, toIndex);
		}
		dragFrom = null;
		dragOver = null;
	}

	function onDragEnd() {
		dragFrom = null;
		dragOver = null;
	}

	// Resize handlers
	function onResizeStart(e: MouseEvent, index: number) {
		e.preventDefault();
		e.stopPropagation();
		resizing = index;
		resizeStartX = e.clientX;
		const th = (e.target as HTMLElement).parentElement;
		resizeStartWidth = colWidths[index] ?? th?.offsetWidth ?? 180;
		window.addEventListener('mousemove', onResizeMove);
		window.addEventListener('mouseup', onResizeEnd);
	}

	function onResizeMove(e: MouseEvent) {
		if (resizing === null) return;
		const delta = e.clientX - resizeStartX;
		const newWidth = Math.max(100, resizeStartWidth + delta);
		colWidths[resizing] = newWidth;
	}

	function onResizeEnd() {
		resizing = null;
		window.removeEventListener('mousemove', onResizeMove);
		window.removeEventListener('mouseup', onResizeEnd);
	}
</script>


<div class="table-wrapper flex-1 min-h-0">
	<table class="checklist-table">
		<thead>
			<tr>
				<th class="pattern-header">Layers / Pattern Rules</th>
				{#each checklist.layers as layer, li}
					<th
						class="layer-header"
						class:drag-over={dragOver === li && dragFrom !== li}
						class:dragging={dragFrom === li}
						draggable="true"
						ondragstart={(e) => onDragStart(e, li)}
						ondragover={(e) => onDragOver(e, li)}
						ondrop={(e) => onDrop(e, li)}
						ondragend={onDragEnd}
						style={colWidths[li] ? `width: ${colWidths[li]}px` : ''}
					>
						<span class="drag-handle" title="Drag to reorder">&#x2630;</span>
						<input
							class="layer-name-input"
							value={layer.name}
							onchange={(e) => store.setLayerName(li, e.currentTarget.value)}
						/>
						{#if checklist.layers.length > 1}
							<button
								class="remove-layer-btn"
								type="button"
								title="Remove layer"
								onclick={() => store.removeLayer(li)}
							>x</button>
						{/if}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="resize-handle"
							onmousedown={(e) => onResizeStart(e, li)}
						></div>
					</th>
				{/each}
				<th class="add-layer-header">
					<button class="add-layer-btn" type="button" onclick={store.addLayer}>+ Add Layer</button>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedPatterns as pattern}
				<tr
					class="{patternDragId === pattern.id ? 'opacity-30' : ''} {patternDropTargetId === pattern.id ? (patternDropPosition === 'before' ? 'pattern-drop-before' : 'pattern-drop-after') : ''}"
					ondragover={(e) => handlePatternDragOverRow(e, pattern.id)}
					ondrop={handlePatternDrop}
				>
					<td>
						<div class="pattern-cell">
							<div class="flex items-stretch">
								{#if sortedPatterns.length > 1}
									<span
										class="drag-handle-pattern"
										draggable="true"
										ondragstart={(e) => handlePatternDragStart(e, pattern.id)}
										ondragend={clearPatternDragState}
										role="img"
										aria-label="Drag to reorder"
									>⠿</span>
								{/if}
								<div class="pattern-card">
									<div class="tooltip">
										<span class="pattern-name">{pattern.name}</span>
										<span class="tooltip-text">{dictionary.patterns[pattern.id]}</span>
									</div>
								</div>
							</div>
						</div>
					</td>
					{#each checklist.layers as layer, li}
						{@const values = layer.values[pattern.id] ?? []}
						{@const note = layer.notes[pattern.id] ?? ''}
						{@const cellPolicies = layer.policies?.[pattern.id] ?? []}
						<td class="value-cell" style={colWidths[li] ? `width: ${colWidths[li]}px` : ''}>
							<div class="cell-with-notes">
								<CellDropdown
									patternId={pattern.id}
									options={lookups[pattern.id] ?? []}
									selected={values}
									multiSelect={pattern.multiSelect}
									onchange={(v) => store.setCellValues(li, pattern.id, v)}
								/>
								<PolicyBadge
									policyIds={cellPolicies}
									{allPolicies}
									onchange={(ids) => store.setCellPolicies(li, pattern.id, ids)}
								/>
								<NotesPopover
									{note}
									onchange={(n) => store.setCellNote(li, pattern.id, n)}
								/>
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		overflow: auto;
		margin: 0 -2rem;
		padding: 0 2rem;
	}

	.pattern-header {
		min-width: 200px;
	}

	.layer-header {
		/* No `position` override — inherit `position: sticky; top: 0`
		   from app.css's `.checklist-table thead th` so layer headers
		   freeze at the top during vertical scroll. `sticky` also
		   provides a positioning context for the absolute-positioned
		   `.resize-handle` child (same as `relative` would). */
		min-width: 150px;
		cursor: grab;
		user-select: none;
	}

	.layer-header.dragging {
		opacity: 0.4;
	}

	.layer-header.drag-over {
		box-shadow: inset 3px 0 0 white;
	}

	.drag-handle {
		display: inline-block;
		margin-right: 0.375rem;
		font-size: 0.875rem;
		opacity: 0.85;
		vertical-align: middle;
		cursor: grab;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.drag-handle:hover {
		opacity: 1;
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
		position: absolute;
		top: 2px;
		right: 10px;
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 50%;
		border: none;
		background: rgba(255, 255, 255, 0.2);
		color: white;
		font-size: 0.625rem;
		cursor: pointer;
		line-height: 1;
		padding: 0;
	}

	.remove-layer-btn:hover {
		background: rgba(255, 0, 0, 0.6);
	}

	.resize-handle {
		position: absolute;
		top: 0;
		right: 0;
		width: 5px;
		height: 100%;
		cursor: col-resize;
		background: transparent;
	}

	.resize-handle:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	th {
		position: relative;
	}

	.add-layer-header {
		min-width: auto;
		padding: 0.5rem !important;
		background: transparent;
		border: none;
		vertical-align: middle;
	}

	.add-layer-btn {
		white-space: nowrap;
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: white;
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
	}

	.add-layer-btn:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.pattern-cell {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0;
	}

	.drag-handle-pattern {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		flex-shrink: 0;
		font-size: 0.625rem;
		color: #94a3b8;
		cursor: grab;
		user-select: none;
	}

	.drag-handle-pattern:hover {
		color: #475569;
	}

	.pattern-card {
		flex: 1;
		min-width: 0;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid #e2e8f0;
		background: white;
		transition: border-color 0.15s, background 0.15s;
	}

	.pattern-card:hover {
		border-color: #06b6d4;
		background: rgba(6, 182, 212, 0.04);
	}

	:global(.pattern-drop-before) {
		border-top: 2px solid #0891b2 !important;
	}

	:global(.pattern-drop-after) {
		border-bottom: 2px solid #0891b2 !important;
	}

	:global(.opacity-30) {
		opacity: 0.3;
	}

	.value-cell {
		padding: 0.25rem !important;
	}

	.cell-with-notes {
		display: flex;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.cell-with-notes :global(.cell-dropdown) {
		flex: 1;
	}

</style>
