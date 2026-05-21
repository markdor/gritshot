<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';

	type LayoutUser = { id: string; username: string; isAdmin: boolean };
	let { user }: { user: LayoutUser | null } = $props();

	let open = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function onDocumentClick(event: MouseEvent) {
		if (!open) return;
		if (containerEl && !containerEl.contains(event.target as Node)) {
			close();
		}
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) close();
	}
</script>

<svelte:document onclick={onDocumentClick} onkeydown={onKey} />

{#if !user}
	<a
		href={resolve('/login')}
		class="rounded-full border border-[#4e7352]/60 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4e7352]/30"
	>
		{m.nav_login_button()}
	</a>
{:else}
	<div class="relative" bind:this={containerEl}>
		<button
			type="button"
			onclick={toggle}
			aria-haspopup="menu"
			aria-expanded={open}
			class="flex items-center gap-1.5 rounded-full border border-[#4e7352]/60 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4e7352]/30"
		>
			<span>{user.username}</span>
			<svg
				viewBox="0 0 12 12"
				class="size-3 text-white/70 transition-transform"
				class:rotate-180={open}
				aria-hidden="true"
			>
				<path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
			</svg>
		</button>
		{#if open}
			<div
				role="menu"
				class="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-[#4e7352]/40 bg-[#1e2e1f] py-1 text-sm shadow-lg"
			>
				{#if user.isAdmin}
					<a
						role="menuitem"
						href={resolve('/admin')}
						onclick={close}
						class="block px-4 py-2 text-white/90 hover:bg-[#4e7352]/30 hover:text-white"
					>
						{m.nav_user_admin()}
					</a>
				{/if}
				<form method="POST" action={resolve('/logout')}>
					<button
						role="menuitem"
						type="submit"
						class="block w-full px-4 py-2 text-left text-white/90 hover:bg-[#4e7352]/30 hover:text-white"
					>
						{m.nav_user_logout()}
					</button>
				</form>
			</div>
		{/if}
	</div>
{/if}
