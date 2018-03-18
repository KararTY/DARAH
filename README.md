# S.A.R.A.H. - Server Auto Record Archiver Heroine
## Archive ALL Discord messages in a guild.

### [What do the outputted fields stand for?](/fields.md)

### [Want to view your archives? Click here for S.A.R.A.H. Viewer!](https://github.com/kararty/sarah-viewer)

### 10 Step Setup.
  1. Get & Install NodeJS, version **8.1.2 or newer**.
  2. **Make sure you have enough disk space.**
  3. Git clone or download this repository and then change to the directory via console/terminal.
  4. Type `npm i` in your console/terminal and wait for dependencies to download and install successfully.
  5. Open up `settings.js` with any text program:
```js
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
```
  6. If `auto` is true the archiver will parse the CRON string in settings.js variable `CRON`.
  7. `debug` is spammy. Don't enable it unless you want to know what's up via your console/terminal.
  8. Change variables in settings.js: `authtoken` & `guildID` and then save.
  9. Type `node app.js` in your console/terminal, follow instructions and then wait for the program to successfully backup.
  10. Your archives will go under the folder `archive` as a .zip file with a guild name(guild id) + timestamp filename. If auto is enabled, program will idle until parsed CRON schedule hits.
 * **Note:** If you're archiving REALLY big servers, make sure to change `messagesEveryFile` variable in settings.js. However, default value of `100000` SHOULD suffice.

### Prerequisites
 * NodeJS version >= 8.1.2
 * Enough disk space. **(100000 messages is around 10-30 MB in file size.)**

### Contributors
* [Tonkku107](https://github.com/tonkku107/) - [Website](https://tonkku.me/)
* [KararTY](https://github.com/kararty/) - [Website](https://alremahy.com/biz/projects/sarah)

### Contributing
Fork project & Send a pull request. Use eslint & the provided eslint file, thanks.

### License MIT Karar Al-Remahy
