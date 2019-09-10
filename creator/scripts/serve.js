require('dotenv').config()

const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const bodyParser = require('body-parser')

const dots = require('./services/dots.js')
const submitImageToGitHub = require('./services/github.js')

app.use(express.static(path.join(__dirname, '../dist')))
app.use(bodyParser.json({ limit: '50mb' }))

app.get('/image', (_, res) => dots.getDotsImage(res))
app.post('/crop', (req, res) => dots.getCroppedDotsImage(req, res))
app.post('/create', (req, res) => submitImageToGitHub(req, res))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))