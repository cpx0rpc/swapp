// This is SWAPP's SW file. It is mostly used to import necessary scripts and set up event handlers.


// These two scripts are essential.

self.importScripts("Storage.js");
self.importScripts("swapp.js");


// These scripts are for example apps

/*
self.importScripts("workboxapp.js");
self.importScripts("cacheguard.js");
self.importScripts("autofillguard.js");
self.importScripts("domguard.js");
self.importScripts("jszero.js");
self.importScripts("integrity_checker.js");
self.importScripts("data_guard.js");
*/

self.addEventListener('activate', event => {
  // Don't need this here, but convenient for testing.
	event.waitUntil(clients.claim());
});

self.addEventListener("fetch", event => {
	// Temporary fixed for evaluation due to Chrome DevTools bug https://bugs.chromium.org/p/chromium/issues/detail?id=823392
  // Don't need for release version
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
		return;
	}

  // This is the start of SWAPP pipeline.
	event.respondWith(swappInst.handleRequest(event.request));
});

self.addEventListener("message", event => {
  // Handle secure message
	swappInst.handleMessage(event);
});

