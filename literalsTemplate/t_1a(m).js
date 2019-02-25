///////////////////////////////////////////////////////////////////////////////
//
// 目的將 <script type="text/_"><script> 轉換成 <%  %>
// 可作為解析 dom 樹的雛型 
//
// 最大的麻煩是 script 裡面的內容會嚴重干擾分段
// 這裡採用 script 套嵌的檢查 不保險 若內容有 script 未關閉
// 就會出錯
// 
///////////////////////////////////////////////////////////////////////////////
module.exports = Node;


function Node(content, p) {
    this.parent;
    this.content = content;
    this.childs = [];
    this.reg_1 = /<script[^<>]*>/i;
    this.reg_2 = /<\/script>/i;
    this.reg_3 = /type=(['"])([^'"]*)\1/i;
    this.reg_4 = /<\/script>$/;
    this.head;
    this.foot;

    if (p != null) {
        this.parent = p;
        this.parent.addNode(this);
    }

    this.__construct();
}

(function () {
    this.__construct = function () {
        this.split();
        this.content = null;
    };

    // 分割
    this.split = function () {
        debugger;
        let content = this.content.slice();

        do {
            debugger;

            let start = 0;
            let index = content.search(this.reg_1);

            if (index == 0) {
                // 切 script
                content = this._findScriptEnd(content);

            } else {
                // 切 text
                index = (index == -1) ? content.length : index;

                let _content = content.substring(start, index);
                if (_content) {
                    new TextNode(_content, this);
                }
                content = content.substring(index);
            }
            debugger;
        } while (content);
    };
    //------------------
    this._findScriptEnd = function (content) {
        let front = 0;
        let foot = 0;
        let total = content.length;

        let _content = content.slice();

        // 先找到 <script>
        let index = _content.search(this.reg_1);

        if (index >= 0) {
            front++;
            _content = _content.replace(this.reg_1, function (m, i) {
                return '';
            });
        }
        //----------------------------
        while (front > 0 && front != foot && _content.length > 0) {
            debugger;
            // let find = true;
            let index_1 = _content.search(this.reg_1);
            let index_2 = _content.search(this.reg_2);

            index_1 = (index_1 < 0)? _content.length:index_1;
            index_2 = (index_2 < 0)? _content.length:index_2;


            if (index_1 < index_2) {
                front++;

                _content = _content.substring(index_1);

            } else if (index_2 < index_1) {
                foot++;
                _content = _content.substring(index_2);
            } else {
                // 怪異
                break;
            }

            let i = _content.search(/>/);

            if (i >= 0) {
                _content = _content.substring(i + 1);
            }
        }
        //----------------------------
        debugger;
        let replaceCount = total - _content.length;
        let scriptContent = content.substring(0, replaceCount);

        if (front != foot) {
            // 解析錯誤
            throw new Error(`script no close (${scriptContent})`);
        } else {
            debugger;

            new ScriptNode(scriptContent, this);

            return _content;
        }
    };
    //------------------
    this.addNode = function (node) {
        this.childs.push(node);
    };
    //------------------
    // 最後輸出
    this.print = function () {
        let content = '';

        if(this.head){
            content += this.head;
        }

        if(this instanceof TextNode){
            content += this.content;
        }

        if (this.childs.length) {
            this.childs.forEach(function (c) {
                content += c.print();
            });
        }

        if(this.foot){
            content += this.foot;
        }

        return content;
    };
}).call(Node.prototype);
//----------------------------

function TextNode(content, p) {
    Node.call(this, content, p);
}
TextNode.prototype = Object.create(Node.prototype);

(function () {
    this.__construct = function () {
        
    };
}).call(TextNode.prototype);
//----------------------------

function ScriptNode(content, p) {
    this.type;
    Node.call(this, content, p);
}

ScriptNode.prototype = Object.create(Node.prototype);

(function () {
    this.__construct = function () {
        debugger;        
        
        // get type
        this._checkType();

        this._check1();

        this.split();

        this.content = null;
    };
    //------------------
    this.split = function(){
        new TextNode(this.content, this);
    };
    //------------------    
    this._checkType = function () {
        let self = this;

        this.content = this.content.replace(this.reg_1, function (m) {
            debugger;
            self.head = m;
            return '';
        });

        this.content = this.content.replace(this.reg_4, function (m) {
            debugger;
            self.foot = m;
            return '';
        });

        this.head.replace(this.reg_3, function (m, g1, g2) {
            debugger;
            if (g2 && g2.length) {
                self.type = g2;
            }
        });
    };
    //------------------
    this._check1 = function(){
        if(/text\/_/i.test(this.type)){
            this.head = '<%';
            this.foot = '%>';
        }
    };
}).call(ScriptNode.prototype);
