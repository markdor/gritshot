<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	interface Props {
		image: string | undefined;
		title?: string;
	}

	let { image, title = '' }: Props = $props();

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
		const now = new Date();
		const date =
			`${now.getFullYear()}` +
			`${String(now.getMonth() + 1).padStart(2, '0')}` +
			`${String(now.getDate()).padStart(2, '0')}`;
		const safeTitle = title.replace(/[\\/:*?"<>|\p{Cc}]/gu, '').trim();
		const a = document.createElement('a');
		a.href = `data:image/jpeg;base64,${image}`;
		a.download = `GritShot-${date}-${safeTitle}.jpg`;
		a.click();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && image}
	<div
		role="dialog"
		aria-modal="true"
		aria-label={m.lightbox_dialog_label()}
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
				aria-label={m.lightbox_close_label()}
				class="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>

			<img
				src={`data:image/jpeg;base64,${image}`}
				alt={m.lightbox_image_alt()}
				class="max-h-[80vh] w-auto rounded-xl shadow-2xl"
			/>

			<button
				onclick={download}
				class="mt-5 rounded-full bg-[#4e7352] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3d5c42]"
			>
				{m.lightbox_download()}
			</button>
		</div>
	</div>
{/if}
