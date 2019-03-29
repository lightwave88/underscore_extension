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
        let tagContent = '';
        //-----------------------
        // 重要參數

        // 是否在 attr 內部
        // 在 attr 內部 <> 不起作用
        // attr 要起作用 \w=""

        let attrSymbol;
        let tagStartIndex;

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
            let isEndtag;


            if (tagStartIndex != null) {
                // 在 < 之後才會進來此

                tagContent += _chart;

                if (attrSymbol == null) {
                    // 在 attr 外
                    // 取樣判斷是否進入 attr
                    let res = /\s[^\s\/>]+?\s*?=\s*?(["'])$/.exec(tagContent);

                    if (res != null) {
                        //進入 attr
                        console.log('<(cant find tagName) in attr(%s)', res[1]);
                        attrSymbol = RegExp(res[1]);
                    }
                } else {
                    // 在 attr 裡面
                    if (attrSymbol.test(_chart)) {
                        // 出 attr
                        console.log('<(cant find tagName) out attr(%s)', attrSymbol.source);
                        attrSymbol = undefined;
                    }
                }
                //------------------
                if (attrSymbol == null) {
                    // 在 attr 外

                    if (/>/.test(_chart)) {
                        // 標籤結尾
                        // < >沒有被辨識出的標籤
                        // 交給特解解

                        node = this._findTagSolution_2(tagContent);
                        this.nodeList.push(node);

                        tagStartIndex = undefined;
                        tagContent = '';
                    }
                }

            }else{
                // 沒在 < 之後
                if (!/</.test(_chart)){
                    // 尚未遇到 <
                    textArea += _chart;
                }else {
                    debugger;

                    // 遇到 < 發現可能的起始標籤

                    console.log('find <.....');

                    if (textArea.length > 0) {
                        console.log('有之前的 textContent, 產生 textNode(%s)', textArea);
                        let node = new $NodeClass.TextNode(textArea);
                        this.nodeList.push(node);
                        textArea = '';
                    }

                    //------------------
                    let rightContent = content.substring(i);

                    console.log('檢查是否有 command tag');
                    // 是否是 command tag

                    if ((res = $Tools.isCommandTagHead(rightContent, i)) != null) {
                        console.log('有 command tag');
                        tagName = res[1];
                        res = this._findTagSolution_1(i, content, tagName, false);
                        index = res.index;
                        node = res.node;

                        this.nodeList.push(node);

                        i = index;
                        // continue;
                    }else if ((res = $Tools.isTagHead(rightContent)) != null) {
                        // 使否能抓到 nodeName
                        // 是正確的 tagHead

                        isEndtag = (res[1]) ? true : false;
                        tagName = res[2];

                        console.log('是正確的 tagHead(%s%s) 繼續找結尾', (isEndtag ? '/' : ''), tagName);

                        res = this._findTagSolution_1(i, content, tagName, isEndtag);
                        index = res.index;
                        node = res.node;

                        this.nodeList.push(node);

                        i = index;
                        // continue;
                    }else{
                        // 遇到 < 但都找不到解
                        // 留到結尾
                        tagContent = '<';
                        tagStartIndex = i;
                    }
                    //------------------
                }
            }
            //-----------------------
            i++;
        } // end while
        //---------------------------------
        if(tagContent.length){
            textArea += tagContent
        }

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
    _findTagSolution_2(tagContent) {

        console.log('遇到無法辨識的tag(%s)', tagContent);

        let model = null;

        let node;
        //------------------
        let solution = this.methodList.filter(function (m) {
            // debugger;
            // console.log(m.tag);
            let res = m.checkTagType(tagContent);
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
            node = model.solution(tagContent);
            // Object.assign(r_value, res);
        }else{
            // 無法辨識的 <> 那就是文字節點
            console.log(tagContent);
            node = new $NodeClass.TextNode(tagContent);
        }

        return node;
    };
    //=================================
    toString() {
        return JSON.stringify(this.nodeList);
    }

}

//------------------------------------------------------------------------------
module.exports = function (content) {
    let o = new FindTags();
    let nodeList = o.solution(content);
    return nodeList;
}
