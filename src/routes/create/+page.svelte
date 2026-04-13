<script lang="ts">
	import MountainSilhouette from '$lib/components/layout/MountainSilhouette.svelte';
	import Dropzone from '$lib/components/Dropzone.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let fitFile: File | null = $state(null);
	let photoFile: File | null = $state(null);
</script>

<svelte:head>
	<title>Create Your Card — GritShot</title>
</svelte:head>

<div
	class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]"
	style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;"
>
	<!-- Content -->
	<section class="mx-auto max-w-3xl px-6 pt-12 pb-24">
		<!-- Decorative mountain silhouette -->
		<MountainSilhouette />

		<!-- Header -->
		<div class="relative mb-10 text-center">
			<h1 class="mb-5 text-4xl leading-tight font-bold sm:text-5xl">Create Your Card</h1>
			<p class="text-lg leading-relaxed text-[#4a5e43]">
				Upload your Garmin FIT file and a trail photo to generate your shareable card.
			</p>
		</div>

		<!-- Upload Grid -->
		<form method="POST" enctype="multipart/form-data">
			<div class="grid gap-5 sm:grid-cols-2">
				<Dropzone
					name="fitFile"
					accept=".fit,.zip"
					step="Step 1"
					title="Garmin FIT File"
					label="Drop your FIT file here"
					hint=".fit or .zip accepted"
					validate={(f) => f.name.endsWith('.fit') || f.name.endsWith('.zip')}
					bind:file={fitFile}
				>
					{#snippet icon()}
						<svg
							class="h-5 w-5 text-[#4e7352]"
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
					{/snippet}
				</Dropzone>

				<Dropzone
					name="photoFile"
					accept=".jpg,image/jpeg"
					step="Step 2"
					title="Trail Photo"
					label="Drop your photo here"
					hint=".jpg accepted"
					validate={(f) => f.type === 'image/jpeg' || f.name.toLowerCase().endsWith('.jpg')}
					bind:file={photoFile}
				>
					{#snippet icon()}
						<svg
							class="h-5 w-5 text-[#4e7352]"
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
					{/snippet}
				</Dropzone>
			</div>

			<!-- Error message -->
			{#if form?.error}
				<div class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<!-- Generate Button -->
			<div class="mt-4">
				<button
					type="submit"
					disabled={!fitFile || !photoFile}
					class="w-full rounded-full py-3.5 text-base font-semibold transition-colors
					{fitFile && photoFile
						? 'cursor-pointer bg-[#4e7352] text-white shadow-sm hover:bg-[#3d5c42]'
						: 'cursor-not-allowed bg-[#c8d9ca] text-[#9ab89e]'}"
				>
					{#if !fitFile && !photoFile}
						Upload both files to continue
					{:else if !fitFile}
						Upload your FIT file to continue
					{:else if !photoFile}
						Upload your photo to continue
					{:else}
						Generate Card
					{/if}
				</button>
			</div>
		</form>
	</section>
</div>

<Lightbox image={form?.image} />
