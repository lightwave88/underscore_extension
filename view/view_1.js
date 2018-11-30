!(function (global) {
    ////////////////////////////////////////////////////////////////////////////
    //
    // 主要功能把一個 dom 區塊
    // 放在一個封閉區塊裡操作
    //
    // 最主要處理事件的綁定
    // 與提供事件函數一個密閉操作空間
    //
    ////////////////////////////////////////////////////////////////////////////

    (function () {
        let _;

        if (typeof window !== "undefined" && typeof document !== "undefined") {
            if (typeof window._ === undefined) {
                throw new TypeError("need import lodash or underscode");
            }

            let _$ = global.$ || global.jQuery || null;
            // web
            _ = window._;
            // 建構
            factory(_, _$);
        } else if (typeof module !== 'undefined' && module.exports) {
            // node.js
            // 指定 loadash|underscode 的 path
            module.exports = function (_path) {
                _ = require(_path);
            };
            // 建構
            unsupportFactory(_);
        } else if (typeof (window) === "undefined" && self !== "undefined" && typeof (importScripts) === 'function') {
            debugger;
            // webWorker 環境

            // 建構
            unsupportFactory(_);
        } else {
            throw new TypeError("not support your system");
        }

    }());

    //==========================================================
    function unsupportFactory(_) {
        _.mixin({
            view: function () {
                throw new Error("no support _.view()");
            }
        });
    }
    //==========================================================
    function factory(_, $) {
        _.mixin({
            view: ViewCommand
        });
    }
    //==========================================================

    let classSettingMap = {
        update: "$$_updateCallback",
        created: "$$_createdCallback",
        mounted: "$$_mountedCallback",
        destroyed: "$$_destroyedCallback",
        beforeDestroy: "$$_beforeDestroyCallback",
        beforeUnmount: "$$_beforeUnmountCallback",
        unmounted: "$$_unmountedCallback",
        events: "$$events",
        methods: "$$methods",
        el: "$el"
    };

    let objSettingMap = {
        id: "$id",
        core: "$core"
    };
    //----------------------------------------------------------

    function ViewCommand(setting) {
        debugger;

        if (!$) {
            throw new Error("need jQuery");
        }

        if (_.isPlainObject(setting)) {
            // 產生一個 View
            let ViewClass = ViewCommand.extend(setting, View);

            return new ViewClass();
        } else if (typeof setting === "string" || (setting instanceof Element)) {
            // 調出 view
            return View.viewList.get(setting)
        }
    }

    ViewCommand.extend = function (setting, parent) {
        debugger;

        parent = (parent == null) ? View : parent;

        let classSetting = {};
        let objSetting = {};

        for (let k in setting) {
            let v = setting[k];
            if (k in classSettingMap) {
                // class 指定 setting
                let _k = classSettingMap[k];
                classSetting[_k] = v;
            } else if (k in objSettingMap) {
                // obj 指定 setting
                let _k = objSettingMap[k];
                objSetting[_k] = v;
            } else if (typeof v === "function") {
                // class setting
                classSetting[k] = v;
            } else {
                // obj setting
                objSetting[k] = v;
            }
        }
        //----------------------------
        function child() {
            parent.call(this, objSetting);
        }
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;

        _.extendOwn(child.prototype, classSetting);

        // 讓view有事件
        _.event(child.prototype, true, "$");

        return child;
    };
    //----------------------------------------------------------
    function View(objSetting) {
        'use strict';

        this.$fn = View;
        this.$id;

        // 可以把 vue 包進去
        this.$core;
        //----------------------------
        this.$$_created.apply(this, arguments);
    }
    (function (_class) {
        _class.uid = 0;

        // 把生成的 view 都放這
        // 方便使用者調用
        _class.viewList = new Map();

        // 分離事件與dom選擇
        // 格式: [event_1, event_2(selector)], [event_1, event_2]
        _class.eventSplite_1 = /^([^()]+|)\(([^)]*)\)/;

        _class.eventSplite_2 = /\s*[,]\s*/;
        _class.eventName = ".usEvent_";
    }(View));


    (function () {
        this.$el;

        // hook(created)
        this.$$_createdCallback = function () { };

        // hook(mounted)
        this.$$_mountedCallback = function () { };

        // hook(update)
        this.$$_updateCallback = function () { };

        // hook(beforeDestroy)
        this.$$_beforeDestroyCallback = function () { };

        // hook(destroyed)
        this.$$_destroyedCallback = function () { };

        // hook(beforeUnmount)
        this.$$_beforeUnmountCallback = function () { };

        // hook(unmounted)
        this.$$_unmountedCallback = function () { };

        // 註冊事件的指令
        this.$$events = {};

        // 事件方法
        this.$$methods = {};
        //----------------------------------------------------------
        this.$$_created = function (objSetting) {
            debugger;

            objSetting = objSetting || {};

            _.extendOwn(this, objSetting);
            //----------------------------
            // 檢查 $id
            if (this["$id"] != null) {
                if (this.$fn.viewList.has(this["$id"])) {
                    throw new TypeError("view key(" + key + ") exists");
                }
            } else {
                this.$id = "view_" + this.$fn.uid++;
            }
            //----------------------------
            // 是否有設置 core
            if (_.isFunction(this.$core)) {
                this.$core = this.$core(this);
            }
            //----------------------------
            // 註冊
            this.$fn.viewList.set(this.$id, this)

            // hook
            this.$$_createdCallback.call(this);

            if (this.$el) {
                this.$mount(this.$el);
            }
        };
        //----------------------------------------------------------
        // 對外 API
        this.$mount = function (el) {
            debugger;

            this.$el = el;
            if (_.isString(this.$el)) {
                let dom = document.querySelector(this.$el);
                this.$el = dom;
            }

            this.$$_mountedCallback.call(this);

            if (this.$fn.viewList.has(this.$el)) {
                throw new Error("view has connect dom");
            }

            this.$fn.viewList.set(this.$el, this);
            //----------------------------
            this.$$_bindEvent();
        };
        //----------------------------------------------------------
        // API
        // view 與 dom 脫鉤
        this.$unmount = function () {
            this.$$_beforeUnmountCallback.call(this);

            this.$$_remov();
            this.$el = undefined;

            this.$$_unmountedCallback.call(this);
        };
        //----------------------------------------------------------
        // API
        this.$remove = function () {
            // hook
            this.$$_beforeDestroyCallback.call(this);

            this.$$_remov();
            $(this.$el).remove();
            this.$el = undefined;

            // hook
            this.$$_destroyedCallback.call(this);
        };
        //----------------------------------------------------------
        this.$$_remov = function () {
            this.$removeAllEvent();

            this.fn.viewList.delete(this.$id);

            if (_.isElement(this.$el)) {
                this.fn.viewList.delete(this.$el);
            }
        };
        //----------------------------------------------------------
        // 若需要更新 view 內部的任何事
        this.$update = function () {
            this.this.$$_updateCallback.apply(this, arguments);
        };
        //----------------------------------------------------------
        this.$$_bindEvent = function () {
            this.$removeAllEvent();
            this.$reAddAllEvent();
        };
        //----------------------------------------------------------
        // API
        // 重新綁定 events 裡的設定
        this.$reAddAllEvent = function () {
            debugger;

            for (let k in this.$$events) {
                let callback = this.$$events[k];
                this.$addEvent(k, callback);
            }
            return this;
        };
        //----------------------------------------------------------
        // API
        // 清除所有 events 的事件綁定
        this.$removeAllEvent = function () {
            this.$removeEvent();
        };
        //----------------------------------------------------------
        // API
        this.$addEvent = function (key, callback) {
            let res = this.$fn.eventSplite_1.exec(key);

            if (!res) {
                return;
            }
            let eventList = res[1].split(this.$fn.eventSplite_2);
            let selector = res[2] || null;

            //------------------
            if (_.isString(callback)) {
                if (this.$$methods[callback] == null) {
                    throw new Error("no (" + callback + " in methods");
                } else {
                    callback = this.$$methods[callback];
                }
            }
            //------------------
            let _callback = (function () {
                debugger;
                let res = callback.apply(this, arguments);
                if (res !== false && this.$core && _.isFunction(this.$core.$watchCollection)) {
                    // is angularJs_1
                    this.$core.$apply(function () { });
                }
            }).bind(this);

            callback.bind(this);
            //-----------------------
            let $el = $(this.$el);

            eventList.forEach(function (event) {
                event = event.replace(/(^\s*|\s*$)/g, '');
                event = event + this.$fn.eventName + this.id;
                $el.on(event, selector, _callback);
            }, this);

            return this;
        };
        //----------------------------------------------------------
        // API
        this.$removeEvent = function (key, selector) {
            key = key || "";
            key = key + this.$fn.eventName + this.id;
            $(this.$el).off(key, selector);
        };


    }).call(View.prototype);

}(this || {}));
