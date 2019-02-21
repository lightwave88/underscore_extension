!(function (global) {


    ////////////////////////////////////////////////////////////////////////////
    //
    // extension_1
    //
    ////////////////////////////////////////////////////////////////////////////
    (function () {
        // 環境檢測

        if (typeof window != "undefined" && typeof document != "undefined") {
            // 瀏覽器環境
            factory(window._, 'browser');
        } else if (typeof module != 'undefined' && module.exports) {
            // node.js
            module.exports = function (obj) {
                factory(obj, 'nodejs');
            };
        } else if (typeof (window) == "undefined" && self != "undefined" && typeof (importScripts) == 'function') {
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

        if (_ == null) {
            return;
        }

        if (_.$$extension1 != null) {
            // 避免重複
            return;
        }
        //----------------------------
        // extension的全域變數都放這(_.$$extension1)

        Object.defineProperty(_, '$$extension1', {
            value: {},
            enumerable: false,
            writable: false,
            configurable: true
        });
        //----------------------------
        (function (o) {
            // _.$$extension1 參數

            // (underscode|lodash)的位址
            o.scriptPath = null;

            // extention 本身的位址
            o.extensionPath = null;

            // 為加入的 callback 予以編號
            o.callback_guid = 1;

            o._ = _;

            o.environment = environment;

        })(_.$$extension1);
        //----------------------------

        (function () {
            // debugger;
            // find extensionPath

            switch (_.$$extension1.environment) {
                case 'nodejs':
                    _nodejs();
                    break;
                    case 'browser':
                    _browser();
                    break;
                default:
                    break;
            }

            function _nodejs(){
                // debugger;
                _.$$extension1.extensionPath = __dirname;
            }

            function _browser(){
                // debugger;

                if (typeof document === 'undefined') {
                    return;
                }
                let scripts = Array.from(document.querySelectorAll('script'));
                let script = scripts.pop();
    
                _.$$extension1.extensionPath = script.src;
                //----------------------------
                // find scriptPath
                let reg = /(\\|\/)?([^\/]*?(underscore|lodash)[^\/]*?)$/i;
    
                for (let i = (scripts.length - 1); i >= 0; i--) {
                    let src = scripts[i].src;
                    if (reg.test(src)) {
                        _.$$extension1.scriptPath = src;
                        break;
                    }
                }
            }
        }());
        //======================================================================

        // 取得 extension1 
        // 並方便對其做設定

        _.mixin({
            extension1: function () {
                return (_.$$extension1);
            }
        });
    };
})(this || {});
