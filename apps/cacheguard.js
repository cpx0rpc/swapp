var cacheGuard = new Object();

cacheGuard.u = 0;
cacheGuard.loadTime = {};
cacheGuard.k = 0;
cacheGuard.max_wait = 5000;

cacheGuard.sleep = function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

cacheGuard.printInfo = function()
{
	console.log("Average: ", cacheGuard.u);
	console.log("Total: ", cacheGuard.k);
	console.log("Current: ", cacheGuard.loadTime);
}

cacheGuard.reqMatch = function(fObj)
{
	//Start counting the load time
	cacheGuard.loadTime[fObj.getMetadata().url] = performance.now();

	console.log("==Request==");
	cacheGuard.printInfo();
	return true;
};

cacheGuard.reqApply = async function(fObj)
{
	//1. Heuristic: Block all 3rd party referrer
	let r = fObj.getMetadata().referrer;

	if(r)
	{
		let referrer = (new URL(r)).host;

		if(referrer != self.location.hostname && referrer.match(allowList) == null)
		{
			fObj.setDecision("deny");
		}

		//2. Heuristic: Delay the cache response to make it look like the request is done over the network
		if(fObj.getDecision() == "cache")
		{
			await cacheGuard.sleep(Math.min(cacheGuard.u));
		}
	}

	return fObj;
};

cacheGuard.respMatch = function(fObj)
{
	let id = fObj.getMetadata().url;

	if(cacheGuard.loadTime.hasOwnProperty(id))
	{
		let currLoad = performance.now() - cacheGuard.loadTime[id];
		delete cacheGuard.loadTime[id];

		//Update the average
		cacheGuard.k += 1;
		cacheGuard.u = cacheGuard.u + (currLoad - cacheGuard.u)/cacheGuard.k;

		console.log("==Response==");
		console.log("currLoad: ", currLoad);
		cacheGuard.printInfo();

		//Clean up
		if(cacheGuard.loadTime.length > 20)
		{
			cacheGuard.loadTime = {};
		}

		if(cacheGuard.u > cacheGuard.max_wait || cacheGuard.k > 150 || cacheGuard.u < 0)
		{
			cacheGuard.u = 0;
			cacheGuard.k = 0;
			cacheGuard.loadTime = {};
		}
	}

	return false;
};

cacheGuard.respApply = function(fObj)
{

};

console.log("[C]ache[G]uard activated");
swappInst.addApp(cacheGuard);


