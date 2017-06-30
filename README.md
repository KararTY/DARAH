# ServerAutoRecordArchiverHeroine
Archives all Discord messages in a guild.

### Prerequisites
 * NODE VERSION >= 8.1.2
 * Enough disk space.

### Example settings.js
```js
module.exports = {
  auto: true, // Will run automatically on a schedule based on 'CRON'.
  debug: true, // Will display debug related messages to your console. (Really spammy.)
  CRON: '0 * */1 * *', // This example 'CRON' will run script every midnight.
  authtoken: '', // Please use a bot account.
  guildID: '' // (Developer mode) Right click your server icon and click 'Copy ID'.
}
// Cron help http://crontab.guru/ (Check this site out to see examples on scheduling)
```

### Contributors
[Tonkku107](https://github.com/tonkku107/) - [Website](https://tonkku.me/)

### Contributing
Fork project & Send a pull request. JS Standard Style is preferred.

### License MIT