/**
 * Server Auto Record Archiver Heroine
 * MIT License
 */

let readline = require('readline')
let settings = require('./settings.js')

let rlSettings = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

if (settings.authtoken === '') {
  rlSettings.question('No authtoken provided in settings.js, \nplease enter it manually.\nauthtoken: ', answer => {
    settings.authtoken = answer
    if (settings.guildID === '') {
      let question = () => rlSettings.question('\nNo guildID provided in settings.js, \nplease enter it manually.\nguildID: ', answer => {
        if (Number.isInteger(Number(answer))) {
          settings.guildID = answer
          rlSettings.close()
          termsOfService()
        } else question()
      })
      question()
    } else rlSettings.close()
  })
} else if (settings.guildID === '') {
  let question = () => rlSettings.question('No guildID provided in settings.js, \nplease enter it manually.\nguildID: ', answer => {
    if (Number.isInteger(Number(answer))) {
      settings.guildID = answer
      rlSettings.close()
      termsOfService()
    } else question()
  })
  question()
}

function termsOfService () {
  if (!settings.acceptTOS) {
    let rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question("\nHave you read and accepted Discord's Developer Terms of Service?\n" +
    '\nhttps://discordapp.com/developers/docs/legal\n' +
    '\nDo you understand that you may have to take all\n' +
    'responsibility for any and all consequences as a\n' +
    'result of running this script? (y/n)\n: ', (answer) => {
      switch (answer.charAt(0)) {
        case 'y':
          console.log('Script will timeout for 30 seconds.\n\nIf you change your mind, please press\nCtrl + C on your keyboard to close script.')
          setTimeout(() => {
            start()
            rl.close()
          }, 30 * 1000)
          break
        case 'n':
          console.log('\nShutting down prematurely.\nPlease uninstall script.')
          rl.close()
          break
        default:
          console.log('Please run the script again.')
          rl.close()
          break
      }
    })
  } else {
    console.log('ToS already accepted.')
    start()
  }
}

function start () {
  let archiver = require('archiver')
  let archive = archiver('zip')
  const { Client } = require('discord.js')
  let client = new Client()
  let fs = require('fs')
  let path = require('path')
  let parser = require('cron-parser')
  let interval = parser.parseExpression(settings.CRON)

  // Put in your guild id in settings.js
  const guildID = settings.guildID
  // Put in your auth token in settings.js
  const auth = settings.authtoken

  let object = {}
  let counter = {}
  let people = {}
  let date = Date.now()

  let disconnected = false

  function debug (...args) {
    if (settings.debug) console.log(...args)
  }

  function cleanTempDir () {
    if (!fs.existsSync(path.join(__dirname, 'temp'))) return debug('No temp directory found.')
    fs.readdirSync(path.join(__dirname, 'temp')).forEach((file, index) => {
      let curPath = path.join(__dirname, 'temp', file)
      fs.unlinkSync(curPath)
    })
    console.log('Cleaned directory', path.join(__dirname, 'temp').toString())
  }

  function run () {
    if (disconnected) return console.log("Archive won't run! Discord disconnected?")
    // Creates 'temp' directory if it doesn't exist.
    if (!fs.existsSync(path.join(__dirname, 'temp'))) {
      console.log('Creating temp directory.')
      fs.mkdirSync(path.join(__dirname, 'temp'))
    }
    // Creates 'archive' directory if it doesn't exist.
    if (!fs.existsSync(path.join(__dirname, 'archive'))) {
      console.log('Creating archive directory.')
      fs.mkdirSync(path.join(__dirname, 'archive'))
    }
    Promise.all(client.guilds.get(guildID)
      .channels.map(channel => {
        if (channel.permissionsFor(client.user.id).has('READ_MESSAGES') && channel.permissionsFor(client.user.id).has('READ_MESSAGE_HISTORY') && channel.type === 'text') {
          debug(channel.id, channel.name)
          object[channel.id] = []
          people[channel.id] = {}
          counter[channel.id] = {
            nextCount: settings.messagesEveryFile,
            count: 1,
            atSplit: 0
          }
          return fetchMore(channel)
        }
      })
    ).then((g) => {
      g = g.filter(function (e) { return e }) // Filter empties.
      let guild = g.pop()
      debug('Creating guild details file....')
      let rolesInGuild = []
      guild.roles.forEach(item => {
        rolesInGuild.push({
          position: item.position,
          id: item.id,
          name: item.name,
          createdTimestamp: item.createdTimestamp,
          color: item.hexColor,
          hoistUsers: item.hoist,
          members: item.members.size,
          managed: item.managed,
          mentionable: item.mentionable,
          permissions: item.permissions
        })
      })
      let emojisInGuild = []
      guild.emojis.forEach(item => {
        let availableForRoles = []
        item.roles.forEach(roles => {
          availableForRoles.push({
            id: roles.id,
            name: roles.name
          })
        })
        emojisInGuild.push({
          id: item.id,
          name: item.name,
          animated: item.animated,
          requiresColons: item.requiresColons,
          url: item.url,
          identifier: item.identifier,
          createdTimestamp: item.createdTimestamp,
          managed: item.managed,
          roles: availableForRoles.length > 0 ? availableForRoles : undefined
        })
      })
      let channelsInGuild = []
      guild.channels.forEach(item => {
        let permissionOverwrites = []
        item.permissionOverwrites.forEach(overwrites => {
          permissionOverwrites.push({
            id: overwrites.id,
            type: overwrites.type
          })
        })
        channelsInGuild.push({
          position: item.position,
          id: item.id,
          type: item.type,
          name: item.name,
          createdTimestamp: item.createdTimestamp,
          parent: item.parent ? { id: item.parent.id, name: item.parent.name } : undefined,
          permissionOverwrites: permissionOverwrites.length > 0 ? permissionOverwrites : undefined
        })
      })
      let guildDetails = {
        id: guild.id,
        name: guild.name,
        acronym: guild.nameAcronym,
        icon: guild.iconURL,
        isLarge: guild.large,
        memberCount: guild.memberCount,
        createdTimestamp: guild.createdTimestamp,
        afk: {
          channel: guild.afkChannel,
          timeout: guild.afkTimeout,
          channelId: guild.afkChannelID
        },
        owner: {
          id: guild.owner.id,
          name: guild.owner.name,
          tag: guild.owner.tag,
          avatar: guild.owner.displayAvatarURL
        },
        region: guild.region,
        splash: guild.splashURL,
        explicitContentFilter: guild.explicitContentFilter,
        verificationLevel: guild.verificationLevel,
        embedEnabled: guild.embedEnabled,
        emojis: emojisInGuild,
        roles: rolesInGuild,
        channels: channelsInGuild,
        _archivedAt: date,
        _archivedBy: {
          id: guild.me.user.id,
          nickname: guild.me.displayName,
          name: guild.me.user.username,
          tag: guild.me.user.tag,
          avatar: guild.me.user.displayAvatarURL,
          isBot: guild.me.user.bot
        },
        _archiveApp: 'S.A.R.A.H. app by KararTY & Tonkku107 <https://github.com/kararty/serverautorecordarchiverheroine>'
      }
      fs.writeFile(path.join(__dirname, 'temp', `[GUILD_INFO]${guild.name}(${guild.id}).json`), JSON.stringify(guildDetails, null, 2), (err) => {
        if (err) throw err
        debug('Starting compression! Please wait, this may take time.')
        let output = fs.createWriteStream(path.join(__dirname, 'archive', `archive_${guild.name}(${guild.id})_${date}.zip`))
        output.on('close', () => {
          console.log('Finished archiving!', Date().toString())
          if (!settings.auto) process.exit(0)
          timer()
        })
        archive.pipe(output)
        archive.glob('**/*', { cwd: path.join(__dirname, 'temp'), src: ['**/*'], expand: true })
        archive.finalize((err, bytes) => {
          if (err) throw err
          // #Not working# if (settings.debug) console.log('Finished compressing! Total bytes', bytes, '\nNot done yet! Please wait...')
        })
      })
    })
  }

  function timer () {
    setTimeout(() => {
      console.log('Starting...', Date().toString())
      cleanTempDir()
      run()
    }, new Date(interval.next()) - Date.now())
  }

  const fetchMore = (channel, before) => {
    return new Promise((resolve, reject) => {
      channel.fetchMessages({limit: 100, before: before}).then(msg => {
        if (msg.size > 0) {
          let msgLast = msg.last()
          msg.forEach(msg => {
            if (!msg.system) {
              // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
              let attachments = []
              if (msg.attachments.size) {
                msg.attachments.forEach((element) => {
                  attachments.push(element.url)
                })
              }
              let firstMention
              if (!people[channel.id][msg.author.id]) {
                people[channel.id][msg.author.id] = { id: msg.author.id, avatar: msg.author.displayAvatarURL, isBot: msg.author.bot, createdTimestamp: msg.author.createdTimestamp, name: msg.author.username, tag: msg.author.tag }
                firstMention = people[channel.id][msg.author.id]
              }
              let edits = []
              /* Doesn't work.
              if (msg.editedTimestamp) {
                msg.edits.forEach((element) => {
                  edits.push({[element.editedTimestamp]: element.cleanContent})
                })
              }
              */
              object[channel.id].push({timestamp: msg.createdTimestamp, in: {id: msg.channel.id, name: msg.channel.name}, msgId: msg.id, user: firstMention || {id: msg.author.id, name: msg.author.username}, content: {message: msg.cleanContent, attachments: attachments.length ? attachments : undefined}, pinned: msg.pinned ? true : undefined, edits: edits.length ? edits : undefined})
              counter[channel.id].count++
            }
          })
          debug(`${counter[channel.id].count} / ${counter[channel.id].nextCount}\t Split ${counter[channel.id].atSplit}\t for channel ${channel.name}`)
          if (counter[channel.id].count >= counter[channel.id].nextCount) {
            counter[channel.id].nextCount += settings.messagesEveryFile
            counter[channel.id].atSplit++
            debug('Split', counter[channel.id].atSplit, 'for channel', channel.id, '& next split at', counter[channel.id].nextCount)
            fs.writeFile(path.join(__dirname, 'temp', `[CHANNEL]${channel.name}${channel.nsfw ? '[NSFW]' : ''}(${channel.id})_${counter[channel.id].atSplit}.json`), JSON.stringify(object[channel.id], null, 2), (err) => {
              if (err) throw err
              console.log('Saved split for channel', channel.id, 'at', counter[channel.id].count)
              object[channel.id] = [] // Reset
              fetchMore(channel, msgLast.id).then(resolve, reject)
            })
          } else fetchMore(channel, msgLast.id).then(resolve, reject)
        } else {
          counter[channel.id].atSplit++
          fs.writeFile(path.join(__dirname, 'temp', `[CHANNEL]${channel.name}${channel.nsfw ? '[NSFW]' : ''}(${channel.id})_${counter[channel.id].atSplit}.json`), JSON.stringify(object[channel.id], null, 2), (err) => {
            if (err) throw err
            console.log('Finished:', channel.id)
            object[channel.id] = [] // Reset
            people[channel.id] = {} // Reset
            resolve(channel.guild)
          })
        }
      })
    })
  }

  client.once('ready', () => {
    console.log('Logged into Discord.')
    if (settings.auto) {
      console.log('Starting automation...')
      date = Date.now()
      timer()
    } else {
      console.log('Running one-timer...')
      cleanTempDir()
      run()
    }
  }).on('reconnecting', () => {
    console.log('Reconnecting to Discord...')
    disconnected = true
  }).on('resume', () => {
    console.log('Reconnected to Discord. All functional.')
    disconnected = false
  }).on('disconnect', () => {
    throw new Error("Couldn't connect to Discord after multiple retries. Check your connection and relaunch S.A.R.A.H.")
  }).login(auth)
}
