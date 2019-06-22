
let $workerSettings = (function () {
    const w = {};

    // 同時能運行最大的 worker 數量
    w.max_workers = 2;

    // idle 時要維持幾個 workers 待命
    w.min_workers = 0;

    // 當 worker 沒任務可接時
    // 閒置多久後會被銷毀
    w.idleTime = (1000 * 2);

    // (uderscore, lodash) url
    w.sourceScriptPath;

    // extension1.url
    w.extension1ScriptPath;

    // 要被 import 的 script
    w.importScriptList = [];

    return w;
})();


function check(t) {
    const errorList = [];

    if (typeof t.max_workers != 'number') {
        errorList.push('workerSettings.max_workers must be number');
    }

    if (typeof t.min_workers != 'number') {
        errorList.push('workerSettings.min_workers must be number');
    }

    if (typeof t.idleTime != 'number') {
        errorList.push('workerSettings.idleTime must be number');
    }

    if (t.max_workers < 1) {
        errorList.push('workerSettings.max_workers must >= 1');
    }

    if (t.max_workers < t.min_workers) {
        errorList.push('workerSettings.max_workers cant be < workerSettings.min_workers');
    }

    if (t.idleTime < 0) {
        errorList.push('workerSettings.idleTime must >= 0');
    }

    if(errorList.length > 0){
        throw new Error(errorList.join('|'));
    }
}


const workerSettings = new Proxy($workerSettings, {
    set: function (t, k, v) {
        t[k] = v;

        check(t);

        return true;
    }
});

export { workerSettings };