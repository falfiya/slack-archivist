import {DecentFile} from "./slack";
import {object, transmute, u64} from "./types";

export type Complete = {completeAt: u64, file: DecentFile};
export type Completions = {[id: string]: Complete};
export namespace Completions {
   export function into(u: unknown): Completions {
      return transmute(u)
         .into(object.into)
         .it as any;
   };
}

/** shows the number of bytes downloaded */
export type InProgress = {[id: string]: u64};
export namespace InProgress {
   export function into(u: unknown): InProgress {
      return transmute(u)
         .into(object.into)
         .it as any;
   }
}

export class sFiles {
   completions: Completions;
   inProgress: InProgress;

   static default: sFiles = {
      completions: {},
      inProgress: {},
   };

   static into(u: unknown): sFiles {
      return transmute(u)
         .into(object.into)
         .fieldInto("completions", Completions.into)
         .fieldInto("inProgress", InProgress.into)
         .it;
   }
}
