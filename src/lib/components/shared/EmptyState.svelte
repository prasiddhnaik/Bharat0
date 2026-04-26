<script lang="ts">
	let { title, message }: { title: string; message: string } = $props();
</script>

<div class="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
	<p class="text-sm font-semibold text-slate-200">{title}</p>
	<p class="mt-2 text-sm text-slate-500">{message}</p>
</div>
