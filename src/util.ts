import {u64} from "./types";
import J from "json-bigint";

export function sleep(s: number) {
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

export function sleep_ms(s: number) {
   return new Promise<void>(res => setTimeout(res, s));
}

export const fromJSON = J.parse;
export const toJSON = (what: any): string => J.stringify(what, null, 3);

export function getRangeStart(im: import("http").IncomingMessage): u64 {
   const pre = "bytes ";

   const cr = im.headers["content-range"];
   if (cr === undefined || !cr.startsWith(pre)) {
      return 0n as u64;
   }

   const range = cr.slice(pre.length);
   const dashIdx = cr.indexOf('-');
   if (dashIdx === -1) {
      return 0n as u64;
   }

   else {
      return u64.into(cr.slice(0, dashIdx));
   }
}
