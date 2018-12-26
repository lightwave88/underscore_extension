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
            stringify: stringify,
            parse: function () {

            }
        });
    }
    //==========================================================================
    // 需要轉換的類型
    const tactics = {
        // 判斷日期
        Date: function (targetObj, judge, obj) {
            if (judge) {
                let className = JsonStringfy.className(targetObj);
                return /Date/i.test(className);
            }
            //----------------------------
            let evalString = `new Date("${targetObj.toISOString()}")`;
            //----------------------------
            let job_id = obj.getJobUID();
            let code = obj.fn.getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        },
        // 判斷 RegExp
        RegExp: function (targetObj, judge, obj) {
            if (judge) {
                let className = JsonStringfy.className(targetObj);
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
            source = source.replace(/\\/, "\\\\");
            if(optionList.length){
                let option = optionList.join(",")
                evalString = `(new RegExp("${source}",${option}))`;
            }else{
                evalString = `(new RegExp("${source}"))`;
            }
            //----------------------------
            let job_id = obj.getJobUID();
            let code = obj.fn.getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        },
        // Map
        Map: function (targetObj, judge, obj) {
            // debugger;
            if (judge) {
                let className = JsonStringfy.className(targetObj);
                return /Map/i.test(className);
            }
            //----------------------------
            debugger;
            let res = [];

            targetObj.forEach(function (v, k) {
                k = stringify(k, obj.options, obj);
                v = stringify(v, obj.options, obj);
                res.push(`[${k}, ${v}]`);
            });
            debugger;
            if (res.length > 0) {
                res = res.join(',');
            } else {
                res = '';
            }
            let evalString = "(new Map([" + res + "]))";
            //----------------------------
            let job_id = obj.getJobUID();
            let code = obj.fn.getCode(job_id);

            obj.jobs[job_id] = evalString;

            return code;
        },
        // Set
        Set: function (targetObj, judge, obj) {

        }
    };
    //--------------------------------------
    function stringify(data, options, obj) {

        let stringifyObj = new JsonStringfy(data, options, obj);
        return stringifyObj.result();
    }
    //--------------------------------------
    // json.stringfy() 主體
    function JsonStringfy(data, options, prev_obj) {
        this.fn = JsonStringfy;
        this.data = data;
        this.options;
        this.jobs = {};
        this.job_UID = 1;
        this.prev_obj;

        this.__constructor(options, prev_obj);
    }

    (function (fn) {
        fn.IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
        // fn.UNSAFE_CHARS_REGEXP = /[<>\/\u2028\u2029]/g;

        fn.ESCAPED_CHARS = {
            '<': '\\u003C',
            '>': '\\u003E',
            '/': '\\u002F',
            '\u2028': '\\u2028',
            '\u2029': '\\u2029'
        };
        fn.UID = Math.floor(Math.random() * 0x10000000000).toString(16);

        fn.PLACE_HOLDER_REGEXP = function () {
            return (new RegExp(`"@@_${fn.UID}_(\\d+)_${fn.UID}_@@"`, "g"));
        };

        fn.jobs = {};

        fn.job_UID = 1;
        //--------------------------------------
        fn.className = function (obj) {
            let className = Object.prototype.toString.call(obj);
            let regRes = /\[object\s+(\S+?)\]/i.exec(className);

            className = (regRes && regRes[1]) ? regRes[1] : null;

            return className;
        };
        //--------------------------------------
        fn.getCode = function (id) {
            return `@@_${fn.UID}_${id}_${fn.UID}_@@`;
        };

    })(JsonStringfy);

    (function () {
        this.__constructor = function (options, prev_obj) {
            this.options = options || undefined;

            if(prev_obj){
                this.prev_obj = prev_obj;
                this.jobs = this.prev_obj.jobs;
            }
        };

        //--------------------------------------
        this.result = function () {
            let str;
            //----------------------------
            // 主要步驟

            let $this = this;
            let replacer = function (key, value) {
                return $this.replacer(key, value, this[key]);
            };

            str = JSON.stringify(this.data, replacer);


            //----------------------------
            // Protects against `JSON.stringify()` returning `undefined`, by serializing
            // to the literal string: "undefined".
            if (typeof str !== 'string') {
                str = String(str);
            }
            debugger;
            // Replaces all occurrences of function, regexp and date placeholders in the
            // JSON string with their string representations. If the original value can
            // not be found, then `undefined` is used.
            if(!this.prev_obj && Object.keys(this.jobs).length > 0){
               debugger; 
               str = this.callJob(str);
            }

            return str;
        };
        //--------------------------------------
        //
        this.replacer = function (key, value, originalValue) {

            let tactics = this.findTactics(originalValue);

            if (tactics.length > 1) {
                throw new Error("have multi tactic");
            } else if (tactics.length == 0) {
                return value;
            }

            let fn = tactics[0];

            return fn(originalValue, false, this);
        };
        //--------------------------------------
        this.getJobUID = function(){
            if(this.prev_obj){
                return this.prev_obj.job_UID++;
            }else{
                return this.job_UID++
            }
        };

        this.callJob = function (str) {
            debugger;

            let $this = this;

            while(this.fn.PLACE_HOLDER_REGEXP().test(str)){
                str = str.replace(this.fn.PLACE_HOLDER_REGEXP(), function (match, g_1) {
                    debugger;
                    let str = $this.jobs[g_1];
                    delete $this.jobs[g_1];    
                    return str;
                });
            }

            return str;
        };
        //--------------------------------------
        this.escapeUnsafeChars = function (unsafeChar) {
            return ESCAPED_CHARS[unsafeChar];
        };
        //--------------------------------------
        // 找出轉換策略
        this.findTactics = function (targetObj) {
            let res = [];

            let fn;
            for (let k in tactics) {
                fn = tactics[k];
                if(fn(targetObj, true, this)){
                    res.push(fn);
                }
            }
            return res;
        };
        ///////////////////////////////////////////////////////////////////////
        

    }).call(JsonStringfy.prototype);

})(this || {});
