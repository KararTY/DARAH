/**
 * COMPRESS
 * Compresses archive and appends it to archiving directory.
 */

const fs = require('fs')
const path = require('path')

function compress (object, settings, logging, date) {
  const { green, bold, gray } = logging.colors

  let channels = Object.entries(object).map(i => i[0])
  let index = 0
  function zip (channel) {
    return new Promise((resolve, reject) => {
      if (channel.count.messages > 0) {
        let tempDir = path.join(settings.archiving.tempDir, 'DARAH_TEMP', channel.type + channels[index])
        let output = fs.createWriteStream(path.join(settings.archiving.archiveDir, 'DARAH_ARCHIVES', channel.type + channels[index], `archive_${channel.g.n || ''}${channel.g.i ? '(' + channel.g.i + ')' : ''}${(channel.g.i || channel.g.n) ? '_' : ''}${date}.zip`))
        output.on('close', () => {
          logging.ui.log.write(`${green('Log:')} ${green(bold(`Finished compressing ${channels[index]}, total bytes: ${archive.pointer()}`))}`)
          if (settings.debug) logging.ui.log.write(`${gray('Debug:')} ${gray(bold(`Compressed ${index + 1} / ${channels.length}.`))}`)
          if (index < channels.length - 1) {
            index += 1
            logging.ui.updateBottomBar(`${green(bold(`Compressing next folder...`))}`)
            zip(object[channels[index]]).then(resolve, reject)
          } else resolve()
        })
        // TODO: Any memory leaks if I put this here?
        let archiver = require('archiver')
        let archive = archiver('zip', {
          zlib: { level: 9 }
        })
        archive.pipe(output)
        archive.glob('**/*', { cwd: path.join(tempDir), src: ['**/*'], expand: true })
        archive.finalize()
      } else {
        // No messages archived. Don't compress.
        logging.ui.log.write(`${green('Log:')} ${green(bold(`Skipping compression for ${channels[index]}.`))}`)
        if (index < channels.length - 1) {
          index += 1
          logging.ui.updateBottomBar(`${green(bold(`Compressing next folder...`))}`)
          zip(object[channels[index]]).then(resolve, reject)
        } else resolve()
      }
    })
  }

  return zip(object[channels[index]]) // Start with the first one
}

module.exports = compress
