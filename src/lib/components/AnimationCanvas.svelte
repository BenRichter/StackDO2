<script lang="ts">
	import { runAnimation, getRandomAnimation } from '$lib/utils/animations';

	let {
		active = false,
		onDone
	}: {
		active?: boolean;
		onDone?: () => void;
	} = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		if (active && canvas) {
			const type = getRandomAnimation();
			runAnimation(canvas, type);
			// Vibration feedback (mobile)
			if (navigator.vibrate) {
				navigator.vibrate([100, 50, 100]);
			}
			setTimeout(() => {
				if (onDone) onDone();
			}, 2800);
		}
	});
</script>

{#if active}
	<canvas bind:this={canvas} class="animation-canvas"></canvas>
{/if}

<style>
	.animation-canvas {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 200;
	}
</style>
