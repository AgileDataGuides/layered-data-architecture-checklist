/**
 * StandaloneChecklistAdapter — a reactive DataAdapter for the standalone checklist app.
 *
 * Wraps ChecklistJsonAdapter and exposes reactive `nodes` and `links` state
 * (Svelte 5 runes). After every mutation, the reactive arrays are refreshed
 * from the underlying adapter so that UI components re-render.
 *
 * Also provides sync helpers to load from / persist back to the ChecklistStore format.
 */
import type { DataAdapter, ContextNode, ContextLink } from '$lib/cp-shared';
import { ChecklistJsonAdapter } from './json-adapter';
import type { Checklist, Policy } from '$lib/types';

export class StandaloneChecklistAdapter implements DataAdapter {
	private inner = new ChecklistJsonAdapter();

	// Reactive state — consumed by components via $state
	nodes = $state<ContextNode[]>([]);
	links = $state<ContextLink[]>([]);

	// Callback invoked after every mutation so the page can persist back to the store
	onMutate?: () => void;

	private async refresh() {
		const data = await this.inner.exportAll();
		this.nodes = data.nodes;
		this.links = data.links;
		this.onMutate?.();
	}

	/** Load checklist data into the adapter */
	loadFromChecklist(checklist: Checklist, policies: Policy[] = []) {
		this.inner.loadFromChecklist(checklist, policies);
		// Synchronously refresh from inner (exportAll is sync in the JSON adapter)
		this.inner.exportAll().then((data) => {
			this.nodes = data.nodes;
			this.links = data.links;
		});
	}

	/** Reconstruct checklist format from current adapter state */
	toChecklist(): { checklist: Checklist; policies: Policy[] } {
		return this.inner.toChecklist();
	}

	// --- DataAdapter interface ---

	async getNodes(filter?: { label?: string }): Promise<ContextNode[]> {
		return this.inner.getNodes(filter);
	}

	async getNode(id: string): Promise<ContextNode | null> {
		return this.inner.getNode(id);
	}

	async createNode(node: Omit<ContextNode, 'id' | 'created_at' | 'updated_at'>): Promise<ContextNode> {
		const result = await this.inner.createNode(node);
		await this.refresh();
		return result;
	}

	async updateNode(id: string, updates: Partial<ContextNode>): Promise<ContextNode> {
		const result = await this.inner.updateNode(id, updates);
		await this.refresh();
		return result;
	}

	async deleteNode(id: string): Promise<void> {
		await this.inner.deleteNode(id);
		await this.refresh();
	}

	async getLinks(filter?: { label?: string; source_id?: string; destination_id?: string }): Promise<ContextLink[]> {
		return this.inner.getLinks(filter);
	}

	async createLink(link: Omit<ContextLink, 'id' | 'created_at' | 'updated_at'>): Promise<ContextLink> {
		const result = await this.inner.createLink(link);
		await this.refresh();
		return result;
	}

	async deleteLink(id: string): Promise<void> {
		await this.inner.deleteLink(id);
		await this.refresh();
	}

	async exportAll(): Promise<{ nodes: ContextNode[]; links: ContextLink[] }> {
		return this.inner.exportAll();
	}

	async importAll(data: { nodes: ContextNode[]; links: ContextLink[] }): Promise<void> {
		await this.inner.importAll(data);
		await this.refresh();
	}
}
