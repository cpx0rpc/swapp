var autofillguard = new Object();

autofillguard.curr_id = 0;
autofillguard.mTable = {};
autofillguard.iTable = {};
autofillguard.onGoing = false;
autofillguard.currBody = "";
autofillguard.currURL = "";
autofillguard.respMatchPath = [];
autofillguard.actionMatch = [];

autofillguard.setRespMatchPath = function(rmp)
{
	autofillguard.respMatchPath = rmp;
}

autofillguard.setActionMatch = function(am)
{
	autofillguard.actionMatch = am;
}

autofillguard.next_id = function()
{
	let int_id = parseInt(autofillguard.curr_id) + 1;

	autofillguard.curr_id = int_id.toString();
}

autofillguard.respMatch = function(fObj)
{
	let urlString = fObj.getMetadata().url.toString();

	if(autofillguard.respMatchPath.constructor === Array)
	{
		for(p in autofillguard.respMatchPath)
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
	else if(autofillguard.respMatchPath.constructor === RegExp)
	{
		if(urlString.match(autofillguard.respMatchPath))
		{
			return true;
		}
	}
	else if(autofillguard.respMatchPath.constructor === String)
	{
		return urlString == autofillguard.respMatchPath;
	}

	return false;
}

autofillguard.respApply = async function(fObj)
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

				if(autofillguard.actionMatch.constructor === Array)
				{
					for(a in autofillguard.actionMatch)
					{ 
						if(found.match(a))
						{
							matched = true;
						}
					}
				}
				else if(autofillguard.actionMatch.constructor === RegExp)
				{
					matched = found.match(autofillguard.actionMatch);
				}
				else if(autofillguard.actionMatch.constructor === String && autofillguard.actionMatch == found)
				{
					matched = true;
				}

				if(matched)
				{
					u = new URL(found, url.origin);
				
					autofillguard.iTable[u.pathname] = autofillguard.curr_id;
					autofillguard.mTable[autofillguard.curr_id] = s;

					body = body.replace(form_match_exp, "<iframe src=http://" + url.hostname + "?autofillguardID=" + autofillguard.curr_id + " frameBorder=0></iframe>");
					fObj.setBody(body);
					fObj.setDecision("true");

					autofillguard.next_id();
				}
			}
		}
	}

	return fObj;
}

autofillguard.reqMatch = function(fObj)
{
	let url = new URL(fObj.getMetadata().url);
	let params = url.searchParams;
	let gID = params.get('autofillguardID');

	if(gID && gID in autofillguard.mTable)
	{
		return true;
	}

	for(let k in autofillguard.iTable)
	{
		if(fObj.getMetadata().url.toString().includes(k))
		{
			if(!autofillguard.onGoing)
			{
				autofillguard.onGoing = true;
				return true;
			}
			else
			{
				autofillguard.onGoing = false;
			}
		}
	}

	if(fObj.getMetadata().url == "http://" + url.hostname + "/autofill/forwarding")
	{
		return true;
	}

	return false;
}

autofillguard.reqApply = function(fObj)
{
	let params = (new URL(fObj.getMetadata().url)).searchParams;
	let id = params.get('autofillguardID');

	if(id in autofillguard.mTable)
	{
		fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
		fObj.setBody(autofillguard.mTable[id]);
		fObj.setDecision("cache");
	}
	else
	{
		if(fObj.getMetadata().url != autofillguard.currURL)
		{
			fetch(fObj.getMetadata(), {redirect: 'follow'}).then(resp => {
				resp.text().then(body => {
					swappInst.broadcastMsg(["AUTOFILLGUARD"], resp.url);

					autofillguard.currURL = resp.url;
					autofillguard.currBody = body;
				})
			});

			fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
			fObj.setBody("[AG] Loading");
			fObj.setDecision("cache");
		}
		else
		{
			fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
			fObj.setBody(autofillguard.currBody);
			fObj.setDecision("cache");
		}
	}

	return fObj;
}

autofillguard.tcbMatch = true;

autofillguard.tcbApply = `
var autofillguard = new Object();

autofillguard.msgLabel = ["AUTOFILLGUARD"];
autofillguard.msgHandler = function(label, msg)
{
	window.location.href = msg;
};

handlers.push(autofillguard);
`;

// For evaluation
autofillguard.setRespMatchPath("http://eval2.com/");
autofillguard.setActionMatch(/ucp.php/);

console.log("[A]utofill[G]uard activated");
swappInst.addApp(autofillguard);
