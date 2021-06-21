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
    let headers = {};

    this.setDecision = function(givenDecision){
        decision = givenDecision;
    };

		this.updateMeta = function(update){
			if(metadata.constructor === Request)
			{
				let mObj = {
					cache: update.cache || metadata.cache,
					context: update.context || metadata.context,
					credentials: update.credentials || metadata.credentials,
					destination: update.destination || metadata.destination,
					headers: update.headers || metadata.headers,
					integrity: update.integrity || metadata.integrity,
					method: update.method || metadata.method,
					//mode: update.mode || metadata.mode,
					redirect: update.redirect || metadata.redirect,
					referrer: update.referrer || metadata.referrer,
					referrerPolicy: update.referrerPolicy || metadata.referrerPolicy,
					body: update.body || metadata.body,
					bodyUsed: update.bodyUsed  || metadata.bodyUsed
				};

				metadata = new Request(update.url || metadata.url, mObj);
			}
			else if(metadata.constructor === Response)
			{
				console.log("Response metadata not allowed to be modified");
			}
			else
			{
				console.log("Error metadata type detected");
			}
		};

    this.setMeta = function(givenMetadata){
        metadata = givenMetadata;
    };

    this.setBody = function(givenBody){
        body = givenBody;
    };

    this.setHeaders = function(givenHeaders){
        headers = givenHeaders;
    }

    this.getDecision = function(){return decision;};
    this.getMetadata = function(){return metadata;};
    this.getHeaders = function(){return headers;};
    this.getBody = function(){return body;};
}

//
// The main framework object. Currently, I name it "Fit to Fetch" or f2f. But the name is subjected to change.
//
function f2f()
{
    let apps = []; // List of registered normal apps

    let reqOrder = [];	// List of the execution order of request handlers
    let respOrder = [];	// List of the execution order of response handlers
    let tcbOrder = [];	// List of the execution order of tcb handlers

    let secret = makeid(128);
    let msgChannel = [];

		let totalAppTime = 0;

    // Internal state variables
    this.storage= new Storage();

    function makeid(length) 
    {
        var result           = [];
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) 
        {
            result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
        }

        return result.join('');
    }

    function intersect(a, b) {
        var setB = new Set(b);
        return [...new Set(a)].filter(x => setB.has(x));
    }

    function reorder(arr, app, mProp, oProp)
    {
        if(app.hasOwnProperty(mProp))
        {
            if(app.hasOwnProperty(oProp))
            {
                let o = new Object();

                o.pos = apps.length - 1;
                o.orderLevel = app[oProp];

                if(arr.length == 0)
                {
                    arr.push(o);
                }
                else
                {
                    for(let i = 0; i<arr.length; i++)
                    {
                        if(arr[i].orderLevel > o.orderLevel)
                        {
                            arr.splice(i, 0, o);
                            break;
                        }
                        else
                        {
                            if(i == arr.length-1)
                            {
                                arr.push(o);
                                break;
                            }
                        }
                    }
                }
            }
            else
            {
                let o = new Object();

                o.pos = apps.length - 1;

                if(arr.length == 0)
                {
                    o.orderLevel = 50;
                }
                else
                {
                    o.orderLevel = arr[arr.length-1].orderLevel + 1;
                }

                arr.push(o);
            }
        }
    }

    this.addApp = function(app)
    {
        apps.push(app);

        reorder(reqOrder, app, "reqMatch", "reqOrder");
        reorder(respOrder, app, "respMatch", "respOrder");
        reorder(tcbOrder, app, "tcbMatch", "tcbOrder");
    };

    // Internal function to check if a response is a web page. 
    function isWebpage(contentType)
    {
        //Is this robust? Should we use a different way to detect?
        let list = ["application/x-httpd-php", "text/html"]; 

        for(let i=0; i<list.length; i++)
        {
            if(contentType.includes(list[i]))
            {
                return true;
            }
        }

        return false;
    }

    // Internal function to check if a request is for the trusted code block script, so we can skip processing it.
    function isTCB(reqURL)
    {
        //if(reqURL === "http://localhost/init.js")
        var re = /\/tcb\/[^\/]*.js/;
        if(re.test(reqURL))
        {
            return true;
        }

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

    // Internal function to handle requests
    async function processRequest(req)
    {
        let appCount = reqOrder.length;
        let fObject = new fProto();

        fObject.setMeta(req);
        fObject.setHeaders(req.headers);

        appCount = reqOrder.length;

        for(let i=0; i<appCount; i++)
        {
            let app = apps[reqOrder[i].pos];//apps[i];

            if(app.hasOwnProperty("reqMatch"))
            {
								//let b = performance.now();

                if(app.reqMatch(fObject))
                {
                    fObject = app.reqApply(fObject);
                }

								//let a = performance.now();
								//totalAppTime += a-b;
								//console.log("totalAppTime: ", totalAppTime);
            }
        }

        return fObject;
    }

    // Internal callback function just to avoid asynchronous issues
    function retrieveBody(b)
    {
        return b;
    }

    // Internal function to handle responses
    async function processResponse(resp, body)
    {
        let appCount = tcbOrder.length;
        let fObject = new fProto();

        fObject.setMeta(resp);
        fObject.setBody(body);

        if(isTCB(resp.url))
        {
            for(let i=0; i<appCount; i++)
            {
                let app = apps[tcbOrder[i].pos];//apps[i];

                if(app.hasOwnProperty("tcbMatch"))
                {
										//let b = performance.now();
                    if(app.tcbMatch)
                    {
                        // Inject app code into the TCB
                        fObject.setBody(writeBeforeMatchInternal(fObject.getBody(), app.tcbApply, "//__EOF__"));
                    }

										//let a = performance.now();
										//totalAppTime += a-b;
										//console.log("totalAppTime: ", totalAppTime);
                }
            }

            fObject.setBody(writeBeforeMatchInternal(fObject.getBody(), `var secret = "` + secret + `";`, "//__SECRET__"));

            return fObject;
        }
        // Normal requests
        else
        {

            appCount = respOrder.length;
            for(let i=0; i<appCount; i++)
            {
                let app = apps[respOrder[i].pos];//apps[i];

                if(app.hasOwnProperty("respMatch"))
                {
										//let b = performance.now();

                    if(app.respMatch(fObject))
                    {
												fObject = await app.respApply(fObject);
                        /*app.respApply(fObject).then(
                                                    function(result){
                                                        fObject = result;
                                                    });*/
                    }

										//let a = performance.now();
										//totalAppTime += a-b;
										//console.log("totalAppTime: ", totalAppTime);
                }
            }
						
            if(isWebpage(fObject.getMetadata().headers.get("Content-Type")))
            {
								
                fObject.setBody(initDocumentContext(fObject));
            }

            return fObject;
        }
    }

    // Internal function to inject the TCB into pages
    function initDocumentContext(fObject)
    {
        return writeAfterMatchInternal(fObject.getBody(), "\n\t<script src=\"/tcb/init.js\"></script>", "<head>");
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
        else if(fObject.getDecision() == "cache")
        {
            let r = new Response(fObject.getBody(), fObject.getMetadata());
						Object.defineProperty(r, "type", { value: fObject.getMetadata().type });
						Object.defineProperty(r, "url", { value: fObject.getMetadata().url });
						
						return handleResponse(r);
        }
        else if(fObject.getDecision() == "deny")
        {
            return null;
        }
        else{
            //return error

        }
    }

    // Internal function to handle responses
    async function handleResponse(resp)
    {
				// If the response is invalid to reconstruct, then return the original without processing.
				if(resp.type == "opaqueredirect" || resp.type == "error" || resp.type == "opaque")
				{
					return resp;
				}
				// Skip if it is a font
				let contentType = resp.headers.get("Content-Type");
				if((contentType && contentType.includes("font")) || resp.url.includes(".woff") || resp.url.includes(".eot") || resp.url.includes(".otf") || resp.url.includes(".ttf"))
				{
					return resp;
				}
				// Currently buggy with gif images, so skip for now
				if(contentType && contentType.includes("gif"))
				{
					return resp;
				}
				
        let fObject = await resp.text().then((body) => processResponse(resp, body));
				let ret = new Response(fObject.getBody(), fObject.getMetadata());
				
        return ret;
    }

    // External function to handle and dispatch postMessage
    this.handleMessage = function(event)
    {
        let label = event.data.label;
        let msg = event.data.msg;
        let sender = event.ports[0];

        if(event.data.secret != secret)
        {
            console.log("[Error] Incorrect secret code");
            return;
        }

        if(intersect(label, ["SWAPP_INIT"]).length > 0)
        {
            msgChannel.push(sender);
            return;
        }

        for(let i=0; i<apps.length; i++)
        {
            let app = apps[i];

            if(app.hasOwnProperty("msgLabel"))
            {
                let matchedLabel = intersect(app.msgLabel, label);

                if(matchedLabel.length > 0)
                {
										//let b = performance.now();
                    app.msgHandler(matchedLabel, msg); 
										//let a = performance.now();
										//totalAppTime += a-b;
										//console.log("totalAppTime: ", totalAppTime);
                }
            }
        }
    }

    this.broadcastMsg = function(label, msg)
    {
        for(let i=0; i<msgChannel.length; i++)
        {
            msgChannel[i].postMessage({"label": label, "msg": msg, "secret": secret});
        }
    }
}

var f2fInst= new f2f();

