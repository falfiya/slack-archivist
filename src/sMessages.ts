import {array} from "./types";
import {Message, Timestamp, TimestampContainer} from "./slack";

export type TsMessage = Message & TimestampContainer;

export class sMessages extends Array<TsMessage> {
   static default: sMessages = [];

   static parse(u: unknown): sMessages {
      if (!array.isT(u, TimestampContainer.is))
         throw new TypeError("messages_json must be an array of TimestampObject!");

      var lastTs = Timestamp.MIN;
      for (const msg of u) {
         if (msg.ts === lastTs)
            throw new TypeError("Duplicate messages!");
         if (msg.ts < lastTs)
            throw new TypeError("Messages out of order!");
         lastTs = msg.ts;
      }

      return u;
   }

   static insert(into: sMessages, msg: TsMessage): boolean {
      var upper = into.length - 1;

      if (upper === -1) {
         into.push(msg);
         return true;
      }


      if (msg.ts < into[0].ts) {
         into.unshift(msg);
         return true;
      }

      if (msg.ts === into[upper].ts) {
         return false
      }
      if (msg.ts > into[upper].ts) {
         into.push(msg);
         return true;
      }

      var lower = 1;
      // otherwise binary insert it
      while (lower !== upper) {
         const halfLength = upper - lower >> 1;
         const pivot = lower + halfLength;
         console.log(`   pivot at ${into[pivot].text}`);

         if (msg.ts === into[pivot].ts)
            return false;

         if (msg.ts < into[pivot].ts)
            upper = pivot;
         else
            lower = pivot + 1;
      }

      console.log(`   inserted ${msg.text!} by binsert`);
      into.splice(lower, 0, msg);
      return true;
   }
}
