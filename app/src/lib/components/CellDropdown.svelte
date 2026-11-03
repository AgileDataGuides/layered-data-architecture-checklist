<script lang="ts">
	import { dictionary } from '$lib/data';

	let {
		patternId,
		options,
		selected,
		multiSelect = true,
		onchange
	}: {
		patternId: string;
		options: string[];
		selected: string[];
		multiSelect: boolean;
		onchange: (values: string[]) => void;
	} = $props();

	let open = $state(false);
	let search = $state('');

	let filtered = $derived(
		search
			? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
			: options
	);

	function toggle(value: string) {
		let next: string[];
		if (multiSelect) {
			next = selected.includes(value)
				? selected.filter((v) => v !== value)
				: [...selected, value];
		} else {
			next = selected.includes(value) ? [] : [value];
		}
		onchange(next);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="cell-dropdown" onkeydown={handleKeydown}>
	<button class="trigger" onclick={() => (open = !open)} type="button">
		{#if selected.length > 0}
			<span class="cell-values">
				{#each selected as value}
					<span class="chip">{value}</span>
				{/each}
			</span>
		{:else}
			<span class="empty-cell">Select...</span>
		{/if}
	</button>

	{#if open}
		<div class="dropdown-backdrop" onclick={() => (open = false)} role="presentation"></div>
		<div class="dropdown-panel">
			<input
				class="search-input"
				type="text"
				placeholder="Filter..."
				bind:value={search}
			/>
			<div class="options-list">
				{#each filtered as option}
					{@const isSelected = selected.includes(option)}
					<label class="option" class:is-selected={isSelected}>
						<input
							type={multiSelect ? 'checkbox' : 'radio'}
							checked={isSelected}
							onchange={() => toggle(option)}
						/>
						<div class="option-content">
							<span class="option-label">{option}</span>
							{#if dictionary.values[patternId]?.[option]}
								<span class="option-desc">{dictionary.values[patternId][option]}</span>
							{/if}
						</div>
					</label>
				{/each}
				{#if filtered.length === 0}
					<div class="no-results">No matches</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.cell-dropdown {
		position: relative;
	}

	.trigger {
		display: block;
		width: 100%;
		min-height: 2rem;
		padding: 0.25rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;
		font: inherit;
	}

	.trigger:hover {
		border-color: var(--color-primary);
		background: var(--color-primary-light);
	}

	.dropdown-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	.dropdown-panel {
		position: absolute;
		z-index: 51;
		top: 100%;
		left: 0;
		min-width: 280px;
		max-height: 320px;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
	}

	.search-input {
		padding: 0.5rem 0.75rem;
		border: none;
		border-bottom: 1px solid var(--color-border);
		font: inherit;
		font-size: 0.8125rem;
		outline: none;
	}

	.options-list {
		overflow-y: auto;
		flex: 1;
	}

	.option {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		cursor: pointer;
		font-size: 0.8125rem;
		border-bottom: 1px solid var(--color-surface);
	}

	.option:hover {
		background: var(--color-surface);
	}

	.option.is-selected {
		background: var(--color-primary-light);
	}

	.option input {
		margin-top: 0.25rem;
		flex-shrink: 0;
	}

	.option-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.option-label {
		font-weight: 600;
	}

	.option-desc {
		color: var(--color-text-muted);
		font-size: 0.6875rem;
		line-height: 1.4;
	}

	.no-results {
		padding: 0.75rem;
		color: var(--color-text-muted);
		font-size: 0.8125rem;
		text-align: center;
	}
</style>
