export type Struct<T> = {
   default: T;
   fromAny(a: any): T;
}
