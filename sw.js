self.importScripts("f2f.js");
self.importScripts("exampleapp.js");
self.importScripts("jsencrypt.min.js");
self.importScripts("integrity_checker.js");

self.addEventListener("fetch", event => {
	event.respondWith(fInit.handleRequest(event.request));
});


