import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'node:fs';
import path from 'node:path';

const POLICIES_DIR = path.resolve('..', 'data', 'policies');
const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST: RequestHandler = async ({ request }) => {
	const text = await request.text();
	if (text.length > MAX_BODY_SIZE) {
		return json({ error: 'Payload too large' }, { status: 413 });
	}

	let body: Record<string, unknown>;
	try {
		body = JSON.parse(text);
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const { categories, policies } = body;

	if (!Array.isArray(categories) || !Array.isArray(policies)) {
		return json({ error: 'Expected { categories, policies }' }, { status: 400 });
	}

	const file = { version: '1.0', categories, policies };
	fs.mkdirSync(POLICIES_DIR, { recursive: true });
	fs.writeFileSync(path.join(POLICIES_DIR, 'policies.json'), JSON.stringify(file, null, 2) + '\n');

	return json({ ok: true });
};
