// debugger;
const $util = require('util');

const $NodeClass = require('./node_1');
// debugger;
const $methodList = require('./methods_1b');
const $tagNameSolutionList = require('./method_2');
const $Tools = require('./tools');


// 主要在分離出所有的 tag
class FindTags {
    constructor() {
        this.nodeList = [];
        this.methodList = $methodList;
        this.tagNameSolutionList = $tagNameSolutionList;

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
                    }else{
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
    // 從文字內容找出所有的 tag
    _findTags(content) {
        // debugger;

        let i = 0;

        let _chart
        let rightContent = '';

        let tagContent = '';
        let textArea = '';
        //-----------------------
        // 重要參數

        // 是否在 attr 內部
        // 在 attr 內部 <> 不起作用
        // attr 要起作用 \w=""

        let attrSymbol;
        let tagStartIndex;

        // let findMode = false;

        //-----------------------
        while ((_chart = content[i]) !== undefined) {
            debugger;

            console.log('-------------------');
            let leftContent = content.substring(0, i);
            console.log('已檢查過(%s)正檢查(%s)', leftContent, _chart);
            //-----------------------

            // 很重要的部分必須確認是否在 attr 內
            if (tagStartIndex != null) {
                // 在 < 之後
                // 暫無法辨認出 tag(譬如 <!-------->)
                // 在一個可能是標籤開始的狀況下

                tagContent += _chart;

                if (attrSymbol == null) {
                    // 在 attr 外
                    // 取樣判斷是否進入 attr
                    let res = /\s[^\s\/>]+?\s*?=\s*?(["'])$/.exec(tagContent);

                    if (res != null) {
                        //進入 attr

                        console.log('in attr(%s)', res[1]);

                        // 不用再去找模組了
                        // 加快速度
                        // findMode = false;
                        attrSymbol = RegExp(res[1]);
                    }
                } else {
                    // 在 attr 裡面
                    if (attrSymbol.test(_chart)) {
                        console.log('out attr(%s)', attrSymbol.source);
                        // 出 attr
                        attrSymbol = undefined;
                    }
                }
                //------------------
                if (attrSymbol == null) {
                    // 在 attr 外

                    if (/>/.test(_chart)) {
                        // 標籤結尾
                        // 沒有被辨識出的標籤

                        tagStartIndex = undefined;
                        let node = this._findTagSolution_3(tagContent);

                        console.log('找到沒被篩選出來的tag(%s)\n------------', node.tagName);

                        this.nodeList.push(node);
                        tagContent = '';
                    }
                }

            } else {
                // 在標籤外

                if (/</.test(_chart)) {
                    // debugger;
                    // 發現可能的起始標籤

                    console.log('find <');

                    let rightContent = content.substring(i);

                    if (textArea.length > 0) {

                        console.log('有之前的 textContent, 產生 textNode(%s)', textArea);
                        let node = new $NodeClass.TextNode(textArea);
                        this.nodeList.push(node);
                        textArea = '';
                    }
                    //------------------
                    // 使否能抓到 nodeName
                    let reg_res = /^(<(\/)?([^\s>/]+?))(?:\s|\/|>)/.exec(rightContent);

                    if (reg_res != null) {
                        // 若能確定 tagName
                        // 避免進入 this._findTagSolution_2() 這更耗時的找法
                        let findContent = reg_res[1];
                        let isEndtag = (reg_res[2]) ? true : false;
                        let tagName = reg_res[3];

                        console.log('main> find tagName:(%s%s)', (isEndtag ? '/' : ''), tagName);

                        let { node, index } = this._findTagSolution_1(i, content, tagName, isEndtag, findContent);

                        console.log('找到的 tag 是(%s%s)', (node.isEnd ? '/' : ""), node.tagName);

                        this.nodeList.push(node);

                        i = index;
                        i++;
                        continue;
                    } else {

                        // (步驟a)
                        tagContent = '<';
                        tagStartIndex = i;
                        // findMode = true;
                    }

                } else {
                    textArea += _chart;
                }
            }
            //-----------------------

            i++;
        } // end while
        //-----------------------
        if (textArea.length > 0) {

            console.log('end textArea(%s)', textArea);

            let node = new $NodeClass.TextNode(textArea);
            this.nodeList.push(node);
            textArea = '';
        }


        if (tagContent.length > 0) {

            console.log('end tagContent(%s)', tagContent);

            let node = new $NodeClass.TextNode(tagContent);
            this.nodeList.push(node);
            tagContent = '';
        }
    }
    //=================================
    // 若已經確定 nodeName
    // i: 絕對座標
    _findTagSolution_1(i, content, tagName, endTag, findContent) {
        // debugger;

        tagName = tagName.toLowerCase();

        // 返回值
        let returnValue = {
            node: null,
            // 絕對位置
            index: null
        };

        let index;
        let tagContent;

        let find;

        // 相對於 rightContent 的位置
        //------------------
        {
            debugger;
            // 找尋是否有可以處理的模組
            let res = this._findTagSolution_2(findContent, i, content);

            debugger;
            if (res.node != null) {
                // debugger;
                // 若有特殊解
                return res;
            }
        }
        //------------------

        if (endTag) {
            // 找 > 很簡單

            let _res = $Tools.findEndTagEnd(content, i);

            find = _res.find;
            tagContent = _res.content;
            index = _res.index;

        } else {
            // 找是否有特解
            let solution = $tagNameSolutionList[tagName];

            if (solution != null) {
                // 若有特殊處理模組
                let res = solution.solution(content, i);

                console.log('找到特殊 tag(%s)(%s)', !(res.node instanceof $NodeClass.TextNode), res.node.tagName);

                return res;
            } else {
                let res = $Tools.findTagEnd(content, i);

                // debugger;

                index = res.index;
                tagContent = res.content;
                find = res.find;
            }
        }
        // debugger;
        //------------------
        if (find) {
            // 確定能形成 tag

            if (endTag) {
                // 是結尾 tag
                returnValue.node = new $NodeClass.EndNode(tagName, tagContent);

            } else {
                returnValue.node = new $NodeClass.NormalNode(tagName, tagContent);
            }

        } else {
            // 無法形成 tag

            returnValue.node = new $NodeClass.TextNode(tagContent);
        }

        returnValue.index = index;

        return returnValue;
    }
    //=================================
    // 找尋 tag 轉屬的模組
    // 找出他的結尾與結尾的 index
    _findTagSolution_2(tagArea, tagStartIndex, content) {
        let model = null;

        let r_value = {
            node: null,
            index: null
        };
        //------------------
        let solution = this.methodList.filter(function (m) {
            // debugger;
            // console.log(m.tag);
            let res = m.checkTagType(tagArea);
            return (res === true);
        });
        //------------------
        if (solution.length > 0) {

            console.log('有找到特殊解(%d)組', solution.length);

            if (solution.length > 1) {

                solution.sort(function (a, b) {
                    let a_level = a.level;
                    let b_level = b.level;
                    return (b_level - a_level);
                });
            }

            // debugger;
            model = solution[0];

            console.log('取一解(%s)', model.info);
        }
        // debugger;
        //------------------
        if (model != null) {
            // 若有找到解決方法
            // 就找解
            let res = model.solution(content, tagStartIndex);
            Object.assign(r_value, res);
        }

        return r_value;
    };
    //=================================
    _findTagSolution_3(tagContent) {

        let endTag = $Tools.isEndNode(tagContent);
        let tagName = $Tools.findNodeNameInTag(tagContent);

        let tagNode;

        if (endTag) {
            tagNode = new $NodeClass.EndNode(tagName, tagContent);
        } else {
            tagNode = new $NodeClass.NormalNode(tagName, tagContent);
        }
        return tagNode;
    }
    //=================================
    toString() {
        return JSON.stringify(this.nodeList);
    }

}

//------------------------------------------------------------------------------
module.exports = function () {
    return new FindTags();
}
