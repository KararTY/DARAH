/**
 * Server Auto Record Archiver Heroine
 * MIT License
 */

let readline = require('readline')
let settings = require('./settings.js')

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

if (settings.guildID === '' && settings.authtoken === '') {
  console.error(settings.guildID === '' ? '\nNo guildID provided in settings.js' : null)
  console.error(settings.authtoken === '' ? '\nNo authtoken provided in settings.js\n' : null)
  process.exit()
}

rl.question("Have you read Discord's Developer Terms of Service?\n" +
  '\nhttps://discordapp.com/developers/docs/legal\n' +
  '\nDo you understand that you may have to take all\n' +
  'responsibility for any and all consequences as a\n' +
  'result of running this script? (y/n)\n: ', (answer) => {
  // TODO: Log the answer in a database

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
    if (!fs.existsSync(path.join(__dirname, 'archive'))) {
      console.log('Creating archive directory.')
      fs.mkdirSync(path.join(__dirname, 'archive'))
    }
    Promise.all(client.guilds.get(guildID)
      .channels.map(channel => {
        if (channel.permissionsFor(client.user.id).has('READ_MESSAGES') && channel.permissionsFor(client.user.id).has('READ_MESSAGE_HISTORY') && channel.type === 'text') {
          debug(channel.id, channel.name)
          object[channel.id] = {}
          return fetchMore(channel)
        }
      })).then(() => {
      debug('Starting compression! Please wait, this may take time.')
      let output = fs.createWriteStream(path.join(__dirname, 'archive', `archive_${Date.now()}.zip`))
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
          let msgLast = msg.last().id
          msg.forEach(msg => {
            if (!msg.system) {
              // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
              let attachments = []
              if (msg.attachments.size) {
                msg.attachments.forEach((element) => {
                  attachments.push(element.url)
                })
              }
              let edits = []
              /* Doesn't work.
            if (msg.editedTimestamp) {
              msg.edits.forEach((element) => {
                edits.push({[element.editedTimestamp]: element.cleanContent})
              })
            }
            */
              object[channel.id][msg.createdTimestamp] = {in: {id: msg.channel.id, name: msg.channel.name}, msgId: msg.id, user: {id: msg.author.id, name: msg.author.username}, content: {message: msg.cleanContent, attachments: attachments.length ? attachments : undefined}, pinned: msg.pinned ? true : undefined, edits: edits.length ? edits : undefined}
            }
          })
          debug(msgLast) // Used to let you know that it's still going.
          fetchMore(channel, msgLast).then(resolve, reject)
        } else {
          fs.writeFile(path.join(__dirname, 'temp', `${channel.id}.json`), JSON.stringify(object[channel.id], null, 2), (err) => {
            if (err) throw err
            debug('Finished:', channel.id)
            resolve()
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
