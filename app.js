/**
 * Server Auto Record Archiver Heroine
 * MIT License
 */

const Discord = require('discord.js')
const fs = require('fs')
const path = require('path')
const client = new Discord.Client()

// Put in your guild id here.
let guildID = ''
// Put in your auth token here.
let auth = ''

/* object {
  'channelID': {
    'createdTimestamp': {
      in: msg.channel.id,
      msgId: msg.id,
      userID: msg.author.id,
      content: msg.content,
      attachment: msg.attachments.first().url
    }
  }
} */
let object = {}

let channelCounter = [0, 0]

client.on('ready', () => {
  console.log('I am ready!')
  // Creates 'archive' directory if it doesn't exist.
  if (!fs.existsSync(path.join(__dirname, 'archive'))) {
    console.log('Creating archive directory.')
    fs.mkdirSync(path.join(__dirname, 'archive'))
  }
  client.guilds.find(guild => guild.id === guildID)
  .channels.forEach(channel => {
    if (channel.permissionsFor(client.user.id).has('READ_MESSAGES') && channel.type === 'text') {
      console.log(channel.id, channel.name)
      object[channel.id] = {}
      method.fetchMore(channel.id)
      channelCounter[0] += 1
    }
  })
})

const method = {
  fetchMore: (channelID, before) => {
    client.guilds.find(guild => guild.id === guildID)
    .channels.get(channelID)
    .fetchMessages({limit: 100, before: before}).then(msg => {
      try {
        if (msg.size > 0) {
          let msgLast = msg.last().id
          msg.forEach(msg => {
            // Check https://discord.js.org/#/docs/main/stable/class/Message to see what you can archive.
            if (msg.attachments.size > 0) {
              object[channelID][msg.createdTimestamp] = {in: msg.channel.id, msgId: msg.id, userID: msg.author.id, content: msg.content, attachment: msg.attachments.first().url}
            } else {
              object[channelID][msg.createdTimestamp] = {in: msg.channel.id, msgId: msg.id, userID: msg.author.id, content: msg.content}
            }
          })
          console.log(msgLast) // Used to let you know that it's still going.
          method.fetchMore(channelID, msgLast)
        } else {
          fs.appendFile(path.join(__dirname, 'archive', `${channelID}.json`), JSON.stringify(object[channelID], null, 2), (err) => {
            if (err) throw err
            console.log('Finished & Appended.', channelID)
            channelCounter[1] += 1
          })
        }
      } catch (error) {
        throw error
      }
    })
  }
}

setInterval(() => {
  if (channelCounter[0] > 0 && channelCounter[1] > 0) {
    if (channelCounter[0] === channelCounter[1]) {
      console.log('Finished archiving!')
      process.exit(0)
    }
  }
}, 5000)

client.login(auth)
