!(function (global) {
    (function () {
        // debugger;

        if (typeof (module) == 'object' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (obj) {
                // 建構
                factory(obj);
            };
        } else {
            if (global._ == null || _.$$extension == null) {
                return;
            }

            let environment = _.$$extension.environment;
            factory(global._);
        }
    }());
    ////////////////////////////////////////////////////////////
    // 參數設定
    const templateSetting = {
        evaluate: /<script>([\s\S]*?)<\/script>/g,
        escape: /<%=([\s\S]*?)%>/g,
        escapeMap: {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        }
    };
    ////////////////////////////////////////////////////////////

    function factory(_) {
        // debugger;
        _.mixin({
            literalsTemplate: literalsTemplate
        });

        //----------------------------
        // setting 可針對 templateSetting 覆寫
        function literalsTemplate(str, settings) {
            debugger;

            let functionStr = compile_1(str, settings);

            let modules = {
                print: print,
                escape: escape
            };

            return compile_2(functionStr, modules);
        }
        //----------------------------
        (function (fn) {
            // 參數設定
            fn.setting = function () {
                return templateSetting;
            };
        })(literalsTemplate);
        //----------------------------
        // 解析文本內的指令
        function compile_1(template, settings) {
            settings = settings || {};

            for (let k in templateSetting) {
                if (settings[k] == null) {
                    settings[k] = templateSetting[k];
                }
            }
            //----------------------------
            let evaluate = settings.evaluate;
            let escape = settings.escape;

            reg = `(?:${evaluate.source})|(?:${escape.source})|(?:$)`;
            // console.log(reg);
            reg = RegExp(reg, 'g');

            let source = "let source = [];\n";

            let index = 0;
            template = template.replace(reg, function (m, g1, g2, offset) {
                debugger;
                let str = template.slice(index, offset);
                index = offset + m.length;

                if (str.length) {
                    str = _escape_1(str);
                    source += `source.push(\`${str}\`);\n`;
                }

                if (g1) {
                    // <% %>
                    g1 = _escape_1(g1);
                    source += `${g1}`;
                } else if (g2) {
                    // <%= %>
                    g2 = g2.trim();
                    g2 = _escape_1(g2);
                    source += `source.push(this.escape(\`${g2}\`));\n`;
                }
                return '';
            });

            source += 'return (source.join(""));\n';

            return source;
        }
        //----------------------------
        // modules: 內部的功能模組
        function compile_2(functionStr, modules) {

            // modules: 內部的功能模組
            // str: 模版內容
            // data: 使用者給定
            // context: 是否要指定模版的上下文
            return (function(modules, str, data, context) {
                'use strict';

                debugger;
                if (context == null || typeof (context) != "object") {
                    context = {};
                }

                _.extendOwn(context, modules);

                if (data == null || typeof (data) != "object") {
                    data = {};
                }

                //----------------------------
                let keyList = Object.keys(data);
                let command = '';

                keyList.forEach(function (k) {
                    command += `let ${k} = data["${k}"];\n`;
                });
                let fnContent = `
                    'use strict'\n
                    debugger;
                    ${command}
                    ${str}`;
                //----------------------------
                let fun;
                try {
                    fun = new Function('data', fnContent);
                } catch (error) {
                    throw new Error(`build template error(${String(error)})`);
                }                
                //----------------------------
                let htmlContent = '';
                try {
                    htmlContent = fun.call(context, data);
                } catch (error) {
                    throw new Error(`run template error(${String(error)}) => (${fun.toString()})`);
                }
                return htmlContent;

            }).bind({}, modules, functionStr);
        }
        //----------------------------
        function print(html) {
            if (html === undefined) {
                html = "undefined";
            } else if (html === null) {
                html = "null";
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
        //----------------------------
        function escape(html) {
            html = print(html);

            if (_.escape != null) {
                html = _.escape(html);
            } else {
                let source = Object.keys(templateSetting.escapeMap).join('|');
                source = `(?:${source})`;
                var testRegexp = RegExp(source);
                var replaceRegexp = RegExp(source, 'g');

                html = (html == null) ? '' : '' + html;

                if (testRegexp.test(html)) {
                    html = html.replace(replaceRegexp, function (match) {
                        return templateSetting.escapeMap[match];
                    });
                }
            }
            return html;
        }
        //----------------------------
        // 脫逸 `
        function _escape_1(str) {
            str = str.replace(/`/g, function (m) {
                return '\\' + m;
            });
            return str;
        }
    } // end factory
})(this || {});









