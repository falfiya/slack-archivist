import * as io from "./io";

import {sConfig} from "./sConfig";
try {
   var config_fd = io.openSync("config.json", io.C.O_RDONLY)
} catch (e) {
   if (io.existsSync("config.json")) throw e;

   io.errs("You did not make a config file.");
   console.warn("Trying to make one for you.");
   io.writeToJSONDeep("config.json", sConfig.default);
   io.errs(`Made a config.json at ${__dirname}/config.json.`);
   io.errs("Please configure and then run again.")
   process.exit(1);
}

const config = io.readStruct(config_fd, sConfig);

import {WebClient, Channel, dateFromTS} from "./slack";
const client = new WebClient(config.userToken);
const allConversations = {types: "public_channel,private_channel,mpim,im"};

import {sProgress} from "./sProgress";
import {sMessages} from "./sMessages";
import {sChannels} from "./sChannels";
import {expect, hasKey, sleep} from "./util";
const archiveDir = config.archiveDir;
const channels_json = `${archiveDir}/channels.json`;

async function archiveChannel(chan: Channel): Promise<void> {
   expect(chan.id, "channel id was undefined!");
   const chanDir = `${archiveDir}/${chan.id}`;
   const progress_json = `${chanDir}/progress.json`;
   const messages_json = `${chanDir}/messages.json`;

   do {
      await sleep(3);

      const oProgress = io.readStructOrDefault(progress_json, sProgress);
      var res = await client.conversations.history({
         channel: chan.id,
         latest: oProgress.messageLatestTimestamp,
      });
      expect(res.messages, "res.messages was undefined!");

      const oMessages = io.readStructOrDefault(messages_json, sMessages);
      for (const msg of res.messages) {
         expect(msg.ts, "msg.ts was undefined!");
         if (hasKey(oProgress.messages, msg.ts)) {
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
