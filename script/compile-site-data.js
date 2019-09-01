#!/usr/bin/env node

let path = require('path')
let fs = require('fs')

let postsDir = path.join(__dirname, '../posts')

fs.readdir(postsDir, (err, posts) => {
    if (err) {
        return console.log('Cannot read posts')
    }

    fs.writeFile(
        `${path.join(__dirname, '../_data')}/posts.json`,
        JSON.stringify(
            posts.map(post => JSON.parse(fs.readFileSync(`${postsDir}/${post}`)))
        ),
        'utf8',
        (err) => {
            if (err) throw err;
        }
    )
})