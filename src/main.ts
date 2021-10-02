import * as io from "./io";
import {sConfig} from "./sConfig";
import {sFiles} from "./sFiles";
import {sChannels} from "./sChannels";
import {sChunks} from "./sChunks";
import {sMessages} from "./sMessages";
import {CustomWebClient, DecentChannel, DecentMessage, DecentFile} from "./slack";
import {array, object, transmute, u64} from "./types";
import {Mushroom, sleep} from "./util";
import {IncomingMessage} from "http";

const cwd = process.cwd();
let config_obj: sConfig;
{
   const filename = `${cwd}/config.json`;
   const [created, fd] = io.open(filename);
   if (created) {
      io.errs("You did not make a config file so I made one for you.");
      io.writeToJSON(fd, sConfig.default);
      io.errs(`Your config file is at "${filename}".`);
      process.exit(1);
   }

   config_obj = sConfig.into(io.readJSON(fd));
   io.close(fd);
}

const archiveDir = config_obj.archiveDir;
const filesDir = `${archiveDir}/files`;

io.mkdirDeep(archiveDir);
let files_obj: sFiles;
let files_fd: io.fd;
{
   const [created, fd] = io.open(`${archiveDir}/files.json`);
   if (created) {
      files_obj = sFiles.default();
      io.writeToJSON(fd, files_obj);
   } else {
      files_obj = sFiles.into(io.readJSON(fd));
   }
   files_fd = fd;
}

const client = new CustomWebClient(config_obj.userToken);
const allConversations = {types: "public_channel,private_channel,mpim,im"};
void async function main(): Promise<void> {
   {
      const users = await client.users.list();
      const [_, fd] = io.open(`${archiveDir}/users.json`);
      // fix this later
      io.writeToJSON(fd, users.members);
      io.close(fd);
   }

   const conversations = await client.conversations.list(allConversations);
   if (conversations.channels === void 0) {
      throw new TypeError(conversations.error);
   }

   let channels_obj: sChannels;
   let channels_fd: io.fd;
   {
      const [created, fd] = io.open(`${archiveDir}/channels.json`);
      if (created) {
         channels_obj = sChannels.default();
         io.writeToJSON(fd, channels_obj);
      } else {
         channels_obj = sChannels.into(io.readJSON(fd));
      }
      channels_fd = fd;
   }

   const channelsDir = `${archiveDir}/channels`;
   io.mkdirDeep(channelsDir)
   for (const c of conversations.channels) {
      const chan = transmute(c)
         .into(DecentChannel.into)
         .it;

      channels_obj[chan.id] = chan;
      io.writeToJSON(channels_fd, channels_obj);

      await archiveChannel(chan, channelsDir);
      io.put('\n');
   }

   io.close(channels_fd);
   io.close(files_fd);
}();

async function archiveChannel(chan: DecentChannel, parentDir: string): Promise<void> {
   io.puts(` CHAN: archiving ${chan.id}`);

   const chanDir = `${parentDir}/${chan.id}`;
   io.mkdirDeep(chanDir);

   let chunks_obj: sChunks;
   let chunks_fd: io.fd;
   {
      const [created, fd] = io.open(`${chanDir}/chunks.json`);
      if (created) {
         chunks_obj = sChunks.default();
         io.writeToJSON(fd, chunks_obj);
      } else {
         chunks_obj = sChunks.into(io.readJSON(fd));
      }
      chunks_fd = fd;
   }

   let messages_obj: sMessages;
   let messages_fd: io.fd;
   {
      const [created, fd] = io.open(`${chanDir}/messages.json`);
      if (created) {
         messages_obj = sMessages.default();
         io.writeToJSON(fd, messages_obj);
      } else {
         messages_obj = sMessages.into(io.readJSON(fd));
      }
      messages_fd = fd;
   }

   // start archiving from the last known message
   let shadowIndex = 0;
   while (true) {
      if (shadowIndex > sChunks.gapMax(chunks_obj)) {
         break;
      }

      const gap = sChunks.getGap(chunks_obj, shadowIndex);
      const paramOldest = gap.oldest;
      const paramLatest = gap.latest;

      if (paramOldest === paramLatest)
      if (paramOldest !== void 0) // guard for not start of time
      if (paramLatest !== void 0) // guard for not end of time (not required)
      {
         // io.puts(`CHUNK: skipping ${paramOldest}->${paramLatest}`);
         shadowIndex++;
         continue;
      }

      io.put(`CHUNK: sleeping ${config_obj.sleepChunkSeconds}s`);
      await sleep(config_obj.sleepChunkSeconds);
      io.puts(`\rCHUNK: getting ${paramOldest}->${paramLatest}`);
      const res = await client.conversations.history({
         channel: chan.id,
         oldest: paramOldest,
         latest: paramLatest,
         inclusive: true,
         limit: u64.to_i32(config_obj.messageChunkSize),
      });
      const finishedAt = u64.into(Date.now());

      const {messages} = transmute(res)
         .fieldInto("messages", array.intoUnknown)
         .it;
      const msgCount = messages.length;

      for (const m of messages) {
         const msg = transmute(m)
            .into(DecentMessage.into)
            .it;
         await archiveMessage(msg, messages_obj);
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
      if (messages.length === 0) {
         // if the chunk is empty, we can continue on
         shadowIndex++;
         if (paramOldest !== undefined && paramLatest !== undefined) {
            const chunk = {
               oldest: paramOldest,
               latest: paramLatest,
               finishedAt,
            };
            sChunks.insert(chunks_obj, chunk);
            io.writeToJSON(chunks_fd, chunks_obj);
         }
         continue;
      }

      let trueOldest;
      let trueLatest;
      {
         const first = transmute(messages[0])
            .into(DecentMessage.into)
            .it.ts;
         const last  = transmute(messages[msgCount - 1])
            .into(DecentMessage.into)
            .it.ts;

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

      sChunks.insert(chunks_obj, chunk);

      io.writeToJSON(messages_fd, messages_obj);
      io.writeToJSON(chunks_fd, chunks_obj);
   }

   io.close(messages_fd);
   io.close(chunks_fd);
}

async function archiveMessage(msg: DecentMessage, messages_obj: sMessages) {
   const couldInsert = sMessages.insert(messages_obj, msg);
   if (!couldInsert) {
      // io.errs(`  MSG: skipping ${msg.ts}`);
   }

   if (object.hasKey(msg, "files")) {
      const files = transmute(msg.files)
         .into(array.intoT(DecentFile.into))
         .it;
      for (const file of files) {
         await archiveFile(file);
      }
   }
}

async function archiveFile(file: DecentFile) {
   if (object.hasKey(files_obj.completions, file.id)) {
      // io.puts(` FILE: skipping ${file.id}`);
      return;
   }

   io.put(` FILE: sleeping ${config_obj.sleepFileSeconds}s`);
   await sleep(config_obj.sleepFileSeconds);

   const fileDir = `${filesDir}/${file.id}`;
   io.mkdirDeep(fileDir);
   const [created, fd] = io.open(`${fileDir}/${file.name}`);

   let startingAt: u64 | undefined;
   if (created) {
      startingAt = undefined;
   } else {
      startingAt = files_obj.inProgress[file.id];
   }

   let im: IncomingMessage
   try {
      im = await client.downloadFile(file, startingAt)
   }
   catch (e: any) {
      io.errs(`\r${e}`);
      return;
   }
   const range = Mushroom.parseRange(im);
   const size = Number(range.size);
   let offset = Number(range.start);

   im.on("data", (buf: Buffer) => {
      const len = buf.byteLength;

      io.write(fd, buf, len, offset);

      offset += len;
      files_obj.inProgress[file.id] = u64.into(offset);

      io.writeToJSON(files_fd, files_obj);

      const percent = String(offset * 100 / size | 0).padStart(3);
      io.put(`\r FILE: ${file.id} ${percent}%`);
   });

   await Mushroom.waitFor(im);
   io.puts(`\r FILE: ${file.id} done`);

   delete files_obj.inProgress[file.id];
   files_obj.completions[file.id] = u64.into(Date.now()) as never;
   io.close(fd);

   io.writeToJSON(files_fd, files_obj);
}
