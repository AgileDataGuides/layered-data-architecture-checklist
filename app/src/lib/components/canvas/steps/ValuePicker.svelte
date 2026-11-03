<script lang="ts">
	// The values of one pattern for one layer, as chips. A short list of
	// options shows every option, and a click toggles it. A long list shows the
	// values already picked, and Pick opens every option with a filter. A value
	// that is no longer an option still shows, so nothing a layer holds is
	// hidden. Hover or focus a chip and a hover card says what the value means.
	import { CHIP_LIMIT, EMPTY } from '../../../canon/steps';
	import { CHIP, HOVER_CARD, INPUT, ROW_ACTION, TEXT } from '../../../ui/tokens';

	let {
		options,
		selected,
		multiSelect,
		descriptions = {},
		onChange
	}: {
		options: string[];
		selected: string[];
		multiSelect: boolean;
		descriptions?: Record<string, string>;
		onChange: (values: string[]) => void;
	} = $props();

	const long = $derived(options.length > CHIP_LIMIT);
	let open = $state(false);
	let filter = $state('');

	// Values picked that are not options any more, first, so they stay in view
	const extra = $derived(selected.filter((v) => !options.includes(v)));
	const shown = $derived.by(() => {
		const q = filter.trim().toLowerCase();
		const all = [...extra, ...options];
		return q ? all.filter((v) => v.toLowerCase().includes(q)) : all;
	});

	function toggle(value: string) {
		if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
		else onChange(multiSelect ? [...selected, value] : [value]);
	}

	function close() {
		open = false;
		filter = '';
	}

	// ── The hover card: under the chip, or over it near the bottom of the window ──

	interface Card {
		value: string;
		left: number;
		/** CSS top or bottom, in pixels from that edge of the window */
		edge: 'top' | 'bottom';
		offset: number;
	}

	let card = $state<Card | null>(null);
	// The chip under the card points at it, so a screen reader reads the meaning too
	const cardId = $props.id();
	// Room the card needs under a chip before it flips above
	const ROOM_BELOW = 160;

	function showCard(value: string, el: HTMLElement) {
		const r = el.getBoundingClientRect();
		const left = Math.max(8, Math.min(r.left, window.innerWidth - HOVER_CARD.width - 8));
		card =
			r.bottom + ROOM_BELOW > window.innerHeight
				? { value, left, edge: 'bottom', offset: window.innerHeight - r.top + 4 }
				: { value, left, edge: 'top', offset: r.bottom + 4 };
	}

	function hideCard() {
		card = null;
	}

	// The card is fixed to the window, so it goes when the panel scrolls under it
	$effect(() => {
		if (!card) return;
		window.addEventListener('scroll', hideCard, true);
		return () => window.removeEventListener('scroll', hideCard, true);
	});
</script>

{#snippet chip(value: string)}
	{@const on = selected.includes(value)}
	<button
		type="button"
		class="{CHIP.base} {on ? CHIP.active : CHIP.inactive}"
		aria-pressed={on}
		aria-describedby={card?.value === value ? cardId : undefined}
		onmouseenter={(e) => showCard(value, e.currentTarget)}
		onmouseleave={hideCard}
		onfocus={(e) => showCard(value, e.currentTarget)}
		onblur={hideCard}
		onclick={() => {
			// A click that takes the chip away takes its card too: a picked value in a long
			// list's short view, or a picked value that is no longer an option. Every other
			// chip stays, and so does its card.
			if (selected.includes(value) && ((long && !open) || !options.includes(value))) hideCard();
			toggle(value);
		}}
	>{value}</button>
{/snippet}

{#if !long}
	<div class={CHIP.wrapper}>
		{#each [...extra, ...options] as value (value)}
			{@render chip(value)}
		{/each}
	</div>
{:else if open}
	<div class="space-y-2">
		<div class="flex items-center gap-3">
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="{INPUT.text} max-w-xs"
				type="text"
				placeholder="Filter {options.length} values"
				aria-label="Filter values"
				autofocus
				bind:value={filter}
				onkeydown={(e) => {
					if (e.key === 'Escape') close();
				}}
			/>
			<button type="button" class={ROW_ACTION.neutral} onclick={close}>Done</button>
		</div>
		<div class={CHIP.wrapper}>
			{#each shown as value (value)}
				{@render chip(value)}
			{/each}
		</div>
		{#if shown.length === 0}
			<p class={TEXT.empty}>{EMPTY.noMatch}</p>
		{/if}
	</div>
{:else}
	<div class="flex flex-wrap items-center gap-1">
		{#each selected as value (value)}
			{@render chip(value)}
		{/each}
		{#if selected.length === 0}
			<span class="{TEXT.empty} mr-1">{EMPTY.value}</span>
		{/if}
		<button type="button" class="{ROW_ACTION.neutral} ml-1" onclick={() => (open = true)}>
			{selected.length === 0 ? 'Pick' : multiSelect ? 'Pick more' : 'Change'}
		</button>
	</div>
{/if}

{#if card}
	<div id={cardId} class={HOVER_CARD.card} style="left: {card.left}px; {card.edge}: {card.offset}px;" role="tooltip">
		<p class={HOVER_CARD.title}>{card.value}</p>
		<p>{descriptions[card.value] ?? EMPTY.description}</p>
	</div>
{/if}
