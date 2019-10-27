/**
 * ARCHIVE
 * Where (most) I/O work happens.
 */
'use strict'

async function checkIfExistsOrCreate ({ fs, path }, ...pathToFile) {
  if (!fs.existsSync(path.join(pathToFile.join('/')))) {
    fs.mkdirSync(path.join(pathToFile.join('/')))
    return Promise.resolve('created')
  } else return Promise.resolve('exists')
}

async function purgeAndCreate ({ fs, path, rimraf }, ...pathToFile) {
  return new Promise((resolve) => {
    rimraf(path.join(pathToFile.join('/')), () => {
      fs.mkdirSync(path.join(pathToFile.join('/')))
      return resolve()
    })
  })
}

async function downloadGuildEmoji (object, { emoji, emojisInGuild, id }, { fetch, fs, path, log, settings, ui }) {
  try {
    const res = await fetch(emoji.url)
    if (res.ok) {
      const type = res.headers.get('content-type').split('/')[1].toLowerCase()
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))) {
        // Create 'Downloads' directory.
        log({ type: 'debug', message: `Creating Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))
      }
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Guild'))) {
        // Create 'Channels' directory in 'Downloads' directory.
        log({ type: 'debug', message: `Creating Guild directory in Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Guild'))
      }

      const loc = path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Guild', `${String(emojisInGuild.findIndex(i => i.d === emoji.identifier))}.${type}`)
      if (fs.existsSync(loc)) {
        log({ type: 'debug', message: `Skipping ${String(emojisInGuild.findIndex(i => i.d === emoji.identifier))}.${type} emoji, already downloaded. ( ${emoji.url} )` }, settings, ui)
        return Promise.resolve()
      } else {
        const dest = fs.createWriteStream(loc)
        res.body.pipe(dest)
        dest.on('close', () => {
          // Finally resolve.
          log({ message: `Completed download for guild emoji ${emojisInGuild.findIndex(i => i.d === emoji.identifier)}, for ${id}.` }, settings, ui)
          Promise.resolve(true)
        })
      }
    } else return Promise.resolve() // Whatever, couldn't get it.
  } catch (e) {
    if (settings.debug) console.error(e)
    log({ type: 'error', message: `(${e.message}) Failed to download guild emoji ${emojisInGuild.findIndex(i => i.d === emoji.identifier)}, for ${id}.` }, settings, ui)
    return Promise.resolve() // We failed, tell user.
  }
}

async function downloadGuildIcon (object, id, { fetch, fs, path, log, settings, ui }) {
  try {
    const res = await fetch(object[id].g.u)
    if (res.ok) {
      const type = res.headers.get('content-type').split('/')[1].toLowerCase()
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))) {
        // Create 'Downloads' directory.
        log({ type: 'debug', message: `Creating Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))
      }
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Guild'))) {
        // Create 'Channels' directory in 'Downloads' directory.
        log({ type: 'debug', message: `Creating Guild directory in Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Guild'))
      }

      const loc = path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Guild', `icon.${type}`)
      if (fs.existsSync(loc)) {
        log({ type: 'debug', message: `Skipping guild icon.${type}, already downloaded. ( ${object[id].g.u} )` }, settings, ui)
        return Promise.resolve()
      } else {
        const dest = fs.createWriteStream(loc)
        res.body.pipe(dest)
        dest.on('close', () => {
          // Finally resolve.
          log({ message: `Completed download for guild icon for ${id}.` }, settings, ui)
          Promise.resolve(true)
        })
      }
    } else return Promise.resolve() // Whatever, couldn't get it.
  } catch (e) {
    if (settings.debug) console.error(e)
    log({ type: 'error', message: `(${e.message}) Failed to download guild icon for ${id}.` }, settings, ui)
    return Promise.resolve() // We failed, tell user.
  }
}

async function downloadAttachment (object, { attachment, channel, id }, { fetch, fs, path, log, settings, ui }) {
  try {
    const res = await fetch(attachment.url)
    if (res.ok) {
      const type = res.headers.get('content-type').split('/')[0].toLowerCase()
      const extension = res.headers.get('content-type').split('/')[1].toLowerCase()
      const usualTypes = ['image', 'video', 'audio', 'text']
      if ((type === 'image' && object[id].o.downloads.images) || (type === 'audio' && object[id].o.downloads.audios) || (type === 'text' && object[id].o.downloads.texts) || (type === 'video' && object[id].o.downloads.videos) || (usualTypes.indexOf(type) === -1 && object[id].o.downloads.misc)) {
        if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))) {
          // Create 'Downloads' directory.
          log({ type: 'debug', message: `Creating Downloads directory, for ${id}.` }, settings, ui)
          fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))
        }
        if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Channels'))) {
          // Create 'Channels' directory in 'Downloads' directory.
          log({ type: 'debug', message: `Creating Channels directory in Downloads directory, for ${id}.` }, settings, ui)
          fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Channels'))
        }
        if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Channels', String(channel.calculatedPosition || '0')))) {
          // Create directory for channel in 'Channels' directory.
          log({ type: 'debug', message: `Creating directory for channel in Channels directory, for ${id}.` }, settings, ui)
          fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Channels', String(channel.calculatedPosition || '0')))
        }

        const loc = path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Channels', String(channel.calculatedPosition || '0'), `[${attachment.id}]${object[id].o.information.name ? `${attachment.filename}` : `.${extension}`}`)
        if (fs.existsSync(loc)) {
          log({ type: 'debug', message: `Skipping attachment ${attachment.id}, already downloaded. ( ${attachment.url} )` }, settings, ui)
          return Promise.resolve()
        } else {
          const dest = fs.createWriteStream(loc)
          res.body.pipe(dest)
          dest.on('close', () => {
            // Finally resolve.
            log({ message: `Completed download for ${type} ${attachment.id}, for ${id}.` }, settings, ui)
            Promise.resolve(true)
          })
        }
      } else return Promise.resolve() // Not downloading.
    } else return Promise.resolve() // Whatever, couldn't get it.
  } catch (e) {
    if (settings.debug) console.error(e)
    log({ type: 'error', message: `(${e.message}) Failed to download attachment ${attachment.id}, for ${id}.` }, settings, ui)
    return Promise.resolve() // We failed, tell user.
  }
}

async function downloadEmoji (object, { reaction, id }, { fetch, fs, path, log, settings, ui }) {
  try {
    const res = await fetch(reaction.emoji.url || `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.${reaction.emoji.animated ? 'gif' : 'png'}`)
    if (res.ok) {
      const type = res.headers.get('content-type').split('/')[1].toLowerCase()
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))) {
        // Create 'Downloads' directory.
        log({ type: 'debug', message: `Creating Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))
      }
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Emojis'))) {
        // Create 'Channels' directory in 'Downloads' directory.
        log({ type: 'debug', message: `Creating Emojis directory in Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Emojis'))
      }

      const loc = path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Emojis', `${String(object[id].e.findIndex(i => i.d === reaction.emoji.identifier))}.${type}`)
      if (fs.existsSync(loc)) {
        log({ type: 'debug', message: `Skipping emoji ${object[id].e.findIndex(i => i.d === reaction.emoji.identifier)}, already downloaded. ( ${reaction.emoji.url || `https://cdn.discordapp.com/emojis/${reaction.emoji.id}.${reaction.emoji.animated ? 'gif' : 'png'}`} )` }, settings, ui)
        return Promise.resolve()
      } else {
        const dest = fs.createWriteStream(loc)
        res.body.pipe(dest)
        dest.on('close', () => {
          // Finally resolve.
          log({ message: `Completed download for emoji ${object[id].e.findIndex(i => i.d === reaction.emoji.identifier)}, for ${id}.` }, settings, ui)
          Promise.resolve(true)
        })
      }
    } else return Promise.resolve() // Whatever, couldn't get it.
  } catch (e) {
    if (settings.debug) console.error(e)
    log({ type: 'error', message: `(${e.message}) Failed to download emoji ${object[id].e.findIndex(i => i.d === reaction.emoji.identifier)}, for ${id}.` }, settings, ui)
    return Promise.resolve() // We failed, tell user.
  }
}

async function downloadUserAvatar (object, { user, id }, { fetch, fs, path, log, settings, ui }) {
  try {
    const res = await fetch(user.avatarURL || user.displayAvatarURL)
    if (res.ok) {
      const type = res.headers.get('content-type').split('/')[1].toLowerCase()
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))) {
        // Create 'Downloads' directory.
        log({ type: 'debug', message: `Creating Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads'))
      }
      if (!fs.existsSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Users'))) {
        // Create 'Channels' directory in 'Downloads' directory.
        log({ type: 'debug', message: `Creating Users directory in Downloads directory, for ${id}.` }, settings, ui)
        fs.mkdirSync(path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Users'))
      }

      const loc = path.join(settings.archiving.tempDir, 'DARAH_TEMP', object[id].type + id, 'Downloads', 'Users', `${String(object[id].u.findIndex(i => i.i === user.id))}.${type}`)
      if (fs.existsSync(loc)) {
        log({ type: 'debug', message: `Skipping user avatar ${object[id].u.findIndex(i => i.i === user.id)}, already downloaded. ( ${user.avatarURL || user.displayAvatarURL} )` }, settings, ui)
        return Promise.resolve()
      } else {
        const dest = fs.createWriteStream(loc)
        res.body.pipe(dest)
        dest.on('close', () => {
          // Finally resolve.
          log({ message: `Completed download for user avatar ${object[id].u.findIndex(i => i.i === user.id)}, for ${id}.` }, settings, ui)
          Promise.resolve(true)
        })
      }
    } else return Promise.resolve() // Whatever, couldn't get it.
  } catch (e) {
    if (settings.debug) console.error(e)
    log({ type: 'error', message: `(${e.message}) Failed to download user avatar ${object[id].u.findIndex(i => i.i === user.id)}, for ${id}.` }, settings, ui)
    return Promise.resolve() // We failed, tell user.
  }
}

module.exports = {
  downloadGuildEmoji,
  downloadGuildIcon,
  downloadAttachment,
  downloadEmoji,
  downloadUserAvatar,
  checkIfExistsOrCreate,
  purgeAndCreate
}
