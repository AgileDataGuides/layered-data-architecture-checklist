<script lang="ts">
	import { setContext } from 'svelte';
	import { createChecklistStore } from '$lib/stores/checklist.svelte';
	import { StandaloneChecklistAdapter } from '$lib/adapters/standalone-adapter.svelte';
	import { contextPlaneToChecklist } from '$lib/converters/context-plane';
	import type { Checklist } from '$lib/types';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ChecklistTable from '$lib/components/ChecklistTable.svelte';

	import AdminPanel from '$lib/components/AdminPanel.svelte';
	import PoliciesPanel from '$lib/components/PoliciesPanel.svelte';
	import Instructions from '$lib/components/Instructions.svelte';
	import StepsView from '$lib/components/canvas/StepsView.svelte';
	import { effectiveData } from '$lib/data/effective.svelte';
	import { sortByOrder, stepsTabLabel, type ChecklistView, type StepActions } from '$lib/model/steps-view';

	// Create the store with default localStorage persistence
	const store = createChecklistStore();
	setContext('checklistStore', store);

	// Create the reactive DataAdapter and set it in context
	const adapter = new StandaloneChecklistAdapter();
	setContext('dataAdapter', adapter);

	// Load current checklist into the adapter
	adapter.loadFromChecklist(store.getChecklist(), store.getPolicies());

	// When the adapter mutates, persist back to the checklist store
	adapter.onMutate = () => {
		const { checklist, policies } = adapter.toChecklist();
		store.loadChecklist(checklist);
		if (policies.length > 0) {
			store.setPolicies(policies);
		}
	};

	// Sync adapter when store's checklist changes (e.g., user switches architecture)
	let lastChecklistId = $state(store.getChecklist().id);

	function syncAdapterFromStore() {
		const current = store.getChecklist();
		if (current.id !== lastChecklistId) {
			lastChecklistId = current.id;
			adapter.loadFromChecklist(current, store.getPolicies());
		}
	}

	// The Steps tab is the way in, so it is the first tab and the app opens on it
	let activeTab = $state<'checklist' | 'steps' | 'policies' | 'admin' | 'instructions'>('steps');

	// The Steps tab reads and writes the same store as the Checklist grid, with
	// the same patterns, values and descriptions, Manage Patterns edits included.
	// A layer's key is its place in the list, because two layers can share an id.
	const stepsView = $derived<ChecklistView>({
		// An imported file can leave out a layer's values or notes
		layers: store.getChecklist().layers.map((l, i) => ({ key: String(i), name: l.name, values: l.values ?? {}, notes: l.notes ?? {} })),
		patterns: sortByOrder(effectiveData.visiblePatterns, store.getChecklist().patternOrder),
		lookups: effectiveData.lookups,
		dictionary: effectiveData.dictionary
	});

	const stepActions: StepActions = {
		setValues: (key, patternId, values) => store.setCellValues(Number(key), patternId, values),
		setNote: (key, patternId, note) => store.setCellNote(Number(key), patternId, note),
		addLayer: (name) => {
			store.addLayer();
			store.setLayerName(store.getChecklist().layers.length - 1, name);
		},
		renameLayer: (key, name) => store.setLayerName(Number(key), name),
		moveLayer: (key, toIndex) => store.moveLayer(Number(key), toIndex),
		removeLayer: (key) => store.removeLayer(Number(key))
	};

	// Model management (header)
	let showSwitcher = $state(false);
	let showNew = $state(false);
	let newName = $state('');

	function handleClickOutsideSwitcher(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-model-switcher]')) showSwitcher = false;
	}

	function handleNew() {
		const name = newName.trim();
		if (!name) return;
		store.newArchitecture(name);
		newName = '';
		showNew = false;
	}

	function handleDelete() {
		const current = store.getChecklist();
		if (!confirm(`Delete "${current.name}"?`)) return;
		store.deleteArchitecture(current.id);
	}

	/**
	 * Import a Checklist file as a NEW checklist (never overwrites the current one).
	 * store.loadChecklist uniquifies the imported ID against existing IDs and
	 * adds it to the saved map, so the existing checklist stays in the list
	 * and the new one lands alongside it.
	 *
	 * Accepts native Checklist JSON ({ id, layers, ... }) or a Context Plane
	 * graph export ({ nodes, links }) — the latter is converted via
	 * contextPlaneToChecklist before import.
	 */
	function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			if (file.size > 5 * 1024 * 1024) {
				alert('File too large (max 5MB)');
				return;
			}
			try {
				const text = await file.text();
				const data = JSON.parse(text);
				if (data.nodes && data.links) {
					const { checklist } = contextPlaneToChecklist(data);
					store.loadChecklist(checklist);
				} else if (data.layers && Array.isArray(data.layers)) {
					store.loadChecklist(data as Checklist);
				} else {
					alert('Invalid file — expected checklist JSON or Context Plane graph JSON');
				}
			} catch {
				alert('Could not parse JSON file');
			}
		};
		input.click();
	}
</script>

<svelte:window onclick={handleClickOutsideSwitcher} />

<!-- App Header (dark) -->
<header class="bg-slate-900 text-white px-6 py-3 shrink-0">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-lg font-bold tracking-tight">Layered Data Architecture Checklist</h1>
			<p class="text-xs text-slate-400 mt-0.5">Document and compare data architecture layer patterns</p>
		</div>
		<div class="flex items-center gap-2" data-model-switcher>
			<div class="relative">
				<button
					onclick={() => (showSwitcher = !showSwitcher)}
					class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-800 text-sm"
				>
					<span class="text-slate-300">{store.getChecklist().name}</span>
					<svg class="w-3.5 h-3.5 text-slate-400 transition-transform {showSwitcher ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				{#if showSwitcher}
					<div class="absolute top-full right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 min-w-[200px]">
						{#each store.getSavedList() as item}
							<button
								onclick={() => { store.switchTo(item.id); showSwitcher = false; syncAdapterFromStore(); }}
								class="w-full text-left px-4 py-2 text-sm transition-colors {item.id === store.getChecklist().id ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}"
							>{item.name}</button>
						{/each}
					</div>
				{/if}
			</div>
			{#if showNew}
				<input type="text" placeholder="Checklist name..." bind:value={newName} onkeydown={(e) => { if (e.key === 'Enter') handleNew(); if (e.key === 'Escape') { showNew = false; newName = ''; } }} class="px-3 py-1.5 border border-slate-600 bg-slate-800 text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-40 placeholder-slate-500" />
				<button onclick={handleNew} class="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">Create</button>
				<button onclick={() => { showNew = false; newName = ''; }} class="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
			{:else}
				<button onclick={() => (showNew = true)} class="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 border border-slate-600 hover:bg-slate-800 transition-colors">New Checklist</button>
				<!-- Import sits next to New Checklist because Import IS a creation
				     action — it always lands as a brand-new checklist alongside
				     the existing ones, never overwriting the current one. -->
				<button
					onclick={handleImport}
					class="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 border border-slate-600 hover:bg-slate-800 transition-colors"
					title="Import a Checklist JSON file as a new checklist"
				>Import</button>
			{/if}
			<button onclick={handleDelete} class="px-3 py-1.5 text-sm font-medium rounded-lg text-red-400 border border-slate-600 hover:bg-slate-800 transition-colors">Delete</button>
		</div>
	</div>
</header>

<!-- Toolbar -->
<div class="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
	<Toolbar />
</div>

<!-- Tabs -->
<div class="flex gap-0 px-4 border-b border-slate-200">
	<button
		class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'steps' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
		onclick={() => (activeTab = 'steps')}
	>{stepsTabLabel(stepsView.patterns)}</button>
	<button
		class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'checklist' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
		onclick={() => { activeTab = 'checklist'; syncAdapterFromStore(); }}
	>Checklist</button>
	<button
		class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'admin' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
		onclick={() => (activeTab = 'admin')}
	>Manage Patterns</button>
	<button
		class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'policies' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
		onclick={() => (activeTab = 'policies')}
	>Manage Policies</button>
	<button
		class="flex items-center px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors {activeTab === 'instructions' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'}"
		onclick={() => (activeTab = 'instructions')}
	>Instructions</button>
</div>

{#if activeTab === 'checklist'}
	<div class="flex-1 overflow-hidden px-6 py-4 flex flex-col min-h-0">
		<ChecklistTable />
	</div>
{:else if activeTab === 'steps'}
	<div class="flex-1 overflow-hidden flex flex-col min-h-0">
		<StepsView view={stepsView} actions={stepActions} />
	</div>
{:else if activeTab === 'policies'}
	<div class="flex-1 overflow-y-auto px-6 py-4">
		<PoliciesPanel />
	</div>
{:else if activeTab === 'admin'}
	<div class="flex-1 overflow-y-auto px-6 py-4">
		<AdminPanel />
	</div>
{:else}
	<div class="flex-1 overflow-y-auto px-6 py-4">
		<Instructions />
	</div>
{/if}
