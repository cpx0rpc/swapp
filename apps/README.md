# SWAPP Application List

## Autofill Guard

## Cache Guard
This application is developed in response to a side-channel attack discussed by [Karami et al.](https://www.ndss-symposium.org/ndss-paper/awakening-the-webs-sleeper-agents-misusing-service-workers-for-privacy-leakage/) Cache Guard provides protection in two-steps. 

First, Cache Guard follows Karami's suggestion to check the Referer HTTP header. A different origin referer will be denied the network requests. 

Second, Cache Guard additionally delays certain request based on heuristics to deter the attackers from being able to correctly guess the load time. If a request is a web page, Cache Guard injects a dummy request that will not affect the normal usage but will increase the load time measured by the *performance* API. If a request is a non-web-page resource, then Cache Guard checks whether the resource is legitimately requested. Cache Guard builds resource mappings for each web page. When a resource is requested but there is no existing mapping, Cache Guard will delay the request and add it to the mapping. This way, padding random parameters to trigger cache miss will no longer work, while the normal usage will not suffer from the delay.

### Available Configurations

| API               | Description |
| -----------       | ---------   | 
|cacheGuard.setMaxWait(ms) | Set the maximum delay for each packet in milli second. The default is 5000ms. |
|cacheGuard.setLastRequestHeuristicTiming(ms) | Set the heuristic timing to determine how long a resource request is considered a part of the previous web page load. The default is 30,000ms. |
| cacheGuard.cacheGuard.setAllowedReferer(List) | Set the list of allowed referer that can make a request. The hostname is included as default. The given list will be concatenate to the default list containing the hostname. |


## Workbox-App

## DOM Guard

## JSZero

## NativeEX
