<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>BharatZero</title>
	<meta
		name="description"
		content="Sandbox prototype for an India-specific civic legislative explorer with timeline, Bills, committees, questions, debates, Acts, and official source links."
	/>
</svelte:head>

{@render children()}
