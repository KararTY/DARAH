/**
 * COMPRESS
 * Compresses archive and appends it to archiving directory.
 */

function compress ({ object, settings, ui, colors, date, fs, path, log }) {
  const channels = Object.entries(object).map(i => i[0])

  let index = 0

  function zip (channel) {
    return new Promise((resolve, reject) => {
      if (channel.count.messages > 0) {
        const tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', channel.type + channels[index])
        const output = fs.createWriteStream(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', channel.type + channels[index], `archive_${channel.g.n || ''}${channel.g.i ? '(' + channel.g.i + ')' : ''}${(channel.g.i || channel.g.n) ? '_' : ''}${date}.zip`))
        output.on('close', () => {
          log({ message: `Finished compressing ${channels[index]}, total bytes: ${archive.pointer()}` }, settings, ui, colors)
          if (settings.debug) log({ message: `Compressed ${index + 1} / ${channels.length}.` }, settings, ui, colors)
          if (index < channels.length - 1) {
            index += 1
            log({ type: 'bar', message: 'Compressing next folder...' }, settings, ui, colors)
            zip(object[channels[index]]).then(resolve, reject)
          } else resolve()
        })
        // TODO: Any memory leaks if I put this here?
        const archiver = require('archiver')
        const archive = archiver('zip', {
          zlib: { level: 9 }
        })
        archive.pipe(output)
        archive.glob('**/*', { cwd: path.join(tempDir), src: ['**/*'], expand: true })
        archive.finalize()
      } else {
        // No messages archived. Don't compress.
        log({ message: `Skipping compression for ${channels[index]}.` }, settings, ui, colors)
        if (index < channels.length - 1) {
          index += 1
          log({ type: 'bar', message: 'Compressing next folder...' }, settings, ui, colors)
          zip(object[channels[index]]).then(resolve, reject)
        } else resolve()
      }
    })
  }

  return zip(object[channels[index]]) // Start with the first one
}

module.exports = compress
