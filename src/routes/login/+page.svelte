<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages';

	let { data, form } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>{m.login_meta_title()}</title>
</svelte:head>

<div class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]">
	<main class="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
		{#if !form?.sent}
			<header class="space-y-2 text-center">
				<h1 class="text-3xl font-semibold tracking-tight">{m.login_heading()}</h1>
				<p class="text-sm text-[#4a5e43]">{m.login_subtitle()}</p>
			</header>
		{/if}

		{#if data.error}
			<div
				role="alert"
				class="rounded-lg border border-amber-700/40 bg-amber-100 px-4 py-3 text-sm text-amber-900"
			>
				{m.login_error_link_invalid()}
			</div>
		{/if}

		{#if form?.sent}
			<div
				role="status"
				class="rounded-lg border border-[#4e7352]/40 bg-[#4e7352]/10 px-4 py-3 text-sm text-[#2a3d2c]"
			>
				{m.login_success_message()}
			</div>
		{:else}
			<form
				method="POST"
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
						{m.login_email_label()}
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						placeholder={m.login_email_placeholder()}
						value={form?.email ?? ''}
						class="w-full rounded-lg border border-[#4e7352]/40 bg-white px-4 py-2.5 text-sm text-[#2a3d2c] placeholder:text-[#4a5e43]/60 focus:border-[#4e7352] focus:outline-none"
					/>
					{#if form?.invalidEmail}
						<p class="text-xs text-amber-800">{m.login_invalid_email()}</p>
					{/if}
				</div>
				<button
					type="submit"
					disabled={submitting}
					class="w-full rounded-full bg-[#4e7352] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5a8560] disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? m.login_submitting() : m.login_submit_button()}
				</button>
			</form>
		{/if}
	</main>
</div>
