import {Channel} from "./slack";
import {object, transmute} from "./types";

export class sChannels {
   [id: string]: Channel;
   static default: sChannels = {};
   static into(u: unknown): sChannels {
      return transmute(u)
         .into(object.into)
         .it as any;
   }
}
