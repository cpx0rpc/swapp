var wbApp = new Object();

wbApp.reqMatch = function(fObj)
{
	return true;
};

self.importScripts("workbox-sw.js");

swappInst.addApp(wbApp);


