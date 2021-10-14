import {u64} from "./types";
import {IncomingMessage} from "http";
import {parse, stringify} from "json-bigint";

export function sleep(s: number | bigint) {
   return new Promise<void>(res => setTimeout(res, Number(s) * 1000));
}

export const fromJSON = parse;
export const toJSON = (what: any): string => stringify(what, null, 3);

/** naming is hard alright. namespace to deal with ranged downloads */
export namespace Mushroom {
   export type Range = {
      start: u64;
      end: u64;
      size: u64;
   };

   /** it takes a http content-range response and turns it into an object. */
   export function parseRange(im: IncomingMessage): Range {
      const bytes = "bytes ";

      let start = u64.ZERO;
      let end   = u64.ZERO;
      let size  = u64.ZERO;

      const cr = im.headers["content-range"];
      if (cr === undefined || !cr.startsWith(bytes)) {
         return {start, end, size};
      }

      const range = cr.slice(bytes.length);
      const slashIdx = range.lastIndexOf('/');
      if (slashIdx === -1) {
         return {start, end, size};
      }
      size = u64.into(range.slice(slashIdx + 1));

      const dashIdx = range.indexOf('-');
      if (dashIdx !== -1) {
         start = u64.into(range.slice(0, dashIdx));
         end   = u64.into(range.slice(dashIdx + 1, slashIdx));
      }

      return {start, end, size};
   }

   export function waitFor(im: IncomingMessage): Promise<void> {
      return new Promise((res, rej) => {
         im.on("end", res);
         im.on("error", rej);
         im.on("close", () => rej(new Error("The connection closed abruptly.")));
      });
   }
}

