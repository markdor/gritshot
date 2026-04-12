<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<nav class="border-b border-[#1e2e1f] bg-[#2a3d2c]">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<div class="flex items-center gap-2.5">
			<a
				href={resolve('/')}
				class="text-lg font-semibold tracking-tight text-white hover:opacity-80">GritShot</a
			>
		</div>
		<a
			href={resolve('/create')}
			class="rounded-full bg-[#4e7352] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a8560]"
		>
			Create Your Card
		</a>
	</div>
</nav>
