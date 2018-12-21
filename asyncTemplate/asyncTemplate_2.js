!(function (global) {

    ////////////////////////////////////////////////////////////////////////////
    //
    //
    //
    ////////////////////////////////////////////////////////////////////////////

    // _.asyncTemplateCommand 設定文件
    const _asyncTemplateSetting = {
        // 给予 <style> 一个 id 值的标头
        "styleId_head": "asyncTemplate_"
    };

    // jq.template 的设定文件
    const $templateSetting = {};

    // 是否支援字符串模版
    let $isSupport_templateLiterals = (function () {
        var support = false;
        try {
            var fn = new Function("return `support_templateString`;");

            if (fn() === "support_templateString") {
                support = true;
            }
        } catch (e) { }

        return support;
    })();
    //==========================================================================

    (function () {

        if (typeof (module) == 'object' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (obj) {
                // 建構
                noSupportFactory(obj);
            };
        } else {
            if (global._ == null || _.$$extension == null) {
                return;
            }

            let environment = _.$$extension.environment;

            switch (environment) {
                case 'browser':
                    let $ = global.$ || global.jQuery || null;
                    // jq_extension($);

                    factory(global._);
                    break;
                default:
                    noSupportFactory(global._);
                    break;
            }
        }

    }());
    return;
    //==========================================================================
    function noSupportFactory(_) {
        if (_ == null || !_.isObject(_)) {
            throw new TypeError("need import lodash or underscode");
        }

        _.mixin({
            asyncTemplate: function () {
                throw new Error("this. enviroment no support _.async()");
            }
        });
    }
    //==========================================================================
    function jq_extension($) {

    };
    //==========================================================================
    function factory(_) {

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
                    return templateItemMap[name];
                }

                // 新增一個 template
                instance = new TemplateItem(name, options);
                instance.initialize();
            }

            return instance;
        }

        (function (fn) {
            fn.keys = function () {
                return Object.keys(TemplateItem.$templateItemMap);
            };

            fn.values = function () {
                return Object.values(TemplateItem.$templateItemMap);
            };

            fn.delete = function (name) {
                delete TemplateItem.$templateItemMap[name];
            };

            fn.clear = function () {
                TemplateItem.$templateItemMap = {};
            };

            fn.set = function (key, value) {
                if(key == null){
                    return _asyncTemplateSetting;
                }else if(value == null){
                    return _asyncTemplateSetting[key];
                }
                _asyncTemplateSetting = value;
            };
        })(asyncTemplateCommand);
        //--------------------------------------

        // 代表每個 template
        // 只做一次性 load
        function TemplateItem(name, options) {
            'use strict';

            this.$style_id;

            // 使用者设定的模版名称
            this.$name;

            this.$content;

            // 原來的 html 內容
            this.$htmlContent;

            // 原来的 js 内容
            this.$javascriptContent;

            // 原来的 css 内容
            this.$cssContent;

            // 模版内容里的使用者設定
            this.$templateOptions = {};

            this.$_templateOptions = {
                dataloading: null,
                dataloaded: null,
                templateloaded: null,
                allloaded: null,
                mounted: null,
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
            this.$usedDom = new Map();

            this.$options = {
                getData: null,
                literals: true,
                preload: true,
                render: null,
                templateloading: null,
                templateloaded: null
            };

            // 模版函式
            this.$templateFn;

            // 代表的是
            // 取得資料然後解析這一段
            this.$deferred;

            //----------------------------
            this.__construct(name, options);
        }
        //--------------------------------------------------------------------------
        // 类别
        (function (fn) {
            // 登陸所有的 TemplateItem
            fn.$templateItemMap = {};

            fn.$style_uid = 1;

            fn.$command_head = "let templateOptions;";

            fn.$command_footer = "if(templateOptions != null && typeof(templateOptions) == 'object'){\
            return templateOptions;\
        }else{\
            return null;\
        }";

        })(TemplateItem);
        //--------------------------------------------------------------------------
        (function () {
            this.__construct = function (name, options) {

                this.$name = name;
                this.$style_id = TemplateItem.$style_uid++;
                this.$deferred = _.deferred();

                this.set(options);

                // 登陸
                TemplateItem.$templateItemMap[this.$name] = this;
            };
            //------------------------------------------------
            this.initialize = function () {

                // 根據 url 取得 this.content
                if (this.$options.preload) {
                    this.$asyncGetTemplate();
                }
            };
            //------------------------------------------------
            // 得知 loading 狀態
            // 拋出錯誤表示已經 loaded 但失敗
            this.loaded = function () {
                return (this.$status > 0 ? true : false);
            };
            //------------------------------------------------
            this.error = function () {
                return (this.$status == 2 ? this.$error : false);
            };
            //------------------------------------------------
            // 使用者设定
            this.set = function (key, value) {
                let options;

                if (typeof (key) == "object") {
                    options = key;
                } else {
                    options = {
                        key: value
                    };
                }
                //-----------------------
                for (let key in this.$options) {
                    if (options[key] != null) {
                        this.$options[key] = options[key];
                    }
                }
                //-----------------------
                if (this.$options.literals && !$isSupport_templateLiterals) {
                    this.$options.literals = false;
                }
            };
            //------------------------------------------------------------------
            this.promise = function () {
                return this.$deferred.promise();
            };
            //------------------------------------------------------------------
            // API
            // 引用這個 template 被引用
            this.mount = function (dom, data) {
                debugger;

                let p;
                if (!this.$status < 1 && !this.$options.preload) {
                    this.$asyncGetTemplate();
                }
                //-----------------------
                p = this.$deferred.promise();

                p.doneWith(function () {
                    debugger;

                    // 檢查 css 是否已登陸
                    this.$insertStyle();

                    // 登陸 dom
                    this.$usedDom.set(dom, true);

                    // 掛上 html
                    this.$renderHtml(dom, data);

                    // 執行 script
                    this.$call_hook(dom, 'mounted');

                    debugger;
                    this.$call_hook(dom, 'updated');
                }, this);

                return this;
            };
            //------------------------------------------------
            // API
            // 解除引用
            this.unmount = function (dom) {
                debugger;

                this.$usedDom.delete(dom);

                // 執行 unbind script
                this.$call_hook(dom, 'unmounted');

                // 移除 html
                this.$removeHtmlContent(dom);

                if (!this.$usedDom.size) {
                    // 若 template 都沒被引用
                    // 刪除 style
                    this.$removeStyle();
                }

                return this;
            };
            //------------------------------------------------
            // 當使用者想對某個使用該模板的 dom 更新 data
            this.updateData = function (dom, data) {
                // 掛上 html

                this.$renderHtml(dom, data);

                this.$call_hook(dom, 'updated');
            };
            //------------------------------------------------
            // 給外面呼叫用
            this.call_hook = function (dom, callbackName) {
                this.$call_hook(dom, callbackName);
            };
            //------------------------------------------------
            // 取得模版函式
            this.getTemplate = function () {
                return this.$templateFn;
            };
            //------------------------------------------------
            this.getName = function () {
                return this.$name;
            };
            //------------------------------------------------
            // 插入 style
            this.$insertStyle = function () {
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
            // 移除 style
            this.$removeStyle = function () {
                let id = _asyncTemplateSetting["styleId_head"] + this.$id;
                let styleDom = document.querySelector(("#" + id));

                if (styleDom) {
                    document.head.removeChild(styleDom);
                }
            };
            //------------------------------------------------

            // 插入 html 內容
            this.$renderHtml = function (dom, data) {
                debugger;

                if (typeof (data) != "object" || data == null) {
                    data = {};
                }

                data = _.extend(this.$templateOptions.data, data);
                let htmlContent = this.$htmlContent;

                try {
                    htmlContent = this.$templateFn(data);
                } finally {
                    dom.innerHTML = htmlContent;
                }

            };
            //------------------------------------------------

            // 移除 html 內容
            this.$removeHtmlContent = function (dom) {
                dom.innerHTML = '';
            };
            //------------------------------------------------
            this.$call_hook = function (dom, callbackName) {


                if(typeof(this.$options[callbackName])== "function"){
                    this.$options[callbackName].call(this, this.$error, dom);
                }

                if(this.$status > 0){
                    if (typeof (this.$templateOptions[callbackName]) == "function") {
                        let fn = this.$templateOptions[callbackName];
                        fn.call(this.$templateOptions, this.$error, dom);
                    }
                }

            };
            //------------------------------------------------
            // 從 script 內容取得 templateOptions
            this.$importTemplateOptionsFromScript = function () {

                let res;
                if (this.$javascriptContent.trim().length > 0) {

                    let command_body = this.$javascriptContent;
                    let command = TemplateItem.$command_head + command_body + TemplateItem.$command_footer;

                    let fn;
                    try {
                        fn = new Function(command);
                        res = fn();
                    } catch (e) {
                        console.log("script have problem");
                        throw e;
                    }
                }
                //-----------------------
                if (!res) {
                    return;
                }

                this.$templateOptions = res;

                for (let key in this.$_templateOptions) {
                    if (this.$templateOptions[key] == null) {
                        this.$templateOptions[key] = this.$_templateOptions[key];
                    }
                }
                res = null;
            };
            //------------------------------------------------
            // 取得 模版 的內容
            // 最主要非同步的步驟
            this.$asyncGetTemplate = function () {

                if (this.$options["templateloading"] != null) {
                    this.$options["templateloading"].call(this);
                }
                //-----------------------
                let p;

                if (typeof (this.$options.getData) == "function") {
                    p = this.$options.getData();

                    if (!(p instanceof Promise)) {
                        throw new TypeError('getData must return promise');
                    }
                } else if (this.$options.getData instanceof Promise) {
                    p = this.$options.getData;
                } else {
                    p = this.$options.getData;
                }

                p = Promise.resolve(p);
                //-----------------------
                // 已取得資料

                p.thenWith(function (data) {
                    if (typeof (data) != "string") {
                        throw new TypeError("asyncTemplate data must be string");
                    }
                    this.$content = data;

                    this.$status = 1;

                    this.$analyzeContent();

                    if (this.$options["templateloaded"] != null) {
                        this.$options["templateloaded"].call(this, null);
                    }

                    this.$deferred.resolve(this);
                }, function (err) {
                    this.$status = 2;

                    if (!(err instanceof Error)) {
                        err = new Error(err);
                    }

                    this.$error = err;

                    if (this.$options["templateloaded"] != null) {
                        this.$options["templateloaded"].call(this, this.$error);
                    }
                    this.$deferred.reject(this.$error);
                }, this);

                return p;
            };
            //------------------------------------------------
            // 從 url 取得的內容解析
            // 取得 htmlContent, script, style
            this.$analyzeContent = function () {
                // debugger;
                let parent = document.createElement('div');
                parent.innerHTML = this.$content;
                //-----------------------

                let scriptList = Array.from(parent.querySelectorAll('script'));
                let styleList = Array.from(parent.querySelectorAll('style'));
                //-----------------------
                // debugger;

                // 移除所有的 script
                scriptList.forEach(function (dom, i) {
                    if (!i) {
                        this.$javascriptContent = dom.innerHTML;
                    }
                    dom.parentNode.removeChild(dom);
                }, this);
                //-----------------------
                // 移除所有的 style
                styleList.forEach(function (dom, i) {
                    if (!i) {
                        this.$cssContent = dom.innerHTML;
                    }
                    dom.parentNode.removeChild(dom);
                }, this);
                //-----------------------
                // debugger;
                // this.domList = parent;
                let templateDom = parent.querySelector('template');

                this.$htmlContent = (templateDom) ? templateDom.innerHTML : null;
                parent = undefined;
                //-----------------------
                // 匯入使用者设定
                this.$importTemplateOptionsFromScript();

                // 确定著色引擎
                this.$setTemplateFn();
            };
            //------------------------------------------------
            // 产生 template 函式
            this.$setTemplateFn = function () {
                let options = this.$options;

                if (options.render) {
                    // 若有指派著色引擎

                    this.$templateFn = (function (data) {
                        this.$options.render(this.$htmlContent, data);
                    }).bind(this);

                } else if (options.literals) {
                    // 采用 es6
                    let content = this.$htmlContent;
                    this.$templateFn = _.literals(content);

                } else {
                    this.$templateFn = _.template(this.$htmlContent);
                }
            };
            //------------------------------------------------

        }).call(TemplateItem.prototype);
    } // end factory

}(this || {}));
