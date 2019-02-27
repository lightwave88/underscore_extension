
const methodList = require('./t_3');

module.exports = X1;

function X1() {
    this.nodeList = [];
    this.methodList = methodList.slice();
}

(function () {
    this.step1 = function (content) {
        debugger;

        let i = 0;
        let afterStart = false;
        let tagName;

        let _chart;
        let hasChecked = '';
        let tagArea = '';
        let textArea = '';
        let noCheckArea;

        while ((_chart = content[i++]) !== undefined) {
            debugger;
            
            hasChecked = content.substring(0, i);
            noCheckArea = content.substring(i);
            console.log(noCheckArea);
            //-----------------------
            if (afterStart) {
                // 在一個可能是標籤開始的狀況下
                tagArea += _chart;
                let m = this.getTagName(tagArea);

                if (m != null) {
                    debugger;

                    // 若確定 tagName
                    // 找出是否有特殊的處理方式                    
                    let { node, index } = m.findEndTag((i - tagArea.length), tagArea, noCheckArea);

                    this.nodeList.push(node);
                    tagArea = '';

                    i = index;

                    afterStart = false;
                    debugger;
                    continue;
                }


            } else {
                if (/</.test(_chart)) {
                    tagArea = '';
                    afterStart = true;
                    tagArea += _chart;

                    if (textArea.length > 0) {
                        this.nodeList.push(textArea);
                    }

                    textArea = '';
                } else {
                    textArea += _chart;
                }
            }
            //-----------------------


        } // end while

        return this.nodeList;
    };

    // 找尋 tag 轉屬的模組
    // 找出他的結尾與結尾的 index
    this.getTagName = function (tagName) {
        let model;


        this.methodList.some(function (m) {
            debugger;
            // console.log(m.tag);
            let res = m.checkTagHead(tagName);
            if (res != null) {
                model = m;
                return true;
            }

        }, this);
        //------------------
        if (model) {
            // console.log('tag is(%s)', model.tag);
        }
        return model;
    };


}).call(X1.prototype);

