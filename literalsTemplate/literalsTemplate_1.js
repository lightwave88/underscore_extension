!(function (global) {
    (function () {
        debugger;

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
        debugger;
        let _templateSetting = _.templateSetting || templateSetting;

        _.mixin({
            literalsTemplate: function (str) {
                debugger;

                let functionStr = compile_1(str);
                return compile_2(functionStr);
            }
        });

        function compile_1(template) {

            let evaluate = _templateSetting.evaluate;
            let interpolate = _templateSetting.interpolate;
            let escape = _templateSetting.escape;

            let reg = [];
            reg.push(evaluate.source);
            reg.push(interpolate.source);
            reg.push(escape.source);
            reg = reg.join("|");
            reg = `([\\s\\S]*?)(?:${reg})`;
            console.log(reg);
            reg = RegExp(reg, 'g');

            let source = "let source = [];\n";
            template = template.replace(reg, function (m, g1, g2, g3, g4) {
                debugger;
                if (g1) {
                    source += `source.push(\`${g1}\`);\n`;
                }

                if (g2) {
                    // <% %>
                    // g2 = g2.replace(/%>$/, '').replace(/^<%/, '');
                    source += `\n${g2}\n`;
                } else if (g3) {
                    // <%= %>
                    // g3 = g3.replace(/%>$/, '').replace(/^<%=/, '');
                    source += `source.push(print(${g3}));\n`;
                } else if (g4) {
                    // <%- %>
                    // g4 = g4.replace(/%>$/, '').replace(/^<%-/, '');
                    source += `source.push(print(${g4}));\n`;
                }
                return '';
            });

            if (template) {
                source += `source.push(\`${template}\`);\n`;
            }

            source += 'return (source.join(""));\n';

            return source;
        }
        //----------------------------
        function compile_2(functionStr) {

            functionStr = "data = data || {};\n\
                for(let k in data){\n\
                    let command = 'var '+ k + '= data[\"'+k+'\"];';\n\
                    eval(command);\n\
                }\n\
            " + functionStr;

            console.log(functionStr);
            let fun = new Function('print', 'data', functionStr);
            //-----------------------
            function print(html) {
                html = (html == null ? '' : html);
                return html;
            }
            //-----------------------

            return (fun).bind(null, print);
        }
    } // end factory

})(this || {});









