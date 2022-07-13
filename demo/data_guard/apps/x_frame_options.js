// Example module + app to instrument native JS APIs

var appObj = new Object();

appObj.respMatch = function(fObject){
    return true;
}

appObj.respAction = function(fObject){
    
};

appObj.reqMatch = function(fObject){
    return true;
}

appObj.reqAction = function(fObject){

}

f2fInst.addApp(appObj);
f2fInst.addSBApp(appObj);

