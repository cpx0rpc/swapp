if (!self.define) {
    const e = e => {
            "require" !== e && (e += ".js");
            let t = Promise.resolve();
            return s[e] || (t = new Promise((async t => {
                if ("document" in self) {
                    const s = document.createElement("script");
                    s.src = e, document.head.appendChild(s), s.onload = t
                } else importScripts(e), t()
            }))), t.then((() => {
                if (!s[e]) throw new Error(`Module ${e} didn’t register its module`);
                return s[e]
            }))
        },
        t = (t, s) => {
            Promise.all(t.map(e)).then((e => s(1 === e.length ? e[0] : e)))
        },
        s = {
            require: Promise.resolve(t)
        };
    self.define = (t, r, n) => {
        s[t] || (s[t] = Promise.resolve().then((() => {
            let s = {};
            const i = {
                uri: location.origin + t.slice(1)
            };
            return Promise.all(r.map((t => {
                switch (t) {
                    case "exports":
                        return s;
                    case "module":
                        return i;
                    default:
                        return e(t)
                }
            }))).then((e => {
                const t = n(...e);
                return s.default || (s.default = t), s
            }))
        })))
    }
}
define("./workbox-sw.js", [], (function() {
    "use strict";
    try {
        self["workbox:core:6.1.5"] && _()
    } catch (e) {}
    const e = (e, ...t) => {
        let s = e;
        return t.length > 0 && (s += ` :: ${JSON.stringify(t)}`), s
    };
    class t extends Error {
        constructor(t, s) {
            super(e(t, s)), this.name = t, this.details = s
        }
    }
    try {
        self["workbox:routing:6.1.5"] && _()
    } catch (e) {}
    const s = e => e && "object" == typeof e ? e : {
        handle: e
    };
    class r {
        constructor(e, t, r = "GET") {
            this.handler = s(t), this.match = e, this.method = r
        }
        setCatchHandler(e) {
            this.catchHandler = s(e)
        }
    }
    class n extends r {
        constructor(e, t, s) {
            super((({
                url: t
            }) => {
                const s = e.exec(t.href);
                if (s && (t.origin === location.origin || 0 === s.index)) return s.slice(1)
            }), t, s)
        }
    }
    class i {
        constructor() {
            this.t = new Map, this.i = new Map
        }
        get routes() {
            return this.t
        }
        addFetchListener() {/*
            self.addEventListener("fetch", (e => {
                const {
                    request: t
                } = e, s = this.handleRequest({
                    request: t,
                    event: e
                });
                s && e.respondWith(s)
            }))*/
						let ref = this;

						wbApp.reqApply = async function(fObj) {
							let e = fObj.getMetadata();

							const {
                    request: t
                } = e, s = await ref.wbHandleRequest({
                    request: e,
                    event: e
              });

              if(s)
              {
							  let b = await s.text();
							  fObj.setMeta(s);
							  fObj.setBody(b);
							  fObj.setDecision("cache");
              }
              else
              {
                fObj.setDecision("true");
              }

							return fObj;
						}
        }
        addCacheListener() {
            self.addEventListener("message", (e => {
                if (e.data && "CACHE_URLS" === e.data.type) {
                    const {
                        payload: t
                    } = e.data, s = Promise.all(t.urlsToCache.map((t => {
                        "string" == typeof t && (t = [t]);
                        const s = new Request(...t);
                        return wbHandleRequest({
                            request: s,
                            event: e
                        })
                    })));
                    e.waitUntil(s), e.ports && e.ports[0] && s.then((() => e.ports[0].postMessage(!0)))
                }
            }))
        }
        wbHandleRequest({
            request: e,
            event: t
        }) {
            const s = new URL(e.url, location.href);
            if (!s.protocol.startsWith("http")) return;
            const r = s.origin === location.origin,
                {
                    params: n,
                    route: i
                } = this.findMatchingRoute({
                    event: t,
                    request: e,
                    sameOrigin: r,
                    url: s
                });
            let a = i && i.handler;
            const c = e.method;
            if (!a && this.i.has(c) && (a = this.i.get(c)), !a) return;
            let o;
            try {
                o = a.handle({
                    url: s,
                    request: e,
                    event: t,
                    params: n
                })
            } catch (e) {
                o = Promise.reject(e)
            }
            const h = i && i.catchHandler;
            return o instanceof Promise && (this.o || h) && (o = o.catch((async r => {
                if (h) try {
                    return await h.handle({
                        url: s,
                        request: e,
                        event: t,
                        params: n
                    })
                } catch (e) {
                    r = e
                }
                if (this.o) return this.o.handle({
                    url: s,
                    request: e,
                    event: t
                });
                throw r
            }))), o
        }
        findMatchingRoute({
            url: e,
            sameOrigin: t,
            request: s,
            event: r
        }) {
            const n = this.t.get(s.method) || [];
            for (const i of n) {
                let n;
                const a = i.match({
                    url: e,
                    sameOrigin: t,
                    request: s,
                    event: r
                });
                if (a) return n = a, (Array.isArray(a) && 0 === a.length || a.constructor === Object && 0 === Object.keys(a).length || "boolean" == typeof a) && (n = void 0), {
                    route: i,
                    params: n
                }
            }
            return {}
        }
        setDefaultHandler(e, t = "GET") {
            this.i.set(t, s(e))
        }
        setCatchHandler(e) {
            this.o = s(e)
        }
        registerRoute(e) {
            this.t.has(e.method) || this.t.set(e.method, []), this.t.get(e.method).push(e)
        }
        unregisterRoute(e) {
            if (!this.t.has(e.method)) throw new t("unregister-route-but-not-found-with-method", {
                method: e.method
            });
            const s = this.t.get(e.method).indexOf(e);
            if (!(s > -1)) throw new t("unregister-route-route-not-registered");
            this.t.get(e.method).splice(s, 1)
        }
    }
    let a;

    function c() {
        return (c = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var s = arguments[t];
                for (var r in s) Object.prototype.hasOwnProperty.call(s, r) && (e[r] = s[r])
            }
            return e
        }).apply(this, arguments)
    }
    const o = {
            googleAnalytics: "googleAnalytics",
            precache: "precache-v2",
            prefix: "workbox",
            runtime: "runtime",
            suffix: "undefined" != typeof registration ? registration.scope : ""
        },
        h = e => [o.prefix, e, o.suffix].filter((e => e && e.length > 0)).join("-"),
        u = e => e || h(o.precache),
        l = e => e || h(o.runtime);

    function f(e, t) {
        const s = t();
        return e.waitUntil(s), s
    }
    try {
        self["workbox:precaching:6.1.5"] && _()
    } catch (e) {}

    function d(e) {
        if (!e) throw new t("add-to-cache-list-unexpected-type", {
            entry: e
        });
        if ("string" == typeof e) {
            const t = new URL(e, location.href);
            return {
                cacheKey: t.href,
                url: t.href
            }
        }
        const {
            revision: s,
            url: r
        } = e;
        if (!r) throw new t("add-to-cache-list-unexpected-type", {
            entry: e
        });
        if (!s) {
            const e = new URL(r, location.href);
            return {
                cacheKey: e.href,
                url: e.href
            }
        }
        const n = new URL(r, location.href),
            i = new URL(r, location.href);
        return n.searchParams.set("__WB_REVISION__", s), {
            cacheKey: n.href,
            url: i.href
        }
    }
    class w {
        constructor() {
            this.updatedURLs = [], this.notUpdatedURLs = [], this.handlerWillStart = async ({
                request: e,
                state: t
            }) => {
                t && (t.originalRequest = e)
            }, this.cachedResponseWillBeUsed = async ({
                event: e,
                state: t,
                cachedResponse: s
            }) => {
                if ("install" === e.type) {
                    const e = t.originalRequest.url;
                    s ? this.notUpdatedURLs.push(e) : this.updatedURLs.push(e)
                }
                return s
            }
        }
    }
    class p {
        constructor({
            precacheController: e
        }) {
            this.cacheKeyWillBeUsed = async ({
                request: e,
                params: t
            }) => {
                const s = t && t.cacheKey || this.h.getCacheKeyForURL(e.url);
                return s ? new Request(s) : e
            }, this.h = e
        }
    }
    let b;
    async function y(e, s) {
        let r = null;
        if (e.url) {
            r = new URL(e.url).origin
        }
        if (r !== self.location.origin) throw new t("cross-origin-copy-response", {
            origin: r
        });
        const n = e.clone(),
            i = {
                headers: new Headers(n.headers),
                status: n.status,
                statusText: n.statusText
            },
            a = s ? s(i) : i,
            c = function() {
                if (void 0 === b) {
                    const e = new Response("");
                    if ("body" in e) try {
                        new Response(e.body), b = !0
                    } catch (e) {
                        b = !1
                    }
                    b = !1
                }
                return b
            }() ? n.body : await n.blob();
        return new Response(c, a)
    }

    function v(e, t) {
        const s = new URL(e);
        for (const e of t) s.searchParams.delete(e);
        return s.href
    }
    class m {
        constructor() {
            this.promise = new Promise(((e, t) => {
                this.resolve = e, this.reject = t
            }))
        }
    }
    const g = new Set;
    try {
        self["workbox:strategies:6.1.5"] && _()
    } catch (e) {}

    function R(e) {
        return "string" == typeof e ? new Request(e) : e
    }
    class q {
        constructor(e, t) {
            this.u = {}, Object.assign(this, t), this.event = t.event, this.l = e, this.p = new m, this.v = [], this.m = [...e.plugins], this.g = new Map;
            for (const e of this.m) this.g.set(e, {});
            //this.event.waitUntil(this.p.promise)
        }
        async fetch(e) {
            const {
                event: s
            } = this;
            let r = R(e);
            if ("navigate" === r.mode && s instanceof FetchEvent && s.preloadResponse) {
                const e = await s.preloadResponse;
                if (e) return e
            }
            const n = this.hasCallback("fetchDidFail") ? r.clone() : null;
            try {
                for (const e of this.iterateCallbacks("requestWillFetch")) r = await e({
                    request: r.clone(),
                    event: s
                })
            } catch (e) {
                throw new t("plugin-error-request-will-fetch", {
                    thrownError: e
                })
            }
            const i = r.clone();
            try {
                let e;
                e = await fetch(r, "navigate" === r.mode ? void 0 : this.l.fetchOptions);
                for (const t of this.iterateCallbacks("fetchDidSucceed")) e = await t({
                    event: s,
                    request: i,
                    response: e
                });
                return e
            } catch (e) {
                throw n && await this.runCallbacks("fetchDidFail", {
                    error: e,
                    event: s,
                    originalRequest: n.clone(),
                    request: i.clone()
                }), e
            }
        }
        async fetchAndCachePut(e) {
            const t = await this.fetch(e),
                s = t.clone();
            return this.waitUntil(this.cachePut(e, s)), t
        }
        async cacheMatch(e) {
            const t = R(e);
            let s;
            const {
                cacheName: r,
                matchOptions: n
            } = this.l, i = await this.getCacheKey(t, "read"), a = c({}, n, {
                cacheName: r
            });
            s = await caches.match(i, a);
            for (const e of this.iterateCallbacks("cachedResponseWillBeUsed")) s = await e({
                cacheName: r,
                matchOptions: n,
                cachedResponse: s,
                request: i,
                event: this.event
            }) || void 0;
            return s
        }
        async cachePut(e, s) {
            const r = R(e);
            var n;
            await (n = 0, new Promise((e => setTimeout(e, n))));
            const i = await this.getCacheKey(r, "write");
            if (!s) throw new t("cache-put-with-no-response", {
                url: (a = i.url, new URL(String(a), location.href).href.replace(new RegExp(`^${location.origin}`), ""))
            });
            var a;
            const o = await this.R(s);
            if (!o) return !1;
            const {
                cacheName: h,
                matchOptions: u
            } = this.l, l = await self.caches.open(h), f = this.hasCallback("cacheDidUpdate"), d = f ? await async function(e, t, s, r) {
                const n = v(t.url, s);
                if (t.url === n) return e.match(t, r);
                const i = c({}, r, {
                        ignoreSearch: !0
                    }),
                    a = await e.keys(t, i);
                for (const t of a)
                    if (n === v(t.url, s)) return e.match(t, r)
            }(l, i.clone(), ["__WB_REVISION__"], u): null;
            try {
                await l.put(i, f ? o.clone() : o)
            } catch (e) {
                throw "QuotaExceededError" === e.name && await async function() {
                    for (const e of g) await e()
                }(), e
            }
            for (const e of this.iterateCallbacks("cacheDidUpdate")) await e({
                cacheName: h,
                oldResponse: d,
                newResponse: o.clone(),
                request: i,
                event: this.event
            });
            return !0
        }
        async getCacheKey(e, t) {
            if (!this.u[t]) {
                let s = e;
                for (const e of this.iterateCallbacks("cacheKeyWillBeUsed")) s = R(await e({
                    mode: t,
                    request: s,
                    event: this.event,
                    params: this.params
                }));
                this.u[t] = s
            }
            return this.u[t]
        }
        hasCallback(e) {
            for (const t of this.l.plugins)
                if (e in t) return !0;
            return !1
        }
        async runCallbacks(e, t) {
            for (const s of this.iterateCallbacks(e)) await s(t)
        }* iterateCallbacks(e) {
            for (const t of this.l.plugins)
                if ("function" == typeof t[e]) {
                    const s = this.g.get(t),
                        r = r => {
                            const n = c({}, r, {
                                state: s
                            });
                            return t[e](n)
                        };
                    yield r
                }
        }
        waitUntil(e) {
            return this.v.push(e), e
        }
        async doneWaiting() {
            let e;
            for (; e = this.v.shift();) await e
        }
        destroy() {
            this.p.resolve()
        }
        async R(e) {
            let t = e,
                s = !1;
            for (const e of this.iterateCallbacks("cacheWillUpdate"))
                if (t = await e({
                        request: this.request,
                        response: t,
                        event: this.event
                    }) || void 0, s = !0, !t) break;
            return s || t && 200 !== t.status && (t = void 0), t
        }
    }
    class U extends class {
        constructor(e = {}) {
            this.cacheName = l(e.cacheName), this.plugins = e.plugins || [], this.fetchOptions = e.fetchOptions, this.matchOptions = e.matchOptions
        }
        handle(e) {
            const [t] = this.handleAll(e);
            return t
        }
        handleAll(e) {
            e instanceof FetchEvent && (e = {
                event: e,
                request: e.request
            });
            const t = e.event,
                s = "string" == typeof e.request ? new Request(e.request) : e.request,
                r = "params" in e ? e.params : void 0,
                n = new q(this, {
                    event: t,
                    request: s,
                    params: r
                }),
                i = this.q(n, s, t);
            return [i, this.U(i, n, s, t)]
        }
        async q(e, s, r) {
            let n;
            await e.runCallbacks("handlerWillStart", {
                event: r,
                request: s
            });
            try {
                if (n = await this.j(s, e), !n || "error" === n.type) throw new t("no-response", {
                    url: s.url
                })
            } catch (t) {
                for (const i of e.iterateCallbacks("handlerDidError"))
                    if (n = await i({
                            error: t,
                            event: r,
                            request: s
                        }), n) break;
                if (!n) throw t
            }
            for (const t of e.iterateCallbacks("handlerWillRespond")) n = await t({
                event: r,
                request: s,
                response: n
            });
            return n
        }
        async U(e, t, s, r) {
            let n, i;
            try {
                n = await e
            } catch (i) {}
            try {
                await t.runCallbacks("handlerDidRespond", {
                    event: r,
                    request: s,
                    response: n
                }), await t.doneWaiting()
            } catch (e) {
                i = e
            }
            if (await t.runCallbacks("handlerDidComplete", {
                    event: r,
                    request: s,
                    response: n,
                    error: i
                }), t.destroy(), i) throw i
        }
    } {
        constructor(e = {}) {
            e.cacheName = u(e.cacheName), super(e), this._ = !1 !== e.fallbackToNetwork, this.plugins.push(U.copyRedirectedCacheableResponsesPlugin)
        }
        async j(e, t) {
            const s = await t.cacheMatch(e);
            return s || (t.event && "install" === t.event.type ? await this.L(e, t) : await this.k(e, t))
        }
        async k(e, s) {
            let r;
            if (!this._) throw new t("missing-precache-entry", {
                cacheName: this.cacheName,
                url: e.url
            });
            return r = await s.fetch(e), r
        }
        async L(e, s) {
            this.C();
            const r = await s.fetch(e);
            if (!await s.cachePut(e, r.clone())) throw new t("bad-precaching-response", {
                url: e.url,
                status: r.status
            });
            return r
        }
        C() {
            let e = null,
                t = 0;
            for (const [s, r] of this.plugins.entries()) r !== U.copyRedirectedCacheableResponsesPlugin && (r === U.defaultPrecacheCacheabilityPlugin && (e = s), r.cacheWillUpdate && t++);
            0 === t ? this.plugins.push(U.defaultPrecacheCacheabilityPlugin) : t > 1 && null !== e && this.plugins.splice(e, 1)
        }
    }
    U.defaultPrecacheCacheabilityPlugin = {
        cacheWillUpdate: async ({
            response: e
        }) => !e || e.status >= 400 ? null : e
    }, U.copyRedirectedCacheableResponsesPlugin = {
        cacheWillUpdate: async ({
            response: e
        }) => e.redirected ? await y(e) : e
    };
    class j {
        constructor({
            cacheName: e,
            plugins: t = [],
            fallbackToNetwork: s = !0
        } = {}) {
            this.N = new Map, this.P = new Map, this.O = new Map, this.l = new U({
                cacheName: u(e),
                plugins: [...t, new p({
                    precacheController: this
                })],
                fallbackToNetwork: s
            }), this.install = this.install.bind(this), this.activate = this.activate.bind(this)
        }
        get strategy() {
            return this.l
        }
        precache(e) {
            this.addToCacheList(e), this.S || (self.addEventListener("install", this.install), self.addEventListener("activate", this.activate), this.S = !0)
        }
        addToCacheList(e) {
            const s = [];
            for (const r of e) {
                "string" == typeof r ? s.push(r) : r && void 0 === r.revision && s.push(r.url);
                const {
                    cacheKey: e,
                    url: n
                } = d(r), i = "string" != typeof r && r.revision ? "reload" : "default";
                if (this.N.has(n) && this.N.get(n) !== e) throw new t("add-to-cache-list-conflicting-entries", {
                    firstEntry: this.N.get(n),
                    secondEntry: e
                });
                if ("string" != typeof r && r.integrity) {
                    if (this.O.has(e) && this.O.get(e) !== r.integrity) throw new t("add-to-cache-list-conflicting-integrities", {
                        url: n
                    });
                    this.O.set(e, r.integrity)
                }
                if (this.N.set(n, e), this.P.set(n, i), s.length > 0) {
                    const e = `Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;
                    console.warn(e)
                }
            }
        }
        install(e) {
            return f(e, (async () => {
                const t = new w;
                this.strategy.plugins.push(t);
                for (const [t, s] of this.N) {
                    const r = this.O.get(s),
                        n = this.P.get(t),
                        i = new Request(t, {
                            integrity: r,
                            cache: n,
                            credentials: "same-origin"
                        });
                    await Promise.all(this.strategy.handleAll({
                        params: {
                            cacheKey: s
                        },
                        request: i,
                        event: e
                    }))
                }
                const {
                    updatedURLs: s,
                    notUpdatedURLs: r
                } = t;
                return {
                    updatedURLs: s,
                    notUpdatedURLs: r
                }
            }))
        }
        activate(e) {
            return f(e, (async () => {
                const e = await self.caches.open(this.strategy.cacheName),
                    t = await e.keys(),
                    s = new Set(this.N.values()),
                    r = [];
                for (const n of t) s.has(n.url) || (await e.delete(n), r.push(n.url));
                return {
                    deletedURLs: r
                }
            }))
        }
        getURLsToCacheKeys() {
            return this.N
        }
        getCachedURLs() {
            return [...this.N.keys()]
        }
        getCacheKeyForURL(e) {
            const t = new URL(e, location.href);
            return this.N.get(t.href)
        }
        async matchPrecache(e) {
            const t = e instanceof Request ? e.url : e,
                s = this.getCacheKeyForURL(t);
            if (s) {
                return (await self.caches.open(this.strategy.cacheName)).match(s)
            }
        }
        createHandlerBoundToURL(e) {
            const s = this.getCacheKeyForURL(e);
            if (!s) throw new t("non-precached-url", {
                url: e
            });
            return t => (t.request = new Request(e), t.params = c({
                cacheKey: s
            }, t.params), this.strategy.handle(t))
        }
    }
    let L;
    const x = () => (L || (L = new j), L);
    class k extends r {
        constructor(e, t) {
            super((({
                request: s
            }) => {
                const r = e.getURLsToCacheKeys();
                for (const e of function*(e, {
                        ignoreURLParametersMatching: t = [/^utm_/, /^fbclid$/],
                        directoryIndex: s = "index.html",
                        cleanURLs: r = !0,
                        urlManipulation: n
                    } = {}) {
                        const i = new URL(e, location.href);
                        i.hash = "", yield i.href;
                        const a = function(e, t = []) {
                            for (const s of [...e.searchParams.keys()]) t.some((e => e.test(s))) && e.searchParams.delete(s);
                            return e
                        }(i, t);
                        if (yield a.href, s && a.pathname.endsWith("/")) {
                            const e = new URL(a.href);
                            e.pathname += s, yield e.href
                        }
                        if (r) {
                            const e = new URL(a.href);
                            e.pathname += ".html", yield e.href
                        }
                        if (n) {
                            const e = n({
                                url: i
                            });
                            for (const t of e) yield t.href
                        }
                    }(s.url, t)) {
                    const t = r.get(e);
                    if (t) return {
                        cacheKey: t
                    }
                }
            }), e.strategy)
        }
    }

    function C(e) {
        const s = x();
        ! function(e, s, c) {
            let o;
            if ("string" == typeof e) {
                const t = new URL(e, location.href);
                o = new r((({
                    url: e
                }) => e.href === t.href), s, c)
            } else if (e instanceof RegExp) o = new n(e, s, c);
            else if ("function" == typeof e) o = new r(e, s, c);
            else {
                if (!(e instanceof r)) throw new t("unsupported-route-type", {
                    moduleName: "workbox-routing",
                    funcName: "registerRoute",
                    paramName: "capture"
                });
                o = e
            }(a || (a = new i, a.addFetchListener(), a.addCacheListener()), a).registerRoute(o)
        }(new k(s, e))
    }
    var N;
    self.addEventListener("message", (e => {
            e.data && "SKIP_WAITING" === e.data.type && self.skipWaiting()
        })), N = {
            ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]
        },
        function(e) {
            x().precache(e)
        }([{
            url: "autofillguard.js",
            revision: "11e2831ce371784841de5f9f3d4e8b9b"
        }, {
            url: "cacheguard.js",
            revision: "270154a70386dabc13aec38d51e04560"
        }, {
            url: "data.json",
            revision: "f3d39ccd8bb89f5f2f26685e4b8ea94b"
        }, {
            url: "domguard.js",
            revision: "4632dba44fb7a4a866f133453cd60fc4"
        }, {
            url: "f2f.js",
            revision: "e72c71b27f637349b48cb58830254128"
        }, {
            url: "he.js",
            revision: "0d828bbfe4d157ec8da0b81a18db9c84"
        }, {
            url: "index.html",
            revision: "990572c5b1b9625562866d82269c7764"
        }, {
            url: "integrity_checker.js",
            revision: "0bc41475301400585cd2b8d7df5cad78"
        }, {
            url: "jsxss.js",
            revision: "20862495b1d14424c169ec73626c6a15"
        }, {
            url: "Storage.js",
            revision: "0e2950b0aa038405a4ffa2911a28c116"
        }, {
            url: "sw.js",
            revision: "87177b166ea60dff3bef73e064399a30"
        }, {
            url: "tcb/init.js",
            revision: "2c5a9aee7f23854235afcd01886c562f"
        }, {
            url: "testautofill.html",
            revision: "6b4515960df91c4acd724e34ea021668"
        }, {
            url: "testcache.html",
            revision: "652cb260c8968ed384aaed361e23920b"
        }, {
            url: "testSB.html",
            revision: "ea5d1fdd314299eace949aadcacb4abd"
        }, {
            url: "testxss.html",
            revision: "6d4381767d3894dd38e710cdfbaf3214"
        }]), C(N)
}));
//# sourceMappingURL=workbox-sw.js.map
