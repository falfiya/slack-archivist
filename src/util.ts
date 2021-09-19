import {puts} from "./io";
import J from "json-bigint";

export function sleep(s: number) {
   puts(`sleeping for ${s} second${s === 1 ? "" : "s"}`);
   return new Promise<void>(res => setTimeout(res, s * 1000));
}

export const fromJSON = (json: string): unknown => J.parse(json);
export const toJSON = (what: any): string => J.stringify(what, null, 3);
