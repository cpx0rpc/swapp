var wbApp = new Object();

wbApp.reqMatch = function(fObj)
{
	return true;
};

self.importScripts("workbox-sw.js");


console.log("[W]orkbox[A]pp activated");
f2fInst.addApp(wbApp);


