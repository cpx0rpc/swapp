self.importScripts("Storage.js");
self.importScripts("f2f.js");
self.importScripts("autofillguard.js");
self.importScripts("integrity_checker.js");
//self.importScripts("data_guard.js");
/*self.importScripts("jsencrypt.min.js");
self.importScripts("integrity_checker.js");
self.importScripts("esprima.js");
self.importScripts("estraverse.js");
self.importScripts("escodegen.browser.js");
self.importScripts("trusted_code_block_sw.js");*/

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", event => {
    event.respondWith(f2fInst.handleRequest(event.request));
});

self.addEventListener("message", event => {
    f2fInst.handleMessage(event);
});

