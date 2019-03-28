// debugger;
const $util = require('util');

const $NodeClass = require('../node_1');
// debugger;
const $methodList = require('./methods_1b');
const $tagNameSolutionList = require('./method_2');
const $Tools = require('../tools');


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
    // 從文字內容找出所有的 tag
    _findTags(content) {
        // debugger;

        let i = 0;

        let _chart;
        let textArea = '';

        //-----------------------
        while ((_chart = content[i]) !== undefined) {
            // debugger;

            console.log('-------------------');
            let leftContent = content.substring(0, i);
            console.log('已檢查過(%s)正檢查(%s)', leftContent, _chart);
            //-----------------------
            let index;
            let node;
            let res;
            let tagName;
            let findContent;
            let isEndtag;

            if (/</.test(_chart)) {
                debugger;
                // 發現可能的起始標籤

                console.log('find <.....');

                let rightContent = content.substring(i);

                //------------------
                console.log('檢查是否有 command tag');
                // 是否是 command tag
                res = $Tools.isCommandTagHead(rightContent, i);

                if (res != null) {
                    console.log('有 command tag');
                    tagName = res[1];
                    res = this._findTagSolution_1(i, content, tagName, false);
                    index = res.index;
                    node = res.node;

                    this.nodeList.push(node);

                    i = index + 1;
                    continue;
                }
                //------------------
                // 使否能抓到 nodeName
                res = $Tools.isTagHead(rightContent);

                if (res != null) {
                    // 是正確的 tagHead

                    if (textArea.length > 0) {
                        console.log('有之前的 textContent, 產生 textNode(%s)', textArea);
                        let node = new $NodeClass.TextNode(textArea);
                        this.nodeList.push(node);
                        textArea = '';
                    }
                    //------------------
                    // 若能確定 tagName
                    // 避免進入 this._findTagSolution_2() 這更耗時的找法
                    // console.dir(res);
                    findContent = res[1];
                    isEndtag = (res[2]) ? true : false;
                    tagName = res[3];

                    console.log('是正確的 tagHead(%s%s) 繼續找結尾', (isEndtag ? '/' : ''), tagName);
                    //------------------
                    // 先找特殊解
                    res = this._findTagSolution_2(findContent, i, content);
                    index = res.index;
                    node = res.node;

                    if (node != null) {
                        console.log('有特殊解');
                        // 有解
                        this.nodeList.push(node);
                        i = index + 1;
                        continue;
                    }
                    //------------------
                    // 找 tagName 解
                    console.log('無特殊解   根據tagName 找尋');

                    res = this._findTagSolution_1(i, content, tagName, isEndtag);
                    index = res.index;
                    node = res.node;

                    this.nodeList.push(node);

                    i = index + 1;
                    continue;
                }
            }
            //-----------------------
            textArea += _chart;
            i++;
        } // end while
        //-----------------------
        if (textArea.length > 0) {
            console.log('end textArea(%s)', textArea);

            let node = new $NodeClass.TextNode(textArea);
            this.nodeList.push(node);
            textArea = '';
        }
    }
    //=================================

    // 若已經確定 nodeName
    // i: 絕對座標
    _findTagSolution_1(i, content, tagName, endTag) {
        // debugger;

        console.log('_findTagSolution_1()>');

        tagName = tagName.trim();
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

                console.log('根據 tagName 找到特殊解');

                return res;
            } else {
                let res = $Tools.findTagEnd(content, i);

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

            console.log('根據 tagName 有找到結果');

        } else {
            // 無法形成 tag
            returnValue.node = new $NodeClass.TextNode(tagContent);
            console.log('根據 tagName 沒有找到結果');
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

        if (r_value.node != null) {
            console.log('特解有找到解');
        } else {
            console.log('特解沒找到解');
        }

        return r_value;
    };
    //=================================
    toString() {
        return JSON.stringify(this.nodeList);
    }

}
//------------------------------------------------------------------------------
module.exports = function (content) {
    const $s = new FindTags();
    const nodeList = $s.solution(content);
    return nodeList;
}
