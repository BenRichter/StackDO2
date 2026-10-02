import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Static SPA build (./build) – deployable anywhere, wrappable with Capacitor for Android/iOS.
		adapter: adapter({ fallback: 'index.html' }),
		// BASE_PATH is set by the GitHub Pages workflow (e.g. /StackDO2); empty for local/root hosting
		paths: { base: process.env.BASE_PATH ?? '', relative: true }
	}
};

export default config;
