let Tool = {};


(function ($o) {

    //===========================================
    // 給一個標籤起始的文字
    // 然後試著找出 >
    // tagArea 有可能是 startTag, endTag
    $o.findEndTagEnd = function (i, tagArea, content, nodeName) {
        debugger;

        let _chart;
        let j = i + tagArea.length;
        let resContent;
        let nodeName;

        let commandCount = 0;
        let _symbol;

        let res;

        if (endNode == null) {
            endNode = this._isEndNode(tagArea);
        }

        let returnValue = {
            endNode: endNode,
            nodeName: null,
            content: null,
            index: null
        };

        //-----------------------
        // 處理 <tage><tag/>

        if (/^<.*?(?:>|\/>)$/.test(tagArea)) {
            j = i + tagArea.length - 1;

            returnValue.content = content.substring(i, j + 1);
            returnValue.index = j;

            if (nodeName == null) {
                nodeName = this._findNodeNameInTag(resContent);;
            }
            returnValue.nodeName = nodeName;

            return returnValue;
        }
        //-----------------------
        // 處理 <tag......>
        while ((_chart = content[j]) != null) {
            // debugger;

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

                res = /\s[^\s\/>]+?\s*?=\s*?(["'])$/.exec(hasChecked);

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
                        content: resContent,
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
            content: resContent,
            node: 'text',
            index: j
        }
    };
    //===========================================
    $o._isEndNode = function (content) {
        let res = false;

        if (/^<\//.test(content)) {
            res = true;
        }

        return res;
    };
    //===========================================
    // 找出 nodeName
    // length: 指定要找的長度
    $o._findNodeNameInTag = function (content, length) {
        let res;
        if (length != null) {
            content = content.substr(0, length);
        }

        let reg = /<(?:\/)?([^\s>/]+?)(?:\s|\/|>)/;

        if (reg == null) {
            throw new Error('cant find nodeName');
        } else {
            res = reg[1].trim();

        }
        return res;
    };
    //===========================================
})(Tool);







