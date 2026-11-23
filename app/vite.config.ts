import adapterAuto from '@sveltejs/adapter-auto';
import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

const isDemo = process.env.DEMO_BUILD === 'true';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			dynamicCompileOptions: ({ filename }) => filename.includes('node_modules') ? undefined : { runes: true },

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
					fallback: 'index.html' /* SPA mode — all routes handled client-side */,
					precompress: false,
					strict: false
				})
				: adapterAuto(),

			paths: isDemo
				? { base: '/layered-data-architecture-checklist' } /* GitHub Pages repo path */
				: {}
		})
	],
	server: { port: 5120, host: '127.0.0.1' },
	resolve: { alias: { '$data': path.resolve('..', 'data') } }
});
