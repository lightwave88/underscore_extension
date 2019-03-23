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
        debugger;

        console.log('*****findTagEnd>> 找尋標籤結尾標籤*****');

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

            console.log('findTagEnd>> hasChecked(%s)', hasChecked);
            //-----------------------
            // 只確認是否在 [''][""]之間
            if (_symbol != null) {
                // 在 attr 之中
                if (_symbol.test(_chart)) {
                    console.log('out attr(%s)', _symbol.source);
                    // ['"]結尾

                    _symbol = undefined;
                }
            } else {
                // 在 attr 之外

                // 是否遇到 attr.value 開始
                res = /[\s/][^\s\/>]+?\s*?=\s*?(["'])$/.exec(hasChecked);

                if (res != null) {

                    console.log('in attr(%s)', res[1]);
                    // 進入 attr.value
                    // ['"]開頭

                    _symbol = RegExp(res[1]);
                }
            }
            //-----------------------
            if (_symbol == null) {

                 if (/>/.test(_chart)) {
                    // 找到結尾
                    console.log('findTagEnd>> find >')

                    returnValue.content = hasChecked;
                    returnValue.index = j;
                    returnValue.find = true;

                    console.log('**********');

                    return returnValue;
                }
            }

            j++;
        } // while end
        //-----------------------
        // 沒找到結尾
        // 結果是 textNode

        console.log('findTagEnd>> no find >')
        console.log('**********');

        returnValue.content = hasChecked;
        returnValue.index = j;

        return returnValue;
    };
    //===========================================
    // 給一個標籤起始的文字
    // 然後試著找出 >
    //
    // 必須是結束標籤
    // i: < 在 content 中的位置
    $o.findEndTagEnd = function (content, i) {
        debugger;

        let hasChecked = '';

        let j = i;

        if(/</.test(content[i])){
            j = i + 1;
            hasChecked = content[i];
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
            hasChecked += _chart;

            if (/>/.test(_chart)) {

                returnValue.find = true;
                returnValue.index = j;
                returnValue.content = hasChecked;

                return returnValue;
            }

            j++;
        }
        //------------------
        returnValue.content = hasChecked;
        returnValue.index = j;

        return returnValue;
    };
    //===========================================
    $o.isEndNode = function (content) {

        return /^<\//.test(content);
    };
    //===========================================
    // 找出 tagName
    // length: 指定要找的長度
    $o.findNodeNameInTag = function (content, length) {
        debugger;

        let res;
        if (length != null) {
            content = content.substr(0, length);
        }

        let reg = /^<(?:\/)?([^\s>/]+?)(?:\s|\/|>)/;

        if (reg == null) {
            throw new Error('cant find tagName');
        } else {
            res = reg[1].trim();

        }
        return res;
    };

})(Tools);
