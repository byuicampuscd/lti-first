/* eslint-env node*/
/* eslint no-console:0*/
var fs = require('fs'),
    path = require('path');

module.exports = function () {
    var htmlFileNames,
        filesObj = {};

    htmlFileNames = fs.readdirSync('html').filter(function (file) {
        return path.extname(file) === ".html";
    });

    htmlFileNames.forEach(function (file) {
        var name = path.basename(file, '.html'),
            fileStr = fs.readFileSync(path.join('html', file), 'utf8');
        filesObj[name] = fileStr;
    });

    return filesObj;
}
