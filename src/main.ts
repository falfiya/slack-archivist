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

import {WebClient, Channel, Timestamp} from "./slack";
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

import {MessageChunks, sProgress} from "./sProgress";
import {sMessages} from "./sMessages";
import {object, string, u64} from "./types";
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
      messages_json_fd = opened.fd;

      const parsed = io.readStruct(messages_json_fd, sMessages);
      if (parsed === null) {
         io.errs(`There was an error reading the structured JSON inside "${filename}".`);
         process.exit(1);
      }
      messages_json = parsed;
   }

   // start archiving from the last known message
   const m = progress_json.messageChunks;
   var i = 0;
   while (true) {
      await sleep(3);
      if (i === MessageChunks.shadowLength(m)) break;
      const a = MessageChunks.shadow(m, i);
      const b = MessageChunks.shadow(m, i);
      if (a.latest === b.oldest) {
         io.puts(`OKAY ${a.latest} -> ${b.oldest}`)
         i++;
         continue;
      }

      io.puts(`WANT ${a.latest} -> ${b.oldest}`);
      const res = await client.conversations.history({
         channel: chan.id,
         oldest: a.latest,
         latest: b.oldest,
         inclusive: true,
         limit: u64.to_i32(config_json.messageChunkSize),
      });

      if (!res.has_more) {
         
      }

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
