!(function (global) {

    if (typeof (module) == 'object' && module.exports) {
        // 指定 loadash|underscode 的 path
        module.exports = function (obj) {
            // 建構
            factory(obj);
        };
    } else {
        return;
    }

    function factory(_) {
        if (_.readFile == null) {
            _.mixin({
                // p1: 串接 promise
                // path: 路徑
                // code: 編碼
                readFile: function (p, path, code) {
                    if (!(p instanceof Promise)) {
                        p1 = Promise.resolve();
                    }

                    code = code || 'utf-8';
                    //------------------
                    let fs;

                    p = p.then(function (data) {
                        // 讀檔
                        let r;

                        data = data || {};
                        path = (data.path != null) ? data.path : path;
                        code = (data.code != null) ? data.code : code;

                        return new Promise(function (res, rej) {
                            fs = require('fs');
                            fs.readFile(path, code, function (err, data) {
                                if (err) {
                                    rej(err);
                                } else {
                                    res(data);
                                }
                            });
                        });

                    });

                    return p;
                }
            });
        }
        //----------------------------
        if (_.fileExists == null) {
            _.mixin({
                // p1: promise 串接
                fileExists: function (p, path) {
                    if (!(p instanceof Promise)) {
                        p = Promise.resolve();
                    }
                    //------------------
                    let fs;
                    p = p.then(function (data) {
                        return new Promise(function (res, rej) {
                            debugger;
                            fs = require('fs');

                            if (data != null) {
                                path = data;
                            }
                            // 找尋檔案
                            fs.stat(path, function (err, data) {
                                debugger;
                                if (err) {
                                    rej(err);
                                } else {
                                    let r = (data.isFile()) ? true : false;
                                    res(r);
                                }
                            });
                        });
                    });

                    return p;
                }
            });
        }
    }
})(this || {});