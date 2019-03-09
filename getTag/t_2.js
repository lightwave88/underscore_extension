// debugger;

class Node {
    constructor(nodeName, content) {
        this.nodeName = nodeName;
        this.source = content;
        //------------------
        // 用來判別是否是特殊要用的標籤
        this.category;
        this.content;
    }
    toString() {
        return `[${this.nodeName}]${this.content}`;
    }

    print() {
        return (this.source);
    }
}

////////////////////////////////////////////////////////////////////////////////
class NormalNode extends Node {

}
////////////////////////////////////////////////////////////////////////////////
// 結尾節點
class EndNode extends Node {

}
////////////////////////////////////////////////////////////////////////////////
class TextNode extends Node {
    constructor(content) {
        super('text', content);
    }
}
////////////////////////////////////////////////////////////////////////////////
// style
class StyleNode extends Node {
    constructor(content) {
        super('style', content);
    }
}
////////////////////////////////////////////////////////////////////////////////

// 無法判別的 node
class UnknowNode extends Node {
    constructor(content) {
        super(null, content);
    }
}
////////////////////////////////////////////////////////////////////////////////

// 註解標籤
class CommentNode extends Node {
    constructor(content) {
        super(null, content);
    }
}



////////////////////////////////////////////////////////////////////////////////
class ScriptNode extends Node {
    constructor(content) {
        super('script', content);
        this.type;
        this.startEnd;
    }
    //---------------------------------
    setStartEnd(index) {
        this.startEnd = index;
        this._checkType();
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
    UnknowNode: UnknowNode,
    CommentNode: CommentNode,
    ScriptNode: ScriptNode,
};
module.exports = o;


