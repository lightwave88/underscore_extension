
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
    // tagContent(<......>)
    $o.checkTagType = function (tagContent) {
        // debugger;
        if (/^<!--[^>]{0,}-->$/.test(tagContent)) {
            return true;
        }
        return false;
    };
    //----------------------------
    // 提供解決
    // 回傳 tag 與 tag 終結的位置
    $o.solution = function (tagContent) {
        let node = new $NodeClass.NormalNode('comment', tagContent);
        return node;
    }
})();


///////////////////////////////////////////////////////////////////////////////
