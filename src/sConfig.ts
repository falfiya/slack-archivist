import {object, string, u64, transmute} from "./types";

export class sConfig {
   userToken: string;
   archiveDir: string;
   messageChunkSize: u64;

   static default: sConfig = {
      userToken: "xoxp-fill-in-the-rest-yourself",
      archiveDir: "my-slack-export-folder",
      messageChunkSize: u64.into(100),
   }

   static into(u: unknown): sConfig {
      return transmute(u)
         .into(object.into)
         .fieldInto("userToken", string.into)
         .fieldInto("archiveDir", string.into)
         .fieldInto("messageChunkSize", u64.into)
         .it;
   }
}
