// debugger;

class Node {
    constructor(nodeName, content) {
        this.nodeName = nodeName;
        this.content = content;
    }
    toString(){
        return `[${this.nodeName}]${this.content}`;
    }
}

////////////////////////////////////////////////////////////////////////////////
class NormalNode extends Node {
    
}

////////////////////////////////////////////////////////////////////////////////
class TextNode extends Node {
    constructor(content) {
        super('text', content);
    }
}
////////////////////////////////////////////////////////////////////////////////

class StyleNode extends Node{
    constructor(content) {
        super('style', content);
    }
}




////////////////////////////////////////////////////////////////////////////////
class ScriptNode extends Node {
    constructor(content) {
        super('script', content);
    }
}
////////////////////////////////////////////////////////////////////////////////

let o = {
    NormalNode: NormalNode,
    ScriptNode: ScriptNode,
    TextNode: TextNode,
    StyleNode: StyleNode
};
module.exports = o;


