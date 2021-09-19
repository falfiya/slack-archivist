import {isTS, TS} from "./slack";
import {hasKey, isArray, isTArray} from "./util";

export type FileInProgress = {
   id: string;
   bytesDownloaded: number;
   bytesNeeded: number;
} | null;

namespace FileInProgress {
   export function is(u: unknown): u is FileInProgress {
      if (typeof u !== "object") return false;
      if (u === null) return true;
      return 1
         && hasKey(u, "id")
         && hasKey(u, "bytesDownloaded")
         && hasKey(u, "bytesNeeded")
         && typeof u.id === "string"
         && typeof u.bytesDownloaded === "number"
         && typeof u.bytesNeeded === "number";
   }
}

export type MessageChunk = {
   oldest: TS;
   latest: TS;
   finishedAt: number;
}

export namespace MessageChunk {
   export const is = (u: unknown): u is MessageChunk => 1
      && typeof u === "object"
      && u !== null
      && hasKey(u, "oldest")
      && hasKey(u, "latest")
      && hasKey(u, "finishedAt")
      && isTS(u.oldest)
      && isTS(u.latest)
      && typeof u.finishedAt === "number";
}

export class sProgress {
   fileFinishedAt: {[id: string]: number};
   fileInProgress: FileInProgress | null;
   messageChunks: MessageChunk[];

   static default: sProgress = {
      fileFinishedAt: {},
      fileInProgress: null,
      messageChunks: [],
   };

   static fromAny(u: unknown): sProgress {
      const sPJ = "progress_json";
      if (typeof u !== "object")
         throw new TypeError(`${sPJ} must be an Object!`);

      if (u === null)
         throw new TypeError(`${sPJ} must not be null!`);

      if (!hasKey(u, "fileFinishedAt"))
         throw new TypeError(`${sPJ}.files must exist!`);

      if (typeof u.fileFinishedAt !== "object")
         throw new TypeError(`${sPJ}.files must be an Object!`);

      // we're not gonna check progress_json.files because we don't actually end
      // up using it. it's entirely for the user's purposes.

      if (!hasKey(u, "fileInProgress"))
         throw new TypeError(`${sPJ}.fileInProgress must exist!`);

      if (!FileInProgress.is(u.fileInProgress))
         throw new TypeError(`${sPJ}.fileInProgress is not a FileInProgress!`)

      if (!hasKey(u, "messageChunks"))
         throw new TypeError("progress_json.messageChunks must exist!");

      if (!isArray(u.messageChunks))
         throw new TypeError("progress_json.messageChunks must be an Array!");

      if (!isTArray(u.messageChunks, MessageChunk.is))
         throw new TypeError("progress_json.messageChunks must be an Array of MessageChunks!")

      return u as any;
   }
}
