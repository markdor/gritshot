<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';

	let { data, form } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>{m.garmin_connect_meta_title()}</title>
</svelte:head>

<div class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]">
	<main class="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
		<header class="space-y-2 text-center">
			<h1 class="text-3xl font-semibold tracking-tight">{m.garmin_connect_heading()}</h1>
			<p class="text-sm text-[#4a5e43]">{m.garmin_connect_subtitle()}</p>
		</header>

		{#if data.connected}
			<div
				role="status"
				class="rounded-lg border border-[#4e7352]/40 bg-[#4e7352]/10 px-4 py-3 text-sm text-[#2a3d2c]"
			>
				{m.garmin_connected_status()}
			</div>

			<a
				href={resolve('/garmin/create')}
				class="w-full rounded-full bg-[#4e7352] px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#5a8560]"
			>
				{m.garmin_connected_pick_activity()}
			</a>

			<form
				method="POST"
				action="?/disconnect"
				class="space-y-2"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-full border border-amber-700/40 px-5 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{m.garmin_disconnect_button()}
				</button>
				<p class="text-center text-xs text-[#4a5e43]/80">{m.garmin_disconnect_confirm()}</p>
			</form>
		{:else}
			{#if form?.error}
				<div
					role="alert"
					class="rounded-lg border border-amber-700/40 bg-amber-100 px-4 py-3 text-sm text-amber-900"
				>
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				action="?/connect"
				class="space-y-4"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<div class="space-y-1.5">
					<label for="email" class="block text-sm font-medium">
						{m.garmin_connect_email_label()}
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="off"
						required
						value={form?.email ?? ''}
						class="w-full rounded-lg border border-[#4e7352]/40 bg-white px-4 py-2.5 text-sm text-[#2a3d2c] placeholder:text-[#4a5e43]/60 focus:border-[#4e7352] focus:outline-none"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="password" class="block text-sm font-medium">
						{m.garmin_connect_password_label()}
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						class="w-full rounded-lg border border-[#4e7352]/40 bg-white px-4 py-2.5 text-sm text-[#2a3d2c] placeholder:text-[#4a5e43]/60 focus:border-[#4e7352] focus:outline-none"
					/>
				</div>
				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-full bg-[#4e7352] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5a8560] disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? m.garmin_connect_submitting() : m.garmin_connect_submit()}
				</button>
				<p class="text-xs text-[#4a5e43]/80">{m.garmin_connect_credentials_notice()}</p>
			</form>
		{/if}
	</main>
</div>
