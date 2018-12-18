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
        $.template = switchTemplateCommand;

        function switchTemplateCommand(dom) {
            if ($.data(dom, '__us_switchTemplate') == null) {
                let switchTemplate = new SwitchTemplate(dom);
                $.data(dom, '__us_switchTemplate', switchTemplate);
            }
            return $.data(dom, '__us_switchTemplate');
        }
        //--------------------------------------

        function SwitchTemplate(dom) {
            this.$template;
            this.$data;
            this.$dom;
            this.$job;
            //-----------------------
            this.__construct(dom);
        }


        (function () {
            this.__construct = function (dom) {
                this.$dom = dom;
            };
            //---------------------------------
            // 更新 template, data
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
            this.data = function (data) {
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
            // 若正在執行任務中
            // 終止既有的任務
            this.stop = function () {

            };
            //---------------------------------
            this.$checkUpdate = function (tmplName, data) {
                data = data || {};

                if (!tmplName) {
                    throw new TypeError('tmplName typeError');
                }

                if (!this.$check_1(tmplName, data)) {
                    return Promise.resolve();
                }

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
            // 最主要的目標
            this.$render = function (changeTemplate) {

                if (!changeTemplate) {
                    // 既有的 template 的數據更新
                    this.$template.updateData(this.$dom, this.$data);
                } else {
                    // template 需要更新
                    this.$template.mount(this.$dom, this.$data)
                }

            };
            //---------------------------------
            this.$startJob = function (tmplName, data) {
                // 創建一個 job
                this.$job = new SwitchJob(this, tmplName, data, changeTemplate);
                return this.$job.update();
            };

        }).call(SwitchTemplate.prototype);
        //--------------------------------------
        // 任務
        function SwitchJob(parent, template, data) {
            this.$parent;
            this.$deferred;
            this.$changeTemplate;
            this.$loaded = false;
            this.$template;

            //-----------------------
            this.__construct(parent, template, data, changeTemplate);
        }

        (function () {
            this.__construct = function (parent, template, data) {
                this.$parent = parent;
                this.$deferred = _.deferred();

                let prev_templName = this.$parent.$template.getName();
                this.$changeTemplate = (prev_templName.localeCompare(tmplName) == 0 ? false : true);

                this.$template = _.asyncTemplate(template);
            };
            //---------------------------------
            this.stop = function () {

            };
            //---------------------------------
            this.update = function () {
                let $this = this;

                let p1 = this._getData();

                let p2 = this._getTemplate();

                Promise.all([p1, p2]).then(function () {
                    $this.$loaded = true;

                    $this.upDateParent();

                    $this.$deferred.resolve();
                }, function (err) {
                    $this.$loaded = true;
                    $this.$deferred.reject(err);
                });

                return this.$deferred.promise();
            };
            //---------------------------------
            // 更新 parent 數據
            this.upDateParent = function () {

            };
            //---------------------------------
            this.loaded = function () {
                return this.$loaded;
            };
            //---------------------------------
            this._getData = function () {

            };
            //---------------------------------
            this._getTemplate = function () {
            };

        }).call(SwitchJob.prototype);




    }

})(this || {});
