# ServerAutoRecordArchiverHeroine
## Archives all Discord messages in a guild.

### 10 Step Setup.
  1. Get NodeJS, version 8.1.2 or newer.
  2. Make sure you have enough disk space.
  3. Git clone or download this repository and then change to the directory via console/terminal.
  4. Type `npm i` in your console/terminal and wait for dependencies to download and install successfully.
  5. Open up `settings.js` with any text program:
```js
module.exports = {
  auto: true, // Will run automatically on a schedule based on 'CRON'.
  debug: true, // Will display debug related messages to your console. (Really spammy.)
  CRON: '0 0 */1 * *', // This example 'CRON' will run archiver every midnight (00:00).
  authtoken: '', // Bot account is preferred.
  guildID: '' // While in developer mode, right click your server icon and click 'Copy ID'.
}
// Cron help http://crontab.guru/ (Check this site out to see examples on scheduling)
```
  6. If `auto` is true the archiver will use the CRON job you've put in `CRON`.
  7. `debug` is spammy. Don't enable it unless you want to know what's up via your console/terminal.
  8. Change settings and most importantly: `authtoken` & `guildID` and then save.
  9. Type `node app.js` in your console/terminal and wait for the program to successfully backup.
  10. Your archives will go under the folder `archive` as a .zip file with timestamp filename.

### Prerequisites
 * NodeJS version >= 8.1.2
 * Enough disk space.

### Contributors
[Tonkku107](https://github.com/tonkku107/) - [Website](https://tonkku.me/)

### Contributing
Fork project & Send a pull request. Use eslint, thanks.

### License MIT