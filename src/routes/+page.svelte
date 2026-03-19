<script lang="ts">
	import logo from '$lib/assets/logo.800px.png';
	const version = __APP_VERSION__;
</script>

<svelte:head>
	<title>GritShot — Turn Your Adventures Into Art</title>
	<meta
		name="description"
		content="Transform your Garmin activities and trail photos into stunning shareable cards with embedded statistics."
	/>
</svelte:head>

<div class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]" style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">

	<!-- Navigation -->
	<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<div class="flex items-center gap-2.5">
			<img src={logo} alt="GritShot" class="h-9 w-9 object-contain" />
			<span class="text-lg font-semibold tracking-tight">GritShot</span>
		</div>
		<a
			href="/demo"
			class="rounded-full bg-[#4e7352] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3d5c42]"
		>
			Try it free
		</a>
	</nav>

	<!-- Hero -->
	<section class="mx-auto max-w-6xl px-6 pb-20 pt-12 text-center">
		<!-- Decorative mountain silhouette -->
		<div class="pointer-events-none absolute left-0 right-0 -mt-4 flex justify-center opacity-[0.05]">
			<svg viewBox="0 0 800 200" class="w-full max-w-4xl" fill="#2a3d2c" xmlns="http://www.w3.org/2000/svg">
				<polygon points="0,200 120,60 240,140 360,20 480,120 600,50 720,130 800,80 800,200" />
			</svg>
		</div>

		<div class="relative">
			<img src={logo} alt="GritShot" class="mx-auto mb-8 h-56 w-56 object-contain drop-shadow-md" />

			<h1 class="mb-5 text-4xl font-bold leading-tight sm:text-5xl">
				Your adventure,<br />
				<span class="text-[#4e7352]">beautifully captured.</span>
			</h1>

			<p class="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#4a5e43]">
				Upload your Garmin FIT file, add your trail photo, and create a stunning shareable card
				with embedded stats — distance, elevation, time and more.
			</p>

			<div class="flex flex-wrap items-center justify-center gap-3">
				<a
					href="/demo"
					class="rounded-full bg-[#4e7352] px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#3d5c42]"
				>
					Create Your First Card
				</a>
				<a
					href="#how-it-works"
					class="rounded-full border border-[#9ab89e] px-7 py-3 text-base font-medium text-[#4e7352] transition-colors hover:bg-[#4e7352]/8"
				>
					See How It Works
				</a>
			</div>

			<!-- Mockup card -->
			<div class="mt-16 flex justify-center">
				<div
					class="w-full max-w-sm rounded-2xl border border-[#c8d9ca] bg-white/70 p-5 shadow-sm backdrop-blur-sm"
				>
					<div
						class="flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-xl bg-[#2a3d2c] p-6 text-white"
					>
						<!-- Simulated photo overlay -->
						<div class="h-full w-full rounded-lg bg-gradient-to-br from-[#3d5c42] via-[#2a3d2c] to-[#1a2b1e] flex flex-col items-center justify-between py-4 px-4">
							<div class="text-xs font-medium text-white/50 uppercase tracking-widest">GritShot</div>
							<div class="text-center">
								<div class="mb-1 text-3xl font-bold">12.8 km</div>
								<div class="text-xs text-white/60">Trail Run · Elevation 1 180 m</div>
							</div>
							<div class="flex gap-6 text-center">
								<div>
									<div class="text-base font-semibold">5:24 h</div>
									<div class="text-[10px] text-white/50">Time</div>
								</div>
								<div>
									<div class="text-base font-semibold">4:12 /km</div>
									<div class="text-[10px] text-white/50">Avg Pace</div>
								</div>
								<div>
									<div class="text-base font-semibold">162 bpm</div>
									<div class="text-[10px] text-white/50">Avg HR</div>
								</div>
							</div>
						</div>
					</div>
					<p class="mt-3 text-center text-xs text-[#7a9478]">Your photo + Garmin stats, ready to share</p>
				</div>
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section id="how-it-works" class="bg-[#eaf0eb]/70 py-20">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-12 text-center">
				<span class="mb-3 inline-block rounded-full bg-[#c4ddc7] px-4 py-1 text-xs font-medium uppercase tracking-widest text-[#3d5c42]">How It Works</span>
				<h2 class="text-3xl font-bold">Three steps to a shareable card</h2>
			</div>

			<div class="grid gap-6 sm:grid-cols-3">
				<!-- Step 1 -->
				<div class="rounded-2xl border border-[#c8d9ca] bg-white/80 p-7">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0eb]">
						<svg class="h-6 w-6 text-[#4e7352]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" />
						</svg>
					</div>
					<div class="mb-1 text-xs font-semibold uppercase tracking-widest text-[#9ab89e]">Step 1</div>
					<h3 class="mb-2 text-lg font-semibold">Upload Your FIT File</h3>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						Export your activity from Garmin Connect and upload the FIT file. Distance, elevation, pace, heart rate — all parsed automatically.
					</p>
				</div>

				<!-- Step 2 -->
				<div class="rounded-2xl border border-[#c8d9ca] bg-white/80 p-7">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0eb]">
						<svg class="h-6 w-6 text-[#4e7352]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
						</svg>
					</div>
					<div class="mb-1 text-xs font-semibold uppercase tracking-widest text-[#9ab89e]">Step 2</div>
					<h3 class="mb-2 text-lg font-semibold">Add Your Photos</h3>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						Upload the best shot from your run, hike, or ride. GritShot overlays the stats right onto your image.
					</p>
				</div>

				<!-- Step 3 -->
				<div class="rounded-2xl border border-[#c8d9ca] bg-white/80 p-7">
					<div class="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0eb]">
						<svg class="h-6 w-6 text-[#4e7352]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
						</svg>
					</div>
					<div class="mb-1 text-xs font-semibold uppercase tracking-widest text-[#9ab89e]">Step 3</div>
					<h3 class="mb-2 text-lg font-semibold">Share Your Achievement</h3>
					<p class="text-sm leading-relaxed text-[#5a7060]">
						Download your custom card and share it on Instagram, Strava, or wherever you celebrate your outdoor adventures.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="mx-auto max-w-6xl px-6 py-20">
		<div class="mb-12 text-center">
			<span class="mb-3 inline-block rounded-full bg-[#c4ddc7] px-4 py-1 text-xs font-medium uppercase tracking-widest text-[#3d5c42]">Features</span>
			<h2 class="text-3xl font-bold">Everything your adventure deserves</h2>
		</div>

		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 flex-shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">Privacy First</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">Your photos and FIT files are processed on the server but never stored — nothing is saved, no tracking, no selling.</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 flex-shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">FIT File Support</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">Upload your Garmin FIT file directly — no account connection needed.</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 flex-shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">Rich Activity Stats</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">Distance, elevation, pace, time, heart rate and more — pick what to show.</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 flex-shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">Custom Photo Cards</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">Overlay your statistics onto your own trail photos for a personal touch.</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 flex-shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">Social-Ready Format</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">Export in formats optimized for Instagram, Strava, and other platforms.</p>
				</div>
			</div>

			<div class="flex gap-4 rounded-2xl border border-[#c8d9ca] bg-white/60 p-6">
				<div class="mt-0.5 flex-shrink-0">
					<svg class="h-5 w-5 text-[#c4894f]" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
					</svg>
				</div>
				<div>
					<h4 class="mb-1 font-semibold">Runs, Hikes & Rides</h4>
					<p class="text-sm leading-relaxed text-[#5a7060]">Works with all Garmin outdoor activity types — trail running, cycling, hiking.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Banner -->
	<section class="bg-[#2a3d2c] py-16 text-center text-white">
		<div class="mx-auto max-w-xl px-6">
			<h2 class="mb-4 text-2xl font-bold">Ready to show off your next adventure?</h2>
			<p class="mb-8 text-[#9ab89e]">
				Upload your FIT file, add a photo, and create your first card in minutes.
			</p>
			<a
				href="/demo"
				class="inline-block rounded-full bg-[#c4894f] px-8 py-3 font-semibold text-white transition-colors hover:bg-[#b37840]"
			>
				Get Started Free
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-[#c8d9ca] bg-[#f5f1e6] px-6 py-8">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<img src={logo} alt="GritShot" class="h-7 w-7 object-contain opacity-80" />
				<span class="text-sm font-medium text-[#4a5e43]">GritShot</span>
				<span class="text-xs text-[#9ab89e]">v{version}</span>
			</div>
			<div class="flex items-center gap-4">
			<p class="text-xs text-[#7a9478]">
				Built for outdoor athletes. Made with ❤️ for the trails.
			</p>
			<a
				href="https://github.com/markdor/gritshot"
				target="_blank"
				rel="noopener noreferrer"
				class="text-[#7a9478] transition-colors hover:text-[#4e7352]"
				aria-label="GitHub Repository"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
				</svg>
			</a>
		</div>
		</div>
	</footer>

</div>
