;
(function(global) {
    let _;
    if (typeof Window !== "undefined" && global instanceof Window) {
        if (typeof global._ === "object" || typeof global._ === "function") {
            _ = global._;
        }
    } else if (typeof module === "object") {
        // node.js
        try {
            _ = require("../lodash");
        } catch (e) {}
        //----------------------------
        if (typeof _ === "undefined") {
            try {
                _ = require("../underscore");
            } catch (e) {}
        }
        //----------------------------
        if (typeof _ === "undefined") {
            throw new Error("need require underscore or lodash");
        }
    }
    ////////////////////////////////////////////////////////////
    function factory(_) {
        _.mixin({
            gseries: gseries
        });
        //
        // function* (){
        //      yield *fn_1();
        //      yield *fn_2();
        // }
        //
        function gseries(fn, data) {

            return new Promise(function(res, rej) {
                let it = fn();
                job(data);

                //----------------------------
                function job(d) {

                    // 主要要不斷重複的步驟
                    let g = it.next(d);
                    let p = g.value;
                    // p.then(...)

                    if (g.done) {
                        res(p);
                    } else if (p instanceof Promise) {
                        p.then(function(d) {
                            job(d);
                        }, function(err) {
                            rej(err);
                        });
                    } else {
                        job(p);
                    }
                }
            });
        }

    } // factory end

})(this || {});
