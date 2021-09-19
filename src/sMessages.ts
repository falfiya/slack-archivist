import {Message, TS} from "./slack";
import {expect, isArray} from "./util";

export class sMessages extends Array<Message> {
   static default: sMessages = [];

   static parse(u: unknown): sMessages {
      if (!isArray(u)) {
         throw new TypeError("messages-json must be an Array!")
      }

      var lastTs = "0000000000.000000" as TS;
      for (const msg of u) {
         if
         expect(msg.ts, "msg.ts was undefined while loading messages.json");
         if (msg.ts <= lastTs) {
            throw new Error("messages out of order!");
         }
         lastTs = msg.ts;
      }

      return u;
   }

   static insert(into: sMessages, msg: Message): boolean {
      // save us time if it's the first or last message
      var lower = 1;
      var upper = into.length - 1;

      if (upper === -1) {
         into.push(msg);
         return true;
      }

      if (msg.ts! < into[0].ts!) {
         into.unshift(msg);
         return true;
      }

      if (msg.ts! > into[upper].ts!) {
         into.push(msg);
         return true;
      }

      // otherwise binary insert it
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

      into.splice(lower, 0, msg);
      return true;
   }
}
