
// debugger;
const $NodeClass = require('./node_1');


const $Tools = require('./tools');
///////////////////////////////////////////////////////////////////////////////
//
// 提供規則，解析出 tag
//
///////////////////////////////////////////////////////////////////////////////

const methodList = [];
module.exports = methodList;
///////////////////////////////////////////////////////////////////////////////

// <!-- -->

(function () {
    $o = {
        level: 0,
        tagName: '!--',
        info: '<!-- -->'
    };

    methodList.push($o);
    //----------------------------
    // 提供辨識
    $o.checkTagType = function (tagArea) {
        // debugger;
        if (/^<!--/.test(tagArea)) {
            return true;
        }
        return false;
    };
    //----------------------------
    // 提供解決
    // 回傳 tag 與 tag 終結的位置
    $o.solution = function(content, i) {
        debugger;

        let hasChecked = content[i];
        let j = i+1;

        while ((_chart = content[j]) != null) {
            // debugger;

            hasChecked += _chart;

            //------------------
            if (/-->$/.test(hasChecked)) {
                // close
                return {
                    node: new $NodeClass.NormalNode('comment', hasChecked),
                    index: j
                };
            }
            j++;
        } // end while
        //------------------
        return {
            node: new TextNode(hasChecked),
            index: j
        };
    }
})();


///////////////////////////////////////////////////////////////////////////////
