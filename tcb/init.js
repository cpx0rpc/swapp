(function(){
	//Disable Service Worker registration

	/*var swRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
	var inst_swRegister = function(path, option)
		{
			console.log("Service worker registration disallowed");
			return undefined;
		};

	Object.defineProperty(navigator.serviceWorker, "register",
		{		
			value: inst_swRegister,
			configurable: false,
			writable: false
		});
*/

	var swUnregister = ServiceWorkerRegistration.prototype.unregister.bind(ServiceWorkerRegistration.prototype);
	var inst_swUnregister = function()
		{
			console.log("Service worker unregistration disallowed");
			return undefined;
		};

	Object.defineProperty(ServiceWorkerRegistration.prototype, "unregister",
		{		
			value: inst_swUnregister,
			configurable: false,
			writable: false
		});

	//Enhance IDB
	var idb_open = indexedDB.open.bind(indexedDB);

	var inst_idbopen = function(name, version){
		if(name != "F2F_PRIVATE")
		{
			return idb_open.apply(window, arguments);
		}
		else
		{
			return new Error("Access not allowed");
		}
	};

	Object.defineProperty(indexedDB, "open", {
		value: inst_idbopen,
		configurable: false,
		writable: false
	});

	function intersect(a, b) {
		var setB = new Set(b);
		return [...new Set(a)].filter(x => setB.has(x));
	}

	//Init message channel
	var msgChannel = new MessageChannel();
	//__SECRET__
	var handlers = [];

	msgChannel.port1.onmessage = function(event) {
		let label = event.data.label;
		let msg = event.data.msg;
		
		if(event.data.secret != secret)
		{
			console.log("[Error] Incorrect secret code");
			return;
		}

		for(let i=0; i<handlers.length; i++)
		{
			let handler = handlers[i];

			if(handler.hasOwnProperty("msgLabel"))
			{
				let matchedLabel = intersect(handler.msgLabel, label);

				if(matchedLabel.length > 0)
				{
					handler.msgHandler(matchedLabel, msg); 
				}
			}
		}
	};	

	function sendMsg(label, msg)
	{
		navigator.serviceWorker.controller.postMessage({"label": label, "msg": msg, "secret": secret});
	}

	navigator.serviceWorker.controller.postMessage({"label": ["SWAPP_INIT"], "msg": "", "secret": secret}, [msgChannel.port2]);

	//__EOF__

})();


