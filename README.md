# @coalpha/slack-archivist

<img src="misc/icon.png" width="100px"/>

## how to set up the app

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and create an
   app.
2. "OAuth & Permissions" > "Scopes" > "User Token Scopes" add the following:
   - `calls:read`
   - `channels:history`
   - `channels:read`
   - `files:read`
   - `groups:history`
   - `groups:read`
   - `im:history`
   - `im:read`
   - `links:read`
   - `mpim:history`
   - `mpim:read`
   - `pins:read`
   - `reactions:read`
   - `stars:read`
   - `team:read`
   - `usergroups:read`
   - `users.profile:read`
   - `users:read`
   - `users:read.email`
3. Either under "Install App" or "OAuth & Permissions", hit the button that says
   "Install to Workspace".
4. At this point, you should be presented with a user token that starts with
`xoxp-`. Copy that and save it for later.
5. Clone this repository.
6. `make`
7. A `config.json` file will be created for you. Enter the token you got before
   into the `"userToken"` field.

## other information

This archivist is quite robust. You can `ctrl+c` it at any time and it should
pick up right where it left off. You can run it more than once or you can run it
whenever. Shouldn't really matter. Don't mess with the generated json since the
archiver will do some integrity checking.

## export structure

```
$archive_dir
> channels.json
> channels
   > $channel_id
      > chunks.json
      > messages.json
> files.json
> files
   > $file_id
      > $filename
> users.json
```

## known issues

- If you delete messages on a message boundary
