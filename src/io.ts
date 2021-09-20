import * as fs from "fs";
export {constants as C} from "fs";

import {Struct} from "./types";
import {toJSON} from "./util";

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

export function readStruct<T>
(f: fs.PathOrFileDescriptor, recordType: Struct<T>)
{
   return recordType.parse(JSON.parse(fs.readFileSync(f, "utf8")));
}

export function writeToJSON(fd: fd, what: any): void {
   fs.writeFileSync(fd, toJSON(what));
}

export function puts(str: string) {
   process.stdout.write(str + "\n");
}

export function errs(str: string) {
   process.stderr.write(str + "\n");
}
