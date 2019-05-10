let innerHTML = (function () {
    let r_value = function () { 
        throw new Error('your system no supoort');
    };

    // 解決 dom.innerHTML(<,> 會被重編譯)

    // debugger;

    if (typeof (window) != 'object') {
        return r_value;
    }
    const _ = window._ || null;

    // 是否要使用 sessionStorage
    // 預設是不用，執行速度慢
    // 但可以獲得 init_tagNumberMap
    const useSessionStorage = false;

    // 標籤的標籤數
    // 事前設定可以免去辨識的時間
    let init_tagNumberMap = {
        a: 2,
        abbr: 2,
        article: 2,
        bdi: 2,
        body: 2,
        br: 1,
        button: 2,
        code: 2,
        dd: 2,
        details: 2,
        div: 2,
        dl: 2,
        dt: 2,
        em: 2,
        footer: 2,
        form: 2,
        h1: 2,
        h2: 2,
        h3: 2,
        i: 2,
        img: 1,
        input: 1,
        label: 2,
        li: 2,
        main: 2,
        menu: 2,
        menuitem: 2,
        meta: 1,
        nav: 2,
        ol: 2,
        p: 2,
        path: 2,
        pre: 2,
        s: 2,
        section: 2,
        small: 2,
        span: 2,
        strong: 2,
        summary: 2,
        svg: 2,
        table: 2,
        tbody: 2,
        td: 2,
        th: 2,
        thead: 2,
        time: 2,
        title: 2,
        tr: 2,
        ul: 2,
    };
    //==========================================================================

    // 暫存 tagNumber
    class Storage {
        constructor() {
            // debugger;
            this.tagNumberMap;

            if (useSessionStorage && ('sessionStorage' in window)) {
                sessionStorage.setItem('$$_innerHTML', JSON.stringify(init_tagNumberMap));
            } else {
                this.tagNumberMap = Object.assign({}, init_tagNumberMap);
            }
        }
        //--------------------------------------
        // 設定標籤數
        setTagData(tagName, tagNumber) {
            // debugger;

            if (this.tagNumberMap == null) {
                // debugger;
                let data = sessionStorage.getItem('$$_innerHTML');

                if (data == null) {
                    data = {};
                } else {
                    // 速度會被拖慢
                    data = JSON.parse(data);
                }

                if (data[tagName] == null) {
                    data[tagName] = tagNumber;
                    sessionStorage.setItem('$$_innerHTML', JSON.stringify(data));
                }
            } else {
                this.tagNumberMap[tagName] = tagNumber;
            }
        }
        //--------------------------------------
        getTagData(tagName) {
            // debugger;

            let res;

            if (this.tagNumberMap == null) {
                let data = sessionStorage.getItem('$$_innerHTML');

                if (data != null) {
                    data = JSON.parse(data);
                    res = (data[tagName] == null ? null : data[tagName]);
                }
            } else {
                res = (this.tagNumberMap[tagName] == null ? null : this.tagNumberMap[tagName]);
            }
            return res;
        }

    }
    //==========================================================================
    // 工具
    class Tools {
        constructor() {
            this.storage = new Storage();
        }
        //--------------------------------------
        // 取得 tag是單標籤還是雙標籤
        getdomTagNumber(tagName) {
            // debugger;

            let res = this.storage.getTagData(tagName);

            if (res == null) {
                let p = document.createElement('div');
                let target = document.createElement(tagName);

                p.appendChild(target);

                let content = p.innerHTML;

                let list = content.split('>');

                p = null;
                target = null;

                res = (list.length - 1);

                this.storage.setTagData(tagName, res);
            }

            return res;
        }
    }
    //==========================================================================
    // 操作用節點
    class Node {
        constructor(dom, parent, index) {

            this.fn = Node;

            this.parent;
            this.index;
            //------------------
            // 正常標籤會有 tagName
            // 但有些標籤則無
            this.tagName;
            this.nodeName;
            this.tagNumber;
            this.text;
            //------------------
            this.dom = dom;

            // atts
            this.attrs = new Map();
            //------------------
            // 子孫的內文
            this.childContent;
            // 內文陣列
            this.contentLis;
            //------------------
            this.tools = this.fn.tools;

            // 標籤頭
            this.tagHead;
            // 標籤尾
            this.tagfoot;

            this._constructor(parent, index);
        }

        _constructor(parent, index) {
            // debugger;

            if (parent != null) {
                this.parent = parent;
                this.index = index;
            }

            let tagName = this.dom.tagName;

            if (tagName == null) {
                // 非一般 tag
                // 因為不能包含子孫所以是單一 tag

                this.nodeName = this.dom.nodeName.toLowerCase();
                this.text = this.dom.nodeValue;
                this.tagNumber = 1;

            } else {
                // debugger;

                this.tagName = tagName.toLowerCase();
                this.tagNumber = this.tools.getdomTagNumber(this.tagName);

                // 取得屬性
                let attrs = this.dom.attributes;

                for (let i = 0; i < attrs.length; i++) {
                    let attrNode = attrs[i];
                    let attrName = attrNode.nodeName;
                    let attrValue = attrNode.nodeValue;
                    this.attrs.set(attrName, attrValue);
                }

                if (this.tagNumber > 1) {
                    this.tagfoot = `</${this.tagName}>`;
                }

                if (this.attrs.size == 0) {
                    this.tagHead = `<${this.tagName}>`;
                } else {
                    let temp = [];

                    this.attrs.forEach(function (v, k) {
                        let str;
                        if (v == null) {
                            str = k;
                        } else {
                            str = `${k}="${v}"`;
                        }

                        temp.push(str);
                    }, this);

                    let attrStr = temp.join(' ');
                    this.tagHead = `<${this.tagName} ${attrStr}>`;
                }

                if (this.dom.childNodes != null && this.dom.childNodes.length > 0) {
                    let arrayLength = this.dom.childNodes.length;
                    this.contentLis = new Array(arrayLength);
                }
            }
        }

        // 把自己的內文傳給父親
        callParent(parentNode) {
            // debugger;

            let index = this.index;

            let content = this.getContent();

            // 把自己的內文傳給父親
            parentNode.contentLis[index] = content;
            if (index == 0) {
                parentNode.childContent = parentNode.contentLis.join('');
            }
        }

        getContent() {
            debugger;
            let res;

            if (this.tagName == null) {

                /*
                if(/#text/.test(this.tagName)){
                    res = this.text;
                }else if(/#comment/.test(this.tagName)){
                    res = `<!--${this.text}-->`;

                }else{
                    console.log(`problem tag (${this.tagName})`);
                    res = '';
                }
                */

                switch (this.nodeName) {
                    case '#text':
                        res = this.text;
                        break;
                    case '#comment':
                        res = `<!--${this.text}-->`;
                        break;
                    default:
                        console.log(`>>problem tag (${this.tagName})`);

                        // 真的不知道如何處理這怪異的 tag
                        // 會被忽視
                        res = '';
                        break;
                }
            } else {
                if (this.tagNumber == 2) {
                    res = `${this.tagHead}${this.childContent || ''}${this.tagfoot}`;
                } else {
                    if (this.childContent != null) {
                        throw new TypeError(`tag(${this.tagName}) has childs`);
                    }
                    res = `${this.tagHead}`;
                }
            }
            return res;
        }
    }

    Node.tools = new Tools();
    //==========================================================================

    if (_) {
        _.mixin({
            innerHTML: main
        });
    }

    // 記錄資料用
    const nodeList = [];
    //==========================================================================
    // 主要被外調用
    //
    // includeRoot: 輸出的內容是否要包含 root 內容
    function main(dom, includeRoot) {
        
        includeRoot = !!includeRoot;

        let htmlContent;
        let node = new Node(dom);
        nodeList.push(node);

        let i = 0;
        while (i < nodeList.length) {
            debugger;
            let parentNode = nodeList[i];

            let parentDom = parentNode.dom;

            let childs = parentDom.childNodes;

            if (childs != null && childs.length > 0) {

                childs = Array.from(childs);
                childs.forEach(function (dom, i) {
                    debugger;
                    let node = new Node(dom, parentNode, i);
                    nodeList.push(node);
                });
            }
            ++i;
        }
        //----------------------------
        debugger;
        for (let i = (nodeList.length - 1); i >= 0; i--) {
            debugger;
            let node = nodeList[i];

            if (node.parent != null) {
                node.callParent(node.parent);
            }

        }
        debugger;

        let root = nodeList[0];
        nodeList.length = 0;


        if (includeRoot) {
            htmlContent = root.getContent();
        } else {
            htmlContent = root.childContent || '';
        }

        return htmlContent;
    }

    return main;
})();

export { innerHTML };
