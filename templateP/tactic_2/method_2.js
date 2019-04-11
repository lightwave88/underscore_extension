const $NodeClass = require('../node_1a');

const $Tools = require('../tools');
////////////////////////////////////////////////////////////////////////////////
//
// 提供特殊 tag 解決方式
//
////////////////////////////////////////////////////////////////////////////////
const methodList = {};
module.exports = methodList;


(function (methodList) {
    // 處理 style
    let $o = {};

    methodList['style'] = $o;

    $o.solution = function (_content, i) {

        let rightSide = _content.substring(i);

        debugger;
        // console.log(this.info);

        let res;
        let r_value = {
            node: null,
            index: null
        };
        // 找開頭的 end
        // index 變成相對位置
        let { content, index, find } = $Tools.findTagEnd(rightSide, 0);
        //-----------------------

        debugger;

        if (!find) {
            // <style 頭沒有正確關閉
            r_value.node = new $NodeClass.TextNode(content);
            r_value.index = index + i;
        } else {

            // 找最後的 end
            // index: <style> > 結尾位置
            res = this._findEnd(rightSide);

            // index: </style> > 結尾位置
            r_value.index = res.index + i;
            content = res.content;
            find = res.find;

            debugger;

            if (find) {
                r_value.node = new $NodeClass.StyleNode(content);
            } else {
                r_value.node = new $NodeClass.TextNode(content);
            }

        }
        return r_value;
    };
    //=================================
    // 用相對座標
    $o._findEnd = function (content) {
        // <style> 後面只要有 </style> 就結尾
        debugger;

        let r_value = {
            find: false,
            index: null,
            content: null
        };

        let style_content;

        content.replace(/^[\s\S]*?<\/style>/i, function (m) {
            style_content = m;
        });
        debugger;

        if (style_content == null) {
            // <style> 沒有 close

            r_value.content = content;
            r_value.index = r_value.content.length - 1;

        } else {
            // <style> close
            r_value.content = style_content;
            r_value.index = r_value.content.length - 1;
            r_value.find = true;
        }

        return r_value;
    };
    //=================================

})(methodList);
////////////////////////////////////////////////////////////////////////////////
(function (methodList) {
    // 處理 script
    let $o = {};

    methodList['script'] = $o;
    //=================================
    $o.solution = function (_content, i) {
        debugger;
        // console.log(this.info);

        let rightSide = _content.substring(i);

        let res;
        let r_value = {
            node: null,
            index: null
        };;

        // 找開頭的 end
        let { content, index, find } = $Tools.findTagEnd(rightSide, 0);

        // headTag 座標內容
        let headContent = content;
        let startEnd_i = index;

        debugger;
        //-----------------------
        if (!find) {
            // script.head error

            console.log('script.head error');

            r_value.node = new $NodeClass.TextNode(headContent);
            r_value.index = index + i;
        } else {
            // script.head ok
            // find script.end

            console.log('script.head ok, find script.end');
            res = this._findScriptEnd(rightSide, index);

            debugger;

            index = res.index;
            find = res.find;

            let tagContent = rightSide.substring(0, index + 1);

            r_value.index = index + i;
            //------------------
            // 相對座標
            let endStart_i = this._findendStart(tagContent);

            if (find) {
                // 確定 script all ok
                console.log('確定 script all ok');
                let tag_haed = headContent;
                let tag_content = tagContent.substring(startEnd_i + 1, endStart_i);
                let tag_foot = tagContent.substring(endStart_i);

                r_value.node = new $NodeClass.ScriptNode(tagContent, tag_haed, tag_content, tag_foot);

            } else {
                // script tag error
                console.log('script tag error');
                r_value.node = new $NodeClass.TextNode(_content);
            }

        }
        return r_value;
    }
    //=================================
    $o._findScriptEnd = function (content, i) {
        // debugger;

        let j = i;

        if (/>/.test(content[i])) {
            j = i + 1;
        }

        let _chart;

        // 指令區 {}
        let commandCount_1 = 0;
        // 注釋區
        let commandCount_2 = 0;

        let _symbol;
        // _symbol的脫逸
        let _symbol_1;

        //------------------
        while ((_chart = content[j]) != null) {

            let sample = content.substring(j - 3, j + 1);

            if (commandCount_1 > 0) {
                // debugger;
                // 在文字區中
                if (_symbol_1.test(sample)) {
                    // 脫逸

                    // console.log('遇到脫逸字(%s)', _symbol_1.source);
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

                if (_symbol.test(sample)) {
                    commandCount_2--;
                    _symbol = undefined;
                }
            } else {
                // debugger;
                // 非特異區
                _symbol = undefined;
                _symbol_1 = undefined;

                if (/</.test(_chart)) {
                    // 遇到 <

                    // 往後取樣
                    let sample = content.substr(j, 11);
                    console.log('遇到 <, sampe(%s)', sample);

                    if (/^<\/script>/.test(sample)) {
                        // 正解

                        let index = sample.search(/>/);
                        index = j + index;
                        return {
                            find: true,
                            index: index
                        };
                    }

                } else if (/[`'"]/.test(_chart)) {
                    // 文字區
                    commandCount_1++;
                    _symbol = RegExp(_chart);
                    _symbol_1 = RegExp(`\\\\${_chart}$`);

                } else if (/\/\/$/.test(sample)) {
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
    };
    //=================================
    $o._findendStart = function (content) {
        return (content.search(/<\/script>$/i));
    };

})(methodList);
////////////////////////////////////////////////////////////////////////////////
(function (methodList) {
    // 處理 <% %>
    let $o = {};

    methodList['%'] = $o;
    //=================================
    $o.solution = function (_content, i) {
        debugger;
        let rightSide = _content.substring(i);


        if (!/^<%/.test(rightSide)) {
            throw new TypeError('not <% %> tag');
        }
        let r_value = {
            node: null,
            index: null
        };
        //------------------
        let res = $Tools.findCommandEnd(rightSide, 0);
        //------------------
        debugger;
        let index = res.index;
        let find = res.find;

        let content = rightSide.substring(0, index + 1);

        console.log('***<% (%s)', content);
        r_value.index = index + i;

        if (find) {
            r_value.node = new $NodeClass['_EvaluateNode'](content);
        } else {
            r_value.node = new $NodeClass.TextNode(content);
        }

        return r_value;
    };
})(methodList);
////////////////////////////////////////////////////////////////////////////////
(function (methodList) {
    // 處理 <%- %>
    let $o = {};

    methodList['%-'] = $o;
    //=================================
    $o.solution = function (_content, i) {
        let rightSide = _content.substring(i);

        if (!/^<%-/.test(rightSide)) {
            throw new TypeError('not <%- %> tag');
        }
        let r_value = {
            node: null,
            index: null
        };
        //------------------
        let res = $Tools.findCommandEnd(rightSide, 0);
        //------------------
        let index = res.index;
        let find = res.find;

        let content = rightSide.substring(i, index+1);

        r_value.index = index + i;

        if (find) {
            r_value.node = new $NodeClass['_Escape'](content);
        } else {
            r_value.node = new $NodeClass.TextNode(content);
        }

        return r_value;
    };
})(methodList);
////////////////////////////////////////////////////////////////////////////////
(function (methodList) {
    // 處理 <%= %>
    let $o = {};

    methodList['%='] = $o;
    //=================================
    $o.solution = function (_content, i) {
        let rightSide = _content.substring(i);

        if (!/^<%=/.test(rightSide)) {
            throw new TypeError('not <%= %> tag');
        }
        let r_value = {
            node: null,
            index: null
        };
        //------------------
        let res = $Tools.findCommandEnd(rightSide, 0);
        //------------------
        let index = res.index;
        let find = res.find;

        let content = rightSide.substring(i, index+1);

        r_value.index = index + i;

        if (find) {
            r_value.node = new $NodeClass['_Interpolate'](content);
        } else {
            r_value.node = new $NodeClass.TextNode(content);
        }

        return r_value;
    };
})(methodList);
