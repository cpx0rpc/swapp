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

function traverse(root, f) {
    // traverse the node from the root node
    function traverseNode(node) {
        // execute the callback then traverse the children
        f(node);
        node.children.forEach(node => {
            traverseNode(node);
        });
    }
    traverseNode(root);

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

function generateDGTokenForURL(url){
    var retval;
    // generate data guard token for the url
    if(isCurrentDomainURL(url)){
        var store = transaction.objectStore('data_guard');

        var req = store.get(url);
        var token = sha256(url);

        req.onsuccess = function(event){
            // save the original url to the store and return the token for replacement
            if(req.result){
                store.put({
                    entry: url,
                    value: req.result["value"] + ";" + token
                });
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

function generateDGTokenForTokens(token){
    var store = transaction.objectStore('data_guard');

    var req = store.get(token);
    var dgtoken = sha256(token);

    req.onsuccess = function(event){
        if(req.result){
            store.put({
                entry: token,
                value: req.result["value"] + ";" + dgtoken
            });
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

    return sha256s.concat(md5s);
}

function replaceURIs(text){
    // It is more complicated to identify and replace uris with tokens so we do not reuse the previous functions
    
    // since domparser is not available, we use txml to parse the html
    // txml link: https://github.com/TobiasNickel/tXml/tree/4.0.1
    var htmlDOM = txml.parse(text);
    var store = transaction.objectStore('data_guard');

    traverse(htmlDOM, function(node){
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
                                var dgtoken = generateDGTokenForURL(node.attributes[attribute]);
                                var req = store.get(node.attributes[attribute]);
                                req.onsuccess = function(event){
                                    // remove the first character before saving the uri so that the uri can be matched in the request
                                    if(req.result){
                                        store.put({
                                            entry: node.attributes[attribute].substring(1),
                                            value: req.result["value"] + ";" + dgtoken
                                        });
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

    // get new cookies in the header
    var new_cookies = fObject.getMetadata().headers.get("Set-Cookie");

    if(new_cookies){
        var req = store.get("Cookies");
        req.onsuccess = function(event){
            // if there exist cookies, append the new cookies to the entry
            if(req.result){
                store.put({
                          entry: "Cookies",
                          value: req.result["value"] + ";" + new_cookies
                });
            // if there is no cookies stored previously, create an entry
            } else {
                store.put({
                          entry: "Cookies",
                          value: new_cookies
                });
            }
        }
    }

    // remove cookies from the respones
    var h = fObject.getHeaders();
    h.delete("Set-Cookie");
    fObject.setHeaders(h);


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
    h.delete("F2F");
    fObject.setHeaders(h);


    // get the original body
    var body = fObject.getBody();

    // replace tokens first since it has conflict with all the other two parts
    var tokens = identifyTokens(body);
    tokens.forEach(token =>{
        var dgtoken = generateDGTokenForTokens(token);
        body = body.replace(token, dgtoken);
    });

    // replace uris second since it could have overlap with urls
    body = replaceURIs(body);

    // replace urls with tokens
    var urls = identifyURLs(body);
    urls.forEach(url => {
        var token = generateDGTokenForURL(url);
        body = body.replace(url, token);
    });


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

appObj.reqAction = function(fObject){
    var transaction = swappInst.storage.db.transaction('data_guard', 'readwrite');
    var store = transaction.objectStore('data_guard');

    // append the reserved cookies to the header
    var req = store.get("Cookies");
    req.onsuccess = function(event){
        fObject.getHeaders().append("Cookies", req.result["value"]);
    }

    // append the F2F private headers back to the request
    var f2f = store.get("F2F");
    f2f.onsuccess = function(event){
        fObject.getHeaders().append("F2F", f2f.result["value"]);
    }

    // regular token match and replace
    var target_url = fObject.getMetadata().url;
    var allkeys = store.getAll();
    allkeys.onsuccess = function(event) {
        var cursor = event.target.result;

        if(cursor) {
            var value = cursor.value;

            if(url.match(value) != null){
                // if this is the correct record
                // replace the url back
                url.replace(value, cursor.key);
            } else {
                // if we haven't found a record, continue to the next
                cursor.continue();
            }
        } else {
            // Iteration complete 
        }
    };

    return fObject;
}

dg_init();

setTimeout(function () {
    swappInst.addApp(appObj);
}, 500)
