// The current implementation of DOM Guard utilizes an existing filter as a proof-of-concept. 
// However, we can apply more sophisticated techniques if needed. 

// https://github.com/mathiasbynens/he
self.importScripts("he.js");

// Helper function from https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
function getLocation(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}

let USE_HE = true;

var domguard = new Object();

domguard.reqMatch = function(fObj)
{
	if(!fObj.getMetadata().url)
	{
		return false;
	}

	let url = getLocation(fObj.getMetadata().url);

	if(url.hash)
	{
		return true;
	}

	return false;
};

domguard.reqApply = async function(fObj)
{
	let url = getLocation(fObj.getMetadata().url);

	if(he.encode(decodeURIComponent(url.hash)) != decodeURIComponent(url.hash))
	{
		fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
		fObj.setBody("[DG] Potential DOM-XSS payload detected");
		fObj.setDecision("cache");

		// Add to whitelist if user prefer
	}

	return fObj;
};

console.log("[D]OM[G]uard activated");
swappInst.addApp(domguard);
