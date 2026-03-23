<script lang="ts">
	import './layout.css';
	import logo from '$lib/assets/logo.800px.png';
	const version = __APP_VERSION__;

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<meta name="apple-mobile-web-app-title" content="GritShot" />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>

{@render children()}

<footer
	class="border-t border-[#c8d9ca] bg-[#f5f1e6] px-6 py-8"
	style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;"
>
	<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-2">
			<img src={logo} alt="GritShot" class="h-7 w-7 object-contain opacity-80" />
			<span class="text-sm font-medium text-[#4a5e43]">GritShot</span>
			<a
				href="https://github.com/markdor/gritshot/releases/tag/v{version}"
				rel="noopener noreferrer"
				class="text-xs text-[#9ab89e] transition-colors hover:text-[#4e7352]">v{version}</a
			>
		</div>
		<div class="flex items-center gap-4">
			<p class="text-xs text-[#7a9478]">Built for outdoor athletes. Made with ❤️ for the trails.</p>
			<a
				href="https://github.com/markdor/gritshot"
				rel="noopener noreferrer"
				class="text-[#7a9478] transition-colors hover:text-[#4e7352]"
				aria-label="GitHub Repository"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
					/>
				</svg>
			</a>
		</div>
	</div>
</footer>
