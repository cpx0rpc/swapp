// Example module + app to instrument native JS APIs

var appObj = new Object();
var pkey = importRsaKey(pemEncodedKey);

appObj.respMatch = function(fObject){
    return true;
}

appObj.respApply = function(fObject){
    
};

appObj.reqMatch = function(fObject){
    return true;
}

appObj.reqApply = function(fObject){

}

var f = function(param1, param2)
{
    console.log(param1, param2);
}

// This will produce an error in the current code since I already freeze the navigator.serviceWorker
// appObj.addWrap("navigator.serviceWorker", "register", f)

fInit.addApp(appObj);
fInit.addSBApp(appObj);

