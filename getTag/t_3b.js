// debugger;
const NodeClass = require('./t_2');
// debugger;
const {NormalNode, ScriptNode, TextNode, StyleNode} = require('./t_2');
///////////////////////////////////////////////////////////////////////////////
//
// 方法列表
//
///////////////////////////////////////////////////////////////////////////////

const methodList = [];
module.exports = methodList;
///////////////////////////////////////////////////////////////////////////////
class ProtoMethod {
    constructor(nodeName) {
        this.info = '';
        this.nodeName = nodeName;
        this.nodeContent = '';

        if (!this.nodeName) {
            throw new Error('no set nodeName');
        }
    }
    //--------------------------------------
    find() {
        throw new Error('need set findEndTag()');
    }
    //--------------------------------------
    _findEndTag_1(i, tagArea, content) {
        debugger;

        let _chart;
        let j = i + tagArea.length + 1;
        let resContent;


        let commandCount = 0;
        let _symbol;
        // _symbol的脫逸
        // let _symbol_1;
        //-----------------------
        // 處理 <tage><tag/>
        if (/(>|\/>)$/.test(tagArea)) {
            j = i + tagArea.length;

            resContent = content.slice(i + 1, j + 1);
            return {
                node: (new NormalNode(this.nodeName, resContent)),
                index: j
            }
        }
        //-----------------------
        // 處理 <tag......>
        while ((_chart = content[j]) != null) {
            debugger;

            let hasChecked = content.slice(i + 1, j + 1);

            if (commandCount < 0) {
                throw new Error('command error');
            }
            //-----------------------
            // 只確認是否在 [''][""]之間
            if (/['"]/.test(_chart)) {

                if (commandCount > 0) {
                    // 在 attr 命令之間
                    if (false && _symbol_1.test(hasChecked)) {
                        // 脫逸
                        continue;
                    }

                    if (_symbol.test(_chart)) {
                        // ['"]結尾
                        commandCount--;
                    }

                } else {
                    // ['"]開頭
                    commandCount++;
                    _symbol = RegExp(_chart);
                    // _symbol_1 = RegExp(`\\${_chart}`);
                }
            }
            //-----------------------
            if (commandCount == 0) {
                _symbol = undefined;
                // _symbol_1 = undefined;

                if (/</.test(_chart)) {
                    // 遇到 <
                    // 沒有被 close
                    // index 必須退後一格
                    // 結果是 textNode
                    j--;
                    break;

                } else if (/>$/.test(_chart)) {
                    // 找到結尾

                    resContent = content.slice(i + 1, j + 1);
                    return {
                        node: (new NormalNode(this.nodeName, resContent)),
                        index: j
                    };
                }
            }

            j++;
        } // while end
        //-----------------------
        // 沒找到結尾
        // 結果是 textNode
        resContent = content.slice(i + 1, j + 1);
        return {
            node: new TextNode(resContent),
            index: j
        }
    }
}
///////////////////////////////////////////////////////////////////////////////


class Method_1 extends ProtoMethod {

    constructor(nodeName) {
        super(nodeName);
        this.info = '<tag...>一般標籤';
    }
    //=================================
    find(i, tagArea, content) {
        debugger;

        console.log(this.info);

        let res = this._findEndTag_1(i, tagArea, content);
        return res;
    }

}

(function (fn) {
    // 優先等級
    fn.level = 0;
    //=================================
    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /<(\w+)(\s|>|\/>)$/.exec(tagArea)) != null) {
            let nodeName = res[1];

            return {
                method: Method_1,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_1);
methodList.push(Method_1);
///////////////////////////////////////////////////////////////////////////////


class Method_2 extends ProtoMethod {

    constructor(nodeName) {
        super(nodeName);
        this.info = '</tag>一般標籤尾';
        methodList.push(Method_2);
    }
    //=================================
    find(i, tagArea, content) {
        debugger;

        console.log(this.info);

        let res = this._findEndTag_1(i, tagArea, content);
        return res;
    }
}


(function (fn) {
    fn.level = 0;
    //=================================
    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /<\/(\w+)>$/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_2,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_2);

methodList.push(Method_2);
///////////////////////////////////////////////////////////////////////////////
class Method_3 extends ProtoMethod {
    constructor(nodeName) {
        super(nodeName);
        this.info = '<!-- -->一般標籤尾';
        methodList.push(Method_3);
    }
    //=================================
    find(i, tagArea, content) {
        debugger;

        console.log(this.info);

        let resContent;
        let j = i + tagArea.length + 1;
        let _chart;
        //------------------
        while ((_chart = content[j]) != null) {
            debugger;

            let tagContent = content.slice(i + 1, j + 1);
            //------------------
            if (/</.test(_chart)) {
                // 沒有正確 close
                break;
            }
            //------------------
            if (/-->$/.test(tagContent)) {

                resContent = content.slice(i + 1, j + 1);
                // close
                return {
                    node: new NormalNode(this.nodeName, resContent),
                    index: j
                };
            }

            j++;
        } // end while
        //------------------
        resContent = content.slice(i + 1, j + 1);

        return {
            node: new TextNode(resContent),
            index: j
        };
    }
}

(function (fn) {
    fn.level = 0;
    //=================================
    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /^<(!--)/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_3,
                nodeName: nodeName
            };
        }
        return null;
    };

})(Method_3);


methodList.push(Method_3);
///////////////////////////////////////////////////////////////////////////////
class Method_4 extends ProtoMethod {
    constructor(nodeName) {
        super(nodeName);
        this.info = '<style...>不會有套嵌好辦</style>';
        methodList.push(Method_4);
    }
    //=================================
    find(i, tagArea, content) {
        // debugger;
        console.log(this.info);
        
        let res;
        let d = {
            node: undefined,
            index: undefined
        };
        // 找開頭的 end
        let {node, index} = this._findEndTag_1(i, tagArea, content);
        //-----------------------
        // 找最後的 end
        if (node instanceof TextNode) {
            // 沒找到 style
            d.node = node;
            d.index = index;
        } else {
            res = this._findEnd(index, content);
            index = res.index;
        
            let content = content.slice(i + 1, index + 1);

            if (res.find) {
                d.node = new StyleNode(content);
            }else{
                d.node = new TextNode(content);
            }

            d.index = index;
        }
        return d;
    }
    //=================================
    _findEnd(i, content) {
        let j = i + 1;
        let _chart;

        let tagContent;
        // 指令區 {}
        let commandCount = 0;
        //------------------
        while ((_chart = content[j]) != null) {
            tagContent = content.slice(i + 1, j + 1);

            if (/\{/.test(_chart)) {
                commandCount++;
            } else if (/\}/.test(_chart)) {
                commandCount--;
            }
            //------------------
            if (commandCount > 0) {
                // 在指令區 {} 內
                // 指令區亂七八糟不鳥她
                // 只管 }
                continue;
            } else {
                // 不在指令區 {} 內
                if (/</.test(tagContent)) {
                    // 遇到關鍵標籤

                    // 往後取樣
                    let word = content.substr(j, 15);

                    if (/^\/style>/i.test(word)) {
                        // 遇到close

                        let index = word.search(/>/);
                        index += (j - 1);
                        return {
                            find: true,
                            index: index
                        };
                    } else {
                        // 沒有正確 close
                        return {
                            find: false,
                            index: (j - 1)
                        };
                    }
                }
            }
            j++;

        } // end while
        //------------------
        // 沒找到 close
        return {
            find: false,
            index: j
        };
    }
}

(function (fn) {
    fn.level = 5;

    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /^<(style)(\s|>)/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_4,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_4);

methodList.push(Method_4);
///////////////////////////////////////////////////////////////////////////////
class Method_5 extends ProtoMethod {
    constructor(nodeName) {
        super(nodeName);
        this.info = '<script...>不會有套嵌好辦</script>';
        methodList.push(Method_5);
    }
    //=================================
    find(i, tagArea, content) {
        // debugger;
        console.log(this.info);

        let find;
        let index;
        let res;
        let d = {
            node: undefined,
            index: undefined,
            content: undefined
        };
        // 找開頭的 end
        res = this._findStartEnd(i, tagArea, content);
        index = res.index;
        //-----------------------
        // 找最後的 end
        if (!res.find) {
            d.node = 'text';
            d.index = index;
            d.content = content.slice(i, index + 1);
        } else {
            res = this._findEnd(index, content);
            index = res.index;

            d.node = 'text';

            if (res.find) {
                d.node = this.nodeName;
            }

            d.index = index;
            d.content = (content.slice(i + 1, index + 1));
        }
        return d;
    }
    //=================================
    // 找尋開頭的 close位置
    _findStartEnd(i, tagArea, content) {
        debugger;

        let res = this._findEndTag_1(i, tagArea, content);

        let d = {
            res: true,
            index: (res.index)
        };

        if (res.node == 'text') {
            d.res = false;
        }

        return d;
    }
    //=================================
    _findEnd(i, content) {
        let j = i + 1;
        let _chart;

        let tagContent;
        // 指令區 {}
        let commandCount = 0;

        let _symbol;
        // _symbol的脫逸
        let _symbol_1 = /\\[`'"]$/;

        //------------------
        while ((_chart = content[j++]) != null) {

            tagContent = content.slice(i + 1, j);

            if (commandCount > 0) {
                // 在[`'"]中

                if (_symbol.test(_chart)) {
                    // 遇到分隔符號
                    if (_symbol_1.test(tagContent)) {
                        // 脫逸
                        continue;
                    } else {
                        commandCount--;
                    }
                }

            } else {
                _symbol = undefined;
                _symbol_1 = undefined;

                if (/[`'"]/.test(_chart)) {
                    commandCount++;
                    _symbol = RegExp(_chart);
                    _symbol_1 = RegExp(`\\${_chart}`);

                } else if (/</.test(_chart)) {
                    // 往後取樣
                    let word = content.substr(j, 15);

                    if (/^\/script>/.test(word)) {
                        let index = word.search(/>/);
                        index += (j - 1);
                        return {
                            find: true,
                            index: index
                        };
                    } else {
                        return {};
                    }
                }
            }

        } // while end
        //------------------
        return {};
    }
}

(function (fn) {
    fn.level = 5;

    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /^<(script)(\s|>)/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_5,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_5);

methodList.push(Method_5);
