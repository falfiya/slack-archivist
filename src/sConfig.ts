import {object, string, u64} from "./types";

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
      object.assert(u);

      object.assertKey(u, "userToken", string.assert);
      object.assertKey(u, "archiveDir", string.assert);
      object.intoKey(u, "messageChunkSize", u64.into);

      return u;
   }
}
