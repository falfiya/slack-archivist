import {File} from "./slack";

export class sFiles extends Array<File> {
   static default: sFiles = [];

   static parse(u: unknown): sFiles {
      if (!Array.isArray(u))
         throw new TypeError("files.json should parse to an Array!");

      return u;
   }
}
