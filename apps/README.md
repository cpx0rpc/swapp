# SWAPP Application List

## Autofill Guard
Autofill Guard mainly provides protection through isolation (by using iFrames). By putting a form inside an iFrame, which is isolated from the main context, XSS attackers will not be able to access the form anymore. Furthermore, to prevent attackers from creating an invisible form (different from the legitimate one) and tricking password managers to give them the credentials, Autofill Guard can also override JavaScript APIs and disallow form creation.

When a user requests a website, Autofill Guard automatically detects a sensitive form and encapsulates it inside an iFrame. Then, if the form is submitted, Autofill Guard will forward the request to the web server to log in. Upon receiving the response, Autofill Guard will notify the TCB to reload the main page. These processes are done automatically, thus there will be no differences from the user perspective.

## Cache Guard
This application is developed in response to a side-channel attack discussed by [Karami et al.](https://www.ndss-symposium.org/ndss-paper/awakening-the-webs-sleeper-agents-misusing-service-workers-for-privacy-leakage/) Cache Guard provides protection in two-steps. 

First, Cache Guard follows Karami's suggestion to check the Referer HTTP header. A different origin referer will be denied the network requests. 

Second, Cache Guard additionally delays certain request based on heuristics to deter the attackers from being able to correctly guess the load time. If a request is a web page, Cache Guard injects a dummy request that will not affect the normal usage but will increase the load time measured by the *performance* API. If a request is a non-web-page resource, then Cache Guard checks whether the resource is legitimately requested. Cache Guard builds resource mappings for each web page. When a resource is requested but there is no existing mapping, Cache Guard will delay the request and add it to the mapping. This way, padding random parameters to trigger cache miss will no longer work, while the normal usage will not suffer from the delay.

The amount of delay is taken from the average page load time of the previous visits. The statistic will be cleared every one in a while in case users are using different networks. 

### Available Configurations

| API               | Description |
| -----------       | ---------   | 
|cacheGuard.setMaxWait(ms) | Set the maximum delay for each packet in milli second. The default is 5000ms. |
|cacheGuard.setLastRequestHeuristicTiming(ms) | Set the heuristic timing to determine how long a resource request is considered a part of the previous web page load. The default is 30,000ms. |
| cacheGuard.cacheGuard.setAllowedReferer(List) | Set the list of allowed referer that can make a request. The hostname is included as default. The given list will be concatenate to the default list containing the hostname. |

## DOM Guard
DOM Guard allows a plug-and-play strategy where different types of techniques can be switched to keep up with new attacks/defenses. Currently, as proof of concepts, we use a filtering technique as the detection strategy. To detect DOM-XSS payload from executing on the client side, DOM Guard will check the URL segment of every request for potential payload using an HTTP encoder. DOM Guard will compare the encoded URL segment with the original segment to determine a potential attack. Nonetheless, this can be improved by applying other existing detection techniques in DOM Guard. For example, Chaudhary et al. proposed a proxy-based technique to validate network responses. In this case, DOM Guard can act like the proxy to lessen the requirement of the technique that needs a physical proxy to be deployed. 

## Data Guard
Data Guard will first perform static analysis on the web page and find all predefined data type in the web page. Web developers can also define their customized data extraction strategies to support other types of data. To enable the customization in Data Guard, we provide a template for web developers to define their own data extraction strategies. For each element identified by Data Guard, we will replace the sensitive data with a unique string, which will be a SHA-256 hash string generated from the element. The original sensitive data and the corresponding unique string will be stored into secure storage provided by \fname{} as a key-value pair. Whenever the unique string is detected in any outgoing message, Data Guard will replace the string with the original sensitive data. Currently, Data Guard will replace all URLs in the web page as a proof of concept. Based on our observation, such practice will not harm the normal workflow of the websites we have tested. If you find any errors in using Data Guard, please let us know.
