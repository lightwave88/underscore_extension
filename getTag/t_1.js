// debugger;
const $util = require('util');

const NodeClass = require('./t_2');
// debugger;
const {
    NormalNode: NormalNode,
    ScriptNode: ScriptNode,
    TextNode: TextNode,
    StyleNode: StyleNode
} = NodeClass;
// debugger;
const methodList = require('./t_3b');



class X1 {
    constructor() {
        this.nodeList = [];
        this.methodList = methodList.slice();
    }

    main(content) {

        content = this._check1(content);
        debugger;

        if(typeof(content)!= 'string'){
            throw new TypeError('input must be string');
        }

        let i = 0;
        let tagStartIndex;
        let tagName;

        let _chart;
        let hasChecked = '';
        let tagArea = '';
        let textArea = '';

        while ((_chart = content[i]) !== undefined) {
            // debugger;

            hasChecked = content.substring(0, i + 1);
            console.log(hasChecked);
            //-----------------------
            if (tagStartIndex != null) {
                // 在一個可能是標籤開始的狀況下
                tagArea = content.slice(tagStartIndex, i + 1);

                // 是否有可以處理的模組
                let m = this._checkTagSolution(tagArea);

                if (m != null) {
                    debugger;

                    // 若確定 tagName
                    // 找出是否有特殊的處理方式

                    // j tagArea 之前的文字
                    let j = tagStartIndex - 1;

                    // index 是指模組已經處理到的位置
                    let { node, index } = m.find(j, tagArea, content);

                    this.nodeList.push(node);
                    tagArea = '';

                    i = index + 1;

                    tagStartIndex = undefined;
                    tagArea = '';
                    debugger;
                    continue;
                } else if (/</.test(_chart)) {
                    // 之前沒有正常 close
                    // 進入 (步驟a)
                    tagStartIndex = undefined;
                    textArea = tagArea;
                    continue;
                }
            } else {
                if (/</.test(_chart)) {
                    // (步驟a)
                    tagStartIndex = i;

                    if (textArea.length > 0) {
                        this.nodeList.push(new TextNode(textArea));
                    }

                    textArea = '';
                } else {
                    textArea += _chart;
                }
            }
            //-----------------------

            i++;
        } // end while

        return this.nodeList;
    };
    //=================================
    _check1(content){
        content = content.trim();


        return content;
    }
    //=================================
    // 找尋 tag 轉屬的模組
    // 找出他的結尾與結尾的 index
    _checkTagSolution(tagName) {
        let model = null;

        let solution = this.methodList.map(function (m) {
            // debugger;
            // console.log(m.tag);
            let res = m.checkTagType(tagName);
            return res;
        });

        console.log('(%s)共有幾組解(%d)', tagName, solution.length);

        solution = solution.filter(function(m){
            return (m != null);
        });

        console.log('(%s)找到(%d)組解: (%s)', tagName, solution.length, $util.inspect(solution));
        //------------------
        if (solution.length > 0) {
            if (solution.length > 1) {
                solution.sort(function (a, b) {
                    let a_level = a.method.level;
                    let b_level = b.method.level;
                    let res = (a_level < b_level);
                    return res;
                });
            }
            // debugger;
            model = solution[0];
            let { method, nodeName } = model;

            model = new method(nodeName);
        }
        // debugger;
        //------------------


        return model;
    };

}


module.exports = X1;
