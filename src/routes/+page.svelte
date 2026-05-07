<script lang="ts">
	import exampleCard from '$lib/assets/GritShot.jpg';
	import { resolve } from '$app/paths';
	import HeroLogo from '$lib/components/layout/HeroLogo.svelte';
	import { m } from '$lib/paraglide/messages';
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
					href={resolve('/create')}
					class="rounded-full bg-[#4e7352] px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#3d5c42]"
				>
					{m.home_hero_create_button()}
				</a>
				<a
					href="#how-it-works"
					class="rounded-full border border-[#9ab89e] px-7 py-3 text-base font-medium text-[#4e7352] transition-colors hover:bg-[#4e7352]/8"
				>
					{m.home_hero_see_how()}
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

	<!-- How It Works -->
	<section id="how-it-works" class="bg-[#eaf0eb]/70 py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-12 text-center">
				<span
					class="mb-3 inline-block rounded-full bg-[#c4ddc7] px-4 py-1 text-xs font-medium tracking-widest text-[#3d5c42] uppercase"
					>{m.home_how_it_works_pill()}</span
				>
				<h2 class="text-3xl font-bold">{m.home_how_it_works_heading()}</h2>
			</div>

			<div class="grid gap-6 sm:grid-cols-3">
				<!-- Step 1 -->
				<div class="rounded-2xl border border-[#c8d9ca] bg-white/80 p-7">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0eb]">
						<svg
							class="h-6 w-6 text-[#4e7352]"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253"
							/>
						</svg>
					</div>
					<div class="mb-1 text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">
						{m.home_step_1_label()}
					</div>
					<h3 class="mb-2 text-lg font-semibold">{m.home_step_1_title()}</h3>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_step_1_text()}
					</p>
				</div>

				<!-- Step 2 -->
				<div class="rounded-2xl border border-[#c8d9ca] bg-white/80 p-7">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0eb]">
						<svg
							class="h-6 w-6 text-[#4e7352]"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
							/>
						</svg>
					</div>
					<div class="mb-1 text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">
						{m.home_step_2_label()}
					</div>
					<h3 class="mb-2 text-lg font-semibold">{m.home_step_2_title()}</h3>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_step_2_text()}
					</p>
				</div>

				<!-- Step 3 -->
				<div class="rounded-2xl border border-[#c8d9ca] bg-white/80 p-7">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0eb]">
						<svg
							class="h-6 w-6 text-[#4e7352]"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
							/>
						</svg>
					</div>
					<div class="mb-1 text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">
						{m.home_step_3_label()}
					</div>
					<h3 class="mb-2 text-lg font-semibold">{m.home_step_3_title()}</h3>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_step_3_text()}
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="mx-auto max-w-6xl px-6 py-20">
		<div class="mb-12 text-center">
			<span
				class="mb-3 inline-block rounded-full bg-[#c4ddc7] px-4 py-1 text-xs font-medium tracking-widest text-[#3d5c42] uppercase"
				>{m.home_features_pill()}</span
			>
			<h2 class="text-3xl font-bold">{m.home_features_heading()}</h2>
		</div>

		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">{m.home_feature_privacy_title()}</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_feature_privacy_text()}
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">{m.home_feature_fit_title()}</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_feature_fit_text()}
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">{m.home_feature_stats_title()}</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_feature_stats_text()}
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">{m.home_feature_photo_title()}</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_feature_photo_text()}
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">{m.home_feature_social_title()}</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_feature_social_text()}
					</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">{m.home_feature_activities_title()}</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						{m.home_feature_activities_text()}
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Banner -->
	<section class="bg-[#2a3d2c] py-16 text-center text-white">
		<div class="mx-auto max-w-xl px-6">
			<h2 class="mb-4 text-2xl font-bold">{m.home_cta_heading()}</h2>
			<p class="mb-8 text-[#9ab89e]">
				{m.home_cta_subtitle()}
			</p>
			<a
				href={resolve('/create')}
				class="rounded-full bg-[#c4894f] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#b37840]"
			>
				{m.home_cta_button()}
			</a>
		</div>
	</section>
</div>
