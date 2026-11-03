<script lang="ts">
	import { getContext } from 'svelte';
	import type { Policy } from '$lib/types';
	import type { ChecklistStore } from '$lib/stores/checklist.svelte';

	const store = getContext<ChecklistStore>('checklistStore');

	let policies = $derived(store.getPolicies());
	let categories = $derived(store.getCategories());

	let filterCategory = $state(categories[0] ?? '');
	let search = $state('');
	let showCategories = $state(false);
	let switcherOpen = $state(false);

	// Policy type descriptions — persisted in localStorage
	const POLICY_TYPE_DESC_KEY = 'layer-checklist-policy-type-descs';
	let policyTypeDescs = $state<Record<string, string>>(loadDescs());
	let editingTypeDesc = $state(false);
	let editTypeDescValue = $state('');

	function loadDescs(): Record<string, string> {
		if (typeof window === 'undefined') return {};
		const raw = localStorage.getItem(POLICY_TYPE_DESC_KEY);
		if (raw) {
			try { return JSON.parse(raw); } catch { /* fall through */ }
		}
		return {};
	}

	function saveDescs() {
		localStorage.setItem(POLICY_TYPE_DESC_KEY, JSON.stringify(policyTypeDescs));
	}

	// Add form
	let newName = $state('');
	let newCategory = $state('');
	let newDescription = $state('');
	let newRule = $state('');
	let newCategoryName = $state('');

	// Edit state
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editCategory = $state('');
	let editDescription = $state('');
	let editRule = $state('');

	// Highlight state for search navigation
	let highlightId = $state<string | null>(null);

	let filteredByCategory = $derived(
		filterCategory
			? policies.filter((p) => p.category === filterCategory)
			: policies
	);

	// Global search across all policy types
	type SearchResult = { policy: Policy; };
	let globalSearchResults = $derived<SearchResult[]>(
		search
			? policies.filter((p) => {
					const q = search.toLowerCase();
					return (
						p.name.toLowerCase().includes(q) ||
						p.description.toLowerCase().includes(q) ||
						p.rule.toLowerCase().includes(q) ||
						p.category.toLowerCase().includes(q)
					);
				}).map((p) => ({ policy: p }))
			: []
	);

	function navigateToPolicy(policy: Policy) {
		filterCategory = policy.category;
		search = '';
		highlightId = policy.id;
		requestAnimationFrame(() => {
			const el = document.querySelector(`[data-policy-id="${CSS.escape(policy.id)}"]`);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center' });
				setTimeout(() => { highlightId = null; }, 2000);
			}
		});
	}

	function handleClickOutsideSwitcher(e: MouseEvent) {
		if (switcherOpen && !(e.target as HTMLElement)?.closest('[data-policy-type-switcher]')) {
			switcherOpen = false;
		}
	}

	function handleAdd() {
		const name = newName.trim();
		if (!name) return;
		store.addPolicy({
			name,
			category: newCategory || filterCategory || categories[0] || 'General',
			description: newDescription.trim() || '',
			rule: newRule.trim() || ''
		});
		newName = '';
		newCategory = '';
		newDescription = '';
		newRule = '';
	}

	function startEdit(p: Policy) {
		editingId = p.id;
		editName = p.name;
		editCategory = p.category;
		editDescription = p.description;
		editRule = p.rule;
	}

	function saveEdit() {
		if (!editingId) return;
		store.updatePolicy(editingId, {
			name: editName,
			category: editCategory,
			description: editDescription,
			rule: editRule
		});
		editingId = null;
	}

	function cancelEdit() {
		editingId = null;
	}

	function handleAddCategory() {
		const name = newCategoryName.trim();
		if (!name) return;
		store.addCategory(name);
		newCategoryName = '';
	}

	async function saveAll() {
		try {
			const res = await fetch('/api/save-policies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ categories, policies })
			});
			if (!res.ok) {
				const err = await res.json();
				alert(`Save failed: ${err.error || res.statusText}`);
			}
		} catch {
			exportAll();
		}
	}

	function exportAll() {
		const data = { version: '1.0', categories, policies, policyTypeDescs };
		download(JSON.stringify(data, null, 2), `checklist-policies-${exportTimestamp()}.json`, 'application/json');
	}

	function importFile() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const data = JSON.parse(await file.text());
				if (Array.isArray(data.policies)) {
					store.setPolicies(data.policies);
					if (Array.isArray(data.categories)) store.setCategories(data.categories);
					if (data.policyTypeDescs && typeof data.policyTypeDescs === 'object') {
						policyTypeDescs = data.policyTypeDescs;
						saveDescs();
					}
				} else {
					alert('Invalid policies file — expected { policies, categories }');
				}
			} catch {
				alert('Could not parse JSON file');
			}
		};
		input.click();
	}

	function handleReset() {
		if (!confirm('Reset all policies and categories to built-in defaults?')) return;
		store.resetPolicies();
		policyTypeDescs = {};
		localStorage.removeItem(POLICY_TYPE_DESC_KEY);
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

<div class="policies">
	<div class="flex flex-wrap items-center justify-between gap-3 mb-4 rounded-lg px-4 py-3" style="background: var(--color-surface); border: 1px solid var(--color-border);">
		<div class="flex items-center gap-2 flex-wrap">
			<div class="relative" data-policy-type-switcher>
				<button type="button" class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100"
					onclick={() => { switcherOpen = !switcherOpen; }}>
					<div class="text-left">
						<div class="text-sm font-semibold text-slate-800 leading-tight">{filterCategory || 'All Policy Types'}</div>
						<div class="text-[10px] text-slate-400 leading-tight">Switch Policy Type</div>
					</div>
					<svg class="w-4 h-4 text-slate-400 transition-transform {switcherOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				{#if switcherOpen}
					<div class="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1 min-w-[200px] max-h-[400px] overflow-y-auto">
						<button type="button" class="w-full text-left px-4 py-2 text-sm transition-colors {filterCategory === '' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}"
							onclick={() => { filterCategory = ''; search = ''; switcherOpen = false; }}>
							All Policy Types
						</button>
						{#each categories as cat}
							<button type="button" class="w-full text-left px-4 py-2 text-sm transition-colors {filterCategory === cat ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}"
								onclick={() => { filterCategory = cat; search = ''; switcherOpen = false; }}>
								{cat}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<input type="text" placeholder="Search policies..." bind:value={search} class="text-sm px-3 py-1.5 border border-slate-300 rounded-lg bg-white min-w-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-cyan-700 border border-cyan-300 hover:bg-cyan-50 transition-colors" onclick={saveAll}>Save</button>
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-red-500 border border-red-300 hover:bg-red-50 transition-colors" onclick={handleReset}>Reset</button>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors" onclick={() => (showCategories = !showCategories)}>
				{showCategories ? 'Hide' : 'Manage'} Policy Types
			</button>
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors" onclick={exportAll}>Export Policies</button>
			<button type="button" class="px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 transition-colors" onclick={importFile}>Import Policies</button>
		</div>
		{#if filterCategory}
			<div class="w-full border-t pt-2 -mb-1" style="border-color: var(--color-border);">
				{#if editingTypeDesc}
					<textarea
						bind:value={editTypeDescValue}
						rows="2"
						class="w-full text-sm text-slate-600 px-2 py-1 border border-blue-400 rounded outline-none resize-none"
						onkeydown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); policyTypeDescs[filterCategory] = editTypeDescValue.trim(); saveDescs(); editingTypeDesc = false; } if (e.key === 'Escape') { editingTypeDesc = false; } }}
						onblur={() => { policyTypeDescs[filterCategory] = editTypeDescValue.trim(); saveDescs(); editingTypeDesc = false; }}
					></textarea>
				{:else}
					<p
						class="text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors"
						onclick={() => { editTypeDescValue = policyTypeDescs[filterCategory] ?? ''; editingTypeDesc = true; }}
						title="Click to edit description"
					>{policyTypeDescs[filterCategory] || 'Click to add a description for this policy type'}</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if showCategories}
		<div class="categories-section">
			<h3>Policy Types</h3>
			<div class="cat-list">
				{#each categories as cat}
					<span class="cat-chip">
						{cat}
						<button type="button" class="cat-remove" onclick={() => store.removeCategory(cat)}>&times;</button>
					</span>
				{/each}
			</div>
			<div class="cat-add">
				<input
					type="text"
					placeholder="New policy type..."
					bind:value={newCategoryName}
					onkeydown={(e) => e.key === 'Enter' && handleAddCategory()}
				/>
				<button type="button" onclick={handleAddCategory}>Add</button>
			</div>
		</div>
	{/if}

	{#if search}
		<div class="policy-list">
			<h3>Search results for "{search}" <span class="text-sm font-normal text-slate-400">({globalSearchResults.length} match{globalSearchResults.length !== 1 ? 'es' : ''})</span></h3>
			{#each globalSearchResults as result}
				<div class="policy-row cursor-pointer hover:bg-slate-50" onclick={() => navigateToPolicy(result.policy)}>
					<div class="policy-display">
						<div class="policy-header">
							<span class="policy-name">{result.policy.name}</span>
							<span class="policy-cat">{result.policy.category}</span>
						</div>
						{#if result.policy.description}
							<p class="policy-desc">{result.policy.description}</p>
						{/if}
						{#if result.policy.rule}
							<p class="policy-rule">{result.policy.rule}</p>
						{/if}
					</div>
				</div>
			{/each}
			{#if globalSearchResults.length === 0}
				<p class="empty">No matching policies across any policy type.</p>
			{/if}
		</div>
	{:else}
		<div class="add-section">
			<h3>Add Policy</h3>
			<div class="add-form">
				<div class="form-row">
					<input type="text" placeholder="Policy name" bind:value={newName} class="name-field" />
					<select bind:value={newCategory}>
						<option value="">Policy Type...</option>
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>
				<textarea placeholder="Description..." bind:value={newDescription} rows="2"></textarea>
				<textarea placeholder="Rule (e.g. All columns MUST use snake_case naming)" bind:value={newRule} rows="2"></textarea>
				<button type="button" class="add-btn" onclick={handleAdd}>Add Policy</button>
			</div>
		</div>

		<div class="policy-list">
			<h3>Policies ({filteredByCategory.length})</h3>
			{#each filteredByCategory as policy}
				<div class="policy-row {highlightId === policy.id ? 'highlight' : ''}" data-policy-id={policy.id}>
					{#if editingId === policy.id}
						<div class="policy-edit">
							<div class="form-row">
								<input type="text" bind:value={editName} class="name-field" />
								<select bind:value={editCategory}>
									{#each categories as cat}
										<option value={cat}>{cat}</option>
									{/each}
								</select>
							</div>
							<textarea bind:value={editDescription} rows="2"></textarea>
							<textarea bind:value={editRule} rows="2"></textarea>
							<div class="edit-actions">
								<button type="button" onclick={saveEdit}>Save</button>
								<button type="button" class="secondary" onclick={cancelEdit}>Cancel</button>
							</div>
						</div>
					{:else}
						<div class="policy-display">
							<div class="policy-header">
								<span class="policy-name">{policy.name}</span>
								<span class="policy-cat">{policy.category}</span>
							</div>
							{#if policy.description}
								<p class="policy-desc">{policy.description}</p>
							{/if}
							{#if policy.rule}
								<p class="policy-rule">{policy.rule}</p>
							{/if}
						</div>
						<div class="policy-actions">
							<button type="button" class="small" onclick={() => startEdit(policy)}>Edit</button>
							<button type="button" class="small danger" onclick={() => store.removePolicy(policy.id)}>Remove</button>
						</div>
					{/if}
				</div>
			{/each}
			{#if filteredByCategory.length === 0}
				<p class="empty">No policies found.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.policies {
		max-width: 100%;
	}

	/* Categories section */
	.categories-section {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.categories-section h3 {
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.cat-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 0.5rem;
	}

	.cat-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}

	.cat-remove {
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		padding: 0;
		line-height: 1;
	}

	.cat-remove:hover {
		color: #c00;
	}

	.cat-add {
		display: flex;
		gap: 0.375rem;
	}

	.cat-add input {
		font: inherit;
		font-size: 0.8125rem;
		padding: 0.3rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		width: 180px;
	}

	.cat-add button {
		padding: 0.3rem 0.75rem;
		font-size: 0.8125rem;
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		background: var(--color-primary);
		color: white;
		cursor: pointer;
		font-family: inherit;
	}

	/* Add section */
	.add-section {
		margin-bottom: 1rem;
	}

	.add-section h3 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.name-field {
		flex: 1;
		min-width: 200px;
	}

	.add-form input,
	.add-form select,
	.add-form textarea {
		font: inherit;
		font-size: 0.8125rem;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}

	.add-form select {
		min-width: 150px;
	}

	.add-form textarea {
		resize: vertical;
	}

	.add-btn {
		align-self: flex-start;
		padding: 0.375rem 1rem;
		font-size: 0.8125rem;
		border: 1px solid var(--color-primary);
		border-radius: 4px;
		background: var(--color-primary);
		color: white;
		cursor: pointer;
		font-family: inherit;
	}

	/* Policy list */
	.policy-list h3 {
		font-size: 1rem;
		margin-bottom: 0.75rem;
	}

	.policy-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-bottom: none;
		transition: background-color 0.3s ease;
	}

	.policy-row:first-of-type {
		border-radius: 6px 6px 0 0;
	}

	.policy-row:last-of-type {
		border-bottom: 1px solid var(--color-border);
		border-radius: 0 0 6px 6px;
	}

	.policy-row:only-of-type {
		border-radius: 6px;
		border-bottom: 1px solid var(--color-border);
	}

	.policy-row.highlight {
		background-color: #eff6ff;
		border-color: #93c5fd;
	}

	.policy-display {
		flex: 1;
		min-width: 0;
	}

	.policy-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.policy-name {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.policy-cat {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.0625rem 0.375rem;
	}

	.policy-desc {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		line-height: 1.4;
		margin: 0;
	}

	.policy-rule {
		font-size: 0.75rem;
		line-height: 1.4;
		margin: 0.25rem 0 0;
		padding: 0.25rem 0.5rem;
		background: var(--color-surface);
		border-left: 3px solid var(--color-primary);
		border-radius: 0 4px 4px 0;
		font-style: italic;
	}

	.policy-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.policy-edit {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
	}

	.policy-edit input,
	.policy-edit select,
	.policy-edit textarea {
		font: inherit;
		font-size: 0.8125rem;
		padding: 0.375rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
	}

	.policy-edit textarea {
		resize: vertical;
	}

	.edit-actions {
		display: flex;
		gap: 0.25rem;
	}

	.edit-actions button {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		cursor: pointer;
		background: var(--color-primary);
		color: white;
		font-family: inherit;
	}

	.edit-actions button.secondary {
		background: white;
		color: var(--color-text);
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
</style>
