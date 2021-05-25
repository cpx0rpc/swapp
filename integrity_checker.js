// Example module + app to instrument native JS APIs

// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

const pemEncodedKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAy3Xo3U13dc+xojwQYWoJLCbOQ5fOVY8LlnqcJm1W1BFtxIhOAJWohiHuIRMctv7dzx47TLlmARSKvTRjd0dF92jx/xY20Lz+DXp8YL5yUWAFgA3XkO3LSJgEOex10NB8jfkmgSb7QIudTVvbbUDfd5fwIBmCtaCwWx7NyeWWDb7A9cFxj7EjRdrDaK3ux/ToMLHFXVLqSL341TkCf4ZQoz96RFPUGPPLOfvN0x66CM1PQCkdhzjE6U5XGE964ZkkYUPPsy6Dcie4obhW4vDjgUmLzv0z7UD010RLIneUgDE2FqBfY/C+uWigNPBPkkQ+Bv/UigS6dHqTCVeD5wgyBQIDAQAB
-----END PUBLIC KEY-----`;

function importRsaKey(pem) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = self.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return crypto.subtle.importKey(
                                   "spki",
                                   binaryDer,
                                   {
                                       name: "RSA-OAEP",
                                       hash: "SHA-256"
                                   },
                                   true,
                                   ["encrypt"]
    );
}

var appObj = new Object();
var pkey = importRsaKey(pemEncodedKey);

appObj.respMatch = function(fObject){
    return true;
}

appObj.respApply = function(fObject){
    var sig = crypto.subtle.verify(
                                   'RSA-PKCS1-v1_5',
                                   pkey,
                                   fObject.getMetadata().headers.get("F2F-Signature"),
                                   fObject.getBody());
    if(sig)
    {
        return fObject;
    }
    else 
    {
        return false;
    }
};

var f = function(param1, param2)
{
    console.log(param1, param2);
}

// This will produce an error in the current code since I already freeze the navigator.serviceWorker
// appObj.addWrap("navigator.serviceWorker", "register", f)

fInit.addApp(appObj);
fInit.addSBApp(appObj);

