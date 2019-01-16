!(function () {
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
                    let _res;
                    let _rej;

                    let p1 = new Promise(function (res, rej) {
                        _res = res;
                        _rej = rej;
                    });
                    //-----------------------
                    let msg;

                    let p2;
                    if (typeof (job) == "function") {
                        p2 = job();

                        if (!(p2 instanceof Promise)) {
                            throw new TypeError("waitJob arg[0] must return promise");
                        }
                    } else if (job instanceof Promise) {
                        p2 = job;
                    } else {
                        throw new TypeError("waitJob arg[0] must be promise or function return promise");
                    }
                    //-----------------------

                    p2.then(function (data) {
                        _res(data);
                    }, function (err) {
                        _rej(err);
                    });

                    setTimeout(function () {
                        _rej(new Error('timeout'));
                    }, timeLimit);
                    //-----------------------

                    return p1;
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
        if (typeof _.readFile == null) {
            _.mixin({
                readFile: function (path, code, timelimit) {

                    code = code || 'utf-8';

                    let fs;
                    try {
                        fs = require('fs');
                    } catch (error) {
                        throw new Error('readFile() no support in this sys');
                    }
                    //-----------------------
                    let _res;
                    let _rej;

                    let p1 = new Promise(function (res, rej) {
                        _res = res;
                        _rej = rej;
                    });
                    //-----------------------
                    let p = new Promise(function (res, rej) {
                        fs.exists(path, function (data) {
                            res(data);
                        });
                    });
                    //-----------------------
                    p = p.then(function (data) {
                        let r;
                        if (!data) {
                            r = null;
                        } else {
                            r = new Promise(function (res, rej) {
                                fs.readFile(path, code, function (err, data) {
                                    if (err) {
                                        rej(err);
                                    } else {
                                        res(data);
                                    }
                                });
                            });
                        }
                        return r;
                    });
                    //-----------------------
                    p.then(function (data) {
                        _res(data);
                    }, function (err) {
                        _rej(err);
                    });
                    //-----------------------
                    if (timelimit) {
                        setTimeout(function () {
                            _rej('timeout');
                        }, timelimit);
                    }
                    return p1;
                }
            });
        }

    }

})