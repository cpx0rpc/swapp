// App Name: Data Guard
// Description: Data Guard is to preserve data inside service worker so that
//              the data won't be accessible in the document context. By doing
//              so, we can protect the data from being stolen by XSS attackers.

var appObj = new Object();

var request;

function dg_init(){
    f2fInst.storage.createTable("data_guard", "entry", ['value']);
}

appObj.respMatch = function(fObject){
    return true;
}

appObj.respApply = async function(fObject){
    var transaction = f2fInst.storage.db.transaction('data_guard', 'readwrite');
    var store = transaction.objectStore('data_guard');

    var new_cookies = fObject.getMetadata().headers.get("Set-Cookies");
    if(new_cookies){
        var req = store.get("Cookies");
        req.onsuccess = function(event){
            store.put({
                  entry: "Cookies",
                  value: req.result + ";" + new_cookies
            });
        }
    }

    return fObject;
};

appObj.reqMatch = function(fObject){
    return true;
}

appObj.reqApply = function(fObject){
    return fObject;
}

dg_init();

setTimeout(function () {
    f2fInst.addApp(appObj);
    f2fInst.addSBApp(appObj);
}, 500)

