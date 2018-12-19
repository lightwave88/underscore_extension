!(function (global) {

    (function () {

        if (typeof window != "undefined" && typeof document != "undefined") {
            factory(window._, 'browser');
        } else if (typeof module != 'undefined' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (obj) {
                factory(obj, 'nodejs');
            };
        } else if (typeof (window) == "undefined" && self != "undefined" && typeof (importScripts) == 'function') {
            // debugger;
            // webWorker 環境

            factory(global._, 'worker');
        } else {
            factory(global._, 'other');
        }
    }());
    //==========================================================================
    // 工廠函式
    function factory(_, environment) {
        // debugger;

        if (typeof (_) != "object" && typeof (_) != "function") {
            return;
        }

        if (_.$$extension != null) {
            return;
        }
        //----------------------------
        // extension的全域變數都放這(_.$$extension)

        Object.defineProperty(_, '$$extension', {
            value: {},
            enumerable: false,
            writable: false,
            configurable: true
        });
        //----------------------------
        (function (_self) {
            // _.$$extension 參數

            // (underscode|lodash)的位址
            // worker 要用
            _self.scriptPath = null;

            // 為加入的 callback 予以編號
            _self.callback_guid = 1;

            // extention 本身的位址
            _self.extensionPath = null;

            // 預設使用線程數量
            _self.workerCount = 1;

            _self._ = _;

            _self.environment = environment;

        })(_.$$extension);
        //----------------------------

        (function () {
            // find extensionPath
            if (typeof document === 'undefined') {
                return;
            }
            let scripts = Array.from(document.querySelectorAll('script'));
            let script = scripts.pop();

            _.$$extension.extensionPath = script.src;
            //----------------------------
            // find scriptPath
            let reg = /(\\|\/)?([^\/]*?(underscore|lodash)[^\/]*?)$/i;

            for (let i = (scripts.length - 1); i >= 0; i--) {
                let src = scripts[i].src;
                if (reg.test(src)) {
                    _.$$extension.scriptPath = src;
                }
            }
        }());
        //======================================================================

        if (_.getScriptPath == null) {
            _.mixin({
                // worker 需要的功能
                // 為手動取得(underscode|lodash)的位址
                // input: (scriptDom|scriptDom.id)
                getScriptPath: function (input) {
                    debugger;

                    if (input instanceof HTMLElement) {
                        _.$$extension.url = input.src;
                        return;
                    }
                    //------------------
                    let error = new TypeError("can't get script url");
                    if (typeof (input) === "string") {

                        let domList = Array.from(document.querySelectorAll(input));
                        if (domList.length) {
                            if (domList.length === 1) {
                                _.$$extension.url = domList[0].src;
                                return;
                            } else {
                                throw error;
                            }
                        }

                        return;
                    }
                    //------------------
                    throw error;
                }
            });
        }
        //----------------------------
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
        // extension 的參數設定
        if (typeof _.extension !== 'undefined') {
            throw new Error("_.extension exist");
        } else {
            _.mixin({
                extension: function (key, value) {
                    let options = {};
                    let $$extension = _["$$extension"];

                    if (_.isPlainObject(key)) {
                        options = key;
                    } else {
                        options[key] = value;
                    }
                    //----------------------------

                    for (let k in options) {
                        if ((k in $$extension) && typeof ($$extension[k]) !== "function") {
                            $$extension[k] = options[k];
                        }
                    }
                }
            });
        }
        //----------------------------
        if (_.literals == null) {
            // es6 模版
            _.mixin({
                literals: function (str) {                    
                    str = str.replace(/^`/, '');
                    str = str.replace(/`$/, '');

                    str = str.replace(/`/g, '\\`');

                    str = "`" + str + "`";
                    //-----------------------

                    let command = "for (let key in data) {\
                        let script = 'var ' + key + '= data[\"' + key + '\"]';\
                        eval(script)\
                    }";

                    command += 'return (' + str + ');';
                    environment = new Function("data", command);

                    return environment;
                }
            });
        }
    };
})(this || {});
