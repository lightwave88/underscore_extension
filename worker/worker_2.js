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
            debugger;
            let data = e.data || {};
            //----------------------------
            // 必要的參數
            let scriptPath = data['scriptPath'] || null;
            let extensionPath = data["extensionPath"] || null;
            let command = data['command'] || '';
            let args = data.args || [];
            let id = data.id || 0;
            //----------------------------
            // load _.script
            if ($_ == null) {
                importScripts(scriptPath);
                importScripts(extensionPath);
                $_ = self._;
            }
            //----------------------------
            if (!command && typeof $_[command] !== 'function') {
                throw new TypeError('no assign fun');
            }
            // _ 的運算
            let res = $_[command].apply($_, args);
            //----------------------------
            // console.log("worker(%s) done", id);
            self.postMessage({
                res: res
            });
        });
    }
    ////////////////////////////////////////////////////////////////////////////
    function normalFactory(global, _) {

        // 非 worker 環境
        if(_.worker == null){
            _.mixin({
                // 返回 promise
                worker: function workerCommand() {
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
        }

        //======================================================================
        // 整合者
        function WorkerCEO() {
            debugger;

            // (lodash|underscode)的位置
            this.scriptPath = _.$$extension.scriptPath;

            this.extensionPath = _.$$extension.extensionPath;

            // worker.path
            this.workerPath = _.$$extension.extensionPath;

            // 最多 worker 的數量
            this.workerCount = _.$$extension.workerCount;

            // 記錄有多少在線的 worker
            this.workerList = [];
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
                debugger;
                let job = new Job(this, args);

                // 把任務加入
                this.jobList.unshift(job);
                //----------------------------
                // 檢查是否有 idle worker
                let w = this.checkIdleWorker();

                if (w) {
                    w.getJob();
                }

                return job.promise;
            };
            //------------------------------------------------------------------
            this.getJob = function () {
                if (this.jobList.length > 0) {
                    return this.jobList.pop();
                }

                return null;
            };
            //------------------------------------------------------------------
            // 檢查是否有空閒的 worker
            this.checkIdleWorker = function () {

                if (!this.jobList.length) {
                    return null;
                }

                let idleWorker;

                this.workerList.some(function (worker) {
                    if (worker.job == null) {
                        // 若有 worker 閒置中
                        idleWorker = worker;
                        return true;
                    }
                });
                //----------------------------
                if (idleWorker) {
                    console.log("have idle worker");
                    idleWorker.getJob();
                    return idleWorker;
                } else if (this.workerList.length < this.workerCount) {
                    console.log("create new worker");
                    // 沒有閒置的 worker
                    // 但已有的 worker 數量尚未達上限
                    let w = new WorkerProxy(this);
                    return w;
                } else {
                    console.log("all worker busy(%s)(%s)", this.workerList.length, this.workerCount);
                }

                return null;
            };
            //------------------------------------------------------------------
            // 新增 worker
            this.addWorker = function (w) {
                this.workerList.push(w);
            };
            //------------------------------------------------------------------
            // 移除指定的 worker
            this.removeWorker = function (workerProxy) {

                let id = workerProxy.id;

                let remain = [];

                for (let i = 0; i < this.workerList.length; i++) {
                    let w = this.workerList[i];
                    if (w.id != id) {
                        remain.push(w);
                    }
                }

                this.workerList = remain;
            };
            //------------------------------------------------------------------

        }).call(WorkerCEO.prototype);
        ////////////////////////////////////////////////////////////////////////
        // 包覆一個 worker
        // 能有更多資訊
        function WorkerProxy(ceo) {
            this.fn = WorkerProxy;
            this.id;
            this.ceo;
            this.job;
            this.worker;
            this.timeHandle;
            //-----------------------
            this.__construct(ceo);
        }
        WorkerProxy.uid = 1;
        //----------------------------------------------------------------------
        (function () {
            this.__construct = function (ceo) {
                this.ceo = ceo;
                this.id = this.fn.uid++;
                this.worker = new Worker(this.ceo.workerPath);

                this.worker.addEventListener('message', this.e_jobEnd());
                this.worker.addEventListener('error', this.e_error());

                this.ceo.addWorker(this);
            };
            //------------------------------------------------------------------
            // 接下一個任務
            this.getJob = function () {

                if (this.job != null) {
                    // 自己還在忙
                    return;
                }
                //----------------------------
                let job = this.ceo.getJob();

                if (!job && !this.timeHandle) {
                    // 若沒任務
                    // 會閒置 20秒
                    // 20 秒都沒任務就銷毀

                    this.timeHandle = setTimeout((function () {
                        this.timeHandle = undefined;
                        this.terminate();
                    }).bind(this), 20000);

                    return;
                } else {
                    // 有任務但正在閒置
                    if (this.timeHandle) {
                        clearTimeout(this.timeHandle);
                        this.timeHandle = undefined;
                    }
                }
                //----------------------------
                this.job = job;
                debugger;

                let command = this.job.getCommand();
                command.id = this.id;
                console.log("id(%s)", command.id);
                this.worker.postMessage(command);
            };
            //------------------------------------------------------------------
            this.terminate = function () {

                if (this.ceo.workerList.length == 1) {
                    // 留下1個 worker
                    return;
                }

                console.log("terminate(%s)", this.id);
                // 不需要太多的 worker 存在
                // 只要留一個就好
                this.ceo.removeWorker(this);
                this.worker.terminate();
                this.worker = undefined;
                this.id = undefined;
                this.fn = undefined;
                this.job = undefined;
                this.ceo = undefined;
            };
            //------------------------------------------------------------------
            this.e_jobEnd = function () {
                return (function (e) {
                    let job = this.job;
                    this.job = undefined;
                    //----------------------------
                    let data = e.data || {};
                    let res;
                    if (data.res != null) {
                        res = data.res;
                    }
                    job.resolve(res);

                    this.getJob();

                }).bind(this);
            };
            //------------------------------------------------------------------
            this.e_error = function () {
                return (function (e) {
                    let job = this.job;
                    this.job = undefined;

                    job.reject(e);

                    this.getJob();
                }).bind(this);
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
                this.promise = this.def.promise();
            };
            //------------------------------------------------------------------
            // 對 worker 發出命令
            this.getCommand = function () {
                let command = {
                    scriptPath: (this.ceo.scriptPath),
                    extensionPath: (this.ceo.extensionPath),
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
        }).call(Job.prototype);

    }

})(this || {});
