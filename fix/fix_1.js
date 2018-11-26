!(function (global) {

    let _;
    (function () {

        if (typeof window !== "undefined" && typeof document !== "undefined") {
            
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
                // worker 本體初始建構
                return;
            }
            _ = global._;

            // 建構
            factory(_);
        } else {
            throw new TypeError("not support your system");
        }

    }());
    //==========================================================================

    // lodash 缺少既有 underscore 的功能
    let fixList = {
        "collect": false,
        "inject": false,
        "foldl": false,
        "foldr": false,
        "detect": false,
        "select": false,
        "all": "every",
        "any": "some",
        "include": false,
        "contains": "includes",
        "pluck": "map",
        "where": "filter",
        'findWhere': "find",
        "indexBy": "keyBy",
        "unique": false,
        "object": false,
        "compose": "flowRight",
        "restArguments": false,
        "allKeys": false,
        "mapObject": false,
        "pairs": "toPairs",
        "methods": false,
        "extendOwn": false,
        "matcher": false
    };
    //==========================================================================
    function factory(_) {
        if (_ == null || !_.isObject(_)) {
            throw new TypeError("need import lodash or underscode");
        }
        //----------------------------
        if (_["extendOwn"] == null) {
            _.mixin({
                extendOwn: function () {
                    let args = Array.from(arguments);
                    let source = args.shift();

                    for (let i = 0; i < args.length; i++) {
                        let c = args[i];
                        let keyList = Object.getOwnPropertyNames(c);

                        keyList.forEach(function (k) {
                            source[k] = c[k];
                        });
                    }
                    return source;
                }
            });
        }
        //-----------------------------------------------------------
        if (_["pluck"] == null) {
            _.mixin({
                pluck: function (data, propertyName) {
                    return data.map(function (d) {
                        return d[propertyName];
                    });
                }
            });
        }
    }
}(this || {}));
