/**
 * COMPRESS
 * Compresses archive and appends it to archiving directory.
 */
'use strict'

function writeStream (stream) {
  return new Promise((resolve) => {
    stream.on('close', () => resolve())
  })
}

async function compress ({ object, settings, ui, date, fs, path, log }) {
  const channels = Object.entries(object).map(i => i[0])

  for (let index = 0; index < channels.length; index++) {
    const channel = object[channels[index]]

    log({ type: 'bar', message: 'Compressing next folder...' }, settings, ui)

    if (channel.count.messages > 0) {
      const tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', channel.type + channels[index])
      const output = fs.createWriteStream(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', channel.type + channels[index], `archive_${channel.g.n || ''}${channel.g.i ? '(' + channel.g.i + ')' : ''}${(channel.g.i || channel.g.n) ? '_' : ''}${date}.zip`))

      // TODO: Any memory leaks if I put this here?
      const archiver = require('archiver')
      const archive = archiver('zip', {
        zlib: { level: 9 }
      })

      archive.pipe(output)
      archive.glob('**/*', { cwd: path.join(tempDir), src: ['**/*'], expand: true })
      await archive.finalize()

      await writeStream(output)

      log({ message: `Finished compressing ${channels[index]}, total bytes: ${archive.pointer()}` }, settings, ui)
      log({ type: 'debug', message: `Compressed ${index + 1} / ${channels.length}.` }, settings, ui)
    } else {
      // No messages archived. Don't compress.
      log({ message: `Skipping compression for ${channels[index]}.` }, settings, ui)
      if (index < channels.length) log({ type: 'bar', message: 'Compressing next folder...' }, settings, ui)
    }

    if (fs.existsSync(path.join(__dirname, '..', 'crash_backup.json'))) fs.unlinkSync(path.join(__dirname, '..', 'crash_backup.json'))
    if (fs.existsSync(path.join(__dirname, '..', 'crash_backup_message.json'))) fs.unlinkSync(path.join(__dirname, '..', 'crash_backup_message.json'))
  }

  return Promise.resolve()
}

module.exports = compress
