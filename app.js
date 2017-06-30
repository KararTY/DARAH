/**
 * Server Auto Record Archiver Heroine
 * MIT License
 */

const { Client } = require('discord.js')
const fs = require('fs')
const path = require('path')
const schedule = require('node-schedule')
const parser = require('cron-parser')
const archiver = require('archiver')
const settings = require('./settings.js')
const client = new Client()

let archive = archiver('zip')

// Put in your guild id in settings.js
let guildID = settings.guildID
// Put in your auth token in settings.js
let auth = settings.authtoken

let object = {}

let disconnected = false

const cleanTempDir = () => {
  if (!fs.existsSync(path.join(__dirname, 'temp'))) return console.log('No temp directory found.')
  fs.readdirSync(path.join(__dirname, 'temp')).forEach((file, index) => {
    var curPath = path.join(__dirname, 'temp', file)
    fs.unlinkSync(curPath)
  })
  console.log('Cleaned directory', path.join(__dirname, 'temp').toString())
}

const run = (auto) => {
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
      if (settings.debug) console.log(channel.id, channel.name)
      object[channel.id] = {}
      return fetchMore(channel)
    }
  })).then(() => {
    if (settings.debug) console.log('Starting compression! Please wait, this may take time.')
    let output = fs.createWriteStream(path.join(__dirname, 'archive', `archive_${Date.now()}.zip`))
    output.on('close', () => {
      console.log('Finished archiving!', Date().toString())
      if (!settings.auto) process.exit(0)
    })
    archive.pipe(output)
    archive.glob('**/*', { cwd: path.join(__dirname, 'temp'), src: ['**/*'], expand: true })
    archive.finalize((err, bytes) => {
      if (err) throw err
      // #Not working# if (settings.debug) console.log('Finished compressing! Total bytes', bytes, '\nNot done yet! Please wait...')
    })
  })
}

if (settings.guildID === '') throw new Error('No guildID provided in settings.js')
if (settings.authtoken === '') throw new Error('No authtoken provided in settings.js')
client.once('ready', () => {
  console.log('Logged into Discord.')
  if (settings.auto) {
    try {
      let interval = parser.parseExpression(settings.CRON)
      console.log('#1 will run at:', interval.next().toString())
      console.log('#2 will run at:', interval.next().toString(), '\netc. etc.')
      schedule.scheduleJob(settings.CRON, () => {
        console.log('Starting...', Date().toString())
        cleanTempDir()
        run(true)
      })
    } catch (error) {
      throw error
    }
  } else {
    console.log('Running one-timer...')
    cleanTempDir()
    run(false)
  }
})

const fetchMore = (channel, before) => {
  return new Promise((resolve, reject) => {
    channel.fetchMessages({limit: 100, before: before}).then(msg => {
      if (msg.size > 0) {
        let msgLast = msg.last().id
        msg.forEach(msg => {
          // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
          object[channel.id][msg.createdTimestamp] = {in: {id: msg.channel.id, name: msg.channel.name}, msgId: msg.id, user: {id: msg.author.id, name: msg.author.username}, content: {message: msg.cleanContent, attachment: msg.attachments.size ? msg.attachments.first().url : undefined}}
        })
        if (settings.debug) console.log(msgLast) // Used to let you know that it's still going.
        fetchMore(channel, msgLast).then(resolve, reject)
      } else {
        fs.writeFile(path.join(__dirname, 'temp', `${channel.id}.json`), JSON.stringify(object[channel.id], null, 2), (err) => {
          if (err) throw err
          if (settings.debug) console.log('Finished:', channel.id)
          resolve()
        })
      }
    })
  })
}

client.on('reconnecting', () => {
  console.log('Reconneting to Discord...')
  disconnected = true
})

client.on('resume', () => {
  console.log('Reconnected to Discord. All functional.')
  disconnected = false
})

client.on('disconnect', () => {
  console.log("Could't connect to Discord after multiple retries. Check your connection and relaunch me.")
  process.exit(1)
})

client.login(auth)
