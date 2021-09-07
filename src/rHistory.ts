namespace FileHistoryStatus {
   export type InProgress = {
      status: "InProgress";
      completeTill: number;
   }
   export type Complete = {
      status: "Complete";
      completeAt: number;
   }
}

export type FileHistoryStatus =
   | FileHistoryStatus.InProgress
   | FileHistoryStatus.Complete;

export type FileHistoryRecord = {
   id: string;
   status: FileHistoryStatus;
}

export type MessageHistoryRecord = {
   date: string;
   completeAt: number;
}

export type HistoryRecord = {
   fileHistory: FileHistoryRecord[];
   messageHistory: MessageHistoryRecord[];
}

export function _new(): HistoryRecord {
   return {fileHistory: [], messageHistory: []};
};
