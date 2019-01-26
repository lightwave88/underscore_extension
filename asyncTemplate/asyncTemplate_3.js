!(function(_global){
    // _.asyncTemplateCommand 設定文件
    const _asyncTemplateSetting = {
        // 给予 <style> 一个 id 值的标头
        "styleId_head": "asyncTemplate_"
    };

    // jq.template 的设定文件
    const $templateSetting = {};

    // 是否支援字符串模版
    const isSupport_literalsTemplate = (function() {
        var support = false;
        try {
            var fn = new Function("return `support_templateString`;");

            if (fn() === "support_templateString") {
                support = true;
            }
        } catch (e) {} finally {
            return support;
        }
    })();
    //==========================================================================

    (function() {

        if (typeof(module) == 'object' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function(obj) {
                // 建構
                factory(global, obj);
            };
        } else {
            if (_global._ == null || _.$$extension == null) {
                return;
            }

            let environment = _.$$extension.environment;

            switch (environment) {
                case 'browser':
                    factory(_global, _global._);
                    break;
                default:
                    noSupportFactory(_global._);
                    break;
            }
        }

    }());

    //==========================================================================
    function noSupportFactory(_) {
        if (_ == null || !_.isObject(_)) {
            throw new TypeError("need import lodash or underscode");
        }

        _.mixin({
            asyncTemplate: function() {
                throw new Error("this. enviroment no support _.async()");
            }
        });
    }
    //==========================================================================
    function factory(_global, _){
        _.mixin({
            asyncTemplate: asyncTemplateCommand
        });

        //----------------------------
        // asyncTemplateCommand 統整者
        // name 已經存在的不能被覆蓋
        function asyncTemplateCommand(name, options) {
            let args = Array.from(arguments);

            if (!name) {
                return;
            }
            //----------------------------
            let instance;
            let templateItemMap = TemplateItem.$templateItemMap;
            //----------------------------
            if (options == null) {
                // 單純取出既有的 template
                instance = templateItemMap[name] || null;
            } else {

                if (templateItemMap[name] != null) {
                    throw new Error(`template[${name}] has exists`);
                }

                // 新增一個 template
                instance = new TemplateItem(name, options);
            }

            return instance;
        }

        (function(fn) {
            fn.keys = function() {
                return Object.keys(TemplateItem.$templateItemMap);
            };

            fn.values = function() {
                return Object.values(TemplateItem.$templateItemMap);
            };

            fn.delete = function(name) {
                delete TemplateItem.$templateItemMap[name];
            };

            fn.clear = function() {
                TemplateItem.$templateItemMap = {};
            };

            // 參數設定
            fn.setting = function(key, value) {
                if (key == null) {
                    return _asyncTemplateSetting;
                } else if (value == null) {
                    return _asyncTemplateSetting[key];
                }
                _asyncTemplateSetting[k] = value;
            };
        })(asyncTemplateCommand);
        //======================================================================

        // 代表每個 template
        // 只做一次性 load
        function TemplateItem(name, options) {
            'use strict';

            this.$style_id;

            // 使用者设定的模版名称
            this.$name;

            this.$htmlContent;

            // 原来的 js 内容
            this.$javascriptContent;

            // 原来的 css 内容
            this.$cssContent;

            // 模版内容里的使用者設定
            this.$template_options = {};

            // 模板內部可以設定的 options
            this.$_default_templateOptions = {
                dataloading: null,
                dataloaded: null,
                loading: null,
                loaded: null,
                beformount: null,
                mounted: null,
                beforeunmount: null,
                unmounted: null,
                updated: null,
                data: {}
            };

            // templateItem 的狀態
            // 0：初始化，1：執行完成，2：錯誤
            this.$status = 0;

            this.$error;

            // 針對 css 的垃圾回收
            // 當沒有 dom 引用此 template時
            // css 當移除
            this.$usedDom = new Set();

            // getdata: 資料|取得資料的方式
            // literals: 是否採用 literals template 格式
            // preload: 是否一開始就 load 還是等 mount 才 load
            // render: 指定 render 的函式
            // templateloading: callback, 開始載入模板執行
            // templateloaded: callback, 模板載入後執行
            // cssKeep: unmout 後是否要繼續保留 css
            // ajax: 使用預設取得方式
            this.$options = {
                getdata: null,
                literals: true,
                preload: true,
                render: null,
                templateloading: null,
                templateloaded: null,
                cssKeep: false,
                ajax: {
                    url: null,
                    type: 'get',
                    data: {}
                }
            };

            // 代表的是
            // 取得資料然後解析這一段
            this.$deferred;

            //----------------------------
            this.__construct(name, options);
        }

        //--------------------------------------------------------------------------
        // 类别
        (function(fn) {
            // 登陸所有的 TemplateItem
            fn.$templateItemMap = {};

            fn.$style_uid = 1;

            fn.$command_head = "let templateOptions;\n";

            fn.$command_footer = "if(templateOptions != null && typeof(templateOptions) == 'object'){\n\
            return templateOptions;\n\
        }else{\n\
            return null;\n\
        }\n";

        })(TemplateItem);
        //--------------------------------------------------------------------------


        (function(){
            this.__construct = function(name, options) {

                this.$name = name;
                this.$style_id = TemplateItem.$style_uid++;
                this.$deferred = _.deferred();

                this.setting(options);

                // 登陸
                TemplateItem.$templateItemMap[this.$name] = this;

                if (this.$options.preload) {
                    debugger;
                    this.$asyncGetTemplate();
                }
            };

            //------------------------------------------------
            // 使用者设定
            this.setting = function(key, value) {
                debugger;

                let options;

                if (typeof(key) == "object") {
                    options = key;
                } else {
                    options = {
                        key: value
                    };
                }
                //-----------------------
                // debugger;
                copyOptions(options, this.$options);
                //-----------------------
                if (!isSupport_literalsTemplate) {
                    this.$options.literals = false;
                }
                //-----------------------
                function copyOptions(source, target) {
                    for (let k in target) {

                        if (source[k] != null) {

                            if (/^ajax$/.test(k)) {
                                copyOptions(source[k], target[k]);
                            } else {
                                target[k] = source[k];
                            }

                        }
                    }
                }
            };
            //------------------------------------------------

            // 最主要的 API
            // 取得副本
            this.getClone = function(){

                let def = _.deferred();

                if (!this.$status < 1 && !this.$options.preload) {
                    this.$asyncGetTemplate();
                }

                let p = this.$deferred.promise();

                p.thenWith(function(){
                    debugger;
                    let templateClone = TemplateItemClone(this);
                    // 傳送資料
                    def.resolve(templateClone);
                }, function(){
                    def.reject(this.$error);
                },this)


                return def.promise();
            };
            //------------------------------------------------

            this.getData = function(){

            }

            //------------------------------------------------
            // API
            // 解除引用
            this.unmount = function(dom) {
                debugger;

                if (!this.$usedDom.has(dom)) {
                    return;
                }

                this.$usedDom.delete(dom);

                this.$removeStyle();
            };
            //------------------------------------------------
            // 插入 style
            this.insertStyle = function(dom) {


                if(this.$usedDom.has(dom)){
                    return;
                }

                this.$usedDom.add(dom);

                if (this.$cssContent == null || this.$cssContent.length < 1) {
                    return;
                }

                // 先檢查 style 是否存在
                let id = _asyncTemplateSetting["styleId_head"] + this.$style_id;
                let styleDom = document.querySelector(("#" + id));

                if (styleDom) {
                    return;
                }
                styleDom = document.createElement('style');
                styleDom.id = id;
                styleDom.innerHTML = this.$cssContent;

                document.head.appendChild(styleDom);
            };

            //------------------------------------------------
            // 取得 模版 的內容
            // 最主要非同步的步驟
            this.$asyncGetTemplate = function() {
                // debugger;

                this.$call_hook(null, "templateloading");
                //-----------------------
                let p;

                if (this.$options.ajax.url) {
                    // debugger;

                    let options = _.defaults({}, {
                        dataType: 'html'
                    }, this.$options.ajax);

                    p = new Promise(function(res, rej) {
                        $.ajax(options)
                            .done(function(data) {
                                res(data);
                            })
                            .fail(function(err) {
                                rej(err);
                            });
                    });
                } else if (typeof(this.$options.getdata) == "function") {
                    p = this.$options.getdata();
                } else if (this.$options.getdata instanceof Promise) {
                    p = this.$options.getdata;
                } else {
                    p = this.$options.getdata;
                }

                p = Promise.resolve(p);
                //-----------------------
                // 已取得資料

                p.thenWith(function(data) {
                    // debugger;
                    if (typeof(data) != "string") {
                        throw new TypeError("asyncTemplate data must be string");
                    }
                    this.$htmlContent = data;

                    this.$status = 1;

                    this.$analyzeContent();

                    this.$call_hook(this.$tempRootDom, "templateloaded");

                    this.$deferred.resolve(this);
                }, function(err) {
                    // debugger;
                    this.$status = 2;

                    if (!(err instanceof Error)) {
                        err = new Error(err);
                    }

                    this.$error = err;

                    this.$call_hook(this.$tempRootDom, "templateloaded");

                    this.$deferred.reject(this.$error);
                }, this);
                return p;
            };
            //------------------------------------------------
            this.$call_hook = function(dom, callbackName) {

                let fn = this.$options[callbackName];

                if (typeof(fn) == "function") {
                    fn.call(this, this.$error, dom);
                }
            };
            //------------------------------------------------
            // 從 url 取得的內容解析
            // 取得 htmlContent, script, style
            this.$analyzeContent = function() {
                debugger;

                let dom = document.createElement('div');
                dom.innerHTML = this.$htmlContent;
                //-----------------------

                let scriptList = Array.from(dom.querySelectorAll('script'));
                let styleList = Array.from(dom.querySelectorAll('style'));
                //-----------------------

                // 移除所有的 script
                scriptList.forEach(function(dom, i) {
                    if (i == 0) {
                        this.$javascriptContent = dom.innerHTML || '';
                        this.$javascriptContent = this.$javascriptContent.trim();
                    }
                    dom.parentNode.removeChild(dom);
                }, this);
                //-----------------------
                // 移除所有的 style
                styleList.forEach(function(dom, i) {
                    if (i == 0) {
                        this.$cssContent = dom.innerHTML || '';
                        this.$cssContent = this.$cssContent.trim();
                    }
                    dom.parentNode.removeChild(dom);
                }, this);

                //-----------------------

                this.$htmlContent = dom.innerHTML;

                dom = null;
                // 匯入使用者设定
                this.$importTemplateOptionsFromScript();

            };

            //------------------------------------------------
            // 從 script 內容取得 templateOptions
            this.$importTemplateOptionsFromScript = function() {

                let res;
                if (this.$javascriptContent != null && this.$javascriptContent.length > 0) {

                    let command = "'use strict'\n";
                    command += TemplateItem.$command_head;
                    command += this.$javascriptContent;
                    command += TemplateItem.$command_footer;

                    let fn;
                    try {
                        fn = new Function(command);
                        res = fn.call({});
                    } catch (e) {
                        console.log("script have problem");
                        throw e;
                    }
                }
                //-----------------------
                if (!res) {
                    return;
                }
                this.$template_options = res;

                for (let k in this.$_default_templateOptions) {
                    if (this.$template_options[k] == null) {
                        this.$template_options[k] = this.$_default_templateOptions[k];
                    }
                }
                res = null;
            };

        }).call(TemplateItem.prototype)
        //======================================================================
        // TemplateItem 的副本
        function TemplateItemClone(source){
            'use strict';

            // TemplateItem
            this.$source;
            //-----------------------
            this.$containerDom;

            this.$operateDom;

            this.$tempRootDom;

            //-----------------------
            this.$user_callbacks = {};

            this.$user_GeneralCallbacks = {};

            this.$template_options = {};

            this.$error;

            // 模版函式
            this.$templateFn;

            //-----------------------

            this.__construct(source);
        }

        (function(){
            this.__construct = function(source){
                this.$source = source;

                this.$tempRootDom = document.createElement('div');
                this.$tempRootDom.innerHTML = this.$source.$htmlContent;

                this.$operateDom = this.$tempRootDom;

                this.$cloneSource();
            };
            //------------------------------------------------
            this.setContainer = function(dom){
                this.$containerDom = dom;
            };
            //------------------------------------------------
            this.setUserCallbacks = function(options){
                this.$user_callbacks = _.extend({}, options);
            };

            this.setUserGeneralCallbacks = function(options){
                this.$user_GeneralCallbacks = _.extend({}, options);
            };
            //------------------------------------------------
            this.addError = function(key, error){

                if(this.$error == null){
                    this.$error = {};
                }

                this.$error[key] = error;
            };
            //------------------------------------------------
            this.mount = function(data){

                this.$call_hook['beforemount'];

                this.$render(data);

                this.$call_hook(dom, 'mounted');

                this.$call_hook(dom, 'updated');
            };
            //------------------------------------------------
            this.unmount = function(){
                this.$call_hook('beforeunmount');

                this.$source.unmount(this.$containerDom);

                this.$call_hook('unmounted');
            };
            //------------------------------------------------
            this.updateData = function(data){

                this.$render(data);

                this.$call_hook(dom, 'updated');
            };
            //------------------------------------------------
            this.call_hook = function(hookName){
                this.$call_hook(hookName);
            };
            //------------------------------------------------
            // 所屬 template.name
            this.getTemplateName = function(){
                return this.$source.$name;
            };
            //------------------------------------------------
            this.$call_hook = function(hookName){
                let fn = this.$template_options[hookName];
                let dom = this.$operateDom;

                if(typeof(fn) == 'function'){
                    fn.call(dom, this.$error, dom);
                }

                fn = this.$user_GeneralCallbacks[hookName];

                if(typeof(fn) == 'function'){
                    fn.call(dom, this.$error, dom);
                }

                fn = this.$user_callbacks[hookName];

                if(typeof(fn) == 'function'){
                    fn.call(dom, this.$error, dom);
                }
            };
            //------------------------------------------------
            this.$cloneSource = function(){
                const source = this.$source;

                this.$template_options = _.extend({}, source.$template_options);

                if(source.$error != null){
                    this.addError('template', source.$error);
                }

                this.$name = source.$name;
            };

            //------------------------------------------------
            this.$render = function(data){
                debugger;

                if (typeof(data) != "object" || data == null) {
                    data = {};
                }

                this.$source.insertStyle(this.$containerDom);
                //-----------------------
                data = _.extend({}, this.$template_options.data, data);

                // 產生 $templateFn
                this.$setTemplateFn();

                let htmlContent = this.$templateFn(data);

                this.$containerDom.innerHTML = htmlContent;

                this.$operateDom = this.$containerDom;

            };
            //-----------------------------------------------

            // 产生 template 函式
            this.$setTemplateFn = function() {

                if(this.$templateFn == null){
                    return;
                }

                let htmlContent = this.$tempRootDom.innerHTML;
                let options = this.$options;

                if (options.render) {
                    // 若有指派著色引擎

                    this.$templateFn = (function(html, data) {
                        this.$options.render(html, data);
                    }).bind(this, htmlContent);

                } else if (options.literals) {
                    // 采用 es6
                    let content = htmlContent;
                    this.$templateFn = _.literalsTemplate(content);

                } else {
                    this.$templateFn = _.template(htmlContent);
                }
            };


        }).call(TemplateItemClone.prototype);
        //======================================================================

    }


})(this || {});
