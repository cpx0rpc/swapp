// Example module + app to instrument native JS APIs

var appObj = new Object();

appObj.tcbMatch = true;

appObj.tcbApply = `
function example()
{
	console.log("Test App TCB");
}

example();

var appObj = new Object();

appObj.msgLabel = ["APP"];
appObj.msgHandler = function(label, msg)
{
	console.log("Receive", label, msg);
};

handlers.push(appObj);

`;

appObj.msgLabel = ["APP"];

appObj.msgHandler = function(label, msg)
{
	console.log("From app receive: ", label, msg);

	fInit.broadcastMsg(["APP"], "Test broadcast from app");
};

fInit.addApp(appObj);

