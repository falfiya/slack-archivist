export type Struct<T> = {
   default: T;
   parse(u: unknown): T;
}
