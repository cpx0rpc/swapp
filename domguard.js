// https://github.com/mathiasbynens/he
self.importScripts("he.js");

let USE_HE = true;

var appObj = new Object();

appObj.reqMatch = function(fObj)
{
	let url = new URL(fObj.getMetadata().url);

	if(url.hash)
	{
		return true;
	}

	return false;
};

appObj.reqApply = async function(fObj)
{
	let url = new URL(fObj.getMetadata().url);

	if(he.encode(decodeURIComponent(url.hash)) != decodeURIComponent(url.hash))
	{
		fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
		fObj.setBody("[Error] Potential DOM-XSS payload");
		fObj.setDecision("cache");

		// Add to whitelist if user prefer
	}

	return fObj;
};

f2fInst.addApp(appObj);
