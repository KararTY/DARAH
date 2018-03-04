module.exports = {
  auto: false, /* If enabled the script will run automatically on a schedule based on 'CRON'.
  Disable this if you're running your own OS CRON system script. */
  debug: true, // If enabled this will display debug related messages in your console. (Really spammy.)
  CRON: '0 0 */1 * *', /* This example 'CRON' will run archiver at every midnight (00:00).
  Only works if 'auto' is 'true'. */
  acceptTOS: false, /* Enable this if you're running your own OS CRON system script.
  Please read this https://discordapp.com/developers/docs/legal before enabling. */
  fullArchive: false, /* Enable this if you want every archive to contain ALL (from beginning to end) messages.
  First archives are not affected. */
  authtoken: '', // (REQUIRED) Bot account is preferred.
  guildID: '', /* (REQUIRED) While in developer mode, right click the server icon and click 'Copy ID'.
  Want to archive absolutely EVERYTHING, including DMs? Put in ''ALL''.
  NOTE: This may hang the process and/or ratelimit your access to Discord. */
  channels: [], /* While in developer mode, right click every channel you want to archive and click 'Copy ID'.
  Make sure you wrap the channel ID with apostrophes (''). Leave empty ('[]') for all channels.
  Works together with 'guildID: 'ALL'' if you want to archive specific channels not in guilds. */
  messagesEveryFile: 100000, /* Amount of max messages in every file.
  Default of 100000 is limiting every file size at around 20-50 MB. */
  formatOutput: {
    mentionWhoArchived: true, // Include details of the account used for the archive.
    enabled: false, // Formats the json output. Default is false for lower file size.
    whitespace: 2 /* Amount of backspace to use for formatter or use ''\t'' for tabs.
    Defaults to 2 whitespace. This setting is disregarded if 'formatOutput.enabled' is 'false'. */
  }
}
// Cron help http://crontab.guru/ (Check this site out to see examples on CRON scheduling)
/* On first launch the script will create the following directories:
  - archive
  - temp
  as well as eventually create a file by the name of "_SARAH_doNotDelete_counter.json"
  which should **ONLY** be deleted in the event you want to reset **ALL** of your automatic archives. */
