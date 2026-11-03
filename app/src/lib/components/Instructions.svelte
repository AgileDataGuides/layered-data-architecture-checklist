<div class="instructions">
	<h2>Data Architecture Layers Pattern Checklist</h2>
	<p>Document and compare data architecture designs using 25 pattern rules across your data layers. Use the web app to build your checklist, then use Claude to analyse, compare, and get recommendations.</p>

	<div class="options">
		<section class="option-card">
			<h3>Quick Start: Explore the Example</h3>
			<p>See what a completed checklist looks like and use Claude to query it.</p>
			<ol>
				<li>Go to the <strong>Checklist</strong> tab and click <strong>Load AgileData Example</strong>.</li>
				<li>Browse the 6-layer architecture (Landing, History, Designed, Consume, Cached, Last Mile) and hover over pattern names to see descriptions.</li>
				<li>Use the <strong>Search pattern rules</strong> input above the matrix to narrow the visible rows by pattern name when the checklist gets long.</li>
				<li>Open <strong>Claude Code</strong> in this project directory and ask questions like:</li>
			</ol>
			<ul class="examples">
				<li>"How does AgileData handle PII across its layers?"</li>
				<li>"Which layers allow destructive rebuilds?"</li>
				<li>"What's the difference between the Landing and History layers?"</li>
				<li>"What storage technologies does AgileData use?"</li>
				<li>"Are there any inconsistencies in the example?"</li>
			</ul>
		</section>

		<section class="option-card">
			<h3>Fill It In Step by Step</h3>
			<p>The <strong>9 Steps</strong> tab walks a team through the checklist one question at a time. It is the first tab, and the app opens on it. It writes the same layers, values and notes as the Checklist tab.</p>
			<ol>
				<li>The steps run down the left, each with a line that shows how far it has got, for example "7 of 12 answered".</li>
				<li>Step 1 names the layers. Type a layer name and press Enter. The cursor stays in the field, so you can add the next one straight away. Move a layer up or down, rename it in place, or remove it.</li>
				<li>Each later step asks about a few patterns, for example how the data is stored. Each pattern shows what it means and a row for each layer. Click a value to give it to that layer, and click it again to take it off. Hover over a value, or tab to it, and a card says what it means.</li>
				<li>A pattern with a long list of values, such as Data Compute Technology, shows the values a layer already has. Click <strong>Pick</strong> to see every value, with a filter at the top. Click <strong>Add note</strong> on a row to say why.</li>
				<li>Click <strong>Next</strong> at the bottom to move on, or <strong>Back</strong> to go back. Any step on the left is one click away. No step is locked.</li>
				<li>The last step lists every pattern that has no value yet for a layer. Click <strong>Go to</strong> to open the step that fills it. Some patterns do not apply to every layer, so a gap is a prompt, never a block.</li>
				<li>Pattern types you add in <strong>Manage Patterns</strong> get their own <strong>Other Patterns</strong> step. A step whose pattern types are all turned off is hidden. The tab's name counts the steps it shows, so it can read <strong>10 Steps</strong> or <strong>8 Steps</strong>.</li>
			</ol>
		</section>

		<section class="option-card">
			<h3>Build Your Own Architecture</h3>
			<p>Create a new architecture, fill in the values, then use Claude to review and improve it.</p>
			<ol>
				<li>Go to the <strong>Checklist</strong> tab and click <strong>New</strong> to create a blank architecture.</li>
				<li>Double-click the title to name it. Add or rename layers using the column headers.</li>
				<li>Click each cell to open the value picker — a search-and-select panel showing every option with its description, with a checkbox (multi-select patterns) or radio (single-select patterns). Add notes with the pencil icon and attach policies via the shield icon.</li>
				<li>Drag column headers to reorder layers. Resize by dragging the right edge. Use the <strong>Search pattern rules</strong> input at the top of the matrix to narrow the visible rows.</li>
				<li>Click <strong>Save</strong> to save your architecture JSON to <code>data/architectures/</code> so Claude can access it. Use the Export buttons for downloads. Then ask:</li>
			</ol>
			<ul class="examples">
				<li>"What's missing from my checklist?"</li>
				<li>"Compare my architecture to the AgileData example"</li>
				<li>"I'm adding a new Staging layer, what values should I use?"</li>
				<li>"Should my Gold layer allow destructive rebuilds?"</li>
				<li>"What layer should PII be masked in?"</li>
				<li>"Help me decide how many layers I need"</li>
			</ul>
		</section>

		<section class="option-card chat-card">
			<h3>No Claude Code? Use Claude Chat Instead</h3>
			<p>You don't need Claude Code to get AI-powered advice on your architecture. Export your checklist as Excel and upload it directly to <a href="https://claude.ai" target="_blank" rel="noopener">claude.ai</a>.</p>
			<ol>
				<li>Build your architecture in the <strong>Checklist</strong> tab.</li>
				<li>Click <strong>Export Excel</strong> to download the <code>.xlsx</code> file. This includes your architecture, notes, lookups, and dictionary all in one file.</li>
				<li>Open <a href="https://claude.ai" target="_blank" rel="noopener">claude.ai</a> and start a new conversation.</li>
				<li>Attach the <code>.xlsx</code> file using the paperclip icon, then ask your questions.</li>
			</ol>
			<p>The Excel export contains everything Claude needs to understand your architecture. Try asking:</p>
			<ul class="examples">
				<li>"Review my data architecture and suggest improvements"</li>
				<li>"Which layers have gaps I should fill in?"</li>
				<li>"How should I handle PII across my layers?"</li>
				<li>"What's missing compared to best practices?"</li>
				<li>"Explain the trade-offs in my storage technology choices"</li>
			</ul>
		</section>

		<section class="option-card">
			<h3>Managing the Checklist</h3>
			<p>Customise the dropdown values, share configurations, and export your work.</p>

			<h4>Saving &amp; Exporting Architectures</h4>
			<ul>
				<li><strong>Save</strong> &mdash; writes the architecture JSON to <code>data/architectures/</code> so Claude can access it directly.</li>
				<li><strong>Export JSON</strong> &mdash; downloads the architecture to your downloads folder to share or re-import later.</li>
				<li><strong>Export CSV</strong> &mdash; downloads a flat spreadsheet of patterns and values.</li>
				<li><strong>Export Excel</strong> &mdash; downloads an .xlsx with 4 sheets (architecture, notes, lookups, dictionary). Opens in Google Sheets or Excel.</li>
				<li><strong>Import JSON</strong> &mdash; load a previously exported architecture.</li>
			</ul>

			<h4>Saving &amp; Managing Patterns</h4>
			<ul>
				<li>Go to the <strong>Manage Patterns</strong> tab to add, edit, or remove dropdown values and descriptions for each pattern.</li>
				<li>Use <strong>Manage Pattern Types</strong> to add, edit, or remove pattern types. Each pattern type has a name and a single/multi-select mode.</li>
				<li><strong>Save</strong> &mdash; writes <code>lookups.json</code> and <code>dictionary.json</code> to <code>data/lookups/</code> so Claude can access them directly.</li>
				<li><strong>Export</strong> buttons &mdash; download individual files or a combined bundle to your downloads folder.</li>
				<li><strong>Import/Export All</strong> &mdash; share your complete set of lookups, dictionary, and pattern types as a single bundle file.</li>
				<li><strong>Reset to Defaults</strong> &mdash; restores the built-in values, descriptions, and pattern types.</li>
			</ul>
			<p>You can also ask Claude to manage patterns directly:</p>
			<ul class="examples">
				<li>"Add Databricks as a storage technology"</li>
				<li>"Update the description for Bronze"</li>
				<li>"Remove Tin from the alias options"</li>
			</ul>
		</section>

		<section class="option-card">
			<h3>Policies</h3>
			<p>Attach governance rules and data standards to individual checklist cells. Policies are defined once in a shared library and can be reused across cells and architectures.</p>

			<h4>Managing the Policy Library</h4>
			<ul>
				<li>Go to the <strong>Policies</strong> tab to create, edit, and manage your shared policy library.</li>
				<li>Each policy has a <strong>name</strong>, <strong>policy type</strong> (Security, Quality, Compliance, etc.), <strong>description</strong>, and a <strong>rule</strong> (a natural language statement like "All columns MUST use snake_case naming").</li>
				<li>Use <strong>Manage Policy Types</strong> to add or remove policy types.</li>
				<li>Filter and search policies by policy type or keyword.</li>
				<li><strong>Save</strong> &mdash; writes the policy library to <code>data/policies/</code>.</li>
				<li><strong>Export/Import</strong> &mdash; download or upload the policy library as JSON.</li>
			</ul>

			<h4>Attaching Policies to Cells</h4>
			<ul>
				<li>In the <strong>Checklist</strong> tab, each cell has a shield icon next to the notes icon.</li>
				<li>Click the shield to open a popover listing all available policies.</li>
				<li>Check or uncheck policies to attach or detach them from that cell.</li>
				<li>Cells with attached policies show a blue shield badge with a count.</li>
				<li>Policy attachments are saved as part of the architecture.</li>
			</ul>
		</section>

		<section class="option-card security-card">
			<h3>Security Notice</h3>
			<p><strong>This app is designed to run locally on your own machine.</strong> Do not expose it to the internet or deploy it on a public server. The Save feature writes files directly to your filesystem. There is no user authentication, so anyone who can reach the server can read and overwrite your data.</p>
			<p>If you need to share your work, use the <strong>Export</strong> buttons to download files and share them manually.</p>
		</section>

		<section class="option-card data-storage-card">
			<h3>Data Storage</h3>
			<p><strong>Save</strong> writes files to the <code>data/</code> folder &mdash; architectures go to <code>data/architectures/</code>, lookups go to <code>data/lookups/</code>, and policies go to <code>data/policies/</code>. This only works in dev mode (<code>npm run dev</code>) where the server can write to disk. Claude can then read these files directly.</p>
			<p><strong>Export</strong> downloads files to your browser's downloads folder for sharing or backup.</p>
			<p>Customisations made in the Manage Patterns and Policies tabs are also cached in your browser's local storage so they persist between sessions.</p>
		</section>
	</div>

	<section class="footer-section">
		<p>Code: <strong>MIT</strong> · Docs: <strong>CC BY-SA 4.0</strong> by AgileDataGuides. Free to share and adapt for any purpose with attribution.</p>
	</section>
</div>

<style>
	.instructions {
		max-width: 900px;
		line-height: 1.6;
	}

	h2 {
		font-size: 1.25rem;
		margin-bottom: 0.25rem;
	}

	.instructions > p {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-bottom: 1.25rem;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.option-card {
		padding: 1rem 1.25rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.option-card h3 {
		font-size: 1rem;
		margin: 0 0 0.375rem 0;
		padding: 0;
		border: none;
	}

	.option-card > p {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-bottom: 0.625rem;
	}

	.chat-card {
		background: #f8f6ff;
		border-color: #d4c8f0;
	}

	.chat-card a {
		color: var(--color-primary);
		text-decoration: underline;
	}

	.security-card {
		background: #fff8f0;
		border-color: #e8c090;
	}

	.data-storage-card {
		background: #f5f5f5;
		border-color: #ddd;
	}

	h4 {
		font-size: 0.875rem;
		margin-top: 0.875rem;
		margin-bottom: 0.375rem;
	}

	ol, ul {
		font-size: 0.8125rem;
		margin: 0 0 0.5rem 0;
		padding-left: 1.25rem;
	}

	li {
		margin-bottom: 0.25rem;
	}

	.examples {
		list-style: none;
		padding-left: 0.5rem;
		margin-top: 0.375rem;
	}

	.examples li {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.examples li::before {
		content: '\203A  ';
		color: var(--color-primary);
		font-weight: 600;
	}

	code {
		background: white;
		padding: 0.125rem 0.375rem;
		border-radius: 3px;
		font-size: 0.8125rem;
		border: 1px solid var(--color-border);
	}

	.footer-section {
		margin-top: 1.25rem;
	}

	.footer-section p {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
