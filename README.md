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

If you delete messages on a message boundary and there's an unarchived gap on
either side of that deleted message, you'll have to manually change `chunks.json`.
It's not ideal and the way to fix this would be to check the adjacent messages in
`messages.json` and see if they exist until we can find a valid message. Right
now, not a super big concern of mine.

## how stuff is written

~~poorly~~

It's actually not written poorly. This code should be pretty dang robust. If
something is not as expected. An error will be thrown etc. It won't just barrel
on.

This is my first time doing one of these bits where I actually try to explain
the code. Throughout this repository, there are a lot of functions named `into`.
Each of these is associated with a type. Perhaps `from` might've been a better
name for these functions but I'm fine with `into`, right now. Their job is to
take some opaque value and turn it into their type. Let's have a quick example
here.

```ts
type HasFoo = {foo: number};
function intoFoo(u: unknown): HasFoo {
   return transmute(u)
      .into(object.into)
      .fieldInto("foo", number.into)
      .it;
}
```

What's that `transmute` thing? Well, am I sure glad you asked. It's my way of
safely and incrementally chaining type transformations until I eventually reach
an end type in `.it` that matches the desired output type. The details of it
are somewhat gorey so I suggest just trying to understand what it does from the
outside. Should be readable enough.

