self.importScripts("f2f.js");
self.importScripts("exampleapp.js");
self.importScripts("jsencrypt.min.js");
self.importScripts("integrity_checker.js");
self.importScripts("esprima.js");
self.importScripts("estraverse.js");
self.importScripts("escodegen.browser.js");
self.importScripts("trusted_code_block_sw.js");

self.addEventListener("fetch", event => {
	event.respondWith(fInit.handleRequest(event.request));
});

self.addEventListener("message", event => {
	fInit.handleMessage(event.data);
});

