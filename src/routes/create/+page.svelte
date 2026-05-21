<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import HeroLogo from '$lib/components/layout/HeroLogo.svelte';
	import Dropzone from '$lib/components/Dropzone.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import { m } from '$lib/paraglide/messages';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let title = $state('');
	let fitFile: File | null = $state(null);
	let photoFile: File | null = $state(null);
	let generating = $state(false);
</script>

<svelte:head>
	<title>{m.create_meta_title()}</title>
</svelte:head>

<div
	class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]"
	style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;"
>
	<!-- Content -->
	<section class="mx-auto max-w-3xl px-6 pt-12 pb-24">
		<!-- Decorative mountain silhouette -->
		<HeroLogo />

		<!-- Header -->
		<div class="relative mb-10 text-center">
			<h1 class="mb-5 text-4xl leading-tight font-bold sm:text-5xl">{m.create_heading()}</h1>
			<p class="text-lg leading-relaxed text-[#4a5e43]">
				{m.create_subtitle()}
			</p>
		</div>

		{#if data.showGarminBanner}
			<a
				href={resolve('/garmin/create')}
				class="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#4e7352]/30 bg-white/60 px-4 py-3 text-sm text-[#2a3d2c] transition-colors hover:bg-white/80"
			>
				<span>{m.garmin_banner_text()}</span>
				<span class="font-semibold text-[#4e7352]">{m.garmin_banner_cta()} →</span>
			</a>
		{/if}

		<!-- Upload Grid -->
		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={() => {
				generating = true;
				return async ({ update, result }) => {
					await update();
					generating = false;
					if (result.type === 'success') {
						title = '';
						fitFile = null;
						photoFile = null;
					}
				};
			}}
		>
			<!-- Step 1: Activity Title -->
			<div class="mb-5">
				<div class="mb-3 flex items-center gap-3">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf0eb]">
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
								d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125"
							/>
						</svg>
					</div>
					<div>
						<div class="text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">
							{m.create_step_1_label()}
						</div>
						<h2 class="font-semibold">{m.create_step_1_title()}</h2>
					</div>
				</div>
				<div class="relative">
					<input
						type="text"
						name="title"
						maxlength="28"
						placeholder={m.create_title_placeholder()}
						bind:value={title}
						class="w-full rounded-2xl border-2 border-dashed border-[#c8d9ca] bg-white/60 px-5 py-4 text-base text-[#2a3d2c] placeholder-[#9ab89e] transition-colors outline-none focus:border-[#4e7352] focus:bg-white/80"
					/>
					<span class="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-[#9ab89e]">
						{title.length}/28
					</span>
				</div>
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<Dropzone
					name="fitFile"
					accept=".fit,.zip"
					step={m.create_step_2_label()}
					title={m.create_fit_title()}
					label={m.create_fit_label()}
					hint={m.create_fit_hint()}
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
					step={m.create_step_3_label()}
					title={m.create_photo_title()}
					label={m.create_photo_label()}
					hint={m.create_photo_hint()}
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
					disabled={!title || !fitFile || !photoFile || generating}
					class="flex w-full items-center justify-center gap-3 rounded-full py-3.5 text-base font-semibold transition-colors
					{title && fitFile && photoFile && !generating
						? 'cursor-pointer bg-[#4e7352] text-white shadow-sm hover:bg-[#3d5c42]'
						: generating
							? 'cursor-wait bg-[#4e7352] text-white shadow-sm'
							: 'cursor-not-allowed bg-[#c8d9ca] text-[#9ab89e]'}"
				>
					{#if generating}
						<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
							></path>
						</svg>
						{m.create_generating()}
					{:else if !title}
						{m.create_button_enter_title()}
					{:else if !fitFile && !photoFile}
						{m.create_button_upload_both()}
					{:else if !fitFile}
						{m.create_button_upload_fit()}
					{:else if !photoFile}
						{m.create_button_upload_photo()}
					{:else}
						{m.create_button_generate()}
					{/if}
				</button>
			</div>
		</form>
	</section>
</div>

{#if generating}
	<div
		role="status"
		aria-live="polite"
		aria-label={m.create_generating()}
		class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-[#f5f1e6]/85 backdrop-blur-sm"
	>
		<svg
			class="h-14 w-14 animate-spin text-[#4e7352]"
			fill="none"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
			></path>
		</svg>
		<p class="text-base font-semibold text-[#2a3d2c]">{m.create_generating()}</p>
	</div>
{/if}

<Lightbox image={form?.image} title={form?.title ?? ''} />
