!(function (global) {
    let $_;

    const Tool = {};

    // 事件的藍圖
    const Event = {};

    // 設定文件
    const eventSetting = {};

    (function () {
        // Regular expression used to split event strings.
        this.eventSplitter = /\s+/;

        this.eventNamePrefix = 'usEvent';

    }).call(eventSetting);
    //----------------------------------------------------------------------

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

    // 是否有 jquery
    let hasJquery = (function () {
        let judge_1 = (global.jQuery != null || global.$ != null);

        let judge_2 = (global.document != null);

        return (judge_1 && judge_2);
    })();


    //==========================================================================

    (function () {

        if (typeof module !== 'undefined' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (obj) {
                // 建構
                factory(obj);
            };
        } else {
            if (typeof (global._) === "undefined") {
                // worker 本體建構
                return;
            }
            // 建構
            factory(global._);
        }

    }());

    return;
    //==========================================================================
    // 工厂
    function factory(_) {

        if(_ == null){
            return;
        }

        ////////////////////////////////////////////////////////////////////////
        //
        // 讓物件具有事件能力
        //
        // 把 dom 納入(將 dom 與 物件)可以做事件連結
        //
        ////////////////////////////////////////////////////////////////////////

        // 取得 extention 全域變數
        const $extension = _.$$extension;

        // 全局事件
        let $bus;

        //----------------------------------------------------------------------
        _.mixin({
            // API
            // _.event(物件) 讓物件具有 event 的能力
            // noProto: 不再原型鏈中插入一個有 event 功能的物件
            // 不然就直接覆蓋在物件身上
            // prefix: 避免撞名，在命令前加一個符號
            // obj 不能是 dom
            event: eventCommand
        });


        function eventCommand(obj, noProto, prefix) {
            // debugger;
            let args = Array.from(arguments);

            if (args.length == 0) {
                // 返回设定物件
                return eventSetting;
            }

            if (obj == null || typeof (obj) != "object") {
                throw new TypeError("_.event() must be obj");
            }

            if ("__$$us_eventData" in obj) {
                return obj;
            }
            //----------------------------

            noProto = (noProto == null) ? false : true;
            prefix = prefix ? prefix : false;
            //------------------
            // 是否要将 API 置放在原型炼中
            let assignObj = obj;
            if (noProto && supportProto) {
                let proto = Object.getPrototypeOf(obj);
                // 創建一個繼承 proto 的物件
                assignObj = Object.create(proto);

                Object.setPrototypeOf(obj, assignObj);
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
            Tool.checkInitialized(assignObj);

            return obj;
        }
        //----------------------------------------------------------------------
        (function (fn) {

            fn.on = function (obj, name, callback, context) {
                Tool.checkInitialized(obj);
                __on.call(obj, name, callback, context);
                return fn;
            };
            //------------------------------------------------------------------
            fn.once = function (obj, name, callback, context) {
                Tool.checkInitialized(obj);
                __on.call(obj, name, callback, context, true);
                return fn;
            };
            //------------------------------------------------------------------
            fn.listenTo = function (obj, eventMaker, name, callback, context) {

                Tool.checkInitialized(obj);
                Tool.checkInitialized(eventMaker);

                __listenTo.call(obj, eventMaker, name, callback, context);
                return fn;
            };
            //------------------------------------------------------------------
            fn.listenToOnce = function (obj, eventMaker, name, callback, context) {

                Tool.checkInitialized(obj);
                Tool.checkInitialized(eventMaker);

                __listenTo.call(obj, eventMaker, name, callback, context, true);
                return fn;
            };
            //------------------------------------------------------------------
            fn.hasOn = function (obj, name, callback) {

                if (!Tool.checkObj(obj)) {
                    return false;
                }

                return __hasOn.call(obj, name, callback);
            };
            //------------------------------------------------------------------
            fn.hasListenTo = function (obj, eventMaker, name, callback) {
                if (!Tool.checkObj(obj) || !Tool.checkObj(eventMaker)) {
                    return false;
                }

                return __hasListenTo.call(obj, eventMaker, name, callback);
            };
            //------------------------------------------------------------------
            fn.off = function (obj, name, callback) {

                if (!Tool.checkObj(obj)) {
                    return fn;
                }
                __off.call(obj, name, callback);

                return fn;
            };
            //------------------------------------------------------------------
            fn.clearListener = function (obj, eventMaker, name, callback) {

                if (!Tool.checkObj(obj) || !Tool.checkObj(eventMaker)) {
                    return fn;
                }

                __clearListener.call(obj, eventMaker, name, callback);

                return fn;
            };
            //------------------------------------------------------------------
            fn.stopListening = function (obj, eventMaker, name, callback) {

                if (!Tool.checkObj(obj) || !Tool.checkObj(eventMaker)) {
                    return fn;
                }

                __stopListening.call(obj, eventMaker, name, callback);

                return fn;
            };
            //------------------------------------------------------------------
            fn.trigger = function (obj, eventName, data) {
                Tool.checkInitialized(obj);
                console.log(data);

                __trigger.call(obj, eventName, data);

                return fn;
            };
            //------------------------------------------------------------------
            // 取得全局 event 對象
            fn.bus = function(){
                if($bus == null){
                    $bus = _.event({}, true);
                }
                return $bus;
            };
            //------------------------------------------------------------------
            fn.deleteBus = function(){
                $bus = undefined;
            };
            //------------------------------------------------------------------
            fn.bind = fn.on;

            fn.unbind = fn.off;

            fn.emit = fn.trigger;

            fn.hasBind = fn.hasOn;
        })(eventCommand);


        //----------------------------------------------------------------------
        (function (_self) {
            _self.on = function (name, callback, context) {
                'use strict';
                __on.call(this, name, callback, context);
                return this;
            };
            //------------------------------------------------------------------
            _self.once = function (name, callback, context) {
                'use strict';
                __on.call(this, name, callback, context, true);
                return this;
            };
            //------------------------------------------------------------------
            _self.listenTo = function (obj, name, callback, context) {
                'use strict';
                __listenTo.call(this, obj, name, callback, context);
                return this;
            };
            //------------------------------------------------------------------
            _self.listenToOnce = function (obj, name, callback, context) {
                'use strict';
                __listenTo.call(this, obj, name, callback, context, true);
                return this;
            };
            //------------------------------------------------------------------
            // callback 是否被設定過
            _self.hasOn = function (name, callback) {
                'use strict';

                return __hasOn.call(this, name, callback);
            };
            //------------------------------------------------------------------
            // 是否監聽過 obj
            // obj 為必須
            _self.hasListenTo = function (obj, name, callback) {
                'use strict';
                return __hasListenTo.call(this, obj, name, callback);
            };
            //------------------------------------------------------------------
            // 只刪除自己註冊的事件
            // 別物件傾聽自己的不會被刪除
            _self.off = function (name, callback) {
                'use strict';

                __off.call(this, name, callback);

                return this;
            };
            //------------------------------------------------------------------
            // 清除監聽者所有的一切
            // 不會清除自己監聽自己
            // listener => 監聽者
            // 參數可以皆無
            _self.clearListener = function (obj, name, callback) {
                'use strict';

                __clearListener.call(this, obj, name, callback);

                return this;
            };
            //------------------------------------------------------------------
            // 不再監聽別人
            // 參數可以皆無
            _self.stopListening = function (obj, name, callback) {
                'use strict';

                __stopListening.call(this, obj, name, callback);

                return this;
            };
            //------------------------------------------------------------------
            // 要排除 trigger 的物件
            // name, option. arguments
            _self.trigger = function (eventName, data) {
                'use strict';
                // debugger;

                __trigger.call(this, eventName, data);

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
        function __on(name, callback, context, once) {
            // debugger;

            let self = this;

            let eventData = this["__$$us_eventData"];

            let events = eventData.events;
            //----------------------------
            // 為 callback 放個 id
            if (typeof callback["__$$us_callbackGuid"] !== 'number') {
                _.defineProperty(callback, "__$$us_callbackGuid", $extension.callback_guid++, false);
            }

            //----------------------------
            let names = name.split(eventSetting.eventSplitter);

            for (let i = 0; i < names.length; i++) {
                // debugger;
                let name = names[i];

                if (events[name] == null) {
                    events[name] = [];
                    if (Tool.isDom(this)) {
                        Tool.bindDomEvent(this, name);
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
        }
        //----------------------------------------------------------------------
        // 設置跨物件間的監聽
        function __listenTo(eventMaker, name, callback, context, once) {
            // debugger;

            Tool.checkInitialized(eventMaker);

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
            let connectInfo = (function () {
                debugger;
                if (target_eventData["listeners"][self_eventData.id] != null) {
                    return target_eventData["listeners"][self_eventData.id];
                }

                if (self_eventData["listeningTo"][target_eventData.id] != null) {
                    return self_eventData["listeningTo"][target_eventData.id];
                }
            }());

            if (connectInfo == null) {
                // 兩個物件彼此間的橋樑資訊
                connectInfo = {
                    listener: this,
                    listeningTo: eventMaker,
                    count: 1
                };
            } else {
                // 彼此之間有幾次連結關係
                connectInfo.count++;
            }

            self_eventData["listeningTo"][target_eventData.id] =
                target_eventData["listeners"][self_eventData.id] = connectInfo;
            //----------------------------
            debugger;
            let events = target_eventData.events;

            if (typeof callback.__$$us_callbackGuid !== 'number') {
                _.defineProperty(callback, "__$$us_callbackGuid", $extension.callback_guid++, false);
            }
            //----------------------------
            let names = name.split(eventSetting.eventSplitter);

            for (let i = 0, name; name = names[i]; i++) {
                debugger;

                if (events[name] == null) {
                    events[name] = [];

                    if (Tool.isDom(eventMaker)) {
                        Tool.bindDomEvent(eventMaker, name);
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
                    connectInfo: connectInfo
                }));
            }

        }
        //----------------------------------------------------------------------
        function __hasOn(name, callback) {
            if (Tool.isDom(this)) {
                throw new Error('use dom event method');
            }

            if (!name) {
                throw new TypeError("arg[0] must be evenName");
            }
            //-----------------------
            let self_eventData = this["__$$us_eventData"];
            let events = self_eventData.events;
            let self_id = self_eventData.id;

            if (events[name] == null) {
                return false;
            } else {
                if (!callback) {
                    return true;
                }
            }
            //-----------------------
            if (callback["__$$us_callbackGuid"] == null) {
                // 若 callback 沒設定過標記
                return false;
            }

            let eventList = events[name];

            return eventList.some(function (handle) {
                // callback 是否匹配
                let judge_1 = (callback["__$$us_callbackGuid"] === handle.callback["__$$us_callbackGuid"]);

                // 監聽者是否匹配
                let judge_2 = (handle.listener["__$$us_eventData"]["id"] === self_id);

                return (judge_1 && judge_2);
            });
        }
        //----------------------------------------------------------------------

        function __hasListenTo(obj, name, callback) {
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
                        return false;
                    }

                    let eventList = events[name];

                    return eventList.some(function (handle) {
                        return (handle.listener["__$$us_eventData"]["id"] == self_id);
                    });

                }).call(this);

            } else {
                // 參數有 obj, eventName, callback
                res = (function () {

                    if (typeof callback !== "function") {
                        throw new TypeError("callback must be function");
                    }

                    if (events[name] == null) {
                        return false;
                    }

                    if (callback["__$$us_callbackGuid"] == null) {
                        // 若 callback 沒設定過標記
                        return false;
                    }

                    let eventList = events[name];

                    return eventList.some(function (handle) {
                        let judge_1 = (callback["__$$us_callbackGuid"] == handle.callback["__$$us_callbackGuid"]);

                        let judge_2 = (handle.listener["__$$us_eventData"]["id"] == self_id);

                        return (judge_1 && judge_2);
                    });
                }).call(this);

            }
            //----------------------------
            return res;
        }
        //----------------------------------------------------------------------
        function __off(name, callback) {           

            if (callback != null && callback["__$$us_callbackGuid"] == null) {
                // callback 未註冊過
                return;
            }
            //----------------------------
            let self_eventData = this["__$$us_eventData"];
            let self_id = self_eventData.id;
            let events = self_eventData.events;

            let names = (name != null ? name.split(eventSetting.eventSplitter) : Object.keys(events));

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
                        return (handle.callback["__$$us_callbackGuid"] == callback["__$$us_callbackGuid"]);
                    }());

                    let listener_id = handle.listener["__$$us_eventData"]["id"];
                    if (isCallback && listener_id == self_id) {
                    } else {
                        remaining.push(handle);
                    }
                }
                //----------------------------
                // debugger;
                if (remaining.length > 0) {
                    events[name] = remaining;
                } else {
                    delete events[name];
                    if (Tool.isDom(this)) {
                        // 移除事件转派者
                        Tool.unBindDomEvent(this, name);
                    }
                }
                //----------------------------
            }
        }
        //----------------------------------------------------------------------
        // 清除所有监听自己者
        function __clearListener(obj, name, callback) {
            if (callback != null && callback["__$$us_callbackGuid"] == null) {
                // callback 未註冊過
                return;
            }
            //----------------------------
            let self_eventData = this["__$$us_eventData"];
            let events = self_eventData.events;

            let self_id = self_eventData.id;

            let listener_eventData;
            let listener_id;

            if (obj != null && typeof (obj) == "object" && obj["__$$us_eventData"] != null) {
                listener_eventData = obj["__$$us_eventData"];
                listener_id = listener_eventData["id"];
            }
            //----------------------------
            let names = (name ? name.split(eventSetting.eventSplitter) : Object.keys(events));
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
                        return (handle.callback["__$$us_callbackGuid"] !== callback["__$$us_callbackGuid"]);
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
                        let connectInfo = handle.connectInfo;

                        // 刪除兩物件間的橋樑
                        Tool.clearBridge(connectInfo);

                    } else {
                        remaining.push(handle);
                    }
                }
                //----------------------------
                // debugger;
                if (remaining.length > 0) {
                    self_eventData.events[name] = remaining;
                } else {
                    delete self_eventData.events[name];
                    if (Tool.isDom(this)) {
                        // 移除事件转派者
                        Tool.unBindDomEvent(this, name);
                    }
                }
            }
        }
        //----------------------------------------------------------------------
        function __stopListening(eventMaker, name, callback) {
            if (callback != null && callback["__$$us_callbackGuid"] == null) {
                // callback 未註冊過
                return;
            }

            let self_eventData = this["__$$us_eventData"];
            let self_id = self_eventData.id;

            if (eventMaker == null) {
                // 移除與所有發射者間的關係
                // connectInfo 唯一的用處
                let listeningToList;
                if (listeningToList = self_eventData["listeningTo"]) {
                    for (let key in listeningToList) {
                        connectInfo = listeningToList[key];
                        let target = connectInfo.listeningTo;
                        __stopListening.call(this, target);
                    }
                }
                return this;
            }
            //----------------------------

            if (!Tool.checkObj(eventMaker)) {
                return;
            }

            let target_eventData = eventMaker["__$$us_eventData"];
            let target_id = target_eventData.id;
            let events = target_eventData.events;

            let names = (name ? name.split(eventSetting.eventSplitter) : Object.keys(events));
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
                        return (handle.callback["__$$us_callbackGuid"] === callback["__$$us_callbackGuid"]);
                    }());
                    //----------------------------
                    // 正確的傾聽者
                    let isListener = (function () {
                        let id = handle.listener["__$$us_eventData"]["id"];
                        return (id == self_id);
                    }());
                    //----------------------------
                    if (isCallback && isListener) {

                        let connectInfo = handle.connectInfo;

                        // 刪除兩物件間的橋樑
                        Tool.clearBridge(connectInfo);

                    } else {
                        // handle 沒有 match
                        remaining.push(handle);
                    }
                }
                //----------------------------
                // debugger;
                if (remaining.length > 0) {
                    events[name] = remaining;
                } else {
                    delete events[name];
                    if (Tool.isDom(eventMaker)) {
                        Tool.unBindDomEvent(eventMaker, name);
                    }
                }
            }
        }
        //----------------------------------------------------------------------
        // args: 要發送的參數
        // domEvent 來自 dom 的事件，由 dom 发出事件
        function __trigger(eventName, _data, domEvent) {
            debugger;

            if (!domEvent && Tool.isDom(this)) {
                // 若不是来自 dom 的事件，而是人为想发出事件
                // 透过 dom 的发射性统
                Tool.dom_triggerEvents(this, eventName, _data);
                return;
            }
            //----------------------------

            let eventData = this["__$$us_eventData"];
            let events = eventData.events;
            //----------------------------
            let eventList;

            let data = {
                data: _data,
                triggerEvent: eventName
            };

            data.target = this;

            if (!/^all$/i.test(eventName)) {
                eventList = events[eventName];
                eventList = ((Array.isArray(eventList) && eventList.length > 0) ? events[eventName].slice() : undefined);

                if (eventList) {
                    data.eventList = eventList;
                    data.registEventName = eventName;
                    Tool.triggerEvents(data, domEvent);
                }
            }
            //----------------------------
            eventList = events['all'];
            eventList = ((Array.isArray(eventList) && eventList.length > 0) ? events['all'].slice() : undefined);

            if (eventList) {
                data.eventList = eventList;
                data.registEventName = 'all';
                Tool.triggerEvents(data, domEvent);
            }
        }

        //----------------------------------------------------------------------
        (function (_s) {
            // 檢查物件是否被 _.event() 初始化過
            _s.checkInitialized = function (obj) {

                if (obj == null || typeof (obj) != "object") {
                    throw new TypeError("_.event() must be obj");
                }

                if (obj["__$$us_eventData"] == null) {
                    // 埋入一个资料

                    _.defineProperty(obj, "__$$us_eventData", {
                        id: event_id++,
                        events: {},
                        listeners: null,
                        listeningTo: null
                    }, false);
                }
            };
            //------------------------------------------------------------------
            // 物件是否具有 event 的能力
            _s.checkObj = function (obj) {

                if (obj == null || typeof (obj) != "object") {
                    return false;
                }

                if (obj["__$$us_eventData"] == null) {
                    return false;
                }

                return true;
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
            _s.clearBridge = function (connectInfo) {

                if (--connectInfo.count > 0) {
                    // 彼此之间还有引用
                    return;
                }

                let listener = connectInfo.listener;
                let listeningTo = connectInfo.listeningTo;

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

                let event = new CustomEvent(name, {
                    detail: args,
                    bubbles: true,
                    cancelable: true
                });
                dom.dispatchEvent(event);
            };
            //------------------------------------------------------------------
            // 發出訊息
            _s.triggerEvents = function (data, domEvent) {
                debugger;

                let target = data.target;
                let eventList = data.eventList;
                let _data = data.data;
                // 註冊的 eventName
                let registEventName = data.registEventName;

                // emit 的 eventName
                let triggerEvent = data.triggerEvent;

                //----------------------------
                for (let i = 0; i < eventList.length; i++) {

                    // debugger;
                    let handle = eventList[i];
                    let handle_id = handle.id;

                    // 監聽者
                    let _listener = handle.listener;
                    // let _listenTo = handle.listeningTo;

                    // 確保事件尚存
                    let result = Tool.findHandle(target, registEventName, handle);

                    if (!result) {
                        continue;
                    }
                    //----------------------------

                    // 事件本體
                    let e = domEvent || {
                        target: target,
                        type: triggerEvent,
                        currentTarget: _listener
                    };

                    let job = (function (callback, e, _data) {
                        callback.call(this, e, _data);
                    }).bind(handle.context, handle.callback, e, _data)
                    //----------------------------
                    job();
                }
            };

            //------------------------------------------------------------------
            // dom 用
            // 转发器
            _s.event_dispatcher = function (e) {
                debugger;

                let detail;
                let eventName = e.type;
                let args = Array.from(arguments);

                if (typeof args[1] != 'undefined') {
                    // jq.trigger
                    let args = Array.from(arguments).split(1);
                    args = Tool.array2obj(args);
                    detail = Object.assign({}, args);
                } else if (typeof (e) == 'object') {
                    detail = e.detail;
                }

                let self = e.currentTarget;

                __trigger.call(self, eventName, detail, e);

            };
            //------------------------------------------------------------------
            // _event.once()
            _s.getOnceEventCallback_1 = function (eventName, callback, context) {
                function _callback() {
                    debugger;
                    __off.call(context, eventName, _callback);
                    callback.apply(this, arguments);
                }
                _.defineProperty(_callback, "__$$us_callbackGuid", callback["__$$us_callbackGuid"], false);

                return _callback;
            };
            //------------------------------------------------------------------
            // _event.listenToOnce()
            _s.getOnceEventCallback_2 = function (eventMaker, eventName, callback, context) {
                function _callback() {
                    debugger;
                    __stopListening.call(context, eventMaker, eventName, _callback);
                    callback.apply(this, arguments);
                }
                _.defineProperty(_callback, "__$$us_callbackGuid", callback["__$$us_callbackGuid"], false);

                return _callback;
            };
            //------------------------------------------------------------------
            // 為 dom 綁定事件
            _s.bindDomEvent = function (dom, name) {
                let callback = _s.event_dispatcher;
                dom.addEventListener(name, callback);
            };
            //------------------------------------------------------------------
            // 移除 dom 上绑定的事件
            _s.unBindDomEvent = function (dom, name) {
                let callback = _s.event_dispatcher;                
                dom.removeEventListener(name, callback);
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
            this.connectInfo;
            /*--------------------------*/
            (function () {
                options = options || {};
                this.id = this.fn.handle_guid++;
                (typeof options.callback === 'function') && (this.callback = options.callback);
                options.listener && (this.listener = options.listener);
                options.listeningTo && (this.listeningTo = options.listeningTo);
                options.context && (this.context = options.context);
                options.connectInfo && (this.connectInfo = options.connectInfo);
            }).call(this);
        }

        EventHandle.handle_guid = 1;
    } // factory end


})(this || {});
