// The current implementation of DOM Guard utilizes an existing filter as a proof-of-concept. 
// However, we can apply more sophisticated techniques if needed. 

// https://github.com/mathiasbynens/he
self.importScripts("./apps/he.js");

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
let DG_ENABLE = true;

var domguard = new Object();

domguard.appname = "DOMGUARD";
domguard.reqMatch = function(fObj)
{
  if(DG_ENABLE)
  {
	  if(!fObj.getMetadata().url)
	  {
		  return false;
	  }

	  let url = getLocation(fObj.getMetadata().url);

	  if(url.hash || url.search)
	  {
		  return true;
	  }

	  return false;
  }
};

domguard.reqAction = async function(fObj)
{
  if(DG_ENABLE)
  {
	  let url = getLocation(fObj.getMetadata().url);

	  if((he.encode(decodeURIComponent(url.hash)) != decodeURIComponent(url.hash)) || (he.encode(decodeURIComponent(url.search)) != decodeURIComponent(url.search)))
	  {
		  fObj.setMeta({"status": 200, "url": fObj.getMetadata().url.toString(), "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
		  fObj.setBody("[DG] Potential DOM-XSS payload detected");
		  fObj.setDecision("cache");

		  // Add to whitelist if user prefer
	  }
  }

  return fObj;
};

domguard.msgLabel = ["domguard"];
domguard.msgHandler = function(label, msg) {
  if(msg == "enable") 
  {
    DG_ENABLE = true;
  }
  else if(msg == "disable") 
  {
    DG_ENABLE = false;  
  }
}

domguard.tcbMatch = true;
domguard.tcbAction = `

document.addEventListener("enableDOMGuard", () => { 
  sendMsg(["domguard"], "enable");
});
document.addEventListener("disableDOMGuard", () => {
  sendMsg(["domguard"], "disable");
});
`;

console.log("[D]OM[G]uard activated");
swappInst.addApp(domguard);
