//
// Internal use for easy access of the IndexedDB
//
function Storage(name) {
  this.ready = new Promise((resolve, reject) => {
    var request = indexedDB.open('F2F_PRIVATE');

    request.onupgradeneeded = e => {
      this.db = e.target.result;
      this.db.createObjectStore('store');
    };

    request.onsuccess = e => {
      this.db = e.target.result;
      resolve();
    };

    request.onerror = e => {
      this.db = e.target.result;
      reject(e);
    };
  });
}

Storage.prototype.get = function(key) {
  return this.ready.then(() => {
    return new Promise((resolve, reject) => {
      var request = this.getStore().get(key);
      request.onsuccess = e => resolve(e.target.result);
      request.onerror = reject;
    });
  });
};

Storage.prototype.getStore = function() {
  return this.db
    .transaction(['store'], 'readwrite')
    .objectStore('store');
};

Storage.prototype.set = function(key, value) {
  return this.ready.then(() => {
    return new Promise((resolve, reject) => {
      var request = this.getStore().put(value, key);
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  });
};

Storage.prototype.delete = function(key, value) {
  indexedDB.deleteDatabase(location.origin);
};

//
// The primitive object that will be passed around the framework.
// Contain the metadata (i.e., HTTP headers) and content (aka, body)
// The decision can be set so that the framework can reject a request/response
//
function fProto()
{
	let decision = "true";
	let metadata = {};
	let body = "";

	this.setDecision = function(givenDecision){
		decision = givenDecision;
	};

	this.setMeta = function(givenMetadata){
		metadata = givenMetadata;
	};

	this.setBody = function(givenBody){
		body = givenBody;
	};

	this.getDecision = function(){return decision;};
	this.getMetadata = function(){return metadata;};
	this.getBody = function(){return body;};
}

//
// The main framework object. Currently, I name it "Fit to Fetch" or f2f. But the name is subjected to change.
//
function f2f()
{
	let apps = []; // List of registered normal apps
	let sbApps = []; // List of registered apps that need sandbox mode

	// Internal state variables
	let requireSandbox = false;
	let SBActivated = false;
	let ongoingResp = new fProto();
	let db = new Storage();

	// Setters
	this.setSandbox = function(reqSB){
		requireSandbox = reqSB;
	};

	this.addApp = function(app)
	{
		apps.push(app);
	};

	this.addSBApp = function(app)
	{
		sbApps.push(app);
	};

	// Internal function to check if a response is a web page. 
	function isWebpage(contentType)
	{
		//Is this robust? Should we use a different way to detect?
		let list = ["application/x-httpd-php", "text/html"]; 

		for(let i=0; i<list.length; i++)
		{
			if(contentType === list[i])
			{
				return true;
			}
		}

		return false;
	}

	// Internal function to check if a request is for the trusted code block script, so we can skip processing it.
	function isTCB(reqURL)
	{
		if(reqURL === "http://localhost/project_test/init.js")
		{
			return true;
		}
		
		return false;
	}

	// Internal function to check if a request is for the sandbox mode, so we can process it accordingly.
	function isSandbox(reqURL)
	{
		if(reqURL.includes("http://localhost/project_test/sb.html") && SBActivated)
		{
			console.log("True", SBActivated);
			return true;
		}
		console.log("False", SBActivated);
		return false;
	}

	// Internal helper function to insert text into the body
	writeAfterMatchInternal = function(targetString, appendingString, matchString)
	{
		let p = targetString.search(matchString);

		if(p>-1)
		{
			p = p + matchString.length;

			return targetString.substring(0, p) + appendingString + targetString.substring(p);
		}

		return targetString;
	}

	writeBeforeMatchInternal = function(targetString, appendingString, matchString)
	{
		let p = targetString.search(matchString);

		if(p>-1)
		{
			return targetString.substring(0, p) + appendingString + targetString.substring(p);
		}

		return targetString;
	}

	// External helper function to insert text into the body
	this.writeAfterMatch = function(targetString, appendingString, matchString)
	{
		return writeAfterMatchInternal(targetString, appendingString, matchString);
	};

	this.writeBeforeMatch = function(targetString, appendingString, matchString)
	{
		return writeBeforeMatchInternal(targetString, appendingString, matchString);
	};

	// Internal function to execute apps after the sandbox mode is done.
	function proceedChange(metadata, result)
	{
		let fObject = new fProto();
		let appCount = apps.length;

		fObject.setMeta(metadata);
		fObject.setBody(result);

		for(let i=0; i<appCount; i++)
		{
			let app = apps[i];

			if(app.hasOwnProperty("respMatch"))
			{
				if(app.respMatch(fObject))
				{
					fObject = app.respApply(fObject);
				}
			}
		}

		if(isWebpage(fObject.getMetadata().headers.get("Content-Type")))
		{
			fObject.setBody(initDocumentContext(fObject));
		}
		
		fObject.setDecision("sandboxDone");
		return fObject;
	}

	// Internal function to handle requests
	function processRequest(req)
	{
		let appCount = apps.length;
		let fObject = new fProto();

		if(isSandbox(req.url))
		{
			SBActivated = false;

			// Restore previous response object
			fObject = ongoingResp;

			let u = new URL(req.url);
			let params = new URLSearchParams(u.search);
			
			// When the sandbox apps made changes 
			if(params.has("body") && params.get("body") == "true")
			{
				// Get the changes from the IDB and apply it to the object
				return db.get("body").then((result) => proceedChange(fObject.getMetadata(), result));
			}

			//proceed normally
			else
			{
				for(let i=0; i<appCount; i++)
				{
					let app = apps[i];

					if(app.hasOwnProperty("respMatch"))
					{
						if(app.respMatch(fObject))
						{
							fObject = app.respApply(fObject);
						}
					}
				}

				if(isWebpage(fObject.getMetadata().headers.get("Content-Type")))
				{
					fObject.setBody(initDocumentContext(fObject));
				}
				
				fObject.setDecision("sandboxDone");
				return fObject;
			}
		}
		// For normal requests, just execute the apps 
		else
		{
			fObject.setMeta(req);

			for(let i=0; i<appCount; i++)
			{
				let app = apps[i];

				if(app.hasOwnProperty("reqMatch"))
				{
					if(app.reqMatch(fObject))
					{
						fObject = app.reqApply(fObject);
					}
				}
			}

			return fObject;
		}
	}

	// Internal callback function just to avoid asynchronous issues
	function retrieveBody(b)
	{
		return b;
	}

	// Internal function to handle sandbox apps
	async function handleSBApp(resp, body, SBresp)
	{
		let sbAppCount = sbApps.length;
		let SBbody = await SBresp.text().then((b) => retrieveBody(b));
		let sbfObject = new fProto();
		let fObject = new fProto();

		fObject.setMeta(resp);
		fObject.setBody(body);

		sbfObject.setMeta(SBresp);
		sbfObject.setBody(SBbody);

		for(let i=0; i<sbAppCount; i++)
		{
			let app = sbApps[i];

			if(app.hasOwnProperty("sbMatch"))
			{
				if(app.sbMatch(fObject))
				{
					// Inject code into the sandbox
					sbfObject.setBody(writeBeforeMatchInternal(sbfObject.getBody(), app.sbApply, "//__EOF_APPCode__"));
				}
			}
		} 	
			
		requireSandbox = false;

		return sbfObject;
	}

	// Internal function to handle responses
	async function processResponse(resp, body)
	{
		let sbAppCount = sbApps.length;
		let appCount = apps.length;
		let fObject = new fProto();

		fObject.setMeta(resp);
		fObject.setBody(body);

		if(isTCB(resp.url))
		{
			for(let i=0; i<appCount; i++)
			{
				let app = apps[i];

				if(app.hasOwnProperty("tcbMatch"))
				{
					if(app.tcbMatch)
					{
						// Inject app code into the TCB
						fObject.setBody(writeBeforeMatchInternal(fObject.getBody(), app.tcbApply, "//__EOF__"));
					}
				}
			}

			return fObject;
		}
		// Normal requests
		else
		{
			// First check if there is an app that requires sandbox mode. 
			for(let i=0; i<sbAppCount; i++)
			{
				let app = sbApps[i];

				if(app.hasOwnProperty("sbMatch"))
				{
					if(app.sbMatch(fObject))
					{
						requireSandbox = true;
					}
				}
			}

			if(requireSandbox)
			{
				ongoingResp = fObject;
				SBActivated = true;

				db.set("body", fObject.getBody());

				// Return sandbox-mode HTML page
				return fetch("http://localhost/project_test/sb.html").then((sandboxResp) => handleSBApp(resp, body, sandboxResp));	
			}
			// Does not need sandbox. Run apps normally
			else
			{
				for(let i=0; i<appCount; i++)
				{
					let app = apps[i];

					if(app.hasOwnProperty("respMatch"))
					{
						if(app.respMatch(fObject))
						{
							fObject = app.respApply(fObject);
						}
					}
				}

				if(isWebpage(fObject.getMetadata().headers.get("Content-Type")))
				{
					fObject.setBody(initDocumentContext(fObject));
				}

				return fObject;
			}
		}
	}

	// Internal function to inject the TCB into pages
	function initDocumentContext(fObject)
	{
		return writeAfterMatchInternal(fObject.getBody(), "\n\t<script src=\"init.js\"></script>", "<head>");
	}

	// External function to handle requests
	this.handleRequest = async function(req)
	{
		// Preprocess the request
		let fObject = await processRequest(req);

		// Proceed to fetch and modify the response accordingly
		if(fObject.getDecision() == "true")
		{
			return fetch(req).then((resp) => handleResponse(resp));
		}
		else if(fObject.getDecision() == "sandboxDone")
		{
			fObject.setBody(writeBeforeMatchInternal(fObject.getBody(), "<script> window.history.pushState(\"\", \"\", \"" + fObject.getMetadata().url + "\"); </script>"));
			return new Response(fObject.getBody(), fObject.getMetadata());
		}
		else
		{
			//return error
		}
	}

	// Internal function to handle responses
	async function handleResponse(resp)
	{
		let fObject = await resp.text().then((body) => processResponse(resp, body));
		return new Response(fObject.getBody(), fObject.getMetadata());
	}
}

var fInit = new f2f();

