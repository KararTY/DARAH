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
    } else termsOfService()
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
    '\nDo you understand that you have to take all\n' +
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
  const { Client } = require('discord.js')
  let client = new Client()
  let fs = require('fs')
  let rimraf = require('rimraf')
  let path = require('path')
  let parser = require('cron-parser')

  // Put in your guild id in settings.js
  const guildID = settings.guildID === 'ALL' ? undefined : settings.guildID
  // Put in your auth token in settings.js
  const auth = settings.authtoken

  let object = {}
  let deleted = {}

  let counter = fs.existsSync(path.join(__dirname, '_SARAH_doNotDelete_counter.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, '_SARAH_doNotDelete_counter.json')).toString('utf8')) : {}
  let date = Date.now()

  let disconnected = false

  function debug (...args) {
    if (settings.debug) console.log(...args)
  }

  function cleanTempDir () {
    if (!fs.existsSync(path.join(__dirname, 'temp'))) return debug('DEBUG-ONLY: No temp directory found.')
    rimraf.sync(path.join(__dirname, 'temp'))
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
    Promise.all(client.channels.filter(i => {
      if (settings.channels.length > 0) {
        return i.type === 'text' ? settings.channels.includes(i.id) : i.type === 'dm' ? settings.channels.includes(i.recipient.id) : i.type === 'group' ? (settings.channels.includes(i.ownerID) || settings.channels.includes(i.id)) : false
      } else return true
    }).filter(i => i.guild ? i.guild.available : true).filter(i => (guildID ? (i.guild ? i.guild.id === guildID : false) : true) && i.type === 'text' ? (i.permissionsFor(client.user.id).has('READ_MESSAGES') && i.permissionsFor(client.user.id).has('READ_MESSAGE_HISTORY')) : true).filter(i => (i.type === 'text' || i.type === 'dm' || i.type === 'group')).map(channel => {
      console.log('Starting archive for:', channel.id, channel.name ? channel.name : '')
      // Initializing channel specific objects.
      object[channel.id] = {
        c: {
          n: channel.name,
          i: channel.id,
          to: channel.topic ? channel.topic : undefined
        },
        g: channel.guild ? {
          n: channel.guild.name,
          i: channel.guild.id
        } : undefined,
        r: {},
        u: {},
        m: []
      }
      if (!counter[channel.id]) {
        counter[channel.id] = {
          nextCount: settings.messagesEveryFile,
          count: 0,
          atSplit: 0,
          lastMsgId: null
        }
      }
      return fetchMore(channel, null, settings.fullArchive ? null : counter[channel.id].lastMsgId)
    })
    ).then(g => {
      g = g.filter(function (e) { return e }) // Filter empties.
      let gs = g.filter(g => !!g.id)
      if (gs.length > 0) {
        let finished = []
        gs.forEach(guildOrChannel => finished.push(false))
        gs.forEach((guildOrChannel, index, array) => {
          if (!fs.existsSync(path.join(__dirname, 'archive', `${guildOrChannel.name ? `${guildOrChannel.name}_${guildOrChannel.id}` : `${guildOrChannel.recipient.username}_${guildOrChannel.id}`}`))) {
            console.log(`Creating archive directory for ${guildOrChannel.name ? `Guild / GroupDMChannel ${guildOrChannel.name}_${guildOrChannel.id}` : `${guildOrChannel.recipient.username}_${guildOrChannel.id}`}.`)
            fs.mkdirSync(path.join(__dirname, 'archive', `${guildOrChannel.name ? `${guildOrChannel.name}_${guildOrChannel.id}` : `${guildOrChannel.recipient.username}_${guildOrChannel.id}`}`))
          }
          let guildDetails
          if (guildOrChannel.channels && guildOrChannel.roles) {
            let guild = guildOrChannel
            console.log(`Creating guild details file for ${guild.name} ${guild.id}...`)
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
            guildDetails = {
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
                ai: guild.applicationID,
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
                s: new Date(date).toString()
              },
              _by: {
                n: guild.me.user.username,
                i: guild.me.user.id,
                nn: guild.me.displayName,
                tg: guild.me.user.tag,
                u: guild.me.user.displayAvatarURL,
                b: guild.me.user.bot
              },
              _app: 'S.A.R.A.H. app by KararTY & Tonkku107 <https://github.com/kararty/serverautorecordarchiverheroine>',
              _disclaimer: 'PLEASE NOTE THIS ARCHIVE MAY, AND CAN, CONTAIN ERRONEOUS AND/OR MODIFIED/EDITED INFORMATION.'
            /* KararTY's note: It is on the person taking the archive to prove that their archive doesn't contain any modified/edited information.
            This/These script(s), and its coder(s), is/are not responsible for any erroneous and/or modified/edited information in archives. */
            }
          } else {
            let channel = guildOrChannel
            let nicks
            if (channel.nicks) {
              nicks = {}
              channel.nicks.map(recipient => {
                console.log(recipient)
                nicks[recipient[0]] = recipient[1]
              })
            }
            guildDetails = {
              n: channel.name,
              i: channel.id,
              u: channel.iconURL ? channel.iconURL : undefined,
              m: channel.recipients ? channel.recipients.size : undefined,
              mn: nicks,
              t: channel.createdTimestamp,
              o: channel.owner ? {
                n: channel.owner.username,
                i: channel.owner.id,
                ai: channel.applicationID,
                nn: channel.owner.nickname ? channel.owner.nickname : undefined,
                tg: channel.owner.tag,
                u: channel.owner.displayAvatarURL
              } : {
                n: channel.recipient.username,
                i: channel.recipient.id,
                tg: channel.recipient.tag,
                u: channel.recipient.displayAvatarURL
              },
              _at: {
                t: date,
                s: new Date(date).toString()
              },
              _by: channel.me ? {
                n: channel.me.user.username,
                i: channel.me.user.id,
                nn: channel.me.displayName,
                tg: channel.me.user.tag,
                u: channel.me.user.displayAvatarURL,
                b: channel.me.user.bot
              } : {
                n: client.user.username,
                i: client.user.id,
                tg: client.user.tag,
                u: client.user.displayAvatarURL,
                b: client.user.bot
              },
              _app: 'S.A.R.A.H. app by KararTY & Tonkku107 <https://github.com/kararty/serverautorecordarchiverheroine>',
              _disclaimer: 'PLEASE NOTE THIS ARCHIVE MAY, AND CAN, CONTAIN ERRONEOUS AND/OR MODIFIED/EDITED INFORMATION.'
            }
          }
          if (guildDetails) {
            if (!settings.formatOutput.mentionWhoArchived) {
              delete guildDetails._archivedBy
              delete guildDetails._archivedAt.string // Timezones are a potentially identifiable personal information.
            }
            // Create the guild info file
            fs.writeFileSync(path.join(__dirname, 'temp', guildOrChannel.id, `[GUILD_INFO]${guildOrChannel.name ? `${guildOrChannel.name}(${guildOrChannel.id})` : `${guildOrChannel.recipient.username}(${guildOrChannel.id})`}.json`), JSON.stringify(guildDetails, null, pretty))
          }
          // Create counter file.
          fs.writeFile(path.join(__dirname, '_SARAH_doNotDelete_counter.json'), JSON.stringify(counter), (err) => {
            if (err) throw err
            fs.existsSync(path.join(__dirname, '_SARAH_doNotDelete_counter.json')) ? debug('DEBUG-ONLY: Rewriting counter (_SARAH_doNotDelete_counter.json) file.') : console.log('Writing counter file. Note: Do not delete this counter (_SARAH_doNotDelete_counter.json) file.')
          })
          // Finally ZIP archive and finalize.
          debug('DEBUG-ONLY: Starting compression! Please wait, this may take time.')
          let output = fs.createWriteStream(path.join(__dirname, 'archive', `${guildOrChannel.name ? `${guildOrChannel.name}_${guildOrChannel.id}` : `${guildOrChannel.recipient.username}_${guildOrChannel.id}`}`, `archive_${guildOrChannel.name ? `${guildOrChannel.name}(${guildOrChannel.id})` : `${guildOrChannel.recipient.username}(${guildOrChannel.id})`}_${date}.zip`))
          output.on('close', () => {
            console.log('Finished archiving!', new Date().toString())
            finished[index] = true
            debug(`DEBUG-ONLY: ${finished.filter(i => i === true).length} / ${finished.length}`)
            if (!finished.includes(false)) {
              console.log('Finalizing...')
              if (!settings.auto) {
                client.destroy()
                process.exit(0)
              }
              timer()
            }
          })
          // TODO: Any memory leaks if this is put here?
          let archiver = require('archiver')
          let archive = archiver('zip')
          archive.pipe(output)
          archive.glob('**/*', { cwd: path.join(__dirname, 'temp', guildOrChannel.id), src: ['**/*'], expand: true })
          archive.finalize((err, bytes) => {
            if (err) throw err
            // #Not working# if (settings.debug) console.log('Finished compressing! Total bytes', bytes, '\nNot done yet! Please wait...')
          })
        })
      } else {
        console.log('Nothing to archive this time!', new Date().toString())
        if (!settings.auto) process.exit(0)
        timer()
      }
    })
  }

  function timer () {
    console.log('Next archive at', parser.parseExpression(settings.CRON).next().toString())
    setTimeout(() => {
      date = Date.now()
      console.log('\n', 'Starting...', new Date(date).toString())
      cleanTempDir()
      run()
    }, new Date(parser.parseExpression(settings.CRON).next()) - Date.now())
  }

  const fetchMore = (channel, before, after) => {
    return new Promise((resolve, reject) => {
      channel.fetchMessages({limit: 100, before: before, after: after}).then(msg => {
        if (msg.size > 0) {
          let msgLast = msg.last()
          let msgFirst = msg.first()
          msg.forEach(msg => {
            if (!msg.system) {
              // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
              let attachments
              if (msg.attachments.size > 0) {
                attachments = []
                msg.attachments.forEach(attachment => {
                  attachments.push({n: attachment.filename, u: attachment.url})
                })
              }
              let embeds
              if (msg.embeds.length > 0) {
                embeds = []
                msg.embeds.forEach(embed => {
                  let fields
                  if (embed.fields.length > 0) {
                    fields = []
                    embed.fields.forEach(field => {
                      fields.push({
                        l: field.inline,
                        n: field.name,
                        v: field.value
                      })
                    })
                  }
                  embeds.push({
                    a: embed.author ? { n: embed.author.name, u: embed.author.url, a: embed.author.iconURL } : undefined,
                    c: embed.color ? embed.hexColor : undefined,
                    d: embed.description,
                    f: fields,
                    fo: embed.footer ? { u: embed.footer.proxyIconURL, v: embed.footer.text } : undefined,
                    i: embed.image ? embed.image.proxyURL : undefined,
                    p: embed.provider ? { n: embed.provider.name, u: embed.provider.url ? embed.provider.url : undefined } : undefined,
                    th: embed.thumbnail ? embed.thumbnail.proxyURL : undefined,
                    t: embed.createdTimestamp,
                    ti: embed.title,
                    ty: embed.type === 'rich' ? undefined : embed.type,
                    v: embed.video ? embed.video.url : undefined
                  })
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
              if (msg.editedTimestamp && msg.edits.length > 0) {
                edits = []
                msg.edits.forEach((element) => {
                  edits.push({[element.editedTimestamp]: element.content})
                })
              }
              */
              object[channel.id].m.push({
                i: msg.id,
                u: msg.author.id,
                c: {
                  m: msg.content,
                  a: attachments,
                  e: embeds
                },
                t: msg.createdTimestamp,
                p: msg.pinned ? true : undefined,
                e: msg.editedTimestamp ? msg.editedTimestamp : undefined,
                n: msg.nonce, // Might be a completely useless field.
                s: msg.system ? true : undefined,
                ty: msg.type === 'DEFAULT' ? undefined : msg.type,
                ts: msg.tts ? true : undefined,
                es: edits
              })
              counter[channel.id].count++
              if (counter[channel.id].lastMsgId ? (Number(msg.id) > Number(counter[channel.id].lastMsgId)) : true) counter[channel.id].lastMsgId = msg.id
            }
          })
          debug(`DEBUG-ONLY: ${counter[channel.id].count}\t File ${counter[channel.id].atSplit + 1} for\t ${channel.name ? channel.name : channel.id}`)
          if (counter[channel.id].count >= counter[channel.id].nextCount) {
            counter[channel.id].nextCount += settings.messagesEveryFile
            counter[channel.id].atSplit++
            debug('DEBUG ONLY: Split', counter[channel.id].atSplit, 'for channel', channel.id, '& next split at', counter[channel.id].nextCount)
            if (!fs.existsSync(path.join(__dirname, 'temp', channel.guild ? channel.guild.id : channel.id))) {
              console.log(`Creating temp directory for ${channel.guild ? 'guild ' + channel.guild.id : channel.id}.`)
              fs.mkdirSync(path.join(__dirname, 'temp', channel.guild ? channel.guild.id : channel.id))
            }
            fs.writeFile(path.join(__dirname, 'temp', channel.guild ? channel.guild.id : channel.id, `[CHANNEL]${channel.guild ? `${channel.name}${channel.nsfw ? '[NSFW]' : ''}` : ''}(${channel.id})_${counter[channel.id].atSplit}.json`), JSON.stringify(object[channel.id], null, pretty), (err) => {
              if (err) throw err
              console.log('Saved split for channel', channel.id, 'at', counter[channel.id].count)
              object[channel.id] = {
                c: {
                  n: channel.name,
                  i: channel.id,
                  to: channel.topic ? channel.topic : undefined
                },
                g: channel.guild ? {
                  n: channel.guild.name,
                  i: channel.guild.id
                } : undefined,
                r: {},
                u: {},
                m: []
              } // Reset
              fetchMore(channel, after ? null : msgLast.id, after ? msgFirst.id : null).then(resolve, reject)
            })
          } else fetchMore(channel, after ? null : msgLast.id, after ? msgFirst.id : null).then(resolve, reject)
        } else {
          if (object[channel.id].m.length === 0 && deleted[channel.id].length === 0) {
            debug('DEBUG-ONLY: No new messages in', channel.id)
            return resolve(null)
          }
          counter[channel.id].atSplit++
          counter[channel.id].count = 0 // Reset
          counter[channel.id].nextCount = settings.messagesEveryFile // Reset
          // If any messages have been deleted between now and last archive while script was watching, output it into file.
          if (settings.auto && deleted[channel.id].length > 0) {
            object[channel.id].d = deleted[channel.id]
            deleted[channel.id] = [] // Reset
          }
          if (!fs.existsSync(path.join(__dirname, 'temp', channel.guild ? channel.guild.id : channel.id))) {
            console.log(`Creating temp directory for ${channel.guild ? 'guild ' + channel.guild.id : channel.id}.`)
            fs.mkdirSync(path.join(__dirname, 'temp', channel.guild ? channel.guild.id : channel.id))
          }
          fs.writeFile(path.join(__dirname, 'temp', channel.guild ? channel.guild.id : channel.id, `[CHANNEL]${channel.guild ? `${channel.name}${channel.nsfw ? '[NSFW]' : ''}` : ''}(${channel.id})_${counter[channel.id].atSplit}${(object[channel.id].m.length === 0 && object[channel.id].d.length > 0) ? '_deletionOnly.json' : '.json'}`), JSON.stringify(object[channel.id], null, pretty), (err) => {
            if (err) throw err
            console.log('Finished:', channel.id)
            object[channel.id] = {
              c: {
                n: channel.name,
                i: channel.id,
                to: channel.topic ? channel.topic : undefined
              },
              g: channel.guild ? {
                n: channel.guild.name,
                i: channel.guild.id
              } : undefined,
              r: {},
              u: {},
              m: []
            } // Reset
            resolve(channel.guild ? channel.guild : channel)
          })
        }
      })
    })
  }

  function saveDeletedMessage (msg) {
    debug('DEBUG-ONLY: messageDelete: Do we keep track?', settings.channels.length > 0 ? settings.channels.includes(msg.channel.id) : (guildID ? (guildID === msg.guild.id) : true), 'Calculation:', settings.channels.length > 0, settings.channels.includes(msg.channel.id), (guildID ? (guildID === msg.guild.id) : true))
    if (settings.channels.length > 0 ? settings.channels.includes(msg.channel.id) : (guildID ? (guildID === msg.guild.id) : true)) {
      debug('DEBUG-ONLY: Message deleted in', msg.channel.id)
      let attachments
      if (msg.attachments.size > 0) {
        attachments = []
        msg.attachments.forEach(attachment => {
          attachments.push({n: attachment.filename, u: attachment.url})
        })
      }
      let edits
      // Client has to be there before edit happens?
      // if (msg.editedTimestamp && msg.edits.length > 0) {
      //   edits = []
      //   msg.edits.forEach((element) => {
      //     edits.push({t: element.editedTimestamp, m: element.content})
      //   })
      // }
      let embeds
      if (msg.embeds.length > 0) {
        embeds = []
        msg.embeds.forEach(embed => {
          let fields
          if (embed.fields.length > 0) {
            fields = []
            embed.fields.forEach(field => {
              fields.push({
                l: field.inline,
                n: field.name,
                v: field.value
              })
            })
          }
          embeds.push({
            a: embed.author ? { n: embed.author.name, u: embed.author.url, a: embed.author.iconURL } : undefined,
            c: embed.color ? embed.hexColor : undefined,
            d: embed.description,
            f: fields,
            fo: embed.footer ? { u: embed.footer.proxyIconURL, v: embed.footer.text } : undefined,
            i: embed.image ? embed.image.proxyURL : undefined,
            p: embed.provider ? { n: embed.provider.name, u: embed.provider.url ? embed.provider.url : undefined } : undefined,
            th: embed.thumbnail ? embed.thumbnail.proxyURL : undefined,
            t: embed.createdTimestamp,
            ti: embed.title,
            ty: embed.type === 'rich' ? undefined : embed.type,
            v: embed.video ? embed.video.url : undefined
          })
        })
      }
      deleted[msg.channel.id].push({
        i: msg.id,
        u: msg.author.id,
        c: {
          m: msg.content,
          a: attachments,
          e: embeds
        },
        t: msg.createdTimestamp,
        p: msg.pinned ? true : undefined,
        e: msg.editedTimestamp ? msg.editedTimestamp : undefined,
        n: msg.nonce, // Might be a completely useless field.
        s: msg.system ? true : undefined,
        ty: msg.type === 'DEFAULT' ? undefined : msg.type,
        ts: msg.tts ? true : undefined,
        es: edits
      })
    }
  }
  // Message deletion
  client.on('messageDeleteBulk', msgs => {
    if (settings.auto) {
      msgs.forEach(msg => saveDeletedMessage(msg))
    }
  }).on('messageDelete', msg => {
    if (settings.auto) {
      saveDeletedMessage(msg)
    }
  })

  client.on('reconnecting', () => {
    console.log('Reconnecting to Discord...')
    disconnected = true
  }).on('resume', () => {
    console.log('Reconnected to Discord. All functional.')
    disconnected = false
  }).on('disconnect', () => {
    throw new Error("Couldn't connect to Discord after multiple retries. Check your connection and relaunch S.A.R.A.H.")
  }).once('ready', () => {
    // Setup for deleted messages, functionality will only work if 'auto' is true.
    client.channels.filter(i => i.type === 'text' ? (i.permissionsFor(client.user.id).has('READ_MESSAGES') && i.permissionsFor(client.user.id).has('READ_MESSAGE_HISTORY')) : true)
      .filter(i => (i.type === 'text' || i.type === 'dm' || i.type === 'group')).forEach(channel => {
        if (guildID ? channel.guild.id === guildID : true) {
          if (!deleted[channel.id]) deleted[channel.id] = []
          if (deleted[channel.id]) debug(`DEBUG-ONLY: Setting up in-memory deletion array for ${channel.id} - ${channel.type}`)
        }
      })

    console.log('Logged into Discord.')
    if (settings.auto) {
      console.log('Started automation.')
      timer()
    } else {
      console.log('Running one-timer...')
      cleanTempDir()
      run()
    }
  }).login(auth)
}
