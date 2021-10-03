type fn<a, b> = (a: a) => b;
type ufn<T> = fn<unknown, T>;

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
      if (parsedAs !== clamped) {
         throw new TypeError(`${parsedAs} overflowed to ${clamped}!`);
      }

      return clamped as u64;
   }

   export const to_i32 = (u: u64) => Number(BigInt.asIntN(32, u))|0;
   export const ZERO = 0n as u64;
}

export namespace string {
   export function into(u: unknown): string {
      if (typeof u !== "string") {
         throw new TypeError(`${typeof u} is not "string"!`);
      }
      return u;
   }
}

export namespace object {
   export function hasKey
      <o extends {}, k extends string>(o: o, k: k):
         o is o & Record<k, unknown>
         {
            return Object.hasOwnProperty.call(o, k);
         }

   export function into(u: unknown): object {
      if (typeof u !== "object" || u === null) {
         throw new TypeError(`${typeof u } is not "object"!`);
      }
      return u;
   }

   export function intoIndexSignature<T>(fn: ufn<T>) {
      return function intoCurried(o: object): {[key: string]: T} {
         for (const k of Object.keys(o)) {
            (o as any)[k] = fn((o as any)[k]);
         }
         return o as any;
      }
   }
}

export namespace array {
   export function intoUnknown(u: unknown): unknown[] {
      if (!Array.isArray(u)) {
         throw new TypeError(`"${typeof u}" cannot be converted into unknown[]!`);
      }
      return u;
   }

   export function into<T>(fn: ufn<T>) {
      return function intoCurried(u: unknown): T[] {
         if (!Array.isArray(u)) {
            throw new TypeError(`"${typeof u}" is not an array!`);
         }
         const len = u.length
         for (let i = 0; i < len; ++i) {
            u[i] = fn(u[i]);
         }
         return u as any;
      }
   }
}

interface TransmuteBase<T> {
   it: T;
   into<U, R = T & U>(fn: fn<T, U>):
      U extends object ? TransmuteObject<R> : TransmuteBase<R>;
}

interface TransmuteObject<T> extends TransmuteBase<T> {
   fieldInto<k extends string, U>(k: k, fn: ufn<U>):
      TransmuteObject<T & Record<k, U>>;
}

class TransmuteInternal<T> implements TransmuteObject<T> {
   it: T;

   constructor (it: T) {
      this.it = it;
   }

   into<U, R = T & U>(fn: fn<T, U>):
      U extends object ? TransmuteObject<R> : TransmuteBase<R>
      {
         return new TransmuteInternal(fn(this.it)) as any;
      }

   fieldInto<k extends string, U>(k: k, fn: ufn<U>):
      TransmuteObject<T & Record<k, U>>
   {
      if (!Object.hasOwnProperty.call(this.it, k)) {
         throw new TypeError(`object does not have key "${k}"!`);
      }
      (this.it as any)[k] = (fn as ufn<U>)((this.it as any)[k]);
      return this as any;
   }
}


export function transmute<T = unknown>(it: T): TransmuteBase<T> {
   return new TransmuteInternal(it);
}
