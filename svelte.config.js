import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Static SPA build (./build) – deployable anywhere, wrappable with Capacitor for Android/iOS.
		adapter: adapter({ fallback: 'index.html' }),
		paths: { relative: true }
	}
};

export default config;
