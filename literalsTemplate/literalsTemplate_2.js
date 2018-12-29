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

    function noSupportFactory(_) {

    }
    ////////////////////////////////////////////////////////////
    const templateSetting = {
        evaluate: /<%([^=-][\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([^-][\s\S]+?)%>/g
    };
    ////////////////////////////////////////////////////////////

    function factory(_) {
        // debugger;
        let _templateSetting = _.templateSetting || templateSetting;

        _.mixin({
            literalsTemplate: function (str) {
                debugger;

                let functionStr = compile_1(str);
                return compile_2(functionStr, {
                    print: print
                });
            }
        });

        function compile_1(template) {

            let evaluate = _templateSetting.evaluate;
            let interpolate = _templateSetting.interpolate;
            let escape = _templateSetting.escape;

            reg = `(?:${evaluate.source})|(?:${interpolate.source})|(?:${escape.source})|(?:$)`;
            console.log(reg);
            reg = RegExp(reg, 'g');

            let source = "let source = [];\n";

            let index = 0;
            template = template.replace(reg, function (m, g1, g2, g3, offset) {
                debugger;
                let str = template.slice(index, offset);
                index = offset + m.length;

                if (str.length) {
                    source += `source.push(\`${str}\`);\n`;
                }

                if (g1) {
                    // <% %>                    
                    source += `\n${g1}\n`;
                } else if (g2) {
                    // <%= %>
                    source += `source.push(this.print(${g2}));\n`;
                } else if (g3) {
                    // <%- %>
                    source += `source.push(this.print(${g3}));\n`;
                }
                return '';
            });

            source += 'return (source.join(""));\n';

            return source;
        }
        //----------------------------
        function compile_2(functionStr, modules) {

            return (function (modules, str, data, context) {
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
            html = (html == null ? '' : html);
            return html;
        }
    } // end factory

})(this || {});









