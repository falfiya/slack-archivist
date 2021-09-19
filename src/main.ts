import * as io from "./io";
import {sConfig} from "./sConfig";

var config: sConfig;
{
   const filename = `${__dirname}/config.json`;
   const res = io.open(filename, io.C.O_RDONLY);
   switch (res.tag) {
   case "create":
      io.errs("You did not make a config file so I made one for you.");
      io.writeToJSON(res.fd, sConfig.default);
      io.errs(`Your config file is at ${filename}.`);
      process.exit(1);
   case "error":
      io.errs(res.error.toString());
      io.errs(`There was an error obtaining a handle to ${filename}.`);
      process.exit(1);
   case "open":
      const parsed = io.readStruct(res.fd, sConfig);
      if (parsed === null) {
         io.errs(`There was an error reading the structured JSON inside ${filename}.`);
         io.errs("Either correct it or remove it manually.");
         process.exit(1);
      }
      config = parsed;
   }
   io.close(res.fd);
}

import {WebClient, Channel, Timestamp} from "./slack";
const client = new WebClient(config.userToken);
const allConversations = {types: "public_channel,private_channel,mpim,im"};

import {sProgress} from "./sProgress";
import {sMessages} from "./sMessages";
import {sChannels} from "./sChannels";
import {object} from "./types";
const archiveDir = config.archiveDir;

namespace channels_json {
   const path = `${archiveDir}/channels.json`;
   export var fd: number;
   export var o: sChannels;
   const res = io.open(path, io.C.O_RDWR);
   switch (res.tag) {
   case "create":
      res
      break;
   case "open":
      fd = res.fd;
      try {
         o = io.readStruct(fd, sChannels);
      }
      catch (e) {
         io.errs(String(e));
         io.errs(`There was an error reading the structured JSON inside ${path}.`);
         io.errs("Correct the JSON or delete the file manually.");
      }
      break;
   case "error":
      io.errs(res.error.toString());
      io.errs(`There was an error opening ${path}.`);
      io.errs("Did you do something funny with permissions?");
      break;
   }
}


async function archiveChannel(chan: Channel): Promise<void> {
   if (chan.id === undefined)
      throw new TypeError("chan.id was undefined!");
   const chanDir = `${archiveDir}/${chan.id}`;
   const progress_json = `${chanDir}/progress.json`;
   const messages_json = `${chanDir}/messages.json`;

   io.puts("archiving from the past");

   var lastLatest: Timestamp | null = null;

   do {
      await sleep(3);

      const oProgress = io.readStructOrDefault(progress_json, sProgress);
      var res = await client.conversations.history({
         channel: chan.id,
         latest: oProgress.messageLatestTimestamp,
      });

      const oMessages = io.readStructOrDefault(messages_json, sMessages);
      for (const msg of res.messages) {
         expect(msg.ts, "msg.ts was undefined!");
         if (object.hasKey(oProgress.messages, msg.ts)) {
            continue;
         }

         sMessages.insert(oMessages, msg);
         oProgress.messageLatestTimestamp = msg.ts;
         oProgress.messages[msg.ts] = {status: "Finished", finishedAt: Date.now()};
      }

      io.writeToJSONDeep(messages_json, oMessages);
      io.writeToJSONDeep(progress_json, oProgress);

      throw 69;
   } while (res.has_more);

   const oChannels = io.readStructOrDefault(channels_json, sChannels);
   oChannels.push(chan);
   io.writeToJSONDeep(channels_json, oChannels);
}

void async function main(): Promise<void> {
   const conversations = await client.users.conversations(allConversations);
   if (conversations.channels === undefined)
      throw new Error(conversations.error);

   for (const chan of conversations.channels)
      await archiveChannel(chan);
}();
