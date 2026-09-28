<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	onMount(() => {
		// Splash screen lives in app.html so it shows before JS loads; fade it once the app is up.
		const splash = document.getElementById('splash');
		if (splash) {
			setTimeout(() => {
				splash.classList.add('gone');
				setTimeout(() => splash.remove(), 400);
			}, 700);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
