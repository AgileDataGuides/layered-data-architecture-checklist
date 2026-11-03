<script lang="ts">
	let {
		note,
		onchange
	}: {
		note: string;
		onchange: (note: string) => void;
	} = $props();

	let open = $state(false);
	let draft = $state('');

	function save() {
		onchange(draft);
		open = false;
	}
</script>

<span class="notes-trigger">
	<button
		class="notes-btn"
		class:has-note={!!note}
		type="button"
		title={note || 'Add note'}
		onclick={() => { draft = note; open = !open; }}
	>
		{note ? '\u270E' : '\u270E'}
	</button>

	{#if open}
		<div class="notes-backdrop" onclick={() => (open = false)} role="presentation"></div>
		<div class="notes-panel">
			<textarea
				bind:value={draft}
				placeholder="Add a note..."
				rows="3"
			></textarea>
			<div class="notes-actions">
				<button type="button" onclick={save}>Save</button>
				<button type="button" class="secondary" onclick={() => (open = false)}>Cancel</button>
			</div>
		</div>
	{/if}
</span>

<style>
	.notes-trigger {
		position: relative;
		display: inline-block;
	}

	.notes-btn {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.625rem;
		cursor: pointer;
		line-height: 1;
		padding: 0;
		flex-shrink: 0;
	}

	.notes-btn.has-note {
		background: #fff3cd;
		border-color: #ffc107;
		color: #856404;
	}

	.notes-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
	}

	.notes-panel {
		position: absolute;
		z-index: 51;
		top: 100%;
		left: 0;
		width: 240px;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
		padding: 0.5rem;
	}

	textarea {
		width: 100%;
		font: inherit;
		font-size: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		padding: 0.375rem;
		resize: vertical;
	}

	.notes-actions {
		display: flex;
		gap: 0.375rem;
		margin-top: 0.375rem;
	}

	.notes-actions button {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		border-radius: 4px;
		border: 1px solid var(--color-border);
		cursor: pointer;
		background: var(--color-primary);
		color: white;
	}

	.notes-actions button.secondary {
		background: white;
		color: var(--color-text);
	}
</style>
