import * as io from "./io";

import {sConfig} from "./sConfig";
try {
   const config = io.readStruct("config.json", sConfig);
   var userToken = config.userToken;
   var archiveDir = config.archiveDir;
   if (config.jsonStringifyArguments) {
      io.pJSONStringifyArguments[0] = config.jsonStringifyArguments[0];
      io.pJSONStringifyArguments[1] = config.jsonStringifyArguments[1];
   }
} catch (e) {
   if (io.existsSync("config.json")) {
      throw e;
   } else {
      io.errs("You did not make a config file.");
      console.warn("Trying to make one for you.");
      io.writeObjectDeep("config.json", sConfig.default);
      io.errs(`Made a config.json at ${__dirname}/config.json.`);
      io.errs("Please configure and then run again.")
      process.exit(1);
   }
}

import {WebClient, Channel, dateFromTS} from "./slack";
const client = new WebClient(userToken);
const allConversations = {types: "public_channel,private_channel,mpim,im"};

import {sProgress} from "./sProgress";
import {sMessages} from "./sMessages";
import {sChannels} from "./sChannels";
import {expect, hasKey, sleep} from "./util";
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

         (msg as any).date = dateFromTS(msg.ts).toString();

         sMessages.insert(oMessages, msg);
         oProgress.messageLatestTimestamp = msg.ts;
         oProgress.messages[msg.ts] = {status: "Finished", finishedAt: Date.now()};
      }

      io.writeObjectDeep(messages_json, oMessages);
      io.writeObjectDeep(progress_json, oProgress);

      throw 69;
   } while (res.has_more);

   const oChannels = io.readStructOrDefault(channels_json, sChannels);
   oChannels.push(chan);
   io.writeObjectDeep(channels_json, oChannels);
}

void async function main(): Promise<void> {
   const conversations = await client.users.conversations(allConversations);
   if (conversations.channels === undefined)
      throw new Error(conversations.error);

   for (const chan of conversations.channels)
      await archiveChannel(chan);
}();
