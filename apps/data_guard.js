// App Name: Data Guard
// Description: Data Guard is to preserve data inside service worker so that
//              the data won't be accessible in the document context. By doing
//              so, we can protect the data from being stolen by XSS attackers.
self.importScripts("./apps/tXml.min.js");

var appObj = new Object();
var domain;

function dg_init(){
    swappInst.storage.createTable("data_guard", "entry", ['value']);
    domain = self.location.hostname;
}

async function traverse(root, f) {
    // traverse the node from the root node
    async function traverseNode(node) {
        // execute the callback then traverse the children
        await f(node);
        if(Object.prototype.isPrototypeOf(node.children) && Object.keys(node.children).length !== 0){
            node.children.forEach(node => {
                traverseNode(node);
            });
        }
    }
    await traverseNode(root);

    return root;
}

// sha256 implementation copied from Vitaly Zdanevich
// link: https://stackoverflow.com/questions/18338890/are-there-any-sha-256-javascript-implementations-that-are-generally-considered-t
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);                    

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

function isCurrentDomainURL(url){
    var retval;
    // check if the target url belongs to the current domain
    var url_obj = new URL(url);
    if(url_obj.hostname != domain){
        retval = false;
    } else {
        retval = true;
    }

    return retval;
}

async function generateDGTokenForURL(url){
    var transaction = swappInst.storage.db.transaction('data_guard', 'readwrite');
    var retval;
    // generate data guard token for the url
    if(isCurrentDomainURL(url)){
        var store = transaction.objectStore('data_guard');

        var req = store.get(url);
        var token;
        await sha256(url).then(retval => {
            token = retval;
        });

        req.onsuccess = function(event){
            // save the original url to the store and return the token for replacement
            if(req.result){
                // store.put({
                //     entry: url,
                //     value: req.result["value"] + ";" + token
                // });
            } else {
                store.put({
                    entry: url,
                    value: token
                })
            }
        }
        retval = token;
    } else {
        reval = url;
    }

    return retval;
}

async function generateDGTokenForTokens(token){
    var transaction = swappInst.storage.db.transaction('data_guard', 'readwrite');
    var store = transaction.objectStore('data_guard');

    var req = store.get(token);
    var dgtoken;
    await sha256(token).then(retval => {
        dgtoken = retval;
    });

    req.onsuccess = function(event){
        if(req.result){
        } else {
            store.put({
                entry: token,
                value: dgtoken
            })
        }
    }

    return dgtoken;
}

function identifyURLs(text){
    const reg_regular_url = /^[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:[0-9]{1,5})?[-a-zA-Z0-9()@:%_\\\+\.~#?&//=]*$/g;
    var urls = [...text.matchAll(reg_regular_url)];

    return urls;
}

function identifyTokens(text){
    // the token identification is simplified currently
    const reg_sha256_tokens = /[a-f0-9]{64}/gi;
    const reg_md5_tokens = /[a-f0-9]{32}/gi;
    var sha256s = [...text.matchAll(reg_sha256_tokens)];
    var md5s = [...text.matchAll(reg_md5_tokens)]

    if(Array.isArray(sha256s)){
        return sha256s.concat(md5s);
    } else {
        return md5s;
    }
}

async function replaceURIs(text){
    // It is more complicated to identify and replace uris with tokens so we do not reuse the previous functions
    
    // since domparser is not available, we use txml to parse the html
    // txml link: https://github.com/TobiasNickel/tXml/tree/4.0.1
    var htmlDOM = txml.parse(text);
    var transaction = swappInst.storage.db.transaction('data_guard', 'readwrite');
    var store = transaction.objectStore('data_guard');

    await traverse(htmlDOM, async function(node){
        // check if the node is a node that may contain an uri
        if(node.tagname == "a" ||
            node.tagname == "link" ||
            node.tagname == "img" ||
            node.tagname == "video" ||
            node.tagname == "audio" ||
            node.tagname == "source" ||
            node.tagname == "object"){
            for(var attribute in node.attributes){
                if(attribute == "href" ||
                    attribute == "src" ||
                    attribute == "data"){
                        // check if the uri attribute of the node is pointing to an address of the current domain
                        if(node.attributes[attribute].startsWith("/") ||
                            node.attributes[attribute].startsWith(".")){
                                var dgtoken = await generateDGTokenForURL(node.attributes[attribute]);
                                var req = store.get(node.attributes[attribute]);
                                req.onsuccess = function(event){
                                    // remove the first character before saving the uri so that the uri can be matched in the request
                                    if(req.result){
                                    } else {
                                        store.put({
                                            entry: node.attributes[attribute].substring(1),
                                            value: dgtoken
                                        })
                                    }
                                }
                                node.attributes[attribute] = dgtoken;
                            }
                    }
            }
        }
    })

    var modified = txml.stringify(htmlDOM);

    return modified;
}

appObj.respMatch = function(fObject){
    return true;
}

appObj.respAction = async function(fObject){
    var transaction = swappInst.storage.db.transaction('data_guard', 'readwrite');
    var store = transaction.objectStore('data_guard');

    // same as cookies.
    // F2F headers are defined on the server-side and will be transparent to users
    var new_f2f_header = fObject.getMetadata().headers.get("F2F");

    if(new_f2f_header){
        var req = store.get("F2F");
        req.onsuccess = function(event){
            if(req.result){
                store.put({
                          entry: "F2F",
                          value: req.result["value"] + ";" + new_f2f_header
                });
            } else {
                store.put({
                          entry: "F2F",
                          value: new_cookies
                });
            }
        }
    }

    // remove F2F headers from the respones
    var h = fObject.getHeaders();
    if(Object.keys(h).length !== 0){
        h.delete("F2F");
    }
    fObject.setHeaders(h);

    // get the original body
    var body = await fObject.getBody();

    // replace tokens first since it has conflict with all the other two parts
    var tokens = identifyTokens(body);
    for(token of tokens){
        var dgtoken = await generateDGTokenForTokens(token[0]);
        body = body.replace(token[0], dgtoken);
    }

    // replace uris second since it could have overlap with urls
    body = await replaceURIs(body);

    // replace urls with tokens
    var urls = identifyURLs(body);
    for(url of urls){
        var token = await generateDGTokenForURL(url[0]);
        body = body.replace(url[0], token);
    }

    // return to apply the change
    fObject.setBody(body);
    fObject.setDecision("dirty");
    return fObject;
};

appObj.reqMatch = function(fObject){
    if(!isCurrentDomainURL){
        return false;
    }
    return true;
}

appObj.reqAction = async function(fObject){
    var transaction = swappInst.storage.db.transaction('data_guard', 'readwrite');
    var store = transaction.objectStore('data_guard');

    // append the reserved cookies to the header
    var req = store.get("Cookies");
    await new Promise((resolve, reject) => {
        req.onsuccess = function(event){
            if(req.result){
                fObject.getHeaders().append("Cookies", req.result["value"]);
            }
            resolve();
        }
    })

    // append the F2F private headers back to the request
    var f2f = store.get("F2F");
    await new Promise((resolve, reject) => {
        f2f.onsuccess = function(event){
            if(f2f.result){
                fObject.getHeaders().append("F2F", f2f.result["value"]);
            }
            resolve();
        }
    })

    // regular token match and replace
    var ori_meta = fObject.getMetadata();
    var new_meta = undefined;
    var target_url = ori_meta.url;
    var allkeys = store.getAll();

    var reqfghjk_1;
    var decision = "dirty";

    await new Promise((resolve, reject) => {
        allkeys.onsuccess = async function(event) {
            var cursor = event.target.result;
            for(v of cursor){
                if(target_url.match(v.value) != null){
                    // if this is the correct record
                    // replace the url back
                    var actual_url = target_url.replace(v.value, v.entry)
                    new_meta = new Request(actual_url);

                    //var reqfghjk = new Request(actual_url);
                    //var new_body;
                    //await fetch(reqfghjk).then(res => {reqfghjk_1 = res;});
                    //await reqfghjk_1.text().then(text => {new_body = text});
                    //fObject.setBody(new_body);
                    //fObject.setMeta({"status": 200, "url": actual_url, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
                    //decision = "dirty";
                    break;
                }
            }
            resolve();
        }
    })

    if(new_meta){
        fObject.setMeta(new_meta);
    }

    fObject.setDecision(decision);
    return fObject;
}

dg_init();
setTimeout(function () {
    swappInst.addApp(appObj);
}, 500)