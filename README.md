# S.A.R.A.H. Parser - Server Auto Record Archiver Heroine
## Archive ALL Discord messages in a guild.

### 10 Step Setup.
  1. Get NodeJS, version **8.1.2 or newer**.
  2. **Make sure you have enough disk space.**
  3. Git clone or download this repository and then change to the directory via console/terminal.
  4. Type `npm i` in your console/terminal and wait for dependencies to download and install successfully.
  5. Open up `settings.js` with any text program:
```js
module.exports = {
  auto: false, // Will run automatically on a schedule based on 'CRON'.
  debug: true, // Will display debug related messages to your console. (Really spammy.)
  CRON: '0 0 */1 * *', // This example 'CRON' will run archiver at every midnight (00:00).
  acceptTOS: false, /* Make this 'true' if you're running your own CRON system script.
  Please read this https://discordapp.com/developers/docs/legal before enabling. */
  authtoken: '', // Bot account is preferred.
  guildID: '', // While in developer mode, right click the server icon and click 'Copy ID'.
  messagesEveryFile: 100000, // Amount of max messages in every file. In effect limiting every file size at around 20-50 MB.
  formatOutput: {
    mentionWhoArchived: true, // Includes details of the account used for the archive.
    enabled: false, // Formats the json output. Default is false for lower file size.
    whitespace: 2 /* Amount of backspace to use for formatter or use '\t' for tabs
    Defaults to 2 whitespace. This setting is disregarded if 'formatOutput.enabled' is 'false'. */
  }
}
// Cron help http://crontab.guru/ (Check this site out to see examples on CRON scheduling)
```
  6. If `auto` is true the archiver will parse the CRON string in settings.js variable `CRON`.
  7. `debug` is spammy. Don't enable it unless you want to know what's up via your console/terminal.
  8. Change variables in settings.js: `authtoken` & `guildID` and then save.
  9. Type `node app.js` in your console/terminal, follow instructions and then wait for the program to successfully backup.
  10. Your archives will go under the folder `archive` as a .zip file with a guild name(guild id) + timestamp filename. If auto is enabled, program will idle until parsed CRON schedule hits.
 * **Note:** If you're archiving REALLY big servers, make sure to change `messagesEveryFile` variable in settings.js. However, default value of `100000` SHOULD suffice.

### [Want to view your archives? Click here for S.A.R.A.H. Viewer!](https://github.com/kararty/sarah-viewer)

### Prerequisites
 * NodeJS version >= 8.1.2
 * Enough disk space. **(100000 messages is around 20-50 MB in file size.)**

### [What do the fields stand for?](/fields.md)

### Contributors
[Tonkku107](https://github.com/tonkku107/) - [Website](https://tonkku.me/)

### Contributing
Fork project & Send a pull request. Use eslint & the provided eslint file, thanks.

### License MIT Karar Al-Remahy