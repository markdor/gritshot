<script lang="ts">
	import type { Snippet } from 'svelte';
	import { m } from '$lib/paraglide/messages';

	interface Props {
		name: string;
		accept: string;
		step: string;
		title: string;
		label: string;
		hint: string;
		validate: (file: File) => boolean;
		file: File | null;
		icon: Snippet;
	}

	let {
		name,
		accept,
		step,
		title,
		label,
		hint,
		validate,
		file = $bindable(),
		icon
	}: Props = $props();

	let dragOver = $state(false);
	let inputEl: HTMLInputElement;

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const f = e.dataTransfer?.files[0];
		if (f && validate(f)) {
			file = f;
			const dt = new DataTransfer();
			dt.items.add(f);
			inputEl.files = dt.files;
		}
	}

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		file = input.files?.[0] ?? null;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="flex flex-col">
	<div class="mb-3 flex items-center gap-3">
		<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf0eb]">
			{@render icon()}
		</div>
		<div>
			<div class="text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">{step}</div>
			<h2 class="font-semibold">{title}</h2>
		</div>
	</div>

	<label
		class="group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors
		{dragOver
			? 'border-[#4e7352] bg-[#eaf0eb]'
			: file
				? 'border-[#4e7352] bg-[#eaf0eb]/60'
				: 'border-[#c8d9ca] bg-white/60 hover:border-[#9ab89e] hover:bg-white/80'}"
		ondragover={(e) => {
			e.preventDefault();
			dragOver = true;
		}}
		ondragleave={() => (dragOver = false)}
		ondrop={handleDrop}
	>
		<input bind:this={inputEl} type="file" {name} {accept} class="sr-only" onchange={handleInput} />

		{#if file}
			<div class="flex flex-col items-center gap-2">
				<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4e7352]/10">
					<svg
						class="h-6 w-6 text-[#4e7352]"
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
				<span class="max-w-full truncate text-sm font-medium text-[#2a3d2c]">{file.name}</span>
				<span class="text-xs text-[#9ab89e]">{formatFileSize(file.size)}</span>
				<span class="text-xs text-[#4e7352]">{m.dropzone_click_replace()}</span>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf0eb] transition-colors group-hover:bg-[#c4ddc7]"
				>
					<svg
						class="h-6 w-6 text-[#4e7352]"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
						/>
					</svg>
				</div>
				<div>
					<p class="text-sm font-medium text-[#2a3d2c]">{label}</p>
					<p class="mt-0.5 text-xs text-[#9ab89e]">{m.dropzone_or_browse()}</p>
				</div>
				<p class="text-xs text-[#9ab89e]">{hint}</p>
			</div>
		{/if}
	</label>
</div>
