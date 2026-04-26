<script lang="ts">
	let { rows = 3 }: { rows?: number } = $props();
</script>

<div class="space-y-3" aria-label="Loading skeleton">
	{#each Array.from({ length: rows }) as _}
		<div class="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/70"></div>
	{/each}
</div>
