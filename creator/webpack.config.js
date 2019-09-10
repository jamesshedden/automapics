const path = require('path');

module.exports = {
    entry: './creator/scripts/index.js',
    output: {
        filename: 'script.js',
        path: path.resolve(__dirname, 'dist')
    }
};