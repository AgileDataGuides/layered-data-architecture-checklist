// Ambient module declarations so svelte-check resolves Vite-alias-only
// imports (no .d.ts shipped from Vite for these). $data/*.json is the
// repo-level `data/` directory aliased in vite.config.ts. This lives in
// its own file (not app.d.ts) because app.d.ts is a module (`export {}`),
// and ambient wildcard module declarations only register in script files.
declare module '$data/*.json' {
	const value: Record<string, unknown>;
	export default value;
}
