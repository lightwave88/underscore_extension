const $NodeClass = require('./node_1');

const $Tools = require('./tools');
////////////////////////////////////////////////////////////////////////////////
//
// 提供特殊 tag 解決方式
//
////////////////////////////////////////////////////////////////////////////////
const methodList = {};
module.exports = methodList;


(function () {
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

})();
////////////////////////////////////////////////////////////////////////////////
(function () {
    // 處理 script
    let $o = {};

    methodList['script'] = $o;
    //=================================
    $o.solution = function (_content, i) {
        // debugger;
        // console.log(this.info);

        let rightSide = _content.substrin(i);

        let res;
        let r_value = {
            find: false,
            index: null,
            content: null
        };
        // 找開頭的 end
        // 找開頭的 end
        let { content, index, find } = $Tools.findTagEnd(rightSide, 0);

        // 相對座標
        let startEnd_i = index;

        debugger;
        //-----------------------
        if (!find) {
            r_value.node = new TextNode(content);
            r_value.index = index + 1;
        } else {
            // 找最後的 end
            res = this._findEnd(rightSide, index);
            index = res.index;
            find = res.find;
            content = res.content;

            // 相對座標
            let endStart_i = this._findendStart(content);

            if (find) {

                let tag_haed = content.substrin(0, startEnd_i + 1);

                let tag_content = content.substring(startEnd + 1, endStart_i);
                let tag_end = content.substring(endStart_i);

                r_value.node = new ScriptNode(content, tag_haed, tag_content, tag_end);

            } else {
                r_value.node = new TextNode(_content);
            }

            r_value.index = index;
        }
        return r_value;
    }
    //=================================
    $o._findEnd = function (content, i) {
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
                    let sample = content.substr(j + 1, 10);

                    if (/^\/script>/.test(sample)) {
                        // 正解

                        let index = sample.search(/>/);
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
    };
    //=================================
    $o._findendStart = function (content) {
        let index = content.lastIndexOf('<');
        return index;
    };

})();
