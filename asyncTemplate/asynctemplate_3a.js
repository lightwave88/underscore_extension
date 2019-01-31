!(function(_global) {
    // _.asynctemplateCommand 設定文件
    const _asynctemplateSetting = {
        // 给予 <style> 一个 id 值的标头
        "styleId_head": "asynctemplate_"
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
            asynctemplate: function() {
                throw new Error("this. enviroment no support _.async()");
            }
        });
    }
    //==========================================================================
    function factory(_global, _) {
        _.mixin({
            asynctemplate: asynctemplateCommand
        });

        //----------------------------
        // asynctemplateCommand 統整者
        // name 已經存在的不能被覆蓋
        function asynctemplateCommand(name, options) {
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
            //--------------------------------------
            fn.has = function() {
                return ((TemplateItem.$templateItemMap == null) ? false : true);
            };
            //--------------------------------------
            fn.values = function() {
                return Object.values(TemplateItem.$templateItemMap);
            };
            //--------------------------------------
            fn.delete = function(name) {
                delete TemplateItem.$templateItemMap[name];
            };
            //--------------------------------------
            fn.clear = function() {
                TemplateItem.$templateItemMap = {};
            };
            //--------------------------------------
            // 指定 template
            fn.assign = function(tempName, options) {
                if (!tempName) {
                    return;
                }
                //----------------------------
                let templateItemMap = TemplateItem.$templateItemMap;

                if (templateItemMap[tempName] != null) {
                    // 該名稱已指派過
                    throw new Error(`template[${tempName}] has exists`);
                }
                // 新增一個 template
                templateItemMap[tempName] = new TemplateItem(tempName, options);

                return fn;
            };
            //--------------------------------------
            // 使用者想取得 template
            fn.get = function(tempName) {
                let p;
                debugger;
                if (TemplateItem.$templateItemMap[tempName] != null) {
                    let instance = TemplateItem.$templateItemMap[tempName];
                    instance.$checkLoadStatus();

                    p = instance.promise();
                } else {
                    p = Promise.resolve(null);
                }

                return p;
            };
            //--------------------------------------
            // 參數設定
            fn.setting = function(key, value) {
                if (key == null) {
                    return _asynctemplateSetting;
                } else if (value == null) {
                    return _asynctemplateSetting[key];
                }
                _asynctemplateSetting[k] = value;
            };
            //--------------------------------------
            // 是否發生錯誤
            fn.error = function(tempName) {

            };
            // 是否已經 loaded
            fn.loaded = function(tempName) {

            };

            // 某個 dom 是否已掛上 template
            fn.hasMount = function(dom) {
                let res = TemplateItem.$usedDom.has(dom) ? TemplateItem.$usedDom.get(dom) : null;
                return res;
            };
            //--------------------------------------
            // 快捷
            fn.mount = function(tempName, dom, data, fix_options, callbacks) {
                let p;

                if (TemplateItem.$templateItemMap[tempName] != null) {
                    p = TemplateItem.$templateItemMap[tempName].promise();
                } else {
                    p = Promise.resolve(null);
                }

                p = p.then(function(clone) {
                    if (clone == null) {
                        throw new Error('template no exists')
                    } else {
                        return clone.mount(dom, data, fix_options, callbacks);
                    }
                });

            };
            //--------------------------------------
            fn.updateData = function(dom, data) {
                if (!TemplateItem.$usedDom.has(dom)) {
                    return;
                }
                let temp = TemplateItem.$usedDom.get(dom);
                temp.updateData(dom, data);
            };
            //--------------------------------------
            fn.unmount = function(dom) {
                if (!TemplateItem.$usedDom.has(dom)) {
                    return;
                }
                let temp = TemplateItem.$usedDom.get(dom);
                temp.unmount(dom);
            };

        })(asynctemplateCommand);
        //======================================================================

        // 代表每個 template的藍圖
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
                beforeupdate: null,
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
            this.$usedDom = TemplateItem.$usedDom;

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
            // 確定每個 dom 只能有掛一個 template
            fn.$usedDom = new Map();

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


        (function() {
            this.__construct = function(name, options) {

                this.$name = name;
                this.$style_id = TemplateItem.$style_uid++;
                this.$deferred = _.deferred();

                this.$setting(options);

                // 登陸
                TemplateItem.$templateItemMap[this.$name] = this;

                if (this.$options.preload) {
                    debugger;
                    this.$asyncGetTemplate();
                }
            };

            //------------------------------------------------
            // 使用者设定
            this.$setting = function(key, value) {
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
            this.promise = function() {

                let def = _.deferred();

                let p = this.$deferred.promise();

                p.thenWith(function() {
                    debugger;
                    let templateClone = new TemplateItemClone(this);
                    // 傳送資料
                    def.resolve(templateClone);
                }, function() {
                    def.reject(this.$error);
                }, this);

                return def.promise();
            };
            //------------------------------------------------
            this.$checkLoadStatus = function() {
                if (!this.$options.preload) {
                    this.$options.preload = true;
                    this.$asyncGetTemplate();
                }
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
                        throw new TypeError("asynctemplate data must be string");
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
        ////////////////////////////////////////////////////////////////////////
        // TemplateItem 的副本
        function TemplateItemClone(templateItem) {
            'use strict';

            // TemplateItem
            this.$templateItem;
            //-----------------------
            // 旗標作用
            this.$operateDom;

            this.$containerDom;

            this.$tempRootDom;
            //-----------------------
            this.$fix_options;

            this.$user_options;

            this.$template_options = {};
            //-----------------------
            this.$template_defaultData = {};

            this.$error;

            // 模版函式
            this.$templateFn;

            this.$cssContent;
            //-----------------------

            this.__construct(templateItem);
        }

        (function() {
            this.__construct = function(templateItem) {
                debugger;

                this.$templateItem = templateItem;

                this.$tempRootDom = document.createElement('div');
                this.$tempRootDom.innerHTML = this.$templateItem.$htmlContent;

                this.$operateDom = this.$tempRootDom;

                this.$cloneSource();
            };
            //------------------------------------------------
            // callby SwitchJob
            this.setContainer = function(dom) {
                this.$containerDom = dom;
            };
            //------------------------------------------------
            // callby SwitchJob
            this.$setFixOptions = function(options) {
                this.$fix_options = _.extend({}, options);
            };

            // callby SwitchJob
            this.$setUserOptions = function(options) {
                this.$user_options = _.extend({}, options);
            };
            //------------------------------------------------
            this.addError = function(key, error) {

                if (this.$error == null) {
                    this.$error = {};
                }

                this.$error[key] = error;
            };
            //------------------------------------------------
            this.mount = function(dom, data, fix_options, user_options) {


                if (_.asynctemplate.hasMount(dom)) {
                    // 已有掛上 template
                    return false;
                }

                this.$setFixOptions(fix_options);
                this.$setUserOptions(user_options);
                //-----------------------
                let source = this.$templateItem;

                debugger;
                this.$insertStyle(dom);
                //-----------------------
                this.$operateDom = this.$tempRootDom.cloneNode(true);

                this.$call_hook('beforemount');
                debugger;

                this.$setTemplateFn();
                //-----------------------
                this.$render(dom, data);

                // 確定操作的 dom
                this.$operateDom = dom;

                this.$call_hook('mounted');

                return true;
            };
            //------------------------------------------------
            // 古怪的 API
            this.unmount = function(dom) {

                let source = this.$templateItem;

                let temp = _.asynctemplate.hasMount(dom);
                if (!this.isEqual(temp)) {
                    return;
                }

                // this.$setFixOptions(fix_options);
                // this.$setUserOptions(user_options);
                //-----------------------

                source.$usedDom.delete(dom);

                this.$call_hook('beforeunmount');

                dom.innerHTML = '';

                debugger;
                this.$removeStyle();

                this.$call_hook('unmounted');
            };
            //------------------------------------------------
            // 古怪的 API
            this.updateData = function(dom, data) {

                let temp = _.asynctemplate.hasMount(dom);
                if (!this.isEqual(temp)) {
                    return;
                }

                // this.$setFixOptions(fix_options);
                // this.$setUserOptions(user_options);
                //-----------------------
                this.$operateDom = this.$tempRootDom.cloneNode(true);

                this.$call_hook('beforeupdate');

                this.$setTemplateFn();
                //-----------------------
                this.$render(dom, data);

                // 確定操作的 dom
                this.$operateDom = dom;

                this.$call_hook('updated');
            };
            //------------------------------------------------
            this.call_hook = function(hookName) {
                this.$call_hook(hookName);
            };
            //------------------------------------------------
            // 所屬 template.name
            this.getTemplateName = function() {
                return this.$templateItem.$name;
            };
            //------------------------------------------------
            this.isEqual = function(obj) {
                if (!(obj instanceof TemplateItemClone)) {
                    return false;
                }

                return this.$style_id == obj.$style_id;
            };
            //------------------------------------------------
            // 插入 style
            this.$insertStyle = function(dom) {
                let source = this.$templateItem;

                // 登錄
                source.$usedDom.set(dom, this);

                if (this.$cssContent == null || this.$cssContent.length < 1) {
                    return;
                }

                let styleDom = this.$checkCss();

                if (styleDom != null) {
                    return;
                }
                styleDom = document.createElement('style');
                styleDom.id = id;
                styleDom.innerHTML = this.$cssContent;

                document.head.appendChild(styleDom);
            };
            //------------------------------------------------
            this.$removeStyle = function() {
                let source = this.$templateItem;

                if (source.$usedDom.size) {
                    return;
                }

                let styleDom = this.$checkCss();
                if (styleDom == null) {
                    return;
                }

                document.head.removeChild(styleDom);
            };
            //------------------------------------------------
            this.$checkCss = function() {
                let source = this.$templateItem;

                let id = _asynctemplateSetting["styleId_head"] + source.$style_id;
                let styleDom = document.querySelector(("#" + id));
                return (styleDom || null);
            };
            //------------------------------------------------

            this.$call_hook = function(hookName) {
                debugger;

                let fn = this.$template_options[hookName];
                let dom = this.$operateDom;

                if (typeof(fn) == 'function') {
                    fn.call(dom, this.$error, dom);
                }
                //------------------
                fn = this.$user_options[hookName];

                if (typeof(fn) == 'function') {
                    fn.call(dom, this.$error, dom);
                }
                //------------------
                fn = this.$fix_options[hookName];

                if (typeof(fn) == 'function') {
                    fn.call(dom, this.$error, dom);
                }
            };
            //------------------------------------------------
            this.$cloneSource = function() {

                const source = this.$templateItem;

                _.extend(this.$template_defaultData, source.$template_options.data);

                _.extend(this.$template_options, source.$template_options);
                delete this.$template_options.data;

                this.$name = source.$name;

                this.$cssContent = source.$cssContent;
            };

            //------------------------------------------------
            this.$render = function(dom, data) {
                debugger;

                if (typeof(data) != "object" || data == null) {
                    data = {};
                }
                //-----------------------

                data = _.extend({}, this.$template_options.data, data);

                let htmlContent = this.$templateFn(data);
                debugger;

                dom.innerHTML = htmlContent;
            };
            //-----------------------------------------------

            // 产生 template 函式
            this.$setTemplateFn = function() {
                let source = this.$templateItem;

                let htmlContent = this.$operateDom.innerHTML;
                let options = source.$options;

                let render = options.render;

                if (typeof(render) == "function") {
                    // 若有指派著色引擎

                    this.$templateFn = (function(render, html, data) {
                        render(html, data);
                    }).bind(this, render, htmlContent);

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

    } // end factory


})(this || {});
