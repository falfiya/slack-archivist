import {File} from "./slack";

export class sFiles extends Array<File> {
   static default: sFiles = [];

   static fromAny(a: any): sFiles {
      if (Array.isArray(a))
         return a;
      throw new TypeError("files.json should parse to an Array!")
   }
}
