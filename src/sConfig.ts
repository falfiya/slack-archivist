import {object, string, u64} from "./types";

export class sConfig {
   userToken: string;
   archiveDir: string;
   messageChunkSize: u64;

   static default: sConfig = {
      userToken: "xoxp-fill-in-the-rest-yourself",
      archiveDir: "my-slack-export-folder",
      messageChunkSize: u64.from(100),
   }

   static parse(u: unknown): sConfig | null {
      if (typeof u === "object")
      if (u !== null)
      if (object.hasTKey(u, "userToken", string.is))
      if (object.hasTKey(u, "archiveDir", string.is))
      if (object.parseTKey(u, "messageChunkSize", u64.parse))
         return u;
      return null;
   }
}
