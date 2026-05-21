<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, setLocale, locales, type Locale } from '$lib/paraglide/runtime';
	import UserSlot from './UserSlot.svelte';

	type LayoutUser = { id: string; username: string; isAdmin: boolean };
	let { user = null }: { user?: LayoutUser | null } = $props();

	const currentLocale = getLocale();

	const localeLabels: Record<Locale, () => string> = {
		en: m.nav_language_en,
		de: m.nav_language_de
	};

	function switchLocale(locale: Locale) {
		if (locale === currentLocale) return;
		setLocale(locale);
	}
</script>

<nav class="border-b border-[#1e2e1f] bg-[#2a3d2c]">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<div class="flex items-center gap-2.5">
			<a
				href={resolve('/')}
				class="text-lg font-semibold tracking-tight text-white hover:opacity-80">GritShot</a
			>
		</div>
		<div class="flex items-center gap-3">
			<div
				role="group"
				aria-label={m.nav_language_label()}
				class="flex items-center rounded-full border border-[#4e7352]/60 p-0.5 text-xs font-semibold"
			>
				{#each locales as locale (locale)}
					{@const isActive = currentLocale === locale}
					<button
						type="button"
						onclick={() => switchLocale(locale)}
						aria-pressed={isActive}
						class="rounded-full px-2.5 py-1 transition-colors {isActive
							? 'bg-[#4e7352] text-white'
							: 'text-white/70 hover:text-white'}"
					>
						{localeLabels[locale]()}
					</button>
				{/each}
			</div>
			<a
				href={resolve('/create')}
				class="rounded-full bg-[#4e7352] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a8560]"
			>
				{m.nav_create_button()}
			</a>
			<UserSlot {user} />
		</div>
	</div>
</nav>
