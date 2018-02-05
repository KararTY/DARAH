module.exports = {
  auto: false, // Will run automatically on a schedule based on 'CRON'.
  debug: true, // Will display debug related messages to your console. (Really spammy.)
  CRON: '0 0 */1 * *', // This example 'CRON' will run archiver at every midnight (00:00).
  acceptTOS: false, /* Make this 'true' if you're running your own CRON system script.
  Please read this https://discordapp.com/developers/docs/legal before enabling. */
  authtoken: '', // Bot account is preferred.
  guildID: '', // While in developer mode, right click the server icon and click 'Copy ID'.
  messagesEveryFile: 100000, // Amount of max messages in every file. In effect limiting every file size at around 30-40 MB.
  formatOutput: {
    mentionWhoArchived: true, // Includes details of the account used for the archive.
    enabled: false, // Formats the json output. Default is false for lower file size.
    whitespace: 2 /* Amount of backspace to use for formatter or use '\t' for tabs
    Defaults to 2 whitespace. Setting is disregarded if 'formatOutput.enabled' is 'false'. */
  }
}
// Cron help http://crontab.guru/ (Check this site out to see examples on CRON scheduling)
