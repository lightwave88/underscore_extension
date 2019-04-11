const $util = require('util');
const $fs = require('fs');

// 策略 1(精準度較差 快)
const $tactic_1 = require('./tactic_1');

// 策略 2(精準度高 慢)
const $tactic_2 = require('./tactic_2');
//================================================

module.exports = templateP;
// 主要對外 API
function templateP(content, mode) {
    debugger;

    let m = new GetRenderFn(content, mode);
    return m.getFn();
}
//================================================
(function (fn) {
    // for test
    fn.rootPath = $fs.realpathSync('.');

    // for test
    fn.getFileContent = function (_path) {
        return $fs.readFileSync(_path, 'utf8');
    };

    // <% %> 與 <script type="text/_"> 互換
    fn.transform = function (content, options) {

    };

    // 模板相關設定值
    fn.setting = {};

    // 在模組中可用的函式
    // 在此處擴充
    fn.addOn = {};
})(templateP);
//================================================
// 模版內可用的函式
(function (M) {
    
    M.echo = function (html) {
        html = print(html);
        this.push(html);
    };
    //============================

    M.escape = function (html) {
        html = _print(html);

        if (_.escape != null) {
            html = _.escape(html);
        } else {
            const escapeMap = templateP.setting.escapeMap;

            let source = Object.keys(escapeMap).join('|');
            source = `(?:${source})`;
            let reg = RegExp(source, 'g');
            html = html.replace(reg, function (m) {
                return escapeMap[m];
            });
        }
        this.push(html);
    };
    //============================
    function print(html) {
        if (html == null) {
            html = String(html);
        } else if (typeof (html) == "object") {
            html = JSON.stringify(html);
        } else {
            try {
                html += "";
            } catch (error) {
                html = "";
            }
        }
        return html;
    }

})(templateP.addOn);
//================================================
(function (S) {
    S.escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
    };
})(templateP.setting);
//================================================

class GetRenderFn {
    // content: 要解析的 str
    // options: 解析的選項
    constructor(content, mode) {
        this.nodeList;
        this.fnCommand = '';
        this.mode = (mode == null) ? 0 : (mode % 2);

        this._getNodeList(content);

        this._getFnCommand();
    }
    //===========================================
    _getNodeList(content) {
        debugger;

        let tactic = (this.mode === 0)? $tactic_1: $tactic_2;

        this.nodeList = tactic(content);
    }
    //===========================================
    _getFnCommand() {

        console.log('_getFnCommand()');
        debugger;

        console.log($util.inspect(this.nodeList));

        for (let i = 0; i < this.nodeList.length; i++) {
            let node = this.nodeList[i];

            let commendContent = node.getCommandContent();

            switch (node.command) {
                case '%':
                    this.fnCommand += commendContent;
                    break;
                case '%=':
                    this.fnCommand += 'echo(`' + commendContent + '`);\n';
                    break;
                case '%-':
                    this.fnCommand += 'escape(`' + commendContent + '`);\n';
                    break;
                default:
                    commendContent = this._escape_1(commendContent);
                    this.fnCommand += 'echo(`' + commendContent + '`);\n';
                    break;
            }
        }
        console.log('---------------------');
        // console.log(this.fnCommand);
    }
    //===========================================
    getFn() {

        let module = this._getModule();

        // 主要返回的模板製造函式
        const fn = (function (functionStr, module, data, context) {
            debugger;
            'use strict';

            // 要被聲稱的變數
            let variables = '';

            if (context == null) {
                context = {};
            }
            //----------------------------
            // 把 module 功能附加到 template 上

            for (let k in module) {
                if (module.hasOwnProperty(k)) {
                    variables += `let ${k} = module["${k}"];\n`;
                }
            }
            //----------------------------
            // 把 data 附加到 template 上
            if (data == null) {
                data = {};
            }

            for (let k in data) {
                if (data.hasOwnProperty(k)) {
                    if (k in module) {
                        throw new TypeError(`data[${k}] has exist`);
                    }
                    variables += `let ${k} = data["${k}"];\n`;
                }
            }
            //----------------------------
            let fnContent = `
                    'use strict'\n

                    debugger;
                    //------------------
                    ${variables}
                    //------------------
                    ${functionStr}
                    
                    return ($$$contentList.join(""));\n`;
            //----------------------------
            let fun;
            try {
                debugger;
                fun = new Function('module', 'data', fnContent);
            } catch (error) {
                console.log(fnContent);
                throw new Error(`build template error(${String(error)})`);
            }
            //----------------------------
            let htmlContent = '';
            try {
                htmlContent = fun.call(context, module, data);
            } catch (error) {
                throw new Error(`run template error(${String(error)}) => (${fun.toString()})`);
            }
            return htmlContent;

        }).bind({}, this.fnCommand, module);

        fn.content = this.fnCommand;
        fn.nodeList = this.nodeList;

        return fn;
    }
    //===========================================
    // 對 ` 脫逸
    _escape_1(content) {
        content = content.replace(/([^\\])(`)/g, function (m, g1, g2) {
            return (g1 + "\\" + g2);
        });

        return content;
    }
    //===========================================
    // 模板背後的功能模組
    // echo(), escape()
    _getModule() {
        const $this = this;

        const module = {
            $$$contentList: []
        };

        Object.defineProperty(module, 'push', {
            enumerable: false,
            writable: true,
            configurable: true,
            value: function (text) {
                this.$$$contentList.push(text);
            }
        });

        for (let k in templateP.addOn) {
            if (templateP.addOn.hasOwnProperty(k)) {
                let fn = templateP.addOn[k];
                module[k] = fn.bind(module);
            }
        }

        return module;
    }
    //===========================================
}
