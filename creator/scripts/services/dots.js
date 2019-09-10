const puppeteer = require('puppeteer');
const fs = require('fs')
const path = require('path')

function getDotsImage(res) {
    const options = {
        defaultViewport: {
            width: 900,
            height: 900,
            deviceScaleFactor: 2,
            isMobile: false,
            hasTouch: false,
            isLandscape: false
        }
    }

    // Delete any existing image
    const screenshotImagePath = path.join(__dirname, '../../dist/temp_screenshot.png')
    fs.existsSync(screenshotImagePath) ? fs.unlinkSync(screenshotImagePath) : null;

    puppeteer.launch(options).then(browser => {
        browser.newPage().then(page => {
            page.goto('https://jamesshedden.github.io/coloured-circles/')
                .then(() => {
                    page.screenshot({ path: screenshotImagePath }).then(() => {
                        browser.close()
                        return res.send()
                    })
                })
        })
    })
}

function getCroppedDotsImage(req, res) {
    const { x, y, width, height, url } = req.body
    console.log('url:', url)

    const options = {
        defaultViewport: {
            width: 1800,
            height: 1800,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false
        }
    }

    const screenshotOptions = {
        encoding: 'base64',
        clip: { x, y, width, height },
    }

    puppeteer.launch(options).then(browser => {
        browser.newPage().then(page => {
            page.goto(url)
                .then(() => {
                    page.screenshot(screenshotOptions).then(image => {
                        res.send(image)
                        return browser.close()
                    })
                })
        })
    })
}

const dots = {
    getDotsImage,
    getCroppedDotsImage
}

module.exports = dots