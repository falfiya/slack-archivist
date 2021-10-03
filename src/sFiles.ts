import {File} from "./slack";
import {object, transmute, u64} from "./types";

type Complete = {completeAt: u64, file: File};
namespace Complete {
   export function into(u: unknown): Complete {
      return transmute(u)
         .into(object.into)
         .fieldInto("completeAt", u64.into)
         .fieldInto("file", File.into)
         .it;
   }
}

type Completions = {[id: string]: Complete};
namespace Completions {
   export function into(u: unknown): Completions {
      return transmute(u)
         .into(object.into)
         .into(object.intoIndexSignature(Complete.into))
         .it;
   };
}

/** shows the number of bytes downloaded */
type InProgress = {[id: string]: u64};
namespace InProgress {
   export function into(u: unknown): InProgress {
      return transmute(u)
         .into(object.into)
         .into(object.intoIndexSignature(u64.into))
         .it;
   }
}

export class sFiles {
   completions: Completions;
   inProgress: InProgress;

   static default(): sFiles {
      return {
         completions: {},
         inProgress: {},
      };
   }

   static into(u: unknown): sFiles {
      return transmute(u)
         .into(object.into)
         .fieldInto("completions", Completions.into)
         .fieldInto("inProgress", InProgress.into)
         .it;
   }
}
