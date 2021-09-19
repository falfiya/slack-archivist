import {notInteger, notString} from "./util";

export class sConfig {
   userToken: string;
   archiveDir: string;
   messageChunkSize: number;

   static default: sConfig = {
      userToken: "xoxp-fill-in-the-rest-yourself",
      archiveDir: "my-slack-export-folder",
      messageChunkSize: 100,
   }

   static fromAny(a: any): sConfig {
      while (1) {
         if (notString(a.userToken))
            break;
         if (notString(a.archiveDir))
            break;
         if (notInteger(a.messageChunkSize))
            break;

         return a;
      }

      throw new TypeError("Object is not a valid sConfig!");
   }
}
