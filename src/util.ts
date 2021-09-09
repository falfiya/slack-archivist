export function hasKey(o: Record<string, unknown>, k: string): boolean {
   return Object.hasOwnProperty.call(o, k);
}

import {puts} from "./io";
export function sleep(s: number) {
   puts(`sleeping for ${s} second${s === 1 ? "" : "s"}`);
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

export function expect(v: unknown, err: string): asserts v {
   if (v === undefined) {
      throw new TypeError(err);
   }
}

export function notString(v: unknown): boolean {
   return typeof v !== "string";
}

export function notInteger(v: unknown): boolean {
   return !Number.isInteger(v);
}

export function notArray(v: unknown): boolean {
   return !Array.isArray(v);
}
