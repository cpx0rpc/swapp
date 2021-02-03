(function(){
	//Disable Service Worker registration

	var swRegister = navigator.serviceWorker.register.bind(navigator.serviceWorker);
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

	//__EOF__

})();


