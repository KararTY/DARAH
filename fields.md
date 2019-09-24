# Fields & Directories
**Note:** Still missing a few new, as well as changed, fields.
### [INFORMATION]guild name(guild id).json
  * `n`: **string** Guild name
  * `i`: **string** Guild id
  * `a`: **string** Guild acronym
  * `u`: **string** Guild icon url
  * `l`: **Boolean** Guild if large
  * `m`: **number** Guild member amount
  * `t`: **Date** Guild creation timestamp
  * `af`: **Object** Guild afk channel information
    * `af.e`: **Boolean** Guild if afk channel exists
    * `af.i`: **string** Guild afk channel id if exists
    * `af.t`: **number** Guild afk channel timeout in seconds
  * `o`: **string** Guild owner user id
  * `re`: **string** Guild server region
  * `s`: **string** Guild Partner splash icon url if exists
  * `e`: **number** Guild explicit content filter level
  * `v`: **number** Guild verification level
  * `ee`: **Boolean** Guild if embedded images enabled
  * `em`: **Array{}** Guild emojis
    * `em[].n`: **string** Guild emoji name
    * `em[].i`: **string** Guild emoji id
    * `em[].if`: **string** Guild emoji name identifier
    * `em[].c`: **Boolean** Guild emoji requires colons to use
    * `em[].u`: **string** Guild emoji image url
    * `em[].a`: **Boolean** Guild emoji if animated
    * `em[].t`: **Date** Guild emoji creation timestamp
    * `em[].m`: **Boolean** Guild emoji if is managed by third party(?)
    * `em[].r`: **Array{}** Guild emoji only available to following roles if exists
      * `em[].r[].n`: **string** Guild emoji role name
      * `em[].r[].i`: **string** Guild emoji role id
  * `r`: **Array{}** Guild roles
    * `r[].po`: **number** Guild role position
    * `r[].n`: **string** Guild role name
    * `r[].i`: **string** Guild role id
    * `r[].t`: **Date** Guild role creation date
    * `r[].c`: **string** Guild role hex color
    * `r[].h`: **Boolean** Guild role if hoisted
    * `r[].m`: **number** Guild role amount of guild members in role
    * `r[].mg`: **Boolean** Guild role if is managed by third party(?)
    * `r[].me`: **Boolean** Guild role if is mentionable
    * `r[].p`: **number** Guild role permissions number
  * `_at`: **Object** Archival timestamps
    * `_at.t`: **Date** timestamp
    * `_at.s`: **string** Timestamp to human readable string if exists
  * `_by`: **Object** Account details used for archive
    * `_by.n`: **string** Account name
    * `_by.i`: **string** Account id
    * `_by.nn`: **string** Account display name
    * `_by.tg`: **string** Account user discord tag
    * `_by.u`: **string** Account icon avatar url
    * `_by.b`: **Boolean** Account if bot
  * `_app`: **string**
### [INFO]users.json
  * `u`: **Array{}** Members & users
    * `u[].i`: **string** Member id
    * `u[].n`: **string** Member discord username
    * `u[].nn`: **string** Member guild nickname if exists
    * `u[].tg`: **string** Member discord tag
    * `u[].a`: **string** Member discord icon avatar url
    * `u[].b`: **Boolean** Member discord account if bot
    * `u[].t`: **Date** Member discord account creation
    * `u[].j`: **Date** Member joined
    * `u[].r`: **Array** Member guild roles
      * `u[].r[]`: **number** Member guild role index
### [INFO]roles.json
  * `r`: **Array{}** Roles
    * `r[].i`: **string** Role id
    * `r[].n`: **string** Role name
    * `r[].p`: **number** Role permissions number
    * `r[].c`: **string** Role hex color
### [INFO]emojis.json
  * `e`: **Array{}** Reaction emojis
    * `e[].i`: **string** Reaction emoji id if applicable
    * `e[].c`: **string** Reaction requires colons if applicable
    * `e[].n`: **string** Reaction name
    * `e[].e`: **string** Reaction in unicode if applicable
    * `e[].a`: **string** Reaction is animated if applicable
    * `e[].t`: **string** Reaction created date if applicable
    * `e[].m`: **string** Reaction if managed if applicable
    * `e[].u`: **string** Reaction url if applicable
### [INFO]channels.json
  * `c`: **Object** Channels
    * `c.p`: **Array{}** Parent channels
      * `c.p[].i`: **string** Parent id
      * `c.p[].n`: **string** Parent name
    * `c.c`: **Array{}** Channels
      * `c.c[].i`: **string** Channel id
      * `c.c[].n`: **string** Channel name
      * `c.c[].to`: **string** Channel topic
      * `c.c[].n`: **string** Channel name
      * `c.c[].bit`: **string** Voice channel bitrate if applicable
      * `c.c[].lim`: **string** Voice channel user limit if applicable
      * `c.c[].ty`: **string** Channel type
      * `c.c[].po`: **number** Channel position
      * `c.c[].t`: **Date** Channel creation timestamp
      * `c.c[].pa`: **number** Channel parent channel index if exists
      * `c.c[].p`: **Array{}** Channel permission overwrites if exists
        * `c.c[].p[].i`: **string** Channel permission overwrite id
        * `c.c[].p[].ty`: **string** Channel permission overwrite type
      * `c.c[].nsfw`: **Boolean** Channel marked as NSFW if applicable
      * `c.c[].rlpu`: **number** Channel rate limit per user if applicable in seconds
### [CHANNEL]channel-name(channel id).json
  * `m`: **Array{}** Messages
    * `m[].i`: **string** Message id
    * `m[].u`: **string** Message author id
    * `m[].c`: **Object** Message content object
      * `m[].c.m`: **string** Message content
      * `m[].c.a`: **Array{}** Message attachments if exists
        * `m[].c.a[].n`: **string** Message attachment file name
        * `m[].c.a[].u`: **string** Message attachment file url
      * `m[].c.e`: **Array{}** Message embeds if exists
        * `m[].c.e[].a`: **Object** Message embed author if exists
          * `m[].c.e[].a.n`: **string** Message embed author name
          * `m[].c.e[].a.u`: **string** Message embed author icon url
        * `m[].c.e[].c`: **string** Message embed hex color
        * `m[].c.e[].d`: **string** Message embed description
        * `m[].c.e[].f`: **Array{}** Message embed fields object
          * `m[].c.e[].f[].l`: **Boolean** Message embed field if inline
          * `m[].c.e[].f[].n`: **string** Message embed field name
          * `m[].c.e[].f[].v`: **string** Message embed field value
        * `m[].c.e[].fo`: **Object** Message embed footer object
          * `m[].c.e[].fo.u`: **string** Message embed footer icon url
          * `m[].c.e[].fo.v`: **string** Message embed footer text
        * `m[].c.e[].i`: **string** Message embed image if exists
        * `m[].c.e[].p`: **Object** Message embed provider object
          * `m[].c.e[].p.n`: **Object** Message embed provider name
          * `m[].c.e[].p.u`: **Object** Message embed provider url
        * `m[].c.e[].th`: **string** Message embed thumbnail url if exists
        * `m[].c.e[].t`: **Date** Message embed timestamp
        * `m[].c.e[].ti`: **string** Message embed title
        * `m[].c.e[].u`: **string** Message embed title url
        * `m[].c.e[].ty`: **string** Message embed type
        * `m[].c.e[].v`: **string** Message embed video url if exists
      * `m[].c.r`: **Array{}** Message reactions if exists
        * `m[].c.r[].u`: **Array** Message reaction users
          * `m[].c.r[].u[]`: **string** Message reaction user id
        * `m[].c.r[].i`: **string** Message reaction id
    * `m[].t`: **Date** Message creation timestamp
    * `m[].p`: **Boolean** Message is pinned if applicable
    * `m[].e`: **Date** Message last edit timestamp if applicable
    * `m[].n`: **string** Message delivery nonce, may be a completely useless field
    * `m[].s`: **Boolean** Message if system
    * `d[].ty`: **Boolean** Message type if applicable
    * `m[].ts`: **Boolean** Message text to speech if used
    * `m[].es`: **Array{}** Message edits if exists *(Not working)*
      * `m[].es[string]:` **string** Message edit content
### Downloads (Directory)
  * `Guild` Directory for guild content.
    * `Guild/(number counter).(extension)` Guild emojis
    * `Guild/icon.(extension)` Guild icon
  * `Channels` Directory for channel content
    * `Channels/(channel id)` Directory for channel
      * `Channels/(channel id)/[message counter]-[attachment position].(extension if applicable)` Uploaded attachments in channel
  * `Users` Directory for user avatars
    * `Users/(user counter).(extension)` User profile picture
  * `Emojis` Directory for emojis
    * `Emojis/(emoji counter).(extension)` Emoji picture