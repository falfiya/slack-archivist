import * as fs from "fs";
import {dirname} from "path";

export {existsSync} from "fs";

function recordToString(record: object) {
   return JSON.stringify(record, null, 3);
}

export function mkdirDeep(path: string): void {
   fs.mkdirSync(path, {recursive: true});
}

export function readRecord<T = any>(path: string): T {
   return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function readRecordOr<T = any>(path: string, or: () => T): T {
   try {
      return readRecord(path);
   } catch (e) {
      return or();
   }
}

export function writeRecord(filename: string, record: object): void {
   fs.writeFileSync(filename, recordToString(record));
}

export function writeDeep(filename: string, data: string | Buffer): void {
   const enclosingDirectories = dirname(filename);
   if (!fs.existsSync(enclosingDirectories)) {
      mkdirDeep(enclosingDirectories);
   }
   fs.writeFileSync(filename, data);
}

export function writeJSONDeep(filename: string, record: object) {
   writeDeep(filename, recordToString(record));
}
