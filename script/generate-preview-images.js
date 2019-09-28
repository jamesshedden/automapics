#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const sharp = require('sharp');

let imagesDir = path.join(__dirname, '../img')
let backgroundsDir = path.join(imagesDir, './backgrounds')
let previewsDir = path.join(imagesDir, './previews')

fs.readdir(backgroundsDir, (_, images) => {
    images.map(file => {
        const previewImageFilename = `${path.basename(file, '.png')}.jpg`;

        if (fs.existsSync(path.join(previewsDir, previewImageFilename))) { return false; }

        fs.readFile(path.join(backgroundsDir, file), (_, data) => {
            sharp(data)
                .resize(560, 995)
                .toFile(path.join(previewsDir, previewImageFilename), () => {
                    console.log(`Generated preview image for ${file}`)
                });
        })
    })
})