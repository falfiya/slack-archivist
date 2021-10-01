import {Channel} from "./slack";
import {object} from "./types";

export class sChannels {
   [id: string]: Channel;
   static default: sChannels = {};
   static parse(u: unknown): sChannels {
      object.assert(u);
      return u as any;
   }
}
