/**
 * INITIALIZE
 * Initialization is easy, validate settings file and request more information if insufficient.
 */

const {
  colors: {
    red,
    green,
    gray,
    bold,
    underline,
    blue
  },
  settings: {
    current: settings,
    saveSettings
  },
  rx: {
    Subject
  },
  discord,
  fs,
  writeFile,
  os,
  path,
  cli,
  cronParser,
  rimraf,
  fetch
} = require('./dependencies')

const archive = require('./src/discord.js')

const ui = new cli.ui.BottomBar()
const prompts = new Subject()

cli.prompt(prompts).ui.process.subscribe({
  next: onAnswer,
  error: (err) => {
    console.error(err)
    process.exit()
  }
})

const questions = {
  firstStart: {
    type: 'list',
    name: 'acceptTOS',
    message: `Have you read and accepted Discord's Developer Terms of Service?\n${blue(underline('https://discordapp.com/developers/docs/legal'))}\nDo you understand that you have to take all\nresponsibility for any and all consequences as a\nresult of running this script?\n`,
    choices: ['Yes', 'No']
  },
  loginQuestion: {
    type: 'password',
    name: 'authToken',
    mask: '*',
    message: 'Please enter your Discord Authentication token:\n',
    validate: (val) => {
      val = val.trim().replace(/[ ]+/g, '')
      if (val.length === 0) {
        throw new Error('Invalid token length. Try again.')
      } else return true
    }
  },
  inputDirectory: {
    type: 'input',
    name: 'archiveDir',
    message: `Please enter archive directory or leave empty to use default ${gray(underline(__dirname))}:\n`,
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
        ui.log.write(`${red('Error:')} ${red(bold(e.message))}`)
        return 'Error. Try again.'
      }
    }
  },
  temporaryDirectory: {
    type: 'input',
    name: 'tempDir',
    message: `Please enter cache directory or leave empty to use default ${gray(underline(__dirname))}:\n`,
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
        ui.log.write(`${red('Error:')} ${red(bold(e.message))}`)
        return 'Error. Try again.'
      }
    }
  },
  cronSchedule: {
    type: 'input',
    name: 'cronSchedule',
    message: `Please enter new cron job schedule string or leave empty to use default ${gray(underline('0 0 */1 * *'))}:\n`,
    validate: function (val) {
      val = val.trim()
      if (val.length === 0) return true
      try {
        cronParser.parseExpression(val)
        return true
      } catch (e) {
        if (settings.debug) console.error(e)
        ui.log.write(`${red('Error:')} ${red(bold(e.message))}`)
        return 'Error. Try again.'
      }
    }
  },
  saveToFile: {
    type: 'confirm',
    name: 'saveSettings',
    message: 'Do you want to save your choices to settings.js?',
    default: false
  }
}

function attemptLogin (answer) {
  ui.log.write('Attempting to authenticate...')
  discord.once('ready', () => {
    ui.log.write(green(`Success: ${bold('Discord account authenticated.')}`))
    if (settings.archiving.archiveDir.length === 0 || !fs.existsSync(path.join(settings.archiving.archiveDir)) || fs.accessSync(path.join(settings.archiving.archiveDir), fs.constants.R_OK | fs.constants.W_OK) !== undefined) prompts.next(questions.inputDirectory)
    else if (settings.archiving.tempDir.length === 0 || !fs.existsSync(path.join(settings.archiving.tempDir)) || fs.accessSync(path.join(settings.archiving.tempDir), fs.constants.R_OK | fs.constants.W_OK) !== undefined) prompts.next(questions.temporaryDirectory)
    else listGuildsPrompt()
  }).login(answer).catch((e) => {
    if (settings.debug) console.error(e)
    ui.log.write(red(`Error: ${bold(e.message)}`))
    discord.removeAllListeners('ready')
    prompts.next(questions.loginQuestion)
  })
}

if (settings.archiving.auto.enabled) {
  // if (typeof answers.cronSchedule === 'string') {
  //   settings.archiving.auto.cronSchedule = answers.cronSchedule.length === 0
  //     ? '0 0 */1 * *'
  //     : answers.cronSchedule.trim()
  // }
  try {
    const testingDate = cronParser.parseExpression(settings.archiving.auto.cronSchedule)
    ui.log.write(`${green('Log:')} ${green(bold('Auto archiving enabled && CRON schedule string succesfully validated.'))} ${gray(`Archives at\n${testingDate.next().toString()},\n${testingDate.next().toString()},\n${testingDate.next().toString()}\n... etc.`)}`)
  } catch (e) {
    if (settings.debug) console.error(e)
    ui.log.write(`${red('Error:')} ${red(bold(`Auto archiving enabled && CRON schedule string failed validation) ${e.message}`))}`)
    questions.push({
      type: 'input',
      name: 'cronSchedule',
      message: `Please enter new cron job schedule string or leave empty to use default ${gray(underline('0 0 */1 * *'))}:\n`,
      validate: function (val) {
        val = val.trim()
        if (val.length === 0) return true
        try {
          cronParser.parseExpression(val)
          return true
        } catch (e) {
          if (settings.debug) console.error(e)
          ui.log.write(`${red('Error:')} ${red(bold(e.message))}`)
          return 'Error. Try again.'
        }
      }
    })
  }
} else prompts.next(questions.firstStart)

function listGuildsPrompt () {
  const prompt = {
    type: 'checkbox',
    name: 'choosenGuilds',
    choices: [],
    message: 'Please choose guilds, DMs and groups to archive (Multiple choices):\n',
    validate: function (vals) {
      if (vals.length < 1) {
        return 'Choose at least one.'
      }
      return true
    }
  }

  const places = {
    guilds: [],
    directMessages: [],
    groups: []
  }

  discord.channels.forEach(i => {
    switch (i.type) {
      case 'text': {
        const guild = discord.guilds.get(i.guild.id)
        if (guild.channels.get(i.id).memberPermissions(guild.member(discord.user.id)).has('READ_MESSAGE_HISTORY') && guild.channels.get(i.id).memberPermissions(guild.member(discord.user.id)).has('READ_MESSAGES')) {
          if (!places.guilds.find(g => g.value.id === i.guild.id)) {
            places.guilds.push({ name: `${i.guild.name} (${i.guild.id})`, checked: !!settings.archiving.GUILDS[i.guild.id], value: { type: 'guild', id: i.guild.id } })
          }
        }
        break
      }
      case 'group':
        places.groups.push({ name: `${i.name || i.owner.username} (${i.id})`, checked: settings.archiving.GROUPS.indexOf(i.id) > -1, value: { type: 'group', id: i.id } })
        break
      case 'dm':
        places.directMessages.push({ name: `${i.recipient.username} (${i.recipient.id})`, checked: settings.archiving.DIRECTMESSAGES.indexOf(i.id) > -1, value: { type: 'dm', id: i.id } })
        break
    }
  })

  if (places.guilds.length > 0) {
    prompt.choices.push(new cli.Separator('= Guilds ='))
    prompt.choices.push({ name: 'ALL GUILDS', value: { type: 'guild', all: true, id: places.guilds.map(guild => guild.value.id) } })
    places.guilds.forEach(i => {
      prompt.choices.push(i)
    })
  }

  if (places.groups.length > 0) {
    prompt.choices.push(new cli.Separator('= Groups ='))
    prompt.choices.push({ name: 'ALL GROUPS', value: { type: 'group', id: places.groups.map(group => group.value.id) } })
    places.groups.forEach(i => {
      prompt.choices.push(i)
    })
  }

  if (places.directMessages.length > 0) {
    prompt.choices.push(new cli.Separator('= Direct messages ='))
    prompt.choices.push({ name: 'ALL DMs', value: { type: 'dm', id: places.directMessages.map(dm => dm.value.id) } })
    places.directMessages.forEach(i => {
      prompt.choices.push(i)
    })
  }

  return prompts.next(prompt)
}

function listGuildChannelsPrompt (guilds) {
  const prompt = {
    type: 'checkbox',
    name: 'choosenGuildChannels',
    choices: [],
    message: 'Please choose the channels in the guilds (Multiple choices):\n',
    validate: function (vals) {
      if (vals.length < 1) {
        return 'Choose at least one.'
      }
      return true
    }
  }

  const parsedGuilds = []

  for (let index = 0; index < guilds.length; index++) {
    const guild = discord.guilds.get(guilds[index])

    parsedGuilds.push({
      name: guild.name,
      id: guild.id,
      channelCategories: [
        {
          name: 'No category',
          channels: [{
            name: 'ALL CHANNELS',
            checked: !!guilds.find(g => g.all),
            id: guild.channels.filter(c => c.type === 'text' && c.memberPermissions(guild.member(discord.user.id)).has('READ_MESSAGE_HISTORY') && c.memberPermissions(guild.member(discord.user.id)).has('READ_MESSAGES')).map(c => c.id)
          }]
        }
      ]
    })

    const pG = parsedGuilds.find(pG => pG.id === guild.id)

    guild.channels.forEach(channel => {
      if (channel.type === 'text' && channel.memberPermissions(guild.member(discord.user.id)).has('READ_MESSAGE_HISTORY') && channel.memberPermissions(guild.member(discord.user.id)).has('READ_MESSAGES')) {
        const channelObject = {
          name: channel.name,
          id: channel.id,
          checked: settings.archiving.GUILDS[guild.id] ? (settings.archiving.GUILDS[guild.id].indexOf(channel.id) > -1) : false
        }

        if (channel.parent) {
          const parentInCategoriesArray = () => pG.channelCategories.find(cC => cC.name === channel.parent.name)
          if (!parentInCategoriesArray()) pG.channelCategories.push({ name: channel.parent.name, id: channel.parent.id, channels: [] })
          parentInCategoriesArray().channels.push(channelObject)
        } else {
          const defaultCategory = () => pG.channelCategories.find(cC => cC.name === 'No category')
          defaultCategory().channels.push(channelObject)
        }
      }
    })
  }

  if (parsedGuilds.length > 0) {
    parsedGuilds.forEach(pG => {
      prompt.choices.push(new cli.Separator(`= ${pG.name} (${pG.id}) =`))
      pG.channelCategories.forEach(cC => {
        prompt.choices.push(new cli.Separator(`== ${cC.name}${cC.id ? ` (${cC.id})` : ''} ==`))
        cC.channels.forEach(c => {
          prompt.choices.push({ name: `${c.name}${typeof c.id === 'string' ? ` (${c.id})` : ''}`, checked: c.checked, value: { guild: pG.id, id: c.id } })
        })
      })
    })
  }

  return prompts.next(prompt)
}

function onAnswer (question) {
  const answer = question.answer
  switch (question.name) {
    case 'acceptTOS':
      if (answer === 'Yes') {
        if (settings.authentication.discord.token.length > 0) return attemptLogin(settings.authentication.discord.token)
        else return prompts.next(questions.loginQuestion)
      } else {
        ui.log.write(red('ToS not accepted, aborting script.'))
        process.exit()
      }
      break
    case 'authToken':
      return attemptLogin(answer)
    case 'archiveDir':
      if (typeof answer === 'string') {
        settings.archiving.archiveDir = answer.length === 0
          ? __dirname
          : answer.trim()
      }
      if (settings.archiving.tempDir.length === 0 || !fs.existsSync(path.join(settings.archiving.tempDir)) || fs.accessSync(path.join(settings.archiving.tempDir), fs.constants.R_OK | fs.constants.W_OK) !== undefined) prompts.next(questions.temporaryDirectory)
      else listGuildsPrompt()
      break
    case 'tempDir':
      if (typeof answer === 'string') {
        settings.archiving.tempDir = answer.length === 0
          ? __dirname
          : answer.trim()
      }
      return listGuildsPrompt()
    case 'choosenGuilds': {
      const guilds = [...new Set(answer.filter(choice => choice.type === 'guild').map(guild => guild.id).flat())]
      const groups = [...new Set(answer.filter(choice => choice.type === 'group').map(group => group.id).flat())]
      const dms = [...new Set(answer.filter(choice => choice.type === 'dm').map(dm => dm.id).flat())]
      settings.archiving.GROUPS = groups.length > 0 ? groups : []
      settings.archiving.DIRECTMESSAGES = dms.length > 0 ? dms : []
      settings.archiving.GUILDS = {}
      if (guilds.length > 0) {
        return listGuildChannelsPrompt(guilds)
      } else {
        if (settings.debug) {
          console.table(guilds)
          console.table(groups)
          console.table(dms)
        }
        return prompts.next(questions.saveToFile)
      }
    }
    case 'choosenGuildChannels': {
      const parsedGuildsAndChannels = {}
      answer.forEach(channel => {
        if (!parsedGuildsAndChannels[channel.guild]) parsedGuildsAndChannels[channel.guild] = []
        if (typeof channel.id !== 'string') channel.id.forEach(id => parsedGuildsAndChannels[channel.guild].push(id))
        else parsedGuildsAndChannels[channel.guild].push(channel.id)
        parsedGuildsAndChannels[channel.guild] = [...new Set(parsedGuildsAndChannels[channel.guild])]
      })
      settings.archiving.GUILDS = parsedGuildsAndChannels
      if (settings.debug) {
        console.table(Object.keys(settings.archiving.GUILDS))
        console.table(settings.archiving.GROUPS)
        console.table(settings.archiving.DIRECTMESSAGES)
      }
      return prompts.next(questions.saveToFile)
    }
    case 'saveSettings':
      if (answer) {
        if (settings.debug) ui.log.write(`${gray('Debug:')} ${gray(bold('Creating backup file of existing settings file.'))}`)
        if (!fs.existsSync(path.join(__dirname, 'settings.json.bkp'))) fs.writeFileSync(path.join(__dirname, 'settings.json.bkp'), JSON.stringify(require('./settings.json'), null, 2))
        if (settings.debug) ui.log.write(`${gray('Debug:')} ${gray(bold('Writing new data to settings file.'))}`)
        saveSettings(settings)
      }
      return start()
  }
}

function start () {
  const date = Date.now()
  ui.updateBottomBar(`${green(bold('Next archive at'))} ${green(bold(underline(settings.archiving.auto.enabled ? cronParser.parseExpression(settings.archiving.auto.cronSchedule).next().toString() : new Date(date).toString())))}${green(bold('.'))}`)
  setTimeout(() => {
    archive({ discord, settings, ui, colors: { red, blue, green, underline, bold, gray }, date, rimraf, fetch, fs, writeFile, path }).then(() => {
      // All done.
      ui.log.write(`${green(bold(`Done! It took around ${Number(((Date.now() - date) / 1000) / 60).toFixed(0)} minutes to finish.`))}`)

      if (settings.archiving.auto.enabled) {
        ui.updateBottomBar(`${green(bold('Next archive at'))} ${green(bold(underline(cronParser.parseExpression(settings.archiving.auto.cronSchedule).next().toString())))}${green(bold('.'))}`)
        setTimeout(() => {
          start()
        }, new Date(cronParser.parseExpression(settings.archiving.auto.cronSchedule).next()) - Date.now())
      } else {
        ui.updateBottomBar(`${green(bold('Thank you for using DARAH.'))}`)
        process.exit()
      }
    })
  }, settings.archiving.auto.enabled ? new Date(cronParser.parseExpression(settings.archiving.auto.cronSchedule).next()) - Date.now() : 0)
}
