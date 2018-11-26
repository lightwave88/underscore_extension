!(function (global) {
    debugger;
    ////////////////////////////////////////////////////////////////////////////
    //
    // 使用方式
    // _.worker(原本 _ 的命令, 原本的參數...)
    //
    ////////////////////////////////////////////////////////////////////////////
    (function () {
        let _;
        if (typeof module !== 'undefined' && module.exports) {
            // 暫不支援 node.js
            module.exports = function (_path) {
                _ = require(_path);

                nodeJsFactory(_);
            };
        } else if(typeof window === 'undefined' && typeof importScripts === 'function'){
            // worker 環境
            workerFactory(global);

        }else if (typeof window !== "undefined" && typeof document !== "undefined") {
            // web 環境
            if (typeof window._ === undefined) {
                throw new TypeError("need import lodash or underscode");
            }
            _ = window._;
            normalFactory(global, _);

        }else{
            throw new TypeError("not support your system");
        }
    }());
    ////////////////////////////////////////////////////////////////////////////
    // node.js 環境
    function nodeJsFactory(_){
        _.mixin({
            // 返回 promise
            worker: function () {
                throw new Error("_.worker() not support node.js yet");
            }
        });
    }
    ////////////////////////////////////////////////////////////////////////////
    function workerFactory(global) {
        // console.log('i am worker');
        let __;

        self.addEventListener('message', function (e) {
            debugger;
            let data = e.data || {};
            //----------------------------
            // 必要的3個參數
            let scriptUrl = data['scriptUrl'] || '';
            let fn = data['fn'] || '';
            let args = data.args || [];
            //----------------------------
            // load _.script
            if (__ == null) {
                importScripts(scriptUrl);
                __ = self._;
            }
            //----------------------------
            if (!fn && typeof __[fn] !== 'function') {
                throw new TypeError('no assign fun');
            }
            // _ 的運算
            let res = __[fn].apply(__, args);
            //----------------------------

            self.postMessage({
                res: res
            });
        });
    }
    ////////////////////////////////////////////////////////////////////////////
    function normalFactory(global, _) {

        // 非 worker 環境

        _.mixin({
            // 返回 promise
            worker: function () {
                debugger;
                let args = Array.from(arguments);

                let fn = args[0];
                if (typeof _[fn] !== 'function') {
                    throw new TypeError('fn has problem');
                }
                //----------------------------
                let ceo = WorkerCEO.get_instance();

                debugger;
                let p = ceo.addJob(args);

                return p;
            }
        });
        //======================================================================
        function WorkerCEO() {
            // (lodash|underscode)的位置
            this.scriptUrl = _.$$extension.scriptPath;

            // worker.path
            this.workerUrl = _.$$extension.extensionPath;

            // 記錄有多少在線的 worker
            this.worker;
            this.jobList = [];
            this.currentJob;
            //----------------------------
            this.__construct();
        }
        //----------------------------------------------------------------------
        // 類別方法
        (function (fn) {
            // 單例
            fn.$$instance;

            // 取得單例
            fn.get_instance = function () {
                if (fn.$$instance == null) {
                    fn.$$instance = new WorkerCEO();
                }
                return fn.$$instance;
            };
        })(WorkerCEO);
        //----------------------------------------------------------------------

        (function () {
            this.__construct = function () {
                if (!this.scriptUrl) {
                    throw new Error('no get _.scriptUrl');
                }

                if (!this.workerUrl) {
                    throw new Error('no get _.workerUrl');
                }
            };
            //------------------------------------------------------------------
            // 返回 promise
            this.addJob = function (args) {
                // 檢查是否有 worker 運作中
                this._checkWorker();

                let job = new Job(this, args);

                if (typeof this.jobList[0] === 'string') {
                    // 正有 worker 操作中
                    // 把任務加入就好
                    let str = this.jobList.shift();
                    this.jobList.unshift(job);
                    this.jobList.unshift(str);
                } else {
                    // worker 處在暫停中

                    // 把任務加入
                    this.jobList.unshift(job);
                    this._goNextJob();
                }
                //----------------------------
                return job.promise;
            };
            //------------------------------------------------------------------
            // 檢查是否有 worker 運作中
            this._checkWorker = function () {

                if(this.worker != null){
                    return;
                }

                this.worker = new Worker(this.workerUrl);
                this.worker.addEventListener('message', this._getCallback());
                this.worker.addEventListener('error', this._getErrorCallback());
            };
            //------------------------------------------------------------------
            // 往下一個任務邁進
            this._goNextJob = function () {

                if (this.jobList.length <= 0) {
                    // 沒任務了

                } else {
                    // 有任務存在

                    // 標示為正在忙碌中
                    this.jobList.unshift('inprogress');
                    this.currentJob = this.jobList.pop();
                    this.currentJob.start();
                }
            };

            //------------------------------------------------------------------
            this._getCallback = function () {
                return (function (e) {
                    debugger;

                    let data = e.data;
                    let res;
                    if (typeof data.res !== 'undefined') {
                        res = data.res;
                    }
                    this.currentJob.resolve(res);
                    this.currentJob = null;

                    // 去掉忙碌的標示
                    while (typeof this.jobList[0] === 'string') {
                        this.jobList.shift();
                    }
                    // 還有任務嗎
                    this._goNextJob();
                }).bind(this);
            };
            //------------------------------------------------------------------
            this._getErrorCallback = function () {
                return (function (e) {
                    debugger;
                    alert('error');
                    this.currentJob.reject(e);
                }).bind(this);
            };
        }).call(WorkerCEO.prototype);
        ////////////////////////////////////////////////////////////////////////
        function Job(ceo, args) {
            this.ceo = ceo;
            this.fn;
            this.args;
            this.promise;
            this._resovle;
            this._reject;
            //----------------------------
            this.__construct(args);
        }
        //----------------------------------------------------------------------
        (function () {
            this.__construct = function (args) {
                this.fn = args.shift();


                if (typeof (_[this.fn] !== "function")) {
                    throw new TypeError("no this function(" + this.fn + ")");
                }

                this.args = args;


                let self = this;

                // 建立一個 promise
                this.promise = new Promise(function (res, rej) {
                    debugger;
                    self._resovle = function (data) {
                        res(data);
                    };
                    self._reject = function (e) {
                        rej(e);
                    }
                });
            };
            //------------------------------------------------------------------
            // 對 worker 發出命令
            this.start = function () {
                let command = {
                    scriptUrl: (this.ceo.scriptUrl),
                    fn: (this.fn),
                    args: (this.args)
                };
                this.ceo.worker.postMessage(command);
            };
            //------------------------------------------------------------------
            this.resolve = function (data) {
                this._resovle(data);
            };
            //------------------------------------------------------------------
            this.reject = function (e) {
                this._reject(e);
            };
        }).call(Job.prototype);

    }

})(this || {});
