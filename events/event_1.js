!(function (global) {
    ////////////////////////////////////////////////////////////////////////////
    //
    // 讓物件具有事件能力
    //
    ////////////////////////////////////////////////////////////////////////////
    let _;
    if (typeof Window !== "undefined" && global instanceof Window) {
        if (typeof global._ === "object" || typeof global._ === "function") {
            _ = global._;
        }
    } else if (typeof module === "object") {
        // node.js
        try {
            _ = require("../lodash");
        } catch (e) { }
        //----------------------------
        if (typeof _ === "undefined") {
            try {
                _ = require("../underscore");
            } catch (e) { }
        }
        //----------------------------
        if (typeof _ === "undefined") {
            throw new Error("need require underscore or lodash");
        }
    }
    if (typeof _.event !== 'undefined') {
        return;
    }
    //==========================================================================
    // Regular expression used to split event strings.
    const eventSplitter = /\s+/;

    // 取得 extention 全域變數
    let $extension = _.$$extension;


    // 給予每一個(事件單體)一個可以辨識的 id
    let handle_guid = 1;

    // 每個有事件功能的物件都應該有個 event_id
    // 加快 obj_1 === obj_2 的步驟
    let event_id = 1;

    // 事件的藍圖
    const Events = {};
    //==========================================================================
    _.mixin({
        // API
        // _.event(物件) 讓物件具有 event 的能力
        // proto: 是否在 prototype 列表中插入一個有 event 功能的物件
        event: function (obj, proto) {
            // debugger;
            proto = proto ? true : false;
            //------------------
            // 檢查是否有 key 撞到
            let keyList = Object.getOwnPropertyNames(Events);

            keyList.forEach(function (k) {
                if (k in obj) {
                    throw new TypeError("key(" + k + ") has exist");
                }
            });
            //------------------
            let support = false;
            try {
                let test = {};
                test.__proto__ = {};
                support = true;
            } catch (e) { }

            //------------------
            let assignObj = obj;
            if (support && proto) {
                let proto = Object.getPrototypeOf(obj);
                // 創建一個繼承 proto 的物件
                assignObj = Object.create(proto);
                obj.__proto__ = assignObj;
            }
            Object.assign(assignObj, Events);

            return obj;
        }
    });

    function makeEventAbility(obj) {
        for (var k in Events) {
            if (Events.hasOwnProperty(k)) {
                obj[k] = Events[k];
            }
        }
    }
    //==========================================================================



    (function (_self) {
        _self.on = function (name, callback, context) {
            'use strict';
            return $_on.apply(this, [name, callback, context]);
        };
        /*====================================================================*/
        _self.once = function (name, callback, context) {
            'use strict';
            return $_on.apply(this, [name, callback, context, true]);
        };
        /*====================================================================*/

        _self.listenTo = function (obj, name, callback, context) {
            'use strict';
            return $_listenTo.apply(this, [obj, name, callback, context]);
        };
        /*====================================================================*/
        _self.listenToOnce = function (obj, name, callback, context) {
            'use strict';
            return $_listenTo.apply(this, [obj, name, callback, context, true]);
        };
        //======================================================================
        // 是否有監聽某事件
        _self.hasOn = function (name, callback) {
            'use strict';

            if (!name) {
                throw new Error("arg[0] must be evenName");
            }

            if (obj._bc_events == null || !Object.keys(obj._bc_events).length) {
                return false;
            }

            if (Array.isArray(events[name])) {

                while (++index < eventList.length) {
                    handle = eventList[index];

                    let isCallback = true;

                    if (callback !== null && callback._bc_eventGuid) {
                        isCallback = (callback._bc_eventGuid === handle.callback._bc_eventGuid);
                    }

                    if (isCallback) {
                        return true;
                    }
                }
            }
            return false;
        };
        //======================================================================
        // 是否監聽過
        //
        // 參數可以再加強
        _self.hasListenTo = function (obj, name, callback) {
            'use strict';

            debugger;
            let target = this;

            if (!name) {
                throw new Error("arg[1] must be evenName");
            }

            if (obj._bc_events == null || !Object.keys(obj._bc_events).length) {
                return false;
            }

            let events = obj._bc_events;

            if (Array.isArray(events[name])) {

                while (++index < eventList.length) {
                    handle = eventList[index];

                    let isCallback = true;

                    if (callback !== null && callback._bc_eventGuid) {
                        isCallback = (callback._bc_eventGuid === handle.callback._bc_eventGuid);
                    }

                    if (isCallback && handle.listener === target && handle.listeningTo === obj) {
                        return true;
                    }
                }
            }

            return false;
        };
        //======================================================================
        // 只刪除自己註冊的事件
        // 別物件傾聽自己的不會被刪除
        _self.off = function (name, callback) {
            'use strict';

            if (callback && typeof callback._bc_eventGuid === "undefined") {
                // callback 未註冊過
                return this;
            }
            //----------------------------
            var events = this._bc_events;

            if (events == null) {
                return this;
            }

            var names = (name ? name.split(eventSplitter) : Object.keys(events));

            for (let j = 0, name; name = names[j]; j++) {

                var eventList = events[name];

                if (!Array.isArray(eventList)) {
                    continue;
                }

                var remaining = [];

                let isCallback = (callback == null ? true : (handle.callback._bc_eventGuid !== callback._bc_eventGuid));

                for (let i = 0; i < eventList.length; i++) {
                    var handle = eventList[i];

                    if (isCallback && handle.listener._bc_listenId !== this._bc_listenId) {
                        remaining.push(handle);
                    }
                }
                //----------------------------
                // debugger;
                if (remaining.length) {
                    this._bc_events[name] = remaining;
                } else {
                    delete this._bc_events[name];
                }
            }
            //----------------------------
            return this;
        };
        //======================================================================
        // 清除監聽者
        // 不會清除自己監聽自己
        _self.clearListeners = function (name, callback, listener) {
            'use strict';

            if (callback && typeof callback._bc_eventGuid === "undefined") {
                // callback 未註冊過
                return this;
            }
            //----------------------------
            var events = this._bc_events;

            if (events == null) {
                return this;
            }

            var names = (name ? name.split(eventSplitter) : Object.keys(events));

            for (let j = 0, name; name = names[j]; j++) {

                var eventList = events[name];

                if (!Array.isArray(eventList)) {
                    continue;
                }

                var remaining = [];

                for (let i = 0; i < eventList.length; i++) {
                    var handle = eventList[i];

                    let remove = true;

                    let isCallback = (callback == null ? true : (handle.callback._bc_eventGuid !== callback._bc_eventGuid));

                    if (listener && listener._bc_listenId !== this._bc_listenId) {
                        // 移除指定監聽者

                        if (isCallback && handle.listener._bc_listenId !== listener._bc_listenId) {
                            remove = false;
                            remaining.push(handle);
                        }
                    } else {
                        // 移除非自己的監聽者

                        if (isCallback && handle.listener._bc_listenId === this._bc_listenId) {
                            remove = false;
                            remaining.push(handle);
                        }
                    }
                    //----------------------------
                    if (remove) {
                        let listenInfo = handle.listenInfo;
                        // handle match
                        if (listenInfo && --listenInfo.count === 0) {
                            // 刪除兩物件間的橋樑
                            let listener = listenInfo.listener;
                            let listeningTo = listenInfo.listeningTo;

                            _clearBridge(listener, listeningTo);
                        }
                    }
                }
            }
            //----------------------------
            // debugger;
            if (remaining.length) {
                this._bc_events[name] = remaining;
            } else {
                delete this._bc_events[name];
            }

            //----------------------------
            return this;
        };
        //======================================================================
        // 不再監聽別人
        _self.stopListening = function (obj, name, callback) {
            'use strict';

            if (callback && typeof callback._bc_eventGuid === "undefined") {
                // callback 未註冊過
                return this;
            }

            if (!arguments.length) {
                // 移除與所有發射者間的關係
                // listenInfo 唯一的用處
                if (this._bc_listeningTo) {
                    for (var key in this._bc_listeningTo) {
                        listenInfo = this._bc_listeningTo[key];
                        let target = listenInfo.listeningTo;
                        this.stopListening(target);
                    }
                }
                return this;
            }
            //----------------------------
            let events = obj._bc_events;

            if (events == null) {
                return this;
            }

            let names = (name ? name.split(eventSplitter) : Object.keys(events));
            //----------------------------
            for (let j = 0, name; name = names[j]; j++) {

                let eventList = events[name];

                if (!Array.isArray(eventList)) {
                    continue;
                }

                var remaining = [];

                // debugger;
                for (var i = 0; i < eventList.length; i++) {
                    var handle = eventList[i];

                    let isCallback = (callback == null ? true : (handle.callback._bc_eventGuid === callback._bc_eventGuid));
                    let isListener = (handle.listener._bc_listenId === this._bc_listenId);

                    if (isCallback && isListener) {

                        let listenInfo = handle.listenInfo;
                        // handle match
                        if (listenInfo && --listenInfo.count === 0) {
                            // 刪除兩物件間的橋樑
                            let listener = listenInfo.listener;
                            let listeningTo = listenInfo.listeningTo;

                            _clearBridge(listener, listeningTo);
                        }
                    } else {
                        // handle 沒有 match
                        remaining.push(handle);
                    }
                }
            }
            //----------------------------
            // debugger;
            if (remaining.length) {
                obj._bc_events[name] = remaining;
            } else {
                delete obj._bc_events[name];
            }

            return this;
        };
        /*====================================================================*/
        // 要排除 trigger 的物件
        // name, option. arguments
        _self.trigger = function (eventName) {
            'use strict';
            // debugger;

            var arg = Array.from(arguments);
            arg = arg.slice(1) || [];
            /*---------------------------*/

            if (!this._bc_events || !Object.keys(this._bc_events).length) {
                return this;
            }

            let events = this._bc_events;
            /*------------------------------------*/

            let eventList, all_eventList;

            all_eventList = (Array.isArray(events['all']) ? events['all'].slice() : undefined);

            if (!/all/i.test(eventName)) {
                eventList = (Array.isArray(events[eventName]) ? events[eventName].slice() : undefined);
            }
            /*----------------------------------*/
            if (eventList) {
                _triggerEvents(this, eventList, arg, eventName);
            }

            if (all_eventList) {
                _triggerEvents(this, all_eventList, arg, 'all');
            }

            return this;
        };
        //======================================================================
        _self.bind = _self.on;

        _self.unbind = _self.off;

        _self.emit = _self.trigger;

        _self.hasBind = _self.hasOn;
    })(Events);
    ////////////////////////////////////////////////////////////////////////////
    function $_on(name, callback, context, once) {

        let self = this;

        // 給物件一個辨識用的 id
        if (this._bc_listenId == null) {
            _.defineProperty(this, "_bc_listenId", event_id++, false);
        }

        // 在物件裡面埋下一個空間，專門放 events
        if (this._bc_events == null) {
            _.defineProperty(this, "_bc_events", {}, false);
        }
        let events = this._bc_events;
        //----------------------------
        // 為 callback 放個 id
        if (typeof callback._bc_eventGuid !== 'number') {
            _.defineProperty(callback, "_bc_eventGuid", $extension.callback_guid++, false);
        }


        //----------------------------
        var names = name.split(/\s+/);

        for (let i = 0; i < names.length; i++) {
            let name = names[i];

            let eventList = events[name] || (events[name] = []);

            let _callback = callback;

            if (once) {
                _callback = function () {
                    // name error 闭包关系
                    self.off(name, _callback);
                    callback.apply(this, arguments);
                };
                _callback._bc_eventGuid = callback._bc_eventGuid;
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
    /*====================================================================*/
    function $_listenTo(obj, name, callback, context, once) {
        // debugger;

        // 連結兩者

        // 物件都需要一個標籤
        if (this._bc_listenId == null) {
            _.defineProperty(this, "_bc_listenId", event_id++, false);
        }
        // 物件都需要一個標籤
        if (obj._bc_listenId == null) {
            _.defineProperty(obj, "_bc_listenId", event_id++, false);
        }
        // 傾聽 obj 的 map
        if (obj._bc_listeners == null) {
            _.defineProperty(obj, "_bc_listeners", {}, false);
        }
        // 傾聽 map
        if (this._bc_listeningTo == null) {
            _.defineProperty(this, "_bc_listeningTo", {}, false);
        }

        // 放置事件相關的資訊
        // 兩個物件彼此間的橋樑
        let listenInfo = obj._bc_listeners[this._bc_listenId] || this._bc_listeningTo[obj._bc_listenId];

        if (listenInfo == null) {
            // 兩個物件彼此間的橋樑資訊
            listenInfo = {
                listener: this,
                listeningTo: obj,
                count: 1
            };
            obj._bc_listeners[this._bc_listenId] = this._bc_listeningTo[obj._bc_listenId] = listenInfo;
        } else {
            // 彼此之間有幾次連結關係
            listenInfo.count++;
        }
        //----------------------------
        if (obj._bc_events == null) {
            _.defineProperty(obj, "_bc_events", {}, false);
        }
        let events = obj._bc_events;

        if (typeof callback._bc_eventGuid !== 'number') {
            callback._bc_eventGuid = $extension.callback_guid++;
        }
        //----------------------------
        var names = name.split(/\s+/);

        // debugger;
        //
        for (let i = 0, name; name = names[i]; i++) {
            let eventList = events[name] || (events[name] = []);

            let _callback = callback;
            if (once) {
                _callback = function () {
                    // name error 闭包关系
                    self.stopListening(obj, name, _callback);
                    callback.apply(this, arguments);
                };
                _callback._bc_eventGuid = callback._bc_eventGuid;
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
    //==========================================================================
    // 清除兩者間的關係紀錄
    function _clearBridge(listener, listeningTo) {

        listener && (listener._bc_listeningTo) && (delete listener._bc_listeningTo[listeningTo._bc_listenId]);
        listeningTo && (listeningTo._bc_listeners) && (delete listeningTo._bc_listeners[listener._bc_listenId]);
    }
    //==========================================================================
    // 斬斷監聽某物件的所有監聽者間的關係紀錄
    // 好像沒用
    function _clearAllListeners(listeningTo) {

        var listener_id = listeningTo._bc_listenId;

        _.each(listeningTo._bc_listeners, function (listenInfo, key) {
            // 被監聽者

            delete listeningTo._bc_listeners[key];

            // 監聽者
            var listener = listenInfo.listener;

            if (listener && (listener._bc_listeningTo) && (listener._bc_listeningTo[listener_id])) {
                delete listener._bc_listeningTo[listener_id];
            }
        }, this);
    }
    //==========================================================================
    function _findHandle(triggerObj, name, targetHandle) {
        var find = false;

        var events = triggerObj._bc_events || {};
        var eventList = events[name];
        if (Array.isArray(eventList)) {
            eventList.some(function (handle) {
                if (handle.id === targetHandle.id) {
                    find = true;
                    return true;
                }
            });
        }
        return find;
    }
    //==========================================================================
    // opts => e
    function _triggerEvents(target, eventList, args, name) {
        // debugger;

        let handle;
        let i = -1;
        let handle_id;
        let l = eventList.length;
        //----------------------------

        while (++i < l) {
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

            let e = new EventObj({
                target: target,
                type: name
            });

            _arg.unshift(e);

            let job = (function (args) {
                handle.callback.apply(this, args);
            }).bind(handle.context, _arg)
            /*--------------------------*/
            try {
                job();
            } catch (InternalError) {
            }

        }

    }
    ////////////////////////////////////////////////////////////////////////////
    // 每一個單一事件的代表
    function EventHandle(options) {
        this.id = handle_guid++;
        this.callback;
        this.listener;
        this.listeningTo;
        this.context;
        // 若是物件間的監聽
        // 會有一個橋樑資訊
        this.listenInfo;
        /*--------------------------*/
        (function () {
            options = options || {};
            (typeof options.callback === 'function') && (this.callback = options.callback);
            options.listener && (this.listener = options.listener);
            options.listeningTo && (this.listeningTo = options.listeningTo);
            options.context && (this.context = options.context);
            options.listenInfo && (this.listenInfo = options.listenInfo);
        }).call(this);
    }

    ////////////////////////////////////////////////////////////////////////////
    //
    // 代表事件本體
    //
    ////////////////////////////////////////////////////////////////////////////

    // 代表事件本體
    function EventObj(opt) {
        this.target;
        this.type;

        this.__constructor(opt);
    }
    //==========================================================================
    (function () {
        this.__constructor = function (opt) {
            opt = opt || {};

            if (opt.target) {
                this.target = opt.target;
            }

            if (opt.type) {
                this.type = opt.type;
            }
        };
        //----------------------------------------------------------------------
        // 阻止事件繼續傳播
        this.stopPropagation = function () {
            throw new InternalError('stop');
        };
    }).call(EventObj.prototype);

})(this || {});
