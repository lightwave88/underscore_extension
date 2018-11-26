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
            debugger;
            let it_2 = job(fn);
            it_2.next();


            function* job(fn, self_it) {
                debugger;
                let it = fn();

                while (true) {

                    let g = it.next();
                    let p = g.value;

                    if (p instanceof Promise) {
                        p.then(function() {
                            it_2.next();
                        });
                    }
                    yield;
                }
            }
        }

    }

})(this || {});
