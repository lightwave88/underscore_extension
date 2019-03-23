// debugger;

const $fs = require('fs');

const rootPath = $fs.realpathSync('.');
const getFileContent = function (_path) {
    return $fs.readFileSync(_path, 'utf8');
}
//-----------------------

const FindTags = require('./findTags_1b');
module.exports = {
    findTags: FindTags,
    getFileContent: getFileContent,
    rootPath: rootPath
};
