import { workerSettings } from './settings_1.js';
import { WorkerManager } from './workermanager_1.js';
////////////////////////////////////////////////////////////////////////////
//
// 使用方式
// _.worker(原本 _ 的命令, 原本的參數...)
//
// 參數設定
// maxWorkers: 同時最多能跑 worker 的數量
// idleTime: worker 沒工作後多久會被銷毀
// sourceScriptPath: 告訴 worker _ 的路徑在哪
// extension1Path: 告訴 worker _.extension1 的路徑在哪
// settings: 得知所有設定的數值(唯讀)
//
////////////////////////////////////////////////////////////////////////////
function workerCommand() {
    let args = Array.from(arguments);
    let manager = WorkerManager.get_instance(workerCommand);

    // debugger;
    let p = manager.addJob(args);

    return p;
}

// 注入 _ 的工廠
function importFactory(G) {
    let _ = G._;
    let nev = G.environment;

    if (/nodejs|browser/.test(env)) {
        // 限制作用環境
        
        Object.defineProperty(workerCommand, '_', {
            get: function () {
                return _;
            },
            set: function () {

            }
        });

        _.mixin({
            worker: workerCommand
        });
    }
}

// webWorker 為了是怕與 window.Worker 撞名
export { workerCommand as webWorker, importFactory };

//----------------------------
// 對外的設定
(function (fn) {

    Object.defineProperty(fn, 'maxWorkers', {
        enumerable: true,
        configurable: true,
        get: function () {
            return workerSettings.max_workers;
        },
        set: function (count) {

            if (count < workerSettings.min_workers) {
                // throw new Error(`worker count less than minWorkersCount(${workerSettings.min_workers})`);
            }
            workerSettings.max_workers = count;
        }
    });
    //------------------
    Object.defineProperty(fn, 'idleTime', {
        enumerable: true,
        configurable: true,
        get: function () {
            return workerSettings.idleTime;
        },
        set: function (time) {
            workerSettings.idleTime = time;
        }
    });
    //------------------
    Object.defineProperty(fn, 'sourceScriptPath', {
        enumerable: true,
        configurable: true,
        get: function () {
            return workerSettings.sourceScriptPath;
        },
        set: function (path) {
            workerSettings.sourceScriptPath = path;
        }
    });
    //------------------
    Object.defineProperty(fn, 'extension1Path', {
        enumerable: true,
        configurable: true,
        get: function () {
            return workerSettings.extension1Path;
        },
        set: function (path) {
            workerSettings.extension1Path = path;
        }
    });
    //------------------
    Object.defineProperty(fn, 'settings', {
        enumerable: true,
        configurable: true,
        get: function () {
            return workerSettings;
        },
        set: function () {

        }
    });
    //------------------
    Object.defineProperty(fn, 'minWorkers', {
        enumerable: true,
        configurable: true,
        get: function () {
            return workerSettings;
        },
        set: function (count) {
            if (count > workerSettings.max_workers) {
                // throw new Error(`workers count beyond maxWorkersNum(${workerSettings.max_workers})`);
            }
            workerSettings.min_workers = count;
        }
    });
    //------------------
    // worker 必須額外載入的 script
    fn.addImportScript = function (script) {
        if (typeof (script) != 'string') {
            // throw new TypeError('_.worker.importScript arg must be string');
        }

        workerSettings.importScriptList.push(script);
    };
    //------------------
    // 要初始化幾個 workers
    // 預設是只有啟動 _.worker() 才會建立 worker
    fn.startWorkers = function (count) {

        let manager = WorkerManager.get_instance();

        manager.startWorkers(count);
    };

})(workerCommand);