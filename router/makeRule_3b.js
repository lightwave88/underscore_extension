////////////////////////////////////////////////////////////////////////////////
//
// 以 ASP.NET Router 規則為準
// 但加入 (...) => 取帶 ASP.NET {...?}不易瞭解
// {...?} => ({...?})
// (...) => 化為 (?:...)?
// 用 (/) 作為區塊劃分
// ()裡面不能有(/)會增加混淆度
// {*...} 必須放在最後
//
// key => ()*{}
//
////////////////////////////////////////////////////////////////////////////////

(function (global) {

    if (typeof window != "undefined") {
        global.router = router;
    } else if (typeof exports != 'undefined' && !exports.nodeType) {
        module.exports = function (_) {
            return factory(_);
        };
    }

    function factory(_) {
        // 必須脫逸的命令
        // (\{, \}, \(, \), \*, \/)
        const get_reg_escape_1 = function () {
            return /\\[{}()*/]/g;
        };

        // 針對正則保留字拖逸
        // (^, [, ], \, -, /, ., |, ?, $, +, ,)
        const get_reg_escape_2 = function () {
            return /(\^|\[|\]|\\|\-|[.|?$+,])/g;
        };

        const escapeFirst = "@@@__";
        const escapeLast = "__@@@";

        const getEscapeReg = function () {
            let reg = escapeFirst + "(\\d+)" + escapeLast;
            return new RegExp(reg, "g");
        };

        // 策略
        // 把字串拆成 nodeList 的策略
        const strategyList = [];

        ////////////////////////////////////////////////////////////////////////////
        function maker(str) {
            // debugger;

            let ruleMaker = new RegRuleMaker(str);

            // debugger;
            ruleMaker.generatorNodeList();

            ruleMaker.flatten();

            ruleMaker.makeRule();

            return {
                regStr: ruleMaker.regStr,
                reg: ruleMaker.reg,
                keyList: ruleMaker.keyList
            }
        }
        ////////////////////////////////////////////////////////////////////////////

        // 主要將 str 轉成 正則表達式
        // 還有 keyList
        function RegRuleMaker(str) {
            this.fn = RegRuleMaker;

            // 命令脫逸用的
            this.uid = 0;
            this.escapeMap = {};
            //-----------------------
            this.str;

            // 自串尾部是否有(/)
            this.hasLastSeparate = false;

            this.blocks = [];

            // 統計有些些變數名稱
            this.keyList = [];

            // 把所有 (BlockNode, ScratchNode) 的child 都攤開
            // 變數檢查用
            this.flattenNodeList = [];

            // 包含 blockNode, separateNode
            this.nodeList = [];

            this.reg;

            this.regStr = "";
            //----------------------------
            this.__construct(str);
        }

        (function () {

            this.__construct = function (str) {
                // debugger;
                this.str = str;

                this._check_1();

                // 脫逸命令 \{, \}, \(, \), \*, \/
                this._escapeCharacter_1();

                // 針對正則保留字拖逸
                this._escapeCharacter_2();
            };
            //----------------------------------------------------------------------

            this.generatorNodeList = function () {
                // debugger;

                let $this = this;

                let str = this.str.replace(/^\//g, "");

                str = str.replace(/\/$/, function () {
                    $this.hasLastSeparate = true;
                    return "";
                });
                //----------------------------
                // 處理(/)化成各區塊
                this.blocks = str.split(/\//g);
                let node;

                node = new SeparateNode("/", this, this);
                this.nodeList.push(node);

                //-----------------------
                for (var i = 0; i < this.blocks.length; i++) {
                    let blockStr = this.blocks[i];

                    // 重要入點
                    node = new BlockNode(blockStr, this, this);
                    this.blocks[i] = node;

                    this.nodeList.push(node);

                    if (this.blocks[i + 1] != null) {
                        node = new SeparateNode("/", this, this);
                        this.nodeList.push(node);
                    }
                }
                //-----------------------
                if (this.hasLastSeparate) {
                    node = new SeparateNode("/", this, this);
                    this.nodeList.push(node);
                }
            };
            //----------------------------------------------------------------------
            // 攤平子節點
            // 供檢查用
            this.flatten = function () {
                // this.nodeList 裡面只包含 BlockNode, SeparateNode
                for (let i = 0, node; node = this.nodeList[i]; i++) {
                    let nList = node.flatten();

                    this.flattenNodeList = this.flattenNodeList.concat(nList);
                }

                //-----------------------
                (function () {
                    // for test

                    console.log("----↓----");
                    let str = "";
                    this.flattenNodeList.forEach(function (node) {
                        try {
                            str += node.toString();
                        } catch (error) {
                            console.log(node.nodeName);
                        }
                    });
                    console.log(str);
                    console.log("----↑----");

                    console.log("----↓----");
                    str = "";
                    this.nodeList.forEach(function (node) {
                        str += node.toString();
                    });
                    console.log(str);
                    console.log("----↑----");
                }).call(this);
            };
            //----------------------------------------------------------------------
            this.makeRule = function () {

                this.flattenNodeList.forEach(function (node, i) {
                    let nextNode = null;

                    if (this.flattenNodeList[i + 1] != null) {
                        nextNode = this.flattenNodeList[i + 1];
                    }

                    if (typeof (node.finalCheck) == "function") {
                        node.finalCheck(nextNode);
                    }

                }, this);
                //-----------------------
                // 取得 keyList
                this.flattenNodeList.forEach(function (node) {
                    let key = node.getKey();

                    if (key == null) {
                        return;
                    }

                    if (!key) {
                        throw new Error("key error")
                    }

                    this.keyList.push(key);
                }, this);

                //-----------------------
                // 取得 regStr

                this.nodeList.forEach(function (node) {
                    // console.log("test(%s)", node.nodeName);
                    let regStr = node.printReg();
                    this.regStr += regStr;
                }, this);

                this.regStr = "^" + this.regStr + "$";
                //-----------------------

                // console.log("final=> %s", this.regStr);
                console.log("keyList(%s)", JSON.stringify(this.keyList));

                try {
                    this.reg = new RegExp(this.regStr);
                    // console.dir(this.reg);
                } catch (e) {
                    console.log("make reg err " + e);
                }

            };
            //----------------------------------------------------------------------
            this._check_1 = function () {
                // debugger;

                this.str = this.str.trim();

                if (!/^\//.test(this.str)) {
                    // 開頭必須是 /
                    this.str = "/" + this.str;
                }
            };
            //----------------------------------------------------------------------
            // 脫逸命令 \{, \}, \(, \), \*, \/
            this._escapeCharacter_1 = function () {
                // debugger;

                let reg = get_reg_escape_1();
                let $this = this;

                this.str = this.str.replace(reg, function (m) {
                    // debugger;

                    let uid = $this.uid++;
                    let replace = escapeFirst + uid + escapeLast;

                    $this.escapeMap[uid] = m;
                    return replace;
                });
            };
            //----------------------------------------------------------------------
            // 針對正則保留字拖逸
            // 但不對 {}*()/ 處理
            this._escapeCharacter_2 = function () {
                // debugger;

                // 特殊字元
                let reg = get_reg_escape_2();
                this.str = this.str.replace(reg, function (m, g) {
                    // debugger;
                    return ("\\" + g);
                });
            };
            //----------------------------------------------------------------------

        }).call(RegRuleMaker.prototype);

        ////////////////////////////////////////////////////////////////////////////
        // 原型
        function Node() {
            this.fn = Node;
            this.id = this.fn.uid++;

            // 取用策略的等級
            this.priority;
            this.nodeName;

            // RegRuleMaker 的實例化
            this.root;

            // 代表字串內容
            this.str = '';

            // 包住他的容器
            this.parent;


            // reg string
            // 最後結果
            this.reg;

            // 子節點
            this.childNodeList = [];


            this.keyName;
        }

        Node.uid = 0;

        (function () {

            //----------------------------------------------------------------------
            // 所有節點都必須實作此
            this.printReg = function () {
                throw new Error("need printReg()");
            };
            //----------------------------------------------------------------------
            this.getKey = function () {
                return null;
            };
            //----------------------------------------------------------------------

            this._setStr = function (str) {
                str = String(str);

                return (str || "");
            };
            //----------------------------------------------------------------------
            // (BlockNode, ScratchNode)專用
            // 返回 childNodeList
            this._generateNodes = function () {
                // debugger;

                let nodeList = [this.str];
                let priority = this.priority;

                while (true) {
                    // debugger;
                    // 求解
                    let solutionList = this._findSolution(priority);

                    // debugger;
                    if (!solutionList) {
                        // 無解算
                        break;
                    }

                    for (var i = 0, solve; solve = solutionList[i]; i++) {
                        nodeList = solve.solve(nodeList, this, this.root);
                    }
                    // debugger;
                    ++priority;
                }
                return nodeList;
            };
            //----------------------------------------------------------------------
            // 找尋分析節點方法
            this._findSolution = function (priority) {
                // debugger;

                let solutionList = strategyList.filter(function (s) {
                    // debugger;
                    let s1 = s.priority;
                    let judge = (s1 == priority);

                    return judge;
                });

                return (solutionList.length ? solutionList : null);
            };
            //----------------------------------------------------------------------
            // 恢復被命令脫逸過的字串
            this._revertEscapCommand = function (str) {
                // debugger;

                let reg = getEscapeReg();
                let escapeMap = this.root.escapeMap;

                str = str.replace(reg, function (m, g1) {
                    let replace = escapeMap[g1];

                    if (replace == null) {
                        let error = "can't get (" + g1 + ") in escapeMap";
                        throw new Error(error);
                    }
                    delete escapeMap[g1];

                    return replace;
                });
                return str;
            };
            //----------------------------------------------------------------------
            // 攤平節點
            this.flatten = function () {
                let nodeList = [];

                if (!this.childNodeList) {
                    nodeList.push(this);
                } else {
                    for (let i = 0, child; child = this.childNodeList[i]; i++) {

                        console.log("nodeName(%s)", child.nodeName);

                        let nList = child.flatten();

                        nodeList = nodeList.concat(nList);
                    }
                }
                //----------------------------
                return nodeList;
            };
        }).call(Node.prototype);

        ////////////////////////////////////////////////////////////////////////////

        // block
        function BlockNode(str, parent, root) {
            Node.apply(this, arguments);
            // 策略
            this.priority = 0;
            this.nodeName = "block";

            // 攤平的節點
            this.flattenNodeList = [];

            this.__construct(str, parent, root);
        }

        BlockNode.prototype = Object.create(Node.prototype);

        (function () {
            this.__construct = function (str, parent, root) {
                // debugger;

                this.root = root;

                this.str = this._setStr(str);

                this.generateNodes();

                // console.log(this.toString());
            };
            //----------------------------------------------------------------------
            // API
            // 把文字組成 nodeList
            this.generateNodes = function () {
                // debugger;

                this.childNodeList = this._generateNodes(this);

                // console.log("block childNodeList.length(" + this.childNodeList.length + ")");
            };
            //----------------------------------------------------------------------
            this.printReg = function () {
                let str = "";

                for (let i = 0, child; child = this.childNodeList[i]; i++) {
                    let s = child.printReg();
                    str += s;
                }

                return str;
            };
            //----------------------------------------------------------------------

            this.toString = function () {
                let str = "[[" + this.nodeName + ":";
                for (let i = 0, node; node = this.childNodeList[i]; i++) {
                    str += node.toString() + ","
                }
                str += "]]";

                return str;
            };
        }).call(BlockNode.prototype);

        ////////////////////////////////////////////////////////////////////////////
        // ()
        function ScratchNode(str, parent, action) {
            Node.apply(this, arguments);
            this.priority = 1;
            this.nodeName = "scratch";
            this.__construct(str, parent, action);
        }
        ScratchNode.prototype = Object.create(Node.prototype);

        (function () {
            this.__construct = function (str, parent, root) {
                this.root = root;

                this.parent = parent;

                this.str = this._setStr(str);

                this._check_1();

                this.generateNodes();

                // console.log("Scratch(%s) => (%s)", this.str, this.toString());
            };
            //----------------------------------------------------------------------
            // 對外 API
            // 分析 (字串, {...}, {*...})
            // 把文字解析成 nodeList
            this.generateNodes = function () {
                this.childNodeList = this._generateNodes(this);
            };
            //----------------------------------------------------------------------
            this._check_1 = function () {
                if (/\//g.test(this.str)) {
                    throw new Error("() can't has /");
                }

                if (/^\s*$/.test(this.str)) {
                    throw new Error("ScratchNode not word");
                }
            };
            //----------------------------------------------------------------------
            // 比較麻煩
            this.printReg = function () {
                let res = '';

                for (let i = 0, child; child = this.childNodeList[i]; i++) {
                    res += child.printReg();
                }

                res = "(?:" + res + ")?";

                return res;
            };
            //----------------------------------------------------------------------
            this.toString = function () {
                let str = "[" + this.nodeName + ":";
                for (let i = 0, node; node = this.childNodeList[i]; i++) {
                    str += node.toString() + ","
                }
                str += "]";
                return str;
            };

        }).call(ScratchNode.prototype);
        ////////////////////////////////////////////////////////////////////////////
        // {...}
        function VariableNode(str, parent, root) {
            Node.apply(this, arguments);

            this.nodeName = "variable";
            this.childNodeList = null;

            // 檢查用
            this.isLast;

            this.__construct(str, parent, root);
        }


        VariableNode.prototype = Object.create(Node.prototype);

        (function () {
            this.__construct = function (str, parent, root) {
                // debugger;

                this.root = root;

                this.parent = parent;

                this.str = this._setStr(str);

                this._check_1();
                //-----------------------
                // 還原脫逸字
                this.str = this._revertEscapCommand(this.str);

                this._getKey();
            };
            //----------------------------------------------------------------------
            this.getKey = function () {
                return this.keyName;
            };
            //----------------------------------------------------------------------
            // block 最後檢查
            this.finalCheck = function (nextNode) {

                let judge = (nextNode instanceof VariablePlusNode || nextNode instanceof VariableNode);

                if (judge) {
                    let error = "(" + this.nodeName + ") nextNode can't be {...} or {*...}";
                    throw new Error(error);
                }
                // 處理 this.isLast
                this.isLast = (nextNode == null) ? true : false;
            };
            //----------------------------------------------------------------------

            this._getKey = function () {
                this.keyName = this.str;
                if (/^\s*$/.test(this.keyName)) {

                    let error = "(this.str) can't get key";
                    throw new Error(error);
                }
            };

            this._check_1 = function ($this) {
                if (/^\s*$/.test(this.str)) {
                    throw new Error("VariableNode not word");
                }
            };
            //----------------------------------------------------------------------
            // 決定最後的輸出格式
            this.printReg = function () {

                if (this.isLast == null) {
                    let error = "(" + this.str + ") no check isLast"
                    throw new Error(error);
                }

                let res = "([^/]*?)"
                if (this.isLast) {
                    res = "([^/]*)";
                }
                return res;
            };
            //----------------------------------------------------------------------
            this.toString = function () {
                let str = "(" + this.nodeName + ":" + this.str + ")";
                return str;
            };
        }).call(VariableNode.prototype);
        ////////////////////////////////////////////////////////////////////////////
        // {*...}
        function VariablePlusNode(str, parent, root) {
            Node.apply(this, arguments);
            this.nodeName = "variablePlus";
            this.keyName;
            this.childNodeList = null;

            this.__construct(str, parent, root);
        }

        VariablePlusNode.prototype = Object.create(Node.prototype);

        (function () {
            this.__construct = function (str, parent, root) {
                // debugger;

                this.root = root;

                this.parent = parent;

                this.str = this._setStr(str);
                //-----------------------
                // 還原脫逸字
                this.str = this._revertEscapCommand(this.str);

                this._getKey();
            };
            //----------------------------------------------------------------------
            this.finalCheck = function (nextNode) {

                let judge = (nextNode instanceof VariablePlusNode || nextNode instanceof VariableNode);

                if (judge) {
                    let error = "(" + this.nodeName + ") nextNode can't be {} or {*}";
                    throw new Error(error);
                }
            };
            //----------------------------------------------------------------------
            // 取得 key
            this._getKey = function () {
                let keyList = this.str.match(/^[*](.*)/g);

                if (Array.isArray(keyList) && keyList[0]) {
                    this.keyName = keyList[0];
                } else {
                    let error = "(this.str) can't get key";
                    throw new Error(error);
                }
            };
            //----------------------------------------------------------------------
            this.getKey = function () {
                return this.keyName;
            };
            //----------------------------------------------------------------------
            // 決定最後的輸出格式
            this.printReg = function () {
                let res = "(.*)";
                return res;
            };
            //----------------------------------------------------------------------
            this.toString = function () {
                let str = "(" + this.nodeName + ":" + this.str + ")";
                return str;
            };
        }).call(VariablePlusNode.prototype);
        ////////////////////////////////////////////////////////////////////////////
        // 純文字
        function StringNode(str, parent, root) {
            Node.apply(this, arguments);
            this.nodeName = "string";
            this.childNodeList = null;

            this.__construct(str, parent, root);
        }

        StringNode.prototype = Object.create(Node.prototype);

        (function () {
            this.__construct = function (str, parent, root) {

                this.root = root;

                this.parent = parent;

                this.str = this._setStr(str);
                //-----------------------
                // 還原脫逸字
                this.str = this._revertEscapCommand(this.str);
            };
            //----------------------------------------------------------------------
            // 輸出
            this.printReg = function () {
                return this.str;
            };
            //----------------------------------------------------------------------
            this.toString = function () {
                let str = "(" + this.nodeName + ":" + this.str + ")";
                return str;
            };
        }).call(StringNode.prototype);

        ////////////////////////////////////////////////////////////////////////////
        // 分隔符號
        function SeparateNode(str, parent, root) {
            Node.apply(this, arguments);
            this.nodeName = "separate";
            this.childNodeList = null;

            this.__construct(str, parent, root);
        }

        SeparateNode.prototype = Object.create(Node.prototype);

        (function () {
            this.__construct = function (str, parent, root) {
                this.str = "/";
                this.parent = parent;
                this.root = root;
            };

            this.printReg = function () {
                return "[/]";
            };

            //----------------------------------------------------------------------
            this.toString = function () {
                let str = "(" + this.nodeName + ":" + this.str + ")";
                return str;
            };
        }).call(SeparateNode.prototype);
        ////////////////////////////////////////////////////////////////////////////
        // 策略

        // 策略原型
        let strategy = {
            name: "",

            // 優先權
            priority: null,

            parent: null,

            root: null,

            // 解決方法
            solve: function (str, parent, root) {
                // debugger;

                this.parent = parent;
                this.root = root;

                let nodeList = [];
                //-----------------------
                if (Array.isArray(str)) {
                    nodeList = this._isArray(str);
                } else {
                    throw new Error(".....check here.....");
                    nodeList = this._isStr(str);
                }
                //-----------------------
                this.parent = undefined;
                this.root = undefined;
                return nodeList;
            },

            "_isArray": function (_nodeList) {
                let nodeList = [];

                for (let i = 0, nodel; node = _nodeList[i]; i++) {
                    // debugger;

                    if (typeof node == "string") {
                        let nList = this._isStr(node);
                        nodeList = nodeList.concat(nList);
                    } else {
                        nodeList.push(node);
                    }
                }

                return nodeList;
            }
        };
        //--------------------------------------
        // 把 scratchNode 拆出來
        let scratchNode_strategy = (function () {

            // 繼承策略原型
            $this = _.extend({}, strategy);

            // 把自己加入策略陣列中
            strategyList.push($this);

            $this.name = "scratch";

            $this.priority = 0;
            //----------------------------
            $this._isStr = function (str) {
                // debugger;

                let nodeList = [];
                let _targetNodeList = [];

                let $this = this;
                //-----------------------
                // 先檢測不合規則就先算了
                if (!/\([^()]*?\)/.test(str)) {

                    // 規則不適用
                    nodeList.push(str);

                } else {
                    str = str.replace(/\(([^()]*?)\)/g, function (m, g1) {
                        let node = new ScratchNode(g1, $this.parent, $this.root);
                        _targetNodeList.push(node);
                        return "/";
                    });
                    //-----------------------
                    // debugger;
                    let reg = /^([^/]*?)\//;

                    while (reg.test(str)) {

                        str = str.replace(reg, function (m, g1) {
                            if (g1) {
                                nodeList.push(g1);
                            }

                            if (_targetNodeList.length) {
                                let node = _targetNodeList.shift();
                                nodeList.push(node);
                            }
                            return "";
                        });
                    }
                    //-----------------------
                    if (str) {
                        nodeList.push(str);
                    }
                }
                //-----------------------
                return nodeList;
            };
            //----------------------------

            return $this;
        })();
        //--------------------------------------
        let variable_strategy = (function () {

            // 繼承策略原型
            $this = _.extend({}, strategy);

            // 把自己加入策略陣列中
            strategyList.push($this);

            $this.name = "variable";

            $this.priority = 1;
            //----------------------------
            $this._isStr = function (str) {
                // debugger;

                let nodeList = [];
                let _targetNodeList = [];

                let $this = this;

                if (!/\{([^*][^{}]*?|)\}/.test(str)) {
                    nodeList.push(str);
                } else {
                    str = str.replace(/\{([^*][^{}]*?|)\}/g, function (m, g1) {
                        let node = new VariableNode(g1, $this.parent, $this.root);
                        _targetNodeList.push(node);
                        return "/";
                    });
                    //-----------------------
                    let reg = /^([^/]*?)\//;

                    while (reg.test(str)) {

                        str = str.replace(reg, function (m, g1) {
                            if (g1) {
                                nodeList.push(g1);
                            }

                            if (_targetNodeList.length) {
                                let node = _targetNodeList.shift();
                                nodeList.push(node);
                            }

                            return "";
                        });
                    }
                    //-----------------------
                    if (str) {
                        nodeList.push(str);
                    }
                }

                return nodeList;
            };
            //----------------------------
            return $this;
        })();
        //--------------------------------------
        let variablePlusNode_strategy = (function () {

            // 繼承策略原型
            $this = _.extend({}, strategy);

            // 把自己加入策略陣列中
            strategyList.push($this);

            this.name = "variablePlus";

            $this.priority = 1;
            //----------------------------
            $this._isStr = function (str) {
                // debugger;

                let nodeList = [];
                let _targetNodeList = [];

                let $this = this;

                if (!/\{[*][^{}*]*?\}/) {
                    nodeList.push(str);
                } else {
                    str = str.replace(/\{([*][^{}*]*?)\}/, function (m, g1) {
                        let node = new VariablePlusNode(g1, $this.parent, $this.root);
                        _targetNodeList.push(node);
                        return "/";
                    });

                    //-----------------------
                    // debugger;
                    let reg = /^([^/]*?)\//;

                    while (reg.test(str)) {

                        str = str.replace(reg, function (m, g1) {
                            if (g1) {
                                nodeList.push(g1);
                            }

                            if (_targetNodeList.length) {
                                let node = _targetNodeList.shift();
                                nodeList.push(node);
                            }
                            return "";
                        });
                    }
                    //-----------------------

                    if (str) {
                        nodeList.push(str);
                    }
                }
                //-----------------------
                return nodeList;
            };
            //----------------------------
            return $this;
        })();
        //--------------------------------------
        let stringNode_strategy = (function () {

            // 繼承策略原型
            $this = _.extend({}, strategy);

            // 把自己加入策略陣列中
            strategyList.push($this);

            $this.name = "stringNode";

            $this.priority = 2;

            $this._isStr = function (str) {
                // debugger;

                let nodeList = [];

                if (str) {
                    let node = new StringNode(str, this.parent, this.root);
                    nodeList.push(node);
                }

                return nodeList;
            };
            //----------------------------
            return $this;
        })();
        //======================================

        return maker;
    } // factory end



}(this || {}));
