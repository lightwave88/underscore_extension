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
            if (global._ == null || _.$$extension == null) {
                return;
            }
            let environment = _.$$extension.environment;
            factory(global._);
        }
    }());
    //==========================================================================
    function factory(_) {
        _.mixin({
            jsonStringify: stringify,
            jsonParse: parse
        });
    }

    // safety: 是否採用安全預設的方式轉換(但有些數據格式無法轉換)
    // obj: 不需設定，系統內部使用 
    function stringify(data, safety, space, obj) {
        let res;

        safety = (safety != null && safety === true) ? safty : false;

        if (safety) {
            res = JSON.stringify(data, null, space)
        } else {
            let stringifyObj = new JsonStringfy(data, space, obj);
            res = stringifyObj.main();
        }

        return res;
    }
    //----------------------------
    function parse(str, safety, args) {
        let res;
        if (safety != null && safety === true) {
            try {
                res = JSON.parse(str);
            } catch (error) {
                res = error;
            }
            return res;
        }
        //-----------------------
        args = args || [];

        let vars = '';
        let context;
        let data = {};
        //-----------------------
        args.forEach(function (v) {
            if (typeof v != "function" || !v.name) {
                return;
            }
            let name = v.name;
            vars += `let ${name} = data["${name}"];\n`;

            data[name] = v;
        });
        //-----------------------
        try {
            context = new Function('data',
                `'use strict'\n
                let global = {};\n
                let window = {};\n
                
                ${vars}   

                let res = (${str});\n 
                return res;
            `);
            debugger;
            res = context.call({}, data);
        } catch (error) {
            res = error;
        }
        return res;
    };

    (function (fn) {
        // 物件使用
        fn.evalStringify = function (str) {
            debugger;
            let regStr = EvalStringify_REGEXP().source;
            regStr = regStr.replace(/\(\[\\s\\S\]\*\)/, str);
            return regStr;
        };
    })(stringify);
    //==========================================================================
    // 參數

    // 需要轉換的類型
    const tactics = {
        // 判斷日期
        Date: function (targetObj, judge, obj) {
            if (judge) {
                let className = getClassName(targetObj);
                return /Date/i.test(className);
            }
            //----------------------------
            let evalString = `new Date("${targetObj.toISOString()}")`;
            //----------------------------
            let job_id = obj._getJobUID();
            let code = getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        },
        // 判斷 RegExp
        RegExp: function (targetObj, judge, obj) {
            if (judge) {
                let className = getClassName(targetObj);
                return /RegExp/i.test(className);
            }
            //----------------------------
            debugger;
            let source = targetObj.source;
            let options = targetObj.toString().replace(/\/.*\//, '');

            let optionList = [];
            for (let i = 0; i < options.length; i++) {
                optionList.push(`"${options.charAt(i)}"`);
            }
            // debugger;
            let evalString;
            source = source.replace(REGEXP_ESCAPED_CHARS_REGEXP(), function (str) {
                debugger;
                let res = REGEXP_ESCAPED_CHARS[str];
                return res;
            });

            if (optionList.length) {
                let option = optionList.join(",")
                evalString = `(new RegExp("${source}",${option}))`;
            } else {
                evalString = `(new RegExp("${source}"))`;
            }
            //----------------------------
            let job_id = obj._getJobUID();
            let code = getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        },
        // Map
        Map: function (targetObj, judge, obj) {
            // debugger;
            if (judge) {
                let className = getClassName(targetObj);
                return /Map/i.test(className);
            }
            //----------------------------
            debugger;
            let res = [];

            targetObj.forEach(function (v, k) {
                k = stringify(k, false, obj.space, obj);
                v = stringify(v, false, obj.space, obj);
                res.push(`[${k}, ${v}]`);
            });
            // debugger;
            if (res.length > 0) {
                res = res.join(',');
            } else {
                res = '';
            }
            let evalString = "(new Map([" + res + "]))";
            //----------------------------
            let job_id = obj._getJobUID();
            let code = getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        },
        // Set
        Set: function (targetObj, judge, obj) {
            if (judge) {
                let className = getClassName(targetObj);
                return /Set/i.test(className);
            }
            //----------------------------
            let res = [];

            targetObj.forEach(function (v) {
                v = stringify(v, false, obj.space, obj);
                res.push(`${v}`);
            });

            // debugger;
            if (res.length > 0) {
                res = res.join(',');
            } else {
                res = '';
            }
            let evalString = "(new Set([" + res + "]))";
            //----------------------------
            let job_id = obj._getJobUID();
            let code = getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        },
        // 被函式創建的物件
        instance: function (targetObj, judge, obj) {
            debugger;
            if (judge) {

                if (targetObj == null || typeof (targetObj) != "string") {
                    return false;
                }
                let reg = EvalStringify_REGEXP();

                res = reg.test(targetObj);
                return res;
            }
            //----------------------------
            // debugger;
            let reg = EvalStringify_REGEXP();
            let evalString = reg.exec(targetObj);
            evalString = (evalString[1] == null) ? '' : evalString[1];
            //----------------------------
            let job_id = obj._getJobUID();
            let code = getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        }
    };
    //----------------------------
    const UNSAFE_CHARS_REGEXP = function () {
        return /[<>\/\u2028\u2029]/g;
    };

    const ESCAPED_CHARS = {
        '<': '\\u003C',
        '>': '\\u003E',
        '/': '\\u002F',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029'
    };

    const REGEXP_ESCAPED_CHARS_REGEXP = function () {
        return /\\|"/g;
    };
    const REGEXP_ESCAPED_CHARS = {
        '\\': "\\\\",
        '"': '\\"'
    };

    const UID = Math.floor(Math.random() * 1000 * (new Date()).getTime()).toString(16);
    //----------------------------
    const PLACE_HOLDER_REGEXP = function () {
        return (new RegExp(`"@@_${UID}_(\\d+)_${UID}_@@"`, "g"));
    };

    const EvalStringify_REGEXP = function () {
        let res = `@@_${UID}_([\\s\\S]*)_${UID}_@@`;

        return (new RegExp(res, "g"));
    }
    //----------------------------
    function getCode(id) {
        return `@@_${UID}_${id}_${UID}_@@`;
    };
    //----------------------------
    function getClassName(obj) {
        let className = Object.prototype.toString.call(obj);
        let regRes = /\[object\s+(\S+?)\]/i.exec(className);

        className = (regRes && regRes[1]) ? regRes[1] : null;

        return className;
    };
    //==========================================================================



    //==========================================================================
    // json.stringfy() 主體
    // data: 要格式化的資料
    // space: 空格，原始 json.stringfy() 的設定
    // prev_obj: 是否有上一層的物件(演算法用)
    function JsonStringfy(data, space, prev_obj) {
        'use strict';

        this.fn = JsonStringfy;
        this.data = data;
        this.space;
        this.jobs = {};
        this.job_UID = 1;
        this.prev_obj;

        this.__constructor(space, prev_obj);
    }

    (function () {
        this.__constructor = function (space, prev_obj) {
            this.space = (typeof space == "number") ? space : null

            if (prev_obj) {
                this.prev_obj = prev_obj;

                // 關連到最原始的 jobs
                // 位址映射
                this.jobs = this.prev_obj.jobs;
            }
        };
        //--------------------------------------
        this.main = function () {
            // debugger;

            // 主要步驟
            let str = JSON.stringify(this.data, this._getReplacer());

            //----------------------------
            // Protects against `JSON.stringify()` returning `undefined`, by serializing
            // to the literal string: "undefined".
            if (typeof str !== 'string') {
                str = String(str);
            }
            // debugger;
            //----------------------------
            // Replace unsafe HTML and invalid JavaScript line terminator chars with
            // their safe Unicode char counterpart. This _must_ happen before the
            // regexps and functions are serialized and added back to the string.
            str = str.replace(UNSAFE_CHARS_REGEXP(), function (unsafeChar) {
                return ESCAPED_CHARS[unsafeChar];
            });
            //----------------------------
            if (!this.prev_obj && Object.keys(this.jobs).length > 0) {
                debugger;
                // 來到最遠始的上層
                str = this._callJob(str);
            }

            return str;
        };
        //--------------------------------------
        this._getReplacer = function () {
            let $this = this;
            return function (key, value) {
                return $this._replacer(key, value, this[key]);
            };
        };
        //--------------------------------------
        //
        this._replacer = function (key, value, originalValue) {
            debugger;

            let target;
            if (typeof (value) !== typeof (originalValue)) {
                debugger;
                target = value;
            } else {
                target = originalValue;
            }

            // 找尋轉換的策略
            let tactics = this._findTactics(target);

            if (tactics.length > 1) {
                // 若有多個轉換策略
                throw new Error("have multi tactic");
            } else if (tactics.length == 0) {
                // 沒有相應的轉換策略
                return value;
            }
            debugger;

            let fn = tactics[0];

            let res = fn(target, false, this);

            return res;
        };
        //--------------------------------------
        //
        this._getJobUID = function () {
            if (this.prev_obj) {
                return this.prev_obj.job_UID++;
            } else {
                return this.job_UID++
            }
        };
        //--------------------------------------
        // 把轉換過的字再轉換回來
        this._callJob = function (str) {
            // debugger;

            let $this = this;

            while (PLACE_HOLDER_REGEXP().test(str)) {
                str = str.replace(PLACE_HOLDER_REGEXP(), function (match, g_1) {
                    // debugger;
                    let str = $this.jobs[g_1];
                    delete $this.jobs[g_1];
                    return str;
                });
            }

            return str;
        };
        //--------------------------------------
        // 找出轉換策略
        this._findTactics = function (targetObj) {
            let res = [];

            let fn;
            for (let k in tactics) {
                fn = tactics[k];
                if (fn(targetObj, true, this)) {
                    res.push(fn);
                }
            }
            return res;
        };

    }).call(JsonStringfy.prototype);

})(this || {});
