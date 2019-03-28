const $NodeClass = require('../node_1');


// 簡單快速的查找
class FindCommandTags{
    constructor(){
        this.nodeList = [];

        let regs = this.regList = [];

        regs[0] = /(?:<(script)(?:>|\s+[^>]+>))/;
        regs[1] = /(?:<(%)\s)/;
        regs[2] = /<(?:(%=)\s)/;
        regs[3] = /<(?:(%-)\s)/;

        this.reg_1;

        this._initReg();

        this._initNodeList();
    }
    //=================================
    solution(content) {

        content = this._check1(content);

        // 從文字內容找出所有的 tag
        this._findTags(content);

        return this.nodeList;
    }
    //=================================
    _initReg(){
        let regList = [];

        this.regList.forEach(function(r){
            regList.push(r.source);
        });

        let regContent = regList.join('|');
        this.reg_1 = RegExp(regContent);

        /(?:<(script)(?:>|\s+[^>]+>))|(?:<(%)\s)|<(?:(%=)\s)|<(?:(%-)\s)/
    }
    //=================================
    _initNodeList() {
        let $this = this;
        // 監視 nodeList.push()
        let arrayProtoClone = Object.create(Array.prototype);

        (function (o, method) {
            Object.defineProperty(o, method, {
                enumerable: false,
                writable: true,
                configurable: true,
                value: function (v) {
                    let args = Array.from(arguments);

                    let last = this[this.length - 1];

                    if ((last instanceof $NodeClass.TextNode) && (v instanceof $NodeClass.TextNode)) {
                        this[this.length - 1] = last.merge(v);
                        return this[this.length - 1];
                    } else {
                        let originalFn = Array.prototype[method];
                        return originalFn.apply(this, args);
                    }
                }
            });
        })(arrayProtoClone, 'push');

        Object.setPrototypeOf(this.nodeList, arrayProtoClone);
    }
    //=================================
    _check1(content) {
        if (typeof (content) != 'string') {
            throw new TypeError('input must be string');
        }
        content = content.trim();
        return content;
    }
    //=================================
    _findTags(content){
        let _content = content.slice(0);

        let reg_res;
        while(_content.length > 0 &&
            (reg_res = this.reg_1.exec(_content)) != null){

            let index = reg_res.index;
            let tagName = reg_res[1] || reg_res[2] || reg_res[3] || reg_res[4];

            if(index > 0){
                // 形成 TextNode
                let text = _content.substring(0, index);
            }

            let rightContent = _content.substring(index);

            _content = this._findTag(rightContent, tagName);
        }

    }

    // 從 rightContent 取出 tag 並切出露面的 content
    _findTag(rightContent, tagName){

    }

}

//================================================
module.exports = function(){

};
