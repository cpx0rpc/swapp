//
// Internal use for easy access of the IndexedDB
//
function Storage() {
    this.ready = new Promise((resolve, reject) => {
        var request = indexedDB.open('F2F_PRIVATE');

        request.onupgradeneeded = e => {
            this.db = e.target.result;
            this.db.createObjectStore('store');
        };

        request.onsuccess = e => {
            this.db = e.target.result;
            resolve();
        };

        request.onerror = e => {
            this.db = e.target.result;
            reject(e);
        };
    });
}

Storage.prototype.get = function(key) {
    var obj = this;
    return this.ready.then(() => {
        return new Promise((resolve, reject) => {
            var request = obj.getStore().get(key);
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = reject;
        });
    });
};

Storage.prototype.createTable = function(name, key, columns){
    var obj = this;
    this.ready.then(function(){
        var current_version = obj.db.version;
        if(!obj.db.objectStoreNames.contains(name)){
            obj.db.close();

            obj.ready = new Promise((resolve, reject) => {
                var request = indexedDB.open('F2F_PRIVATE', current_version + 1);
                request.onupgradeneeded = e => {
                    obj.db = e.target.result;
                    var store = obj.db.createObjectStore(name, {
                        keyPath: key
                    });

                    for(i in columns){
                        store.createIndex(columns[i], columns[i], {unique: false});
                    }
                };

                request.onsuccess = e => {
                    obj.db = e.target.result;
                    resolve();
                };

                request.onerror = e => {
                    obj.db = e.target.result;
                    reject(e);
                };
            });
        }
    });
}

Storage.prototype.getStore = function() {
    return this.db
        .transaction(['store'], 'readwrite')
        .objectStore('store');
};

Storage.prototype.set = function(key, value) {
    var obj = this;
    return this.ready.then(() => {
        return new Promise((resolve, reject) => {
            var request = obj.getStore().put(value, key);
            request.onsuccess = resolve;
            request.onerror = reject;
        });
    });
};

Storage.prototype.delete = function(key, value) {
    indexedDB.deleteDatabase(location.origin);
};


