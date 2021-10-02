import {array, transmute} from "./types";
import {Timestamp, DecentMessage} from "./slack";

export class sMessages extends Array<DecentMessage> {
   static default(): sMessages {
      return [];
   }

   static into(u: unknown): sMessages {
      const ary = transmute(u)
         .into(array.intoT(DecentMessage.into))
         .it;

      let lastTs = Timestamp.MIN;
      for (const msg of ary) {
         if (msg.ts === lastTs) {
            throw new TypeError("Duplicate message!");
         }
         if (msg.ts < lastTs) {
            throw new TypeError("Message out of order!");
         }
         lastTs = msg.ts;
      }

      return ary;
   }

   static insert(into: sMessages, msg: DecentMessage): boolean {
      let upper = into.length - 1;

      if (upper === -1) {
         into.push(msg);
         return true;
      }

      if (msg.ts === into[0].ts) {
         return false;
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

      let lower = 1;
      // otherwise binary insert it
      while (lower !== upper) {
         const halfLength = upper - lower >> 1;
         const pivot = lower + halfLength;
         if (msg.ts < into[pivot].ts) {
            upper = pivot;
            continue;
         }
         if (msg.ts > into[pivot].ts) {
            lower = pivot + 1;
            continue;
         }
         return false;
      }

      // invariant: check if the message is the same as the two next to it
      if (msg.ts === into[lower - 1].ts || msg.ts === into[lower + 0].ts) {
         return false;
      }

      into.splice(lower, 0, msg);
      return true;
   }
}
