!(function () {

    (function () {
        let _;

        if (typeof window !== "undefined" && typeof document !== "undefined") {
            if (typeof window._ === undefined) {
                throw new TypeError("need import lodash or underscode");
            }

            // web
            _ = window._;
            // 建構
            factory(_, true);
        } else if (typeof module !== 'undefined' && module.exports) {
            // node.js
            // 指定 loadash|underscode 的 path
            module.exports = function (_path) {
                _ = require(_path);
            };
            // 建構
            factory(_, false);
        } else if (typeof (window) === "undefined" && self !== "undefined" && typeof (importScripts) === 'function') {
            debugger;
            // webWorker 環境

            if(typeof(global._) === "undefined"){
                // worker 本體建構
                return;
            }

            // 建構
            unsupportFactory(_);
        } else {
            throw new TypeError("not support your system");
        }

    }());
    ////////////////////////////////////////////////////////////
    // 工廠函式
    function factory(_, isBrowser) {
        makeRouter.isBrowser = isBrowser ? true : false;

        _.mixin({
            router: makeRouter
        });
    }

    function unsupportFactory(_) {
        _.mixin({
            router: function () {
                throw new Error("no support in this environment");
            }
        });
    }
    ////////////////////////////////////////////////////////////
    // browser
    // arg[0]: [options|string(routerName)]
    //
    // options: {
    //  initialize:fn: 初始化要做的事
    //  routes:{}: router 規則
    //  update:fn: 有改變時要做的事
    //  error:fn: 當沒找到時要做的事
    //  queryString:boolean(false): 是否要用 queryString 模式
    //  server:boolean(系統判別): 是否要以 server 模式啟動
    //  multiple:boolean(false): 同一狀況下是否容許多個規則
    // }

    // server
    //
    function makeRouter() {

        let args = arguments;

        if (makeRouter.isBrowser) {
            // 瀏覽器狀態
        } else {

        }
    }

    (function (fn) {
        fn.uid = 0;

        // 系統先判斷是否是瀏覽器狀態
        fn.isBrowser;

        // 方便全局管理
        fn.routerMap = {};

        // 有哪些節點有預設標籤(b-router)
        // 讓非 a 可以在一開始綁定事件
        fn.domList = [];
    }(makeRouter));


    ////////////////////////////////////////////////////////////
    function Router(options, fn){
        'use strict'

        this.id;
        this.fn;
        this.name;
        this.routes = new Map();

        this.callbacks = {
            initialize: null,
            update: null,
            error: null
        };
        // 單一錨點名稱容許多個規則存在
        this.multiple = false;

        // 採用兩種模式
        // 參考 codeIgniter 雙模式
        // 錨點規則是否採用傳統的 queryString 方式
        this.enable_query_strings = false;
        //-----------------------
        // 相依模組
        this.ruleMaker;
    }
    ////////////////////////////////////////////////////////////
    // 繼承 Router
    function BrowserRuter(options, fn) {
        'use strict';
        Router.apply(this, arguments);

        // 記錄之前的錨點
        this.prevHash;

        // 是否暫停反應
        this._stop = false;
        //-----------------------
        this.__construct(options, fn);
    }

    BrowserRuter.prototype = Object.create(Router.prototype);

    (function () {
        this.__construct = function (options, fn) {
            this.fn = fn;

            this.id = this.fn.uid++;

            this._registerRouter();
        };
        //------------------------------------------------
        // 註冊
        this._registerRouter = function () {
            this.fn.routerMap[this.id] = this;

            if (this.name) {
                this.fn.routerMap[this.name] = this;
            }
        };

        this._makeRuleItem = function(){

        };
        //------------------------------------------------
        this._bindEvent = function(){

        };
        //------------------------------------------------
        // 不再監聽
        this.off = function(){

        };
        //------------------------------------------------
        // API
        // 預設
        this.initialize = function () {
            let callback = this.callbacks.initialize;
            if (typeof callback == "function") {
                callback.call(this);
            }
        };
        //------------------------------------------------
        // API
        // 加入 rule
        this.router = function () {

        };
        //------------------------------------------------
        // API
        // 開啟 router 功能
        this.start = function () {

        };
        //------------------------------------------------
        // API
        // 停止 router 更能
        this.stop = function () {

        };
        //------------------------------------------------
        // 供瀏覽器網址改變時的呼叫
        this.update = function(){
            let callback = this.callbacks.update;
            if (typeof callback == "function") {
                callback.call(this);
            }
        };
        //------------------------------------------------
        // 網址導向
        this.navigate = function () {

        };

        // 根據參數產生網址
        this.link = function () {

        };

        // 取得變數
        this.arg = function(key){

        }
    }).call(BrowserRuter.prototype);
    //==========================================================
    !(function () {


    }).call(BrowserRuter.prototype);
    ////////////////////////////////////////////////////////////

    // 每一個 route 規則
    function RuleItem(parent, callback, str) {

        this.rule;
        this.keyList = [];

        // 使用者原始設定
        this.source;
        this.parent;
        this.callbacks = [];
        //----------------------------
        this.__construct(parent, callback, str);
    }

    !(function(){
        this.__construct = function(parent, callback, str){

            // 使用分析模組，創建自身的 rule
            let ruleMaker = this.parent.ruleMaker;

        };

    }).call(RuleItem.prototype);
    ////////////////////////////////////////////////////////////



}(this || {}));
