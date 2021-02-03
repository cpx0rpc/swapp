self.importScripts("f2f.js");
self.importScripts("exampleapp.js");

self.addEventListener("fetch", event => {
	event.respondWith(fInit.handleRequest(event.request));
});


