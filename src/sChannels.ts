import {Channel} from "./slack";
import {object} from "./types";

export class sChannels {
   [id: string]: Channel;

   static default: sChannels = {};

   static parse(u: unknown): sChannels {
      if (!object.is(u))
         throw new TypeError("channels.json should parse to an Array!");

      return u as any;
   }
}
