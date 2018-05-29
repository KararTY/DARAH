/**
 * INITIALIZE
 * Initialization is easy, validate settings file and request more information if insufficient.
 */

const settings = require('./settings.js')

const backup = {
  defaultOptions: {
    everyMessages: 100000, // Create new file every X messages.
    channels: {
      id: true,
      name: true,
      topic: true
    },
    messages: {
      id: true,
      attachments: true,
      embeds: true,
      reactions: true
    },
    members: {
      name: true,
      id: true,
      creationDate: true,
      joinDate: true,
      roles: true,
      icon: true
    },
    guilds: {
      id: true,
      name: true,
      icon: true,
      owner: true,
      emojis: true,
      roles: true,
      channels: true,
      users: true
    },
    downloads: {
      icons: true,
      images: true,
      emojis: true,
      videos: true,
      soundFiles: true,
      textFiles: true,
      misc: true
    },
    trackAndArchiveDeletedMessages: true, // Only works when auto is enabled.
    output: {
      appendWhoArchived: true,
      formatted: false,
      whiteSpace: 2
    }
  }
}

const applyNewSettings = () => {
  return `module.exports = {
  authentication: {
    discord: {
      token: '${settings.authentication.discord.token}'
    },
    pastebin: { // WILL HAVE TO THINK ABOUT THIS.
      token: '${settings.authentication.pastebin.token}'
    }
  },
  archiving: {
    GUILDS: [${settings.archiving.GUILDS.length > 0 ? settings.archiving.GUILDS.join(', ') : ``}], // Guild ids. Use 'ALL' for all.
    DIRECTMESSAGES: [${settings.archiving.DIRECTMESSAGES.length > 0 ? settings.archiving.DIRECTMESSAGES.join(', ') : ``}], // User ids. Use 'ALL' for all.
    tempDir: '${settings.archiving.tempDir}', // Put temp directory here. (__dirname)
    archiveDir: '${settings.archiving.archiveDir}', // Put archive directory here. (__dirname)
    auto: {
      enabled: ${settings.archiving.auto.enabled},
      cronSchedule: '${settings.archiving.auto.cronSchedule}' // This example cron schedule ('0 0 */1 * *') will run archiver every midnight (00:00).
    },
    overrule: ${settings.archiving.overrule}, // Use this to overrule all available custom guild archive options with the one below.
    defaultOptions: {
      everyMessages: ${settings.archiving.defaultOptions.everyMessages}, // Create new file every X messages.
      channels: {
        id: ${settings.archiving.defaultOptions.channels.id},
        name: ${settings.archiving.defaultOptions.channels.name},
        topic: ${settings.archiving.defaultOptions.channels.topic}
      },
      messages: {
        id: ${settings.archiving.defaultOptions.messages.id},
        attachments: ${settings.archiving.defaultOptions.messages.attachments},
        embeds: ${settings.archiving.defaultOptions.messages.embeds},
        reactions: ${settings.archiving.defaultOptions.messages.reactions}
      },
      members: {
        name: ${settings.archiving.defaultOptions.members.name},
        id: ${settings.archiving.defaultOptions.members.id},
        creationDate: ${settings.archiving.defaultOptions.members.creationDate},
        joinDate: ${settings.archiving.defaultOptions.members.joinDate},
        roles: ${settings.archiving.defaultOptions.members.roles},
        icon: ${settings.archiving.defaultOptions.members.icon}
      },
      guilds: {
        id: ${settings.archiving.defaultOptions.guilds.id},
        name: ${settings.archiving.defaultOptions.guilds.name},
        icon: ${settings.archiving.defaultOptions.guilds.icon},
        owner: ${settings.archiving.defaultOptions.guilds.owner},
        emojis: ${settings.archiving.defaultOptions.guilds.emojis},
        roles: ${settings.archiving.defaultOptions.guilds.roles},
        channels: ${settings.archiving.defaultOptions.guilds.channels},
        users: ${settings.archiving.defaultOptions.guilds.users}
      },
      downloads: {
        icons: ${settings.archiving.defaultOptions.downloads.icons},
        images: ${settings.archiving.defaultOptions.downloads.images},
        emojis: ${settings.archiving.defaultOptions.downloads.emojis},
        videos: ${settings.archiving.defaultOptions.downloads.videos},
        soundFiles: ${settings.archiving.defaultOptions.downloads.soundFiles},
        textFiles: ${settings.archiving.defaultOptions.downloads.textFiles},
        misc: ${settings.archiving.defaultOptions.downloads.misc}
      },
      trackAndArchiveDeletedMessages: ${settings.archiving.defaultOptions.trackAndArchiveDeletedMessages}, // Only works when auto is enabled.
      output: {
        appendWhoArchived: ${settings.archiving.defaultOptions.output.appendWhoArchived},
        formatted: ${settings.archiving.defaultOptions.output.formatted},
        whiteSpace: ${settings.archiving.defaultOptions.output.whiteSpace}
      }
    }
  },
  debug: ${settings.debug}
}
`
}

const fs = require('fs')
const path = require('path')
const os = require('os')

const { Client } = require('discord.js')
const client = new Client()

const inquirer = require('inquirer')
const chalk = require('chalk')
const ui = new inquirer.ui.BottomBar()

const cronParser = require('cron-parser')

// Validation
// TODO: Validate pastebin details.
let questions = [
  !settings.authentication.discord.token ? {
    type: 'password',
    name: 'discordToken',
    mask: '*',
    message: 'Please enter your Discord Authentication token:',
    validate: function (val) {
      val = val.trim().replace(/[ ]+/g, '')
      if (val.length === 0) {
        ui.log.write(chalk`{red Error:} {red.bold Given token length is ${val.length}, must be longer.}`)
        return 'Invalid token length. Try again.'
      }
      ui.updateBottomBar('Please wait...')
      let done = this.async()

      client.once('ready', () => {
        ui.log.write(chalk`{green Log:} {green.bold Successfully authorized on Discord.}`)
        ui.log.write(chalk`{green Log:} {green.bold Make it easier for yourself, enter Discord Authorization token in the 'settings.js' file next time!}`)
        done(null, true)
      }).login(val).catch(e => {
        if (settings.debug) console.error(e)
        ui.log.write(chalk`{red Error:} {red.bold ${e.message}}`)
        client.removeAllListeners('ready')
        done('Could not use that token, try again.')
      })
    }
  } : false,
  (settings.archiving.archiveDir.length === 0 || !fs.existsSync(path.join(settings.archiving.tempDir)) || !fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_ARCHIVES')) || fs.accessSync(path.join(settings.archiving.archiveDir), fs.constants.R_OK | fs.constants.W_OK) !== undefined) ? {
    type: 'input',
    name: 'archiveDir',
    message: `Please enter archive directory or leave empty to use default ${chalk`{gray.underline (${__dirname})}:`}`,
    validate: function (val) {
      val = val.trim().replace(/[~]/g, os.homedir())
      if (val.length === 0) val = __dirname
      try {
        if (!fs.existsSync(path.join(val))) fs.mkdirSync(path.join(val))
        fs.accessSync(path.join(val), fs.constants.R_OK | fs.constants.W_OK)
        if (!fs.existsSync(path.join(val, 'DARAH_ARCHIVES'))) fs.mkdirSync(path.join(val, 'DARAH_ARCHIVES'))
        return true
      } catch (e) {
        if (settings.debug) console.error(e)
        ui.log.write(chalk`{red Error:} {red.bold ${e.message}}`)
        return 'Error. Try again.'
      }
    }
  } : false,
  (settings.archiving.tempDir.length === 0 || !fs.existsSync(path.join(settings.archiving.tempDir)) || !fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP')) || fs.accessSync(path.join(settings.archiving.tempDir), fs.constants.R_OK | fs.constants.W_OK) !== undefined) ? {
    type: 'input',
    name: 'tempDir',
    message: `Please enter cache directory or leave empty to use default ${chalk`{gray.underline (${__dirname})}:`}`,
    validate: function (val) {
      val = val.trim().replace(/[~]/g, os.homedir())
      if (val.length === 0) val = __dirname
      try {
        if (!fs.existsSync(path.join(val))) fs.mkdirSync(path.join(val))
        fs.accessSync(path.join(val), fs.constants.R_OK | fs.constants.W_OK)
        if (!fs.existsSync(path.join(val, 'DARAH_TEMP'))) fs.mkdirSync(path.join(val, 'DARAH_TEMP'))
        return true
      } catch (e) {
        if (settings.debug) console.error(e)
        ui.log.write(chalk`{red Error:} {red.bold ${e.message}}`)
        return 'Error. Try again.'
      }
    }
  } : false
].filter(Boolean)

if (settings.archiving.auto.enabled) {
  try {
    let testingDate = cronParser.parseExpression(settings.archiving.auto.cronSchedule)
    ui.log.write(chalk`{green Log:} {green.bold Auto archiving enabled && CRON schedule string succesfully validated.} {gray Archives at\n${testingDate.next().toString()},\n${testingDate.next().toString()},\n${testingDate.next().toString()}\n... etc.}`)
  } catch (e) {
    if (settings.debug) console.error(e)
    ui.log.write(chalk`{red Error:} {red.bold (Auto archiving enabled && CRON schedule string failed validation) ${e.message}}`)
    questions.push({
      type: 'input',
      name: 'cronSchedule',
      message: `Please enter new cron job schedule string or leave empty to use default ${chalk`{gray.underline (0 0 */1 * *)}`}:`,
      validate: function (val) {
        val = val.trim()
        if (val.length === 0) return true
        try {
          cronParser.parseExpression(val)
          return true
        } catch (e) {
          if (settings.debug) console.error(e)
          ui.log.write(chalk`{red Error:} {red.bold ${e.message}}`)
          return 'Error. Try again.'
        }
      }
    })
  }
}

if (questions.length > 0) {
  inquirer.prompt(questions).then(answers => {
    delete answers['discordToken'] // Delete it, we do not save it.

    if (typeof answers['tempDir'] === 'string') {
      settings.archiving.tempDir = answers['tempDir'].length === 0
        ? __dirname
        : answers['tempDir'].trim()
    }
    if (typeof answers['archiveDir'] === 'string') {
      settings.archiving.archiveDir = answers['archiveDir'].length === 0
        ? __dirname
        : answers['archiveDir'].trim()
    }
    if (typeof answers['cronSchedule'] === 'string') {
      settings.archiving.auto.cronSchedule = answers['cronSchedule'].length === 0
        ? '0 0 */1 * *'
        : answers['cronSchedule'].trim()
    }

    // Validation passed.
    if (answers.length > 0) {
      inquirer.prompt({
        type: 'list',
        name: 'saveSettings',
        message: 'Do you want to save your choices to settings.js?',
        choices: ['Yes', 'No']
      }).then(answers => {
        if (answers['saveSettings'] === 'Yes') {
          fs.writeFileSync(path.join(__dirname, 'settings.js'), applyNewSettings())
          // After that is complete, initialize auto or single-use.
        }
      })
    } else {
      // Just token was changed, probably, initialize auto or single-use.
    }
  })
} else {
  // Initialize auto or single-use.
}
