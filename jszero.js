self.importScripts("nativeEX.js");

var newNow = function()
{
	return Math.floor(orig_now / 1000.0) * 1000.0;
}

var newBack = function()
{
	return;
}

nativeEX.addWrap("window.performance", "now", newNow, false, false);
nativeEX.addWrap("history", "back", newBack, false, false);

fInit.addApp(nativeEX);
