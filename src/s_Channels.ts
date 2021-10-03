import {Channel} from "./slack";
import {object, transmute} from "./types";

export class sChannels {
   [id: string]: Channel;

   static default(): sChannels {
      return {};
   }

   static into(u: unknown): sChannels {
      return transmute(u)
         .into(object.into)
         .into(object.intoIndexSignature(Channel.into))
         .it;
   }
}
