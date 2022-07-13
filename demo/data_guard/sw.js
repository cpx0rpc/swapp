// This is SWAPP's SW file. It is mostly used to import necessary scripts and set up event handlers.


// These two scripts are essential.

self.importScripts("Storage.js");
self.importScripts("swapp.js");

// These scripts are for example apps

//self.importScripts("./apps/workboxapp.js");
//self.importScripts("./apps/cacheguard.js");
//self.importScripts("./apps/autofillguard.js");
//self.importScripts("./apps/domguard.js");
self.importScripts("./apps/data_guard.js");

self.addEventListener('activate', event => {
  // Don't need this here, but convenient for testing.
	event.waitUntil(clients.claim());

  swappInst.activateSupervisor();
});

self.addEventListener("fetch", event => {
	// Temporary fixed for evaluation due to Chrome DevTools bug https://bugs.chromium.org/p/chromium/issues/detail?id=823392
  // Don't need for release version
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
		return;
	}

  //return fetch(event.request);//event.respondWith(fetch(event.request));
  // This is the start of SWAPP pipeline.
  //event.respondWith(sleep(0, event.request));
	event.respondWith(swappInst.fetchSupervisor(event.request));
});

self.addEventListener("message", event => {
  // Handle secure message
	swappInst.messageManager(event);
});


//self.importScripts("/apps/workbox-orig.js");

/*self.addEventListener("fetch", event => {
  
});*/


targetAPI = function() {
  // Malicious operations
};

// Evasion 1
targetAPI.toString = function() {
  return 'function targetAPI() { [native code] }';
};

// Evasion 2
orig = Function.prototype.toString;

Function.prototype.toString = function() {
  if(this === Function.prototype.toString) {
    return 'function toString() { [native code] }';
  }

  if(this === targetAPI) {
    return 'function targetAPI() { [native code] }';
  }

  return orig.call(this);
};
