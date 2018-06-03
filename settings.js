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
    GROUPS: [], // Owner user id. Use 'ALL' for all.
    DIRECTMESSAGES: [], // User ids. Use 'ALL' for all.
    tempDir: '', // Put temp directory here. (__dirname)
    archiveDir: '', // Put archive directory here. (__dirname)
    auto: {
      enabled: false,
      cronSchedule: '0 0 */1 * *' // This example cron schedule ('0 0 */1 * *') will run archiver every midnight (00:00).
    },
    overrule: false, // Use this to overrule all available custom guild archive options with the one below.
    defaultOptions: {
      fullArchive: true, // Archives everything from the beginning if enabled.
      everyMessages: 100000, // Create new file every X messages.
      channels: {
        id: false,
        name: true,
        topic: true,
        voice: true
      },
      messages: {
        id: false,
        attachments: true,
        embeds: true,
        reactions: true
      },
      members: {
        name: false,
        id: false,
        creationDate: true,
        joinDate: true,
        roles: true,
        icon: true
      },
      information: {
        id: false,
        name: false,
        icon: true,
        owner: true,
        emojis: false,
        roles: true,
        channels: true,
        users: true
      },
      downloads: {
        icons: true,
        images: true,
        emojis: true,
        videos: true,
        audios: true,
        texts: true,
        misc: true
      },
      trackAndArchiveDeletedMessages: true, // Only works when auto is enabled.
      output: {
        appendWhoArchived: true,
        formatted: false,
        whiteSpace: 2
      }
    }
  },
  debug: true
}
