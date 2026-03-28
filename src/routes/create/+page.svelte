<script lang="ts">
	import { resolve } from '$app/paths';
	import logo from '$lib/assets/logo.800px.png';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let fitFile: File | null = $state(null);
	let photoFile: File | null = $state(null);

	let fitDragOver = $state(false);
	let photoDragOver = $state(false);

	function handleFitDrop(e: DragEvent) {
		e.preventDefault();
		fitDragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file && (file.name.endsWith('.fit') || file.name.endsWith('.zip'))) {
			fitFile = file;
		}
	}

	function handlePhotoDrop(e: DragEvent) {
		e.preventDefault();
		photoDragOver = false;
		const file = e.dataTransfer?.files[0];
		if (file && (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg'))) {
			photoFile = file;
		}
	}

	function handleFitInput(e: Event) {
		const input = e.target as HTMLInputElement;
		fitFile = input.files?.[0] ?? null;
	}

	function handlePhotoInput(e: Event) {
		const input = e.target as HTMLInputElement;
		photoFile = input.files?.[0] ?? null;
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:head>
	<title>Create Your Card — GritShot</title>
</svelte:head>

<div
	class="min-h-screen bg-[#f5f1e6] text-[#2a3d2c]"
	style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;"
>
	<!-- Navigation -->
	<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<div class="flex items-center gap-2.5">
			<a href={resolve('/')} class="text-lg font-semibold tracking-tight hover:opacity-80"
				>GritShot</a
			>
		</div>
		<a
			href={resolve('/')}
			class="rounded-full bg-[#4e7352] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3d5c42]"
		>
			Homepage
		</a>
	</nav>

	<!-- Content -->
	<section class="mx-auto max-w-3xl px-6 pt-12 pb-24">

		<!-- Decorative mountain silhouette -->
		<div
			class="pointer-events-none absolute right-0 left-0 -mt-4 flex justify-center opacity-[0.05]"
		>
			<svg
				viewBox="0 0 800 200"
				class="w-full max-w-4xl"
				fill="#2a3d2c"
				xmlns="http://www.w3.org/2000/svg"
			>
				<polygon points="0,200 120,60 240,140 360,20 480,120 600,50 720,130 800,80 800,200" />
			</svg>
		</div>

		<!-- Header -->
		<div class="relative mb-10 text-center">
			<img src={logo} alt="GritShot" class="mx-auto mb-8 h-56 w-56 object-contain drop-shadow-md" />
			
			<h1 class="mb-5 text-4xl leading-tight font-bold sm:text-5xl">Create Your Card</h1>
			<p class="text-lg leading-relaxed text-[#4a5e43]">
				Upload your Garmin FIT file and a trail photo to generate your shareable card.
			</p>
		</div>

		<!-- Upload Grid -->
		<form method="POST" enctype="multipart/form-data">
		<div class="grid gap-5 sm:grid-cols-2">
			<!-- FIT File Upload -->
			<div class="flex flex-col">
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
								d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253"
							/>
						</svg>
					</div>
					<div>
						<div class="text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">Step 1</div>
						<h2 class="font-semibold">Garmin FIT File</h2>
					</div>
				</div>

				<label
					class="group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors
						{fitDragOver
						? 'border-[#4e7352] bg-[#eaf0eb]'
						: fitFile
							? 'border-[#4e7352] bg-[#eaf0eb]/60'
							: 'border-[#c8d9ca] bg-white/60 hover:border-[#9ab89e] hover:bg-white/80'}"
					ondragover={(e) => {
						e.preventDefault();
						fitDragOver = true;
					}}
					ondragleave={() => (fitDragOver = false)}
					ondrop={handleFitDrop}
				>
					<input
						type="file"
						name="fitFile"
						accept=".fit,.zip"
						class="sr-only"
						onchange={handleFitInput}
					/>

					{#if fitFile}
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
							<span class="max-w-full truncate text-sm font-medium text-[#2a3d2c]"
								>{fitFile.name}</span
							>
							<span class="text-xs text-[#9ab89e]">{formatFileSize(fitFile.size)}</span>
							<span class="text-xs text-[#4e7352]">Click to replace</span>
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
								<p class="text-sm font-medium text-[#2a3d2c]">Drop your FIT file here</p>
								<p class="mt-0.5 text-xs text-[#9ab89e]">or click to browse</p>
							</div>
							<p class="text-xs text-[#9ab89e]">.fit or .zip accepted</p>
						</div>
					{/if}
				</label>
			</div>

			<!-- Photo Upload -->
			<div class="flex flex-col">
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
								d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
							/>
						</svg>
					</div>
					<div>
						<div class="text-xs font-semibold tracking-widest text-[#9ab89e] uppercase">Step 2</div>
						<h2 class="font-semibold">Trail Photo</h2>
					</div>
				</div>

				<label
					class="group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors
						{photoDragOver
						? 'border-[#4e7352] bg-[#eaf0eb]'
						: photoFile
							? 'border-[#4e7352] bg-[#eaf0eb]/60'
							: 'border-[#c8d9ca] bg-white/60 hover:border-[#9ab89e] hover:bg-white/80'}"
					ondragover={(e) => {
						e.preventDefault();
						photoDragOver = true;
					}}
					ondragleave={() => (photoDragOver = false)}
					ondrop={handlePhotoDrop}
				>
					<input
						type="file"
						name="photoFile"
						accept=".jpg,image/jpeg"
						class="sr-only"
						onchange={handlePhotoInput}
					/>

					{#if photoFile}
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
							<span class="max-w-full truncate text-sm font-medium text-[#2a3d2c]"
								>{photoFile.name}</span
							>
							<span class="text-xs text-[#9ab89e]">{formatFileSize(photoFile.size)}</span>
							<span class="text-xs text-[#4e7352]">Click to replace</span>
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
								<p class="text-sm font-medium text-[#2a3d2c]">Drop your photo here</p>
								<p class="mt-0.5 text-xs text-[#9ab89e]">or click to browse</p>
							</div>
							<p class="text-xs text-[#9ab89e]">.jpg accepted</p>
						</div>
					{/if}
				</label>
			</div>
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
					? 'bg-[#4e7352] text-white shadow-sm hover:bg-[#3d5c42] cursor-pointer'
					: 'bg-[#c8d9ca] text-[#9ab89e] cursor-not-allowed'}"
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
