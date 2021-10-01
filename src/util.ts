import {u64} from "./types";
import {puts} from "./io";
import J from "json-bigint";

export function sleep(s: number) {
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

export function sleep_ms(s: number) {
   return new Promise<void>(res => setTimeout(res, s));
}

export const fromJSON = (json: string): unknown => J.parse(json);
export const toJSON = (what: any): string => J.stringify(what, null, 3);

import {IncomingMessage} from "http";

export class IncomingDownload {
   im: IncomingMessage;
   rangeStart: u64;
   rangeEnd: u64;
   size: u64;
   /** true if finished, false if closed */
   finished: Promise<boolean>

   constructor (im: IncomingMessage) {
      this.im = im;
      var cr = im.headers["content-range"];
      if (cr === undefined || !cr.startsWith("bytes ")) {
         // bad content range
         this.rangeStart = 0n as u64;
         this.rangeEnd = 0n as u64;
         this.size = 0n as u64;
      } else {
         cr = cr.slice("bytes ".length);
         const dash = cr.indexOf('-');
         const slash = cr.indexOf('/');
         if (dash === -1 || slash === -1) {
            throw new TypeError(":scringe:");
         }

         this.rangeStart = u64.from(cr.slice(0, dash));
         this.rangeEnd   = u64.from(cr.slice(dash + 1, slash));
         this.size       = u64.from(cr.slice(slash + 1));
      }

      this.finished = new Promise((res, rej) => {
         im.on("close", () => res(false));
         im.on("end", () => res(true));
         im.on("error", err => rej(err));
      });
   }

   flow(dataHandler: (b: Buffer) => void) {
      this.im.on("data", dataHandler);
   }
}
