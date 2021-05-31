self.importScripts("nativeEX.js");

var newNow = function()
{
	return Math.floor(orig_now / 1000.0) * 1000.0;
}

var newBack = function()
{
	return;
}

var newGetBattery = function()
{
	// Can show a prompt like in JSZero. Here we simply deny.
	return;
}

nativeEX.addWrap("window.performance", "now", newNow, false, false);
nativeEX.addWrap("history", "back", newBack, false, false);
nativeEX.addWrap("navigator", "getBattery", newGetBattery, false, false);

f2fInst.addApp(nativeEX);
