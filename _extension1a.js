
// 對外擴充方法
let Output = (function (_g) {
    ////////////////////////////////////////////////////////////////////////////
    //
    // extension_1
    //
    ////////////////////////////////////////////////////////////////////////////

    const G = {
        environment: null,
        '_': null,
    };

    const Output = {};


    //==========================================================================
    // 工廠函式
    class Factory {
        constructor(_, environment) {

            this._ = _;
            this.environment = environment;
            this.$extension1 = {};
            //-----------------------

            this.setParameter();

            this.getPath();

            this.final();
        }

        //----------------------------
        setIInfo() {

            this.$extension1.info = {};

            const Info = this.$extension1.info;


            info.sourceScriptPath = null;

            // extention 本身的位址
            info.extensionScriptPath = null;

            // 為加入的 callback 予以編號
            info.callback_uid = 1;

            info._ = _;

            info.environment = environment;
        }
        //----------------------------
        getPath() {
            const $extension1 = this.$extension1;

            if (/nodejs/.test(this.environment)) {
                $extension1.extensionScriptPath = __dirname;
            } else if (/browser/.test(this.environment)) {

                if (typeof document == 'undefined') {
                    return;
                }
                let scripts = Array.from(document.querySelectorAll('script'));
                let script = scripts.pop();

                $extension1.extensionScriptPath = script.src;
                //----------------------------
                // find scriptPath
                let reg = /(\\|\/)?([^\/]*?(underscore|lodash)[^\/]*?)$/i;

                for (let i = (scripts.length - 1); i >= 0; i--) {
                    let src = scripts[i].src;
                    if (reg.test(src)) {
                        $extension1.scriptPath = src;
                        break;
                    }
                }
            }
        }
        //----------------------------
        final() {
            const $extension1 = this.$extension1;

            Object.defineProperty(this._, '$extension1', {
                value: {},
                enumerable: false,
                writable: false,
                configurable: true
            });
            // 取得 extension1
            // 並方便對其做設定

            this._.mixin({
                $extension1: function () {
                    return $extension1;
                }
            });
        }
        //----------------------------

        static main() {
            let _ = G._;
            let environment = G.environment;

            if (_ == null || _.$extension1 != null) {
                // 避免重複
                return;
            }

            new Factory(_, environment);
        }
    }
    //==========================================================================

    class ImportModules {
        static importModules(key, m) {

            if (typeof key != 'string') {
                throw new TypeError(`importModules args[0] must be string`);
            }

            if (typeof m != 'object' || m == null) {
                throw new TypeError(`importModules args[1] must be object`);
            }

            if (m.factory == null) {
                return;
            }

            if (G._ == null) {
                if (ImportModules.importModuleList == null) {
                    ImportModules.importModuleList = new Map();
                }

                importModuleList.set(key, m);
            } else {
                if (!(key in G._)) {
                    m.factory(G);
                    delete m.factory;
                }
            }
        }
        //-----------------------
        static injectModules() {
            if (G._ == null) {
                return;
            }

            importModuleList.forEach(function (m, key) {
                if (!(key in G._)) {
                    m.factory(G);
                    delete m.factory;
                }
            });

            importModuleList = null;
        }
    }

    ImportModules.importModuleList = null;
    //==========================================================================

    (function checkEnviroment() {
        // debugger;
        // 環境檢測

        if (typeof window != "undefined" && typeof document != "undefined") {
            // browser

            G.environment = 'browser';
            G._ = window._;

            Factory.main();

        } else if (typeof module != 'undefined' && module.exports) {
            G.environment = 'nodejs';

            // node.js
            module.exports = function (obj) {
                G._ = obj;
                Factory.main(obj, G.environment);

                ImportModules.injectModules();
            };
        } else if (typeof (window) == "undefined" && self != "undefined" && typeof (importScripts) == 'function') {
            // webWorker 環境
            G.environment = 'worker';
            G._ = self._;
            Factory.main();
        } else {
            Factory.main();
        }
    }());

    //==========================================================================

    Output.importModules = function (m) {
        ImportModules.importModules(m);
    };

})(this || {});

// 個模組匯入的方式
// 方便 php 的彙整
const importModules = Output.importModules;
Output = undefined;
