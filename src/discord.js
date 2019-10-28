/**
 * DISCORD
 * Data gathering from Discord happens here.
 */
'use strict'

const compression = require('./compress')

const {
  downloadGuildEmoji,
  downloadGuildIcon,
  downloadAttachment,
  downloadEmoji,
  downloadUserAvatar,
  checkIfExistsOrCreate,
  purgeAndCreate
} = require('./archive')

// Global variables
const deletedMessages = {}
const object = {}
const channelCache = {}

let crashFileManifest = {
  id: null,
  attachments: {},
  emojis: {}
}

let stop = false
let startedStop = false

let messages = {
  m: [],
  id: null
}

const channelTitle = (channel) => channel.type === 'text' ? `guild ${channel.guild.name}, channel` : channel.type === 'dm' ? 'DM, channel' : 'group DM, channel'
const channelName = (channel) => channel.name || (channel.recipient ? channel.recipient.username : channel.recipients.map(user => user.username).join(', '))

// Load in guilds & user DMs
async function loadInstances ({ discord, settings, ui, date, rimraf, fetch, fs, writeFile, path, log, backup, backupMessages }) {
  async function doABackup () {
    startedStop = true
    const crashBackupPath = path.join(__dirname, '..', 'crash_backup.json')

    let previousBackup
    if (fs.existsSync(crashBackupPath)) previousBackup = require(crashBackupPath)

    // Write a backup file for resuming archiving.
    const backup = {
      GUILDS: {},
      GROUPS: {},
      DIRECTMESSAGES: {},
      crashFileManifest: {}
    }

    const guilds = Object.keys(settings.archiving.GUILDS)
    for (let i = 0; i < guilds.length; i++) {
      const guildID = guilds[i]
      backup.GUILDS[guildID] = {}

      for (let ii = 0; ii < settings.archiving.GUILDS[guildID].length; ii++) {
        const channelID = settings.archiving.GUILDS[guildID][ii]
        if (object[guildID] && object[guildID].ca[channelID]) {
          backup.GUILDS[guildID][channelID] = (previousBackup && previousBackup.GUILDS[guildID] && previousBackup.GUILDS[guildID][channelID] && typeof previousBackup.GUILDS[guildID][channelID].count === 'number' && previousBackup.GUILDS[guildID][channelID].count > object[guildID].ca[channelID].count)
            ? previousBackup.GUILDS[guildID][channelID]
            : object[guildID].ca[channelID]
          if (crashFileManifest.id === channelID) backup.crashFileManifest = crashFileManifest
        } else {
          backup.GUILDS[guildID][channelID] = (previousBackup && previousBackup.GUILDS[guildID] && previousBackup.GUILDS[guildID][channelID])
            ? previousBackup.GUILDS[guildID][channelID]
            : { finished: false }
        }
      }

      const tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', `[GUILD]${guildID}`)
      if (fs.existsSync(tempDir)) await writeFile(path.join(tempDir.toString(), 'crash_backup_object.json'), JSON.stringify(object[guildID]))
    }

    for (let index = 0; index < settings.archiving.GROUPS.length; index++) {
      const groupID = settings.archiving.GROUPS[index]
      if (object[groupID]) {
        backup.GROUPS[groupID] = (previousBackup && previousBackup.GROUPS[groupID] && typeof previousBackup.GROUPS[groupID].count === 'number' && previousBackup.GROUPS[groupID].count > object[groupID].ca[groupID].count)
          ? previousBackup.GROUPS[groupID]
          : object[groupID]
      } else {
        backup.GROUPS[groupID] = (previousBackup && previousBackup.GROUPS[groupID])
          ? previousBackup.GROUPS[groupID]
          : { finished: false }
      }

      const tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', `[GROUP]${groupID}`)
      if (fs.existsSync(tempDir)) await writeFile(path.join(tempDir.toString(), 'crash_backup_object.json'), JSON.stringify(object[groupID]))
    }

    for (let index = 0; index < settings.archiving.DIRECTMESSAGES.length; index++) {
      const recipientID = settings.archiving.DIRECTMESSAGES[index]
      if (object[recipientID]) {
        const channelID = Object.keys(object[recipientID].ca)[0]
        backup.DIRECTMESSAGES[recipientID] = (previousBackup && previousBackup.DIRECTMESSAGES[recipientID] && typeof previousBackup.DIRECTMESSAGES[recipientID].count === 'number' && previousBackup.DIRECTMESSAGES[recipientID].count > object[recipientID].ca[channelID].count)
          ? previousBackup.DIRECTMESSAGES[recipientID]
          : object[recipientID]
      } else {
        backup.DIRECTMESSAGES[recipientID] = (previousBackup && previousBackup.DIRECTMESSAGES[recipientID])
          ? previousBackup.DIRECTMESSAGES[recipientID]
          : { finished: false }
      }

      const tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', `[DM]${recipientID}`)
      if (fs.existsSync(tempDir)) await writeFile(path.join(tempDir.toString(), 'crash_backup_object.json'), JSON.stringify(object[recipientID]))
    }

    if (messages.m.length > 0) await writeFile(path.join(__dirname, '..', 'crash_backup_messages.json'), JSON.stringify(messages))
    await writeFile(crashBackupPath, JSON.stringify(backup))
    log({ type: 'error', message: 'ERROR, CREATING CRASH BACKUP. FIX ERROR AND RERUN SCRIPT.' }, settings, ui)
    return Promise.resolve()
  }

  discord.on('error', async (e) => {
    stop = true
    console.log(e)
    if (!startedStop) {
      await doABackup()
      process.exit()
    }
  })

  process.on('SIGINT', function () {
    discord.emit('error', new Error('Received SIGINT'))
  })

  const types = [
    ['guilds', Object.entries(settings.archiving.GUILDS)],
    ['groups', settings.archiving.GROUPS],
    ['dms', settings.archiving.DIRECTMESSAGES]
  ]

  log({ message: `Archiving ${Object.values(settings.archiving.GUILDS).flat().length + types[1][1].length + types[2][1].length} channels.` }, settings, ui)

  for (let i = 0; i < types.length; i++) {
    const type = types[i]
    for (let ii = 0; ii < type[1].length; ii++) {
      const typeArray = type[1][ii]
      let channels = [typeArray]
      if (type[0] === 'guilds') {
        channels = discord.guilds.get(typeArray[0]).channels.filter(c => typeArray[1].indexOf(c.id) > -1).map(c => c.id)
        if (await checkIfExistsOrCreate({ fs, path }, settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GUILD]' + typeArray[0]) === 'created') {
          log({ type: 'debug', message: `Created archive directory for ${typeArray[0]} guild.` }, settings, ui)
        }
        // Create temp directory
        if (await checkIfExistsOrCreate({ fs, path }, settings.archiving.tempDir, 'DARAH_TEMP', '[GUILD]' + typeArray[0]) === 'created') {
          log({ type: 'debug', message: `Created cache directory for ${typeArray[0]} guild.` }, settings, ui)
        } else {
          if (backup && backup.GUILDS[typeArray[0]]) {
            log({ type: 'debug', message: `Skipping purge for ${typeArray[0]} guild, found entry in crash backup.` }, settings, ui)
          } else {
            // Purge & Create directory
            await purgeAndCreate({ fs, path, rimraf }, settings.archiving.tempDir, 'DARAH_TEMP', '[GUILD]' + typeArray[0])
            log({ type: 'debug', message: `Recreated cache directory for ${typeArray[0]} guild.` }, settings, ui)
          }
        }
        channelCache[typeArray[0]] = {}
      }
      for (let iii = 0; iii < channels.length; iii++) {
        let channel
        if (type[0] === 'guilds') channel = discord.guilds.get(typeArray[0]).channels.get(channels[iii])
        else {
          channel = discord.channels.get(channels[iii])
          if (type[0] === 'groups') {
            if (await checkIfExistsOrCreate({ fs, path }, settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GROUP]' + channel.id) === 'created') {
              log({ type: 'debug', message: `Created archive directory for ${channel.id} group channel.` }, settings, ui)
            }
            // Create temp directory
            if (await checkIfExistsOrCreate({ fs, path }, settings.archiving.tempDir, 'DARAH_TEMP', '[GROUP]' + channel.id) === 'created') {
              log({ type: 'debug', message: `Created cache directory for ${channel.id} group channel.` }, settings, ui)
            } else {
              if (backup && backup.GROUPS[channel.id]) {
                log({ type: 'debug', message: `Skipping purge for ${channel.id} group, found entry in crash backup.` }, settings, ui)
              } else {
                // Purge & Create directory
                await purgeAndCreate({ fs, path, rimraf }, settings.archiving.tempDir, 'DARAH_TEMP', '[GROUP]' + channel.id)
                log({ type: 'debug', message: `Recreated cache directory for ${channel.id} group channel.` }, settings, ui)
              }
            }
            channelCache[channel.id] = {}
          } else if (type[0] === 'dms') {
            if (await checkIfExistsOrCreate({ fs, path }, settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[DM]' + channel.recipient.id) === 'created') {
              log({ type: 'debug', message: `Created archive directory for ${channel.recipient.id} dm channel.` }, settings, ui)
            }
            // Create temp directory
            if (await checkIfExistsOrCreate({ fs, path }, settings.archiving.tempDir, 'DARAH_TEMP', '[DM]' + channel.recipient.id) === 'created') {
              log({ type: 'debug', message: `Created cache directory for ${channel.recipient.id} dm channel.` }, settings, ui)
            } else {
              if (backup && backup.GUILDS[channel.recipient.id]) {
                log({ type: 'debug', message: `Skipping purge for ${channel.recipient.id} dm, found entry in crash backup.` }, settings, ui)
              } else {
                // Purge & Create directory
                await purgeAndCreate({ fs, path, rimraf }, settings.archiving.tempDir, 'DARAH_TEMP', '[DM]' + channel.recipient.id)
                log({ type: 'debug', message: `Recreated cache directory for ${channel.recipient.id} dm channel.` }, settings, ui)
              }
            }
            channelCache[channel.recipient.id] = {}
          }
        }

        log({ message: `Preparing archiving on ${channelTitle(channel)} ${channelName(channel)}...` }, settings, ui)

        try {
          // Crash backup file manifest.
          if (backup && backup.crashFileManifest && backup.crashFileManifest.id === channel.id) crashFileManifest = backup.crashFileManifest
          else crashFileManifest.id = channel.id

          await start({ channel })
        } catch (e) {
          console.log(e)
          if (!stop) {
            stop = true
            await doABackup()
            process.exit()
          }
          break
        }
      }
      if (stop) break

      // Reset downloads manifest.
      crashFileManifest = {
        id: null,
        attachments: {},
        emojis: {}
      }
    }
    if (stop) break

    log({ type: 'debug', message: `Done with ${type[0]}.` }, settings, ui)
  }

  async function start ({ channel }) {
    // The magic happens here.
    async function readChannel (channel) {
      let directory // Where to put files.
      let id // Id for object.

      // Keep all messages in this one variable.
      messages = {
        m: [],
        id: null
      }

      let auxilliaryCounter = 0

      let promises = []

      let channelOptions = settings.archiving.defaultOptions // Custom options

      if (channel.type === 'text') {
        channelCache[channel.guild.id][channel.id] = {
          nextCount: channelOptions.everyMessages,
          count: 0,
          atSplit: 0,
          lastMsgId: null,
          finished: false
        }
        directory = path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GUILD]' + channel.guild.id)
        if (!settings.archiving.overrule && fs.existsSync(path.join(directory, 'settings.json'))) {
          channelOptions = require(path.join(directory, 'settings.json'))
          if (!channelOptions.fullArchive) channelCache[channel.guild.id][channel.id] = require(path.join(directory, 'cache.json'))[channel.id]
        }

        if (backup && backup.GUILDS[channel.guild.id] && backup.GUILDS[channel.guild.id][channel.id] && typeof backup.GUILDS[channel.guild.id][channel.id].count === 'number') channelCache[channel.guild.id][channel.id] = backup.GUILDS[channel.guild.id][channel.id]

        id = channel.guild.id
        if (!object[id]) {
          object[id] = {
            ca: {},
            c: [],
            p: [],
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
              const permissionOverwrites = []
              if (channel.permissionOverwrites) {
                channel.permissionOverwrites.forEach(overwrite => {
                  permissionOverwrites.push({
                    i: overwrite.id,
                    ty: overwrite.type
                  })
                })
              }
              let parentChannelObject
              if (channel.parent) {
                parentChannelObject = {
                  i: channel.parent.id,
                  n: channelOptions.channels.name ? channel.parent.name : undefined,
                  po: channel.parent.calculatedPosition
                }
                if (object[id].p.findIndex(i => i.i === parentChannelObject.i) > -1) object[id].p[object[id].p.findIndex(i => i.i === parentChannelObject.i)] = parentChannelObject
                else object[id].p.push(parentChannelObject)
              }
              object[id].c.push({
                i: channelOptions.channels.id ? channel.id : undefined,
                n: channelOptions.channels.name ? (channel.name || channel.owner.username || channel.recipient.username || undefined) : undefined,
                ty: channel.type || undefined,
                po: typeof channel.calculatedPosition === 'number' ? channel.calculatedPosition : undefined,
                t: channelOptions.channels.creationDate ? channel.createdTimestamp : undefined,
                bit: channel.bitrate || undefined, // Voice channel bitrate.
                lim: channel.limit === 0 ? undefined : channel.limit,
                pa: channel.parent ? object[id].p.findIndex(i => i.i === parentChannelObject.i) : undefined,
                p: permissionOverwrites.length > 0 ? permissionOverwrites : undefined
              })
            })
          }
          channel.guild.channels.filter(i => i.type === 'text').map(channel => {
            let parentChannelObject
            if (channel.parent) {
              parentChannelObject = {
                i: channel.parent.id,
                n: channelOptions.channels.name ? channel.parent.name : undefined,
                po: channel.parent.calculatedPosition
              }
              if (object[id].p.findIndex(i => i.i === parentChannelObject.i) > -1) object[id].p[object[id].p.findIndex(i => i.i === parentChannelObject.i)] = parentChannelObject
              else object[id].p.push(parentChannelObject)
            }
            object[id].c.push({
              i: channel.id,
              n: channelOptions.channels.name ? channel.name : undefined,
              ty: channel.type || undefined,
              po: typeof channel.calculatedPosition === 'number' ? channel.calculatedPosition : undefined,
              to: channelOptions.channels.topic ? (channel.topic || undefined) : undefined,
              t: channelOptions.channels.creationDate ? channel.createdTimestamp : undefined,
              pa: channel.parent ? object[id].p.findIndex(i => i.i === parentChannelObject.i) : undefined,
              nsfw: channel.nsfw || undefined,
              rlpu: channel.rateLimitPerUser || undefined
            })
          })

          const guild = channel.guild

          const emojisInGuild = []
          if (channelOptions.information.emojis) {
            const emojis = guild.emojis.array()
            for (let index = 0; index < emojis.length; index++) {
              const emoji = emojis[index]
              const availableForRoles = []
              if (channelOptions.information.roles) {
                emoji.roles.forEach(role => {
                  availableForRoles.push({
                    i: channelOptions.information.id ? role.id : undefined,
                    po: role.calculatedPosition
                  })
                })
              }
              emojisInGuild.push({
                n: emoji.name,
                i: emoji.id,
                d: emoji.identifier,
                c: emoji.requiresColons,
                u: emoji.url,
                a: emoji.animated,
                t: emoji.createdTimestamp,
                m: emoji.managed,
                r: availableForRoles.length > 0 ? availableForRoles : undefined
              })

              if (channelOptions.downloads.emojis && emoji.url) promises.push(downloadGuildEmoji(object, { emoji, emojisInGuild, id }, { fetch, fs, path, log, settings, ui }))
            }
          }

          object[id].g = {
            n: channelOptions.information.name ? guild.name : undefined,
            i: channelOptions.information.id ? guild.id : undefined,
            a: channelOptions.information.name ? guild.nameAcronym : undefined,
            u: channelOptions.information.icon ? (guild.iconURL || undefined) : undefined,
            l: guild.large,
            m: guild.memberCount,
            t: channelOptions.information.creationDate ? guild.createdTimestamp : undefined,
            af: {
              e: !!guild.afkChannel,
              i: guild.afkChannelId,
              t: guild.afkTimeout
            },
            o: channelOptions.information.owner ? guild.ownerID : undefined,
            re: guild.region,
            s: channelOptions.information.icon ? guild.splashURL || undefined : undefined,
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
          if (channelOptions.downloads.icons && channelOptions.information.icon && object[id].g.u) promises.push(downloadGuildIcon(object, id, { fetch, fs, path, log, settings, ui }))

          const backupObject = path.join(settings.archiving.tempDir, 'DARAH_TEMP', `[GUILD]${id}`, 'crash_backup_object.json')
          if (fs.existsSync(backupObject)) object[id] = require(backupObject)
        }
      } else if (channel.type === 'dm') {
        channelCache[channel.recipient.id][channel.id] = {
          nextCount: channelOptions.everyMessages,
          count: 0,
          atSplit: 0,
          lastMsgId: null,
          finished: false
        }
        directory = path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[DM]' + channel.recipient.id)
        if (!settings.archiving.overrule && fs.existsSync(path.join(directory, 'settings.json'))) {
          channelOptions = require(path.join(directory, 'settings.json'))
          if (!channelOptions.fullArchive) channelCache[channel.recipient.id][channel.id] = require(path.join(directory, 'cache.json'))[channel.id]
        }

        if (backup && backup.DIRECTMESSAGES[channel.recipient.id] && typeof backup.DIRECTMESSAGES[channel.recipient.id].count === 'number') channelCache[channel.recipient.id][channel.id] = backup.DIRECTMESSAGES[channel.recipient.id]

        id = channel.recipient.id
        if (!object[id]) {
          object[id] = {
            ca: {},
            c: [],
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
              nicks[recipient[0]] = recipient[1]
            })
          }

          object[id].g = {
            n: channelOptions.information.name ? channel.recipient.username : undefined,
            i: channelOptions.information.id ? channel.id : undefined,
            u: channel.iconURL ? channel.iconURL : channel.me ? undefined : channel.recipient.displayAvatarURL,
            m: channel.recipients ? channel.recipients.size : undefined,
            mn: nicks,
            t: channelOptions.information.creationDate ? channel.createdTimestamp : undefined,
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
                  n: discord.user.username,
                  i: discord.user.id,
                  tg: discord.user.tag,
                  u: discord.user.displayAvatarURL,
                  b: discord.user.bot
                }
              : undefined
          }

          const backupObject = path.join(settings.archiving.tempDir, 'DARAH_TEMP', `[DM]${id}`, 'crash_backup_object.json')
          if (fs.existsSync(backupObject)) object[id] = require(backupObject)
        }
      } else if (channel.type === 'group') {
        channelCache[channel.id][channel.id] = {
          nextCount: channelOptions.everyMessages,
          count: 0,
          atSplit: 0,
          lastMsgId: null,
          finished: false
        }
        directory = path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', '[GROUP]' + channel.id)
        if (!settings.archiving.overrule && fs.existsSync(path.join(directory, 'settings.json'))) {
          channelOptions = require(path.join(directory, 'settings.json'))
          if (!channelOptions.fullArchive) channelCache[channel.id][channel.id] = require(path.join(directory, 'cache.json'))[channel.id]
        }

        if (backup && backup.GROUPS[channel.id] && typeof backup.GROUPS[channel.id].count === 'number') channelCache[channel.id][channel.id] = backup.GROUPS[channel.id]

        id = channel.id
        if (!object[id]) {
          object[id] = {
            ca: {},
            c: [],
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
            t: channelOptions.information.creationDate ? channel.createdTimestamp : undefined,
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
                  n: discord.user.username,
                  i: discord.user.id,
                  tg: discord.user.tag,
                  u: discord.user.displayAvatarURL,
                  b: discord.user.bot
                }
              : undefined
          }

          const backupObject = path.join(settings.archiving.tempDir, 'DARAH_TEMP', `[GROUP]${id}`, 'crash_backup_object.json')
          if (fs.existsSync(backupObject)) object[id] = require(backupObject)
        }
      }

      const permissionOverwrites = []
      if (channel.permissionOverwrites) {
        channel.permissionOverwrites.forEach(overwrite => {
          permissionOverwrites.push({
            i: overwrite.id,
            ty: overwrite.type
          })
        })
      }

      let parentChannelObject
      if (channel.parent) {
        parentChannelObject = {
          i: channel.parent.id,
          n: channelOptions.channels.name ? channel.parent.name : undefined,
          po: channel.parent.calculatedPosition
        }
        if (object[id].p.findIndex(i => i.i === parentChannelObject.i) > -1) object[id].p[object[id].p.findIndex(i => i.i === parentChannelObject.i)] = parentChannelObject
        else object[id].p.push(parentChannelObject)
      }

      const channelObject = {
        i: channel.id,
        n: channelOptions.channels.name ? (channel.name || (channel.owner ? channel.owner.username : undefined) || channel.recipient.username || undefined) : undefined,
        ty: channel.type || undefined,
        po: ['[GROUP]', '[DM]'].includes(object[id].type) ? 0 : typeof channel.calculatedPosition === 'number' ? channel.calculatedPosition : undefined,
        to: channelOptions.channels.topic ? (channel.topic || undefined) : undefined,
        t: channelOptions.channels.creationDate ? channel.createdTimestamp : undefined,
        pa: channel.parent ? object[id].p.findIndex(i => i.i === parentChannelObject.i) : undefined,
        p: permissionOverwrites.length > 0 ? permissionOverwrites : undefined,
        nsfw: channel.nsfw || undefined,
        rlpu: channel.rateLimitPerUser || undefined
      }
      if (object[id].c.findIndex(i => i.i === channel.id) > -1) object[id].c[object[id].c.findIndex(i => i.i === channel.id)] = channelObject
      else object[id].c.push(channelObject)

      // Replace relevant text with array position.
      async function messageReplacer (channel, msg) {
        // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
        let attachments
        if (channelOptions.messages.attachments && msg.attachments && msg.attachments.size > 0) {
          attachments = []
          const tempAttachmentsArray = msg.attachments.array()
          for (let ind = 0; ind < tempAttachmentsArray.length; ind++) {
            const attachment = tempAttachmentsArray[ind]
            const attachID = backup && backup.crashFileManifest && backup.crashFileManifest.attachments[msg.id] && backup.crashFileManifest.attachments[msg.id][ind] ? backup.crashFileManifest.attachments[msg.id][ind] : `${auxilliaryCounter}-${attachment.filesize}${attachment.id.substr(-4)}-${ind + 1}`
            attachments.push({ i: attachID, n: channelOptions.information.name ? attachment.filename : undefined, u: channelOptions.channels.id ? attachment.url : undefined })
            if (Object.entries(channelOptions.downloads).map(i => i[1]).filter(Boolean).length > 0) {
              attachment.id = attachID
              if (!crashFileManifest.attachments[msg.id]) crashFileManifest.attachments[msg.id] = []
              if (!crashFileManifest.attachments[msg.id][ind]) crashFileManifest.attachments[msg.id].push(attachment.id)
              promises.push(downloadAttachment(object, { attachment, channel, id }, { fetch, fs, path, log, settings, ui }))
            }
          }
        }

        let embeds
        if (channelOptions.messages.embeds && msg.embeds && msg.embeds.length > 0) {
          embeds = []
          for (let index = 0; index < msg.embeds.length; index++) {
            const embed = msg.embeds[index]
            let fields
            if (embed.fields.length > 0) {
              fields = []
              for (let index = 0; index < embed.fields.length; index++) {
                const field = embed.fields[index]
                const fieldName = field.name ? await messageReplacer(channel, { content: field.name }) : undefined
                const fieldValue = field.value ? await messageReplacer(channel, { content: field.value }) : undefined
                fields.push({
                  l: field.inline || undefined,
                  n: fieldName ? fieldName.msg.content : undefined,
                  v: fieldValue ? fieldValue.msg.content : undefined
                })
              }
            }
            const embedDescription = embed.description ? await messageReplacer(channel, { content: embed.description }) : undefined
            embeds.push({
              a: embed.author ? { n: embed.author.name, u: embed.author.url, a: embed.author.iconURL } : undefined,
              c: embed.color ? embed.hexColor : undefined,
              d: embedDescription ? embedDescription.msg.content : undefined,
              f: fields,
              fo: embed.footer ? { u: embed.footer.proxyIconURL, v: embed.footer.text } : undefined,
              i: embed.image ? embed.image.proxyURL : undefined,
              p: embed.provider ? { n: embed.provider.name, u: embed.provider.url ? embed.provider.url : undefined } : undefined,
              th: embed.thumbnail ? embed.thumbnail.proxyURL : undefined,
              t: embed.timestamp ? new Date(embed.timestamp).getTime() : undefined, // For some reason embed.timestamp returns a string, but should correctly return a number now.
              ti: embed.title || undefined,
              u: embed.url || undefined,
              ty: embed.type === 'rich' ? undefined : embed.type,
              v: embed.video ? embed.video.url : undefined
            })
          }
        }

        let reactions
        if (channelOptions.messages.reactions && msg.reactions && msg.reactions.size > 0) {
          reactions = []
          const reacts = msg.reactions.array()
          for (let index = 0; index < reacts.length; index++) {
            const reaction = reacts[index]
            if (object[id].e.findIndex(i => i.d === reaction.emoji.identifier) === -1 || (reaction.emoji.id ? object[id].e.find(e => e.i === reaction.emoji.id).retry : false)) {
              const emoji = {
                i: reaction.emoji.id || undefined,
                d: reaction.emoji.identifier,
                n: reaction.emoji.name,
                e: reaction.emoji.toString(),
                c: reaction.emoji.requiresColons || undefined,
                a: reaction.emoji.animated ? true : undefined,
                t: channelOptions.information.creationDate ? (reaction.emoji.createdTimestamp ? reaction.emoji.createdTimestamp : undefined) : undefined,
                m: reaction.emoji.managed ? true : undefined,
                u: channelOptions.information.emojis ? reaction.emoji.url ? reaction.emoji.url : reaction.emoji.id ? `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.${reaction.emoji.animated ? 'gif' : 'png'}` : undefined : undefined
              }

              if (object[id].e.find(e => e.i === reaction.emoji.id) ? object[id].e.find(e => e.i === reaction.emoji.id).retry : false) {
                object[id].e[object[id].e.findIndex(e => e.i === reaction.emoji.id)] = emoji
              } else object[id].e.push(emoji)

              if (channelOptions.downloads.emojis && (reaction.emoji.url || reaction.emoji.id)) {
                promises.push(downloadEmoji(object, { reaction, id }, { fetch, fs, path, log, settings, ui }))
              }
            }
            reactions.push({ c: reaction.count, u: reaction.users.size > 0 ? reaction.users.map(i => i.id) : undefined, d: object[id].e.findIndex(i => i.d === reaction.emoji.identifier) })
          }
        }

        let firstUserMention
        if (msg.author && ((object[id].u.findIndex(i => i.i === msg.author.id) === -1) || object[id].u.find(i => i.i === msg.author.id).retry)) {
          let roles
          if (channelOptions.members.roles && msg.member) {
            roles = []
            let firstRoleMention
            msg.member.roles.forEach(role => {
              if (object[id].r.findIndex(i => i.i === role.id) === -1) {
                firstRoleMention = {
                  po: role.calculatedPosition,
                  n: channelOptions.information.name ? role.name : undefined,
                  i: role.id,
                  t: channelOptions.information.creationDate ? role.createdTimestamp : undefined,
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

          if (channelOptions.downloads.icons && channelOptions.members.icon && (msg.author.avatarURL || msg.author.displayAvatarURL) && !object[id].u.find(i => i.i === msg.author.id).retry) promises.push(downloadUserAvatar(object, { user: msg.author, id }, { fetch, fs, path, log, settings, ui }))
        }

        let edits
        /*
        // Doesn't work. Client has to be there before edit happens?
        if (msg.editedTimestamp && msg.edits.length > 0) {
          edits = []
          msg.edits.forEach((element) => {
            edits.push({ [element.editedTimestamp]: element.content })
          })
        }
        */

        // Edit message content to replace user ids.
        if (msg.content.match(/<@!?[0-9]+>/g)) {
          for (let index = 0; index < msg.content.match(/<@!?[0-9]+>/g).length; index++) {
            const i = msg.content.match(/<@!?[0-9]+>/g)[index]
            const mID = i.replace(/[^0-9]/g, '')
            // client.users.get(i.replace(/[^0-9]/g, '')) // TODO
            const user = object[id].u.findIndex(c => c.i === mID) > -1 ? object[id].u.findIndex(c => c.i === mID) : undefined
            if (typeof user !== 'number') {
              firstUserMention = {
                i: mID,
                retry: true
              }
              object[id].u.push(firstUserMention)

              const theUser = msg.mentions ? msg.mentions.users.get(mID) : (discord.users.get(mID) || { id: mID })
              if (theUser) {
                object[id].u[object[id].u.findIndex(c => c.i === mID)] = {
                  n: channelOptions.members.name ? theUser.username : undefined,
                  i: theUser.id, // Before appending to file, check options.
                  tg: channelOptions.members.name ? ((theUser.username && theUser.discriminator) ? (theUser.username + '#' + theUser.discriminator) : undefined) : undefined,
                  a: channelOptions.members.icon ? (theUser.displayAvatarURL || ((theUser.avatar && theUser.id) ? `https://cdn.discordapp.com/avatars/${theUser.id}/${theUser.avatar}.png` : undefined)) : theUser.defaultAvatarURL,
                  b: theUser.bot,
                  t: channelOptions.members.creationDate ? theUser.createdTimestamp : undefined,
                  j: channelOptions.members.joinDate ? (msg.member ? msg.member.joinedTimestamp : undefined) : undefined,
                  retry: true
                }
                if (channelOptions.downloads.icons && channelOptions.members.icon && (theUser.avatarURL || theUser.avatar)) {
                  if (theUser.avatarURL || theUser.displayAvatarURL || theUser.avatar) promises.push(downloadUserAvatar(object, { user: { ...theUser, displayAvatarURL: theUser.displayAvatarURL ? theUser.displayAvatarURL : (!theUser.displayAvatarURL && theUser.avatar) ? `https://cdn.discordapp.com/avatars/${theUser.id}/${theUser.avatar}.png` : undefined }, id }, { fetch, fs, path, log, settings, ui }))
                }
              }
            }
            msg.content = msg.content.replace(i, `<@${typeof object[id].u.findIndex(c => c.i === mID) === 'number' ? object[id].u.findIndex(c => c.i === mID) : 'undefined-user'}>`)
          }
        }

        // Edit message content to replace channel ids.
        if (msg.content.match(/<#[0-9]+>/g)) {
          msg.content.match(/<#[0-9]+>/g).forEach(i => {
            const mID = i.replace(/[^0-9]/g, '')
            const channel = object[id].c.findIndex(c => c.i === mID) > -1 ? object[id].c.findIndex(c => c.i === mID) : undefined
            msg.content = msg.content.replace(i, `<#${typeof channel === 'number' ? channel : 'undefined-channel'}>`)
          })
        }

        // Edit message content to replace emojis.
        const emojisInContent = msg.content.match(/<a?:[\w]+:[0-9]+>/g)
        if (emojisInContent) {
          for (let index = 0; index < emojisInContent.length; index++) {
            const i = emojisInContent[index]
            // Check if animated.
            const mID = i.split(':')[2].replace(/[^0-9]/g, '')
            const emoji = object[id].e.findIndex(e => e.i === mID)
            if (emoji === -1) {
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

              const theEmoji = object[id].e[object[id].e.findIndex(e => e.i === mID)]
              if (channelOptions.downloads.emojis && mID && theEmoji > -1) {
                promises.push(downloadEmoji(object, { reaction: { emoji: { url: theEmoji.u, identifier: theEmoji.d } }, id }, { fetch, fs, path, log, settings, ui }))
              }
            }
            msg.content = msg.content.replace(i, `<:${typeof object[id].e.findIndex(e => e.i === mID) === 'number' ? object[id].e.findIndex(e => e.i === mID) : 'undefined-emoji'}:>`)
          }
        }

        // Edit message content to replace role ids.
        if (msg.content.match(/<@&[0-9]+>/g)) {
          msg.content.match(/<@&[0-9]+>/g).forEach(i => {
            const mID = i.replace(/[^0-9]/g, '')
            let firstRoleMention
            if (object[id].r.findIndex(i => i.i === mID) === -1 && channelOptions.members.roles) {
              const role = channel.guild.roles.get(mID)
              if (role) {
                firstRoleMention = {
                  po: role.calculatedPosition,
                  n: role.name,
                  i: role.id,
                  t: channelOptions.information.creationDate ? role.createdTimestamp : undefined,
                  c: role.hexColor,
                  h: role.hoist,
                  m: role.members.size,
                  mg: role.managed,
                  me: role.mentionable,
                  p: role.permissions
                }
              } else {
                firstRoleMention = {
                  i: mID
                }
              }
              object[id].r.push(firstRoleMention)
            }
            msg.content = msg.content.replace(i, `<&${typeof object[id].r.findIndex(r => r.i === mID) === 'number' ? object[id].r.findIndex(r => r.i === mID) : 'undefined-role'}>`)
          })
        }
        return { attachments, embeds, reactions, firstUserMention, edits, msg }
      }

      async function fetchMessages (channel, before, after) {
        const msgs = await channel.fetchMessages({ limit: 100, before: before, after: after }).then(res => res.size > 0 ? res.array() : [])
        if (msgs.length > 0) {
          if (stop) return Promise.resolve()
          const msgLast = msgs[msgs.length - 1]
          const msgFirst = msgs[0]
          // Loop through every message.
          for (let index = 0; index < msgs.length; index++) {
            const msg = msgs[index]
            if (!msg.system) {
              auxilliaryCounter++

              const editedMessage = await messageReplacer(channel, msg)

              messages.m.push({
                i: channelOptions.messages.id ? msg.id : undefined,
                u: object[id].u.findIndex(i => i.i === msg.author.id),
                c: {
                  m: editedMessage.msg.content,
                  a: editedMessage.attachments,
                  e: editedMessage.embeds,
                  r: editedMessage.reactions
                },
                t: channelOptions.messages.creationDate ? msg.createdTimestamp : undefined,
                p: msg.pinned ? true : undefined,
                e: msg.editedTimestamp ? msg.editedTimestamp : undefined,
                n: msg.nonce, // Might be a completely useless field.
                s: msg.system ? true : undefined,
                ty: msg.type === 'DEFAULT' ? undefined : msg.type,
                ts: msg.tts ? true : undefined,
                es: editedMessage.edits
              })

              channelCache[id][channel.id].count++
              channelCache[id][channel.id].lastMsgId = msg.id
            }
          }

          if (promises.length > 0) log({ type: 'bar', message: 'Still downloading files...' }, settings, ui)

          const res = await Promise.all(promises)

          // Check how many messages we've collected so far.
          if (!object[id].count) object[id].count = { messages: 0, downloads: 0 }

          object[id].count.downloads += res.filter(Boolean).length

          if (channelCache[id][channel.id].count >= channelCache[id][channel.id].nextCount) {
            channelCache[id][channel.id].nextCount += channelOptions.everyMessages
            channelCache[id][channel.id].atSplit++
            object[id].count.messages += messages.m.length

            messages.po = channel.calculatedPosition || 0

            promises = [] // Clear

            // Clear crashMessagesBackup
            if (backupMessages && channel.id === backupMessages.id && fs.existsSync(path.join(__dirname, '..', 'crash_backup_messages.json'))) {
              fs.unlinkSync(path.join(__dirname, '..', 'crash_backup_messages.json'))
              backupMessages = undefined
            }

            // Create file.
            await writeFile(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, `[CHANNEL]${channelOptions.channels.name ? (channel.name || channel.recipient.username) : channel.calculatedPosition}(${channel.calculatedPosition || '0'})_${channelCache[id][channel.id].atSplit}.json`), JSON.stringify(messages, null, channelOptions.output.formatted ? channelOptions.output.whiteSpace : 0))

            messages = { m: [], id: channel.id } // RESET

            log({ message: `Dumping collected data for ${channel.id} in file, currently at split ${channelCache[id][channel.id].atSplit}.` }, settings, ui)
            return fetchMessages(channel, after ? null : msgLast.id, after ? msgFirst.id : null)
          } else {
            promises = [] // Clear
            log({ type: 'bar', message: `Reading messages in ${channel.id}, currently at ${channelCache[id][channel.id].count} read messages...` }, settings, ui)
            return fetchMessages(channel, after ? null : msgLast.id, after ? msgFirst.id : null)
          }
        } else {
          if (promises.length > 0) log({ type: 'bar', message: 'Still downloading files...' }, settings, ui)
          // We finished reading in this channel.
          const res = await Promise.all(promises)
          log({ message: `Finished archiving ${channel.id}.` }, settings, ui)

          if (!object[id].count) object[id].count = { messages: 0, downloads: 0 }

          object[id].count.downloads += res.filter(Boolean).length

          if ((deletedMessages[channel.id] && deletedMessages[channel.id].length > 0) || messages.m.length > 0) {
            object[id].count.messages += messages.m.length

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
            channelCache[id][channel.id].finished = true

            promises = [] // Clear

            // Clear crashMessagesBackup
            if (backupMessages && channel.id === backupMessages.id && fs.existsSync(path.join(__dirname, '..', 'crash_backup_messages.json'))) {
              fs.unlinkSync(path.join(__dirname, '..', 'crash_backup_messages.json'))
              backupMessages = undefined
            }

            // Create file.
            await writeFile(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, `[CHANNEL]${channelOptions.channels.name ? (channel.name || channel.recipient.username) : channel.calculatedPosition}(${channel.calculatedPosition || '0'})_${channelCache[id][channel.id].atSplit}.json`), JSON.stringify(messages, null, channelOptions.output.formatted ? channelOptions.output.whiteSpace : 0))
            messages = { m: [], id: channel.id } // RESET

            // Update cache
            object[id].ca = channelCache[id]

            return Promise.resolve()
          } else {
            // No messages

            // Update cache
            channelCache[id][channel.id].finished = true
            object[id].ca = channelCache[id]

            promises = [] // Clear

            return Promise.resolve() // If we reached here, that means we've temporarily archived every server.
          }
        }
      }

      messages.id = channel.id

      if (backupMessages && backupMessages.id === messages.id) messages = backupMessages

      // If we're recovering from a backup, use last message id.
      const useBackupMsgIDIfExists = (channelCache[id] && channelCache[id][channel.id]) ? channelCache[id][channel.id].lastMsgId : null

      // If fullArchive is true, take archive from now to beginning, otherwise go from then to now.
      const useCacheMsgIDIfAllowed = channelOptions.fullArchive ? null : channelCache[id][channel.id].lastMsgId
      if (!channelCache[id][channel.id].finished) {
        await fetchMessages(channel, useBackupMsgIDIfExists, useBackupMsgIDIfExists ? null : useCacheMsgIDIfAllowed)
      } else {
        log({ message: `Skipping ${channel.id}, already finished.` }, settings, ui)
        return Promise.resolve()
      }
    }

    // Do first instance & auxilliary collecting.
    await readChannel(channel)
  }

  if (stop) return Promise.resolve('error')

  const objects = Object.entries(object)
  for (let index = 0; index < objects.length; index++) {
    const i = objects[index]
    const c = i[1]

    if (c.count && c.count.messages > 0) {
      const tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', c.type + i[0])

      c.g.o = c.o.information.owner ? c.u.findIndex(u => c.g.o === u.i) : undefined

      if (!c.o.channels.id) { // Get rid of ID.
        for (let i = 0; i < c.c.length; i++) {
          c.c[i].i = undefined
        }
        for (let i = 0; i < c.p.length; i++) {
          c.p[i].i = undefined
        }
      }

      if (!c.o.information.id || !c.o.information.name) { // Get rid of ID OR name.
        for (let i = 0; i < c.r.length; i++) {
          if (!c.o.information.id) c.r[i].i = undefined
          if (!c.o.information.name) c.r[i].n = undefined
        }
      }

      for (let i = 0; i < c.e.length; i++) {
        if (c.e[i].retry) c.e[i].retry = undefined
        if (!c.o.information.id) c.e[i].i = undefined
        if (!c.o.information.id) c.e[i].d = undefined
        if (!c.o.information.id) c.e[i].e = undefined
      }

      for (let i = 0; i < c.u.length; i++) {
        if (c.u[i].retry) c.u[i].retry = undefined
      }

      if (!c.o.members.id) { // Get rid of ID.
        for (let i = 0; i < c.u.length; i++) {
          c.u[i].i = undefined
        }
      }

      // Dump object[string].ca into archive directory.
      fs.writeFileSync(path.join(c.directory, 'cache.json'), JSON.stringify(c.ca, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
      log({ type: 'debug', message: `Updating cache file for ${i[0]}.` }, settings, ui)

      if (!settings.archiving.overrule) {
        // Recreate settings file in archive directory.
        fs.writeFileSync(path.join(c.directory, 'settings.json'), JSON.stringify(c.o, null, c.o.output.formatted ? c.o.output.whiteSpace : 1))
        log({ type: 'debug', message: `Recreating settings file for ${i[0]}.` }, settings, ui)
      }

      // Dump object[string].c into file.
      fs.writeFileSync(path.join(tempDir, '[INFO]channels.json'), JSON.stringify({ c: c.c, p: c.p }, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
      log({ type: 'debug', message: `Appending channels file for ${i[0]}.` }, settings, ui)

      // Dump object[string].r into file.
      if ((c.r && c.r.length > 0) || c.r) {
        fs.writeFileSync(path.join(tempDir, '[INFO]roles.json'), JSON.stringify(c.r, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
        log({ type: 'debug', message: `Appending roles file for ${i[0]}.` }, settings, ui)
      }

      // Dump object[string].e into file.
      if ((c.e && c.e.length > 0) || c.e) {
        fs.writeFileSync(path.join(tempDir, '[INFO]emojis.json'), JSON.stringify(c.e, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
        log({ type: 'debug', message: `Appending emojis file for ${i[0]}.` }, settings, ui)
      }

      // Dump object[string].g into file.
      c.g._app = 'D.A.R.A.H, formerly S.A.R.A.H, app by KararTY & Tonkku107 <https://github.com/kararty/discordautorecordarchiverheroine>'
      c.g._disclaimer = 'PLEASE NOTE THIS ARCHIVE MAY, AND CAN, CONTAIN ERRONEOUS AND/OR MODIFIED/EDITED INFORMATION.'
      /* KararTY's note: It is on the person taking the archive to prove that their archive doesn't contain any modified/edited information.
          This/These script(s), and its coder(s), is/are not responsible for any erroneous and/or modified/edited information in any of the archives. */
      fs.writeFileSync(path.join(tempDir, `[INFORMATION]${c.o.information.name ? c.g.n : '-'}(${c.o.information.id ? c.g.i : '-'}).json`), JSON.stringify(c.g, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
      log({ type: 'debug', message: `Appending info file for ${i[0]}.` }, settings, ui)

      // Dump object[string].u into file.
      fs.writeFileSync(path.join(tempDir, '[INFO]users.json'), JSON.stringify(c.u, null, c.o.output.formatted ? c.o.output.whiteSpace : 0))
      log({ type: 'debug', message: `Appending users file for ${i[0]}.` }, settings, ui)

      // Remove backup object.
      if (fs.existsSync(path.join(tempDir.toString(), 'crash_backup_object.json'))) fs.unlinkSync(path.join(tempDir.toString(), 'crash_backup_object.json'))

      log({ message: `Archived ${c.count.messages} messages & downloaded ${c.count.downloads} files, for ${i[0]}.` }, settings, ui)
    } else log({ message: `No (new) messages for ${i[0]}.` }, settings, ui)
  }

  log({ type: 'bar', message: 'Initializing compression...' }, settings, ui)
  await compression({ object, settings, ui, date, fs, path, log })

  return Promise.resolve()
}

module.exports = loadInstances
