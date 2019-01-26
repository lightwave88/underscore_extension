!(function(global) {
    (function() {
        let $ = global.$ || global.jQuery || null;
        if ($) {
            factory($);
        }
    })();
    return;
    //--------------------------------------
    function factory($) {

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
            // mounted:null
            // unmounted: null
            // update: callback
            // updated: callback
            this.$options = {
                dataloading: null,
                dataloaded: null,
                templateloading: null,
                templateloaded: null,
                allloaded: null,
                mounted: null,
                unmounted: null,
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
            // callbacks: 對模板的一些事後修正
            this.template = function(tmplName, callbacks) {
                debugger;
                callbacks = callbacks || {};

                delete callbacks['dataloading'];
                delete callbacks['dataloaded'];
                delete callbacks['unmounted'];

                return this.$checkUpdate(tmplName, this.$data, callbacks);
            };
            //---------------------------------
            // API
            // 更新 data
            // data 可以是數據， promise, function
            this.updateData = function(data, callbacks) {
                debugger;

                callbacks = callbacks || {};

                if (this.$template == null) {
                    throw new Error("u must assign template first");
                }
                let tmplName = this.$template.getName();

                return this.$checkUpdate(tmplName, data);
            };
            //---------------------------------
            // API
            this.unmount = function(callbacks) {

                callbacks = callbacks || {};

                if (callbacks['unmounted'] != null) {
                    let unmounted = callbacks['unmounted'];
                    callbacks = {
                        unmounted: unmounted
                    };
                }


                if (this.$template) {
                    let template = this.$template;
                    this.$template = undefined;
                    template.unmount(this.$dom);

                    unmounted.call(this.$dom, this.$error, this.$dom)
                }
            };
            //---------------------------------
            // 加入監聽，及時更新內容
            this.watch = function(callbacks) {
                // 對 _.observe() 暴露 this.data

            };
            //---------------------------------
            // 關於設定
            this.setting = function(key, value) {
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
            this.$checkUpdate = function(tmplName, data, callbacks) {
                debugger;


                if (!tmplName) {
                    throw new TypeError('tmplName typeError');
                }

                this.$reset_1();

                // 創建一個 job

                this.$job = new SwitchJob(this, tmplName, data, callbacks);
                let p = this.$job.update();
                //-----------------------
                p.alwaysWith(function(err, data) {
                    debugger;

                    this.$error = err;
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
            this.$reset_1 = function() {
                this.$error = null;
            };
            //---------------------------------
            this.$call_hook = function(hookName) {
                let options = this.$options;

                if (typeof(options[hookName]) == 'function') {
                    options[hookName].call(this.$dom, this.$error, this.$dom);
                }
            };

        }).call(SwitchTemplate.prototype);
        //======================================================================
        // 任務: 處理 template, data
        // 是否要負責 render ??
        function SwitchJob(parent, templateName, data, callbacks) {
            this.$dom;

            this.$deferred;
            //-----------------------
            this.$dataChange;
            this.$templateChange;
            //-----------------------
            this.$parent;
            this.$status = 0;
            //-----------------------
            this.$templateName;
            this.$template;
            this.$data;
            //-----------------------
            this.$error;

            // 若要呼叫 template
            // 但 template 還未取得，先把命令記錄下來
            // 等 template.loaded 再執行
            this.$jobList = [];

            // 一些修正的 callback
            this.$callbacks;

            // 開關
            this.$stop = false;
            //-----------------------
            this.__construct(parent, templateName, data, callbacks);
        }

        (function() {
            this.__construct = function(parent, templateName, data, callbacks) {
                debugger;

                this.$parent = parent;

                this.$dom = this.$parent.$dom;
                this.$data = data;
                this.$templateName = templateName;

                this.$deferred = _.deferred();

                this.$callbacks = callbacks || {};
            };
            //---------------------------------
            this.stop = function() {
                this.$stop = true;
                this.$deferred.reject();
            };
            //---------------------------------
            // 對外 API
            this.update = function() {
                this._call_hook('loading');

                // wait data
                let p1 = this._aboutData();

                // wait template
                let p2 = _.asyncTemplate(this.$templateName).getClone();

                p2.alwaysWith(function(err, data) {

                    while (this.$jobList.length) {
                        let job = this.$jobList.shift();
                        job();
                    }

                }, this);

                //-----------------------
                let p3 = Promise.all([p1, p2]);

                p3.alwaysWith(function(err, data) {
                    this._allLoaded(err, data);
                }, this);

                return this.$deferred.promise();
            };
            //---------------------------------
            // template, data 都 load 完
            this._allLoaded = function(err, data) {
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
                            this.$parent.$template.unmount();
                            this._call_hook('unmounted');
                        }

                        p = this.$template.mount(this.$data);

                    } else if (this.$dataChange) {
                        // 更新 data
                        this.$template.updateData(dom, this.$data);
                    }
                    //-----------------------
                    p = p.thenWith(function() {

                        this._call_hook('updated');

                        this.$deferred.resolve({
                            template: (this.$template),
                            data: (this.$data)
                        });
                    }, null, this);
                }
            };
            //---------------------------------
            // 資料的取得方式
            this._aboutData = function() {
                debugger;

                if (this.$dataChange) {
                    this._call_hook('dataloading');
                }
                //-----------------------
                let p = Promise.resolve(this.$data);
                //-----------------------
                // 取得資料
                p.alwaysWith(function(err, data) {
                    debugger;
                    if (!err) {
                        this.$data = data;
                    }
                    // 執行 hook
                    if (this.$dataChange) {
                        this._call_hook('dataloaded');
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
            this._call_hook = function(hookName) {
                if (this.$template == null) {
                    // 若 template 尚未取得
                    let job = (function(hookName) {
                        this.$template.call_hook(hookName);
                    }).bind(this, hookName)

                    this.$jobList.push(job);
                }
            };

        }).call(SwitchJob.prototype);
    }

})(this || {});
