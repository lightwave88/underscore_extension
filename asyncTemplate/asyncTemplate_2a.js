!(function(_global) {

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
    return;
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

    function factory(_global, _) {

        jq_factory(_global);

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
                instance.initialize();
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
        //--------------------------------------

        // 代表每個 template
        // 只做一次性 load
        function TemplateItem(name, options) {
            'use strict';

            this.$style_id;

            // 使用者设定的模版名称
            this.$name;

            this.$content;

            // 原来的 js 内容
            this.$javascriptContent;

            // 原来的 css 内容
            this.$cssContent;

            // 模版内容里的使用者設定
            this.$templateOptions = {};

            // 模板內部可以設定的 options
            this.$_default_templateOptions = {
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
            this.$usedDom = new Set();

            // getData: 資料|取得資料的方式
            // literals: 是否採用 literals template 格式
            // preload: 是否一開始就 load 還是等 mount 才 load
            // render: 指定 render 的函式
            // templateloading: callback, 開始載入模板執行
            // templateloaded: callback, 模板載入後執行
            // cssKeep: unmout 後是否要繼續保留 css
            // ajax: 使用預設取得方式
            this.$options = {
                getData: null,
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

            this.$tempRootDom;

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
        (function() {
            this.__construct = function(name, options) {

                this.$name = name;
                this.$style_id = TemplateItem.$style_uid++;
                this.$deferred = _.deferred();

                this.set(options);

                // 登陸
                TemplateItem.$templateItemMap[this.$name] = this;
            };
            //------------------------------------------------
            this.initialize = function() {

                // 根據 url 取得 this.content
                if (this.$options.preload) {
                    this.$asyncGetTemplate();
                }
            };
            //------------------------------------------------
            // 得知 loading 狀態
            // 拋出錯誤表示已經 loaded 但失敗
            this.loaded = function() {
                return (this.$status > 0 ? true : false);
            };
            //------------------------------------------------
            this.error = function() {
                return (this.$status == 2 ? this.$error : false);
            };
            //------------------------------------------------
            // 使用者设定
            this.set = function(key, value) {
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
            //------------------------------------------------------------------
            this.promise = function() {
                let p = this.$deferred.promise();
                return Promise.resolve(p);
            };
            //------------------------------------------------------------------
            // API
            // 引用這個 template 被引用
            this.mount = function(dom, data) {
                debugger;

                if (!this.$status < 1 && !this.$options.preload) {
                    this.$asyncGetTemplate();
                }
                //-----------------------
                let p = this.$deferred.promise();
                // p = Promise.resolve(p);

                p.doneWith(function() {
                    // debugger;

                    // 檢查 css 是否已登陸
                    this.$insertStyle();

                    // 登陸 dom
                    this.$usedDom.add(dom);

                    // 掛上 html
                    this.$renderHtml(dom, data);

                    // 執行 script
                    this.$call_hook(dom, 'mounted');

                    this.$call_hook(dom, 'updated');
                }, this);

                return p;
            };
            //------------------------------------------------
            // API
            // 解除引用
            this.unmount = function(dom) {
                debugger;

                if (!this.$usedDom.has(dom)) {
                    return;
                }

                this.$usedDom.delete(dom);

                // 執行 unbind script
                this.$call_hook(dom, 'unmounted');

                // 移除 html
                this.$removeHtmlContent(dom);

                this.$removeStyle();
            };
            //------------------------------------------------
            // 當使用者想對某個使用該模板的 dom 更新 data
            this.updateData = function(dom, data) {
                // 掛上 html

                this.$renderHtml(dom, data);

                this.$call_hook(dom, 'updated');
            };
            //------------------------------------------------
            // 給外面呼叫用
            this.call_hook = function(dom, callbackName) {
                this.$call_hook(dom, callbackName);
            };
            //------------------------------------------------
            // 取得模版函式
            this.getTemplate = function() {
                return this.$templateFn;
            };
            //------------------------------------------------
            this.getName = function() {
                return this.$name;
            };
            //------------------------------------------------
            // 插入 style
            this.$insertStyle = function() {
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
            // 移除 style
            this.$removeStyle = function() {

                if (this.$usedDom.size > 0 || this.$options.cssKeep) {
                    // 若 template 都沒被引用
                    // 刪除 style
                    return;
                }
                let id = _asyncTemplateSetting["styleId_head"] + this.$style_id;
                let styleDom = document.querySelector(("#" + id));

                if (styleDom) {
                    document.head.removeChild(styleDom);
                }
            };
            //------------------------------------------------

            // 插入 html 內容
            this.$renderHtml = function(dom, data) {
                debugger;

                if (typeof(data) != "object" || data == null) {
                    data = {};
                }

                data = _.extend({}, this.$templateOptions.data, data);
                let htmlContent = this.$templateFn(data);
                dom.innerHTML = htmlContent;
            };
            //------------------------------------------------

            // 移除 html 內容
            this.$removeHtmlContent = function(dom) {
                dom.innerHTML = '';
            };
            //------------------------------------------------
            this.$call_hook = function(dom, callbackName) {

                if (typeof(this.$options[callbackName]) == "function") {
                    this.$options[callbackName].call(this, this.$error, dom);
                }

                if (this.$status > 0) {
                    if (typeof(this.$templateOptions[callbackName]) == "function") {
                        let fn = this.$templateOptions[callbackName];
                        fn.call(this.$templateOptions, this.$error, dom);
                    }
                }
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
                this.$templateOptions = res;

                for (let k in this.$_default_templateOptions) {
                    if (this.$templateOptions[k] == null) {
                        this.$templateOptions[k] = this.$_default_templateOptions[k];
                    }
                }
                res = null;
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
                } else if (typeof(this.$options.getData) == "function") {
                    p = this.$options.getData();
                } else if (this.$options.getData instanceof Promise) {
                    p = this.$options.getData;
                } else {
                    p = this.$options.getData;
                }

                p = Promise.resolve(p);
                //-----------------------
                // 已取得資料

                p.thenWith(function(data) {
                    // debugger;
                    if (typeof(data) != "string") {
                        throw new TypeError("asyncTemplate data must be string");
                    }
                    this.$content = data;

                    this.$status = 1;

                    this.$analyzeContent();

                    this.$call_hook(this.$tempRootDom, "templateloaded");

                    // 确定著色引擎
                    this.$setTemplateFn();

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
            // 從 url 取得的內容解析
            // 取得 htmlContent, script, style
            this.$analyzeContent = function() {
                // debugger;

                let parent = document.createElement('div');
                parent.innerHTML = this.$content;
                //-----------------------

                let scriptList = Array.from(parent.querySelectorAll('script'));
                let styleList = Array.from(parent.querySelectorAll('style'));
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
                // debugger;
                // this.domList = parent;
                let templateDom = parent.querySelector('template');

                this.$tempRootDom = document.createElement('div');
                this.$tempRootDom.innerHTML = (templateDom) ? templateDom.innerHTML : '';
                parent = undefined

                //-----------------------
                // 匯入使用者设定
                this.$importTemplateOptionsFromScript();

            };
            //------------------------------------------------
            // 产生 template 函式
            this.$setTemplateFn = function() {

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
            //------------------------------------------------

        }).call(TemplateItem.prototype);
    } // end factory

    //==========================================================================
    function jq_factory(_global) {

        let $ = _global.$ || _global.jQuery || null;

        if (!$) {
            return;
        }
        //----------------------------
        $.fn.element = function(options) {
            let targetDom;
            this.each(function(i, dom) {
                if (targetDom == null) {
                    targetDom = dom;
                } else {
                    return;
                }
            });

            return $.element(targetDom, options);
        };
        //----------------------------
        // 元件(適用於小的區塊)
        $.element = switchTemplateCommand;

        function switchTemplateCommand(dom, options) {
            debugger;

            let switchTemplate;

            if (typeof(dom) == "string") {
                dom = document.querySelector(dom);
            }

            if (!(dom instanceof EventTarget)) {
                throw new TypeError('dom typeError');
            }

            if ($.data(dom, '__us_switchTemplate') == null) {
                switchTemplate = new SwitchTemplate(dom);
                $.data(dom, '__us_switchTemplate', switchTemplate);
            }
            switchTemplate = $.data(dom, '__us_switchTemplate');

            if ($.isPlainObject(options)) {
                switchTemplate.set(options);
            }

            return switchTemplate;
        }
        //--------------------------------------
        // 主要目的是切換 job
        function SwitchTemplate(dom) {
            'use strict';

            // 當前使用的模板
            this.$template;

            // 當前使用的數據
            this.$data;

            // 錯誤
            this.$error;
            //-----------------------
            this.$dom;

            // 任務
            this.$job;

            // 使用者設定
            // 針對元件外部而設
            //
            // dataloading: callback
            // dataloaded: callback
            // templateloading: callback
            // allloaded: callback
            // update: callback
            // updated: callback
            this.$options = {
                dataloading: null,
                dataloaded: null,
                templateloading: null,
                templateloaded: null,
                allloaded: null,
                update: null,
                updated: null
            }
            //-----------------------
            this.__construct(dom);
        }

        (function() {
            this.__construct = function(dom) {
                this.$dom = dom;
            };
            //---------------------------------
            // API
            // 更新 template, data
            // data (function|promise|data)
            this.update = function(tmplName, data) {
                debugger;
                return this.$checkUpdate(tmplName, data);
            };
            //---------------------------------
            // API
            // 更新 template
            this.template = function(tmplName) {
                debugger;
                return this.$checkUpdate(tmplName, this.$data);
            };
            //---------------------------------
            // API
            // 更新 data
            // data 可以是數據， promise, function
            this.updateData = function(data) {
                debugger;
                if (this.$template == null) {
                    throw new Error("u must assign template first");
                }
                let tmplName = this.$template.getName();

                return this.$checkUpdate(tmplName, data);
            };
            //---------------------------------
            // API
            this.unmount = function(dom) {

                if (this.$template) {
                    let template = this.$template;
                    this.$template = undefined;
                    template.unmount(dom);
                }
            };
            //---------------------------------
            // 加入監聽，及時更新內容
            this.watch = function() {
                // 對 _.observe() 暴露 this.data

            };
            //---------------------------------
            // 關於設定
            this.set = function(key, value) {
                let setting = {};

                if ($.isPlainObject(key)) {
                    setting = key;
                } else {
                    setting[key] = value;
                }

                for (let k in this.$options) {
                    if (setting[k] == null) {
                        continue;
                    }
                    this.$options[k] = setting[k];
                }

            };
            //---------------------------------
            // 若正在執行任務中
            // 終止既有的任務
            this.stop = function() {
                if (!this.$job) {
                    return;
                }
                this.$job.stop();
            };

            //---------------------------------
            this.$checkUpdate = function(tmplName, data) {
                debugger;

                let template;

                if (!tmplName) {
                    throw new TypeError('tmplName typeError');
                }

                if (!(template = _.asyncTemplate(tmplName))) {
                    throw new Error('template(' + tmplName + ') no exists');
                }

                this.$reset_1();

                // 創建一個 job

                this.$job = new SwitchJob(this, template, data);
                let p = this.$job.update();
                //-----------------------
                p.alwaysWith(function(err, data) {
                    debugger;

                    this.$error = err;
                    this.$job == null;

                    if(!err){
                        this.$data = data["data"];
                        this.$template = data["template"];
                    }

                    this.$call_hook('updated');

                }, this);

                return p;
            };
            //---------------------------------
            this.$reset_1 = function(){
                this.$error = null;
            };
            //---------------------------------
            this.$call_hook = function(hookName){
                let options = this.$options;

                if (typeof(options[hookName]) == 'function') {
                    options[hookName].call(this.$dom, this.$error, this.$dom);
                }
            };

        }).call(SwitchTemplate.prototype);
        //======================================================================
        // 任務: 處理 template, data
        // 是否要負責 render ??
        function SwitchJob(parent, template, data) {
            this.$dom;

            this.$deferred;
            //-----------------------
            this.$dataChange;
            this.$templateChange;
            //-----------------------
            this.$parent;
            this.$status = 0;
            //-----------------------
            this.$template;
            this.$data;
            //-----------------------
            this.$error;

            // 開關
            this.$stop = false;
            //-----------------------
            this.__construct(parent, template, data);
        }

        (function() {
            this.__construct = function(parent, template, data) {
                this.$parent = parent;

                this.$dom = this.$parent.$dom;
                this.$data = data;
                this.$template = template;

                this.$deferred = _.deferred();
            };
            //---------------------------------
            this.stop = function() {
                this.$stop = true;
                this.$deferred.reject();
            };
            //---------------------------------
            // 對外 API
            this.update = function() {
                this._call_hook('update');

                // wait data
                let p1 = this._aboutData();

                // wait template
                let p2 = this.$template.promise();

                if (!this.$template.loaded()) {
                    this._call_hook('templateloading');

                    p2.alwaysWith(function(err, data) {
                        this._call_hook('templateloaded');
                    }, this);
                }
                //-----------------------
                let p3 = Promise.all([p1, p2]);

                p3.alwaysWith(function(err, data) {

                    this._call_hook('allloaded');
                    this._call_templateHook('allloaded');

                    this._allLoaded(err, data);
                }, this);

                return this.$deferred.promise();
            };
            //---------------------------------
            // template, data 都 load 完
            this._allLoaded = function(err, data) {
                debugger;

                if (this.$stop) {
                    return;
                }

                if (err) {
                    this.$status = 2;
                    this.$error = (err instanceof Error) ? err : new Error(err);

                    this.$deferred.reject(this.$error);

                } else {
                    let dom = this.$dom;

                    this.$status = 1;
                    //-----------------------
                    this.$template = data[1];
                    this.$data = data[0];

                    this.$isDataChange();

                    this.$isTemplateChange();
                    //-----------------------
                    let p = Promise.resolve();

                    if (this.$templateChange) {
                        // 更新 template, data
                        if (this.$parent.$template) {
                            this.$parent.$template.unmount(dom, this.$data);
                        }

                        p = this.$template.mount(dom, this.$data);
                    } else if (this.$dataChange) {
                        // 更新 data
                        this.$template.updateData(dom, this.$data);
                    }
                    //-----------------------
                    p = p.doneWith(function() {
                        this.$deferred.resolve({
                            template: (this.$template),
                            data: (this.$data)
                        });
                    }, this);
                }
            };
            //---------------------------------
            // 資料的取得方式
            this._aboutData = function() {

                if (this.$dataChange) {
                    this._call_hook('dataloading');
                    this._call_templateHook('dataloading');
                }
                //-----------------------
                let p = Promise.resolve(this.$data);
                //-----------------------
                // 取得資料
                p.alwaysWith(function(err, data) {
                    if (!err) {
                        this.$data = data;
                    }
                    // 執行 hook
                    if (this.$dataChange) {
                        this._call_hook('dataloaded');
                        this._call_templateHook('dataloaded');
                    }
                }, this);

                return p;
            };
            //---------------------------------
            // fix here
            // 輸入的資料是否與之前有差異
            this.$isDataChange = function() {
                let prev_data = this.$parent.$data;
                this.$dataChange = !_.isEqual(this.$data, prev_data);
            };

            //---------------------------------
            this.$isTemplateChange = function() {
                let prev_templateName = (this.$parent.$template == null ? '' : this.$parent.$template.getName());
                let new_templateName = this.$template.getName();

                this.$templateChange = (new_templateName.localeCompare(prev_templateName) != 0);
            };

            //---------------------------------
            this._call_templateHook = function(hookName) {
                this.$template.call_hook(this.$dom, hookName);
            };
            //---------------------------------
            this._call_hook = function(hookName) {
                let parentOptions = this.$parent.$options;

                if (typeof(parentOptions[hookName]) == 'function') {
                    parentOptions[hookName].call(this.$dom, this.$error, this.$dom);
                }
            };

        }).call(SwitchJob.prototype);
    }; // end jq_factory

}(this || {}));
