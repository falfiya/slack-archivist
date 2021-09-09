import {notArray, notInteger, notString} from "./util";

export class sConfig {
   userToken: string;
   archiveDir: string;
   jsonStringifyArguments: [any, any];
   messageChunkSize: number;

   static default: sConfig = {
      userToken: "xoxp-fill-in-the-rest-yourself",
      archiveDir: "my-slack-export-folder",
      jsonStringifyArguments: [null, 3],
      messageChunkSize: 100,
   }

   static fromAny(a: any): sConfig {
      while (1) {
         if (notString(a.userToken))
            break;
         if (notString(a.archiveDir))
            break;
         if (notArray(a.jsonStringifyArguments))
            break;
         if (notInteger(a.messageChunkSize))
            break;

         if (a.jsonStringifyArguments) {
            if (!Array.isArray(a.jsonStringifyArguments))
               break;
            if (a.jsonStringifyArguments.length !== 2)
               break;
         }

         return a;
      }

      throw new TypeError("Object is not a valid sConfig!");
   }
}
