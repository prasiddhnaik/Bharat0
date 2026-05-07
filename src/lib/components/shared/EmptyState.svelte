<script lang="ts">
	let { title, message }: { title: string; message: string } = $props();
</script>

<div class="rounded-lg border border-dashed border-[var(--bz-border)] bg-[var(--bz-surface)] p-8 text-center">
	<p class="text-sm font-semibold text-[var(--bz-text-1)]">{title}</p>
	<p class="mt-2 text-sm text-[var(--bz-text-2)]">{message}</p>
</div>
