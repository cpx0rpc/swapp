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

appObj.respMatch = function(fObject){
    var sig = encrypt.encrypt(fObject.getBody());
	if(fObject.getMetadata().getFirst("F2F-Signature")=== sig)
	{
		return true;
	}
	else 
	{
		return false;
	}
};

//appObj.respApply = function(fObject){
//	fObject.setBody(fInit.writeAfterMatch(fObject.getBody(), " test(){console.log(\"Appended from app.\");}test();", "function"));
//	return fObject;
//};

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

