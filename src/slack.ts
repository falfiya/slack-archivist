export {WebClient} from "@slack/web-api";
export {Channel} from "@slack/web-api/dist/response/UsersConversationsResponse";
export {File} from "@slack/web-api/dist/response/FilesListResponse";
export {Message} from "@slack/web-api/dist/response/ConversationsHistoryResponse";

// timestamp
declare const timestamp_s: unique symbol;
export type timestamp_o = {[timestamp_s]: void};
/** slack timestamp */
export type Timestamp = timestamp_o & string;
const reSlackTimeStamp = /^\d{10}\.\d{6}$/;
export namespace Timestamp {
   export const MIN = from("0000000000.000000");

   export const is = (u: unknown): u is Timestamp =>
      typeof u === "string" && reSlackTimeStamp.test(u);

   export function from(s: string): Timestamp {
      if (!is(s))
         throw new TypeError(`"${s}"" is not a slack timestamp!`);

      return s as Timestamp;
   }

   export const toDate = (ts: Timestamp): Date =>
      new Date(+ts.replace('.', "").slice(0, -3));
}

import {object} from "./types";
export type TimestampContainer = {ts: Timestamp};
export namespace TimestampContainer {
   export const is = (u: unknown): u is TimestampContainer =>
      object.is(u) && object.hasTKey(u, "ts", Timestamp.is);
}

import {WebClient} from "@slack/web-api";
export const messageExists =
   (client: WebClient, channel: string, ts: Timestamp): Promise<boolean> =>
      client.conversations.history(
         {channel, latest: ts, limit: 1, inclusive: true})
            .then(_ => true)
            .catch(_ => false);
