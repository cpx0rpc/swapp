// Example module + app to instrument native JS APIs

var appObj = new Object();

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

f2fInst.addApp(appObj);
f2fInst.addSBApp(appObj);

