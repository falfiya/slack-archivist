import {Channel} from "./slack";

export class sChannels extends Array<Channel> {
   static default: sChannels = [];

   static parse(u: unknown): sChannels {
      if (!Array.isArray(u))
         throw new TypeError("channels.json should parse to an Array!");

      return u;
   }
}
