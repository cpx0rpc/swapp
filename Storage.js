//
// Internal use for easy access of the IndexedDB
//
function Storage() {
    this.ready = new Promise((resolve, reject) => {
        var request = indexedDB.open('SWAPP_PRIVATE');

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
                var request = indexedDB.open('SWAPP_PRIVATE', current_version + 1);
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

// Utility functions (timing measurement) for evaluation only

function EStorage() {
    this.ready = new Promise((resolve, reject) => {
        var request = indexedDB.open('SWAPP_EVALUATION');

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

EStorage.prototype.getAll = function() {
    var obj = this;
    return this.ready.then(() => {
        return new Promise((resolve, reject) => {
            var request = obj.getStore().getAll();
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = reject;
        });
    });
};

EStorage.prototype.getStore = function() {
    return this.db
        .transaction(['store'], 'readwrite')
        .objectStore('store');
};

EStorage.prototype.set = function(key, value) {
    var obj = this;
    return this.ready.then(() => {
        return new Promise((resolve, reject) => {
            var request = obj.getStore().put(value, key);
            request.onsuccess = resolve;
            request.onerror = reject;
        });
    });
};

EStorage.prototype.delete = function(key, value) {
    indexedDB.deleteDatabase(location.origin);
};

let edb = new EStorage();

function createLabel(label)
{
  // Save a time-label to the dedicated storage

  let t = performance.now() + performance.timeOrigin;
  edb.set(t, {"time": t, "label": label});
}

async function getLabels()
{
  let labels = await edb.getAll();
  let results = [];
  let core = 0;
  let apps = {};

  for(let i=0; i<labels.length; i++)
  {
    let arr = labels[i].label.split(":", 3);
    let g = parseInt(arr[1]);
    
    if(results[g])
    {
      results[g].push(labels[i]);
    }
    else
    {
      results[g] = [labels[i]];
    }
  }

  for(let i=0; i<results.length; i++)
  {
    if(results[i] && results[i].length > 0)
    {
      for(let j=results[i].length-1; j>0; j--)
      {
        let diff = results[i][j]["time"] - results[i][j-1]["time"];
        let arr = results[i][j]["label"].split(":", 3);

        results[i][j]["time"] = diff;

        if(arr[0].includes("StartofAppRequestHandler") || arr[0].includes("EndRequestHandler") || arr[0].includes("StartActualRequest") || arr[0].includes("StartofAppResponseHandler") || arr[0].includes("EndResponseHandler"))
        {
          core += diff;
        }
        else if(arr[0].includes("EndofAppRequestHandler") || arr[0].includes("EndofAppResponseHandler"))
        {
          if(!apps.hasOwnProperty(arr[2]))
          {
            apps[arr[2]] = 0;
          }

          apps[arr[2]] += diff;
        }
      }
    }
  }

  console.log(core, apps, results);
}
