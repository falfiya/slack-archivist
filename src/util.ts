import {puts} from "./io";

declare const i32_s: unique symbol;
export type i32_o = {[i32_s]: void};
export type i32 = i32_o & number;
export namespace i32 {
   export const is = (u: unknown): u is i32 =>
      typeof u === "number" && u === ~~u;

   export const from = (u: any): i32 =>
      (u|0) as any;
}

export function sleep(s: number) {
   puts(`sleeping for ${s} second${s === 1 ? "" : "s"}`);
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

export type isType<T> = (u: unknown) => u is T;

export namespace string {
   export const is = (u: unknown): u is string =>
      typeof u === "string";
}

export namespace object {
   export const is = (u: unknown): u is object =>
      typeof u === "object" && u !== null;

   export const hasKey =
      <o extends {}, k extends string>(o: o, k: k):
         o is o & Record<k, unknown> =>
            Object.hasOwnProperty.call(o, k);

   export const hasTKey =
      <o extends {}, k extends string, T>(o: o, k: k, fnT: isType<T>):
         o is o & Record<k, T> =>
            object.hasKey(o, k) && fnT(o[k]);

   export function ignoreKey
      <o extends {}, k extends string>(o: o, k: k):
         asserts o is o & Record<k, any>{}
}

export namespace array {
   export const is = (u: unknown): u is unknown[] =>
      Array.isArray(u);

   export function isT<T>(u: unknown, fnT: isType<T>): u is T[] {
      if (!Array.isArray(u))
         return false;

      for (const v of u)
         if (!fnT(v))
            return false;

      return true;
   }

   export const isTC =
      <T>(fnT: isType<T>) =>
         (u: unknown): u is T[] =>
            isT(u, fnT);
}
