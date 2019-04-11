// 快速但準確較低的解析策略

let FindCommandTags = require('./findCommandTags_1');

module.exports = function(content){
    let o = new FindCommandTags();

    return o.solution(content);
}
