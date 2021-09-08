// Example module + app to instrument native JS APIs

var appObj = new Object();
var encrypt = new JSEncrypt();
encrypt.setPublicKey('mypublickey');

appObj.tcbMatch = true;

appObj.tcbApply = `
function example()
{
	console.log("Test App TCB");
}

example();
`;

/*appObj.reqMatch = function(fObject){
	return true;
};

appObj.reqApply = function(fObject){
	//req.setDecision(false);
	//req.setMeta(something);
	return req;
};*/

//appObj.sbMatch = function(fObject){
//	console.log("App sees", fObject.getMetadata().url);
//	if(fObject.getMetadata().url === "http://localhost/project_test/testSB.html")
//	{
//		return true;
//	}
//	else
//	{
//		return false;
//	}
//};

//appObj.sbApply = `
//	doc.body.innerText = "Changed by a security app!";
//	changed = true;
//`;

//appObj.respMatch = function(fObject){
//    var sig = encrypt.encrypt(fObject.getBody());
//	if(fObject.getMetadata().getFirst("F2F-Signature")=== sig)
//	{
//		return true;
// }
//	else 
//	{
//		return false;
//	}
//};

appObj.respApply = function(fObject){
	//fObject.setBody(fInit.writeAfterMatch(fObject.getBody(), " test(){console.log(\"Appended from app.\");}test();", "function"));
    if(fObject.getMetadata().url.endsWith(".js") && fObject.getMetadata().getFirst("TCB") == true){
        var code = fObject.getBody();
        var ast = esprima.parse(code, {loc:true});
        var cnt = 0;
        ast.body.unshift(esprima.parse("const delay = ms => new Promise(res => setTimeout(res, ms));" +
                                       "function get_value_from_dom(id){" + 
                                            "var value;" + 
                                            "self.addEventListener(\"message\", function(event) {" +
                                            "if(event.data.id == id && event.data.type == \"DOC_VALUE\"){" +
                                                "value = event.data.value;" +
                                            "}}" +
                                            "await delay(200);" +
                                            "return value;" +
                                        "}"));

        estraverse.replace(ast, {
            leave: function(node, parent){
                if(node.expression.name == "document"){
                    var dom_ast = node;
                    self.clients.matchAll().then(all => all.forEach(client => {
                        client.postMessage({type: "DOC_REF", id: cnt, ast: dom_ast});
                    }));

                    var dom_value = esprima.parse("get_value_from_dom(" + cnt + ")");
            }
        })
    } else {
	    return fObject;
    }
    
};

//appObj.addWrap = function(objType, fnName, wrapper){
//	let s = "var orig_" + fnName + " = " + objType + "." + fnName + ".bind(" + objType + ");\nvar inst_" + fnName + " = " + wrapper.toString() + "\nObject.defineProperty(" + objType + ", \"" + fnName + "\", \n{\n\tvalue: inst_" + fnName + ", \n\tconfigurable: false, \n\twritable: false\n});";

//	appObj.tcbApply = appObj.tcbApply + s;
//};

var f = function(param1, param2)
{
	console.log(param1, param2);
}

// This will produce an error in the current code since I already freeze the navigator.serviceWorker
// appObj.addWrap("navigator.serviceWorker", "register", f)

fInit.addApp(appObj);
fInit.addSBApp(appObj);

