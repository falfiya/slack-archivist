import * as io from "./io";
import {sConfig} from "./sConfig";

const cwd = process.cwd();
let config_json: sConfig;
{
   const filename = `${cwd}/config.json`;
   const opened = io.open2(filename, io.C.O_RDONLY, io.C.O_CREAT | io.C.O_WRONLY);
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

import {CustomWebClient, Channel, Timestamp, DecentMessage, DecentFile} from "./slack";
const client = new CustomWebClient(config_json.userToken);

const archiveDir = config_json.archiveDir;
io.mkdirDeep(archiveDir);

import {sChannels} from "./sChannels";
let channels_json: sChannels;
let channels_json_fd: io.fd;
{
   const filename = `${archiveDir}/channels.json`;
   const opened = io.open2(filename, io.C.O_RDWR);
   switch (opened.tag) {
   case "create":
      channels_json_fd = opened.fd;
      channels_json = sChannels.default;
      io.writeToJSON(channels_json_fd, channels_json);
      break;
   case "open":
      channels_json_fd = opened.fd;
      const parsed = io.readStruct(channels_json_fd, sChannels);
      if (parsed === null) {
         io.errs(`There was an error reading the structured JSON inside "${filename}".`);
         process.exit(1);
      }
      channels_json = parsed;
      break;
   case "error":
      io.errs(`Couldn't open "${filename}".`);
      process.exit(1);
   }
}

import {ChunkCollection, sProgress} from "./sProgress";
import {sMessages} from "./sMessages";
import {array, object, string, u64} from "./types";
import {IncomingDownload, sleep, sleep_ms} from "./util";
import {IncomingMessage} from "http";
import {O_WRONLY} from "constants";

async function archiveChannel(chan: Channel): Promise<void> {
   if (!object.hasTKey(chan, "id", string.is))
      throw new TypeError("chan.id must be a string!");

   io.puts(`${chan.id} start archive`);

   channels_json[chan.id] = chan;
   io.writeToJSON(channels_json_fd, channels_json);

   const chanDir = `${archiveDir}/${chan.id}`;
   io.mkdirDeep(chanDir);

   let progress_json: sProgress;
   let progress_json_fd: io.fd;
   {
      const filename = `${chanDir}/progress.json`;
      const opened = io.open2(filename, io.C.O_RDWR);
      switch (opened.tag) {
      case "create":
         progress_json_fd = opened.fd;
         progress_json = sProgress.default;
         io.writeToJSON(progress_json_fd, progress_json);
      break;
      case "open":
         progress_json_fd = opened.fd;
         const parsed = io.readStruct(progress_json_fd, sProgress);
         if (parsed === null) {
            io.errs(`There was an error reading the structured JSON inside "${filename}".`);
            process.exit(1);
         }
         progress_json = parsed;
      break;
      case "error":
         io.errs(`There was an error obtaining a handle to "${filename}".`);
         process.exit(1);
      }
   }

   let messages_json: sMessages;
   let messages_json_fd: io.fd;
   {
      const filename = `${chanDir}/messages.json`;
      const opened = io.open2(filename, io.C.O_RDWR);
      switch (opened.tag) {
      case "create":
         messages_json_fd = opened.fd ;
         messages_json = sMessages.default;
         io.writeToJSON(messages_json_fd, messages_json);
      break;
      case "open":
         messages_json_fd = opened.fd ;
         const parsed = io.readStruct(messages_json_fd, sMessages);
         if (parsed === null) {
            io.errs(`There was an error reading the structured JSON inside "${filename}".`);
            process.exit(1);
         }
         messages_json = parsed;
      break;
      case "error":
         io.errs(`There was an error obtaining a handle to "${filename}".`);
         process.exit(1);
      }
   }

   // start archiving from the last known message
   const cc = progress_json.messageChunks;
   let shadowIndex = 0;
   while (true) {
      if (shadowIndex > ChunkCollection.gapMax(cc))
         break;

      const gap = ChunkCollection.getGap(cc, shadowIndex);
      const paramOldest = gap.oldest;
      const paramLatest = gap.latest;

      if (paramOldest === paramLatest)
      if (paramOldest !== void 0) // guard for not start of time
      if (paramLatest !== void 0) // guard for not end of time (not required)
      {
         io.puts(`${chan.id}/${paramOldest}/${paramLatest} have chunk`);
         shadowIndex++;
         continue;
      }

      await sleep(3);
      io.puts(`${chan.id}/${paramOldest}/${paramLatest} get chunk`);
      const res = await client.conversations.history({
         channel: chan.id,
         oldest: paramOldest,
         latest: paramLatest,
         inclusive: true,
         limit: u64.to_i32(config_json.messageChunkSize),
      });

      if (!object.hasTKey(res, "messages", array.isTC(DecentMessage.is))) {
         throw new TypeError(
            "conversations.history returned an object without the messages property!");
      }

      const len = res.messages.length;
      for (let i = 0; i < len; ++i) {
         const m = res.messages[i];
         if (!object.hasTKey(m, "ts", Timestamp.is)) {
            throw new TypeError("message was missing Timestamp!");
         }

         if (!sMessages.insert(messages_json, m)) {
            io.errs(`${chan.id}/${m.ts} message already recorded`);
            continue;
         }

         if (object.hasKey(m, "files")) {
            io.puts(`${chan.id}/${m.ts} has files`);
            if (!object.hasTKey(m, "files", array.isTC(DecentFile.is))) {
               throw new Error("WTF FILES???");
            }

            for (const file of m.files) {
               if (!DecentFile.is(file)) {
                  io.errs(`${chan.id}/${m.ts} not a decent file`);
                  continue;
               }

               if (object.hasKey(progress_json.fileCompletions, file.id)) {
                  io.puts(`${chan.id}/${m.ts} file already downloaded`);
                  continue;
               }

               await sleep_ms(99);
               const thisFileDir = `${chanDir}/files/${file.id}`;
               io.mkdirDeep(thisFileDir);
               io.puts(`${chan.id}/${m.ts} downloading file`);

               const thisFile = `${thisFileDir}/${file.name}`;
               const f = io.open2(thisFile, io.C.O_WRONLY);
               if (f.tag === "error") {
                  io.errs(`cannot open ${thisFile}`);
                  continue;
               }

               const startingAt: u64 | undefined = progress_json.filesInProgress[file.id];

               let im: IncomingMessage;
               try {
                  im = await client.downloadFile(file, startingAt);
               }
               catch (e: any) {
                  io.puts("Alright guess not");
                  io.puts(e.toString());
                  continue;
               }
               const id = new IncomingDownload(im);
               let offset = Number(id.rangeStart);
               id.flow(b => {
                  const beforeOffset = offset;
                  io.write(f.fd, b, b.length, offset);
                  offset += b.length;
                  progress_json.filesInProgress[file.id] = u64.from(offset);
                  io.writeToJSON(progress_json_fd, progress_json);
                  io.put(`\r${chan.id}/${m.ts}/files/${file.id} wrote [${beforeOffset}...${offset}]`);
               });

               if (await id.finished) {
                  io.puts(`\n${chan.id}/${m.ts}/files/${file.id} done`);
                  progress_json.fileCompletions[file.id] = u64.from(Date.now()) as never;
                  delete progress_json.filesInProgress[file.id];
               }
               io.writeToJSON(progress_json_fd, progress_json);
               io.close(f.fd);
            }
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
      if (res.messages.length === 0) {
         shadowIndex++;
         continue;
      }

      let trueOldest;
      let trueLatest;
      {
         const first = res.messages[0].ts;
         const last  = res.messages[len - 1].ts;

         if (first === last) {
            // ok so this probably means we finished archiving.
            shadowIndex++;
            continue;
         }

         if (first < last) {
            trueOldest = first;
            trueLatest = last;
         } else {
            trueOldest = last;
            trueLatest = first;
         }
      }

      const finishedAt = u64.from(Date.now());
      let chunk;
      if (res.has_more) {
         chunk = {
            oldest: trueOldest,
            latest: trueLatest,
            finishedAt,
         }
      } else {
         // In most cases, we want to use the true oldest and latest. But when
         // don't we? There is one case, and that's with filling gaps of no
         // messages. I am unable to come up with a reason as to why this might
         // happen but in the event that it could, here you go.
         chunk = {
            oldest: paramOldest ?? trueOldest,
            latest: paramLatest ?? trueLatest,
            finishedAt,
         };
      }

      ChunkCollection.insert(cc, chunk);

      io.writeToJSON(messages_json_fd, messages_json);
      io.writeToJSON(progress_json_fd, progress_json);
   }

   io.close(messages_json_fd);
   io.close(progress_json_fd);
}

const allConversations = {types: "public_channel,private_channel,mpim,im"};
void async function main(): Promise<void> {
   {
      const users = await client.users.list();
      const res = io.open2(`${archiveDir}/users.json`, O_WRONLY);
      if (res.tag !== "error" && users.members !== undefined) {
         io.writeToJSON(res.fd, users.members);
         io.close(res.fd);
      }
   }

   const conversations = await client.users.conversations(allConversations);
   if (conversations.channels === void 0)
      throw new Error(conversations.error);

   for (const chan of conversations.channels)
      await archiveChannel(chan);

   io.close(channels_json_fd);
}();
