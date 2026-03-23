<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Create Your Card — GritShot</title>
</svelte:head>

<div
	class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]"
	style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;"
>
	<!-- Navigation -->
	<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<div class="flex items-center gap-2.5">
			<span class="text-lg font-semibold tracking-tight">GritShot</span>
		</div>
		<a
			href={resolve('/')}
			class="rounded-full bg-[#4e7352] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3d5c42]"
		>
			Homepage
		</a>
	</nav>

	<!-- Content -->
	<section class="mx-auto max-w-6xl px-6 pt-12 pb-20">
		<h1 class="text-4xl font-bold sm:text-5xl">Create your Card</h1>
	</section>
</div>
