var appObj = new Object();
var curr_id = "0";
var mTable = {};

function next_id()
{
	let int_id = parseInt(curr_id) + 1;

	curr_id = int_id.toString();
}

appObj.respMatch = function(fObj)
{
	if(fObj.getMetadata().url == "http://localhost/testautofill.html")
	{
		return true;
	}
	
	return false;
}

appObj.respApply = function(fObj)
{
	let body = fObj.getBody();
	let form_match_exp = /<form.*<\/form>/s;
	let f = body.match(form_match_exp);

	if(f)
	{
		let s = f.toString();
		let url = new URL(fObj.getMetadata().url);
		body = body.replace(form_match_exp, "<iframe src=http://" + url.hostname + "?autofillguardID=" + curr_id + " frameBorder=0></iframe>");

		mTable[curr_id] = s;

		next_id();

		fObj.setBody(body);
		fObj.setDecision("true");
	}

	return fObj;
}

appObj.reqMatch = function(fObj)
{
	let params = (new URL(fObj.getMetadata().url)).searchParams;

	if(params.get('autofillguardID') in mTable)
	{
		return true;
	}

	return false;
}

appObj.reqApply = function(fObj)
{
	let params = (new URL(fObj.getMetadata().url)).searchParams;
	let id = params.get('autofillguardID');

	if(id in mTable)
	{
		fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
		fObj.setBody(mTable[id]);
		fObj.setDecision("cache");
	}

	return fObj;
}

fInit.addApp(appObj);
