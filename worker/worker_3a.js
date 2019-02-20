!(function (global) {
    // debugger;
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
        } else if (typeof (window) == 'undefined' && typeof (self) != "undefined" &&
            typeof (importScripts) == 'function') {
            // webWorker 環境
            // debugger;

            if (typeof (global._) === "undefined") {
                // worker 本體初始建構
                workerFactory(global);
            }
            return;
        } else if (typeof window !== "undefined" && typeof document !== "undefined") {
            // web 環境
            if (typeof window._ === undefined) {
                throw new TypeError("need import lodash or underscode");
            }
            _ = window._;
            normalFactory(global, _);

        } else {
            throw new TypeError("not support your system");
        }
    }());
    ////////////////////////////////////////////////////////////////////////////
    // node.js 環境
    function nodeJsFactory(_) {
        _.mixin({
            // 返回 promise
            worker: function () {
                throw new Error("_.worker() not support node.js yet");
            }
        });
    }
    ////////////////////////////////////////////////////////////////////////////
    function workerFactory(global) {
        // worker 本體
        console.log('i am worker');
        let $_;

        self.addEventListener('message', function (e) {
            // debugger;
            
            console.log('---------------');
            console.log('worker> get web message');
            
            let data = e.data || {};
            //----------------------------            
            let scriptPath = data['scriptPath'] || null;
            let extensionPath = data["extensionPath"] || null;
            let command = data['command'] || '';
            let args = data.args || [];
            let id = data.id || 0;
            //----------------------------
            // load _.script
            if ($_ == null) {
                console.log('worker(%s)> init', id);

                if(scriptPath){
                    console.log('worker(%s)> import script', id);
                    // 初始化
                    importScripts(scriptPath);
                    importScripts(extensionPath);
                    $_ = self._;
                }else{
                    console.log('worker(%s)> no scriptPath', id);
                }

                self.postMessage({});

            } else {
                // debugger;

                console.log('worker(%s)> do job', id);

                if (!command && typeof $_[command] !== 'function') {
                    throw new TypeError('no assign fun');
                }
                // debugger;
                // _ 的運算
                let res = $_[command].apply($_, args);
                //----------------------------
                // console.log("worker(%s) done", id);
                self.postMessage({
                    res: res
                });
            }
            
            console.log('---------------');

        });
    }
    ////////////////////////////////////////////////////////////////////////////
    function normalFactory(global, _) {

        // 非 worker 環境
        if (_.worker == null) {
            _.mixin({
                // 返回 promise
                worker: workerCommand
            });
        }

        function workerCommand() {
            // debugger;
            let args = Array.from(arguments);
            let ceo = WorkerCEO.get_instance();

            // debugger;
            let p = ceo.addJob(args);

            return p;
        }
        //======================================================================
        // 類別方法
        (function (fn) {
            // 設置/取得 worker 最大運行數量
            fn.maxWorkers = function (count) {

                if (count == null) {
                    return _.$$extension.max_workers;
                } else {
                    if (typeof (count) != 'number') {
                        throw new TypeError('args[0] type error');
                    }

                    count = Math.floor(count);
                    count = Math.abs(count);
                    _.$$extension.max_workers = count;
                }
            };

            fn.idleTime = function(time){
                if(time == null){
                    return WorkerCEO.idleTime;
                }
                WorkerCEO.idleTime = time;
            };
        })(workerCommand);

        //======================================================================
        // 整合者
        function WorkerCEO() {
            // debugger;

            // (lodash|underscode)的位置
            this.scriptPath = _.$$extension.scriptPath;

            this.extensionPath = _.$$extension.extensionPath;

            // worker.path
            this.workerPath = _.$$extension.extensionPath;

            // 最多 worker 的數量
            this.workerCount = _.$$extension.max_workers;

            // 記錄有多少在線的 worker
            this.workers = new Set();

            // 正在閒置中的 workers(等死中)
            // this.idleWorks = new Set();
            this.jobList = [];
            //----------------------------
            this.__construct();
        }
        //----------------------------------------------------------------------
        // 類別方法
        (function (fn) {
            // 單例
            fn.$$instance;

            fn.idleTime = 30000;

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
                // debugger;
                if (!this.scriptPath) {
                    throw new Error('no get _.scriptPath');
                }

                if (!this.workerPath) {
                    throw new Error('no get _.workerPath');
                }

                if (!_.isNumber(this.workerCount) || this.workerCount < 1) {
                    throw new Error("workerCount set error");
                }
            };
            //------------------------------------------------------------------
            // 返回 promise
            this.addJob = function (args) {
                // debugger;
                console.log('--------------');
                console.log('WorkerCEO> 加入工作');

                let job = new Job(this, args);

                // 把任務加入
                this.jobList.unshift(job);
                //----------------------------
                // 檢查是否有 idle worker
                let w = this._checkIdleWorker();

                if (w) {
                    w.getJob();
                }
                console.log('--------------');
                return job.promise();
            };

            //------------------------------------------------------------------
            // 新增 worker
            this.addWorker = function (workerProxy) {
                this.workers.add(workerProxy);
            };
            //------------------------------------------------------------------
            // 移除指定的 worker
            this.removeWorker = function (workerProxy) {
                this.workers.delete(workerProxy);
            };
            //------------------------------------------------------------------
            // 取得 job
            this._getJob = function () {
                if (this.jobList.length > 0) {
                    return this.jobList.pop();
                }

                return null;
            };
            //------------------------------------------------------------------
            // 檢查是否有空閒的 worker
            this._checkIdleWorker = function () {
                let idleWork = null;
                // 找尋空嫌中的 worker
                let idleWorks = this._findIdleWorkers();

                if(idleWorks.length > 0){
                    idleWork = idleWorks[0]; 
                }
                //----------------------------
                if (idleWork) {
                    console.log("have idle worker(%s) idleWorkers.number(%s)...........", idleWork.id, idleWorks.length);
                    return idleWork;
                } else {
                    // 沒有空閒中的 worker
                    if (this.workers.size < this.workerCount) {
                        // 沒有閒置的 worker
                        // 但已有的 worker 數量尚未達上限
                        console.log("no idle worker, create new worker.........");
                        new WorkerProxy(this);
                    } else {
                        console.log('no idle worker and reachmax workers........');
                    }
                }

                return null;
            };
            //------------------------------------------------------------------
            // 找出閒置中的 worker
            this._findIdleWorkers = function () {
                
                let workers = Array.from(this.workers);

                workers = workers.slice();

                workers = workers.filter(function (w) {
                    if (!w.busy) {                        
                        return true;
                    }
                });

                return workers;
            };
        }).call(WorkerCEO.prototype);
        ////////////////////////////////////////////////////////////////////////
        // 主要重點之一
        // 包覆一個 worker
        // 能有更多資訊
        function WorkerProxy(ceo) {
            this.fn = WorkerProxy;
            this.id;
            this.ceo;
            this.job;
            this.worker;
            this.busy = false;
            this.timeHandle;
            this.e_end;
            this.e_error;
            //-----------------------
            this.__construct(ceo);
        }
        WorkerProxy.uid = 1;
        //----------------------------------------------------------------------
        (function () {
            this.__construct = function (ceo) {
                this.ceo = ceo;
                this.id = this.fn.uid++;
                //------------------
                this.worker = new Worker(this.ceo.workerPath);

                this.worker.addEventListener('error', this._getErrorEvent());
                this.worker.addEventListener('message', this._getEndEvent());
                //------------------
                this.ceo.addWorker(this);

                // 初始化 worker
                // 叫 worker import _
                
                this.busy = true;
                
                console.log('worker(%s) init', this.id);
                // 請 worker 初始化
                this.worker.postMessage({
                    id: (this.id),
                    scriptPath: (this.ceo.scriptPath),
                    extensionPath: (this.ceo.extensionPath)
                });
            };
            //------------------------------------------------------------------
            // CEO 請他接下一個任務
            this.getJob = function () {
                this._check();
            };

            //------------------------------------------------------------------
            this._check = function () {
                console.log('worker(%s)進入檢查', this.id)

                // 檢查是否有任務
                let job = this.ceo._getJob();

                if (job == null) {
                    if (this.ceo.workers.size == 1) {
                        // 只留下1個 worker時
                        // 就不讓他等死

                        console.log('worker(%s)沒工作，但只剩我一人，等接工作', this.id);
                        return;
                    } else {
                        console.log('worker(%s)沒工作，進入 idle', this.id)
                        // 等死吧
                        this._idle();
                    }
                } else {
                    console.log('worker(%s)接工作', this.id);
                    this._doJob(job);
                }
            };
            //------------------------------------------------------------------
            this._doJob = function (job) {
                
                if (this.timeHandle) {
                    console.log('worker(%s)俺正在 idle，被叫起來接工作', this.id);
                    // 若正在閒置中
                    clearTimeout(this.timeHandle);
                    this.timeHandle = undefined;
                }
                
                this.busy = true;
                this.job = job;
                // debugger;

                let command = this.job.getCommand();
                command.id = this.id;
                console.log("id(%s)", command.id);
                console.log('worker(%s) 我發出任務', this.id);
                
                // 請 worker 工作
                this.worker.postMessage(command);
            };
            //------------------------------------------------------------------
            // 進入 idle 狀態
            // 若已在 idle 狀態中，就不動作
            this._idle = function () {
                console.log('worker(%s)進入 idle', this.id);
                if (this.timeHandle) {
                    console.log('worker(%s)問題點', this.id);
                    return;
                }
                let self = this;

                this.timeHandle = setTimeout(function () {
                    self.timeHandle = undefined;
                    self._terminate();
                }, this.ceo.idleTime);
            };
            //------------------------------------------------------------------
            this._terminate = function () {

                console.log('worker(%s) in terminate', this.id);

                if (this.ceo.workers.size == 1) {
                    console.log('worker(%s) 只剩俺一個人，等事做', this.id);
                    // 只留下1個 worker時
                    // 就不刪除
                    return;
                }
                //-----------------------
                let idleWorks = this.ceo._findIdleWorkers();

                idleWorks = new Set(idleWorks);

                console.log('worker(%s)  idles(%s) hasme(%s)', this.id, idleWorks.size, idleWorks.has(this));

                if (idleWorks.size <= 1 && idleWorks.has(this)) {
                    // 大家都在忙，只剩我一個人有空
                    // 不要終結自己，等待工作
                    console.log('worker(%s) 大家都在忙，有空的只剩我一個人，再進入 idle', this.id);
                    this._idle();
                    return;
                }
                //-----------------------
                console.log("worker(%s) terminate", this.id);
                this.worker.removeEventListener('message', this._getEndEvent());
                this.worker.removeEventListener('error', this._getErrorEvent());

                this.ceo.removeWorker(this);
                this.worker.terminate();
                this.worker = undefined;
                this.id = undefined;
                this.fn = undefined;
                this.job = undefined;
                this.ceo = undefined;
            };
            //------------------------------------------------------------------
            this._getEndEvent = function () {
                if (this.e_end == null) {
                    // worker 工作完會呼叫此
                    this.e_end = (function (e) {

                        let job = this.job;
                        this.job = undefined;
                        this.busy = false;
                        //----------------------------
                        let data = e.data || {};
                        let res;

                        if(job){
                            // 等待 worker 的工作完成
                            console.log('worker(%s) job finished', this.id);
                            if (typeof (data.res) != 'undefined') {
                                res = data.res;
                            }
                            job.resolve(res);
                        }else{
                            // 等待 worker 初始化完成
                            console.log('worker(%s) inited', this.id)
                        }

                        this._check();
                    }).bind(this);
                }

                return this.e_end;
            };
            //------------------------------------------------------------------
            this._getErrorEvent = function () {

                if (this.e_error == null) {
                    // worker error 完會呼叫此
                    this.e_error = (function (e) {
                        let job = this.job;
                        this.job = undefined;
                        this.busy = false;

                        if(job){
                            console.log('worker(%s) job error', this.id);
                            // 等待 worker 的工作錯誤
                            job.reject(e);                            
                        }else{
                            // 等待 worker 初始化錯誤
                            console.log('worker(%s) inited error', this.id);
                        }

                        this._check();
                    }).bind(this);
                }
                return this.e_error;
            };
        }).call(WorkerProxy.prototype);
        ////////////////////////////////////////////////////////////////////////
        function Job(ceo, args) {
            this.ceo = ceo;
            this.command;
            this.args;
            this.def;
            this.promise;
            this._resovle;
            this._reject;
            //----------------------------
            this.__construct(args);
        }
        //----------------------------------------------------------------------
        (function () {
            this.__construct = function (args) {

                this.command = args.shift();

                // console.log(typeof (_[this.command]));

                if (typeof (_[this.command]) !== "function") {
                    throw new TypeError("no this function(" + this.command + ")");
                }

                this.args = args;
                this.def = _.deferred();
            };
            //------------------------------------------------------------------
            // 對 worker 發出命令
            this.getCommand = function () {
                let command = {
                    command: (this.command),
                    args: (this.args)
                };
                return command;
            };
            //------------------------------------------------------------------
            this.resolve = function (data) {
                this.def.resolve(data);
            };
            //------------------------------------------------------------------
            this.reject = function (e) {
                this.def.reject(e);
            };
            //------------------------------------------------------------------
            this.promise = function () {
                return this.def.promise();
            };
        }).call(Job.prototype);

    }

})(this || {});
