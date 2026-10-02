/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Offline-first: cache the app shell, serve it from cache when the network is gone.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `stackdo-${version}`;
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			if (ASSETS.includes(url.pathname)) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}
			try {
				const res = await fetch(event.request);
				if (res.ok) cache.put(event.request, res.clone());
				return res;
			} catch {
				return (await cache.match(event.request)) ?? (await cache.match(`${sw.registration.scope}index.html`)) ?? Response.error();
			}
		})()
	);
});
