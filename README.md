# SWAPP (*S*ervice *W*orker *AP*plication *P*latform)

SWAPP is a centralized platform for both web developers and researchers to implement SW-based applications. 

## Installation

### Without Existing SW

1. Download our service worker bundle (*bundle.zip*) and extract it to the root web directory.
2. Edit the home page to register SWAPP's Service Worker file (*sw.js*). 

`navigator.serviceWorker.register("sw.js");`

3. Browser our catelog of applications or implement your own and save the apps in the *apps* folder.

4. Edit the service worker file (*sw.js*) to include the apps.

```
// These two scripts are essential.

self.importScripts("Storage.js");
self.importScripts("swapp.js");

// Import apps below. These two apps are examples.

self.importScripts("workboxapp.js");
self.importScripts("cacheguard.js");
```

5. Configure the apps accordingly (i.e., changing apps execution order or internal parameters) by editing the app files inside the *apps* folder. Read each app's [description](https://github.com/cpx0rpc/swapp/tree/main/apps) for more info.

### With Existing SW

1. Edit your service worker file to include SWAPP at the top of the file.

```
self.importScripts("Storage.js");
self.importScripts("swapp.js");
```

2. Inject our event's supervisor to the *activate*, *fetch*, and *message* events. Note that the supervisor for *activate* and *message* can co-exist with existing code inside the handlers, so they can be added at the top of the handler functions and should not interfere with existing code. On the other hand, the *fetch* supervisor will interfere with existing code such as *Workbox* library. See our paper for more information on how to wrap such library as a SWAPP app.

```
self.addEventListener('activate', event => {
  swappInst.handleActivate();
});

self.addEventListener("fetch", event => {
  event.respondWith(swappInst.handleRequest(event.request));
});

self.addEventListener("message", event => {
  swappInst.handleMessage(event);
});
```

3. Browser our catelog of applications or implement your own and save the apps in the *apps* folder.

4. Edit the service worker file (*sw.js*) to include the apps.

```
// These two scripts are essential.

self.importScripts("Storage.js");
self.importScripts("swapp.js");

// Import apps below. These two apps are examples.

self.importScripts("workboxapp.js");
self.importScripts("cacheguard.js");
```

5. Configure the apps accordingly (i.e., changing apps execution order or internal parameters) by editing the app files inside the *apps* folder. Read each app's [description](https://github.com/cpx0rpc/swapp/tree/main/apps) for more info.

## Applications
For further details such as app configurations, please see [Apps.](https://github.com/cpx0rpc/swapp/tree/main/apps)

| Name              | Status    | Description |
| -----------       | --------- | ----------- |
| Autofill Guard    | Under Dev | An application to help isolate auto-filled forms from being read by malicious scripts injected through XSS. |
| Cache Guard       | Finished | An application to mitigate side-channel timing attack as discussed by [Karami et al.](https://www.ndss-symposium.org/ndss-paper/awakening-the-webs-sleeper-agents-misusing-service-workers-for-privacy-leakage/) |
| Workbox-App       | Finished | An encapsulated Workbox library as a SWAPP app. Note that the actual Workbox file and configuration will still need to be generated as usual with a few lines of code editing. This app is more or less the wrapper. |
| CSP               | Under Dev | Text |
| Data Guard        | Under Dev | Text | 
| Dom Guard         | Under Dev | A simple skeleton code to implement SW-based XSS defenses such as XSS filtering. |
| Integrity Checker | Under Dev | Text |
| JSZero            | Under Dev | An application to mitigate side-channel attack discussed by [Schwarz et al.](https://www.ndss-symposium.org/wp-content/uploads/2018/02/ndss2018_07A-3_Schwarz_paper.pdf) This app implements a mini version of the proposed defense as a SWAPP app. |
| NativeEX          | Finished | A helper app to modify native APIs in the document context. |
| ReDoS Defense     | Under Dev | Text |
| X-Frame-Options   | Under Dev | Text |
