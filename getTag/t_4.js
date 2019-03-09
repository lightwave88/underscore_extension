const $fs = require('fs');
const $path = require('path');
const $util = require('util');
const rootPath = $fs.realpathSync('.');

let _path = $path.resolve(__dirname, './template/t_3a.html');
let content = $fs.readFileSync(_path, 'utf8');

let reg = /(\r\n)|(\r(?!\n))|(\n(?!\r))/;


let index;


while((index = content.search(reg)) >= 0){
    debugger;
    let _reg = RegExp(`[\s\S]*?${reg.source}`);

    content = content.replace(_reg, function(m, g1, g2, g3, i){
        
        console.log('[%s][%s][%s][%s]', m, g1, g2, g3);
        
        return '';
    });

}