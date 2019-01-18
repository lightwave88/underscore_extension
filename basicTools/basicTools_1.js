!(function (global) {
    (function () {
        // debugger;

        if (typeof (module) == 'object' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (obj) {
                // 建構
                factory(obj);
            };
        } else {
            factory(global._);
        }
    }());

    function factory(_) {
        if (_.defineProperty == null) {
            _.mixin({
                // (Object.defineProperty)的封裝
                defineProperty: function (obj, key, val, enumerable) {
                    Object.defineProperty(obj, key, {
                        value: val,
                        enumerable: !!enumerable,
                        writable: true,
                        configurable: true
                    });
                }
            });
        }
        //----------------------------
        if (_.isPlainObject == null) {
            _.mixin({
                // 是否是 {}
                // fix
                isPlainObject: function (obj) {
                    debugger;

                    if (typeof obj != "object") {
                        return false;
                    }

                    if (obj == null) {
                        return false;
                    }

                    let res = Object.prototype.toString.call(obj);

                    if (!/^\[object Object\]$/.test(res)) {
                        return false;
                    }

                    if (obj.constructor !== {}.constructor) {
                        return false;
                    }

                    return true;
                }
            });
        }
        //----------------------------
        if (_.getClass == null) {
            _.mixin({
                // 比系統 typeof 能辨識更多 type
                getClass: function (data) {
                    let _toString = Object.prototype.toString;

                    let type = typeof (data);

                    if (/object/.test(type)) {

                        if (data === null) {
                            type = "null";
                        } else {
                            type = _toString.call(data);

                            let res = /\[\w+\s+(\w+)\]/.exec(type);
                            if (res && res[1]) {
                                type = res[1];
                            }
                        }
                    }
                    return type;
                },
            });
        }
        //----------------------------
        if (_.waitJob == null) {
            _.mixin({
                // 等待一個任務並設下時限
                waitJob: function (job, timeLimit) {
                    const def = _.deferred();
                    //-----------------------
                    let msg;

                    let p;
                    if (typeof (job) == "function") {
                        p = job();

                        if (!(p instanceof Promise)) {
                            def.reject("waitJob arg[0] must return promise");
                        }
                    } else if (job instanceof Promise) {
                        p = job;
                    } else {
                        def.reject("waitJob arg[0] must be promise or function return promise");
                    }
                    //-----------------------

                    let timehandle = setTimeout(function () {
                        debugger;
                        clearTimeout(timehandle);
                        timehandle = undefined;
                        def.reject('timeout');
                    }, timeLimit);


                    p = p.then(function (data) {
                        debugger;
                        def.resolve(data);
                    }, function (err) {
                        debugger;
                        def.reject(err);
                    });

                    p.then(function () {
                        debugger;
                        if (timehandle) {
                            clearTimeout(timehandle);
                            timehandle = undefined;
                        }
                    });
                    //-----------------------

                    return def.promise();
                }
            });
        }
        //----------------------------
        if (typeof _.promise === 'undefined') {
            _.mixin({
                // 產生可以追蹤狀態的 promise
                promise: function (callback, context) {
                    let p;
                    if (callback instanceof Promise) {
                        p = Promise.resolve(callback);
                    } else if (typeof (callback) == "function") {
                        callback = (context === undefined ? callback : callback.bind(this));

                        p = new Promise(callback);
                    } else if (Array.isArray(callback)) {
                        callback = (context === undefined ? callback : callback.bind(this));

                        p = Promise.all(callback);
                    } else {
                        p = Promise.resolve(callback);
                    }
                    //-----------------------
                    if (p.__status == null) {
                        _.defineProperty(this._promise, '$status', 0, false);
                    }

                    p.then(function () {
                        p['$status'] = 1;
                    }, function (err) {
                        p['$status'] = 2;
                        err = (err instanceof Error) ? err : new Error(err);
                        throw err;
                    });

                    return p;
                }
            });
        }
        //----------------------------

    }

})(this || {});
