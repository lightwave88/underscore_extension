!(function (global) {
    (function () {
        let $ = global.$ || global.jQuery || null;
        if ($) {
            factory($);
        }
    })();
    return;
    //--------------------------------------
    function factory($) {
        $.component = switchTemplateCommand;

        function switchTemplateCommand(dom, options) {
            let switchTemplate;

            if(typeof(dom)=="string"){
                dom = document.querySelector(dom);
            }

            if(!(dom instanceof EventTarget)){
                throw new TypeError('dom typeError');
            }

            if ($.data(dom, '__us_switchTemplate') == null) {
                switchTemplate = new SwitchTemplate(dom);
                $.data(dom, '__us_switchTemplate', switchTemplate);
            }
            switchTemplate = $.data(dom, '__us_switchTemplate');

            if($.isPlainObject(options)){
                switchTemplate.set(options);
            }

            return switchTemplate;
        }
        //--------------------------------------
        function SwitchTemplate(dom) {
            this.$template;
            this.$data;
            this.$error;
            //-----------------------
            this.$dom;
            this.$job;

            // 使用者設定
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

        (function () {
            this.__construct = function (dom) {
                this.$dom = dom;
            };
            //---------------------------------
            // 更新 template, data
            // data (function|promise|data)
            this.update = function (tmplName, data) {
                return this.$checkUpdate(tmplName, data);
            };
            //---------------------------------
            // 更新 template
            this.template = function (tmplName) {
                return this.$checkUpdate(tmplName, this.$data);
            };
            //---------------------------------
            // 更新 data
            // data 可以是數據， promise, function
            this.updateData = function (data) {
                if (this.$template == null) {
                    throw new Error("u must assign template first");
                }
                let tmplName = this.$template.getName();

                return this.$checkUpdate(tmplName, this.$data);
            };
            //---------------------------------
            // 加入監聽，及時更新內容
            this.watch = function () {
                // 對 _.observe() 暴露 this.data

            };
            //---------------------------------
            // 關於設定
            this.set = function (key, value) {
                let setting = {};

                if($.isPlainObject(key)){
                    setting = key;
                }else{
                    setting[key] = value;
                }

                for (let k in this.$options) {
                    if(setting[k] == null){
                        continue;
                    }
                    this.$options[k] = setting[k];
                }

            };
            //---------------------------------
            // 若正在執行任務中
            // 終止既有的任務
            this.stop = function () {
                if(!this.$job){
                    return;
                }
                this.$job.stop();
            };
            //---------------------------------
            this.$checkUpdate = function (tmplName, data) {
                debugger;

                data = data || {};

                if (!tmplName) {
                    throw new TypeError('tmplName typeError');
                }

                if(!_.asyncTemplate(tmplName)){
                    throw new Error('template('+tmplName+') no exists');
                }

                if (!this.$check_1(tmplName, data)) {
                    return Promise.resolve();
                }

                // 開啟一個 job
                return this.$startJob(tmplName, data);
            };
            //---------------------------------
            this.$check_1 = function (tmplName, data) {

                if (!(typeof (data) == "function" || data instanceof Promise)) {
                    let prev_templName = (this.$template == null ? '' : this.$template.getName());

                    let judge_1 = (tmplName.localeCompare(prev_templName) == 0);
                    let dataClone = ((data == null || typeof (data) != "object") ? data : JSON.parse(JSON.stringify(data)));
                    let judge_2 = _.isEqual(this.$data, dataClone);

                    return (judge_1 && judge_2 ? false : true);
                }

                return true;
            };
            //---------------------------------
            this.$startJob = function (tmplName, data) {
                this.$error = null;

                // 創建一個 job
                this.$job = new SwitchJob(this, tmplName, data);
                let p = this.$job.update();

                p.alwaysWith(function(err, data){
                    this.$job == null;
                },this);

                return p;
            };

        }).call(SwitchTemplate.prototype);
        //======================================================================
        // 任務
        // 等待 template, data
        // 是否要負責 render ??
        function SwitchJob(parent, template, data) {
            this.$dom;

            this.$deferred;
            //-----------------------
            this.$parent;
            this.$changeTemplate;
            this.$status = 0;
            //-----------------------
            this.$template;
            this.$data;
            this.$data_promise;
            //-----------------------
            this.$error;

            // 開關
            this.$stop = false;
            //-----------------------
            this.__construct(parent, template, data);
        }

        (function () {
            this.__construct = function (parent, template, data) {
                this.$parent = parent;

                this.$dom = this.$parent.$dom;

                this.$deferred = _.deferred();

                let prev_templName = '';

                if(this.$parent.$template){
                    prev_templName = this.$parent.$template.getName();
                }

                // 是否需要更換 template
                // 還是只需要原 template.update()
                this.$changeTemplate = (prev_templName.localeCompare(template) == 0 ? false : true);

                // 取得 template
                this.$template = _.asyncTemplate(template);

                if(!this.$template){
                    throw new Error('template('+template+') no exists');
                }

                this._aboutData(data);
            };
            //---------------------------------
            this.stop = function () {
                this.$stop = true;
                this.$deferred.reject();
            };
            //---------------------------------
            // 更新
            this.update = function () {
                this._call_hook('update');

                // wait data
                let p1 = this.$data_promise;

                // wait template
                let p2 = this.$template.promise();

                if (!this.$template.loaded()) {
                    this._call_hook('templateloading');

                    p2.alwaysWith(function (err, data) {
                        if(err){
                            this.$error = (err instanceof Error)?err:new Error(err);
                        }
                        this._call_hook('templateloaded');
                    }, this);
                }
                //-----------------------
                let p3 = Promise.all([p1, p2]);

                p3.alwaysWith(function (err, data) {
                    this._allLoaded(err, data);
                }, this);

                return this.$deferred.promise();
            };
            //---------------------------------
            // template, data 都 load 完
            this._allLoaded = function (err, data) {

                if(this.$stop){
                    return;
                }

                if (err) {
                    this.$status = 2;
                    this.$error = (err instanceof Error)? err:new Error(err);

                    this._call_hook('allloaded');
                    this._call_templateHook('allloaded');

                    this.$deferred.reject(err);

                } else {

                    let dom = this.$parent.$dom;

                    this.$data = data[0] || undefined;

                    this.$status = 1;

                    this._call_hook('allloaded');
                    this._call_templateHook('allloaded');

                    if (this.$changeTemplate) {

                        if(this.$parent.$template){
                            this.$parent.$template.unmount(dom, this.$data);
                        }

                        this.$template.mount(dom, this.$data);
                    } else {
                        this.$template.updateData(dom, this.$data);
                    }
                    // 更新 parent 數據
                    this._upDateParent();

                    this._call_hook('updated');

                    this.$deferred.resolve();
                }
            };
            //---------------------------------
            // 更新 parent 數據
            this._upDateParent = function () {
                this.$parent.$data = this.$data;
                this.$parent.$template = this.$template;
                this.$parent.$error = this.$error;
            };
            //---------------------------------
            this.loaded = function () {
                return this.$loaded;
            };
            //---------------------------------
            // 資料的取得方式
            this._aboutData = function (data) {
                this._call_hook('dataloading');
                this._call_templateHook('dataloading');

                if (data instanceof Promise) {
                    this.$data_promise = data;
                } else if (typeof (data) == "function") {
                    this.$data_promise = data();
                    if (!(this.$data_promise instanceof Promise)) {
                        throw new TypeError('data must return promise')
                    }
                } else {
                    this.$data_promise = Promise.resolve(data);
                }
                //-----------------------
                this.$data_promise.alwaysWith(function (err, data) {
                    // 執行 hook
                    if(err){
                        this.$error = (err instanceof Error?err:new Error(err));
                    }
                    this._call_hook('dataloaded');
                    this._call_templateHook('dataloaded');

                }, this);
            };
            //---------------------------------
            this._call_templateHook = function (hookName) {
                this.$template.call_hook(this.$dom, hookName);
            };
            //---------------------------------
            this._call_hook = function (hookName) {
                let parentOptions = this.$parent.$options;

                if(typeof(parentOptions[hookName]) == 'function'){
                    parentOptions[hookName].call(this.$dom, this.$error, this.$dom);
                }
            };

        }).call(SwitchJob.prototype);
    }

})(this || {});
