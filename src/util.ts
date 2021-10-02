import {IncomingMessage} from "http";
import J from "json-bigint";
import {u64} from "./types";

export function sleep(s: number) {
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

export function sleep_ms(s: number) {
   return new Promise<void>(res => setTimeout(res, s));
}

export const fromJSON = J.parse;
export const toJSON = (what: any): string => J.stringify(what, null, 3);

export namespace Mushroom {
   export function getRangeStart(im: IncomingMessage): u64 {
      const pre = "bytes ";

      const cr = im.headers["content-range"];
      if (cr === undefined || !cr.startsWith(pre)) {
         return 0n as u64;
      }

      const range = cr.slice(pre.length);
      const dashIdx = range.indexOf('-');
      if (dashIdx === -1) {
         return 0n as u64;
      }

      else {
         return u64.into(range.slice(0, dashIdx));
      }
   }

   export function waitFor(im: IncomingMessage): Promise<void> {
      return new Promise((res, rej) => {
         im.on("end", res);
         im.on("error", rej);
         im.on("close", () => rej(new Error("The connection closed abruptly.")));
      });
   }
}

