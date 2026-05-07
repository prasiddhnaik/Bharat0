<script lang="ts">
	let { rows = 3 }: { rows?: number } = $props();
</script>

<div class="space-y-3" aria-label="Loading skeleton">
	{#each Array.from({ length: rows }) as _}
		<div class="h-16 animate-pulse rounded-lg border border-[var(--bz-border)] bg-[var(--bz-surface-2)]"></div>
	{/each}
</div>
