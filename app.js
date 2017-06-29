/**
 * Server Auto Record Archiver Heroine
 * MIT License
 */

const { Client } = require('discord.js')
const fs = require('fs')
const path = require('path')
const client = new Client()

// Put in your guild id here.
let guildID = ''
// Put in your auth token here.
let auth = ''

let object = {}

client.on('ready', () => {
  console.log('I am ready!')
  // Creates 'archive' directory if it doesn't exist.
  if (!fs.existsSync(path.join(__dirname, 'archive'))) {
    console.log('Creating archive directory.')
    fs.mkdirSync(path.join(__dirname, 'archive'))
  }
  Promise.all(client.guilds.get(guildID)
  .channels.map(channel => {
    if (channel.permissionsFor(client.user.id).has('READ_MESSAGES') && channel.permissionsFor(client.user.id).has('READ_MESSAGE_HISTORY') && channel.type === 'text') {
      console.log(channel.id, channel.name)
      object[channel.id] = {}
      return fetchMore(channel)
    }
  })).then(() => {
    console.log('Finished archiving!')
    process.exit(0)
  })
})

const fetchMore = (channel, before) => {
  return new Promise((resolve, reject) => {
    channel.fetchMessages({limit: 100, before: before}).then(msg => {
      if (msg.size > 0) {
        let msgLast = msg.last().id
        msg.forEach(msg => {
          // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
          object[channel.id][msg.createdTimestamp] = {in: msg.channel.id, msgId: msg.id, userID: msg.author.id, content: msg.content, attachment: msg.attachments.size ? msg.attachments.first().url : undefined}
        })
        console.log(msgLast) // Used to let you know that it's still going.
        fetchMore(channel, msgLast).then(resolve, reject)
      } else {
        fs.writeFile(path.join(__dirname, 'archive', `${channel.id}.json`), JSON.stringify(object[channel.id], null, 2), (err) => {
          if (err) throw err
          console.log('Finished & Appended.', channel.id)
          resolve()
        })
      }
    })
  })
}

client.login(auth)
