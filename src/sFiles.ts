import {DecentFile} from "./slack";
import {array, transmute} from "./types";

export class sFiles extends Array<DecentFile> {
   static default: sFiles = [];

   static into(u: unknown): sFiles {
      return transmute(u)
         .into(array.intoT(DecentFile.into))
         .it;
   }
}
