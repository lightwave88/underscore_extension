// 若範本太複雜
// 複雜完整的 htmlTag 解析策略
let FindTags = require('./findTags_1d.js');

module.exports = function (content) {
    let o = new FindTags();
    let nodeList = o.solution(content);
    return nodeList;
}


