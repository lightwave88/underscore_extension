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
                return compile_2(functionStr);
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
                    source += `source.push(print(${g2}));\n`;
                } else if (g3) {
                    // <%- %>
                    source += `source.push(print(${g3}));\n`;
                }
                return '';
            });

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









