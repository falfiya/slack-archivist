type ParseFn<T> = (u: unknown) => T;
type FromFn<T>  = (u: unknown) => T;

declare const u64_s: unique symbol;
export type u64_o = {[u64_s]: void};
export type u64 = u64_o & bigint;
export namespace u64 {
   export function into(u: unknown): u64 {
      let parsedAs: bigint;
      switch (typeof u) {
      case "bigint":
         parsedAs = u;
         break;
      case "number":
      case "string":
         parsedAs = BigInt(u);
         break;
      default:
         throw new TypeError(`Cannot parse "${typeof u}" as u64!`);
      }

      const clamped = BigInt.asUintN(64, parsedAs);
      if (parsedAs === clamped) {
         throw new TypeError(`${parsedAs} overflowed to ${clamped}!`);
      }

      return clamped as u64;
   }

   export const to_i32 = (u: u64) => Number(BigInt.asIntN(32, u))|0;
}

export namespace string {
   export function assert(u: unknown): asserts u is string {
      if (typeof u !== "string") {
         throw new TypeError(`${typeof u} is not "string"!`);
      }
   }
}

export function assert<T>(u: unknown, fn: ParseFn<T>): asserts u is T {
   fn(u);
}

export namespace object {
   export function assert(u: unknown): asserts u is object {
      if (typeof u !== "object" || u === null) {
         throw new TypeError(`${typeof u } is not "object"!`);
      }
   }

   export function assertKey
      <o extends {}, k extends string, T>(o: o, k: k, fn: (u: unknown) => asserts u is T):
         asserts o is o & Record<k, T>
         {
            if (!Object.hasOwnProperty.call(o, k)) {
               throw new TypeError(`object does not have key "${k}"!`);
            }
            fn((o as any)[k]);
         }

   export function intoKey
      <o extends {}, k extends string, T>(o: o, k: k, fn: (u: unknown) => T):
         asserts o is o & Record<k, T>
         {
            if (!Object.hasOwnProperty.call(o, k)) {
               throw new TypeError(`object does not have key "${k}"!`);
            }
            (o as any)[k] = fn((o as any)[k]);
         }
}

// export namespace array {
//    export const is = (u: unknown): u is unknown[] =>
//       Array.isArray(u);

//    export function isT<T>(u: unknown, fnT: IsT<T>): u is T[] {
//       if (!Array.isArray(u))
//          return false;

//       for (const v of u)
//          if (!fnT(v))
//             return false;

//       return true;
//    }

//    export const isTC =
//       <T>(fnT: IsT<T>) =>
//          (u: unknown): u is T[] =>
//             isT(u, fnT);
// }

// export type Struct<T> = {
//    default: T;
//    parse(u: unknown): T;
// }
