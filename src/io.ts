import * as fs from "fs";
import * as fs_ext from "fs-ext";
import {fromJSON, toJSON} from "./util";

declare const fd_s: unique symbol;
export type fd_o = {[fd_s]: void};
export type fd = fd_o & number;

function flock(fd: fd) {
   fs_ext.flockSync(fd, fs_ext.constants.LOCK_EX);
}

/**
 * remember to mkdirDeep before calling this.
 *
 * open is responsible for giving you a file descriptor. most of the time, it's
 * kinda nice to know if you created the file as you opened it or if the file
 * was already there. if the file was just created now, maybe it's not a good
 * idea to JSON.parse it's contents.
 */
export function open(path: string): [created: boolean, fd: fd]
{
   const mode = fs.constants.O_RDWR;
   try {
      const fd = fs.openSync(path, mode) as fd;
      flock(fd);
      return [false, fd];
   }
   catch (_) {
      const fd = fs.openSync(path, mode | fs.constants.O_CREAT) as fd;
      flock(fd);
      return [true, fd];
   }
}

export function close(fd: fd): void {
   fs.closeSync(fd);
}

export function mkdirDeep(path: string): void {
   fs.mkdirSync(path, {recursive: true});
}

export function readJSON(fd: fd): unknown {
   const buf = Buffer.alloc(fs.fstatSync(fd).size);
   fs.readSync(fd, buf);
   return fromJSON(buf.toString("utf8"));
}

export function write(fd: fd, buf: Buffer, length: number, offset: number): void {
   fs.writeSync(fd, buf, 0, length, offset);
}

export function writeToJSON(fd: fd, what: any): void {
   fs.writeSync(fd, toJSON(what), 0);
}

interface sSomething<T> {
   default(): T;
   into(u: unknown): T;
}
export function openStructuredJSON<T>(path: string, s: sSomething<T>): [fd, T] {
   const [created, fd] = open(path);
   let obj: T;
   if (created) {
      obj = s.default();
      writeToJSON(fd, obj);
   } else {
      obj = s.into(readJSON(fd));
   }
   return [fd, obj];
}

export function put(str: string) {
   process.stdout.write(str);
}

export function puts(str: string) {
   process.stdout.write(str + "\n");
}

export function errs(str: string) {
   process.stderr.write(str + "\n");
}
