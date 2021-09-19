import {Timestamp} from "./slack";
import {string, object, array, u64} from "./types";

export type FileCompletions = {[id: string]: number};
namespace FileCompletions {
   export const is: (u: unknown) => u is FileCompletions =
      object.is as any;
}

export type FileInProgress = {
   id: string;
   bytesDownloaded: u64;
   bytesNeeded: u64;
} | null;

namespace FileInProgress {
   export function is(u: unknown): u is FileInProgress {
      if (typeof u !== "object") return false;
      if (u === null) return true;
      return 1
         && object.hasTKey(u, "id", string.is)
         && object.parseTKey(u, "bytesDownloaded", u64.parse)
         && object.parseTKey(u, "bytesNeeded", u64.parse)
   }
}

export type MessageChunk = {
   oldest: Timestamp;
   latest: Timestamp;
   finishedAt: u64;
}

export namespace MessageChunk {
   export const is = (u: unknown): u is MessageChunk => 1
      && object.is(u)
      && object.hasTKey(u, "oldest", Timestamp.is)
      && object.hasTKey(u, "latest", Timestamp.is)
      && object.hasTKey(u, "finishedAt", string.is)
}

export class sProgress {
   fileCompletions: {[id: string]: number};
   fileInProgress: FileInProgress;
   messageChunks: MessageChunk[];

   static default: sProgress = {
      fileCompletions: {},
      fileInProgress: null,
      messageChunks: [],
   };

   static parse(u: unknown): sProgress {
      if (!object.is(u))
         throw new TypeError(`progress_json must be an object!`);
      if (!object.hasTKey(u, "fileCompletions", FileCompletions.is))
         throw new TypeError("progress_json.fileCompletions must be a FileCompletions!");
      if (!object.hasTKey(u, "fileInProgress", FileInProgress.is))
         throw new TypeError("progress_json.fileInProgress must be a FileInProgress!");
      if (!object.hasTKey(u, "messageChunks", array.isTC(MessageChunk.is)))
         throw new TypeError("progress_json.messageChunks must exist!");

      if (u.messageChunks.length > 1) {
         const s = "progress_json.messageChunks";
         const len = u.messageChunks.length;
         var lastLatest = u.messageChunks[0].latest;
         for (let i = 1; i < len; ++i) {
            const curr = u.messageChunks[i];
            if (lastLatest !== curr.oldest) {
               throw new Error(`Gap between ${s}[${i - 1}] and ${s}[${i}]!`);
            }
            lastLatest = curr.latest;
         }
      }

      return u;
   }
}
