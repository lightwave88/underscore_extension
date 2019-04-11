let Tools = {};

module.exports = Tools;

(function ($o) {

    //===========================================
    // 給一個標籤起始的文字
    // 然後試著找出 >
    // 不可以是結束標籤
    //
    // 可以是區塊或單標籤
    //
    // content: 所有文章
    // i: < 在 content 中的位置
    $o.findTagEnd = function (content, i) {
        // debugger;
        console.log('**********');
        console.log('findTagEnd>> 找尋標籤結尾標籤');

        let _chart;

        let hasChecked = '';
        let j = i;

        if (/</.test(content[i])) {
            // 若開頭是 < 開頭，往後一格
            j = i + 1;
            hasChecked = content[i];
        }

        let _symbol;

        let res;

        let returnValue = {
            content: null,
            index: null,
            find: false
        };
        //-----------------------
        // 處理 <tag......>
        while ((_chart = content[j]) != null) {
            // debugger;

            hasChecked += _chart;
            //-----------------------
            // 只確認是否在 [''][""]之間
            if (_symbol != null) {
                // 在 attr 之中
                if (_symbol.test(_chart)) {

                    // ['"]結尾

                    _symbol = undefined;
                }
            } else {
                // 在 attr 之外

                // 是否遇到 attr.value 開始
                res = /[\s/][^\s\/>]+?\s*?=\s*?(["'])$/.exec(hasChecked);

                if (res != null) {
                    // 進入 attr.value
                    // ['"]開頭

                    _symbol = RegExp(res[1]);
                }
            }
            //-----------------------
            if (_symbol == null) {
                if (/>/.test(_chart)) {
                    // 找到結尾

                    returnValue.content = hasChecked;
                    returnValue.index = j;
                    returnValue.find = true;

                    console.log('findTagEnd>> find >')
                    console.log('content is =>%s', returnValue.content);
                    console.log('**********');

                    return returnValue;
                }
            }

            j++;
        } // while end
        //-----------------------
        // 沒找到結尾
        // 結果是 textNode
        returnValue.content = hasChecked;
        returnValue.index = j;
        console.log('findTagEnd>> no find >');
        console.log('**********');

        return returnValue;
    };
    //===========================================
    // 給一個標籤起始的文字
    // 然後試著找出 >
    //
    // 必須是結束標籤
    // i: < 在 content 中的位置
    $o.findEndTagEnd = function (content, i) {
        // debugger;

        let j = i;

        if (/</.test(content[i])) {
            j = i + 1;

        }
        //-----------------------
        let returnValue = {
            content: null,
            index: null,
            find: false
        };
        //-----------------------
        let _chart;

        while ((_chart = content[j]) !== null) {

            if (/>/.test(_chart)) {

                returnValue.find = true;
                returnValue.index = j;
                returnValue.content = content.substring(i, j + 1);

                return returnValue;
            }

            j++;
        }
        //------------------
        returnValue.index = j;
        returnValue.content = content.substring(i, j + 1);

        return returnValue;
    };
    //===========================================
    // 找尋 <%, <%=, <%- 的結尾 %>
    $o.findCommandEnd = function (_content, i) {
        // debugger;

        let _chart;

        // 指令區 {}
        let commandCount_1 = 0;
        // 注釋區
        let commandCount_2 = 0;

        let _symbol;
        // _symbol的脫逸
        let _symbol_1;

        let returnValue = {
            content: null,
            find: false,
            index: null
        };

        let j = i;
        if (/</.test(_content[i])) {
            // 往右偏移
            j += 1;
        }
        //------------------
        while ((_chart = _content[j]) != null) {

            let sample = _content.substring(j - 3, j + 1);

            if (commandCount_1 > 0) {
                debugger;
                // 在文字區中
                if (_symbol_1.test(sample)) {
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

                if (_symbol.test(sample)) {
                    commandCount_2--;
                    _symbol = undefined;
                }
            } else {
                debugger;
                // 非特異區
                _symbol = undefined;
                _symbol_1 = undefined;

                if (/>/.test(_chart)) {

                    debugger;
                    let prevChart = _content[j - 1];
                    if (prevChart != null && /%/.test(prevChart)) {
                        // 正解

                        returnValue.find = true;
                        returnValue.index = j;
                        returnValue.content = _content.substring(i, j + 1);

                        return returnValue;
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
        returnValue.index = j;
        returnValue.content = _content.substring(i, j + 1);

        return returnValue;
    };
    //===========================================
    $o.isEndNode = function (content) {

        return /^<\//.test(content);
    };
    //===========================================
    // 找出 tagName
    // length: 指定要找的長度
    $o.isCommandTagHead = function (content) {
        // g[1]: tagName
        let res = /^<(%[-=]?)/i.exec(content);

        return res;
    };
    //===========================================
    $o.isTagHead = function (rightContent) {

        // g[1]: isEndtag
        // g[2]: tagName
        let res = /^<(\/)?([a-z][^\s>/]{0,}?)(?:\s|\/|>)/i.exec(rightContent);
        return res;
    };
    //===========================================

})(Tools);
