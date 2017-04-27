const corda = require('discord-corda')
const colors = require('colors')
const path = require('path')
const keys = require('../keys')
const db = require('./src/database.js')

db.connect().then(() => {
  corda.login_discord(keys.discord)
  corda.set('watch-commands', true)
  corda.set('recursive-watch', true)
  corda.set('command-folder', path.join(__dirname, '/commands'))
})

corda.on('ready', () => {
  console.log('NB! Bot ready!'.cyan.bold)
})
