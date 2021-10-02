import * as io from "./io";
import {sConfig} from "./sConfig";
import {sChannels} from "./sChannels";
import {sChunks} from "./sChunks";
import {sMessages} from "./sMessages";
import {
   CustomWebClient,
   DecentChannel,
   DecentMessage,
   DecentFile
} from "./slack";
import {array, object, transmute, u64} from "./types";
import {Mushroom, sleep, sleep_ms} from "./util";
import {IncomingMessage} from "http";
import {sFiles} from "./sFiles";

const cwd = process.cwd();
let config_json: sConfig;
{
   const filename = `${cwd}/config.json`;
   const [created, fd] = io.open(filename);
   if (created) {
      io.errs("You did not make a config file so I made one for you.");
      io.writeToJSON(fd, sConfig.default);
      io.errs(`Your config file is at "${filename}".`);
      process.exit(1);
   }

   config_json = sConfig.into(io.readJSON(fd));
   io.close(fd);
}

const archiveDir = config_json.archiveDir;
const filesDir = `${archiveDir}/files`;

io.mkdirDeep(archiveDir);
let files_json: sFiles;
let files_fd: io.fd;
{
   const [created, fd] = io.open(`${archiveDir}/files.json`);
   if (created) {
      files_json = sFiles.default;
      io.writeToJSON(fd, files_json);
   } else {
      files_json = sFiles.into(io.readJSON(fd));
   }
   files_fd = fd;
}

const client = new CustomWebClient(config_json.userToken);
const allConversations = {types: "public_channel,private_channel,mpim,im"};
void async function main(): Promise<void> {
   {
      const users = await client.users.list();
      const [_, fd] = io.open(`${archiveDir}/users.json`);
      // fix this later
      io.writeToJSON(fd, users.members);
      io.close(fd);
   }

   const conversations = await client.users.conversations(allConversations);
   if (conversations.channels === void 0) {
      throw new TypeError(conversations.error);
   }

   let channels_json: sChannels;
   let channels_fd: io.fd;
   {
      const [created, fd] = io.open(`${archiveDir}/channels.json`);
      if (created) {
         channels_json = sChannels.default;
         io.writeToJSON(fd, channels_json);
      } else {
         channels_json = sChannels.into(io.readJSON(fd));
      }
      channels_fd = fd;
   }

   const channelsDir = `${archiveDir}/channels`;
   io.mkdirDeep(channelsDir)
   for (const c of conversations.channels) {
      const chan = transmute(c)
         .into(DecentChannel.into)
         .it;

      channels_json[chan.id] = chan;
      io.writeToJSON(channels_fd, channels_json);

      await archiveChannel(chan, channelsDir);
   }

   io.close(channels_fd);
   io.close(files_fd);
}();

async function archiveChannel(chan: DecentChannel, parentDir: string): Promise<void> {
   io.puts(`${chan.id} start archive`);

   const chanDir = `${parentDir}/${chan.id}`;
   io.mkdirDeep(chanDir);

   let chunks_json: sChunks;
   let chunks_fd: io.fd;
   {
      const [created, fd] = io.open(`${chanDir}/chunks.json`);
      if (created) {
         chunks_json = sChunks.default;
         io.writeToJSON(fd, chunks_json);
      } else {
         chunks_json = sChunks.into(io.readJSON(fd));
      }
      chunks_fd = fd;
   }

   let messages_json: sMessages;
   let messages_fd: io.fd;
   {
      const [created, fd] = io.open(`${chanDir}/messages.json`);
      if (created) {
         messages_json = sMessages.default;
         io.writeToJSON(fd, messages_json);
      } else {
         messages_json = sMessages.into(io.readJSON(fd));
      }
      messages_fd = fd;
   }

   // start archiving from the last known message
   let shadowIndex = 0;
   while (true) {
      if (shadowIndex > sChunks.gapMax(chunks_json)) {
         break;
      }

      const gap = sChunks.getGap(chunks_json, shadowIndex);
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
      const finishedAt = u64.into(Date.now());

      const {messages} = transmute(res)
         .fieldInto("messages", array.intoUnknown)
         .it;
      const msgCount = messages.length;

      for (const m of messages) {
         const msg = transmute(m)
            .into(DecentMessage.into)
            .it;
         await archiveMessage(msg, messages_json);
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
            sChunks.insert(chunks_json, chunk);
            io.writeToJSON(chunks_fd, chunks_json);
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

      sChunks.insert(chunks_json, chunk);

      io.writeToJSON(messages_fd, messages_json);
      io.writeToJSON(chunks_fd, chunks_json);
   }

   io.close(messages_fd);
   io.close(chunks_fd);
}

async function archiveMessage(msg: DecentMessage, messages_json: sMessages) {
   const couldInsert = sMessages.insert(messages_json, msg);
   if (!couldInsert) {
      io.errs(`${msg.ts} has already been recorded!`);
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
   if (object.hasKey(files_json.completions, file.id)) {
      io.errs(`already have ${file.id}`);
      return;
   }

   const fileDir = `${filesDir}/${file.id}`;
   io.mkdirDeep(fileDir);
   const [created, fd] = io.open(`${fileDir}/${file.name}`);

   let startingAt: u64 | undefined;
   if (created) {
      startingAt = undefined;
   } else {
      startingAt = files_json.inProgress[file.id];
   }

   const im: IncomingMessage = await client.downloadFile(file, startingAt);
   let offset = Number(Mushroom.getRangeStart(im));

   im.on("data", (buf: Buffer) => {
      const oldOffset = offset;
      const len = buf.byteLength;

      io.write(fd, buf, len, offset);

      offset += len;
      files_json.inProgress[file.id] = u64.into(offset);

      io.writeToJSON(files_fd, files_json);
      io.put(`\r${file.id} wrote [${oldOffset}...${offset}]`);
   });

   await Mushroom.waitFor(im);
   io.puts(`\r${file.id} done`);

   delete files_json.inProgress[file.id];
   files_json.completions[file.id] = u64.into(Date.now()) as never;
   io.close(fd);

   io.writeToJSON(files_fd, files_json);
}
