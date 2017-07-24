module.exports = {
  auto: false, // Will run automatically on a schedule based on 'CRON'.
  debug: false, // Will display debug related messages to your console. (Really spammy.)
  CRON: '0 0 */1 * *', // This example 'CRON' will run archiver every midnight (00:00).
  authtoken: '', // Bot account is preferred.
  guildID: '' // While in developer mode, right click your server icon and click 'Copy ID'.
}
// Cron help http://crontab.guru/ (Check this site out to see examples on scheduling)
