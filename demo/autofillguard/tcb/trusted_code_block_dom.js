//function query_sw(){
//    navigator.serviceWorker.controller.postMessage({type: "DOC_QUERY"});
//}

//self.setInterval("query_sw()", 100);

navigator.serviceWorker.addEventListener('message', function(event) {
    console.log("Got reply from service worker: " + event.data);
    if(event.data.type == "DOC_REF"){
        var value = eval("return " + escodegen.generate(event.data.ast));
        navigator.serviceWorker.controller.postMessage({type: "DOC_VALUE", value: value});
    }
});
