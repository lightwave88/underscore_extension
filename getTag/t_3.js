///////////////////////////////////////////////////////////////////////////////
//
// 方法列表
//
///////////////////////////////////////////////////////////////////////////////


const methodList = [];


let method_obj;


const parentMethod = {
    tag: undefined,
    node: '',
    nodeContent: '',
    'test_1': function () {
        debugger;

        console.log(this.tag);
    },
    '_findEndTag_1': function (i, tagArea, noCheckArea) {
        debugger;

        let _char;
        let allcontent = '' + tagArea + noCheckArea;
        let j = tagArea.length - 1;

        let inArea = false;
        let _symbol;
        let hasChecked;

        while ((_char = allcontent[j++]) !== undefined) {
            debugger;

            hasChecked = allcontent.substring(0, j);
            //-----------------------
            if (/'"/.test(_char)) {
                if (inArea) {
                    if (_symbol != null && _char == _symbol) {
                        // ['"]結尾
                        inArea = false;
                        _symbol = undefined;

                    } else {
                        // 在 ['"]之間不做任何處理
                        // "命令"
                    }
                } else {
                    // ['"]開頭
                    inArea = true;
                    _symbol = _char;
                }
            }
            //-----------------------
            if (!inArea) {
                if (/>$/.test(hasChecked)) {
                    // 找到結尾
                    return {
                        node: hasChecked,
                        index: (i + hasChecked.length)
                    }
                    break;
                }
            }
        } // while end
        //-----------------------
        // 沒找到結尾
        return {
            node: undefined,
            index: (i + hasChecked.length)
        }
    }
};
//---------------------------------
method_obj = Object.assign({}, parentMethod, {
    tag: '<\w+ >',
    checkTagHead: function (tagArea) {
        debugger;

        let res;
        if ((res = /<\/?(\w+)\s$/.exec(tagArea)) != null) {

            let clone = Object.assign({}, this);
            clone.node = res[1];
            return clone;
        }
        return null;
    },
    findEndTag: function (i, tagArea, noCheckArea) {
        // debugger;
        this.test_1();

        return (this._findEndTag_1(i, tagArea, noCheckArea));
    }
});

methodList.push(method_obj);
//---------------------------------
method_obj = Object.assign({}, parentMethod, {
    tag: '<\w+>',
    checkTagHead: function (tagArea) {
        // debugger;

        let res;
        if ((res = /<\/?(\w+)\/?>$/.exec(tagArea)) != null) {

            let clone = Object.assign({}, this);
            clone.node = res[1];
            return clone;
        }
        return null;
    },
    findEndTag: function (i, tagArea, noCheckArea) {
        // debugger;
        this.test_1();
        return (this._findEndTag_1(i, tagArea, noCheckArea));
    }
});

methodList.push(method_obj);

console.dir(methodList);
//---------------------------------
method_obj = {
    tag: '<!-- -->',
    checkTagHead: function (tagArea) {
        return null;

    },
    findEndTag: function (tagArea, noCheckArea) {

    }
};

methodList.push(method_obj);
//---------------------------------
method_obj = {
    tag: '<style>不會有套嵌好辦</style>',
    checkTagHead: function (tagArea) {
        return null;
    },
    findEndTag: function (tagArea, noCheckArea) {

    }
};
methodList.push(method_obj);
//---------------------------------
method_obj = {
    tag: '<script>不會有套嵌好辦</script>',
    checkTagHead: function (tagArea) {
        return null;
    },
    findEndTag: function (tagArea, noCheckArea) {

    }
};

methodList.push(method_obj);
//---------------------------------
method_obj = {
    tag: '<% %>',
    checkTagHead: function (tagArea) {
        return null;
    },
    findEndTag: function (tagArea, noCheckArea) {

    }
};

methodList.push(method_obj);
//---------------------------------
method_obj = {
    tag: '<%= %>',
    checkTagHead: function (tagArea) {
        return null;
    },
    findEndTag: function (tagArea, noCheckArea) {

    }
};

methodList.push(method_obj);
//---------------------------------
method_obj = {
    tag: '<%- %>',
    checkTagHead: function (tagArea) {
        return null;
    },
    findEndTag: function (tagArea, noCheckArea) {

    }
};

methodList.push(method_obj);



module.exports = methodList.reverse();
