_chart///////////////////////////////////////////////////////////////////////////////
//
// 方法列表
//
///////////////////////////////////////////////////////////////////////////////


const methodList = [];

module.exports = methodList;


///////////////////////////////////////////////////////////////////////////////
function ProtoMethod(nodeName) {
    this.info = '';
    this.nodeName = nodeName;
    this.nodeContent = '';

    if (!this.nodeName) {
        throw new Error('no set nodeName');
    }
}

(function () {
    this.findEndTag = function () {
        throw new Error('need set findEndTag()');
    };
    //--------------------------------------
    this._test_1 = function () {
        console.log(this.tag);
    };
    //--------------------------------------
    this._findEndTag_1 = function (i, tagArea, content) {
        debugger;

        let _chart;
        let j = i + tagArea.length + 1;


        let commandCount = 0;
        let _symbol;
        // _symbol的脫逸
        let _symbol_1 = /\\['"]$/;
        //-----------------------
        // 處理 <tage><tag/>
        if (/(>|\/>)$/.test(tagArea)) {
            j = i+tagArea.length;

            return {
                node: this.nodeName,
                index: j,
                content: (content.slice(i + 1, j + 1))
            }
        }
        //-----------------------
        // 處理 <tag......>
        while ((_chart = content[j++]) != null) {
            debugger;

            let hasChecked = content.slice(i + 1, j);

            if (commandCount < 0) {
                throw new Error('command error');
            }
            //-----------------------
            // 只確認是否在 [''][""]之間
            if (/'"/.test(_chart)) {

                if (commandCount > 0) {
                    // 在 attr 命令之間
                    if (!_symbol_1.test(hasChecked)) {
                        // 脫逸
                        continue;
                    }

                    if (_symbol.test(_chart)) {
                        // ['"]結尾
                        commandCount--;
                    }

                } else {
                    // ['"]開頭
                    commandCount++;                    
                    _symbol = RegExp(_chart);
                }
            }
            //-----------------------
            if (commandCount == 0) {
                _symbol = undefined;

                if (/</.test()) {
                    // 遇到 <
                    // 沒有被 close
                    // index 必須退後一格
                    // 結果是 textNode
                    return {
                        node: 'text',
                        index: (j - 1),
                        content: (content.slice(i + 1, j))
                    }
                    break;

                } else if (/>$/.test(_chart)) {
                    // 找到結尾
                    return {
                        node: this.nodeName,
                        index: j,
                        content: (content.slice(i + 1, j + 1))
                    }
                    break;
                }
            }
        } // while end
        //-----------------------
        // 沒找到結尾
        // 結果是 textNode
        return {
            node: 'text',
            index: j,
            content: (content.slice(i + 1, j + 1))
        }
    };
}).call(ProtoMethod.prototype);
///////////////////////////////////////////////////////////////////////////////

function Method_1(nodeName) {
    ProtoMethod.call(this, nodeName);
    this.info = '<tag...>一般標籤';
    methodList.push(Method_1);
}

(function (fn) {
    // 優先等級
    fn.level = 0;

    fn.checkTagHead = function (tagArea) {
        debugger;

        let res;
        if ((res = /<(\w+)(\s|>|\/>)$/.exec(tagArea)) != null) {
            let nodeName = res[1];

            return {
                method: Method_1,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_1);

Method_1.prototype = Object.create(ProtoMethod.prototype);
Method_1.prototype.findEndTag = function (i, tagArea, content) {
    // debugger;
    this.test_1();

    let res = this._findEndTag_1(i, tagArea, content);
    return res;
};
///////////////////////////////////////////////////////////////////////////////
function Method_2(nodeName) {
    ProtoMethod.call(this, nodeName);
    this.info = '</tag>一般標籤尾';
    methodList.push(Method_2);
}

(function (fn) {
    fn.level = 0;

    fn.checkTagHead = function (tagArea) {
        debugger;

        let res;
        if ((res = /<\/(\w+)>$/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_2,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_2);

Method_2.prototype = Object.create(ProtoMethod.prototype);
Method_2.prototype.find = function (i, tagArea, content) {
    // debugger;
    this.test_1();

    let res = this._findEndTag_1(i, tagArea, content);
    return res;
};
///////////////////////////////////////////////////////////////////////////////

function Method_3(nodeName) {
    ProtoMethod.call(this, nodeName);
    this.info = '<!-- -->一般標籤尾';
    methodList.push(Method_3);
}

(function (fn) {
    fn.level = 0;

    fn.checkTagHead = function (tagArea) {
        debugger;

        let res;
        if ((res = /^<(!--)/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_3,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_3);

Method_3.prototype = Object.create(ProtoMethod.prototype);
Method_3.prototype.find = function (i, tagArea, content) {
    // debugger;
    this.test_1();

    let j = i + tagArea.length + 1;
    let tagContent = tagArea;
    let _chart;
    //------------------
    while ((_chart = content[j++]) != null) {
        debugger;

        tagContent += _chart;
        //------------------
        if (/</.test(_chart)) {
            // 沒有正確 close
            return {
                node: 'text',
                index: (j - 1),
                content: (content.slice(i + 1, j))
            };
            break;
        }
        //------------------
        if (/-->$/.test(tagContent)) {
            // close
            return {
                node: this.node,
                index: j,
                content: (content.slice(i + 1, j + 1))
            };
        }
    } // end while
    //------------------
    return {
        node: 'text',
        index: j,
        content: (content.slice(i + 1, j + 1))
    };
};

///////////////////////////////////////////////////////////////////////////////

function Method_4(nodeName) {
    ProtoMethod.call(this, nodeName);
    this.info = '<style...>不會有套嵌好辦</style>';
    this.startEndIndex;
    methodList.push(Method_4);
}

(function (fn) {
    fn.level = 5;

    fn.checkTagHead = function (tagArea) {
        debugger;

        let res;
        if ((res = /^<(style)(\s|>)/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_4,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_4);

Method_4.prototype = Object.create(ProtoMethod.prototype);

(function () {
    this.find = function (i, tagArea, content) {
        // debugger;
        this.test_1();

        let find;
        let index;
        let res;
        let d = {
            node: undefined,
            index: undefined,
            content: undefined
        };
        // 找開頭的 end
        res = this._findStartEnd(i, tagArea, content);
        index = res.index;
        //-----------------------
        // 找最後的 end
        if (!res.find) {
            d.node = 'text';
            d.index = index;
            d.content = content.slice(i, index + 1);
        } else {
            res = this._findEnd();
            index = res.index;

            d.node = 'text';

            if (res.find) {
                d.node = this.nodeName;
            }

            d.index = index;
            d.content = (content.slice(i + 1, index + 1));
        }
        return d;
    };

    // 找尋開頭的 close位置
    this._findStartEnd = function (i, tagArea, content) {
        debugger;

        let res = this._findEndTag_1(i, tagArea, content);

        let d = {
            res: true,
            index: (res.index)
        };

        if (res.node == 'text') {
            d.res = false;
        }

        return d;
    };

    this._findEnd = function () {
        let j = this.startEndIndex + 1;
        let tagContent = '';
        let _chart;

        let _cotent;
        // 指令區 {}
        let commandCount = 0;
        //------------------
        while ((_chart = content[j++]) != null) {
            tagContent += _chart;

            if (/\{/.test(_chart)) {
                commandCount++;
            } else if (/\}/.test(_chart)) {
                commandCount--;
            }
            //------------------
            if (commandCount > 0) {
                // 在指令區 {} 內
                // 指令區亂七八糟不鳥她
                // 只管 }
                continue;
            } else {
                // 不在指令區 {} 內
                if (/</.test(tagContent)) {
                    // 遇到關鍵標籤
                    let word = content.substr(j + 1, 15);
                    if (/^\/style>/i.test(word)) {
                        // 遇到close

                        let index = (tagContent + word).search(/>/);
                        index += i;
                        return {
                            find: true,
                            index: index
                        };
                    } else {
                        // 沒有正確 close

                        return {
                            find: false,
                            index: (j - 1)
                        };
                    }
                }
            }

        } // end while
        //------------------
        // 沒找到 close
        return {
            find: false,
            index: j
        };
    };
}).call(Method_4.prototype);
///////////////////////////////////////////////////////////////////////////////
function Method_5(nodeName) {
    ProtoMethod.call(this, nodeName);
    this.info = '<script...>不會有套嵌好辦</script>';
    methodList.push(Method_5);
}

(function (fn) {
    fn.level = 5;

    fn.checkTagHead = function (tagArea) {
        debugger;

        let res;
        if ((res = /^<(script)(\s|>)/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_5,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_5);

Method_5.prototype = Object.create(ProtoMethod.prototype);

(function(){

    this.find = function (i, tagArea, content) {
        // debugger;
        this.test_1();

        let find;
        let index;
        let res;
        let d = {
            node: undefined,
            index: undefined,
            content: undefined
        };
        // 找開頭的 end
        res = this._findStartEnd(i, tagArea, content);
        index = res.index;
        //-----------------------
        // 找最後的 end
        if (!res.find) {
            d.node = 'text';
            d.index = index;
            d.content = content.slice(i, index + 1);
        } else {
            res = this._findEnd();
            index = res.index;

            d.node = 'text';

            if (res.find) {
                d.node = this.nodeName;
            }

            d.index = index;
            d.content = (content.slice(i + 1, index + 1));
        }
        return d;
    };

    // 找尋開頭的 close位置
    this._findStartEnd = function (i, tagArea, content) {
        debugger;

        let res = this._findEndTag_1(i, tagArea, content);

        let d = {
            res: true,
            index: (res.index)
        };

        if (res.node == 'text') {
            d.res = false;
        }

        return d;
    };

    this._findEnd = function () {
        let j = this.startEndIndex + 1;
        let tagContent = '';
        let _chart;

        let _cotent;
        // 指令區 {}
        let commandCount = 0;
        //------------------
        while ((_chart = content[j++]) != null) {}
    };
}).call(Method_5.prototype);


Method_5.prototype.findEndTag = function (i, tagArea, noCheckArea) {
    // debugger;
    this.test_1();

    // return (this._findEndTag_1(i, tagArea, noCheckArea));
};
///////////////////////////////////////////////////////////////////////////////
function Method_6(nodeName) {
    ProtoMethod.call(this, nodeName);
    this.info = '<%...%>';
    methodList.push(Method_6);
}

(function (fn) {
    fn.level = 0;

    fn.checkTagHead = function (tagArea) {
        debugger;

        let res;
        if ((res = /^<(%)\s/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_6,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_6);

Method_6.prototype = Object.create(ProtoMethod.prototype);
Method_6.prototype.findEndTag = function (i, tagArea, noCheckArea) {
    // debugger;
    this.test_1();

    // return (this._findEndTag_1(i, tagArea, noCheckArea));
};
///////////////////////////////////////////////////////////////////////////////
function Method_7(nodeName) {
    ProtoMethod.call(this, nodeName);
    this.info = '<%[-=]...%>';
    methodList.push(Method_7);
}

(function (fn) {
    fn.level = 0;

    fn.checkTagHead = function (tagArea) {
        debugger;

        let res;
        if ((res = /^<(%[-=])\s/.exec(tagArea)) != null) {

            let nodeName = res[1];
            return {
                method: Method_7,
                nodeName: nodeName
            };
        }
        return null;
    };
})(Method_7);

Method_7.prototype = Object.create(ProtoMethod.prototype);
Method_7.prototype.findEndTag = function (i, tagArea, noCheckArea) {
    // debugger;
    this.test_1();

    // return (this._findEndTag_1(i, tagArea, noCheckArea));
};
///////////////////////////////////////////////////////////////////////////////



module.exports = methodList.reverse();
