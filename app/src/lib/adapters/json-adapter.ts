import type { DataAdapter, ContextNode, ContextLink } from '$lib/cp-shared';
import type { Checklist, Layer, Policy } from '$lib/types';

function createId(): string {
	const rand = typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID().slice(0, 8)
		: Math.random().toString(36).slice(2, 10);
	return `node-${rand}`;
}

function now(): string {
	return new Date().toISOString();
}

/**
 * ChecklistJsonAdapter — implements DataAdapter by storing checklist data
 * as ContextNode/ContextLink in memory and persisting to JSON files via
 * SvelteKit API routes.
 *
 * Node types:
 * - checklist_architecture: one per architecture
 * - checklist_layer: one per layer (properties: { order, values, notes, policies })
 * - checklist_policy: one per policy (properties: { category, rule })
 *
 * Link types:
 * - has_layer: architecture → layer
 * - governed_by_policy: layer → policy
 */
export class ChecklistJsonAdapter implements DataAdapter {
	private nodes: ContextNode[] = [];
	private links: ContextLink[] = [];

	// --- DataAdapter interface ---

	async getNodes(filter?: { label?: string }): Promise<ContextNode[]> {
		if (!filter?.label) return [...this.nodes];
		return this.nodes.filter((n) => n.label === filter.label);
	}

	async getNode(id: string): Promise<ContextNode | null> {
		return this.nodes.find((n) => n.id === id) ?? null;
	}

	async createNode(
		node: Omit<ContextNode, 'id' | 'created_at' | 'updated_at'>
	): Promise<ContextNode> {
		const newNode: ContextNode = {
			...node,
			id: createId(),
			created_at: now(),
			updated_at: now()
		};
		this.nodes.push(newNode);
		return newNode;
	}

	async updateNode(id: string, updates: Partial<ContextNode>): Promise<ContextNode> {
		const idx = this.nodes.findIndex((n) => n.id === id);
		if (idx === -1) throw new Error(`Node ${id} not found`);
		this.nodes[idx] = { ...this.nodes[idx], ...updates, updated_at: now() };
		return this.nodes[idx];
	}

	async deleteNode(id: string): Promise<void> {
		this.nodes = this.nodes.filter((n) => n.id !== id);
		this.links = this.links.filter((l) => l.source_id !== id && l.destination_id !== id);
	}

	async getLinks(filter?: {
		label?: string;
		source_id?: string;
		destination_id?: string;
	}): Promise<ContextLink[]> {
		let result = [...this.links];
		if (filter?.label) result = result.filter((l) => l.label === filter.label);
		if (filter?.source_id) result = result.filter((l) => l.source_id === filter.source_id);
		if (filter?.destination_id)
			result = result.filter((l) => l.destination_id === filter.destination_id);
		return result;
	}

	async createLink(
		link: Omit<ContextLink, 'id' | 'created_at' | 'updated_at'>
	): Promise<ContextLink> {
		const newLink: ContextLink = {
			...link,
			id: createId(),
			created_at: now(),
			updated_at: now()
		};
		this.links.push(newLink);
		return newLink;
	}

	async deleteLink(id: string): Promise<void> {
		this.links = this.links.filter((l) => l.id !== id);
	}

	async exportAll(): Promise<{ nodes: ContextNode[]; links: ContextLink[] }> {
		return { nodes: [...this.nodes], links: [...this.links] };
	}

	async importAll(data: { nodes: ContextNode[]; links: ContextLink[] }): Promise<void> {
		this.nodes = [...data.nodes];
		this.links = [...data.links];
	}

	// --- Checklist-specific helpers ---

	/** Load a Checklist object and populate the adapter's node/link storage */
	loadFromChecklist(checklist: Checklist, policies: Policy[] = []): void {
		this.nodes = [];
		this.links = [];

		// Architecture node
		const archNode: ContextNode = {
			id: `arch-${checklist.id}`,
			label: 'checklist_architecture',
			name: checklist.name,
			description: checklist.description,
			properties: { version: checklist.version, sourceId: checklist.id },
			created_at: now(),
			updated_at: now()
		};
		this.nodes.push(archNode);

		// Layer nodes + has_layer links
		for (const layer of checklist.layers) {
			const layerNode: ContextNode = {
				id: `layer-${checklist.id}-${layer.id}`,
				label: 'checklist_layer',
				name: layer.name,
				properties: {
					order: layer.order,
					values: layer.values,
					notes: layer.notes,
					policies: layer.policies
				},
				created_at: now(),
				updated_at: now()
			};
			this.nodes.push(layerNode);
			this.links.push({
				id: `link-${archNode.id}-${layerNode.id}`,
				source_id: archNode.id,
				destination_id: layerNode.id,
				label: 'has_layer',
				created_at: now(),
				updated_at: now()
			});
		}

		// Policy nodes
		for (const policy of policies) {
			const policyNode: ContextNode = {
				id: `policy-${policy.id}`,
				label: 'checklist_policy',
				name: policy.name,
				description: policy.description,
				properties: { category: policy.category, rule: policy.rule },
				created_at: now(),
				updated_at: now()
			};
			this.nodes.push(policyNode);
		}
	}

	/** Reconstruct a Checklist object from the adapter's nodes/links */
	toChecklist(): { checklist: Checklist; policies: Policy[] } {
		const archNode = this.nodes.find((n) => n.label === 'checklist_architecture');
		if (!archNode) {
			return {
				checklist: {
					version: '1.0',
					id: 'empty',
					name: 'New Architecture',
					description: '',
					layers: []
				},
				policies: []
			};
		}

		const layerLinks = this.links.filter(
			(l) => l.source_id === archNode.id && l.label === 'has_layer'
		);
		const layerNodeIds = new Set(layerLinks.map((l) => l.destination_id));
		const layerNodes = this.nodes
			.filter((n) => layerNodeIds.has(n.id) && n.label === 'checklist_layer')
			.sort(
				(a, b) =>
					((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0)
			);

		const layers: Layer[] = layerNodes.map((n) => ({
			id:
				n.name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.replace(/^-|-$/g, '') || 'layer',
			name: n.name,
			order: (n.properties?.order as number) || 0,
			values: (n.properties?.values as Record<string, string[]>) || {},
			notes: (n.properties?.notes as Record<string, string>) || {},
			policies: (n.properties?.policies as Record<string, string[]>) || {}
		}));

		const checklist: Checklist = {
			version: (archNode.properties?.version as string) || '1.0',
			id: (archNode.properties?.sourceId as string) || archNode.id,
			name: archNode.name,
			description: archNode.description || '',
			layers
		};

		const policies: Policy[] = this.nodes
			.filter((n) => n.label === 'checklist_policy')
			.map((n) => ({
				id: n.id.replace('policy-', ''),
				name: n.name,
				description: n.description || '',
				category: (n.properties?.category as string) || '',
				rule: (n.properties?.rule as string) || ''
			}));

		return { checklist, policies };
	}
}
