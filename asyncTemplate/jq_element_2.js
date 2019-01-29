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

        $.fn.element = function (user_options) {
            let targetDom;
            this.each(function (i, dom) {
                if (targetDom == null) {
                    targetDom = dom;
                } else {
                    return;
                }
            });

            return $.element(targetDom, user_options);
        };
        //----------------------------
        // 元件(適用於小的區塊)
        $.element = switchTemplateCommand;

        function switchTemplateCommand(dom, user_options) {
            debugger;

            let switchTemplate;

            if (typeof (dom) == "string") {
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

            if ($.isPlainObject(user_options)) {
                switchTemplate.setting(user_options);
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
            //-----------------------
            this.$dom;

            // 任務
            this.$job;

            // 使用者設定
            // 針對元件外部而設
            //
            // 少用到
            //
            this.$uesr_options = {
                dataloading: null,
                dataloaded: null,
                templateloading: null,
                templateloaded: null,
                loading: null,
                loaded: null,
                beforemount: null,
                mounted: null,
                beforeunmount: null,
                unmounted: null,
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
            // API
            // 更新 template, data
            // {template: , data: , options: }
            this.setAll = function (options) {
                debugger;

                options = options || {};
                let templateName = options['template'] || null;
                let data = options['data'] || null;
                let fix_options = options['options'] || {};

                return this.$callJob(templateName, data, fix_options);
            };
            //---------------------------------
            // API
            // 更新 template
            // callbacks: 對模板的一些事後修正
            this.setTemplate = function (tmplName, fix_options) {

                fix_options = fix_options || {};

                return this.$callJob(tmplName, this.$data, fix_options);
            };
            //---------------------------------
            // API
            // 更新 data
            // data 可以是數據， promise, function
            this.setData = function (data, fix_options) {

                fix_options = fix_options || {};

                if (this.$template == null) {
                    throw new Error("no assign template");
                }
                let tmplName = this.$template.getName();

                return this.$callJob(tmplName, data, fix_options);
            };
            //---------------------------------
            // API
            this.unmount = function () {
                debugger;

                if (!this.$template) {
                    return;
                }

                let template = this.$template;
                this.$template = undefined;

                template.unmount(this.$dom);
            };
            //---------------------------------
            // 加入監聽，及時更新內容
            this.watch = function (callbacks) {
                // 對 _.observe() 暴露 this.data

            };
            //---------------------------------
            // 關於 user_options 設定
            this.setting = function (key, value) {
                let setting = {};

                if ($.isPlainObject(key)) {
                    setting = key;
                } else {
                    setting[key] = value;
                }

                for (let k in this.$uesr_options) {
                    if (setting[k] == null) {
                        continue;
                    }
                    this.$uesr_options[k] = setting[k];
                }
            };
            //---------------------------------
            // 若正在執行任務中
            // 終止既有的任務
            this.stop = function () {
                if (!this.$job) {
                    return;
                }
                this.$job.stop();
            };

            //---------------------------------
            this.$callJob = function (tmplName, data, fix_options) {
                debugger;

                if (!tmplName) {
                    throw new TypeError('tmplName typeError');
                }

                // 創建一個 job

                this.$job = new SwitchJob(this, tmplName, data, fix_options);
                let p = this.$job.update();
                //-----------------------
                p.alwaysWith(function (err, data) {
                    debugger;

                    this.$job == null;

                    if (!err) {
                        // 從 job 更新資料
                        this.$data = data["data"];
                        this.$template = data["template"];
                    }

                }, this);

                return p;
            };
            //---------------------------------
            // 可能用不到
            this.$call_hook = function (hookName) {
                let options = this.$user_options;

                if (typeof (options[hookName]) == 'function') {
                    options[hookName].call(this.$dom, this.$error, this.$dom);
                }
            };

        }).call(SwitchTemplate.prototype);
        //======================================================================
        // 任務: 處理 template, data
        // 是否要負責 render ??
        function SwitchJob(switchTemplate, templateName, data, fix_options) {

            this.$dom;

            this.$deferred;
            //-----------------------
            this.$switchTemplate;
            this.$status = 0;
            //-----------------------
            this.$templateName;
            this.$template;
            this.$data;
            //-----------------------
            this.$error;

            this.$fix_options = {
                dataloading: null,
                dataloaded: null,
                loaded: null,
                beforemount: null,
                mounted: null,
                beforeunmount: null,
                unmounted: null,
                beforeunmount: null,
                updated: null
            };

            this.$user_options = {};

            // 開關
            this.$stop = false;
            //-----------------------
            this.__construct(switchTemplate, templateName, data, fix_options);
        }

        (function () {
            this.__construct = function (switchTemplate, templateName, data, fix_options) {
                debugger;

                this.$switchTemplate = switchTemplate;

                this.$dom = this.$parent.$dom;
                this.$data = data;
                this.$templateName = templateName;

                this.$deferred = _.deferred();


                _.extend(this.$user_options, this.$switchTemplate.$user_options);


                for (let k in this.$fix_options) {
                    if (fix_options[k] != null) {
                        this.$fix_options[k] = fix_options[k];
                    }
                }

            };
            //---------------------------------
            this.stop = function () {
                this.$stop = true;
                this.$deferred.reject();
            };
            //---------------------------------
            // 對外 API
            this.update = function () {
                this._call_hook('loading');

                // wait data
                let p1 = this._aboutData();

                // wait template
                let p2 = _.asyncTemplate(this.$templateName).getClone();

                p2.thenWith(function (err, tempClone) {
                    debugger;
                    this.$template = tempClone;
                    tempClone.setContainer(this.$dom);
                    tempClone.setUserOptions(this.$user_options);
                    tempClone.setFixOptions(this.$fix_options);

                }, this);

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
                debugger;

                this._call_hook('loaded');

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
                    this.$data = data[0];
                    //-----------------------
                    let p = Promise.resolve();

                    if (this.$isTemplateChange()) {
                        // 更新 template, data
                        this.$switchTemplate.unmount();

                        p = this.$template.mount(this.$data);

                    } else if (this.$isDataChange_1()) {
                        // 更新 data
                        this.$template.updateData(dom, this.$data);
                    } else {
                        // template, data 都沒變
                        // this._call_hook('updated');
                    }
                    //-----------------------
                    p.thenWith(function () {
                        this.$deferred.resolve({
                            template: (this.$template),
                            data: (this.$data)
                        });
                    }, null, this);
                }
            };
            //---------------------------------
            // 資料的取得方式
            this._aboutData = function () {
                debugger;

                let dataChange = this.$isDataChange();

                if (dataChange) {
                    this._call_hook('dataloading');
                }
                //-----------------------
                let p = Promise.resolve(this.$data);
                //-----------------------
                // 取得資料
                p.alwaysWith(function (err, data) {
                    debugger;
                    if (!err) {
                        this.$data = data;
                    }
                    // 執行 hook
                    if (dataChange) {
                        this._call_hook('dataloaded');
                    }

                }, this);

                return p;
            };
            //---------------------------------
            // 輸入的資料是否與之前有差異
            this.$isDataChange = function () {

                if (this.$data instanceof Promise) {
                    return true;
                }

                let prev_data = this.$parent.$data;
                return !_.isEqual(this.$data, prev_data);
            };

            //---------------------------------
            this.$isDataChange_1 = function () {
                let prev_data = this.$parent.$data;
                return !_.isEqual(this.$data, prev_data);
            }
            //---------------------------------
            this.$isTemplateChange = function () {
                let prev_templateName = (this.$parent.$template == null ? '' : this.$parent.$template.getName());
                let new_templateName = this.$template.getName();

                return (new_templateName.localeCompare(prev_templateName) != 0);
            };

            //---------------------------------
            this._call_hook = function (hookName) {
                let fn = this.$user_options[hookName];

                if (typeof (fn) == 'function') {
                    fn.call(this.$dom, this.$error, this.$dom);
                }

                fn = this.$fix_options[hookName];

                if (this.$template != null && typeof (fn) == 'function') {
                    fn.call(this.$dom, this.$error, this.$dom);
                }
            };

        }).call(SwitchJob.prototype);
    }

})(this || {});
