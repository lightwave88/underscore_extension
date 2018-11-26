!(function (global) {
    let _;
    (function () {

        if (typeof window !== "undefined" && typeof document !== "undefined") {
            if (typeof window._ === undefined) {
                throw new TypeError("need import lodash or underscode");
            }
            _ = window._;

            // 建構
            factory(_);

        } else if (typeof module !== 'undefined' && module.exports) {
            // 指定 loadash|underscode 的 path

            module.exports = function (_path) {

                if (typeof _path == "string") {
                    _ = require(_path);
                } else {
                    _ = _path;
                }
                // 建構
                factory(_);
            };
        } else if (typeof (window) === "undefined" && self !== "undefined" && typeof (importScripts) === 'function') {
            debugger;
            // webWorker 環境
            // console.log("worker")

            if (typeof (global._) === "undefined") {
                // worker 本體建構
                return;
            }
            _ = global._;

            // 建構
            factory(_);
        } else {
            throw new TypeError("not support your system");
        }

    }());
    ////////////////////////////////////////////////////////////
    function factory(_) {
        _.mixin({
            gseries: gseries
        });
    }
    //
    // function* (){
    //      yield fn_1(()=> promise);
    //      yield fn_2(()=> promise);
    // }
    //

    // 要注意的參數
    // context: 上下文
    // args: [函式參數]
    function gseries(context, fn) {
        debugger;

        let iterator;

        if (/generator/i.test(_.getClass(context))) {
            iterator = context;
            context = null;

            return factory_1(iterator, [], context, null);
        } else {
            if (typeof context == "function") {
                fn = context;
                context = null;
            }
            return factory_2(context, fn)
        }
    }
    //================================================
    let global_it;
    let user_it;
    let error;
    //================================================
    function factory_1(iterator, args, context, fn) {
        return new Promise(function (resolve, reject) {

            if (typeof fn == "function") {
                // 初始化 fn
                user_it = fn.apply(context, args);
            } else {
                user_it = iterator;
            }
            //----------------------------
            let job = getJob(resolve, reject);

            global_it = job();

            // 開始執行 job(fn())
            global_it.next();
        });
    };
    //================================================
    function factory_2(context, fn) {

        return function () {
            let args = Array.from(arguments);
            //-----------------------
            return factory_1(null, args, context, fn);
        };
    }
    //================================================

    // (user_it, global_it) 透過閉包獲得
    function getJob(resolve, reject) {
        // 目的是當碰到 promise 時會暫停整個 fn
        // 等 promise 再繼續
        return function* job() {
            let value;

            while (true) {
                debugger;

                let res;
                // 執行 fn
                try {
                    // 執行 fn
                    res = user_it.next(value);
                } catch (err) {

                    closeIterator();

                    reject(err);
                    return;
                }
                //-----------------------
                let done = res.done;
                value = res.value;

                if (value instanceof Promise) {

                    // 非同步
                    // 所以會先跳到 yield
                    value.then(function (data) {
                        debugger;
                        value = data;

                        // job 繼續
                        global_it.next();
                    }, function (_error) {

                        if (!(_error instanceof Error)) {

                            _error = new Error(String(_error));
                        }
                        error = _error;

                        // job 繼續
                        global_it.next();
                    });
                    debugger;
                    // 最重要的地方
                    // job 暫停
                    // 等 promise 結束再繼續
                    yield;
                }
                //-----------------------
                debugger;
                if (done || (error instanceof Error)) {

                    closeIterator();

                    if (error instanceof Error) {
                        reject(error);
                    } else {
                        resolve(value);
                    }
                    return;
                }
            } // while end
        } // fn end
        //-----------------------
    }
    //================================================
    function closeIterator() {
        try {
            global_it.close();
            user_it.close();
        } catch (error) {

        } finally {
            global_it = undefined;
            user_it = undefined;
        }
    }
})(this || {});
