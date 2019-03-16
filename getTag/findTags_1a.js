// debugger;
const $util = require('util');

const {
    NormalNode,
    EndNode,
    TextNode,
    StyleNode,
    UnknowNode,
    CommentNode,
    ScriptNode,
} = require('getTag/node');
// debugger;
const methodList = require('getTag/methods');


// 主要在分離出所有的 tag
class FindTags {
    constructor() {
        this.nodeList = [];
        this.methodList = methodList.slice();
    }
    //=================================
    main(content) {

        content = this._check1(content);

        // 從文字內容找出所有的 tag
        this._findTags(_findTags(content));

        return this.nodeList;
    };
    //=================================
    _check1(content) {

        if (typeof (content) != 'string') {
            throw new TypeError('input must be string');
        }

        content = content.trim();
        return content;
    }
    //=================================
    // 從文字內容找出所有的 tag
    _findTags(content) {
        let i = 0;

        let _chart;
        let leftContent = '';
        let rightContent = '';

        let tagArea = '';
        let textArea = '';

        //-----------------------
        // 重要參數

        // 是否在 attr 內部
        // 在 attr 內部 <> 不起作用
        // attr 要起作用 \w=""
        let inAttr = 0;
        let attrSymbol;
        let tagStartIndex;

        let findMode = false;

        //-----------------------
        while ((_chart = content[i]) !== undefined) {
            // debugger;

            console.log('-------');
            leftContent = content.substring(0, i + 1);
            rightContent = content.substring(i);
            console.log('已檢查過(%s)', leftContent);
            //-----------------------


            // 很重要的部分必須確認是否在 attr 內
            if (tagStartIndex != null) {
                // 在 < 之後
                // 暫無法辨認出 tag(譬如 <!-------->)
                // 在一個可能是標籤開始的狀況下

                tagArea = content.substring(tagStartIndex, i + 1);

                if (inAttr < 1) {
                    // 在 attr 外
                    // 取樣判斷是否進入 attr
                    let res = /\s[^\s\/>]+?\s*?=\s*?(["'])$/.exec(tagArea);

                    if (res != null) {
                        //進入 attr

                        // 不用再去找模組了
                        // 加快速度
                        findMode = false;
                        inAttr++;
                        attrSymbol = RegExp(res[1]);
                    }
                } else {
                    // 在 attr 裡面
                    if (attrSymbol.test(_chart)) {
                        inAttr--;
                        attrSymbol = undefined;
                    }
                }
                //------------------

                if (findMode) {
                    // 在搜尋模式中
                    // 是否有可以處理的模組


                    let { node, index } = this._findTagSolution_2(tagArea, tagStartIndex, content);

                    if (node != null) {
                        // debugger;
                        // 若有解
                        // index 是指模組已經處理到的位置

                        this.nodeList.push(node);

                        // 跳過已經確定過的區域
                        i = index + 1;
                        //-----------------------
                        // reset
                        tagArea = '';
                        tagStartIndex = undefined;

                        debugger;
                        continue;
                    }
                }
                //------------------
                if (inAttr < 1 && />/.test(_chart)) {
                    // 標籤結尾
                    // 沒有被辨識出的標籤
                    tagStartIndex = undefined;
                    this.nodeList.push(new UnknowNode(textArea));
                }

            } else {
                // 在標籤外

                if (/</.test(_chart)) {
                    debugger;

                    // 發現可能的起始標籤

                    if (textArea.length > 0) {
                        console.log('產生 textNode(%s)', textArea);
                        this.nodeList.push(new TextNode(textArea));
                    }
                    textArea = '';
                    //------------------

                    let reg_res = /<(\/)?([^\s>/]+?)(?:\s|\/|>)/.exec(rightContent);
                    if (reg_res != null) {
                        // 若能確定 tagname
                        // 避免進入 this._findTagSolution_2() 這更耗時的找法                        
                        let { node, index } = _findTagSolution_1(i, rightContent, reg_res);
                        this.nodeList.push(node);
                        i = index + 1;
                        continue;

                    } else {

                        // (步驟a)
                        tagStartIndex = i;
                        findMode = true;
                    }

                } else {
                    textArea += _chart;
                }
            }
            //-----------------------

            i++;
        } // end while
        //-----------------------
        if (tagStartIndex != null) {
            throw new Error('html have problem');
        }
    }
    //=================================
    _findTagSolution_1(i, rightContent, reg_res) {
        let res = {
            node: null,
            index: null
        };

        let endTag = (reg_res[1] == null) ? true : false;
        let nodeName = reg_res[2].toLowerCase();
    }
    //=================================
    // 找尋 tag 轉屬的模組
    // 找出他的結尾與結尾的 index
    _findTagSolution_2(tagArea, tagStartIndex, content) {
        let model = null;
        let res = {
            node: null,
            index: null
        };
        //------------------
        let solution = this.methodList.map(function (m) {
            // debugger;
            // console.log(m.tag);
            let res = m.checkTagType(tagArea);
            return res;
        });

        console.log('(%s)共有幾組解(%d)', tagArea, solution.length);

        solution = solution.filter(function (m) {
            return (m != null);
        });

        console.log('(%s)找到(%d)組解: (%s)', tagArea, solution.length, $util.inspect(solution));
        //------------------
        if (solution.length > 0) {
            if (solution.length > 1) {
                solution.sort(function (a, b) {
                    let a_level = a.method.level;
                    let b_level = b.method.level;
                    return (b_level - a_level);
                });
            }

            // debugger;
            model = solution[0];
            let {
                method,
                nodeName
            } = model;
            console.log('取一解(%s)', method.info);

            model = new method(nodeName);
        }
        // debugger;
        //------------------
        if (model != null) {
            // 若有找到解決方法
            // 就找解
            let _res = m.find(tagStartIndex, tagArea, content);
            Object.assign(res, _res);
        }

        return res;
    };
    //=================================
    toString() {
        return JSON.stringify(this.nodeList);
    }

}

//------------------------------------------------------------------------------
module.exports = FindTags;
