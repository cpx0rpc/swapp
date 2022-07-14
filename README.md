# SWAPP (*S*ervice *W*orker *AP*plication *P*latform)

SWAPP is a centralized platform for both web developers and researchers to implement SW-based applications. 

## Installation

### Docker
1. Visit our Zenodo archive https://doi.org/10.5281/zenodo.6836214 and download the files.
2. Follow instructions in the README file provided in the artifact.

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
| [Autofill Guard](https://github.com/cpx0rpc/swapp/tree/main/apps#autofill-guard)    | Finished | An application to help isolate auto-filled forms from being read by malicious scripts injected through XSS. |
| [Cache Guard](https://github.com/cpx0rpc/swapp/tree/main/apps#cache-guard)       | Finished | An application to mitigate side-channel timing attack as discussed by [Karami et al.](https://www.ndss-symposium.org/ndss-paper/awakening-the-webs-sleeper-agents-misusing-service-workers-for-privacy-leakage/) |
| [Workbox-App](https://github.com/cpx0rpc/swapp/tree/main/apps#workbox-app)       | Finished | An encapsulated Workbox library as a SWAPP app. Note that the actual Workbox file and configuration will still need to be generated as usual with a few lines of code editing. This app is more or less the wrapper. |
| [Data Guard](https://github.com/cpx0rpc/swapp/tree/main/apps#data-guard)        | Finished | An application to reserve sensitive data in secure storage to protect it from being stolen by attackers in the document context | 
| [DOM Guard](https://github.com/cpx0rpc/swapp/tree/main/apps#dom-guard)         | Finished | A simple skeleton code to implement SW-based XSS defenses such as XSS filtering. |
| [Integrity Checker](https://github.com/cpx0rpc/swapp/tree/main/apps#integrity-checker) | Finished | An application to check the integrity of the content from the server-side |
| [JSZero](https://github.com/cpx0rpc/swapp/tree/main/apps#jszero)            | Finished | An application to mitigate side-channel attack discussed by [Schwarz et al.](https://www.ndss-symposium.org/wp-content/uploads/2018/02/ndss2018_07A-3_Schwarz_paper.pdf) This app implements a mini version of the proposed defense as a SWAPP app. |
| [NativeEX](https://github.com/cpx0rpc/swapp/tree/main/apps#nativeex)          | Finished | A helper app to modify native APIs in the document context. |
| [JSONP Guard](https://github.com/cpx0rpc/swapp/tree/main/apps#nativeex)          | Implementing | An application to validate JSONP return value to prevent JSONP XSS Attacks. |

## Composing a SWAPP App
SWAPP App operates based on events. A skeleton app would look like: 

```
var exampleApp = new Object();

exampleApp.msgLabel = ["example_app"];
exampleApp.msgHandler = function(label, msg) {
  if(msg == "command") do_command();
}

exampleApp.reqMatch = function(fObj)
{
	return true;
};

exampleApp.reqAction = function(fObj)
{
	return fObj;
};

exampleApp.respMatch = function(fObj)
{
	return true;
};

exampleApp.respAction = function(fObj)
{
	return fObj;
};

exampleApp.tcbMatch = true;
exampleApp.tcbAction = `
document.addEventListener("someCustomEvent", () => {
  sendMsg(["example_app"], "command");
});
`;

swappInst.addApp(exampleApp);
```

## APIs
### Events
#### reqMatch : Request match event
Input parameter: fObject

Return: Boolean

Example usage:
```
example.reqMatch = async function(fObj)
{
  let url = new URL(fObj.getMetadata().url);
  if(url == "targetURL") return true;
  else return false;
}
```
#### reqAction : Request Action event
Input parameter: fObject

Return: fObject

Example usage:
```
example.reqAction = async function(fObj)
{
  let url = new URL(fObj.getMetadata().url);
  
  if(condition_met)
  {
    fObj.setMeta({"status": 200, "url": url.toString(), "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
    fObj.setBody("[AG] Loading");
    fObj.setDecision("cache");
  }
  return fObj;
}
```
#### respMatch : Response match event
Input parameter: fObject

Return: Boolean

Example usage:
```
example.respMatch = async function(fObj)
{
  let url = new URL(fObj.getMetadata().url);
  if(url == "targetURL") return true;
  else return false;
}
```
#### respAction : Response Action event
Input parameter: fObject

Return: fObject

Example usage:
```
example.respAction = async function(fObj)
{
  fObj.setBody(swappInst.writeAfterMatch(fObj.getBody(), "new content", "target_text"));
  fObj.setDecision("dirty");
  return fObj;
}
```
#### tcbMatch : Trusted code block match event
Input parameter: fObject

Return: boolean

Example usage:
```
example.tcbMatch = async function(fObj)
{
  return true;
}
```
#### tcbAction : Trusted code block action event
Input parameter: none

Return: none

Example usage:
```
example.tcbAction = `
// Things to be added
document.addEventListener("someEvent", () => {
  sendMsg(["example_app"], "command");
});
`;
```
#### onswactivate : Service worker activation event
Input parameter: none

Return: none

Example usage:
```
example.onswactivate = async function() {
  await exampleApp.load();
}
```
#### msgLabel : Specify message labels that the apps want to receive
Input parameter: none

Return: Array

Example usage:
```
example.msgLabel = ["label1", "label2"];
```
#### msgHandler : Specify message handler
Input parameter: label (String), message (Type depend on sender)

Return: none

Example usage:
```
example..msgHandler = function(label, msg) {
  if(msg == "command") doCommand();
}
```

### Helper Functions
#### addApp : Add an app to SWAPP
Input parameter: app object

Return: none

Example usage:
```
swappInst.addApp(appObject);
```
#### writeAfterMatch : Insert content after the matching string
Input parameter: source (String), new content (String), matching text (String)

Return: String

Example usage:
```
fObj.setBody(swappInst.writeAfterMatch(fObj.getBody(), "\n\t<script src=\"" + randomelem + "\" async></script>", "<head>"));
```
#### writeBeforeMatch : Insert content before the matching string
Input parameter: source (String), new content (String), matching text (String)

Return: String

Example usage:
```
fObj.setBody(swappInst.writeBeforeMatch(fObj.getBody(), "\n\t<script src=\"" + randomelem + "\" async></script>", "<head>"));
```
#### broadcastMsg : Broadcast a message
Input parameter: label (Array of Strings), data 

Return: none

Example usage:
```
swappInst.broadcastMsg(["example_app"], data_object_or_text);
```
#### storage.get : Get data from specified database
Input parameter: database entry (String)

Return: Object

Example usage:
```
cacheGuard.session = await swappInst.storage.get("cacheGuard") || undefined;

if(!cacheGuard.session)
{
  cacheGuard.session = {};
  cacheGuard.session.allowedReferer = [self.location.hostname];
  cacheGuard.session.u = {};
  cacheGuard.session.k = {};
  cacheGuard.session.profile = {};
}
```
#### storage.set : Set data and save to a specified database entry
Input parameter: database entry (String), data object

Return: none

Example usage:
```
swappInst.storage.set("cacheGuard", cacheGuard.session);
```

### fObject APIs
#### setDecision : Set the decision of this particular request/response
Input parameter: String (any of "original", "dirty", "cache", "drop")

Return: none

Example usage:
```
fObj.setDecision("cache");
```
#### setMeta : Set the metadata of this particular request/response
Input parameter: [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) or [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object

Return: none

Example usage:
```
fObj.setMeta({"status": 200, "url": url.toString(), "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
```
#### setBody : Set the body of this particular request/response
Input parameter: String

Return: none

Example usage:
```
fObj.setBody("[AG] Loading");
```
#### getDecision : Get the current decision of this particular request/response
Input parameter: none

Return: String (any of "original", "dirty", "cache", "drop")

Example usage:
```
let d = fObj.getDecision();
```
#### getMetadata : Get the metadata of this particular request/response
Input parameter: none

Return: [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) or [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object

Example usage:
```
let contentType = fObj.getMetadata().headers.get("Content-Type"));
```
#### getOrigMetadata : Get the original metadata (without other apps tampering) of this particular request/response
Input parameter: none

Return: [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) or [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object

Example usage:
```
let contentType = fObj.getOrigMetadata().headers.get("Content-Type"));
```
#### getBody : Get the body of this particular request/response
Input parameter: none

Return: String

Example usage:
```
let webBody = fObj.getBody();
```
#### getOrigBody : Get the original body (without other apps tampering) of this particular request/response
Input parameter: none

Return: String

Example usage:
```
let webOrigBody = fObj.getOrigBody();
```

### Constants
#### appName : Specify the app name
Example usage:
```
exampleApp.appName = "Example Application";
```
#### reqOrder : Specify the order of execution of this app's request action handler
Example usage:
```
exampleApp.reqOrder = 1;
```
#### respOrder : Specify the order of execution of this app's response action handler
Example usage:
```
exampleApp.respOrder = 4;
```
#### tcbOrder : Specify the order of injection of this app's TCB block
Example usage:
```
exampleApp.tcbOrder = 10;
```
