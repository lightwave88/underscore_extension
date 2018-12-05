!(function (global) {

    (function () {
        let $_;

        if (typeof window !== "undefined" && typeof document !== "undefined") {
            if (typeof window._ === undefined) {
                throw new TypeError("need import lodash or underscode");
            }
            $_ = window._;
            // 建構
            factory($_);
        } else if (typeof module !== 'undefined' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (_) {
                $_ = _;
                // 建構
                factory($_);
            };
        } else if (typeof (window) === "undefined" && self !== "undefined" && typeof (importScripts) === 'function') {
            debugger;
            // webWorker 環境
            // console.log("worker")

            if (typeof (global._) === "undefined") {
                // worker 本體初始建構
                return;
            }
            $_ = global._;

            // 建構
            factory($_);
        } else {
            throw new TypeError("not support your system");
        }

    }());

    //==========================================================================
    function factory(_) {
        ////////////////////////////////////////////////////////////////////////
        //
        // 讓物件具有事件能力
        //
        // 把 dom 納入(將 dom 與 物件)可以做事件連結
        //
        ////////////////////////////////////////////////////////////////////////
        const Tool = {};

        // 取得 extention 全域變數
        let $extension = _.$$extension;

        // 每個有事件功能的物件都應該有個 event_id
        // 加快 obj_1 === obj_2 的步驟
        let event_id = 1;

        let supportProto = (function () {
            let res = false;
            try {
                let test = {};
                test.__proto__ = {};
                res = true;
                test = undefined;
            } catch (e) {
            }
            return res;
        })();

        // 事件的藍圖
        const Event = {};
        //----------------------------------------------------------------------
        _.mixin({
            // API
            // _.event(物件) 讓物件具有 event 的能力
            // noProto: 不再原型鏈中插入一個有 event 功能的物件
            // 不然就直接覆蓋在物件身上
            // prefix: 避免撞名，在命令前加一個符號
            // obj 不能是 dom
            event: EventSetting
        });

        function EventSetting(obj, noProto, prefix) {
            debugger;
            let args = arguments;

            if (args.length == 0) {
                // 返回设定函式
                return EventSetting;
            }
            //----------------------------
            if ("__$$us_eventData" in obj) {
                throw new TypeError("has been _.events()");
            }

            noProto = (noProto == null) ? false : true;
            prefix = prefix ? prefix : false;
            //------------------
            // 是否要将 API 置放在原型炼中
            let assignObj = obj;
            if (!noProto && supportProto) {
                let proto = Object.getPrototypeOf(obj);
                // 創建一個繼承 proto 的物件
                assignObj = Object.create(proto);
                obj.__proto__ = assignObj;
            }
            //------------------
            // 檢查是否有 key 撞到
            for (let k in Event) {
                if (Event.hasOwnProperty(k)) {
                    let fn = Event[k];
                    let key = (prefix) ? (prefix + k) : k;

                    if (key in obj) {
                        throw new TypeError("key(" + key + ") exists can't overide");
                    }
                    assignObj[key] = fn;
                }
            }
            //------------------
            // 把所有資料都統一放在(__$$us_eventData)屬性
            Tool.checkHasInitialized(assignObj);

            return obj;
        }
        //----------------------------------------------------------------------
        (function (fn) {
            // Regular expression used to split event strings.
            fn.eventSplitter = /\s+/;

            fn.on = function (obj, name, callback, context) {
            };

            fn.once = function (obj, name, callback, context) {

            };

            fn.listenTo = function (obj, eventMaker, name, callback, context) {

            };

            fn.listenToOnce = function (obj, eventMaker, name, callback, context) {

            };

            fn.hasOn = function (obj, name, callback) {

            };

            fn.hasListenTo = function (obj, eventMaker, name, callback) {
            };

            fn.off = function (obj, name, callback) {

            };

            fn.clearListener = function (obj, eventMaker, name, callback) {

            };

            fn.stopListening = function (obj, eventMaker, name, callback) {
            };

            fn.trigger = function (obj, eventName) {
                let args = arguments;
                args = args.splice(1);

                $_trigger.call(obj, eventName, args);

                return fn;
            };

            fn.bind = fn.on;

            fn.unbind = fn.off;

            fn.emit = fn.trigger;

            fn.hasBind = fn.hasOn;
        })(EventSetting);


        //----------------------------------------------------------------------
        (function (_self) {
            _self.on = function (name, callback, context) {
                'use strict';
                return $_on.apply(this, [name, callback, context]);
            };
            //------------------------------------------------------------------
            _self.once = function (name, callback, context) {
                'use strict';
                return $_on.apply(this, [name, callback, context, true]);
            };
            //------------------------------------------------------------------
            _self.listenTo = function (obj, name, callback, context) {
                'use strict';
                return $_listenTo.apply(this, [obj, name, callback, context]);
            };
            //------------------------------------------------------------------
            _self.listenToOnce = function (obj, name, callback, context) {
                'use strict';
                return $_listenTo.apply(this, [obj, name, callback, context, true]);
            };
            //------------------------------------------------------------------
            // callback 是否被設定過
            _self.hasOn = function (name, callback) {
                'use strict';

                if (!name) {
                    throw new TypeError("arg[0] must be evenName");
                }

                if (typeof (callback) !== "function") {
                    throw new TypeError("arg[1] must be function");
                }

                let self_eventData = this["__$$us_eventData"];
                let events = self_eventData.events;
                let self_id = self_eventData.id;

                if (events[name] == null) {
                    return false;
                }

                if (callback["__$$us_eventGuid"] == null) {
                    // 若 callback 沒設定過標記
                    return false;
                }

                let eventList = events[name];

                return eventList.some(function (handle) {
                    // callback 是否匹配
                    let judge_1 = (callback["__$$us_eventGuid"] === handle.callback["__$$us_eventGuid"]);

                    // 監聽者是否匹配
                    let judge_2 = (handle.listener["__$$us_eventData"]["id"] === self_id);

                    return (judge_1 && judge_2);
                });
            };
            //------------------------------------------------------------------
            // 是否監聽過 obj
            // obj 為必須
            _self.hasListenTo = function (obj, name, callback) {
                'use strict';
                debugger;
                let res = false;

                if (obj == null || typeof obj !== "object") {
                    throw new TypeError("arg[0] must be object");
                }

                if (obj["__$$us_eventData"] == null) {
                    return res;
                }

                let self_eventData = this["__$$us_eventData"];
                let self_id = self_eventData.id;

                let obj_eventData = obj["__$$us_eventData"];
                let obj_id = obj_eventData.id;
                let events = obj_eventData.events;

                //----------------------------
                if (name == null && callback == null) {
                    // 參數只有 obj
                    // 只詢問是否有監聽過 obj
                    res = (function () {

                        if (self_eventData["listeningTo"] == null ||
                            self_eventData["listeningTo"][obj_id] == null) {
                            return false;
                        }
                        return true;
                    }).call(this);

                } else if (callback == null) {
                    // 參數有 obj, eventName
                    // 詢問是否監聽 obj 的某事件
                    res = (function () {
                        if (events[name] == null) {
                            return res;
                        }

                        let eventList = events[name];

                        return eventList.some(function (handle) {
                            let judge_1 = (handle.listener["__$$us_eventData"]["id"] === self_id);

                            return judge_1;
                        });

                    }).call(this);

                } else {
                    // 參數有 obj, eventName, callback
                    res = (function () {

                        if (typeof callback !== "function") {
                            throw new TypeError("arg[2] must be function");
                        }

                        if (events[name] == null) {
                            return false;
                        }

                        if (callback["__$$us_eventGuid"] == null) {
                            // 若 callback 沒設定過標記
                            return false;
                        }

                        let eventList = events[name];

                        return eventList.some(function (handle) {
                            let judge_1 = (callback["__$$us_eventGuid"] === handle.callback["__$$us_eventGuid"]);

                            let judge_2 = (handle.listener["__$$us_eventData"]["id"] === self_id);

                            return (judge_1 && judge_2);
                        });
                    }).call(this);

                }
                //----------------------------
                return res;
            };
            //------------------------------------------------------------------
            // 只刪除自己註冊的事件
            // 別物件傾聽自己的不會被刪除
            // return: (boolean) => 是否有找到該 callback 並移除
            _self.off = function (name, callback) {
                'use strict';

                debugger;

                let res = false;

                if (callback != null && typeof callback["__$$us_eventGuid"] === "undefined") {
                    // callback 未註冊過
                    return res;
                }
                //----------------------------
                let self_eventData = this["__$$us_eventData"];
                let self_id = self_eventData.id;
                let events = self_eventData.events;

                let names = (name ? name.split(EventSetting.eventSplitter) : Object.keys(events));

                for (let j = 0, name; name = names[j]; j++) {

                    let eventList = events[name];

                    if (!Array.isArray(eventList)) {
                        continue;
                    }

                    let remaining = [];

                    for (let i = 0; i < eventList.length; i++) {
                        let handle = eventList[i];

                        let isCallback = (function () {
                            if (callback == null) {
                                // 若沒有指定要移除的 fn
                                // 那就移除所有
                                return true;
                            }
                            return (handle.callback["__$$us_eventGuid"] == callback["__$$us_eventGuid"]);
                        }());

                        let listener_id = handle.listener["__$$us_eventData"]["id"];
                        if (isCallback && listener_id == self_id) {
                        } else {
                            remaining.push(handle);
                        }
                    }
                    //----------------------------
                    // debugger;
                    if (remaining.length) {
                        events[name] = remaining;
                    } else {
                        delete events[name];
                    }
                }
                //----------------------------
                return this;
            };
            //------------------------------------------------------------------
            // 清除監聽者所有的一切
            // 不會清除自己監聽自己
            // listener => 監聽者
            // 參數可以皆無
            _self.clearListener = function (obj, name, callback) {
                'use strict';

                debugger;

                // _checkHasInitialized(obj);

                if (callback != null && typeof callback["__$$us_eventGuid"] === "undefined") {
                    // callback 未註冊過
                    return this;
                }
                //----------------------------
                let self_eventData = this["__$$us_eventData"];
                let events = self_eventData.events;

                let self_id = self_eventData.id;

                let listener_eventData;
                let listener_id;

                if (obj != null && typeof (obj) === "object" &&
                    typeof (obj["__$$us_eventData"]) != "undefined") {
                    listener_eventData = obj["__$$us_eventData"];
                    listener_id = listener_eventData["id"]
                }
                //----------------------------
                let names = (name ? name.split(EventSetting.eventSplitter) : _.keys(events));
                // 回圈所有種類的事件
                for (let j = 0, name; name = names[j]; j++) {

                    let eventList = events[name];

                    if (!Array.isArray(eventList)) {
                        continue;
                    }

                    let remaining = [];

                    for (let i = 0; i < eventList.length; i++) {
                        let handle = eventList[i];

                        // 是否是要找的 callback
                        let isCallback = (function () {
                            if (callback == null) {
                                return true;
                            }
                            return (handle.callback["__$$us_eventGuid"] !== callback["__$$us_eventGuid"]);
                        }());

                        let listener_match;

                        if (obj != null) {
                            // 移除指定監聽者

                            if (listener_id != null && handle.listener["__$$us_eventData"]["id"] == listener_id) {
                                listener_match = true;
                            } else {
                                listener_match = false;
                            }
                        } else {
                            // 沒有指定監聽者
                            // 移除非自己的所有監聽者

                            if (handle.listener["__$$us_eventData"]["id"] != self_id) {
                                listener_match = true;
                            } else {
                                listener_match = false;
                            }
                        }
                        //----------------------------
                        if (isCallback && listener_match) {
                            let listenInfo = handle.listenInfo;
                            // handle match
                            if (--listenInfo.count == 0) {
                                // 刪除兩物件間的橋樑
                                Tool.clearBridge(listenInfo);
                            }
                        } else {
                            remaining.push(handle);
                        }
                    }
                    //----------------------------
                    // debugger;
                    if (remaining.length) {
                        self_eventData.events[name] = remaining;
                    } else {
                        delete self_eventData.events[name];
                    }
                }
                //----------------------------
                return this;
            };
            //------------------------------------------------------------------
            // 不再監聽別人
            // 參數可以皆無
            _self.stopListening = function (obj, name, callback) {
                'use strict';

                debugger;

                if (callback != null && typeof callback["__$$us_eventGuid"] === "undefined") {
                    // callback 未註冊過
                    return this;
                }

                let self_eventData = this["__$$us_eventData"];
                let self_id = self_eventData.id;

                if (obj === undefined) {
                    // 移除與所有發射者間的關係
                    // listenInfo 唯一的用處
                    let listeningToList;
                    if (listeningToList = self_eventData["listeningTo"]) {
                        for (let key in listeningToList) {
                            listenInfo = listeningToList[key];
                            let target = listenInfo.listeningTo;
                            this.stopListening(target);
                        }
                    }
                    return this;
                }
                //----------------------------

                Tool.checkHasInitialized(obj);

                let target_eventData = obj["__$$us_eventData"];
                let target_id = target_eventData.id;
                let events = target_eventData.events;

                let names = (name ? name.split(EventSetting.eventSplitter) : Object.keys(events));
                //----------------------------
                for (let j = 0, name; name = names[j]; j++) {

                    let eventList = events[name];

                    if (!Array.isArray(eventList)) {
                        continue;
                    }

                    let remaining = [];

                    // debugger;
                    for (let i = 0; i < eventList.length; i++) {
                        let handle = eventList[i];
                        //----------------------------
                        // 是否是正確的 callback
                        let isCallback = (function () {
                            if (callback == null) {
                                return true;
                            }
                            return (handle.callback["__$$us_eventGuid"] === callback["__$$us_eventGuid"]);
                        }());
                        //----------------------------
                        // 正確的傾聽者
                        let isListener = (function () {
                            let id = handle.listener["__$$us_eventData"]["id"];
                            return (id == self_id);
                        }());
                        //----------------------------
                        if (isCallback && isListener) {

                            let listenInfo = handle.listenInfo;
                            // handle match
                            if (--listenInfo.count == 0) {
                                // 刪除兩物件間的橋樑
                                Tool.clearBridge(listenInfo);
                            }
                        } else {
                            // handle 沒有 match
                            remaining.push(handle);
                        }
                    }
                    //----------------------------
                    // debugger;
                    if (remaining.length) {
                        events[name] = remaining;
                    } else {
                        delete events[name];
                    }
                }

                return this;
            };
            //------------------------------------------------------------------
            // 要排除 trigger 的物件
            // name, option. arguments
            _self.trigger = function (eventName) {
                'use strict';
                // debugger;

                let args = arguments;
                args = args.splice(1);

                $_trigger.call(this, eventName, args);

                return this;
            };
            //------------------------------------------------------------------
            _self.bind = _self.on;

            _self.unbind = _self.off;

            _self.emit = _self.trigger;

            _self.hasBind = _self.hasOn;
        })(Event);
        //======================================================================
        // 設置本身的監聽
        function $_on(name, callback, context, once) {
            debugger;
            let self = this;

            if (typeof (this["__$$us_eventData"]) === "undefined") {
                // 若未經過 _.event() 初始化
                throw new TypeError("obj must be _.event(obj)");
            }
            let eventData = this["__$$us_eventData"];

            let events = eventData.events;
            //----------------------------
            // 為 callback 放個 id
            if (typeof callback["__$$us_eventGuid"] !== 'number') {
                _.defineProperty(callback, "__$$us_eventGuid", $extension.callback_guid++, false);
            }

            //----------------------------
            let names = name.split(EventSetting.eventSplitter);

            for (let i = 0; i < names.length; i++) {
                debugger;
                let name = names[i];

                if (events[name] == null) {
                    events[name] = [];
                    if (Tool.isDom(this)) {
                        this.addEventListener(name, Tool.event_dispatcher);
                    }
                }
                let eventList = events[name];

                let _callback = callback;
                if (once) {
                    _callback = Tool.getOnceEventCallback_1(name, callback, this);
                }

                eventList.push(new EventHandle({
                    callback: _callback,
                    listener: this,
                    listeningTo: this,
                    context: (context || this)
                }));
            }

            return this;
        }
        //----------------------------------------------------------------------
        // 設置跨物件間的監聽
        function $_listenTo(eventMaker, name, callback, context, once) {
            debugger;

            Tool.checkHasInitialized(eventMaker);

            let target_eventData = eventMaker["__$$us_eventData"];
            let self_eventData = this["__$$us_eventData"];

            // 連結兩者

            // 傾聽 eventMaker 的 map
            if (target_eventData["listeners"] == null) {
                target_eventData["listeners"] = {};
            }
            // 傾聽 map
            if (self_eventData["listeningTo"] == null) {
                self_eventData["listeningTo"] = {};
            }

            // 放置事件相關的資訊
            // 兩個物件彼此間的橋樑
            let listenInfo = (function () {
                debugger;
                if (target_eventData["listeners"][self_eventData.id] != null) {
                    return target_eventData["listeners"][self_eventData.id];
                }

                if (self_eventData["listeningTo"][target_eventData.id] != null) {
                    return self_eventData["listeningTo"][target_eventData.id];
                }
            }());

            if (listenInfo == null) {
                // 兩個物件彼此間的橋樑資訊
                listenInfo = {
                    listener: this,
                    listeningTo: eventMaker,
                    count: 1
                };
            } else {
                // 彼此之間有幾次連結關係
                listenInfo.count++;
            }

            self_eventData["listeningTo"][target_eventData.id] =
                target_eventData["listeners"][self_eventData.id] = listenInfo;
            //----------------------------
            debugger;
            let events = target_eventData.events;

            if (typeof callback.__$$us_eventGuid !== 'number') {
                _.defineProperty(callback, "__$$us_eventGuid", $extension.callback_guid++, false);
            }
            //----------------------------
            let names = name.split(EventSetting.eventSplitter);

            for (let i = 0, name; name = names[i]; i++) {
                debugger;

                if (events[name] == null) {
                    events[name] = [];

                    if(Tool.isDom(this)){
                        this.addEventListener(name, Tool.event_dispatcher);
                    }
                }
                let eventList = events[name];

                let _callback = callback;

                if (once) {
                    _callback = Tool.getOnceEventCallback_2(eventMaker, name, callback, this);
                }

                eventList.push(new EventHandle({
                    callback: _callback,
                    listener: this,
                    listeningTo: eventMaker,
                    context: (context || this),
                    listenInfo: listenInfo
                }));
            }

        }
        //----------------------------------------------------------------------
        function $_hasOn(name, callback) {

        }


        function $_hasListenTo(obj, name, callback) {

        }

        function $_off(name, callback) {

        }

        function $_clearListener(obj, name, callback) {

        }

        function $_stopListening(obj, name, callback) {

        }
        //----------------------------------------------------------------------

        function $_trigger(eventName, args) {

            if (Tool.isDom(this)) {
                // 透过 dom 的发射性统
                Tool.dom_triggerEvents(this, eventName, args);
                return;
            }
            //----------------------------

            let eventData = this["__$$us_eventData"];
            let events = eventData.events;
            //----------------------------
            let eventList;
            // eventName = all
            let all_eventList = (Array.isArray(events['all']) ? events['all'].slice() : undefined);

            if (!/^all$/i.test(eventName)) {
                eventList = (Array.isArray(events[eventName]) ? events[eventName].slice() : undefined);
                Too.triggerEvents(this, eventList, args, eventName, eventName);
            }
            //----------------------------
            if (all_eventList) {
                Tool.triggerEvents(this, all_eventList, args, 'all', eventName);
            }
        }

        //----------------------------------------------------------------------
        (function (_s) {
            // 檢查物件是否被 _.event() 初始化過
            _s.checkHasInitialized = function (obj) {
                if (obj == null || typeof (obj) != "object") {
                    throw new TypeError("_.event() must be obj");
                }

                if (obj["__$$us_eventData"] == null) {
                    // 埋入一个资料
                    _.defineProperty(assignObj, "__$$us_eventData", {
                        id: event_id++,
                        events: {},
                        listeners: null,
                        listeningTo: null
                    }, false);
                }
            };
            //------------------------------------------------------------------
            // obj 是否属于 dom
            _s.isDom = function (obj) {
                let res = false;

                try {
                    res = (obj instanceof EventTarget);
                } catch (error) {

                }
                return res;
            };
            //------------------------------------------------------------------
            // 在事件對列中，找目標
            _s.findHandle = function (triggerObj, name, targetHandle) {
                let events = triggerObj["__$$us_eventData"].events;

                let eventList = events[name];

                if (Array.isArray(eventList)) {
                    return eventList.some(function (handle) {
                        if (handle.id === targetHandle.id) {
                            return true;
                        }
                    });
                }
                return false;
            };
            //------------------------------------------------------------------
            // 清除兩者間的關係紀錄
            _s.clearBridge = function (listenInfo) {

                let listener = listenInfo.listener;
                let listeningTo = listenInfo.listeningTo;

                // 監聽者
                let listener_eventData = listener["__$$us_eventData"];
                let listener_id = listener_eventData.id;
                // 被監聽者
                let listeningTo_evenData = listeningTo["__$$us_eventData"];
                let listeningTo_id = listeningTo_evenData.id;


                if (listener_eventData["listeningTo"] != null) {
                    delete listener_eventData.listeningTo[listeningTo_id];
                }

                if (listeningTo_evenData["listeners"] != null) {
                    delete listeningTo_evenData.listeners[listener_id];
                }
            };
            //------------------------------------------------------------------
            // dom.trigger 专用
            _s.dom_triggerEvents = function (dom, name, args) {
                // 参数留意
                let event = new CustomEvent(name, {
                    detail: args,
                    bubbles: true,
                    cancelable: true
                });
                dom.dispatch(event);
            };
            //------------------------------------------------------------------
            // 發出訊息
            _s.triggerEvents = function (target, eventList, args, name, triggerEvent) {
                debugger;

                let handle;
                let handle_id;
                //----------------------------
                for (let i = 0; i < eventList.length; i++) {

                    // debugger;
                    handle = eventList[i];
                    handle_id = handle.id;

                    // 監聽者
                    let _listener = handle.listener;

                    // 確保事件尚存
                    let result = Tool.findHandle(target, name, handle);

                    if (!result) {
                        continue;
                    }
                    //----------------------------
                    let _arg = args.slice();
                    // 在 _arg 塞入 event

                    // 事件本體
                    let e = {
                        target: target,
                        type: name,
                        triggerType: triggerEvent
                    };

                    _arg.unshift(e);

                    let job = (function (args) {
                        handle.callback.apply(this, args);
                    }).bind(handle.context, _arg)
                    //----------------------------
                    job();
                }
            };

            //------------------------------------------------------------------
            // dom 用
            // 转发器
            _s.event_dispatcher = function (e) {
                let target = e.target;
                let eventName = e.type;

                $_trigger.apply(target, [eventName, e.detail])
            };
            //------------------------------------------------------------------

            _s.getOnceEventCallback_1 = function (eventName, callback, context) {
                function _callback() {
                    _.event.off(context, eventName, _callback);
                    callback.apply(this, arguments);
                }
                _.defineProperty(_callback, "__$$us_eventGuid", callback["__$$us_eventGuid"], false);

                return _callback;
            };
            //------------------------------------------------------------------
            _s.getOnceEventCallback_2 = function (eventMaker, eventName, callback, context) {
                function _callback() {
                    _.event.stopListening(context, eventMaker, eventName, _callback);
                    callback.apply(this, arguments);
                }
                _.defineProperty(_callback, "__$$us_eventGuid", callback["__$$us_eventGuid"], false);

                return _callback;
            };

        })(Tool);

        ////////////////////////////////////////////////////////////////////////////
        // 每一個單一事件的代表
        function EventHandle(options) {
            this.fn = EventHandle;
            this.id;
            this.callback;
            // 傾聽者
            this.listener;
            // 被傾聽者
            this.listeningTo;
            // 區塊對象
            this.context;
            // 若是物件間的監聽
            // 會有一個橋樑資訊
            this.listenInfo;
            /*--------------------------*/
            (function () {
                options = options || {};
                this.id = this.fn.handle_guid++;
                (typeof options.callback === 'function') && (this.callback = options.callback);
                options.listener && (this.listener = options.listener);
                options.listeningTo && (this.listeningTo = options.listeningTo);
                options.context && (this.context = options.context);
                options.listenInfo && (this.listenInfo = options.listenInfo);
            }).call(this);
        }

        EventHandle.handle_guid = 1;
    } // factory end


})(this || {});
