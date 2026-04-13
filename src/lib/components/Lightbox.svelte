<script lang="ts">
	interface Props {
		image: string | undefined;
	}

	let { image }: Props = $props();

	let open = $state(false);

	$effect(() => {
		if (image) open = true;
	});

	function close() {
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	function download() {
		if (!image) return;
		const a = document.createElement('a');
		a.href = `data:image/jpeg;base64,${image}`;
		a.download = 'gritshot.jpg';
		a.click();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && image}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Generated card preview"
		tabindex="-1"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		onclick={close}
		onkeydown={handleKeydown}
	>
		<div
			class="relative flex max-h-full flex-col items-center"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<button
				onclick={close}
				aria-label="Close"
				class="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>

			<img
				src={`data:image/jpeg;base64,${image}`}
				alt="Your GritShot card"
				class="max-h-[80vh] w-auto rounded-xl shadow-2xl"
			/>

			<button
				onclick={download}
				class="mt-5 rounded-full bg-[#4e7352] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3d5c42]"
			>
				Download Card
			</button>
		</div>
	</div>
{/if}
