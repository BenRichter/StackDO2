<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { ui } from '$lib/stores/ui.svelte';

	let { children } = $props();

	onMount(() => {
		// Keep Chrome's install prompt so the menu can offer "App installieren"
		const onPrompt = (e: Event) => {
			e.preventDefault();
			ui.installPrompt = e as Event & { prompt: () => Promise<void> };
		};
		window.addEventListener('beforeinstallprompt', onPrompt);
		window.addEventListener('appinstalled', () => (ui.installPrompt = null));

		// Splash screen lives in app.html so it shows before JS loads; fade it once the app is up.
		const splash = document.getElementById('splash');
		if (splash) {
			setTimeout(() => {
				splash.classList.add('gone');
				setTimeout(() => splash.remove(), 400);
			}, 700);
		}
		return () => window.removeEventListener('beforeinstallprompt', onPrompt);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
