import * as io from "./io";
import {sConfig} from "./sConfig";

try {
   const config = io.readStruct("config.json", sConfig);
   var userToken = config.userToken;
   var archiveDir = config.archiveDir;
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

import {WebClient, Channel} from "./slack";
const client = new WebClient(userToken);
const allConversations = {types: "public_channel,private_channel,mpim,im"};

function sleep(s: number) {
   io.puts(`sleeping for ${s} second${s === 1 ? "" : "s"}`);
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

void async function main(): Promise<void> {
   const conversations = await client.users.conversations(allConversations);
   if (conversations.channels === undefined) {
      throw new Error(conversations.error);
   }

   const channels_json = `${archiveDir}/channels.json`;

   const oChannels =
      io.readStructOrDefault(channels_json, sChannels);

   for (const chan of conversations.channels) {
      await archiveChannel(chan);
      oChannels.push(chan);
      io.writeObjectDeep(channels_json, oChannels);
   }
}();

import {sChannels} from "./sChannels";
async function archiveChannel(chan: Channel): Promise<void> {
   if (chan.id === undefined) {
      throw new TypeError("pain and suffering");
   }
}
