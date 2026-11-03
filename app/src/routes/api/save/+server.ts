import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'node:fs';
import path from 'node:path';

const CHECKLISTS_DIR = path.resolve('..', 'data', 'architectures');
const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/i;
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

	if (!body.id || typeof body.id !== 'string' || !body.layers) {
		return json({ error: 'Invalid checklist data' }, { status: 400 });
	}

	if (!SAFE_ID.test(body.id)) {
		return json({ error: 'Invalid architecture ID — use only letters, numbers, hyphens, dots, and underscores' }, { status: 400 });
	}

	const filename = `${body.id}.json`;
	const filepath = path.join(CHECKLISTS_DIR, filename);

	// Verify resolved path is inside the target directory
	if (!filepath.startsWith(CHECKLISTS_DIR + path.sep)) {
		return json({ error: 'Invalid file path' }, { status: 400 });
	}

	fs.mkdirSync(CHECKLISTS_DIR, { recursive: true });
	fs.writeFileSync(filepath, JSON.stringify(body, null, 2) + '\n');

	return json({ ok: true });
};
