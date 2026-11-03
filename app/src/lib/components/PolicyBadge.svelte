<script lang="ts">
	import type { Policy } from '$lib/types';

	let {
		policyIds,
		allPolicies,
		onchange
	}: {
		policyIds: string[];
		allPolicies: Policy[];
		onchange: (policyIds: string[]) => void;
	} = $props();

	let open = $state(false);
	let search = $state('');

	let filtered = $derived(
		allPolicies.filter((p) =>
			!search || p.name.toLowerCase().includes(search.toLowerCase()) ||
			p.category.toLowerCase().includes(search.toLowerCase())
		)
	);

	function toggle(policyId: string) {
		const current = [...policyIds];
		const idx = current.indexOf(policyId);
		if (idx >= 0) {
			current.splice(idx, 1);
		} else {
			current.push(policyId);
		}
		onchange(current);
	}

	const count = $derived(policyIds.length);
</script>

<span class="policy-trigger">
	<button
		class="policy-btn"
		class:has-policies={count > 0}
		type="button"
		title={count > 0 ? `${count} ${count === 1 ? 'policy' : 'policies'} attached` : 'Attach policies'}
		onclick={() => { search = ''; open = !open; }}
	>
		{#if count > 0}
			<span class="shield">&#x1F6E1;</span><span class="count">{count}</span>
		{:else}
			<span class="shield">&#x1F6E1;</span>
		{/if}
	</button>

	{#if open}
		<div class="policy-backdrop" onclick={() => (open = false)} role="presentation"></div>
		<div class="policy-panel">
			{#if allPolicies.length === 0}
				<p class="empty">No policies defined yet. Create them in the Policies tab.</p>
			{:else}
				<input
					type="text"
					class="policy-search"
					placeholder="Filter policies..."
					bind:value={search}
				/>
				<div class="policy-list">
					{#each filtered as policy}
						<label class="policy-option">
							<input
								type="checkbox"
								checked={policyIds.includes(policy.id)}
								onchange={() => toggle(policy.id)}
							/>
							<div class="policy-info">
								<span class="policy-name">{policy.name}</span>
								<span class="policy-cat">{policy.category}</span>
								{#if policy.description}
									<span class="policy-desc">{policy.description}</span>
								{/if}
							</div>
						</label>
					{/each}
					{#if filtered.length === 0}
						<p class="empty">No matching policies.</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</span>

<style>
	.policy-trigger {
		position: relative;
		display: inline-block;
	}

	.policy-btn {
		width: auto;
		min-width: 1.25rem;
		height: 1.25rem;
		border-radius: 10px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.5625rem;
		cursor: pointer;
		line-height: 1;
		padding: 0 0.2rem;
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
	}

	.shield {
		font-size: 0.5625rem;
	}

	.count {
		font-size: 0.5625rem;
		font-weight: 600;
	}

	.policy-btn.has-policies {
		background: #d1ecf1;
		border-color: #17a2b8;
		color: #0c5460;
	}

	.policy-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	.policy-panel {
		position: absolute;
		z-index: 51;
		top: 100%;
		left: 0;
		width: 320px;
		max-height: 320px;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
	}

	.policy-search {
		width: 100%;
		font: inherit;
		font-size: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		padding: 0.3rem 0.5rem;
		margin-bottom: 0.375rem;
	}

	.policy-list {
		overflow-y: auto;
		flex: 1;
	}

	.policy-option {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		padding: 0.3rem 0.25rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.policy-option:hover {
		background: var(--color-surface);
	}

	.policy-option input[type='checkbox'] {
		margin-top: 0.125rem;
		flex-shrink: 0;
	}

	.policy-info {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 0;
	}

	.policy-name {
		font-weight: 500;
		font-size: 0.75rem;
	}

	.policy-desc {
		font-size: 0.6875rem;
		color: var(--color-text-muted);
		line-height: 1.3;
	}

	.policy-cat {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		background: var(--color-surface);
		border-radius: 3px;
		padding: 0.0625rem 0.25rem;
		display: inline-block;
		width: fit-content;
	}

	.empty {
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-style: italic;
		padding: 0.5rem;
		text-align: center;
	}
</style>
