import {object, string, u64} from "./types";

export type {Channel} from "@slack/web-api/dist/response/UsersConversationsResponse";

// timestamp
declare const timestamp_s: unique symbol;
export type timestamp_o = {[timestamp_s]: void};
/** slack timestamp */
export type Timestamp = timestamp_o & string;
export namespace Timestamp {
   const reSlackTimeStamp = /^\d{10}\.\d{6}$/;

   export const is = (u: unknown): u is Timestamp =>
      typeof u === "string" && reSlackTimeStamp.test(u);

   export function from(s: string): Timestamp {
      if (!is(s))
         throw new TypeError(`"${s}"" is not a slack timestamp!`);

      return s as Timestamp;
   }

   export const toDate = (ts: Timestamp): Date =>
      new Date(+ts.replace('.', "").slice(0, -3));

   export const MIN = from("0000000000.000000");
}

import type {Message} from "@slack/web-api/dist/response/ConversationsHistoryResponse";
export type DecentMessage =
   & Message
   & {ts: Timestamp};
export namespace DecentMessage {
   export const is = (u: unknown): u is DecentMessage =>
      object.is(u) && object.hasTKey(u, "ts", Timestamp.is);
}

import type {File} from "@slack/web-api/dist/response/FilesListResponse";
export type DecentFile =
   & File
   & {
      id: string;
      name: string;
      url_private: string;
      // [thumb: `thumb_${number}`]: string;
   };
export namespace DecentFile {
   export const is = (u: unknown): u is DecentFile => 1
      && object.is(u)
      && object.hasTKey(u, "id", string.is)
      && object.hasTKey(u, "name", string.is)
      && object.hasTKey(u, "url_private", string.is);
}

import axios from "axios";
import {WebClient} from "@slack/web-api";
import {IncomingMessage} from "http";
export class CustomWebClient extends WebClient {
   messageExists(channel: string, ts: Timestamp): Promise<boolean> {
      return (
         this.conversations.history(
            {channel, latest: ts, limit: 1, inclusive: true})
               .then(_ => true)
               .catch(_ => false))
   }

   async downloadFile(file: DecentFile, startingAt: u64 = 0n as u64): Promise<IncomingMessage> {
      const res = await axios({
         url: file.url_private,
         method: "GET",
         responseType: "stream",
         headers: {
            authorization: `Bearer ${this.token}`,
            range: `bytes=${startingAt}-`,
         },
      });

      return res.data;
   }
}
