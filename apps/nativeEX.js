// Example app to instrument native JS APIs
// The original function reference is stored as orig_[param2] (i.e., given the second param is "register" the reference is orig_register
// Input param: (object name, function name, wrapper function, configurable, writable)
// API: nativeEX.addWrap(object name, function name, wrapper function, configurable, writable)

var nativeEX = new Object();

nativeEX.tcbMatch = true;

nativeEX.tcbApply = `
// NativeEX

`;

nativeEX.addWrap = function(objType, fnName, wrapper, configurable, writable){
	let s = "var orig_" + fnName + " = " + objType + "." + fnName + ".bind(" + objType + ");\nvar inst_" + fnName + " = " + wrapper.toString() + "\nObject.defineProperty(" + objType + ", \"" + fnName + "\", \n{\n\tvalue: inst_" + fnName + ", \n\tconfigurable: " + configurable.toString() + ", \n\twritable: " + writable.toString() + "\n});\n";

	nativeEX.tcbApply = nativeEX.tcbApply + s;
};



