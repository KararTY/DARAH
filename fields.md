# Fields & Directories
### [GUILD_INFO]guild name(guild id).json
  * `n`: **string** Guild name
  * `i`: **string** Guild id
  * `a`: **string** Guild acronym
  * `u`: **string** Guild icon url
  * `l`: **boolean** Guild if large
  * `m`: **number** Guild member amount
  * `t`: **Date** Guild creation timestamp
  * `af`: **Object** Guild afk channel information
    * `af.e`: **boolean** Guild if afk channel exists
    * `af.i`: **string** Guild afk channel id if exists
    * `af.t`: **number** Guild afk channel timeout in seconds
  * `o`: **Object** Guild owner information
    * `o.n`: **string** Guild owner username
    * `o.i`: **string** Guild owner id
    * `o.ai`: **string** Guild owner applicationId if exists
    * `o.nn`: **string** Guild owner nickname in guild if exists
    * `o.tg`: **string** Guild owner discord tag
    * `o.u`: **string** Guild owner avatar icon url
  * `re`: **string** Guild server region
  * `s`: **string** Guild Partner splash icon url if exists
  * `e`: **number** Guild explicit content filter level
  * `v`: **number** Guild verification level
  * `ee`: **boolean** Guild if embedded images enabled
  * `em`: **Array{}** Guild emojis
    * `em[].n`: **string** Guild emoji name
    * `em[].i`: **string** Guild emoji id
    * `em[].if`: **string** Guild emoji name identifier
    * `em[].c`: **boolean** Guild emoji requires colons to use
    * `em[].u`: **string** Guild emoji image url
    * `em[].a`: **boolean** Guild emoji if animated
    * `em[].t`: **Date** Guild emoji creation timestamp
    * `em[].m`: **boolean** Guild emoji if is managed by third party(?)
    * `em[].r`: **Array{}** Guild emoji only available to following roles if exists
      * `em[].r[].n`: **string** Guild emoji role name
      * `em[].r[].i`: **string** Guild emoji role id
  * `r`: **Array{}** Guild roles
    * `r[].po`: **number** Guild role position
    * `r[].n`: **string** Guild role name
    * `r[].i`: **string** Guild role id
    * `r[].t`: **Date** Guild role creation date
    * `r[].c`: **string** Guild role hex color
    * `r[].h`: **boolean** Guild role if hoisted
    * `r[].m`: **number** Guild role amount of guild members in role
    * `r[].mg`: **boolean** Guild role if is managed by third party(?)
    * `r[].me`: **boolean** Guild role if is mentionable
    * `r[].p`: **number** Guild role permissions number
  * `c`: **Array{}** Guild channels
    * `c[].n`: **string** Guild channel name
    * `c[].i`: **string** Guild channel id
    * `c[].ty`: **string** Guild channel type
    * `c[].po`: **number** Guild channel position
    * `c[].t`: **Date** Guild channel creation timestamp
    * `c[].pa`: **Object** Guild channel if channel has parent
      * `c[].pa.n`: **string** Guild channel parent name
      * `c[].pa.i`: **string** Guild channel parent id
    * `c[].p`: **Array{}** Guild channel permission overwrites if exists
      * `c[].p[].i`: **string** Guild channel permission overwrite id
      * `c[].p[].ty`: **string** Guild channel permission overwrite type
  * `_at`: **Object** Archival timestamps
    * `_at.t`: **Date** timestamp
    * `_at.s`: **string** Timestamp to human readable string if exists
  * `_by`: **Object** Account details used for archive
    * `_by.n`: **string** Account name
    * `_by.i`: **string** Account id
    * `_by.nn`: **string** Account display name
    * `_by.tg`: **string** Account user discord tag
    * `_by.u`: **string** Account icon avatar url
    * `_by.b`: **boolean** Account if bot
  * `_app`: **string**
### [INFO]users.json
  * `[string]`: **[string]{}** Member id
    * `[string].n`: **string** Member discord username
    * `[string].nn`: **string** Member guild nickname if exists
    * `[string].tg`: **string** Member discord tag
    * `[string].a`: **string** Member discord icon avatar url
    * `[string].b`: **boolean** Member discord account if bot
    * `[string].t`: **Date** Member discord account creation
    * `[string].r`: **Array** Member guild roles
      * `[string].r[]`: **string** Member guild role id
### [INFO]roles.json
  * `[string]`: **[string]{}** Role id
    * `[string].n`: **string** Role name
    * `[string].p`: **number** Role permissions number
    * `[string].c`: **string** Role hex color
### [INFO]emojis.json
  * `[string]`: **[string]{}** Reaction emoji id
    * `[string].c`: **string** Reaction identifier
    * `[string].n`: **string** Reaction name
    * `[string].e`: **string** Reaction in unicode if applicable
### [CHANNEL]channel-name(channel id).json
  * `c`: **Object** Channel information object
    * `c.n`: **string** Channel name
    * `c.i`: **string** Channel id
  * `c.to`: **string** Channel topic
  * `g`: **Object** Guild information object
    * `g.n`: **string** Guild name
    * `g.i`: **string** Guild id
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
          * `m[].c.e[].f[].l`: **boolean** Message embed field if inline
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
        * `m[].c.e[].t`: **string** Message embed timestamp
        * `m[].c.e[].ti`: **string** Message embed title
        * `m[].c.e[].ty`: **string** Message embed type
        * `m[].c.e[].v`: **string** Message embed video url if exists
      * `m[].c.r`: **Array{}** Message reactions if exists
        * `m[].c.r[].u`: **Array** Message reaction users
          * `m[].c.r[].u[]`: **string** Message reaction user id
        * `m[].c.r[].i`: **string** Message reaction id
    * `m[].t`: **Date** Message creation timestamp
    * `m[].p`: **boolean** Message is pinned if applicable
    * `m[].e`: **Date** Message last edit timestamp if applicable
    * `m[].n`: **string** Message delivery nonce, may be a completely useless field
    * `m[].s`: **boolean** Message if system
    * `d[].ty`: **boolean** Message type if applicable
    * `m[].ts`: **boolean** Message text to speech if used
    * `m[].es`: **Array{}** Message edits if exists (Not working)
      * `m[].es[string]:` **string** Message edit content
  * `d`: **Array{}** Deleted messages
    * `d[].i`: **string** Deleted message id
    * `d[].u`: **string** Deleted message author id
    * `d[].c`: **Object** Deleted message content object
      * `d[].c.m`: **string** Deleted message content
      * `d[].c.a`: **Array{}** Deleted message attachments if exists
        * `d[].c.a[].n`: **string** Deleted message attachment file name
        * `d[].c.a[].u`: **string** Deleted message attachment file url
      * `d[].c.e`: **Array{}** Deleted message embeds if exists
        * `d[].c.e[].a`: **Object** Deleted message embed author if exists
          * `d[].c.e[].a.n`: **string** Deleted message embed author name
          * `d[].c.e[].a.u`: **string** Deleted message embed author icon url
        * `d[].c.e[].c`: **string** Deleted message embed hex color
        * `d[].c.e[].d`: **string** Deleted message embed description
        * `d[].c.e[].f`: **Array{}** Deleted message embed fields object
          * `d[].c.e[].f[].l`: **boolean** Deleted message embed field if inline
          * `d[].c.e[].f[].n`: **string** Deleted message embed field name
          * `d[].c.e[].f[].v`: **string** Deleted message embed field value
        * `d[].c.e[].fo`: **Object** Deleted message embed footer object
          * `d[].c.e[].fo.u`: **string** Deleted message embed footer icon url
          * `d[].c.e[].fo.v`: **string** Deleted message embed footer text
        * `d[].c.e[].i`: **string** Deleted message embed image if exists
        * `d[].c.e[].p`: **Object** Deleted message embed provider object
          * `d[].c.e[].p.n`: **Object** Deleted message embed provider name
          * `d[].c.e[].p.u`: **Object** Deleted message embed provider url
        * `d[].c.e[].th`: **string** Deleted message embed thumbnail url if exists
        * `d[].c.e[].t`: **string** Deleted message embed timestamp
        * `d[].c.e[].ti`: **string** Deleted message embed title
        * `d[].c.e[].ty`: **string** Deleted message embed type
        * `d[].c.e[].v`: **string** Deleted message embed video url if exists
      * `d[].c.r`: **Array{}** Deleted message reactions if exists
        * `d[].c.r[].u`: **Array** Deleted message reaction users
          * `d[].c.r[].u[]`: **string** Deleted message reaction user id
        * `m[].c.r[].i`: **string** Deleted message reaction id
    * `d[].t`: **Date** Deleted message creation timestamp
    * `d[].p`: **boolean** Deleted message is pinned if applicable
    * `d[].e`: **Date** Deleted message last edit timestamp if applicable
    * `d[].n`: **string** Deleted message delivery nonce, may be a completely useless field
    * `d[].s`: **boolean** Deleted message if system
    * `d[].ty`: **boolean** Deleted message type if applicable
    * `d[].ts`: **boolean** Deleted message text to speech if used
    * `d[].es`: **Array{}** Deleted message edits if exists *(Not working)*
      * `d[].es[string]:` **string** Deleted message edit content
### Downloads (Directory)
  * `Guild` Directory for guild content.
  * `Channels` Directory for channel content
    * `Channels/[channelId]` Directory for channel
  * `Users` Directory for user content
    * `Users/[userId]` Directory for user