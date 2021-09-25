import * as io from "./io";
import {sConfig} from "./sConfig";

var config_json: sConfig;
{
   const filename = `${__dirname}/config.json`;
   const opened = io.open(filename, io.C.O_RDONLY, io.C.O_CREAT | io.C.O_WRONLY);
   switch (opened.tag) {
   case "create":
      io.errs("You did not make a config file so I made one for you.");
      io.writeToJSON(opened.fd, sConfig.default);
      io.errs(`Your config file is at "${filename}".`);
      process.exit(1);
   case "error":
      io.errs(opened.error.toString());
      io.errs(`There was an error obtaining a handle to "${filename}".`);
      process.exit(1);
   case "open":
      const parsed = io.readStruct(opened.fd, sConfig);
      if (parsed === null) {
         io.errs(`There was an error reading the structured JSON inside "${filename}".`);
         io.errs("Either correct it or remove it manually.");
         process.exit(1);
      }
      config_json = parsed;
   }
   io.close(opened.fd);
}

import {WebClient, Channel, Timestamp, TimestampContainer} from "./slack";
const client = new WebClient(config_json.userToken);

const archiveDir = config_json.archiveDir;
io.mkdirDeep(archiveDir);

import {sChannels} from "./sChannels";
var channels_json: sChannels;
var channels_json_fd: io.fd;
{
   const filename = `${archiveDir}/channels.json`;
   const opened = io.open(filename, io.C.O_RDWR);
   if (opened.tag === "error") {
      io.errs(`Couldn't open "${filename}".`);
      process.exit(1);
   }
   channels_json_fd = opened.fd;

   const parsed = io.readStruct(channels_json_fd, sChannels);
   if (parsed === null) {
      io.errs(`There was an error reading the structured JSON inside "${filename}".`);
      process.exit(1);
   }
   channels_json = parsed;
}

import {ChunkCollection, sProgress} from "./sProgress";
import {sMessages} from "./sMessages";
import {array, object, string, u64} from "./types";
import {sleep} from "./util";

async function archiveChannel(chan: Channel): Promise<void> {
   if (!object.hasTKey(chan, "id", string.is))
      throw new TypeError("chan.id must be a string!");

   const chanDir = `${archiveDir}/${chan.id}`;
   io.mkdirDeep(chanDir);

   var progress_json: sProgress;
   var progress_json_fd: io.fd;
   {
      const filename = `${chanDir}/progress.json`;
      const opened = io.open(filename, io.C.O_RDWR);
      if (opened.tag === "error") {
         io.errs(`There was an error obtaining a handle to "${filename}".`);
         process.exit(1);
      }
      progress_json_fd = opened.fd;

      const parsed = io.readStruct(progress_json_fd, sProgress);
      if (parsed === null) {
         io.errs(`There was an error reading the structured JSON inside "${filename}".`);
         process.exit(1);
      }
      progress_json = parsed;
   }

   var messages_json: sMessages;
   var messages_json_fd: io.fd;
   {
      const filename = `${chanDir}/messages.json`;
      const opened = io.open(filename, io.C.O_RDWR);
      if (opened.tag === "error") {
         io.errs(`There was an error obtaining a handle to "${filename}".`);
         process.exit(1);
      }
      messages_json_fd = opened.fd ;

      const parsed = io.readStruct(messages_json_fd, sMessages);
      if (parsed === null) {
         io.errs(`There was an error reading the structured JSON inside "${filename}".`);
         process.exit(1);
      }
      messages_json = parsed;
   }

   // start archiving from the last known message
   const cc = progress_json.messageChunks;
   var i = 0;
   while (true) {
      await sleep(3);
      if (i === ChunkCollection.shadowLength(cc)) break;
      const a = ChunkCollection.shadow(cc, i);
      const b = ChunkCollection.shadow(cc, i);

      if (a.latest === b.oldest)
      if (a.latest !== undefined) // guard for not start of time
      if (b.oldest !== undefined) // guard for not end of time (not required)
      {
         io.puts(`OKAY ${a.latest} -> ${b.oldest}`)
         i++;
         continue;
      }

      var oldest = a.latest;
      var latest = b.oldest;
      io.puts(`WANT ${a.latest} -> ${b.oldest}`);
      const res = await client.conversations.history({
         channel: chan.id,
         oldest,
         latest,
         // inclusive: true,
         limit: u64.to_i32(config_json.messageChunkSize),
      });

      if (!object.hasTKey(res, "messages", array.isTC(TimestampContainer.is))) {
         throw new TypeError(
            "conversations.history returned an object without the messages property!");
      }

      const len = res.messages.length;
      for (var i = 0; i < len; ++i) {
         const m = res.messages[i];
         if (!object.hasTKey(m, "ts", Timestamp.is)) {
            throw new TypeError("message was missing Timestamp!");
         }

         if (!sMessages.insert(messages_json, m)) {
            io.errs(`Already have ${m.ts}, skipping...`);
         }
      }

      // When a chunk of messages comes in, there's a bit that we have to do to
      // record what's happened. Firstly, we shove it into that messages array.
      // (you can see me doing that above this comment)
      // secondly, we need to record the progress.

      // Imagine that this is the first time we've started the archiver. Right
      // now, there is no progress and so oldest and latest are undefined.
      // So when recording that we downloaded a message chunk, clearly we'll
      // need something more than just the parameters we passed to the API call.
      // We'll need to know the "true" oldest and latest message.

      // As far as I'm aware, the Slack API generally responds with messages in
      // reverse chronological order. In the cases where it doesn't, it's in
      // chronological order. It should be pretty safe to say that the oldest
      // message is either at the front or the back of the array. Same thing
      // with the latest message.

      // Let's just compute the true oldest and latest here:
      {
         const first = res.messages[0].ts;
         const last  = res.messages[len - 1].ts;

         if (first === last) {
            const sErr = ""
               + "When downloading a chunk, the first and last timestamps were"
               + "the same.\nI hadn't planned for this since I thought it was"
               + "impossible but if\nyou're seeing this message, apparently it"
               + "actually happened.\n"
               + "Sorry. You should probably open a bug report.";
            throw new TypeError(sErr);
         }

         if (first < last) {
            var trueOldest = first;
            var trueLatest = last;
         } else {
            var trueOldest = last;
            var trueLatest = first;
         }
      }

      // When do we want to use the true oldest and latest?
      // Well, at least if the parameter oldest and latest were undefined, we
      // would probably like to use them.
      oldest ??= trueOldest;
      latest ??= trueLatest;

      // But wait, what about if we fetch a giant gap?

      io.writeToJSON(messages_json_fd, messages_json);
      io.writeToJSON(progress_json_fd, progress_json);
   }

   channels_json[chan.id] = chan;
   io.close(messages_json_fd);
   io.close(progress_json_fd);
}

const allConversations = {types: "public_channel,private_channel,mpim,im"};
void async function main(): Promise<void> {
   const conversations = await client.users.conversations(allConversations);
   if (conversations.channels === undefined)
      throw new Error(conversations.error);

   for (const chan of conversations.channels)
      await archiveChannel(chan);

   io.close(channels_json_fd);
}();
