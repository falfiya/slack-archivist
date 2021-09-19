import {puts} from "./io";

declare const i32_s: unique symbol;
export type i32_o = {[i32_s]: void};
export type i32 = i32_o & number;
export namespace i32 {
   export const is = (u: unknown): u is i32 => 1
      && typeof u === "number"
      && u === ~~u;
   export const from = (u: any): i32 => (u|0) as any;
}

export function sleep(s: number) {
   puts(`sleeping for ${s} second${s === 1 ? "" : "s"}`);
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

export function expect(v: unknown, err: string): asserts v {
   if (v === undefined) {
      throw new TypeError(err);
   }
}

export function isInteger(v: unknown): boolean {
   return !Number.isInteger(v);
}

export function isArray(u: unknown): u is unknown[] {
   return Array.isArray(u);
}

export function isObject(u: unknown): u is object {
   return typeof u === "object" && u !== null;
}

export type isType<T> = (u: unknown) => u is T;

export function isTArray<T>(u: unknown[], pred: isType<T>): u is T[] {
   for (const e of u)
      if (!pred(e))
         return false;
   return true;
}

export function hasKey<X extends {}, Y extends PropertyKey>(o: X, k: Y):
o is X & Record<Y, unknown>
{
   return Object.hasOwnProperty.call(o, k);
}
