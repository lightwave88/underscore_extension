!(function (global) {

    let _;
    (function () {

        if (typeof window !== "undefined" && typeof document !== "undefined") {

            _ = global._;
            let jq = global.$ || global.jQuery || null;

            // 建構
            factory(_, jq);

        } else if (typeof module !== 'undefined' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (_path) {

                if (typeof _path == "string") {
                    _ = require(_path);
                } else {
                    _ = _path;
                }
                // 建構
                noSupportFactory(_);
            };
        } else if (typeof (window) === "undefined" && self !== "undefined" && typeof (importScripts) === 'function') {
            debugger;
            // webWorker 環境
            // console.log("worker")

            if (typeof (global._) === "undefined") {
                // worker环境，但尚未载入 _
                return;
            }
            // worker环境，已载入 _
            _ = global._;

            // 建構
            noSupportFactory(_);
        } else {
            throw new TypeError("not support your system");
        }

    }());

    // return;
    //////////////////////////////////////////////////
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


    function factory(_, $) {
        if (_ == null || !_.isObject(_)) {
            throw new TypeError("need import lodash.js or underscode.js");
        }

        if ($ == null) {
            throw new Error("need import jQuery.js");
        }

        jq_extension($);

        //----------------------------
        _.mixin({
            asyncTemplate: asyncTemplate
        });
    }
    //////////////////////////////////////////////////
    function jq_extension($) {

        // callback_options: (loaded, loading, error)
        // 若 name = "" 清除 dom.innerHTML
        $.fn.asyncHtml = function (name, callback_options, ajaxOptions) {
            debugger;

            ajaxOptions = (ajaxOptions != null) ? ajaxOptions : null;
            callback_options = callback_options || {};

            let loading_callback = _.isFunction(callback_options["loading"]) ? callback_options["loading"] : null;
            let loaded_callback = _.isFunction(callback_options["loaded"]) ? callback_options["loaded"] : null;

            //----------------------------
            // 取出 template
            let template;

            debugger;
            if (name) {
                template = _.asyncTemplate(name);

                if (!template && ajaxOptions) {
                    // 若有設置 ajaxoptions
                    template = _.asyncTemplate(name, ajaxOptions);
                }
            }

            //----------------------------
            let p_list = [];

            this.each(function (i, dom) {
                let p = $.asyncHtml(dom, template, loading_callback, loaded_callback);
                p_list.push(p);
            });

            return Promise.all(p_list);
        };
        //----------------------------

        $.asyncHtml = function (dom, template, loading_callback, loaded_callback) {
            let p = Promise.resolve();
            // 若之前有掛 template 卸載
            let prev_template = $(dom).data("asyncTemplate");


            //----------------------------
            if (prev_template) {

                if (template && template.id == prev_template.id) {
                    // template 相同
                    return p;
                } else {
                    prev_template.unmount(dom);
                }
            }
            //----------------------------
            let promise;

            if (template == null) {
                return p.then(function () {
                    // 沒有指派 template，所以清空 html
                    dom.innerHTML = "";
                });
            } else {
                // template 是否還在 loading
                let resolve_callback;
                let reject_callback;

                if (!template.isLoaded()) {
                    // template 尚未 loaded

                    if (loading_callback) {
                        // trmplate 正在 loading
                        loading_callback.call(dom, dom);
                    }
                    //-----------------------

                    resolve_callback = function (data) {
                        // 登陸
                        $(dom).data("asyncTemplate", template);

                        if (loaded_callback) {
                            loaded_callback.call(dom, undefined, dom);
                        }
                        template.mount(dom);
                        return data;
                    };

                    reject_callback = function (err) {
                        // err
                        if (loaded_callback) {
                            loaded_callback.call(dom, err, dom);
                        }
                        throw err;
                    };

                } else {
                    // template 早已 loaded

                    resolve_callback = function (data) {
                        // 登陸
                        $(dom).data("asyncTemplate", template);
                        template.mount(dom);
                        return data;
                    };

                    reject_callback = undefined;
                }

                //----------------------------
                return template.promise.then(resolve_callback, reject_callback);
            }
        };

    }
    //////////////////////////////////////////////////
    // asyncTemplate 統整者
    // name 已經存在的不能被覆蓋
    function asyncTemplate(name, ajaxOptions) {
        debugger;

        let instance;
        let templateItemMap = asyncTemplate.templateItemMap;


        //----------------------------
        if (ajaxOptions == null) {
            // 單純取出既有的 template
            instance = templateItemMap[name];
        } else {

            if (templateItemMap[name]) {
                throw new Error("template(" + name + ") has exists");
            }

            // 新增一個 template
            templateItemMap[name] = new TemplateItem(ajaxOptions);

            instance = templateItemMap[name];
        }

        return instance;
    }

    (function (fn) {
        // 登陸所有的 TemplateItem
        fn.templateItemMap = {};
        fn.style_uid = 1;
        fn.styleUid_head = "asyncTemplate_";

    }(asyncTemplate));
    //////////////////////////////////////////////////
    // 代表每個 template
    // 只做一次性 load
    function TemplateItem(options) {
        'use strict';
        
        this.id;
        this.fn = asyncTemplate;

        // 對應網址
        this.url;

        // 原來的內容
        this.content;

        // html 內容
        this.htmlContent;

        // htmlContent 組成的節點
        this.domList;
        this.scriptContent;
        this.styleContent;

        // 使用者設定
        this.templateOptions;

        // 是否已經載入
        // 是否發生錯誤
        this.status = {
            loaded: false,
            error: null
        };

        // 針對 css 的垃圾回收
        // 當沒有 dom 引用此 template時
        // css 當移除
        this.usedDom = new Map();

        this.ajaxOptions = {
            type: "get",
            url: undefined,
            data: undefined,
            dataType: "html"
        };

        this.promise;

        //----------------------------
        this.__construct(options);
    }

    (function () {
        this.command_head = "let templateOptions;";

        this.command_footer = "if(templateOptions != null){\
            return templateOptions;\
        }else{\
            return null;\
        }";
        //------------------------------------------------

        this.__construct = function (options) {
            let $this = this;
            let status = this.status;
            let p = Promise.resolve();
            //----------------------------
            this.id = this.fn.style_uid++;


            this._checkAjaxOptions(options);

            //----------------------------
            // 根據 url 取得 this.content
            p = p.then(function () {
                return $this._getTemplate();
            }, null);

            // 解析 this.content 收集需要的資料
            this.promise = p.then(function (data) {
                debugger;

                $this.status.loaded = true;

                $this._analyzeHtml(data);

                let args = $this._getArguments();

                console.dir(args);

                return args;
            }, function (error) {
                debugger;

                if (!(error instanceof Error)) {
                    error = new Error(error.toString());
                }
                status.error = error;
                status.loaded = true;
                throw error;
            });
        };
        //------------------------------------------------
        // 封裝 promise
        // 為了使用者方便而設
        this.then = function (res_callback, rej_callback) {

            let p = this.promise.then(res_callback, rej_callback);

            return p;
        };
        //------------------------------------------------
        // 得知 loading 狀態
        // 拋出錯誤表示已經 loaded 但失敗
        this.isLoaded = function () {
            let status = this.status;

            if (!status.loaded) {
                return false;
            } else {
                if (status.error instanceof Error) {
                    throw status.error;
                }
                return true;
            }
        };
        //------------------------------------------------
        // API
        // 引用這個 template 被引用
        this.mount = function (dom) {
            // 更改 dom 的 innerHTML

            // 檢查 css 是否已登陸
            this._insertStyle();

            // 登陸 dom
            this.usedDom.set(dom, true);

            // 掛上 html
            this._insertHtmlContent(dom);

            // 執行 script
            this._evalBindScript(dom);
        };
        //------------------------------------------------
        // API
        // 解除引用
        this.unmount = function (dom) {
            debugger;

            this.usedDom.delete(dom);

            // 執行 unbind script
            this._evalUnBindScript(dom);

            // 移除 html
            this._removeHtmlContent(dom);

            if (!this.usedDom.size) {
                // 若 template 都沒被引用
                // 刪除 style
                this._removeStyle();
            }
        };
        //------------------------------------------------
        // 插入 style
        this._insertStyle = function () {
            // 先檢查 style 是否存在
            let id = this.fn.styleUid_head + this.id;
            let styleDom = document.querySelector(("#" + id));

            if (styleDom) {
                return;
            }
            styleDom = document.createElement('style');
            styleDom.id = id;
            styleDom.innerHTML = this.styleContent;

            document.head.appendChild(styleDom);
        };
        //------------------------------------------------
        // 移除 style
        this._removeStyle = function () {
            let id = this.fn.styleUid_head + this.id;
            let styleDom = document.querySelector(("#" + id));

            if (styleDom) {
                document.head.removeChild(styleDom);
            }
        };
        //------------------------------------------------

        // 插入 html 內容
        this._insertHtmlContent = function (dom) {
            let clone = this.domList.cloneNode(true);

            let domList = Array.from(clone.childNodes);

            for (let i = 0, child; child = domList[i]; i++) {
                dom.appendChild(child);
            }
        };
        //------------------------------------------------

        // 移除 html 內容
        this._removeHtmlContent = function (dom) {
            dom.innerHTML = '';
        };
        //------------------------------------------------
        // 當 template 被掛上時要執行的 script
        this._evalBindScript = function (dom) {
            let bind_callback;

            if (!this.templateOptions) {
                // 檢查 templateOptions 是否已載入
                this._importTemplateOptionsFromScript();
            }
            bind_callback = this.templateOptions.bind;

            if (bind_callback) {
                bind_callback.call(this.templateOptions, dom);
            }
        };
        //------------------------------------------------
        // 當 template 被移除時要執行的 script
        this._evalUnBindScript = function (dom) {
            let unbind_callback = this.templateOptions.unbind;

            if (unbind_callback) {
                unbind_callback.call(this.templateOptions, dom)
            }
        };
        //------------------------------------------------
        // 從 script 內容取得 templateOptions
        this._importTemplateOptionsFromScript = function () {

            if (!this.scriptContent.trim().length) {
                // 沒有任何的 script 內容
                this.templateOptions = {};

                return;
            }
            //----------------------------

            let command_body = this.scriptContent;
            let command = this.command_head + command_body + this.command_footer;

            let fn;
            let res;
            try {
                fn = new Function(command);
                res = fn();
            } catch (e) {
                console.log("script have problem");
                throw e;
            }

            this._checkTemplateOptions(res);
        };
        //------------------------------------------------
        // 取得參數並輸出
        this._getArguments = function (key) {
            key = (key && typeof (key) == "string") ? key : null;

            let args = {};

            args["html"] = this.htmlContent;
            args["script"] = this.scriptContent;
            args["style"] = this.styleContent;
            args["loaded"] = this.status.loaded;
            args["error"] = this.status.error;

            return (key ? args[key] : args);
        };
        //------------------------------------------------
        this._checkAjaxOptions = function (options) {
            options = options || {};

            _.defaults(this.ajaxOptions, options);

            if (!this.ajaxOptions.url) {
                throw new Error("no assign url");
            }
        };
        //------------------------------------------------
        this._checkTemplateOptions = function (options) {
            options = options || {};

            this.templateOptions = {};

            $.extend(this.templateOptions, options);

        };
        //------------------------------------------------
        // ajax 取得 url 的內容
        this._getTemplate = function () {

            let url = this.url;
            let ajaxOptions = this.ajaxOptions;

            return new Promise(function (res, rej) {
                $.ajax(ajaxOptions).then(function (data) {
                    res(data);
                }, function (error) {
                    rej(error);
                });
            });
        };
        //------------------------------------------------
        // 從 url 取得的內容解析
        // 取得 htmlContent, script, style
        this._analyzeHtml = function (str) {
            debugger;
            let parent = document.createElement('div');
            parent.innerHTML = str;
            //-----------------------

            let scriptList = Array.from(parent.querySelectorAll('script'));
            let styleList = Array.from(parent.querySelectorAll('style'));
            //-----------------------
            debugger;

            // 移除所有的 script
            scriptList.forEach(function (dom, i) {
                debugger;
                if (!i) {
                    this.scriptContent = dom.innerHTML;
                }
                dom.parentNode.removeChild(dom);
            }, this);
            //-----------------------
            debugger;
            // 移除所有的 style
            styleList.forEach(function (dom, i) {
                debugger;
                if (!i) {
                    this.styleContent = dom.innerHTML;
                }
                dom.parentNode.removeChild(dom);
            }, this);
            //-----------------------
            debugger;
            this.domList = parent;
            this.htmlContent = parent.innerHTML;
        };

        //------------------------------------------------

    }).call(TemplateItem.prototype);
}(this || {}));
