import adapterAuto from '@sveltejs/adapter-auto';
import adapterStatic from '@sveltejs/adapter-static';

const isDemo = process.env.DEMO_BUILD === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Demo build (GitHub Pages) → adapter-static SPA with the GH Pages
		// repo path baked in. Default dev / standalone install → adapter-auto
		// so SvelteKit's API routes (`/api/save`, `/api/save-policies`,
		// `/api/save-lookups`) keep working for the optional file-based save
		// path. The store's primary persistence is localStorage either way,
		// so the demo loses nothing visible to the user.
		adapter: isDemo
			? adapterStatic({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',  // SPA mode — all routes handled client-side
				precompress: false,
				strict: false
			})
			: adapterAuto(),
		paths: isDemo
			? { base: '/layered-data-architecture-checklist' }  // GitHub Pages repo path
			: {}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
