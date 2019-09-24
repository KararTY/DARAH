const {
  red,
  green,
  gray,
  bold,
  underline,
  blue
} = require('colorette')

const rx = require('rxjs')

const { Client } = require('discord.js')
const discord = new Client()

const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const path = require('path')
const os = require('os')
const cli = require('inquirer')
const rimraf = require('rimraf')
const fetch = require('node-fetch')

// Settings validation.
const defaultSettings = {
  authentication: {
    discord: {
      token: ''
    }
  },
  archiving: {
    GUILDS: {},
    GROUPS: [],
    DIRECTMESSAGES: [],
    tempDir: '',
    archiveDir: '',
    auto: false,
    overrule: false,
    defaultOptions: {
      fullArchive: true,
      everyMessages: 100000,
      channels: {
        id: true,
        name: true,
        topic: true,
        voice: true,
        creationDate: true
      },
      messages: {
        id: true,
        attachments: true,
        embeds: true,
        reactions: true,
        creationDate: true
      },
      members: {
        name: true,
        id: true,
        creationDate: true,
        joinDate: true,
        roles: true,
        icon: true
      },
      information: {
        id: true,
        name: true,
        icon: true,
        owner: true,
        emojis: true,
        roles: true,
        channels: true,
        users: true,
        creationDate: true
      },
      downloads: {
        icons: true,
        images: true,
        emojis: true,
        videos: true,
        audios: true,
        texts: true,
        misc: true
      },
      trackAndArchiveDeletedMessages: true,
      output: {
        appendWhoArchived: true,
        formatted: false,
        whiteSpace: 2
      }
    }
  },
  debug: true
}

const saveSettings = settings => fs.writeFileSync(path.join(__dirname, 'settings.json'), JSON.stringify(settings, null, 2))
let settings
try {
  settings = require('./settings.json')
} catch (e) {
  settings = defaultSettings
  saveSettings(settings)
}

function log ({ message, type }, settings, ui) {
  if (!settings.archiving.auto && ui) {
    switch (type) {
      case 'debug':
        if (settings.debug) ui.log.write(gray(`Debug: ${bold(message)}`))
        break
      case 'error':
        ui.log.write(red(`Error: ${bold(message)}`))
        break
      case 'bar':
        ui.updateBottomBar(green(bold(message)))
        break
      default:
        ui.log.write(green(`Log: ${bold(message)}`))
        break
    }
  } else console.log(message)
}

module.exports = {
  colors: {
    blue,
    gray,
    underline
  },
  settings: {
    current: settings,
    saveSettings
  },
  rx,
  discord,
  fs,
  writeFile,
  path,
  os,
  cli,
  rimraf,
  fetch,
  log
}
