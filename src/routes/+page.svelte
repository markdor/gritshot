<script lang="ts">
	import exampleCard from '$lib/assets/GritShot.jpg';
	import { resolve } from '$app/paths';
	import HeroLogo from '$lib/components/layout/HeroLogo.svelte';
	import { m } from '$lib/paraglide/messages';

	let { data } = $props();
</script>

<svelte:head>
	<title>{m.home_meta_title()}</title>
	<meta name="description" content={m.home_meta_description()} />
</svelte:head>

<div
	class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]"
	style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;"
>
	<!-- Hero -->
	<section class="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center">
		<!-- Decorative mountain silhouette -->
		<HeroLogo />

		<div class="relative">
			<h1 class="mb-5 text-4xl leading-tight font-bold sm:text-5xl">
				{m.home_hero_heading_line1()}<br />
				<span class="text-[#4e7352]">{m.home_hero_heading_line2()}</span>
			</h1>

			<p class="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#4a5e43]">
				{m.home_hero_subtitle()}
			</p>

			<div class="flex flex-wrap items-center justify-center gap-3">
				<a
					href={resolve(data.createHref)}
					class="rounded-full bg-[#4e7352] px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#3d5c42]"
				>
					{m.home_hero_create_button()}
				</a>
			</div>

			<!-- Example card -->
			<div class="mt-16 flex justify-center">
				<div
					class="w-full max-w-sm rounded-2xl border border-[#c8d9ca] bg-white/70 p-5 shadow-lg backdrop-blur-sm"
				>
					<div class="relative aspect-3/4 overflow-hidden rounded-xl">
						<img
							src={exampleCard}
							alt={m.home_example_card_alt()}
							class="h-full w-full object-cover"
						/>
					</div>
					<p class="mt-3 text-center text-xs text-[#7a9478]">
						{m.home_example_caption()}
					</p>
				</div>
			</div>
		</div>
	</section>
</div>
