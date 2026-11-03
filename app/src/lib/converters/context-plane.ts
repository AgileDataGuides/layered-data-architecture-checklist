/**
 * Bidirectional converter between Checklist native JSON and Context Plane { nodes, links } format.
 */
import type { ContextNode, ContextLink } from '$lib/cp-shared';
import type { Checklist, Layer, Policy } from '$lib/types';

function createId(prefix: string): string {
	const rand = typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID().slice(0, 8)
		: Math.random().toString(36).slice(2, 10);
	return `${prefix}-${rand}`;
}

function now(): string {
	return new Date().toISOString();
}

/**
 * Convert a Checklist (+ optional policies) to Context Plane nodes + links format.
 */
export function checklistToContextPlane(
	checklist: Checklist,
	policies: Policy[] = []
): { nodes: ContextNode[]; links: ContextLink[] } {
	const nodes: ContextNode[] = [];
	const links: ContextLink[] = [];
	const ts = now();

	// Architecture node
	const archNodeId = `arch-${checklist.id}`;
	nodes.push({
		id: archNodeId,
		label: 'checklist_architecture',
		name: checklist.name,
		description: checklist.description,
		properties: { version: checklist.version, sourceId: checklist.id },
		created_at: ts,
		updated_at: ts
	});

	// Layer nodes + has_layer links
	for (const layer of checklist.layers) {
		const layerNodeId = `layer-${checklist.id}-${layer.id}`;
		nodes.push({
			id: layerNodeId,
			label: 'checklist_layer',
			name: layer.name,
			properties: {
				order: layer.order,
				values: layer.values,
				notes: layer.notes,
				policies: layer.policies
			},
			created_at: ts,
			updated_at: ts
		});
		links.push({
			id: `link-${archNodeId}-${layerNodeId}`,
			source_id: archNodeId,
			destination_id: layerNodeId,
			label: 'has_layer',
			created_at: ts,
			updated_at: ts
		});
	}

	// Policy nodes
	for (const policy of policies) {
		nodes.push({
			id: `policy-${policy.id}`,
			label: 'checklist_policy,global_policy',
			name: policy.name,
			description: policy.description,
			properties: { category: policy.category, rule: policy.rule },
			created_at: ts,
			updated_at: ts
		});
	}

	return { nodes, links };
}

/**
 * Convert Context Plane nodes + links back to a Checklist (+ policies).
 */
export function contextPlaneToChecklist(
	data: { nodes: ContextNode[]; links: ContextLink[] }
): { checklist: Checklist; policies: Policy[] } {
	const { nodes, links } = data;

	const archNode = nodes.find((n) => n.label === 'checklist_architecture');
	if (!archNode) {
		return {
			checklist: { version: '1.0', id: 'empty', name: 'New Architecture', description: '', layers: [] },
			policies: []
		};
	}

	const layerLinks = links.filter((l) => l.source_id === archNode.id && l.label === 'has_layer');
	const layerNodeIds = new Set(layerLinks.map((l) => l.destination_id));
	const layerNodes = nodes
		.filter((n) => layerNodeIds.has(n.id) && n.label === 'checklist_layer')
		.sort((a, b) => ((a.properties?.order as number) || 0) - ((b.properties?.order as number) || 0));

	const layers: Layer[] = layerNodes.map((n) => ({
		id: n.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'layer',
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

	const policies: Policy[] = nodes
		.filter((n) => n.label.includes('checklist_policy'))
		.map((n) => ({
			id: n.id.replace('policy-', ''),
			name: n.name,
			description: n.description || '',
			category: (n.properties?.category as string) || '',
			rule: (n.properties?.rule as string) || ''
		}));

	return { checklist, policies };
}
