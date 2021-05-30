var appObj = new Object();

appObj.curr_id = 0;
appObj.mTable = {};
appObj.iTable = {};
appObj.onGoing = false;
appObj.currBody = "";
appObj.currURL = "";
appObj.respMatchPath = [];
appObj.actionMatch = [];

appObj.setRespMatchPath = function(m)
{
	appObj.respMatchPath = m;
}

appObj.setActionMatch = function(m)
{
	appObj.actionMatch = m;
}

appObj.next_id = function()
{
	let int_id = parseInt(appObj.curr_id) + 1;

	appObj.curr_id = int_id.toString();
}

appObj.respMatch = function(fObj)
{
	let urlString = fObj.getMetadata().url.toString();

	if(appObj.respMatchPath.constructor === Array)
	{
		for(p in appObj.respMatchPath)
		{ 
			if(p.constructor === RegExp && urlString.match(p))
			{
				return true;
			}
			else if(p.constructor === String && urlString == p)
			{
				return true;
			}
		}
	}
	else if(appObj.respMatchPath.constructor === RegExp)
	{
		if(urlString.match(appObj.respMatchPath))
		{
			return true;
		}
	}
	else if(appObj.respMatchPath.constructor === String)
	{
		return urlString == appObj.respMatchPath;
	}

	return false;
}

appObj.respApply = async function(fObj)
{
	let body = fObj.getBody();
	let url = new URL(fObj.getMetadata().url);

	// Find forms
	let form_match_exp = /<form[^]*?<\/form>/g;
	let forms = body.match(form_match_exp);

	if(forms)
	{
		// Find matching forms

		for(f in forms)
		{
			s = forms[f].toString();

			let found = s.match(/action\s*=.*?[>\s]/i);

			if(found)
			{
				found = found[0].match(/=['"\s]*.*?['"]/i);
				found = found[0].substring(1);

				if(found[0] == "\"" || found[0] == "\'")
				{
					found = found.substring(1, found.length-1);
				}

				let matched = false;

				if(appObj.actionMatch.constructor === Array)
				{
					for(a in appObj.actionMatch)
					{ 
						if(found.match(a))
						{
							matched = true;
						}
					}
				}
				else if(appObj.actionMatch.constructor === RegExp)
				{
					matched = found.match(appObj.actionMatch);
				}
				else if(appObj.actionMatch.constructor === String && appObj.actionMatch == found)
				{
					matched = true;
				}

				if(matched)
				{
					u = new URL(found, url.origin);
				
					appObj.iTable[u.pathname] = appObj.curr_id;
					appObj.mTable[appObj.curr_id] = s;

					body = body.replace(form_match_exp, "<iframe src=http://" + url.hostname + "?autofillguardID=" + appObj.curr_id + " frameBorder=0></iframe>");
					fObj.setBody(body);
					fObj.setDecision("true");

					appObj.next_id();
				}
			}
		}
	}

	return fObj;
}

appObj.reqMatch = function(fObj)
{
	let url = new URL(fObj.getMetadata().url);
	let params = url.searchParams;
	

	if(params.get('autofillguardID') in appObj.mTable)
	{
		return true;
	}

	for(let k in appObj.iTable)
	{
		if(fObj.getMetadata().url.toString().includes(k))
		{
			if(!appObj.onGoing)
			{
				appObj.onGoing = true;
				return true;
			}
			else
			{
				appObj.onGoing = false;
			}
		}
	}

	if(fObj.getMetadata().url == "http://" + url.hostname + "/autofill/forwarding")
	{
		return true;
	}

	return false;
}

appObj.reqApply = function(fObj)
{
	let params = (new URL(fObj.getMetadata().url)).searchParams;
	let id = params.get('autofillguardID');

	if(id in appObj.mTable)
	{
		fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
		fObj.setBody(appObj.mTable[id]);
		fObj.setDecision("cache");
	}
	else
	{
		if(fObj.getMetadata().url != appObj.currURL)
		{
			fetch(fObj.getMetadata(), {redirect: 'follow'}).then(resp => {
				resp.text().then(body => {
					f2fInst.broadcastMsg(["AUTOFILLGUARD"], resp.url);

					appObj.currURL = resp.url;
					appObj.currBody = body;
				})
			});

			fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
			fObj.setBody("Autofill Guard Loading");
			fObj.setDecision("cache");
		}
		else
		{
			fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
			fObj.setBody(appObj.currBody);
			fObj.setDecision("cache");
		}
	}

	return fObj;
}

appObj.tcbMatch = true;

appObj.tcbApply = `
var appObj = new Object();

appObj.msgLabel = ["AUTOFILLGUARD"];
appObj.msgHandler = function(label, msg)
{
	window.location.href = msg;
};

handlers.push(appObj);
`;

appObj.setRespMatchPath("http://eval2.com/");
appObj.setActionMatch(/ucp.php/);

f2fInst.addApp(appObj);
