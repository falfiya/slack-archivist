import {Message} from "./slack";
import {expect} from "./util";

export class sMessages extends Array<Message> {
   static default: sMessages = [];

   static fromAny(a: any): sMessages {
      if (!Array.isArray(a)) {
         throw new TypeError("messages.json should parse to an Array!")
      }

      var lastTs = "0000000000.000000";
      for (const msg of a as sMessages) {
         expect(msg.ts, "msg.ts was undefined while loading messages.json");
         if (msg.ts <= lastTs) {
            throw new Error("messages out of order!");
         }
         lastTs = msg.ts;
      }

      return a;
   }

   static insert(into: sMessages, msg: Message): boolean {
      // save us time if it's the first or last message
      if (msg.ts! < into[0].ts!) {
         var lower = 0;
      } else
      if (msg.ts! > into[into.length - 1].ts!) {
         var lower = into.length;
      } else // binary search it
      {
         var lower = 1;
         var upper = into.length - 1;
         while (lower !== upper) {
            const halfLength = upper - lower >> 1;
            const pivot = lower + halfLength;
            if (msg.ts! < into[pivot].ts!) {
               upper = pivot;
               continue;
            }
            if (msg.ts! > into[pivot].ts!) {
               lower = pivot + 1;
               continue;
            }
            return false;
         }
      }

      into.splice(lower, 0, msg);
      return true;
   }
}
