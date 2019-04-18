/**
 * DISCORD
 * Data gathering from Discord happens here.
 */

const compression = require('./compress')

const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const fetch = require('node-fetch')

// Global variables
let deletedMessages = {}
let object = {}
let channelCache = {}

// Load in guilds & user DMs
async function loadInstances (client, settings, logging, date) {
  const { red, green, underline, bold, gray } = logging.colors

  if (!settings) {
    settings = require('../settings.js')
  }

  let index = 0
  let channels = []

  let channelsoToRead = await client.channels

  // Check if DIRECTMESSAGES contains 'ALL'
  if (settings.archiving.DIRECTMESSAGES.findIndex(i => i === 'ALL') > -1) await channels.push(channelsoToRead.filter(i => i.type === 'dm').map(i => i))
  else {
    await channels.push(channelsoToRead.filter(i => i.type === 'dm' &&
      settings.archiving.DIRECTMESSAGES.includes(i.recipient.id) // Filter based on recipient id.
    ).map(i => i))
  }
  // Check if GROUPS contains 'ALL'
  if (settings.archiving.GROUPS.findIndex(i => i === 'ALL') > -1) await channels.push(channelsoToRead.filter(i => i.type === 'group').map(i => i))
  else {
    await channels.push(channelsoToRead.filter(i => i.type === 'group' &&
      settings.archiving.GROUPS.includes(i.ownerID) // Filter based on owner id.
    ).map(i => i))
  }
  // Check if GUILDS contains 'ALL'
  if (settings.archiving.GUILDS.findIndex(i => i === 'ALL') > -1) await channels.push(channelsoToRead.filter(i => i.type === 'text' && i.memberPermissions(client.user.id).has('READ_MESSAGES') && i.memberPermissions(client.user.id).has('READ_MESSAGE_HISTORY')).map(i => i))
  else {
    await channels.push(channelsoToRead.filter(i => i.type === 'text' &&
      settings.archiving.GUILDS.includes(i.guild.id) && // Filter based on guild id & READ permissions.
      i.memberPermissions(client.user.id).has('READ_MESSAGES') &&
      i.memberPermissions(client.user.id).has('READ_MESSAGE_HISTORY')
    ).map(i => i))
  }

  channels = [].concat(...channels).filter(i => i.id)

  logging.ui.log.write(`${green('Log:')} ${gray(bold(`Archiving ${channels.length} channels.`))}`)

  // Purge & Create directory
  let oneTimer = []
  channels.map(channel => {
    if (channel.type === 'text') {
      if (!fs.existsSync(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GUILD]' + channel.guild.id))) {
        fs.mkdirSync(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GUILD]' + channel.guild.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Created archive directory for ${channel.guild.id} guild.`))}`)
      }
      // Create temp directory
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GUILD]' + channel.guild.id))) {
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GUILD]' + channel.guild.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Created cache directory for ${channel.guild.id} guild.`))}`)
      } else if (!oneTimer.includes(channel.guild.id)) {
        rimraf.sync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GUILD]' + channel.guild.id))
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GUILD]' + channel.guild.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Recreated cache directory for ${channel.guild.id} guild.`))}`)
      }
      channelCache[channel.guild.id] = {}
      oneTimer.push(channel.guild.id)
    } else if (channel.type === 'dm') {
      if (!fs.existsSync(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[DM]' + channel.recipient.id))) {
        fs.mkdirSync(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[DM]' + channel.recipient.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Created archive directory for ${channel.recipient.id} dm channel.`))}`)
      }
      // Create temp directory
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[DM]' + channel.recipient.id))) {
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[DM]' + channel.recipient.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Created cache directory for ${channel.recipient.id} dm channel.`))}`)
      } else if (!oneTimer.includes(channel.recipient.id)) {
        rimraf.sync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[DM]' + channel.recipient.id))
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[DM]' + channel.recipient.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Recreated cache directory for ${channel.recipient.id} dm channel.`))}`)
      }
      channelCache[channel.recipient.id] = {}
      oneTimer.push(channel.recipient.id)
    } else if (channel.type === 'group') {
      if (!fs.existsSync(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GROUP]' + channel.id))) {
        fs.mkdirSync(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GROUP]' + channel.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Created archive directory for ${channel.id} group channel.`))}`)
      }
      // Create temp directory
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GROUP]' + channel.id))) {
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GROUP]' + channel.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Created cache directory for ${channel.id} group channel.`))}`)
      } else if (!oneTimer.includes(channel.id)) {
        rimraf.sync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GROUP]' + channel.id))
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', '[GROUP]' + channel.id))
        if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Recreated cache directory for ${channel.id} group channel.`))}`)
      }
      channelCache[channel.id] = {}
      oneTimer.push(channel.id)
    }
  })

  return new Promise((resolve, reject) => {
    // The magic happens here.
    function readChannel (channel) {
      return new Promise((resolve, reject) => {
        let directory // Where to put files.
        let id // Id for object.

        // Keep all messages in this one variable.
        let messages = {
          m: []
        }

        let auxilliaryCounter = 0

        let promises = []

        let channelOptions = settings.archiving.defaultOptions // Custom options

        if (channel.type === 'text') {
          channelCache[channel.guild.id][channel.id] = {
            nextCount: channelOptions.everyMessages,
            count: 0,
            atSplit: 0,
            lastMsgId: null
          }
          directory = path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GUILD]' + channel.guild.id)
          if (!settings.archiving.override && fs.existsSync(path.join(directory, 'settings.json'))) {
            channelOptions = require(path.join(directory, 'settings.json'))
            if (!channelOptions.fullArchive) channelCache[channel.guild.id][channel.id] = require(path.join(directory, 'cache.json'))[channel.id]
          }
          id = channel.guild.id

          if (!object[id]) {
            object[id] = {
              ca: {},
              c: [],
              r: [],
              g: {},
              e: [],
              u: [],
              o: channelOptions,
              directory,
              type: '[GUILD]'
            }
            if (channelOptions.channels.voice) {
              channel.guild.channels.filter(i => i.type === 'voice').map(channel => {
                let permissionOverwrites = []
                if (channel.permissionOverwrites) {
                  channel.permissionOverwrites.forEach(overwrite => {
                    permissionOverwrites.push({
                      i: overwrite.id,
                      ty: overwrite.type
                    })
                  })
                }
                object[id].c.push({
                  i: channelOptions.channels.id ? channel.id : undefined,
                  n: channel.name || channel.owner.username || channel.recipient.username || undefined,
                  ty: channel.type || undefined,
                  po: channel.calculatedPosition || undefined,
                  t: channel.createdTimestamp || undefined,
                  bit: channel.bitrate || undefined, // Voice channel bitrate.
                  lim: channel.limit === 0 ? undefined : channel.limit,
                  pa: channel.parent ? { n: channel.parent.name, i: channel.parent.id } : undefined,
                  p: permissionOverwrites.length > 0 ? permissionOverwrites : undefined
                })
              })
            }
            channel.guild.channels.filter(i => i.type === 'text').map(channel => {
              object[id].c.push({
                i: channel.id,
                n: channelOptions.channels.name ? channel.name : undefined,
                ty: channel.type || undefined,
                po: channel.calculatedPosition || 0,
                to: channelOptions.channels.topic ? (channel.topic || undefined) : undefined,
                t: channel.createdTimestamp || undefined,
                pa: channel.parent ? { n: channel.parent.name, i: channel.parent.id } : undefined
              })
            })

            let guild = channel.guild

            let emojisInGuild = []
            if (channelOptions.information.emojis) {
              guild.emojis.forEach(item => {
                let availableForRoles = []
                if (channelOptions.information.roles) {
                  item.roles.forEach(roles => {
                    availableForRoles.push({
                      n: roles.name,
                      i: roles.id
                    })
                  })
                }
                emojisInGuild.push({
                  n: item.name,
                  i: item.id,
                  d: item.identifier,
                  c: item.requiresColons,
                  u: item.url,
                  a: item.animated,
                  t: item.createdTimestamp,
                  m: item.managed,
                  r: availableForRoles.length > 0 ? availableForRoles : undefined
                })
                if (channelOptions.downloads.emojis && item.url) {
                  promises.push(new Promise((resolve, reject) => {
                    let r = item
                    let o = emojisInGuild
                    let i = id
                    fetch(r.url).then(res => {
                      if (res.ok) {
                        let type = res.headers.get('content-type').split('/')[1].toLowerCase()
                        if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))) {
                          // Create 'Downloads' directory.
                          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Downloads directory, for ${i}.`))}`)
                          fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))
                        }
                        if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Guild'))) {
                          // Create 'Channels' directory in 'Downloads' directory.
                          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Guild directory in Downloads directory, for ${i}.`))}`)
                          fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Guild'))
                        }

                        const dest = fs.createWriteStream(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Guild', `${String(o.findIndex(i => i.d === r.identifier))}.${type}`))
                        res.body.pipe(dest)
                        dest.on('close', () => {
                          // Finally resolve.
                          logging.ui.log.write(`${green('Log:')} ${green(bold(`Completed download for guild emoji ${o.findIndex(i => i.d === r.identifier)}, for ${i}.`))}`)
                          resolve()
                        })
                      } else resolve() // Whatever, couldn't get it.
                    }).catch(e => {
                      if (settings.debug) console.error(e)
                      logging.ui.log.write(`${red('Error:')} ${red(bold(`(${e.message}) Failed to download guild emoji ${o.findIndex(i => i.d === r.identifier)}, for ${i}.`))}`)
                      resolve() // We failed, tell user.
                    })
                  }))
                }
              })
            }

            object[id].g = {
              n: channelOptions.information.name ? guild.name : undefined,
              i: channelOptions.information.id ? guild.id : undefined,
              a: channelOptions.information.name ? guild.nameAcronym : undefined,
              u: channelOptions.information.icon ? guild.iconURL : undefined,
              l: guild.large,
              m: guild.memberCount,
              t: guild.createdTimestamp,
              af: {
                e: !!guild.afkChannel,
                i: guild.afkChannelId,
                t: guild.afkTimeout
              },
              o: channelOptions.information.owner ? guild.ownerID : undefined,
              re: guild.region,
              s: guild.splashURL,
              e: guild.explicitContentFilter,
              v: guild.verificationLevel,
              ee: guild.embedEnabled,
              em: emojisInGuild.length > 0 ? emojisInGuild : undefined,
              _at: {
                t: date,
                s: new Date(date).toLocaleString('en-GB', { timeZone: 'UTC' })
              },
              _by: channelOptions.output.appendWhoArchived
                ? {
                  n: guild.me.user.username,
                  i: guild.me.user.id,
                  nn: guild.me.displayName,
                  tg: guild.me.user.tag,
                  u: guild.me.user.displayAvatarURL,
                  b: guild.me.user.bot
                } : undefined
            }
            if (channelOptions.downloads.icons && channelOptions.information.icon && object[id].g.u) {
              promises.push(new Promise((resolve, reject) => {
                let i = id
                fetch(object[i].g.u).then(res => {
                  if (res.ok) {
                    let type = res.headers.get('content-type').split('/')[1].toLowerCase()
                    if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))) {
                      // Create 'Downloads' directory.
                      if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Downloads directory, for ${i}.`))}`)
                      fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))
                    }
                    if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Guild'))) {
                      // Create 'Channels' directory in 'Downloads' directory.
                      if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Guild directory in Downloads directory, for ${i}.`))}`)
                      fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Guild'))
                    }

                    const dest = fs.createWriteStream(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Guild', `icon.${type}`))
                    res.body.pipe(dest)
                    dest.on('close', () => {
                      // Finally resolve.
                      logging.ui.log.write(`${green('Log:')} ${green(bold(`Completed download for guild icon for ${i}.`))}`)
                      resolve()
                    })
                  } else resolve() // Whatever, couldn't get it.
                }).catch(e => {
                  if (settings.debug) console.error(e)
                  logging.ui.log.write(`${red('Error:')} ${red(bold(`(${e.message}) Failed to download guild icon for ${i}.`))}`)
                  resolve() // We failed, tell user.
                })
              }))
            }
          }
        } else if (channel.type === 'dm') {
          channelCache[channel.recipient.id][channel.id] = {
            nextCount: channelOptions.everyMessages,
            count: 0,
            atSplit: 0,
            lastMsgId: null
          }
          directory = path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[DM]' + channel.recipient.id)
          if (!settings.archiving.override && fs.existsSync(path.join(directory, 'settings.json'))) {
            channelOptions = require(path.join(directory, 'settings.json'))
            if (!channelOptions.fullArchive) channelCache[channel.recipient.id][channel.id] = require(path.join(directory, 'cache.json'))[channel.id]
          }
          id = channel.recipient.id
          if (!object[id]) {
            object[id] = {
              ca: {},
              c: [],
              r: [],
              g: {},
              e: [],
              u: [],
              o: channelOptions,
              directory,
              type: '[DM]'
            }

            let nicks
            if (channelOptions.members.name && channel.nicks) {
              nicks = {}
              channel.nicks.map(recipient => {
                console.log(recipient)
                nicks[recipient[0]] = recipient[1]
              })
            }

            object[id].g = {
              n: channelOptions.information.name ? channel.recipient.username : undefined,
              i: channelOptions.information.id ? channel.id : undefined,
              u: channel.iconURL ? channel.iconURL : channel.me ? undefined : channel.recipient.displayAvatarURL,
              m: channel.recipients ? channel.recipients.size : undefined,
              mn: nicks,
              t: channel.createdTimestamp,
              o: channel.recipient.id,
              _at: {
                t: date,
                s: new Date(date).toLocaleString('en-GB', { timeZone: 'UTC' })
              },
              _by: channelOptions.output.appendWhoArchived
                ? channel.me
                  ? {
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
                  }
                : undefined
            }
          }
        } else if (channel.type === 'group') {
          channelCache[channel.id][channel.id] = {
            nextCount: channelOptions.everyMessages,
            count: 0,
            atSplit: 0,
            lastMsgId: null
          }
          directory = path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GROUP]' + channel.id)
          if (!settings.archiving.override && fs.existsSync(path.join(directory, 'settings.json'))) {
            channelOptions = require(path.join(directory, 'settings.json'))
            if (!channelOptions.fullArchive) channelCache[channel.id][channel.id] = require(path.join(directory, 'cache.json'))[channel.id]
          }
          id = channel.id
          if (!object[id]) {
            object[id] = {
              ca: {},
              c: [],
              r: [],
              g: {},
              e: [],
              u: [],
              o: channelOptions,
              directory,
              type: '[GROUP]'
            }

            let nicks
            if (channelOptions.members.name && channel.nicks) {
              nicks = {}
              channel.nicks.map(recipient => {
                nicks[recipient[0]] = recipient[1]
              })
            }

            object[id].g = {
              n: channelOptions.information.name ? channel.name : undefined,
              i: channelOptions.information.id ? channel.id : undefined,
              u: channelOptions.information.icon ? channel.iconURL ? channel.iconURL : channel.me ? undefined : channel.recipient.displayAvatarURL : undefined,
              m: channel.recipients ? channel.recipients.size : undefined,
              mn: nicks,
              t: channel.createdTimestamp,
              o: channel.ownerID, // Before appending to file, check options.
              _at: {
                t: date,
                s: new Date(date).toLocaleString('en-GB', { timeZone: 'UTC' })
              },
              _by: channelOptions.output.appendWhoArchived
                ? channel.me
                  ? {
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
                  }
                : undefined
            }
          }
        }
        let permissionOverwrites = []
        if (channel.permissionOverwrites) {
          channel.permissionOverwrites.forEach(overwrite => {
            permissionOverwrites.push({
              i: overwrite.id,
              ty: overwrite.type
            })
          })
        }
        let channelObject = {
          i: channel.id,
          n: channelOptions.channels.name ? (channel.name || (channel.owner ? channel.owner.username : undefined) || channel.recipient.username || undefined) : undefined,
          ty: channel.type || undefined,
          po: channel.calculatedPosition || 0,
          to: channelOptions.channels.topic ? (channel.topic || undefined) : undefined,
          t: channel.createdTimestamp || undefined,
          pa: channel.parent ? { n: channel.parent.name, i: channel.parent.id } : undefined,
          p: permissionOverwrites.length > 0 ? permissionOverwrites : undefined
        }
        if (object[id].c.findIndex(i => i.i === channel.id) > -1) object[id].c[object[id].c.findIndex(i => i.i === channel.id)] = channelObject
        else object[id].c.push(channelObject)

        function fetchMessages (channel, before, after) {
          channel.fetchMessages({ limit: 100, before: before, after: after }).then(msg => {
            if (msg.size > 0) {
              let msgLast = msg.last()
              let msgFirst = msg.first()
              // Loop through every message.
              msg.forEach(msg => {
                if (!msg.system) {
                  auxilliaryCounter++

                  // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
                  let attachments
                  if (channelOptions.messages.attachments && msg.attachments.size > 0) {
                    attachments = []
                    msg.attachments.forEach(attachment => {
                      attachments.push({ i: auxilliaryCounter, n: channelOptions.information.name ? attachment.filename : undefined, u: channelOptions.channels.id ? attachment.url : undefined })
                      if (Object.entries(channelOptions.downloads).map(i => i[1]).filter(Boolean).length > 0) {
                        promises.push(new Promise((resolve, reject) => {
                          attachment.id = auxilliaryCounter
                          let a = attachment
                          let c = channel
                          let i = id
                          fetch(a.url).then(res => {
                            if (res.ok) {
                              let type = res.headers.get('content-type').split('/')[0].toLowerCase()
                              let extension = res.headers.get('content-type').split('/')[1].toLowerCase()
                              let usualTypes = ['image', 'video', 'audio', 'text']
                              if ((type === 'image' && object[i].o.downloads.images) || (type === 'audio' && object[i].o.downloads.audios) || (type === 'text' && object[i].o.downloads.texts) || (type === 'video' && object[i].o.downloads.videos) || (usualTypes.indexOf(type) === -1 && object[i].o.downloads.misc)) {
                                if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))) {
                                  // Create 'Downloads' directory.
                                  if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Downloads directory, for ${i}.`))}`)
                                  fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))
                                }
                                if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Channels'))) {
                                  // Create 'Channels' directory in 'Downloads' directory.
                                  if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Channels directory in Downloads directory, for ${i}.`))}`)
                                  fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Channels'))
                                }
                                if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Channels', String(c.calculatedPosition) || '0'))) {
                                  // Create directory for channel in 'Channels' directory.
                                  if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating directory for channel in Channels directory, for ${i}.`))}`)
                                  fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Channels', String(c.calculatedPosition) || '0'))
                                }

                                const dest = fs.createWriteStream(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Channels', String(c.calculatedPosition) || '0', `[${a.id}]${object[i].o.information.name ? `${a.filename}` : `.${extension}`}`))
                                res.body.pipe(dest)
                                dest.on('close', () => {
                                  // Finally resolve.
                                  logging.ui.log.write(`${green('Log:')} ${green(bold(`Completed download for ${type} ${a.id}, for ${i}.`))}`)
                                  resolve()
                                })
                              } else resolve() // Not downloading.
                            } else resolve() // Whatever, couldn't get it.
                          }).catch(e => {
                            if (settings.debug) console.error(e)
                            logging.ui.log.write(`${red('Error:')} ${red(bold(`(${e.message}) Failed to download attachment ${a.id}, for ${i}.`))}`)
                            resolve() // We failed, tell user.
                          })
                        }))
                      }
                    })
                  }
                  let embeds
                  if (channelOptions.messages.embeds && msg.embeds.length > 0) {
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
                  let reactions
                  if (channelOptions.messages.reactions && msg.reactions.size > 0) {
                    reactions = []
                    msg.reactions.forEach(reaction => {
                      if (object[id].e.findIndex(i => i.d === reaction.emoji.identifier) === -1 || (reaction.emoji.id ? object[id].e.find(e => e.i === reaction.emoji.id).retry : false)) {
                        let emoji = {
                          i: reaction.emoji.id || undefined,
                          d: reaction.emoji.identifier,
                          n: reaction.emoji.name,
                          e: reaction.emoji.toString(),
                          c: reaction.emoji.requiresColons || undefined,
                          a: reaction.emoji.animated ? true : undefined,
                          t: reaction.emoji.createdTimestamp ? reaction.emoji.createdTimestamp : undefined,
                          m: reaction.emoji.managed ? true : undefined,
                          u: channelOptions.information.emojis ? reaction.emoji.url ? reaction.emoji.url : reaction.emoji.id ? `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.${reaction.emoji.animated ? 'gif' : 'png'}` : undefined : undefined
                        }

                        if (object[id].e.find(e => e.i === reaction.emoji.id) ? object[id].e.find(e => e.i === reaction.emoji.id).retry : false) {
                          object[id].e[object[id].e.findIndex(e => e.i === reaction.emoji.id)] = emoji
                        } else object[id].e.push(emoji)

                        if (channelOptions.downloads.emojis && (reaction.emoji.url || reaction.emoji.id)) {
                          promises.push(new Promise((resolve, reject) => {
                            let r = reaction
                            let i = id
                            fetch(r.emoji.url || `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.${reaction.emoji.animated ? 'gif' : 'png'}`).then(res => {
                              if (res.ok) {
                                let type = res.headers.get('content-type').split('/')[1].toLowerCase()
                                if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))) {
                                  // Create 'Downloads' directory.
                                  if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Downloads directory, for ${i}.`))}`)
                                  fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))
                                }
                                if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Emojis'))) {
                                  // Create 'Channels' directory in 'Downloads' directory.
                                  if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Emojis directory in Downloads directory, for ${i}.`))}`)
                                  fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Emojis'))
                                }

                                const dest = fs.createWriteStream(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Emojis', `${String(object[i].e.findIndex(i => i.d === r.emoji.identifier))}.${type}`))
                                res.body.pipe(dest)
                                dest.on('close', () => {
                                  // Finally resolve.
                                  logging.ui.log.write(`${green('Log:')} ${green(bold(`Completed download for emoji ${object[i].e.findIndex(i => i.d === r.emoji.identifier)}, for ${i}.`))}`)
                                  resolve()
                                })
                              } else resolve() // Whatever, couldn't get it.
                            }).catch(e => {
                              if (settings.debug) console.error(e)
                              logging.ui.log.write(`${red('Error:')} ${red(bold(`(${e.message}) Failed to download emoji ${object[i].e.findIndex(i => i.d === r.emoji.identifier)}, for ${i}.`))}`)
                              resolve() // We failed, tell user.
                            })
                          }))
                        }
                      }
                      reactions.push({ c: reaction.count, u: reaction.users.size > 0 ? reaction.users.map(i => i.id) : undefined, d: object[id].e.findIndex(i => i.d === reaction.emoji.identifier) })
                    })
                  }
                  let firstUserMention
                  if ((object[id].u.findIndex(i => i.i === msg.author.id) === -1) || object[id].u.find(i => i.i === msg.author.id).retry) {
                    let roles
                    if (channelOptions.members.roles && msg.member) {
                      roles = []
                      let firstRoleMention
                      msg.member.roles.forEach(role => {
                        if (object[id].r.findIndex(i => i.i === role.id) === -1) {
                          firstRoleMention = {
                            po: role.calculatedPosition,
                            n: role.name,
                            i: role.id,
                            t: role.createdTimestamp,
                            c: role.hexColor,
                            h: role.hoist,
                            m: role.members.size,
                            mg: role.managed,
                            me: role.mentionable,
                            p: role.permissions
                          }
                          object[id].r.push(firstRoleMention)
                        }
                        roles.push(object[id].r.findIndex(i => i.i === role.id))
                      })
                    }

                    firstUserMention = {
                      n: channelOptions.members.name ? msg.author.username : undefined,
                      i: msg.author.id, // Before appending to file, check options.
                      nn: channelOptions.members.name ? msg.member ? (msg.member.nickname ? msg.member.nickname : undefined) : undefined : undefined,
                      tg: channelOptions.members.name ? msg.author.tag : undefined,
                      a: channelOptions.members.icon ? msg.author.displayAvatarURL : msg.author.defaultAvatarURL,
                      b: msg.author.bot,
                      t: channelOptions.members.creationDate ? msg.author.createdTimestamp : undefined,
                      j: channelOptions.members.joinDate ? (msg.member ? msg.member.joinedTimestamp : undefined) : undefined,
                      r: roles
                    }
                    if (object[id].u.find(i => i.i === msg.author.id) ? object[id].u.find(i => i.i === msg.author.id).retry : false) {
                      object[id].u[object[id].u.findIndex(i => i.i === msg.author.id)] = firstUserMention
                    } else object[id].u.push(firstUserMention)

                    if (channelOptions.downloads.icons && channelOptions.members.icon && (msg.author.avatarURL || msg.author.displayAvatarURL)) {
                      promises.push(new Promise((resolve, reject) => {
                        let m = msg.author
                        let i = id
                        fetch(m.avatarURL || msg.author.displayAvatarURL).then(res => {
                          if (res.ok) {
                            let type = res.headers.get('content-type').split('/')[1].toLowerCase()
                            if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))) {
                              // Create 'Downloads' directory.
                              if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Downloads directory, for ${i}.`))}`)
                              fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))
                            }
                            if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Users'))) {
                              // Create 'Channels' directory in 'Downloads' directory.
                              if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Users directory in Downloads directory, for ${i}.`))}`)
                              fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Users'))
                            }

                            const dest = fs.createWriteStream(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Users', `${String(object[i].u.findIndex(i => i.i === m.id))}.${type}`))
                            res.body.pipe(dest)
                            dest.on('close', () => {
                              // Finally resolve.
                              logging.ui.log.write(`${green('Log:')} ${green(bold(`Completed download for user icon ${object[i].u.findIndex(i => i.i === m.id)}, for ${i}.`))}`)
                              resolve()
                            })
                          } else resolve() // Whatever, couldn't get it.
                        }).catch(e => {
                          if (settings.debug) console.error(e)
                          logging.ui.log.write(`${red('Error:')} ${red(bold(`(${e.message}) Failed to download user icon ${object[i].u.findIndex(i => i.i === m.id)}, for ${i}.`))}`)
                          resolve() // We failed, tell user.
                        })
                      }))
                    }
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

                  // Edit message content to replace user ids.
                  if (msg.content.match(/<@!?[0-9]+>/g)) {
                    msg.content.match(/<@!?[0-9]+>/g).forEach(i => {
                      let mID = i.replace(/[^0-9]/g, '')
                      // client.users.get(i.replace(/[^0-9]/g, '')) // TODO
                      let user = object[id].u.findIndex(c => c.i === mID) > -1 ? object[id].u.findIndex(c => c.i === mID) : undefined
                      if (typeof user !== 'number') {
                        firstUserMention = {
                          i: mID,
                          retry: true
                        }
                        object[id].u.push(firstUserMention)

                        let theUser = msg.mentions.users.get(mID)
                        if (theUser) {
                          object[id].u[object[id].u.findIndex(c => c.i === mID)] = {
                            n: channelOptions.members.name ? theUser.username : undefined,
                            i: theUser.id, // Before appending to file, check options.
                            tg: channelOptions.members.name ? theUser.username + '#' + theUser.discriminator : undefined,
                            a: channelOptions.members.icon ? (theUser.displayAvatarURL || `https://cdn.discordapp.com/avatars/${theUser.id}/${theUser.avatar}.png`) : theUser.defaultAvatarURL,
                            b: theUser.bot,
                            t: channelOptions.members.creationDate ? theUser.createdTimestamp : undefined,
                            j: channelOptions.members.joinDate ? (msg.member ? msg.member.joinedTimestamp : undefined) : undefined,
                            retry: true
                          }
                          if (channelOptions.downloads.icons && channelOptions.members.icon && (theUser.avatarURL || theUser.avatar)) {
                            promises.push(new Promise((resolve, reject) => {
                              let m = theUser
                              let i = id
                              fetch(m.avatarURL || `https://cdn.discordapp.com/avatars/${theUser.id}/${theUser.avatar}.png`).then(res => {
                                if (res.ok) {
                                  let type = res.headers.get('content-type').split('/')[1].toLowerCase()
                                  if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))) {
                                    // Create 'Downloads' directory.
                                    if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Downloads directory, for ${i}.`))}`)
                                    fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))
                                  }
                                  if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Users'))) {
                                    // Create 'Channels' directory in 'Downloads' directory.
                                    if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Users directory in Downloads directory, for ${i}.`))}`)
                                    fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Users'))
                                  }

                                  const dest = fs.createWriteStream(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Users', `${String(object[i].u.findIndex(i => i.i === m.id))}.${type}`))
                                  res.body.pipe(dest)
                                  dest.on('close', () => {
                                    // Finally resolve.
                                    logging.ui.log.write(`${green('Log:')} ${green(bold(`Completed download for user icon ${object[i].u.findIndex(i => i.i === m.id)}, for ${i}.`))}`)
                                    resolve()
                                  })
                                } else resolve() // Whatever, couldn't get it.
                              }).catch(e => {
                                if (settings.debug) console.error(e)
                                logging.ui.log.write(`${red('Error:')} ${red(bold(`(${e.message}) Failed to download user icon ${object[i].u.findIndex(i => i.i === m.id)}, for ${i}.`))}`)
                                resolve() // We failed, tell user.
                              })
                            }))
                          }
                        }
                      }
                      msg.content = msg.content.replace(i, `<@${object[id].u.findIndex(c => c.i === mID)}>`)
                    })
                  }
                  // Edit message content to replace channel ids.
                  if (msg.content.match(/<#[0-9]+>/g)) {
                    msg.content.match(/<#[0-9]+>/g).forEach(i => {
                      let mID = i.replace(/[^0-9]/g, '')
                      let channel = object[id].c.findIndex(c => c.i === mID) > -1 ? object[id].c.findIndex(c => c.i === mID) : undefined
                      msg.content = msg.content.replace(i, `<#${channel || 'undefined-channel'}>`)
                    })
                  }
                  // Edit message content to replace emojis.
                  if (msg.content.match(/<a?:[\w]+:[0-9]+>/g)) {
                    msg.content.match(/<a?:[\w]+:[0-9]+>/g).forEach(i => {
                      // Check if animated.
                      let mID = i.split(':')[2].replace(/[^0-9]/g, '')
                      let emoji = object[id].e.findIndex(e => e.i === mID) > -1 ? object[id].e.findIndex(e => e.i === mID) : undefined
                      if (typeof emoji !== 'number') {
                        object[id].e.push({
                          i: mID,
                          d: i.replace('<:', '').replace('>', ''),
                          n: i.match(/:[\w]+:/)[0].replace(/:/g, ''),
                          e: i,
                          c: true,
                          a: i.startsWith('<a:') ? true : undefined,
                          u: channelOptions.information.emojis ? `https://cdn.discordapp.com/emojis/${mID}.${i.startsWith('<a:') ? 'gif' : 'png'}` : undefined,
                          retry: true
                        })

                        let theEmoji = object[id].e[object[id].e.findIndex(e => e.i === mID)]
                        if (channelOptions.downloads.emojis && mID) {
                          promises.push(new Promise((resolve, reject) => {
                            let r = theEmoji
                            let i = id
                            fetch(r.u).then(res => {
                              if (res.ok) {
                                let type = res.headers.get('content-type').split('/')[1].toLowerCase()
                                if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))) {
                                  // Create 'Downloads' directory.
                                  if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Downloads directory, for ${i}.`))}`)
                                  fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads'))
                                }
                                if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Emojis'))) {
                                  // Create 'Channels' directory in 'Downloads' directory.
                                  if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Creating Emojis directory in Downloads directory, for ${i}.`))}`)
                                  fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Emojis'))
                                }

                                const dest = fs.createWriteStream(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[i].type + i, 'Downloads', 'Emojis', `${String(object[i].e.findIndex(e => e.i === mID))}.${type}`))
                                res.body.pipe(dest)
                                dest.on('close', () => {
                                  // Finally resolve.
                                  logging.ui.log.write(`${green('Log:')} ${green(bold(`Completed download for emoji ${object[i].e.findIndex(e => e.i === mID)}, for ${i}.`))}`)
                                  resolve()
                                })
                              } else resolve() // Whatever, couldn't get it.
                            }).catch(e => {
                              if (settings.debug) console.error(e)
                              logging.ui.log.write(`${red('Error:')} ${red(bold(`(${e.message}) Failed to download emoji ${object[i].e.findIndex(e => e.i === mID)}, for ${i}.`))}`)
                              resolve() // We failed, tell user.
                            })
                          }))
                        }
                      }
                      msg.content = msg.content.replace(i, `<:${emoji}:>`)
                    })
                  }

                  messages.m.push({
                    i: channelOptions.messages.id ? msg.id : undefined,
                    u: object[id].u.findIndex(i => i.i === msg.author.id),
                    c: {
                      m: msg.content,
                      a: attachments,
                      e: embeds,
                      r: reactions
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
                  channelCache[id][channel.id].count++
                  if (channelCache[id][channel.id].lastMsgId ? (Number(msg.id) > Number(channelCache[id][channel.id].lastMsgId)) : true) channelCache[id][channel.id].lastMsgId = msg.id
                }
              })
              if (promises.length > 0) logging.ui.updateBottomBar(`${green(bold(`Still downloading files...`))}`)
              Promise.all(promises).then(res => {
                // Check how many messages we've collected so far.
                if (!object[id].count) object[id].count = { messages: 0, downloads: 0 }

                if (channelCache[id][channel.id].count >= channelCache[id][channel.id].nextCount) {
                  channelCache[id][channel.id].nextCount += channelCache[id][channel.id].everyMessages
                  channelCache[id][channel.id].atSplit++

                  object[id].count.messages += messages.m.length
                  object[id].count.downloads += promises.length
                  messages.po = channel.calculatedPosition || 0

                  promises = [] // Clear

                  // Create file.
                  fs.writeFile(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, `[CHANNEL]${channelOptions.channels.name ? (channel.name || channel.recipient.username) : channel.calculatedPosition}(${channel.calculatedPosition})_${channelCache[id][channel.id].atSplit}.json`), JSON.stringify(messages, null, channelOptions.output.formatted ? channelOptions.output.whiteSpace : 0), (err) => {
                    if (err) throw err
                    messages = { m: [] } // RESET

                    logging.ui.log.write(`${green('Log:')} ${green(bold(`Dumping collected data for ${channel.id} in file, currently at split ${channelCache[id][channel.id].atSplit}.`))}`)
                    fetchMessages(channel, after ? null : msgLast.id, after ? msgFirst.id : null)
                  })
                } else {
                  promises = [] // Clear
                  logging.ui.updateBottomBar(`${green(bold(`Reading messages in ${channel.id}, currently at`))} ${underline(channelCache[id][channel.id].count)} ${green(bold(`read messages...`))}`)
                  fetchMessages(channel, after ? null : msgLast.id, after ? msgFirst.id : null)
                }
              })
            } else {
              if (promises.length > 0) logging.ui.updateBottomBar(`${green(bold(`Still downloading files...`))}`)
              Promise.all(promises).then(res => {
                // We finished reading in this channel.
                logging.ui.log.write(`${green('Log:')} ${green(bold(`Finished archiving ${channel.id}.`))}`)

                if (!object[id].count) object[id].count = { messages: 0, downloads: 0 }

                // No messages
                if ((deletedMessages[channel.id] && deletedMessages[channel.id].length > 0) || messages.m.length > 0) {
                  object[id].count.messages += messages.m.length
                  object[id].count.downloads += promises.length
                  messages.po = channel.calculatedPosition || 0

                  // TODO: Save deleted messages too, if we caught any for this channel.
                  if (deletedMessages[channel.id] && deletedMessages[channel.id].length > 0) {
                    messages.d = deletedMessages[channel.id]
                    object[id].count.messages += messages.d.length
                    deletedMessages[channel.id] = [] // RESET
                  }

                  // Only deleted messages existed, and no new messages.
                  if (messages.m.length === 0) delete messages.m

                  channelCache[id][channel.id].atSplit++

                  promises = [] // Clear

                  // Create file.
                  fs.writeFile(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, `[CHANNEL]${channelOptions.channels.name ? (channel.name || channel.recipient.username) : channel.calculatedPosition}(${channel.calculatedPosition})_${channelCache[id][channel.id].atSplit}.json`), JSON.stringify(messages, null, channelOptions.output.formatted ? channelOptions.output.whiteSpace : 0), (err) => {
                    if (err) throw err
                    messages = { m: [] } // RESET
                    // Update cache
                    object[id].ca = channelCache[id]
                    if (index < channels.length - 1) {
                      index += 1

                      logging.ui.updateBottomBar(`${green(bold(`Initializing next channel...`))}`)
                      readChannel(channels[index]).then(resolve, reject)
                    } else resolve()
                  })
                } else {
                  // Update cache
                  object[id].ca = channelCache[id]
                  if (index < channels.length - 1) {
                    promises = [] // Clear
                    index += 1

                    logging.ui.updateBottomBar(`${green(bold(`Initializing next channel...`))}`)
                    readChannel(channels[index]).then(resolve, reject)
                  } else resolve() // If we reached here, that means we've temporarily archived every server.
                }
              })
            }
          })
        }

        // If fullArchive is true, take archive from now to beginning.
        fetchMessages(channel, null, channelOptions.fullArchive ? null : channelCache[id][channel.id].lastMsgId)
      })
    }

    // Do first instance & auxilliary collecting.
    readChannel(channels[index]).then(r => {
      Object.entries(object).forEach((i, index) => {
        let c = i[1]
        if (c.count && c.count.messages > 0) {
          let tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', c.type + i[0])

          // Dump object[string].ca into archive directory.
          fs.writeFileSync(path.join(c.directory, 'cache.json'), JSON.stringify(c.ca, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Updating cache file for ${i[0]}.`))}`)

          if (!settings.archiving.overrule) {
            // Recreate settings file in archive directory.
            fs.writeFileSync(path.join(c.directory, 'settings.json'), JSON.stringify(c.o, null, c.o.output.formatted ? c.o.output.whiteSpace : 1))
            if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Recreating settings file for ${i[0]}.`))}`)
          }

          // Dump object[string].c into file.
          if (!c.o.channels.id) { // Get rid of ID.
            for (let i = 0; i < c.c.length; i++) {
              c.c[i].i = undefined
            }
          }
          fs.writeFileSync(path.join(tempDir, '[INFO]channels.json'), JSON.stringify(c.c, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Appending channels file for ${i[0]}.`))}`)

          // Dump object[string].r into file.
          fs.writeFileSync(path.join(tempDir, '[INFO]roles.json'), JSON.stringify(c.r, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Appending roles file for ${i[0]}.`))}`)

          for (let i = 0; i < c.e.length; i++) {
            if (c.e[i].retry) c.e[i].retry = undefined
          }

          // Dump object[string].e into file.
          fs.writeFileSync(path.join(tempDir, '[INFO]emojis.json'), JSON.stringify(c.e, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Appending emojis file for ${i[0]}.`))}`)

          // Dump object[string].g into file.
          if (!c.o.information.owner) {
            c.g.o = c.c.findIndex(i => c.g.o === i.i)
          }
          c.g._app = 'D.A.R.A.H, formerly S.A.R.A.H, app by KararTY & Tonkku107 <https://github.com/kararty/serverautorecordarchiverheroine>'
          c.g._disclaimer = 'PLEASE NOTE THIS ARCHIVE MAY, AND CAN, CONTAIN ERRONEOUS AND/OR MODIFIED/EDITED INFORMATION.'
          /* KararTY's note: It is on the person taking the archive to prove that their archive doesn't contain any modified/edited information.
          This/These script(s), and its coder(s), is/are not responsible for any erroneous and/or modified/edited information in any of the archives. */
          fs.writeFileSync(path.join(tempDir, `[INFORMATION]${c.o.information.name ? c.g.n : '?'}(${c.o.information.id ? c.g.i : '?'}).json`), JSON.stringify(c.g, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Appending info file for ${i[0]}.`))}`)

          for (let i = 0; i < c.u.length; i++) {
            if (c.u[i].retry) c.u[i].retry = undefined
          }
          if (!c.o.members.id) { // Get rid of ID.
            for (let i = 0; i < c.u.length; i++) {
              c.u[i].i = undefined
            }
          }
          // Dump object[string].u into file.
          fs.writeFileSync(path.join(tempDir, '[INFO]users.json'), JSON.stringify(c.u, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Appending users file for ${i[0]}.`))}`)

          logging.ui.log.write(`${green('Log:')} ${green(bold(`Archived ${c.count.messages} messages & downloaded ${c.count.downloads} files, for ${i[0]}.`))}`)
        } else logging.ui.log.write(`${green('Log:')} ${green(bold(`No (new) messages for ${i[0]}.`))}`)
      })
      logging.ui.updateBottomBar(`${green(bold(`Initializing compression...`))}`)
      compression(object, settings, logging, date).then(resolve, reject)
    })
  })
}

module.exports = loadInstances
