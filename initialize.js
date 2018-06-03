/**
 * INITIALIZE
 * Initialization is easy, validate settings file and request more information if insufficient.
 */

const settings = require('./settings.js')

const discord = require('./src/discord.js')

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
    GUILDS: [${settings.archiving.GUILDS.length > 0 ? settings.archiving.GUILDS.map(i => `'${i}'`).join(', ') : ``}], // Guild ids. Use 'ALL' for all.
    GROUPS: [${settings.archiving.GROUPS.length > 0 ? settings.archiving.GROUPS.map(i => `'${i}'`).join(', ') : ``}], // Owner user id. Use 'ALL' for all.
    DIRECTMESSAGES: [${settings.archiving.DIRECTMESSAGES.length > 0 ? settings.archiving.DIRECTMESSAGES.map(i => `'${i}'`).join(', ') : ``}], // User ids. Use 'ALL' for all.
    tempDir: '${settings.archiving.tempDir}', // Put temp directory here. (__dirname)
    archiveDir: '${settings.archiving.archiveDir}', // Put archive directory here. (__dirname)
    auto: {
      enabled: ${settings.archiving.auto.enabled},
      cronSchedule: '${settings.archiving.auto.cronSchedule}' // This example cron schedule ('0 0 */1 * *') will run archiver every midnight (00:00).
    },
    overrule: ${settings.archiving.overrule}, // Use this to overrule all available custom guild archive options with the one below.
    defaultOptions: {
      fullArchive: ${settings.archiving.defaultOptions.fullArchive}, // Archives everything from the beginning if enabled.
      everyMessages: ${settings.archiving.defaultOptions.everyMessages}, // Create new file every X messages.
      channels: {
        id: ${settings.archiving.defaultOptions.channels.id},
        name: ${settings.archiving.defaultOptions.channels.name},
        topic: ${settings.archiving.defaultOptions.channels.topic},
        voice: ${settings.archiving.defaultOptions.channels.voice}
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
      information: {
        id: ${settings.archiving.defaultOptions.information.id},
        name: ${settings.archiving.defaultOptions.information.name},
        icon: ${settings.archiving.defaultOptions.information.icon},
        owner: ${settings.archiving.defaultOptions.information.owner},
        emojis: ${settings.archiving.defaultOptions.information.emojis},
        roles: ${settings.archiving.defaultOptions.information.roles},
        channels: ${settings.archiving.defaultOptions.information.channels},
        users: ${settings.archiving.defaultOptions.information.users}
      },
      downloads: {
        icons: ${settings.archiving.defaultOptions.downloads.icons},
        images: ${settings.archiving.defaultOptions.downloads.images},
        emojis: ${settings.archiving.defaultOptions.downloads.emojis},
        videos: ${settings.archiving.defaultOptions.downloads.videos},
        audios: ${settings.archiving.defaultOptions.downloads.audios},
        texts: ${settings.archiving.defaultOptions.downloads.texts},
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

let loginFailed

const inquirer = require('inquirer')
const chalk = require('chalk')
const ui = new inquirer.ui.BottomBar()

const cronParser = require('cron-parser')

// Validation
// TODO: Validate pastebin details.
let loginQuestion = {
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
      if (!loginFailed) ui.log.write(chalk`{green Log:} {green.bold Make it easier for yourself, enter Discord Authorization token in the 'settings.js' file next time!}`)
      else ui.log.write(chalk`{redBright Warning:} {redBright.bold Please correctly enter your Discord Authorization token in the 'settings.js' file next time!}`)
      done(null, true)
    }).login(val).catch(e => {
      if (settings.debug) console.error(e)
      ui.log.write(chalk`{red Error:} {red.bold ${e.message}}`)
      client.removeAllListeners('ready')
      done('Could not use that token, try again.')
    })
  }
}
let questions = [
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
inquirer.prompt({
  type: 'list',
  name: 'acceptTOS',
  message: chalk`Have you read and accepted Discord's Developer Terms of Service?\n{blue.underline https://discordapp.com/developers/docs/legal}\nDo you understand that you have to take all\nresponsibility for any and all consequences as a\nresult of running this script?`,
  choices: ['Yes', 'No']
}).then(answer => {
  if (answer['acceptTOS'] === 'No') {
    ui.log.write(chalk`{redBright Warning:} {redBright.bold ToS not accepted, please uninstall script.}`)
    process.exit(0)
  }

  let prom = []
  if (settings.authentication.discord.token) {
    prom.push(new Promise((resolve, reject) => {
      client.once('ready', () => {
        ui.log.write(chalk`{green Log:} {green.bold Successfully authorized on Discord.}`)
        resolve()
      }).login(settings.authentication.discord.token).catch(e => {
        if (settings.debug) console.error(e)
        ui.log.write(chalk`{red Error:} {red.bold ${e.message}}`)
        client.removeAllListeners('ready')
        loginFailed = true
        resolve(loginQuestion)
      })
    }))
  }

  Promise.all(prom).then(res => {
    inquirer.prompt(res[0] || loginQuestion).then(answers => {
      delete answers['discordToken'] // Get rid of it.
      new Promise((resolve, reject) => {
        if (settings.archiving.GROUPS.length === 0 && settings.archiving.GUILDS.length === 0 && settings.archiving.DIRECTMESSAGES.length === 0) {
          let guilds = []
          let places = {
            guilds: [],
            directMessages: [],
            groups: []
          }
          client.channels.filter(i => (i.type === 'dm' && i.permissionsFor(client.user.id).has('READ_MESSAGES') &&
            i.permissionsFor(client.user.id).has('READ_MESSAGE_HISTORY')) || i.type === 'group' || i.type === 'text').map(i => {
            if (i.type === 'dm') {
              places.directMessages.push({name: `${i.recipient.username} (${i.recipient.id})`, value: `${i.type},${i.recipient.id}`})
            } else if (i.type === 'text') {
              if (guilds.indexOf(i.guild.id) === -1) {
                places.guilds.push({name: `(${i.guild.nameAcronym}) ${i.guild.name} (${i.guild.id})`, value: `${i.type},${i.guild.id}`})
                guilds.push(i.guild.id)
              }
            } else if (i.type === 'group') {
              places.groups.push({name: `${i.name} (${i.id})`, value: `${i.type},${i.ownerID}`})
            }
          })
          let chooseChannels = {
            type: 'checkbox',
            name: 'chosenChannels',
            choices: [],
            message: 'Please choose what to archive (Multiple choices):',
            validate: function (vals) {
              if (vals.length < 1) {
                return 'Choose at least one.'
              }
              return true
            }
          }
          if (places.guilds.length > 0) {
            chooseChannels.choices.push(new inquirer.Separator('= Guilds ='))
            chooseChannels.choices.push({name: 'ALL', checked: true, value: 'text,ALL'})
            places.guilds.forEach(i => {
              chooseChannels.choices.push(i)
            })
          }
          if (places.groups.length > 0) {
            chooseChannels.choices.push(new inquirer.Separator('= Groups ='))
            chooseChannels.choices.push({name: 'ALL', checked: true, value: 'group,ALL'})
            places.groups.forEach(i => {
              chooseChannels.choices.push(i)
            })
          }
          if (places.directMessages.length > 0) {
            chooseChannels.choices.push(new inquirer.Separator('= Direct messages ='))
            chooseChannels.choices.push({name: 'ALL', checked: true, value: 'dm,ALL'})
            places.directMessages.forEach(i => {
              chooseChannels.choices.push(i)
            })
          }
          resolve(chooseChannels)
        } else resolve()
      }).then(res => {
        if (res) questions.push(res)
        if (questions.length > 0) {
          inquirer.prompt(questions).then(answers => {
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
            if (answers['chosenChannels']) {
              answers['chosenChannels'].forEach(i => {
                let type = i.split(',')[0] === 'dm' ? 'DIRECTMESSAGES' : i.split(',')[0] === 'group' ? 'GROUPS' : 'GUILDS'
                let id = i.split(',')[1]
                settings.archiving[type].push(id)
              })
            }

            // Validation passed.
            if (answers['chosenChannels'] || answers.length > 0) {
              inquirer.prompt({
                type: 'list',
                name: 'saveSettings',
                message: 'Do you want to save your choices to settings.js?',
                choices: ['Yes', 'No']
              }).then(answers => {
                if (answers['saveSettings'] === 'Yes') {
                  if (settings.debug) ui.log.write(chalk`{gray Debug:} {gray.bold Creating backup file of existing settings file.}`)
                  fs.writeFileSync(path.join(__dirname, 'settings.js.bkp'), JSON.stringify(require('./settings.js'), null, 2))
                  if (settings.debug) ui.log.write(chalk`{gray Debug:} {gray.bold Writing new data to settings file.}`)
                  fs.writeFileSync(path.join(__dirname, 'settings.js'), applyNewSettings())
                  // After that is complete, initialize auto or single-use.
                  start()
                } else start()
              })
            } else {
              // Just token was inputted, probably, initialize auto or single-use.
              start()
            }
          })
        } else {
          // Initialize auto or single-use.
          start()
        }
      })
    })
  })
})

function start () {
  let date = Date.now()
  ui.updateBottomBar(chalk`{green.bold Next archive at} {green.bold.underline ${settings.archiving.auto.enabled ? cronParser.parseExpression(settings.archiving.auto.cronSchedule).next().toString() : new Date(date).toString()}}{green.bold .}`)
  setTimeout(() => {
    discord(client, settings, {ui, chalk}, date).then(res => {
      // All done
      ui.log.write(chalk`{green.bold Done! It took ~${Number(((Date.now() - date) / 1000) / 60).toFixed(0)} minutes to finish.}`)

      if (settings.archiving.auto.enabled) {
        ui.updateBottomBar(chalk`{green.bold Next archive at} {green.bold.underline ${cronParser.parseExpression(settings.archiving.auto.cronSchedule).next().toString()}}{green.bold .}`)
        setTimeout(() => {
          start()
        }, new Date(cronParser.parseExpression(settings.archiving.auto.cronSchedule).next()) - Date.now())
      } else {
        ui.updateBottomBar(chalk`{green.bold Thank you for using DARAH.}`)
        process.exit(0)
      }
    })
  }, settings.archiving.auto.enabled ? new Date(cronParser.parseExpression(settings.archiving.auto.cronSchedule).next()) - Date.now() : 0)
}
