module.exports = {
  authentication: {
    discord: {
      token: ''
    },
    pastebin: { // WILL HAVE TO THINK ABOUT THIS.
      token: ''
    }
  },
  archiving: {
    GUILDS: [], // Guild ids. Use 'ALL' for all.
    DIRECTMESSAGES: [], // User ids. Use 'ALL' for all.
    tempDir: __dirname, // Put temp directory here. (__dirname)
    archiveDir: __dirname, // Put archive directory here. (__dirname)
    overwrite: false, // Use this to overwrite all custom settings with predefined ones.
    overwriteType: 2, // -1 anonymize, 0 minimum, 1 medium, 2 maximum
    defaultSettings: {
      everyMessages: 100000, // Create new file every X messages.
      channels: {
        id: true,
        name: true,
        topic: true
      },
      messages: {
        id: true,
        attachments: true,
        embeds: true,
        reactions: true
      },
      members: {
        name: true,
        id: true,
        creationDate: true,
        joinDate: true,
        roles: true,
        icon: true
      },
      guilds: {
        id: true,
        name: true,
        icon: true,
        owner: true,
        emojis: true,
        roles: true,
        channels: true,
        users: true
      },
      download: {
        icons: true,
        images: true,
        emojis: true,
        videos: true,
        soundFiles: true,
        textFiles: true,
        misc: true
      },
      trackAndArchiveDeletedMessages: true,
      output: {
        appendWhoArchived: true,
        formatted: false,
        whiteSpace: 2
      }
    }
  }
}
