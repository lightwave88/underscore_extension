!(function (global) {

    (function () {
        let _;

        if (typeof window !== "undefined" && typeof document !== "undefined") {
            if (typeof window._ === undefined) {
                throw new TypeError("need import lodash or underscode");
            }
            _ = window._;
            // 建構
            factory(_);
        } else if (typeof module !== 'undefined' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (_path) {

                if(typeof _path == "string"){
                    _ = require(_path);
                }else{
                    _ = _path;
                }

                // 建構
                factory(_);
            };
        } else if (typeof (window) === "undefined" && self !== "undefined" && typeof (importScripts) === 'function') {
            debugger;
            // webWorker 環境
            // console.log("worker")

            if (typeof (global._) === "undefined") {
                // worker 本體初始建構
                return;
            }
            _ = global._;

            // 建構
            factory(_);
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
        ////////////////////////////////////////////////////////////////////////


        // Regular expression used to split event strings.
        const eventSplitter = /\s+/;

        // 取得 extention 全域變數
        let $extension = _.$$extension;

        // 每個有事件功能的物件都應該有個 event_id
        // 加快 obj_1 === obj_2 的步驟
        let event_id = 1;

        // 事件的藍圖
        const Event = {};
        //----------------------------------------------------------------------
        _.mixin({
            // API
            // _.event(物件) 讓物件具有 event 的能力
            // noProto: 不再原型鏈中插入一個有 event 功能的物件
            // 不然就直接覆蓋在物件身上
            // prefix: 避免撞名，在命令前加一個符號
            event: function (obj, noProto, prefix) {
                debugger;

                if ("__$$us_eventData" in obj) {
                    throw new TypeError("has been _.events()");
                }

                noProto = (noProto == null) ? false : true;
                prefix = prefix ? prefix : false;
                //------------------

                let support = false;
                try {
                    let test = {};
                    test.__proto__ = {};
                    support = true;
                    test = undefined;
                } catch (e) {
                }

                //------------------
                let assignObj = obj;
                if (!noProto && support) {
                    let proto = Object.getPrototypeOf(obj);
                    // 創建一個繼承 proto 的物件
                    assignObj = Object.create(proto);
                    obj.__proto__ = assignObj;
                }
                //------------------

                for (let k in Event) {
                    if (Event.hasOwnProperty(k)) {
                        let fn = Event[k];

                        // 檢查是否有 key 撞到
                        let key = (prefix) ? (prefix + k) : k;

                        if (key in obj) {
                            throw new TypeError("key(" + key + ") exists can't overide");
                        }

                        assignObj[key] = fn;
                    }
                }

                //------------------
                // 把所有資料都統一放在(__$$us_eventData)屬性
                _.defineProperty(assignObj, "__$$us_eventData", {
                    id: event_id++,
                    events: {},
                    listeners: null,
                    listeningTo: null
                }, false);

                return obj;
            }
        });
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

                let names = (name ? name.split(eventSplitter) : Object.keys(events));

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
                let names = (name ? name.split(eventSplitter) : _.keys(events));
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
                                _clearBridge(listenInfo);
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

                _checkHasInitialized(obj);

                let target_eventData = obj["__$$us_eventData"];
                let target_id = target_eventData.id;
                let events = target_eventData.events;

                let names = (name ? name.split(eventSplitter) : Object.keys(events));
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
                                _clearBridge(listenInfo);
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
                debugger;

                let arg = Array.from(arguments);
                arg = arg.slice(1);

                let eventData = this["__$$us_eventData"];
                let events = eventData.events;
                //----------------------------
                let eventList;
                // eventName = all
                let all_eventList = (Array.isArray(events['all']) ? events['all'].slice() : undefined);

                if (/^all$/i.test(eventName)) {
                    for (let k in events) {
                        if (/^all$/i.test(k)) {
                            continue;
                        }
                        eventList = events[k];
                        _triggerEvents(this, eventList, arg, k, eventName);
                    }

                } else {
                    eventList = (Array.isArray(events[eventName]) ? events[eventName].slice() : undefined);
                    _triggerEvents(this, eventList, arg, eventName, eventName);
                }
                //----------------------------
                if (all_eventList) {
                    _triggerEvents(this, all_eventList, arg, 'all', eventName);
                }

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

            let _callback = callback;

            if (once) {
                _callback = function () {
                    _self.off(name, _callback);
                    callback.apply(this, arguments);
                };
                _callback["__$$us_eventGuid"] = callback["__$$us_eventGuid"];
            }
            //----------------------------
            let names = name.split(eventSplitter);

            for (let i = 0; i < names.length; i++) {
                debugger;
                let name = names[i];

                if (events[name] == null) {
                    events[name] = [];
                }
                let eventList = events[name];

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
        function $_listenTo(obj, name, callback, context, once) {
            debugger;

            _checkHasInitialized(obj);

            let target_eventData = obj["__$$us_eventData"];
            let self_eventData = this["__$$us_eventData"];

            // 連結兩者

            // 傾聽 obj 的 map
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
                    listeningTo: obj,
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
            let names = name.split(eventSplitter);

            for (let i = 0, name; name = names[i]; i++) {
                debugger;

                if (events[name] == null) {
                    events[name] = [];
                }
                let eventList = events[name];

                let _callback = callback;
                if (once) {
                    _callback = function () {
                        _self.stopListening(obj, name, _callback);
                        callback.apply(this, arguments);
                    };
                    _callback["__$$us_eventGuid"] = callback["__$$us_eventGuid"];
                }

                eventList.push(new EventHandle({
                    callback: _callback,
                    listener: this,
                    listeningTo: obj,
                    context: (context || this),
                    listenInfo: listenInfo
                }));
            }

        }
        //----------------------------------------------------------------------
        // 清除兩者間的關係紀錄
        function _clearBridge(listenInfo) {

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
        }
        //----------------------------------------------------------------------
        // 在事件對列中，找目標
        function _findHandle(triggerObj, name, targetHandle) {

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
        }
        //----------------------------------------------------------------------
        // 發出訊息
        function _triggerEvents(target, eventList, args, name, triggerEvent) {
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
                let result = _findHandle(target, name, handle);

                if (!result) {
                    continue;
                }
                /*--------------------------*/
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
                /*--------------------------*/
                job();
            }
        }
        //----------------------------------------------------------------------
        // 檢查物件是否被 _.event() 初始化過
        function _checkHasInitialized(obj) {

            if (obj == null || typeof (obj) !== "object") {
                throw new TypeError("_.event() must be obj");
            }

            if (obj["__$$us_eventData"] == null) {
                throw new TypeError("obj must be _.event()");
            }
        }
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
