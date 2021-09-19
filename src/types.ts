export type IsT<T> = (u: unknown) => u is T;
export type ParseT<T> = (u: unknown) => T | null;

declare const u64_s: unique symbol;
export type u64_o = {[u64_s]: void};
export type u64 = u64_o & bigint;
export namespace u64 {
   export const is = (u: unknown): u is u64 =>
      typeof u === "bigint" && BigInt.asUintN(64, u) === u;

   export function parse(u: unknown): u64 | null {
      switch (typeof u) {
      case "bigint":
         var bi = u;
         break;
      case "number":
      case "string":
         try {
            var bi = BigInt(u);
            break;
         }
         catch (_) {}
      default:
         return null
      }

      try {
         return BigInt.asUintN(64, bi) as u64;
      }
      catch (_) {
         return null;
      }
   }

   export function from(u: unknown): u64 {
      const parsed = parse(u);
      if (parsed === null)
         throw new TypeError("Cannot parse u64!");

      return parsed;
   }
}

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
      <o extends {}, k extends string, T>(o: o, k: k, fn: IsT<T>):
         o is o & Record<k, T> =>
            object.hasKey(o, k) && fn(o[k]);

   // export function ignoreKey
   //    <o extends {}, k extends string>(o: o, k: k):
   //       asserts o is o & Record<k, any>{}

   export function parseTKey
      <o extends {}, k extends string, T>(o: o, k: k, fn: ParseT<T>):
      o is o & Record<k, T>
      {
         if (!object.hasKey(o, k)) return false;
         const parsed = fn(o[k]);
         if (parsed === null) return false;
         (o as any)[k] = parsed;
         return true;
      }
}

export namespace array {
   export const is = (u: unknown): u is unknown[] =>
      Array.isArray(u);

   export function isT<T>(u: unknown, fnT: IsT<T>): u is T[] {
      if (!Array.isArray(u))
         return false;

      for (const v of u)
         if (!fnT(v))
            return false;

      return true;
   }

   export const isTC =
      <T>(fnT: IsT<T>) =>
         (u: unknown): u is T[] =>
            isT(u, fnT);
}

export type Struct<T> = {
   default: T;
   parse(u: unknown): T | null;
}
