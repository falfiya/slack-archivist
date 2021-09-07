import {Channel} from "./slack";

export class sChannels extends Array<Channel> {
   static default: sChannels = [];

   static fromAny(a: any): sChannels {
      if (Array.isArray(a))
         return a;
      throw new TypeError("channels.json should parse to an Array!");
   }
}
