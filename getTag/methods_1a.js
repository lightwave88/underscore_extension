// debugger;
const NodeClass = require('getTag/node_1');
// debugger;
const {
    NormalNode,
    EndNode,
    TextNode,
    StyleNode,
    UnknowNode,
    ScriptNode,
} = require('getTag/node_1');
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

            resContent = content.substring(i + 1, j + 1);
            return {
                "$content": resContent,
                node: (this.nodeName),
                index: j
            };
        }
        //-----------------------
        // 處理 <tag......>
        while ((_chart = content[j]) != null) {
            // debugger;
            // let k = (i < 0) ? 0 : i;
            let hasChecked = content.substring(i, j + 1);


            //-----------------------
            // 只確認是否在 [''][""]之間
            if (commandCount > 0) {
                // 在 attr 之中
                if (_symbol.test(_chart)) {
                    // ['"]結尾
                    commandCount--;
                }
            } else {
                // 在 attr 之外

                // 這判別比較麻煩
                // 可以再深入些(/, > ,\s)= 都會有問題

                let res =  /\s[^\s\/>]+?\s*?=\s*?(["'])$/.exec(hasChecked);

                if (res != null) {
                    // ['"]開頭
                    commandCount++;
                    _symbol = RegExp(res[1]);
                }
            }
            //-----------------------
            if (commandCount == 0) {
                _symbol = undefined;

                if (/</.test(_chart)) {
                    // 遇到 <
                    // 沒有被 close
                    // index 必須退後一格
                    // 結果是 textNode
                    j--;
                    break;

                } else if (/>/.test(_chart)) {
                    // 找到結尾

                    resContent = content.substring(i + 1, j + 1);
                    return {
                        "$content": resContent,
                        node: (this.nodeName),
                        index: j
                    };
                }
            }

            j++;
        } // while end
        //-----------------------
        // 沒找到結尾
        // 結果是 textNode
        resContent = content.substring(i + 1, j + 1);
        return {
            "$content": resContent,
            node: 'text',
            index: j
        }
    }
}
///////////////////////////////////////////////////////////////////////////////


class Method_1 extends ProtoMethod {

    constructor(nodeName) {
        super(nodeName);
    }
    //=================================
    find(i, tagArea, content) {
        // debugger;

        let { node, $content, index } = this._findEndTag_1(i, tagArea, content);

        if (/^text$/.test(node)) {
            node = new TextNode($content);
        } else {
            node = new NormalNode(node, $content)
        }
        //-------------
        return {
            index: index,
            node: node
        };
    }

}

(function (fn) {
    // 優先等級
    fn.level = 0;

    fn.info = '<tag...>一般標籤';
    //=================================
    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /<(\w+)(\s|>|\/>)$/i.exec(tagArea)) != null) {
            let nodeName = res[1];
            nodeName = nodeName.toLowerCase();

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

        methodList.push(Method_2);
    }
    //=================================
    find(i, tagArea, content) {
        // debugger;

        let { node, $content, index } = this._findEndTag_1(i, tagArea, content);

        if (/^text$/.test(node)) {
            node = new TextNode($content);
        } else {
            node = new EndNode(node, $content)
        }

        return {
            index: index,
            node: node
        };
    }
}


(function (fn) {
    fn.level = 0;

    fn.info = '</tag>一般標籤尾';
    //=================================
    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /<\/(\w+)>$/.exec(tagArea)) != null) {

            let nodeName = res[1];
            nodeName = nodeName.toLowerCase();
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
// <!-- -->
class Method_3 extends ProtoMethod {
    constructor(nodeName) {
        super(nodeName);

        methodList.push(Method_3);
    }
    //=================================
    find(i, tagArea, content) {
        // debugger;

        // console.log(this.info);

        let resContent;
        let j = i + tagArea.length + 1;
        let _chart;
        //------------------
        while ((_chart = content[j]) != null) {
            // debugger;

            let tagContent = content.substring(i + 1, j + 1);
            //------------------
            if (/</.test(_chart)) {
                // 沒有正確 close
                break;
            }
            //------------------
            if (/-->$/.test(tagContent)) {

                resContent = content.substring(i + 1, j + 1);
                // close
                return {
                    node: new NormalNode(resContent),
                    index: j
                };
            }

            j++;
        } // end while
        //------------------
        resContent = content.substring(i + 1, j + 1);

        return {
            node: new TextNode(resContent),
            index: j
        };
    }
}

(function (fn) {
    fn.level = 5;

    fn.info = '<!-- -->';
    //=================================
    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /^<!--/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_3,
                nodeName: '!--'
            };
        }
        return null;
    };

})(Method_3);


methodList.push(Method_3);
///////////////////////////////////////////////////////////////////////////////
// <style...>不會有套嵌好辦</style>
class Method_4 extends ProtoMethod {
    constructor(nodeName) {
        super(nodeName);

        methodList.push(Method_4);
    }
    //=================================
    find(i, tagArea, content) {
        debugger;
        // console.log(this.info);

        let res;
        let d = {
            node: undefined,
            index: undefined
        };
        // 找開頭的 end
        let { node, $content, index } = this._findEndTag_1(i, tagArea, content);
        //-----------------------
        debugger;

        // 找最後的 end
        if (/^text$/.test(node)) {
            // 沒找到 style
            d.node = new TextNode($content);
            d.index = index;
        } else {
            res = this._findEnd(index, content);
            index = res.index;

            debugger;
            let _content = content.substring(i + 1, index + 1);

            if (res.find) {
                d.node = new StyleNode(_content);
            } else {
                d.node = new TextNode(_content);
            }

            d.index = index;
        }
        return d;
    }
    //=================================
    _findEnd(i, content) {
        let j = i + 1;
        let _chart;


        // 指令區 {}
        let commandCount = 0;
        //------------------
        while ((_chart = content[j]) != null) {


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
                // continue;
            } else {
                // 不在指令區 {} 內

                if (/</.test(_chart)) {
                    debugger;
                    // 遇到關鍵標籤

                    // 往後取樣
                    let word = content.substr(j + 1, 10);

                    if (/^\/style>/i.test(word)) {
                        // 遇到close

                        let index = word.search(/>/);
                        index += (j + 1);
                        return {
                            find: true,
                            index: index
                        };
                    } else {
                        // 沒有正確 close
                        j--;
                        break;
                    }
                }
            }
            j++;

        } // end while
        //------------------
        debugger;
        // 沒找到 close
        return {
            find: false,
            index: j
        };
    }
}

(function (fn) {
    fn.level = 5;

    fn.info = '<style...>不會有套嵌好辦</style>';

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
// <script...>不會有套嵌好辦</script>
class Method_5 extends ProtoMethod {
    constructor(nodeName) {
        super(nodeName);

        methodList.push(Method_5);
    }
    //=================================
    find(i, tagArea, content) {
        // debugger;
        // console.log(this.info);

        let res;
        let d = {
            node: undefined,
            index: undefined
        };
        // 找開頭的 end
        let { node, index, $content } = this._findEndTag_1(i, tagArea, content);
        let content_start = index - i - 1;

        debugger;
        //-----------------------
        // 找最後的 end
        if (/^text$/.test(node)) {
            d.node = new TextNode($content);
            d.index = index;
        } else {
            res = this._findEnd(index, content);
            index = res.index;

            let _content = content.substring(i + 1, index + 1);

            if (res.find) {
                d.node = new ScriptNode(_content);
                d.node.setStartEnd(content_start);
            } else {
                d.node = new TextNode(_content);
            }

            d.index = index;
        }
        return d;
    }
    //=================================
    _findEnd(i, content) {
        let j = i + 1;
        let _chart;

        let preContent;
        // 指令區 {}
        let commandCount_1 = 0;
        // 注釋區
        let commandCount_2 = 0;

        let _symbol;
        // _symbol的脫逸
        let _symbol_1;

        //------------------
        while ((_chart = content[j]) != null) {

            let preContent = content.substring(j - 3, j + 1);

            if (commandCount_1 > 0) {
                debugger;
                // 在文字區中
                if (_symbol_1.test(preContent)) {
                    // 脫逸
                    j++;
                    continue;
                }

                if (_symbol.test(_chart)) {
                    // 遇到分隔符號
                    commandCount_1--;
                }

            } else if (commandCount_2 > 0) {
                // 註釋區
                debugger;

                if (_symbol.test(preContent)) {
                    commandCount_2--;
                    _symbol = undefined;
                }
            } else {
                debugger;
                // 非特異區
                _symbol = undefined;
                _symbol_1 = undefined;

                if (/</.test(_chart)) {
                    // 遇到 <

                    // 往後取樣
                    let word = content.substr(j + 1, 10);

                    if (/^\/script>/.test(word)) {
                        // 正解

                        let index = word.search(/>/);
                        index += (j + 1);
                        return {
                            find: true,
                            index: index
                        };
                    } else {
                        // 沒有正確 close
                        j--;
                        break;
                    }
                } else if (/[`'"]/.test(_chart)) {
                    // 文字區
                    commandCount_1++;
                    _symbol = RegExp(_chart);
                    _symbol_1 = RegExp(`\\\\${_chart}$`);

                } else if (/\/\/$/.test(preContent)) {
                    // 註釋區
                    commandCount_2++;

                    // 換行符號
                    _symbol = /(\r\n|\n)$/;
                }
            }
            j++;
        } // while end
        //------------------
        return {
            find: false,
            index: j
        };
    }
}

(function (fn) {
    fn.level = 5;

    fn.info = '<script...>不會有套嵌好辦</script>';

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
///////////////////////////////////////////////////////////////////////////////
// <!XXXX>
class Method_6 extends ProtoMethod {
    constructor(nodeName) {
        super(nodeName);

    }
    //=================================
    find(i, tagArea, content) {
        debugger;

        // console.log(this.info);

        let { index, $content, node } = this._findEndTag_1(i, tagArea, content);

        if (/^text$/.test(node)) {
            node = new TextNode($content);
        } else {
            node = new NormalNode(node, $content);
        }


        return {
            index: index,
            node: node
        };
    }
}
(function (fn) {
    // 優先等級
    fn.level = 5;

    fn.info = '<!\w+>特殊開頭標籤';
    //=================================
    fn.checkTagType = function (tagArea) {
        // debugger;

        let res;
        if ((res = /<([!]\w+)(\s|>|\/>)$/i.exec(tagArea)) != null) {
            let nodeName = res[1];

            let _nodeName = nodeName.toLowerCase();

            switch (_nodeName) {
                // case 'style':
                // case 'script':
                // return null;
                default:
                    break;
            }


            return {
                method: Method_6,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_6);

methodList.push(Method_6);
///////////////////////////////////////////////////////////////////////////////
