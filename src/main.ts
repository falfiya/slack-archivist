import {WebClient} from "@slack/web-api";
import * as ConfigRecord from "./rConfig";
import * as f$ from "./f$";

var userToken = null;
var config;
try {
   config = f$.readRecord("config.json");
} catch (e) {
   if (f$.existsSync("config.json")) {
      throw e;
   } else {
      console.warn("You did not make a config file.");
      console.warn("Trying to make one for you.");
      f$.writeJSONDeep("config.json", ConfigRecord._new());
      console.warn(`Made a config.json at ${__dirname}/config.json.`);
      console.warn("Please configure and then run again.")
      process.exit(1);
   }
}

if (typeof config.userToken === "string") {
   userToken = config.userToken;
} else {
   throw new TypeError("config.userToken should be of type string!");
}

const client = new WebClient(userToken);

const conversationTypes = ["public_channel", "private_channel", "mpim", "im"];
const allConversations = {types: conversationTypes.join(",")};

void async function main() {
   const conversations = await client.users.conversations(allConversations);
   if (conversations.channels == null) {
      throw new Error(conversations.error);
   }

   for (const chan of conversations.channels) {
      
   }
}();
