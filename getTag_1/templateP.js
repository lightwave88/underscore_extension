const $fs = require('fs');


// 策略 3(精準度高 慢)
const $tactic_3 = require('./tactic_3');
//================================================

module.exports = templateP;
// 主要對外 API
function templateP(content){
    let nodeList = templateP.findTags(content);
    return nodeList;
}
//================================================
(function(fn){
    fn.rootPath = $fs.realpathSync('.');

    fn.getFileContent = function (_path) {
        return $fs.readFileSync(_path, 'utf8');
    };

    fn.findTags = $tactic_3;

    // <% %> 與 <script type="text/_"> 互換
    fn.transform = function(content, options){

    };
})(templateP);
