import {User} from "./slack";
import {object, transmute} from "./types";

export class sUsers {
   [id: string]: User;

   static default(): sUsers {
      return {};
   }

   static into(u: unknown): sUsers {
      return transmute(u)
         .into(object.into)
         .into(object.intoIndexSignature(User.into))
         .it;
   }
}
