import {DecentChannel} from "./slack";
import {object, transmute} from "./types";

export class sChannels {
   [id: string]: DecentChannel;
   static default(): sChannels {
      return {};
   }
   static into(u: unknown): sChannels {
      return transmute(u)
         .into(object.into)
         .it as any;
   }
}
