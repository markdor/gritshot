<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import HeroLogo from '$lib/components/layout/HeroLogo.svelte';
	import Dropzone from '$lib/components/Dropzone.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { compressPhoto } from '$lib/client/compressPhoto';
	import { m } from '$lib/paraglide/messages';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function truncate(s: string): string {
		return s.length > 28 ? s.slice(0, 28) : s;
	}

	// Activities come from the server load and won't reactively change in this
	// page's lifecycle — untrack() seeds the initial state without making
	// Svelte think we want a reactive subscription.
	const initialActivity = untrack(() =>
		data.connected && data.activities && data.activities.length > 0 ? data.activities[0] : null
	);

	let selectedActivityId = $state<number | null>(initialActivity?.activityId ?? null);
	let title = $state(initialActivity ? truncate(initialActivity.name) : '');
	let photoFile: File | null = $state(null);
	let sendEmail = $state(false);
	let generating = $state(false);
	let compressingPhoto = $state(false);
	let uploadsLocked = $derived(generating || compressingPhoto);

	function onPickActivity(id: number, name: string) {
		selectedActivityId = id;
		title = truncate(name);
	}

	function formatDistance(km: number): string {
		return `${km.toFixed(2)} km`;
	}
	function formatDuration(sec: number): string {
		const h = Math.floor(sec / 3600);
		const m = Math.floor((sec % 3600) / 60);
		return `${h}:${String(m).padStart(2, '0')} h`;
	}
	function formatElevation(meters: number): string {
		return `${Math.round(meters)} m`;
	}
	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{m.garmin_create_meta_title()}</title>
</svelte:head>

<div
	class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]"
	style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;"
>
	<section class="mx-auto max-w-3xl px-6 pt-12 pb-24">
		<HeroLogo />

		<div class="relative mb-10 text-center">
			<h1 class="mb-5 text-4xl leading-tight font-bold sm:text-5xl">
				{m.garmin_create_heading()}
			</h1>
			<p class="text-lg leading-relaxed text-[#4a5e43]">{m.garmin_create_subtitle()}</p>
		</div>

		{#if !data.connected}
			<div
				class="flex flex-col items-center gap-5 rounded-2xl border border-[#4e7352]/30 bg-white/60 px-6 py-12 text-center"
			>
				<h2 class="text-2xl font-semibold">{m.garmin_create_empty_heading()}</h2>
				<p class="max-w-md text-sm text-[#4a5e43]">{m.garmin_create_empty_subtitle()}</p>
				<a
					href={resolve('/garmin/connect')}
					class="rounded-full bg-[#4e7352] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5a8560]"
				>
					{m.garmin_create_connect_cta()}
				</a>
			</div>
		{:else}
			{#if data.error}
				<div
					role="alert"
					class="mb-5 rounded-xl border border-amber-700/40 bg-amber-100 px-4 py-3 text-sm text-amber-900"
				>
					{data.error}
				</div>
			{/if}

			{#if !data.activities || data.activities.length === 0}
				<div
					class="rounded-2xl border border-[#4e7352]/30 bg-white/60 px-6 py-12 text-center text-sm text-[#4a5e43]"
				>
					{m.garmin_create_no_recent_activities()}
				</div>
			{:else}
				<form
					method="POST"
					enctype="multipart/form-data"
					use:enhance={() => {
						generating = true;
						return async ({ update, result }) => {
							await update();
							generating = false;
							if (result.type === 'success') {
								photoFile = null;
								sendEmail = false;
							}
						};
					}}
				>
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
										d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
									/>
								</svg>
							</div>
							<div>
								<div class="text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">
									{m.create_step_1_label()}
								</div>
								<h2 class="font-semibold">{m.garmin_create_activity_picker_heading()}</h2>
							</div>
						</div>
						<input type="hidden" name="activityId" value={selectedActivityId ?? ''} />
						<div
							class="grid gap-3"
							role="radiogroup"
							aria-label={m.garmin_create_activity_select_one()}
						>
							{#each data.activities as a (a.activityId)}
								{@const active = selectedActivityId === a.activityId}
								<button
									type="button"
									role="radio"
									aria-checked={active}
									onclick={() => onPickActivity(a.activityId, a.name)}
									class="flex flex-col gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors
									{active ? 'border-[#4e7352] bg-[#eaf0eb]' : 'border-[#c8d9ca] bg-white/60 hover:border-[#9ab89e]'}"
								>
									<div class="flex items-baseline justify-between gap-3">
										<span class="font-semibold text-[#2a3d2c]">{a.name}</span>
										<span class="text-xs text-[#9ab89e]">{formatDate(a.startTimeLocal)}</span>
									</div>
									<div class="flex flex-wrap gap-3 text-xs text-[#4a5e43]">
										<span>{a.type}</span>
										<span>·</span>
										<span>{formatDistance(a.distanceKm)}</span>
										<span>·</span>
										<span>{formatElevation(a.elevationM)}</span>
										<span>·</span>
										<span>{formatDuration(a.durationSec)}</span>
									</div>
								</button>
							{/each}
						</div>
					</div>

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

					<Dropzone
						name="photoFile"
						accept=".jpg,image/jpeg"
						step={m.create_step_3_label()}
						title={m.create_photo_title()}
						label={m.create_photo_label()}
						hint={m.create_photo_hint()}
						validate={(f) => f.type === 'image/jpeg' || f.name.toLowerCase().endsWith('.jpg')}
						bind:file={photoFile}
						transform={compressPhoto}
						bind:processing={compressingPhoto}
						transformErrorMessage={m.error_photo_processing_failed()}
						disabled={uploadsLocked}
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

					<label class="mt-5 flex items-center gap-2 text-sm text-[#2a3d2c]">
						<input
							type="checkbox"
							name="sendEmail"
							bind:checked={sendEmail}
							class="h-4 w-4 rounded border-[#c8d9ca] text-[#4e7352] focus:ring-[#4e7352]"
						/>
						{m.garmin_create_email_checkbox_label()}
					</label>

					{#if form?.error}
						<div
							class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
						>
							{form.error}
						</div>
					{/if}

					<div class="mt-4">
						<button
							type="submit"
							disabled={!title ||
								!selectedActivityId ||
								!photoFile ||
								generating ||
								compressingPhoto}
							class="flex w-full items-center justify-center gap-3 rounded-full py-3.5 text-base font-semibold transition-colors
							{title && selectedActivityId && photoFile && !generating && !compressingPhoto
								? 'cursor-pointer bg-[#4e7352] text-white shadow-sm hover:bg-[#3d5c42]'
								: generating || compressingPhoto
									? 'cursor-wait bg-[#4e7352] text-white shadow-sm'
									: 'cursor-not-allowed bg-[#c8d9ca] text-[#9ab89e]'}"
						>
							{#if compressingPhoto}
								<Spinner />
								{m.create_compressing_photo()}
							{:else if generating}
								<Spinner />
								{m.create_generating()}
							{:else if !selectedActivityId}
								{m.garmin_create_button_select_activity()}
							{:else if !title}
								{m.create_button_enter_title()}
							{:else if !photoFile}
								{m.create_button_upload_photo()}
							{:else}
								{m.create_button_generate()}
							{/if}
						</button>
					</div>
				</form>
			{/if}
		{/if}
	</section>
</div>

{#if generating || compressingPhoto}
	<div
		role="status"
		aria-live="polite"
		aria-label={compressingPhoto ? m.create_compressing_photo() : m.create_generating()}
		class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-[#f5f1e6]/85 backdrop-blur-sm"
	>
		<Spinner class="h-14 w-14 text-[#4e7352]" />
		<p class="text-base font-semibold text-[#2a3d2c]">
			{compressingPhoto ? m.create_compressing_photo() : m.create_generating()}
		</p>
	</div>
{/if}

<Lightbox image={form?.image} title={form?.title ?? ''} />
