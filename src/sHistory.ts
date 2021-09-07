namespace FileHistory {
   namespace Status {
      export type InProgress = {
         status: "InProgress";
         completeTill: number;
      }
      export type Complete = {
         status: "Complete";
         completeAt: number;
      }
   }

   export type Status = Status.InProgress | Status.Complete;
};

export type FileHistory = {
   id: string;
   status: FileHistory.Status;
}

export type MessageHistory = {
   date: string;
   completeAt: number;
}

export class sHistory {
   fileHistory: FileHistory[];
   messageHistory: MessageHistory[];

   static default: sHistory = {fileHistory: [], messageHistory: []};

   static fromAny(a: any): sHistory {
      if (typeof a !== "object")
         throw new TypeError("history.json must be an Object!");

      if (1
      && Array.isArray(a.fileHistory)
      && Array.isArray(a.messageHistory))
         return a;

      throw new TypeError("history.json cannot be parsed to sHistory!");
   }
}
