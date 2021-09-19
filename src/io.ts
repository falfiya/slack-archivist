import * as fs from "fs";
import {dirname} from "path";
import {Struct} from "./Struct";

export {existsSync, openSync, closeSync, constants as C} from "fs";

function toJSON(what: any): string {
   return JSON.stringify(
      what,
      null,
      3,
   );
}

export function mkdirDeep(path: string): void {
   fs.mkdirSync(path, {recursive: true});
}

export function readStruct<T>
(f: fs.PathOrFileDescriptor, recordType: Struct<T>): T
{
   return recordType.parse(JSON.parse(fs.readFileSync(f, "utf8")));
}

export function readStructOrDefault<T>
(f: fs.PathOrFileDescriptor, recordType: Struct<T>): T
{
   try {
      return readStruct(f, recordType);
   } catch (e) {
      return recordType.default;
   }
}

export function writeToJSON(f: fs.PathOrFileDescriptor, what: any): void {
   fs.writeFileSync(f, toJSON(what));
}

export function writeDeep(filename: string, data: string | Buffer): void {
   const enclosingDirectories = dirname(filename);
   if (!fs.existsSync(enclosingDirectories)) {
      mkdirDeep(enclosingDirectories);
   }
   fs.writeFileSync(filename, data);
}

export function writeToJSONDeep(filename: string, what: any) {
   writeDeep(filename, toJSON(what));
}

export function puts(str: string) {
   process.stdout.write(str + "\n");
}

export function errs(str: string) {
   process.stderr.write(str + "\n");
}
