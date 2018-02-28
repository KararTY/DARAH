# Fields
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

### [CHANNEL]channel-name(channel id).json
* `c`: **Object** Channel
* `c.n`: **string** Channel name
* `c.i`: **string** Channel id
* `c.to`: **string** Channel topic
* `g`: **Object** Guild information
* `g.n`: **string** Guild name
* `g.i`: **string** Guild id
* `r`: **Object** Roles
* `r[string].n`: **string** Role name
* `r[string].i`: **string** Role id
* `r[string].p`: **number** Role permissions number
* `r[string].c`: **string** Role hex color
* `u`: **Object** Members
* `u[string].n`: **string** Member discord username
* `u[string].i`: **string** Member discord id
* `u[string].nn`: **string** Member guild nickname if exists
* `u[string].tg`: **string** Member discord tag
* `u[string].a`: **string** Member discord icon avatar url
* `u[string].b`: **boolean** Member discord account if bot
* `u[string].t`: **Date** Member discord account creation
* `u[string].r`: **Array** Member guild roles
* `u[string].r[]`: s**tring** Guild role id
* `m`: **Array{}** Messages
* `m[].i`: **string** Message id
* `m[].u`: **string** Message author id
* `m[].c`: **Object** Message content object
* `m[].c.m`: **string** Message content
* `m[].c.a`: **Array{}** Message attachments if exists
* `m[].c.a[].n`: **string** Message attachment file name
* `m[].c.a[].u`: **string** Message attachment file url
* `m[].t`: **Date** Message creation timestamp
* `m[].p`: **boolean** Message is pinned if applicable
* `m[].e`: **Date** Message last edit timestamp if applicable
* `m[].es`: **Array{}** Message edits if exists (Not working)
* `m[].es[string]:` **string** Message edit content