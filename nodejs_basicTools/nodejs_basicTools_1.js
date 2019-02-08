!(function (_global) {

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
                // path: 路徑
                // code: 編碼
                // 可在參數最後面串接 promise
                readFile: function (path, code) {

                    let args = Array.from(arguments);
                    let p = args[args.length - 1];

                    p = (p instanceof Promise) ? p : (Promise.resolve());

                    code = code || 'utf-8';
                    //------------------
                    let fs;

                    p = p.then(function (data) {
                        // 讀檔
                        let r;

                        data = (Array.isArray(data)) ? data : [];

                        path = data[0] || path;
                        cpde = data[1] || code;


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
        if (_.isFile == null) {
            _.mixin({
                // 可在參數最後面串接 promise
                isFile: function (path) {
                    let args = Array.from(arguments);
                    let p = args[args.length - 1];

                    p = (p instanceof Promise) ? p : (Promise.resolve());
                    //------------------
                    let fs;
                    p = p.then(function (data) {

                        path = (typeof (data) == "string") ? data : path;

                        return new Promise(function (res, rej) {
                            debugger;
                            fs = require('fs');

                            if (data != null) {
                                path = data;
                            }
                            // 找尋檔案
                            fs.stat(path, function (err, data) {
                                // debugger;
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
        //----------------------------
        if (_.pipeReadStream == null) {
            _.mixin({
                // 可在參數最後面串接 promise
                pipeReadStream: function pipeReadStream(path, reader, readSize, code) {

                    let def = _.deferred();

                    let args = Array.from(arguments);
                    let p = args[args.length - 1];

                    p = (p instanceof Promise) ? p : (Promise.resolve());


                    p.then(function () {
                        let source;
                        try {
                            source = fs.createReadStream(path);

                            if (code) {
                                source.setEncoding(code);
                            }
                        } catch (error) {

                            def.reject(error);

                            return;
                        }
                        //----------------------------
                        let buffer = [];
                        let pause = false;

                        source.on('readable', function () {

                            console.log('readable....');

                            let chunk;
                            //-----------------------

                            while (null !== (chunk = source.read(1024))) {
                                console.log('得到了 %d 位元組的資料準備寫入', chunk.length);

                                if (buffer.length) {
                                    console.log('想寫入, 但 buffer 未空')
                                    buffer.push(chunk);
                                } else if (pause) {
                                    console.log('被輸入勒令暫停過, 寫入 buffer')
                                    buffer.push(chunk);
                                } else {

                                    console.log('寫入')
                                    // 嘗試寫入
                                    if ((reader.write(chunk)) == false) {
                                        // 寫入已滿
                                        console.log('寫入已滿，暫停')
                                        source.pause();
                                        pause = true;
                                    }
                                }
                            }
                        });
                        //-----------------------
                        reader.on('drain', function () {
                            console.log('drain');

                            if (!writeBuffer()) {
                                // buffer 寫入時發生了寫入滿溢
                                // 暫時不要喚醒 source
                                console.log('buffer 寫入時發生了寫入滿溢');
                                return;
                            }

                            if (source.readable && source.resume) {
                                console.log('恢復輸出')
                                pause = false;
                                source.resume();
                            }
                        });
                        //-----------------------
                        source.once('error', function () {
                            def.reject();
                        });

                        //-----------------------
                        source.once('end', function () {
                            def.resolve();
                        });

                        //-----------------------
                        function writeBuffer() {
                            let chunk;
                            while (buffer.length) {
                                console.log('proxy寫入');
                                chunk = buffer[0]
                                buffer.shift();

                                if (false == reader.write(chunk)) {
                                    console.log('proxy寫入太滿');
                                    return false;
                                }
                            }

                            return true;
                        }
                    });

                    return def.promise();
                }
            });
        }
        //----------------------------
    }
})(this || {});