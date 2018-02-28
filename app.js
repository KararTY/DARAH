/**
 * Server Auto Record Archiver Heroine
 * MIT License
 */

let readline = require('readline')
let settings = require('./settings.js')
let pretty = settings.formatOutput.enabled && Number.isInteger(settings.formatOutput.whitespace) ? settings.formatOutput.whitespace : 0

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
      termsOfService()
    } else question()
  })
  question()
} else termsOfService()

function termsOfService () {
  rlSettings.close()
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
          // Initializing channel specific objects.
          object[channel.id] = {
            c: {
              n: channel.name,
              i: channel.id,
              to: channel.topic ? channel.topic : undefined
            },
            g: {
              n: channel.guild.name,
              i: channel.guild.id
            },
            r: {},
            u: {},
            m: []
          }
          counter[channel.id] = {
            nextCount: settings.messagesEveryFile,
            count: 0,
            atSplit: 0
          }
          return fetchMore(channel)
        }
      })
    ).then(g => {
      g = g.filter(function (e) { return e }) // Filter empties.
      let guild = g.pop()
      debug('Creating guild details file....')
      let rolesInGuild = []
      guild.roles.forEach(item => {
        rolesInGuild.push({
          po: item.position,
          n: item.name,
          i: item.id,
          t: item.createdTimestamp,
          c: item.hexColor,
          h: item.hoist,
          m: item.members.size,
          mg: item.managed,
          me: item.mentionable,
          p: item.permissions
        })
      })
      let emojisInGuild = []
      guild.emojis.forEach(item => {
        let availableForRoles = []
        item.roles.forEach(roles => {
          availableForRoles.push({
            n: roles.name,
            i: roles.id
          })
        })
        emojisInGuild.push({
          n: item.name,
          i: item.id,
          if: item.identifier,
          c: item.requiresColons,
          u: item.url,
          a: item.animated,
          t: item.createdTimestamp,
          m: item.managed,
          r: availableForRoles.length > 0 ? availableForRoles : undefined
        })
      })
      let channelsInGuild = []
      guild.channels.forEach(item => {
        let permissionOverwrites = []
        item.permissionOverwrites.forEach(overwrites => {
          permissionOverwrites.push({
            i: overwrites.id,
            ty: overwrites.type
          })
        })
        channelsInGuild.push({
          n: item.name,
          i: item.id,
          ty: item.type,
          po: item.position,
          t: item.createdTimestamp,
          pa: item.parent ? { n: item.parent.name, i: item.parent.id } : undefined,
          p: permissionOverwrites.length > 0 ? permissionOverwrites : undefined
        })
      })
      let guildDetails = {
        n: guild.name,
        i: guild.id,
        a: guild.nameAcronym,
        u: guild.iconURL,
        l: guild.large,
        m: guild.memberCount,
        t: guild.createdTimestamp,
        af: {
          e: !!guild.afkChannel,
          i: guild.afkChannelId,
          t: guild.afkTimeout
        },
        o: {
          n: guild.owner.user.username,
          i: guild.owner.id,
          ai: guild.applicationId,
          nn: guild.owner.nickname ? guild.owner.nickname : undefined,
          tg: guild.owner.user.tag,
          u: guild.owner.user.displayAvatarURL
        },
        re: guild.region,
        s: guild.splashURL,
        e: guild.explicitContentFilter,
        v: guild.verificationLevel,
        ee: guild.embedEnabled,
        em: emojisInGuild,
        r: rolesInGuild,
        c: channelsInGuild,
        _at: {
          t: date,
          s: Date(date).toString()
        },
        _by: {
          n: guild.me.user.username,
          i: guild.me.user.id,
          nn: guild.me.displayName,
          tg: guild.me.user.tag,
          u: guild.me.user.displayAvatarURL,
          b: guild.me.user.bot
        },
        _app: 'S.A.R.A.H. app by KararTY & Tonkku107 <https://github.com/kararty/serverautorecordarchiverheroine>'
      }
      if (!settings.formatOutput.mentionWhoArchived) {
        delete guildDetails._archivedBy
        delete guildDetails._archivedAt.string // Timezone is a potential identifiable personal information.
      }
      fs.writeFile(path.join(__dirname, 'temp', `[GUILD_INFO]${guild.name}(${guild.id}).json`), JSON.stringify(guildDetails, null, pretty), (err) => {
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
      date = Date.now()
      console.log('Starting...', date.toString())
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
              let attachments
              if (msg.attachments.size) {
                attachments = []
                msg.attachments.forEach(attachment => {
                  attachments.push({n: attachment.filename, u: attachment.url})
                })
              }
              let firstUserMention
              if (!object[channel.id].u[msg.author.id]) {
                let roles
                if (msg.member) {
                  roles = []
                  let firstRoleMention
                  msg.member.roles.forEach(role => {
                    if (!object[channel.id].r[role.id]) {
                      firstRoleMention = {
                        n: role.name,
                        i: role.id,
                        p: role.permissions,
                        c: role.hexColor
                      }
                      object[channel.id].r[role.id] = firstRoleMention
                    }
                    roles.push(role.id)
                  })
                }
                firstUserMention = {
                  n: msg.author.username,
                  i: msg.author.id,
                  nn: msg.member ? (msg.member.nickname ? msg.member.nickname : undefined) : undefined,
                  tg: msg.author.tag,
                  a: msg.author.displayAvatarURL,
                  b: msg.author.bot,
                  t: msg.author.createdTimestamp,
                  r: roles
                }
                object[channel.id].u[msg.author.id] = firstUserMention
              }
              let edits
              /* // Doesn't work. Client has to be there before edit happens?
              if (msg.editedTimestamp && msg.edits.size) {
                edits = []
                msg.edits.forEach((element) => {
                  edits.push({[element.editedTimestamp]: element.cleanContent})
                })
              }
              */
              object[channel.id].m.push({
                i: msg.id,
                u: msg.author.id,
                c: {
                  m: msg.cleanContent,
                  a: attachments
                },
                t: msg.createdTimestamp,
                p: msg.pinned ? true : undefined,
                e: msg.editedAtTimestamp,
                es: edits
              })
              counter[channel.id].count++
            }
          })
          debug(`${counter[channel.id].count}\t File ${counter[channel.id].atSplit + 1} for\t ${channel.name}`)
          if (counter[channel.id].count >= counter[channel.id].nextCount) {
            counter[channel.id].nextCount += settings.messagesEveryFile
            counter[channel.id].atSplit++
            debug('Split', counter[channel.id].atSplit, 'for channel', channel.id, '& next split at', counter[channel.id].nextCount)
            fs.writeFile(path.join(__dirname, 'temp', `[CHANNEL]${channel.name}${channel.nsfw ? '[NSFW]' : ''}(${channel.id})_${counter[channel.id].atSplit}.json`), JSON.stringify(object[channel.id], null, pretty), (err) => {
              if (err) throw err
              console.log('Saved split for channel', channel.id, 'at', counter[channel.id].count)
              object[channel.id] = {
                c: {
                  n: channel.name,
                  i: channel.id,
                  to: channel.topic ? channel.topic : undefined
                },
                g: {
                  n: channel.guild.name,
                  i: channel.guild.id
                },
                r: {},
                u: {},
                m: []
              } // Reset
              fetchMore(channel, msgLast.id).then(resolve, reject)
            })
          } else fetchMore(channel, msgLast.id).then(resolve, reject)
        } else {
          counter[channel.id].atSplit++
          fs.writeFile(path.join(__dirname, 'temp', `[CHANNEL]${channel.name}${channel.nsfw ? '[NSFW]' : ''}(${channel.id})_${counter[channel.id].atSplit}.json`), JSON.stringify(object[channel.id], null, pretty), (err) => {
            if (err) throw err
            console.log('Finished:', channel.id)
            object[channel.id] = {
              c: {
                n: channel.name,
                i: channel.id,
                to: channel.topic ? channel.topic : undefined
              },
              g: {
                n: channel.guild.name,
                i: channel.guild.id
              },
              r: {},
              u: {},
              m: []
            } // Reset
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
