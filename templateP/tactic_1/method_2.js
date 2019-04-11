const $NodeClass = require('../node_1a');

const $Tools = require('../tools_1');
////////////////////////////////////////////////////////////////////////////////
//
// 提供特殊 tag 解決方式
//
////////////////////////////////////////////////////////////////////////////////
const methodList = {};
module.exports = methodList;

////////////////////////////////////////////////////////////////////////////////
(function (methodList) {
    // 處理 script
    let $o = {};

    methodList['script'] = $o;
    //=================================
    // _content: <script 開頭的字串
    // 返回 {node, r_content}
    $o.solution = function (rightSide) {
        debugger;
        // console.log(this.info);


        let res;

        let r_value = {
            node: null,
            'r_content': ''
        };

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

        } else {
            // script.head ok
            // find script.end

            console.log('script.head ok, find script.end');
            res = this._findScriptEnd(rightSide, index);

            // debugger;

            index = res.index;
            find = res.find;

            // 整個 <script>.*</script> 的文字內容
            content = res.content;
            //------------------
            // 相對座標

            if (find) {
                // 確定 script all ok

                let endStart_i = this._findendStart(content);

                console.log('確定 script all ok');
                let tag_haed = headContent;
                let tag_content = content.substring(startEnd_i + 1, endStart_i);
                let tag_foot = content.substring(endStart_i);

                r_value.node = new $NodeClass.ScriptNode(content, tag_haed, tag_content, tag_foot);
            } else {
                // script tag error
                console.log('script tag error');
                r_value.node = new $NodeClass.TextNode(content);
            }

            r_value['r_content'] = rightSide.substring(index + 1);

        }
        return r_value;
    }
    //=================================
    // content
    // 會是 <script>......開頭
    // i 是想從那開始搜索，通常會跳過 <script>
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


        let r_value = {
            find: false,
            index: null,
            content: null
        };
        //------------------
        while ((_chart = content[j]) != null) {


            if (commandCount_1 > 0) {
                // debugger;

                // 抽樣 4 個字
                let sample = content.substring(j - 3, j + 1);

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
                // debugger;

                // 抽樣 4 個字

                let sample = content.substring(j - 3, j + 1);

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

                        r_value.index = index;
                        r_value.find = true;
                        r_value.content = content.substring(0, index + 1);

                        return r_value;
                    }

                } else if (/[`'"]/.test(_chart)) {
                    // 文字區
                    commandCount_1++;
                    _symbol = RegExp(_chart);
                    _symbol_1 = RegExp(`\\\\${_chart}$`);

                } else {
                    // 取 4 個字
                    let sample = content.substring(j - 3, j + 1);

                    if (/\/\/$/.test(sample)) {
                        // 註釋區
                        commandCount_2++;

                        // 換行符號
                        _symbol = /(\r\n|\n)$/;
                    }
                }
            }
            j++;
        } // while end
        //------------------
        r_value.index = j;
        r_value.content = content;

        return r_value;
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
    // rightSide: 以 <% 為開頭的字串
    // 返回 {node, r_content}
    $o.solution = function (rightSide) {
        debugger;

        if (!/^<%/.test(rightSide)) {
            throw new TypeError('not <% %> tag');
        }
        let r_value = {
            node: null,
            'r_content': ''
        };
        //------------------
        let { index, find, content } = $Tools.findCommandEnd(rightSide, 0);
        //------------------
        debugger;

        if (find) {
            r_value.node = new $NodeClass['_EvaluateNode'](content);
        } else {
            r_value.node = new $NodeClass.TextNode(rightSide);
        }
        r_value['r_content'] = rightSide.substring(index + 1);

        return r_value;
    };
})(methodList);
////////////////////////////////////////////////////////////////////////////////
(function (methodList) {
    // 處理 <%- %>
    let $o = {};

    methodList['%-'] = $o;
    //=================================
    // rightSide: 以 <%- 為開頭的字串
    // 返回 {node, r_content}
    $o.solution = function (_content) {
        let rightSide = _content;

        if (!/^<%-/.test(rightSide)) {
            throw new TypeError('not <%- %> tag');
        }
        let r_value = {
            node: null,
            'r_content': ''
        };
        //------------------
        let res = $Tools.findCommandEnd(rightSide, 0);
        //------------------

        if (find) {
            r_value.node = new $NodeClass['_Escape'](content);
        } else {
            r_value.node = new $NodeClass.TextNode(rightSide);
        }
        r_value['r_content'] = rightSide.substring(index + 1);

        return r_value;
    };
})(methodList);
////////////////////////////////////////////////////////////////////////////////
(function (methodList) {
    // 處理 <%= %>
    let $o = {};

    methodList['%='] = $o;
    //=================================
    // rightSide: 以 <%- 為開頭的字串
    // 返回 {node, r_content}
    $o.solution = function (_content) {
        let rightSide = _content;

        if (!/^<%=/.test(rightSide)) {
            throw new TypeError('not <%= %> tag');
        }
        let r_value = {
            node: null,
            'r_content': ''
        };
        //------------------
        let { index, find, content } = $Tools.findCommandEnd(rightSide, 0);
        //------------------
        if (find) {
            r_value.node = new $NodeClass['_Interpolate'](content);
        } else {
            r_value.node = new $NodeClass.TextNode(rightSide);
        }
        r_value['r_content'] = rightSide.substring(index + 1);

        return r_value;
    };
})(methodList);
