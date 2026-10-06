<script lang="ts">
	import { runAnimation, getRandomAnimation } from '$lib/utils/animations';

	/** Increment `trigger` to fire one short celebration. Never blocks the UI. */
	let { trigger = 0 }: { trigger?: number } = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		if (trigger && canvas) {
			runAnimation(canvas, getRandomAnimation());
			navigator.vibrate?.([60, 40, 60]);
		}
	});
</script>

<canvas bind:this={canvas} class="animation-canvas" aria-hidden="true"></canvas>

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
