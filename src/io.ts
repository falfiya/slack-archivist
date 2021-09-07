import * as fs from "fs";
import {dirname} from "path";
import {Struct} from "./Struct";

export {existsSync} from "fs";

function stringifyObject(record: object) {
   return JSON.stringify(record, null, 3);
}

export function mkdirDeep(path: string): void {
   fs.mkdirSync(path, {recursive: true});
}

export function readStruct<T>
(path: string, recordType: Struct<T>): T
{
   return recordType.fromAny(JSON.parse(fs.readFileSync(path, "utf8")));
}

export function readStructOrDefault<T>
(path: string, recordType: Struct<T>): T
{
   try {
      return readStruct(path, recordType);
   } catch (e) {
      return recordType.default;
   }
}

export function writeObject(filename: string, record: object): void {
   fs.writeFileSync(filename, stringifyObject(record));
}

export function writeDeep(filename: string, data: string | Buffer): void {
   const enclosingDirectories = dirname(filename);
   if (!fs.existsSync(enclosingDirectories)) {
      mkdirDeep(enclosingDirectories);
   }
   fs.writeFileSync(filename, data);
}

export function writeObjectDeep(filename: string, record: object) {
   writeDeep(filename, stringifyObject(record));
}

export function puts(str: string) {
   process.stdout.write(str + "\n");
}

export function errs(str: string) {
   process.stderr.write(str + "\n");
}
