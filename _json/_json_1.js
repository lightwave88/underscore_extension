!(function (global) {
    let _;
    if (typeof Window !== "undefined" && global instanceof Window) {
        if (typeof global._ === "object" || typeof global._ === "function") {
            _ = global._;
        }
    } else if (typeof module === "object") {
        // node.js
        try {
            _ = require("../lodash");
        } catch (e) {
        }
        //----------------------------
        if (typeof _ === "undefined") {
            try {
                _ = require("../underscore");
            } catch (e) {
            }
        }
        //----------------------------
        if (typeof _ === "undefined") {
            throw new Error("need require underscore or lodash");
        }
    }
    //==========================================================================

    _.mixin({
        json: makeJson,
        unjson: unJson
    });
    //==========================================================================
    function makeJson(data, options) {
        let s = new _Serialize(obj, options);
        return s.result();
    }

    function unJson(data) {
        if (typeof data !== 'string') {
            throw new TypeError('_.unjson(data) data must be string');
        }
    }
    //==========================================================================

    const IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
    const UNSAFE_CHARS_REGEXP = /[<>\/\u2028\u2029]/g;
    const PLACE_HOLDER_REGEXP = new RegExp('"@__' + this.UID + '-(\\d+)-__@"', 'g');
    const ESCAPED_CHARS = {
        '<': '\\u003C',
        '>': '\\u003E',
        '/': '\\u002F',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029'
    };

    //==========================================================================

    // json.stringfy() 主體
    function _Serialize(obj, options) {
        this.UID = Math.floor(Math.random() * 0x10000000000).toString(16);
        this.obj = obj;
        this.options;
        this.job = [];

        this.__constructor(options);
    }

    (function () {
        this.__constructor = function (options) {
            options = options || {};

            if (typeof options === 'number' || typeof options === 'string') {
                options = {space: options};
            }

            this.options = options;
        };

        //--------------------------------------
        this.result = function () {

            let options = this.options;
            let obj = this.obj;

            var str;
            //----------------------------
            // 處理程序

            // Creates a JSON string representation of the value.
            // NOTE: Node 0.12 goes into slow mode with extra JSON.stringify() args.
            if (options.isJSON && !options.space) {
                str = JSON.stringify(obj);
            } else {
                let self = this;

                let replacer = (options.isJSON ? null : function (key, value) {
                    return self.replacer_1.call(this, key, value, self);
                });

                str = JSON.stringify(obj, replacer, options.space);
            }
            //----------------------------
            // Protects against `JSON.stringify()` returning `undefined`, by serializing
            // to the literal string: "undefined".
            if (typeof str !== 'string') {
                return String(str);
            }

            // Replace unsafe HTML and invalid JavaScript line terminator chars with
            // their safe Unicode char counterpart. This _must_ happen before the
            // regexps and functions are serialized and added back to the string.
            str = str.replace(UNSAFE_CHARS_REGEXP, this.escapeUnsafeChars);

            if (!this.job.length) {
                return str;
            }

            // Replaces all occurrences of function, regexp and date placeholders in the
            // JSON string with their string representations. If the original value can
            // not be found, then `undefined` is used.

            str = this.callJob(str);

            return str;
        };
        //--------------------------------------
        //
        this.replacer_1 = function (key, value, self) {
            // debugger;
            if (value == null) {
                return value;
            }

            // If the value is an object w/ a toJSON method, toJSON is called before
            // the replacer runs, so we use this[key] to get the non-toJSONed value.
            var origValue = this[key];

            let res = self.findTactics(origValue);

            // debugger;
            return res;
        };
        //--------------------------------------
        this.callJob = function (str) {

            let self = this;
            str = str.replace(PLACE_HOLDER_REGEXP, function (match, g_1) {
                let index = Number(g_1);

                if (typeof self.job[index] === 'undefined') {
                    throw new Error('replace error');
                }

                return self.job[index];
            });

            return str;
        };
        //--------------------------------------
        this.escapeUnsafeChars = function (unsafeChar) {
            return ESCAPED_CHARS[unsafeChar];
        };
        //--------------------------------------
        this.findTactics = function (targetObj) {
            let res;
            for (let i = 0, callback; callback = this.tactics[i]; i++) {

                try {
                    // debugger;
                    res = callback(targetObj);
                    break;
                } catch (error) {
                    // debugger
                    if (error instanceof TypeError) {
                        continue;
                    } else {
                        throw error;
                    }
                }
            }
            // debugger;
            if (typeof res === 'string') {

                let index = this.job.length;
                this.job[this.job.length] = res;
                targetObj = '@__' + this.UID + '-' + index + '-__@';
            }

            return targetObj;
        };
        ///////////////////////////////////////////////////////////////////////
        this.tactics = [
            // 判斷日期
            function (targetObj) {
                let judge = false;

                if (typeof targetObj === 'object') {
                    if (targetObj instanceof Date) {
                        judge = true;
                    }
                }

                if (!judge) {
                    throw new TypeError()
                }
                //----------------------------
                // debugger;

                let res = "new Date(\"" + targetObj.toISOString() + "\")";
                return res;
            },
            // 判斷 RegExp
            function (targetObj) {
                let judge = false;

                if (typeof targetObj === 'object') {
                    if (targetObj instanceof RegExp) {
                        judge = true;
                    }
                }

                if (!judge) {
                    throw new TypeError()
                }
                //----------------------------
                // debugger;
                let res = targetObj.toString();
                return res;
            },
            // Map
            function (targetObj) {
                if (!(targetObj instanceof Map)) {
                    throw new TypeError();
                }
                //----------------------------
                // debugger;

                let res = [];

                targetObj.forEach(function (v, k) {
                    // debugger;
                    k = makeJson(k);
                    v = makeJson(v);


                    res.push(["[" + k + "," + v + "]"]);
                });

                res = "[" + res.join(',') + "]";
                res = "new Map(" + res + ")";

                return res;
            },
            // Set
            function(){

            }
        ];

    }).call(_Serialize.prototype);

})(this || {});
