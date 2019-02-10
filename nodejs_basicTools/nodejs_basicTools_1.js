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
                    //------------------
                    path = (path instanceof Promise) ? null : path;
                    code = (code instanceof Promise) ? null : code;
                    //------------------
                    let fs;

                    p = p.then(function (data) {
                        // 讀檔
                        let r;

                        if (Array.isArray(data)) {
                            path = (data[0] == null) ? path : data[0];
                            code = (data[1] == null) ? code : data[1];
                        }

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
                    path = (path instanceof Promise) ? null : path;
                    //------------------
                    let fs;
                    p = p.then(function (data) {
                        debugger;

                        if (Array.isArray(data) && data[0] != null) {
                            path = data[0];
                        }

                        return new Promise(function (res, rej) {
                            // debugger;
                            fs = require('fs');

                            // 找尋檔案
                            fs.stat(path, function (err, data) {
                                // debugger;
                                if (err) {
                                    rej(err);
                                } else {
                                    if (data.isFile()) {
                                        res(true)
                                    } else {
                                        rej('not file')
                                    }
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
                readStreamPipe: function pipeReadStream(path, reader, readSize, code) {
                    debugger;

                    let def = _.deferred();
                    let p1 = def.promise();

                    let args = Array.from(arguments);
                    let p = args[args.length - 1];
                    p = (p instanceof Promise) ? p : (Promise.resolve());
                    //----------------------------
                    path = (path instanceof Promise) ? null : path;
                    reader = (reader instanceof Promise) ? null : reader;
                    readSize = (readSize instanceof Promise) ? null : readSize;
                    code = (code instanceof Promise) ? null : code;
                    //----------------------------
                    let source;
                    let buffer = [];
                    let pause = false;
                    const fs = require('fs');
                    //----------------------------

                    p.then(function (data) {
                        debugger;
                        // 主要任務

                        if (Array.isArray(data)) {
                            path = (data[0] == null) ? path : data[0];
                            reader = (data[1] == null) ? reader : data[1];
                            readSize = (data[2]) ? readSize : data[2];
                            code = (data[3]) ? code : data[3];
                        }
                        try {
                            readStrean();
                        } catch (error) {
                            def.reject(error);
                            return;
                        }
                        // debugger;

                        // 綁定事件
                        bindEvent();

                    }, function (err) {
                        debugger;

                        def.reject();
                    });

                    return p1;
                    //----------------------------
                    function readStrean() {
                        source = fs.createReadStream(path);

                        if (code) {
                            source.setEncoding(code);
                        }
                    }
                    //----------------------------
                    function bindEvent() {
                        source.on('readable', e_readableJob);

                        reader.on('drain', e_drainJob);

                        source.once('error', function () {
                            def.reject();
                        });

                        source.once('close', function () {
                            checkEnd();
                        });
                    }
                    //----------------------------
                    function e_readableJob() {
                        console.log('readable....');

                        let chunk;
                        //-----------------------
                        while (null !== (chunk = source.read(readSize))) {
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
                    }
                    //----------------------------
                    // 當讀取空出來
                    function e_drainJob() {
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
                    }
                    //----------------------------
                    // 把自定義的 buffer
                    function writeBuffer() {

                        while (buffer.length > 0) {
                            let chunk = buffer.shift();
                            
                            console.log('proxy寫入(%s)', chunk.length);

                            if (false == reader.write(chunk)) {
                                console.log('proxy寫入太滿');
                                return false;
                            }
                        }
                        return true;
                    }
                    //----------------------------
                    function checkEnd() {
                        if (buffer.length > 0) {
                            console.log('傳送結束，但 buffer 尚未清空(%d)', buffer.length);
                            setImmediate(checkEnd);
                        } else {

                            reader.removeListener('drain', e_drainJob);
                            source.removeListener('readable', e_readableJob);
                            source = null;

                            def.resolve();
                        }
                    }
                    //----------------------------
                } // end pipeReadStream
            });
        }
        //----------------------------
    }
})(this || {});