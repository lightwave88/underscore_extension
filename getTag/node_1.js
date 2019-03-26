const $util = require('util');

// debugger;

class Node {
    // tagName: 標簽名
    // source: 所有內文
    // head: 標籤頭
    // content: 標籤內容
    // end: 標籤尾
    constructor(tagName, source) {
        this.isEnd = false;
        this.tagName = tagName;
        this.source = source;
        //------------------
        // 用來判別是否是特殊要用的標籤
        this.tag_head;
        this.tag_middle;
        this.tag_foot;

    }
    toJSON() {
        let res;

        if (this.tag_middle != null) {
            res = `${this.tag_head || ''}${this.tag_middle}${this.tag_foot || ''}`;
        } else {
            res = this.source;
        }

        return res;
    }

    print() {
        return (this.source);
    }
}

////////////////////////////////////////////////////////////////////////////////
// 一般節點
class NormalNode extends Node {

}
////////////////////////////////////////////////////////////////////////////////
// 結尾節點
class EndNode extends Node {
    constructor(tagName, source) {
        super(tagName, source);

        this.isEnd = true;
    }
}
////////////////////////////////////////////////////////////////////////////////
class TextNode extends Node {
    constructor(source) {
        super('text', source);
    }
    //---------------------------------
    // TextNode 合併
    merge(node) {
        if (!(node instanceof TextNode)) {
            throw new TypeError('node must instanceof TextNode');
        }
        let sourece = this.source + node.source;
        return (new TextNode(source));
    }
}
////////////////////////////////////////////////////////////////////////////////
// style
class StyleNode extends Node {
    constructor(source) {
        super('style', source);
    }
}
////////////////////////////////////////////////////////////////////////////////
class ScriptNode extends Node {
    constructor(source, head, middle, foot) {
        // console.log($util.inspect(arguments));

        super('script', source);

        if (head) {
            // console.log('head(%s)', head);
            this.tag_head = head;
        }
        if (middle) {
            this.tag_middle = middle;
        }

        if (foot) {
            this.tag_foot = foot;
        }

        this.type;

        console.log(`script: head(%s) middle(%s) foot(%s)`, this.tag_head, this.tag_middle, this.tag_foot);

        // this._checkType();
    }
    //---------------------------------
    print() {
        return (this.content || this.source);
    }
    //---------------------------------
    _checkType() {
        let startTag = this.source.slice(0, (this.startEnd + 1));

        let res = /type=(['"])([^\1]{0,})\1/.exec(startTag);
        if (res != null) {
            this.type = res[2];
            this.type = this.type.trim().toLowerCase();
        }

        // 特殊 script 標籤 type="text/_"
        // 將轉為 <%  %>
        if (this.type != null && /text\/_/.test(this.type)) {
            this.category = '%';
            let endStart = this.source.lastIndexOf('<');
            this.content = this.source.slice((this.startEnd + 1), (endStart + 1));
        }
    }
}
////////////////////////////////////////////////////////////////////////////////

let o = {
    NormalNode: NormalNode,
    EndNode: EndNode,
    TextNode: TextNode,
    StyleNode: StyleNode,
    ScriptNode: ScriptNode,
};
module.exports = o;
