<script lang="ts">
	/** "=DO": stacked stripes (the stack, doubling as burger menu) + DO. */
	let { size = 28 }: { size?: number } = $props();
</script>

<span class="logo" style:--h="{size}px">
	<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
		<defs>
			<linearGradient id="logo-prime" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#ffb347" /><stop offset=".55" stop-color="#ff7a3d" /><stop offset="1" stop-color="#f0533a" />
			</linearGradient>
		</defs>
		<rect x="2" y="4" width="20" height="4.5" rx="1.2" fill="url(#logo-prime)" />
		<rect x="2" y="10.5" width="20" height="3.5" rx="1.2" fill="currentColor" opacity=".85" />
		<rect x="2" y="16" width="20" height="3.5" rx="1.2" fill="currentColor" opacity=".5" />
	</svg>
	<span class="do">DO</span>
</span>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--ink);
	}
	.do {
		font-size: calc(var(--h) * 0.92);
		line-height: 1;
		font-weight: 900;
		letter-spacing: -0.04em;
	}
</style>
