
import { workerSettings } from './settings_1.js';
import { WorkerClass } from './workerProxy_2.js';
import { Job } from './Job_1.js';

const _ = window._;

class WorkerManager {

    static get_instance(workerCommand) {
        if (WorkerManager.instance == null) {
            WorkerManager.instance = new WorkerManager(workerCommand);
        }
        return WorkerManager.instance;
    }
    //------------------------------------------------------------------
    constructor(workerCommand) {

        // 與外界橋接的橋樑
        this.workerCommand = workerCommand;

        this._;

        this.environment;

        this.max_workersNum;

        this.min_workersNum;

        // 記錄有多少在線的 worker
        this.workers = new Set();

        // 正在閒置中的 workers(等死中)
        // this.idleWorks = new Set();
        this.jobList = [];

        // 因應各種環境引入不同的 worker
        // 一個重要的設計點
        this.workerClass;

        //-----------------------
        this._getSettings();
    }
    //------------------------------------------------------------------
    _getSettings() {
        const $s = workerSettings;

        this._ = this.workerCommand._;

        if (this._ == null) {
            // throw new Error('no connection with _');
            console.log('no connection with _');
        }

        try {
            this.environment = this._.$extension1.info.environment;
        } catch (error) {
            console.log(error);
        }

        // 最多 worker 的數量
        this.max_workersNum = $s.max_workers;

        this.min_workersNum = $s.min_workers;

        //-----------------------
        // 取得適合當前環境下的 workerClass
        if (this.environment == null) {

            // 測試
            // 採用適合 browser 狀態的 workerClass
            this.workerClass = WorkerClass.WebWorkerProxy;

        } else if (/nodejs/.test(this.environment)) {
            // 採用適合 node.js 狀態的 workerClass

            this.workerClass = WorkerClass.NodeJsWorkerProxy;

        } else if (/browser/.test(this.environment)) {
            // 採用適合 browser 狀態的 workerClass
            this.workerClass = WorkerClass.WebWorkerProxy;
        } else {
            throw new Error(`unsupport env ${this.environment}`);
        }

    }
    //------------------------------------------------------------------
    addJob(args) {
        // debugger;
        console.log('--------------');
        console.log('WorkerManager> 加入工作');

        let job = new Job(this, args);

        // 把任務加入
        this.jobList.unshift(job);
        //----------------------------
        // 檢查是否有 idle worker
        this.noticeWorkers_checkJob();

        return job.promise();
    };
    //------------------------------------------------------------------
    // 預先不會在一開始啟動 workers
    // 通常只有在有指令後才會有 workers 待命
    // 不過可以事先就請 workers 待命
    startWorkers(count) {
        if (this.workers.size > 0) {
            throw new Error(`workers exists`);
        }

        workerSettings.min_workers = count;

        for (let i = 0; i < this.min_workersNum; i++) {
            new this.workerClass(this, true);
        }
    }
    //------------------------------------------------------------------
    // 清工作人員注意是否有工作進來
    noticeWorkers_checkJob(worker) {
        if (worker == null) {
            console.log('noticeWorkers_checkJob by manager');
        } else {
            console.log('------> noticeWorkers_checkJob by worker(%s)', worker.id);
        }

        console.log('still have jobs(%s)', this.jobList.length);

        if (this.jobList.length < 1) {
            return;
        }
        let w = this._checkIdleWorker();

        if (w) {
            let job = this.jobList.pop();
            w.takeJob_callByManager(job);
        }
    }

    //------------------------------------------------------------------
    // 新增 worker
    addWorker(workerProxy) {
        this.workers.add(workerProxy);
    }
    //------------------------------------------------------------------
    // 移除指定的 worker
    removeWorker(workerProxy) {
        this.workers.delete(workerProxy);
    }
    //------------------------------------------------------------------
    // worker 想取得 job
    getJob_callByWorker = function () {
        let job = null;
        let $this = this;

        console.log('有(%s)項工作待領', this.jobList.length);

        if (this.jobList.length > 0) {
            job = this.jobList.pop();
        }

        return job;
    }
    //------------------------------------------------------------------
    // 檢查是否有空閒的 worker
    _checkIdleWorker() {
        // debugger;

        let idleWork;
        // 找尋空嫌中的 worker
        let idleWorks = this.findIdleWorkers();

        if (idleWorks.length > 0) {
            console.log('have idle w');

            // 優先找正職者
            idleWorks.some(function (w) {
                if (w.employment) {
                    idleWork = w;
                    return true;
                }
            });

            return (idleWork || idleWorks[0]);
        }
        //----------------------------

        // 沒有空閒中的 worker
        if (this.workers.size < this.max_workersNum) {
            // 沒有閒置的 worker
            // 但已有的 worker 數量尚未達上限
            console.log("no idle worker, create new worker.........");

            let employment = false;

            if (this.workers.size < this.min_workersNum) {
                // 正職還有缺額
                employment = true;
            }

            new this.workerClass(this, employment);
        } else {
            console.log('no idle worker and reachmax workers........');
        }
    }
    //------------------------------------------------------------------
    // 找出閒置中的 worker
    findIdleWorkers() {

        let workers = Array.from(this.workers);

        workers = workers.slice();

        workers = workers.filter(function (w) {
            if (w.isReady2TakeJob()) {
                return true;
            }
        });
        return workers;
    }
    //------------------------------------------------------------------
    // 取得需要的資訊
    getAllworkersInfo() {
        let allCount = this.workers.size;

        let idleCount = 0;
        let busyCount = 0;
        // let waitDeadthCount = 0;

        let workers = Array.from(this.workers);

        workers = workers.slice();

        workers = workers.forEach(function (w) {
            if (w.isBusy()) {
                ++busyCount;
            }

            if (w.isReady2TakeJob()) {
                ++idleCount;
            }
        });

        return {
            all: allCount,
            idle: idleCount,
            busy: busyCount,
            jobCount: (this.jobList.length),
        }
    }
}

WorkerManager.instance;

export { WorkerManager };


