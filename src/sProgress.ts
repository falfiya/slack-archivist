export type Finished = {
   status: "Finished";
   finishedAt: number;
}

export type FileInProgress = {
   status: "FileInProgress";
   bytesDownloaded: number;
}

export class sProgress {
   files: {[id: string]: Finished | FileInProgress};
   messages: {[ts: string]: Finished};
   messageLatestTimestamp?: string;

   static default: sProgress = {files: {}, messages: {}};

   static fromAny(a: any): sProgress {
      if (typeof a !== "object")
         throw new TypeError("history.json must be an Object!");

      if (1
      && Array.isArray(a.fileHistory)
      && Array.isArray(a.messageHistory))
         return a;

      throw new TypeError("history.json cannot be parsed to sHistory!");
   }
}
