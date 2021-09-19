import {i32, object, string} from "./util";

export class sConfig {
   userToken: string;
   archiveDir: string;
   messageChunkSize: i32;

   static default: sConfig = {
      userToken: "xoxp-fill-in-the-rest-yourself",
      archiveDir: "my-slack-export-folder",
      messageChunkSize: i32.from(100),
   }

   static parse(u: unknown): sConfig {
      if (typeof u !== "object")
         throw new TypeError("config_json must be an object!");
      if (u === null)
         throw new TypeError("config_json must not be null!");
      if (!object.hasTKey(u, "userToken", string.is))
         throw new TypeError("config_json.userToken must exist!");
      if (!object.hasTKey(u, "archiveDir", string.is))
         throw new TypeError("config_json.archiveDir must exist!");
      if (!object.hasTKey(u, "messageChunkSize", i32.is))
         throw new TypeError("config_json.messageChunkSize must exist!");
      if (typeof u.userToken !== "string")
         throw new TypeError("config_json.userToken must be a string!");
      if (typeof u.archiveDir !== "string")
         throw new TypeError("config_json.archiveDir must be a string!");
      if (!i32.is(u.messageChunkSize))
         throw new TypeError("config_json.messageChunkSize must be an i32!");

      return u;
   }
}
