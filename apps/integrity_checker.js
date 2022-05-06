// App Name: Integrity Checker
// Description: Check the integrity of each response by verifying the signature of the response body.
//              Server-side implementation is needed to inejct an HTTP header 'f2f-signature' for each
//              response, which contains the original signature. 

// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

// public key in jwk format
const pemEncodedPublicKey = {"kty":"RSA","e":"AQAB","kid":"d7f6a2f4-f0fa-49fc-a5f6-f1672dc7930e","n":"eKoVulrxXmpKKOe3YxiM-MI1BIQrnLm-LkTKwL-xtYbB5zC0YV2MWenfejv6Hgs71GQ3XNA33e3mGasDmlGXaliqPvhJ36pWa6PPEgBGwjr7Wsr5XiPoLA0vJ45Dc0UKY954yaHKTvb0suPp9-Ad_VmnYESZ8lKUEazS7L4oRjMWyx1PknuH-wJqTNDUnT0RtPIpFQRiPNBz-cemK1REj0TpINe8Mebj6ODYlG3YTM4S5IUeOIN8xU8UxUTbQ-I4eBNLQ9T9wjIqY_2yf0pZeTRGBuSl4DXT49JdpKI94HOG5yXtkGP4zxDFvBiiPTFMjIUEMe9eTkX0E_6f5plLkw"};



// Convert the rsa key from string to CyptoKey Objects
function importRsaKey(pem, type) {
    var signAlgorithm = {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
            name: "SHA-256"
        },
        modulusLength: 2048,
        extractable: false,
        publicExponent: new Uint8Array([1, 0, 1])
    }

    var format;
    var usage;
    var params;
    if(type == "public"){
        format= "jwk";
        usage = "verify";
    }
    else if(type == "private"){
        format = "jwk";
        usage = "sign";
    }
    var cryObj = crypto.subtle.importKey(
                                         format,
                                         pem,
                                         signAlgorithm,
                                         true,
                                         [usage]
    );

    return cryObj;
}

// Store the CryptoKey object of the public key to the global variable
function getPublicKeyObj(key){
    importRsaKey(key, 'public').then(
                                     function(keyObj){
                                         pubkey = keyObj;
                                     }
    );
}

// Store the CryptoKey object of the private key to the global variable
function getPrivateKeyObj(key){
    log = importRsaKey(key, "private").then(
                                            function(keyObj){
                                                prikey = keyObj;
                                            }
    );
}

// [testing only]
var log;

// initilize the app object and global varibales inside the app
var appObj = new Object();
var pubkey;
getPublicKeyObj(pemEncodedPublicKey);
var prikey;
getPrivateKeyObj(pemEncodedPrivateKey);

// Match all the responses
appObj.respMatch = function(fObject){
    return true;
}

// Verify the signature and return deny if a mismatching is found
appObj.respAction = async function(fObject){
    var f2f_sign = fObject.getMetadata().headers.get("F2F-signature");
    var f2f_body = fObject.getBody();

    let enc = new TextEncoder();

    
    // Verify the signature
    var sig;
    await crypto.subtle.verify(
                               "RSASSA-PKCS1-v1_5",
                               pubkey,
                               f2f_sign,
                               enc.encode(f2f_body)).then(function(sign){sig = sign;});
    if(sig)
    {
        fObject.setDecision("dirty");
        return fObject;
    }
    else 
    {
        fObject.setDecision("drop");
        return fObject;
    }
};

setTimeout(function () {
    f2fInst.addApp(appObj);
}, 500)

