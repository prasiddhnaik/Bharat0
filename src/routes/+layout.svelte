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
		content="Demo prototype for an India-specific civic legislative explorer with timeline, Bills, committees, questions, debates, Acts, and source readiness."
	/>
</svelte:head>

{@render children()}
