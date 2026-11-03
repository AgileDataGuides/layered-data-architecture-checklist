import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'node:fs';
import path from 'node:path';

const LOOKUPS_DIR = path.resolve('..', 'data', 'lookups');
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

	const { lookups, dictionary } = body;

	if (!lookups || typeof lookups !== 'object' || !dictionary || typeof dictionary !== 'object') {
		return json({ error: 'Expected { lookups, dictionary }' }, { status: 400 });
	}

	fs.mkdirSync(LOOKUPS_DIR, { recursive: true });
	fs.writeFileSync(path.join(LOOKUPS_DIR, 'lookups.json'), JSON.stringify(lookups, null, 2) + '\n');
	fs.writeFileSync(path.join(LOOKUPS_DIR, 'dictionary.json'), JSON.stringify(dictionary, null, 2) + '\n');

	return json({ ok: true });
};
