<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';

	let { data, form } = $props();

	const currentUserId = $derived(page.data.user?.id);

	let editing = $state<string | null>(null);

	function fieldErrorLabel(code: string | undefined): string | null {
		switch (code) {
			case 'required':
				return m.admin_field_required();
			case 'invalid':
				return m.admin_field_invalid();
			case 'taken':
				return m.admin_field_taken();
			default:
				return null;
		}
	}
</script>

<svelte:head>
	<title>{m.admin_meta_title()}</title>
</svelte:head>

<div class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]">
	<main class="mx-auto max-w-4xl space-y-10 px-6 py-12">
		<header class="space-y-1.5">
			<h1 class="text-3xl font-semibold tracking-tight">{m.admin_heading()}</h1>
			<p class="text-sm text-[#4a5e43]">{m.admin_subtitle()}</p>
		</header>

		{#if form?.action === 'delete' && form?.error === 'self_delete'}
			<div
				role="alert"
				class="rounded-lg border border-amber-700/40 bg-amber-100 px-4 py-3 text-sm text-amber-900"
			>
				{m.admin_error_self_delete()}
			</div>
		{/if}
		{#if form?.action === 'update' && form?.selfDemoteBlocked}
			<div
				role="status"
				class="rounded-lg border border-amber-700/40 bg-amber-100 px-4 py-3 text-sm text-amber-900"
			>
				{m.admin_warn_self_demote_blocked()}
			</div>
		{/if}

		<section class="space-y-4">
			<h2 class="text-lg font-semibold">{m.admin_create_heading()}</h2>
			<form
				method="POST"
				action="?/create"
				class="grid grid-cols-1 gap-4 rounded-xl border border-[#4e7352]/30 bg-white/60 p-5 sm:grid-cols-[1fr_1fr_auto_auto]"
				use:enhance={() =>
					async ({ update }) => {
						await update({ reset: true });
					}}
			>
				<label class="flex flex-col gap-1 text-xs font-medium">
					{m.admin_field_email()}
					<input
						name="email"
						type="email"
						required
						value={form?.action === 'create' ? (form.email ?? '') : ''}
						class="rounded-md border border-[#4e7352]/40 bg-white px-3 py-2 text-sm text-[#2a3d2c] placeholder:text-[#4a5e43]/60 focus:border-[#4e7352] focus:outline-none"
					/>
					{#if form?.action === 'create' && form?.fieldErrors?.email}
						<span class="text-xs text-amber-800">
							{fieldErrorLabel(form.fieldErrors.email)}
						</span>
					{/if}
				</label>
				<label class="flex flex-col gap-1 text-xs font-medium">
					{m.admin_field_username()}
					<input
						name="username"
						type="text"
						required
						value={form?.action === 'create' ? (form.username ?? '') : ''}
						class="rounded-md border border-[#4e7352]/40 bg-white px-3 py-2 text-sm text-[#2a3d2c] placeholder:text-[#4a5e43]/60 focus:border-[#4e7352] focus:outline-none"
					/>
					{#if form?.action === 'create' && form?.fieldErrors?.username}
						<span class="text-xs text-amber-800">
							{fieldErrorLabel(form.fieldErrors.username)}
						</span>
					{/if}
				</label>
				<label class="flex items-center gap-2 self-end text-xs font-medium">
					<input type="checkbox" name="isAdmin" class="size-4 accent-[#4e7352]" />
					{m.admin_field_admin()}
				</label>
				<button
					type="submit"
					class="self-end rounded-full bg-[#4e7352] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a8560]"
				>
					{m.admin_create_button()}
				</button>
			</form>
		</section>

		<section class="space-y-4">
			<h2 class="text-lg font-semibold">
				{m.admin_users_heading()} ({data.users.length})
			</h2>
			<div class="overflow-hidden rounded-xl border border-[#4e7352]/30">
				<table class="min-w-full divide-y divide-[#4e7352]/20 text-sm">
					<thead class="bg-[#4e7352]/15 text-left text-xs tracking-wide text-[#4a5e43] uppercase">
						<tr>
							<th class="px-4 py-3 font-semibold">{m.admin_field_email()}</th>
							<th class="px-4 py-3 font-semibold">{m.admin_field_username()}</th>
							<th class="px-4 py-3 font-semibold">{m.admin_field_admin()}</th>
							<th class="px-4 py-3 text-right font-semibold">{m.admin_actions_heading()}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[#4e7352]/15 bg-white/60">
						{#each data.users as u (u.id)}
							{@const isSelf = u.id === currentUserId}
							{@const isEditing = editing === u.id}
							<tr>
								{#if isEditing}
									<td colspan="4" class="px-4 py-3">
										<form
											method="POST"
											action="?/update"
											class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]"
											use:enhance={() =>
												async ({ update }) => {
													await update();
													editing = null;
												}}
										>
											<input type="hidden" name="id" value={u.id} />
											<input
												name="email"
												type="email"
												required
												value={u.email}
												class="rounded-md border border-[#4e7352]/40 bg-white px-3 py-2 text-sm text-[#2a3d2c] focus:border-[#4e7352] focus:outline-none"
											/>
											<input
												name="username"
												type="text"
												required
												value={u.username}
												class="rounded-md border border-[#4e7352]/40 bg-white px-3 py-2 text-sm text-[#2a3d2c] focus:border-[#4e7352] focus:outline-none"
											/>
											<label class="flex items-center gap-2 text-xs">
												<input
													type="checkbox"
													name="isAdmin"
													checked={u.isAdmin}
													disabled={isSelf}
													class="size-4 accent-[#4e7352]"
												/>
												{m.admin_field_admin()}
											</label>
											<button
												type="submit"
												class="rounded-full bg-[#4e7352] px-4 py-2 text-xs font-medium text-white hover:bg-[#5a8560]"
											>
												{m.admin_save_button()}
											</button>
											<button
												type="button"
												onclick={() => (editing = null)}
												class="rounded-full border border-[#4e7352]/30 px-4 py-2 text-xs font-medium text-[#4a5e43] hover:bg-[#4e7352]/10 hover:text-[#2a3d2c]"
											>
												{m.admin_cancel_button()}
											</button>
										</form>
									</td>
								{:else}
									<td class="px-4 py-3 font-mono text-xs">{u.email}</td>
									<td class="px-4 py-3">{u.username}</td>
									<td class="px-4 py-3">
										{#if u.isAdmin}
											<span
												class="rounded-full bg-[#4e7352]/20 px-2 py-0.5 text-xs font-medium text-[#2a3d2c]"
											>
												{m.admin_badge_admin()}
											</span>
										{:else}
											<span class="text-xs text-[#4a5e43]/60">—</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-right">
										<div class="flex justify-end gap-2">
											<button
												type="button"
												onclick={() => (editing = u.id)}
												class="rounded-full border border-[#4e7352]/30 px-3 py-1 text-xs font-medium text-[#4a5e43] hover:bg-[#4e7352]/10 hover:text-[#2a3d2c]"
											>
												{m.admin_edit_button()}
											</button>
											<form
												method="POST"
												action="?/delete"
												use:enhance={() =>
													async ({ update }) => {
														await update();
														await invalidateAll();
													}}
											>
												<input type="hidden" name="id" value={u.id} />
												<button
													type="submit"
													disabled={isSelf}
													title={isSelf ? m.admin_error_self_delete() : ''}
													class="rounded-full border border-amber-700/40 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
												>
													{m.admin_delete_button()}
												</button>
											</form>
										</div>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</main>
</div>
