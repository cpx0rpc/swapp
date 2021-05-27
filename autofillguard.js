var appObj = new Object();
var curr_id = "0";
var mTable = {};
var iTable = {};
var currReq;
var onGoing = false;
var currBody;
var currURL = "";

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

appObj.respApply = async function(fObj)
{
	let body = fObj.getBody();
	let form_match_exp = /<form.*<\/form>/s;
	let f = body.match(form_match_exp);

	if(f)
	{
		let s = f.toString();
		let url = new URL(fObj.getMetadata().url);
		body = body.replace(form_match_exp, "<iframe src=http://" + url.hostname + "?autofillguardID=" + curr_id + " frameBorder=0></iframe>");

		let found = s.match(/action\s*=.*?[>\s]/i);

		if(found)
		{
			found = found[0].match(/=['"\s]*.*?['"]/i);
			found = found[0].substring(1);

			if(found[0] == "\"" || found[0] == "\'")
			{
				found = found.substring(1, found.length-1);
			}

			iTable[found] = curr_id;
		}

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

	for(let k in iTable)
	{
		if(fObj.getMetadata().url.toString().includes(k))
		{
			if(!onGoing)
			{
				console.log("Found:", k);
				onGoing = true;
				return true;
			}
			else
			{
				onGoing = false;
			}
		}
	}

	if(fObj.getMetadata().url == "http://localhost/autofill/forwarding")
	{
		console.log("Forwarding detected");
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
	else
	{
		if(fObj.getMetadata().url != currURL)
		{
			fetch(fObj.getMetadata(), {redirect: 'follow'}).then(resp => {
				console.log("Forwarding resp: ", resp);
				resp.text().then(body => {
					f2fInst.broadcastMsg(["AUTOFILLGUARD"], resp.url);

					currURL = resp.url;
					currBody = body;
					console.log("Body: ", currBody);
				})
			});
			/*currReq = new fProto();
			currReq.setMeta(fObj.getMetadata());
			currReq.updateMeta({destination: ""});
			currReq.setBody(fObj.getBody());*/
			fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
			fObj.setBody("Autofill Guard Loading");
			fObj.setDecision("cache");
			

			//Notify TCB
			/*console.log(fObj.getMetadata(), fObj.getBody());
			let msg = JSON.stringify({url: fObj.getMetadata().url, method: "POST", body: JSON.stringify({id: 'GuEng', password: 'muasus'})});
			console.log(msg);*/
			
		}
		else
		{
			/*console.log("Forwarding info: ", fObj.getMetadata(), fObj.getBody());
			console.log("Current info: ", currReq.getMetadata(), currReq.getBody());
			r = new Request(currReq.getMetadata().url, {bodyUsed: true, body: currReq.getMetadata().body, method: "POST", referrer: currReq.getMetadata().referrer});
			fObj.setMeta(r);
			fObj.setBody(currReq.getBody());
			fObj.setDecision("true");

			console.log("Final info: ", fObj.getMetadata(), fObj.getBody());*/
			fObj.setMeta({"status": 200, "statusText": "OK", "headers": {'Content-Type': 'text/html'}});
			fObj.setBody(currBody);
			fObj.setDecision("cache");
		}
	}
	if(fObj.getMetadata().url == "http://localhost/form_submit.php")
	{
		console.log("Original: ", fObj.getMetadata(), fObj.getBody());
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

f2fInst.addApp(appObj);
