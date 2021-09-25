import * as fs from "fs";
export {constants as C} from "fs";

declare const fd_s: unique symbol;
export type fd_o = {[fd_s]: void};
export type fd = fd_o & number;

type Open   = {tag: "open"  ; fd: fd};
type Create = {tag: "create"; fd: fd};
type Error  = {tag: "error" ; error: Error};

/**
 * remember to mkdirDeep before calling this
 * @param mode should not include O_CREAT
 */
export function open
( path : string
, mode1: number
, mode2: number = mode1 | fs.constants.O_CREAT
): Open | Create | Error
{
   try {
      const fd = fs.openSync(path, mode1) as fd;
      return {tag: "open", fd};
   }
   catch (_) {}

   try {
      const fd = fs.openSync(path, mode2) as fd;
      return {tag: "create", fd};
   }
   catch (error: any) {
      return {tag: "error", error};
   }
}

export function close(fd: fd): void {
   fs.closeSync(fd);
}

export function mkdirDeep(path: string): void {
   fs.mkdirSync(path, {recursive: true});
}

import {Struct} from "./types";
import {fromJSON, toJSON} from "./util";

export function readStruct<T>
(f: fs.PathOrFileDescriptor, recordType: Struct<T>)
{
   try {
      return recordType.parse(fromJSON(fs.readFileSync(f, "utf8")));
   } catch (e: any) {
      errs(e.toString());
      return null;
   }
}

export function writeToJSON(fd: fd, what: any): void {
   fs.writeSync(fd, toJSON(what), 0);
}

export function puts(str: string) {
   process.stdout.write(str + "\n");
}

export function errs(str: string) {
   process.stderr.write(str + "\n");
}
