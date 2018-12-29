const _ = require("underscore");
require("../../node_modules/underscore_extension")(_);

function P(options) {
    this.name;
    this.age;
    this.__construct(options);
}

(function () {
    this.__construct = function (options) {
        options = options || {};
        if (options.name != null) {
            this.name = options.name;
        }

        if (options.age != null) {
            this.age = options.age;
        }
    };

    this.toJSON = function () {
        let options = {
            name: (this.name),
            age: (this.age)
        };

        options = JSON.stringify(options);
        let content = `new P(${options})`;
        debugger;

        content = _.jsonStringify.evalStringify(content);

        return content;
    };
}).call(P.prototype);

let p = new P({
    name: "xyz",
    age: 20
});
debugger;





function test(){
    let r = _.jsonStringify({
        name: "ggyy",
        p: p
    });
    
    console.log(r);
    return r;
}

let res;
// res = test();

res = '{"name":"ggyy","p":new P({"name":"xyz","age":20})}';
res = _.jsonParse(res, false, [P]);

console.dir(res.p.name);