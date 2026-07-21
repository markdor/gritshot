<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.garmin_required_meta_title()}</title>
</svelte:head>

<div class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]">
	<main class="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
		<header class="space-y-2 text-center">
			<h1 class="text-3xl font-semibold tracking-tight">{m.garmin_required_heading()}</h1>
			<p class="text-sm text-[#4a5e43]">{m.garmin_required_subtitle()}</p>
		</header>

		<a
			href={resolve('/garmin/connect')}
			class="w-full rounded-full bg-[#4e7352] px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#5a8560]"
		>
			{m.garmin_required_connect_cta()}
		</a>
	</main>
</div>
