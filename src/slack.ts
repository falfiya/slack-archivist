import axios from "axios";
import {WebClient} from "@slack/web-api";
import {IncomingMessage} from "http";
import {object, string, transmute, u64} from "./types";

declare const timestamp_s: unique symbol;
export type timestamp_o = {[timestamp_s]: void};
export type Timestamp = timestamp_o & string;
export namespace Timestamp {
   const reSlackTimeStamp = /^\d{10}\.\d{6}$/;

   export function into(u: unknown): Timestamp {
      if (typeof u !== "string") {
         throw new TypeError(`Cannot convert type "${typeof u}" to Timestamp!`);
      }
      if (reSlackTimeStamp.test(u)) {
         throw new TypeError(`"${u}" does not match the regex ${reSlackTimeStamp}!`);
      }
      return u as any;
   }

   export const toDate = (ts: Timestamp): Date =>
      new Date(+ts.replace('.', "").slice(0, -3));

   export const MIN = into("0000000000.000000");
}

export type DecentMessage =
   & import("@slack/web-api/dist/response/ConversationsHistoryResponse").Message
   & {ts: Timestamp};
export namespace DecentMessage {
   export function into(u: unknown): DecentMessage {
      return transmute(u)
         .into(object.into)
         .fieldInto("ts", Timestamp.into)
         .it;
   }
}

export type DecentFile =
   & import("@slack/web-api/dist/response/ConversationsHistoryResponse").File
   & {id: string; name: string; url_private: string};
export namespace DecentFile {
   export function into(u: unknown): DecentFile {
      return transmute(u)
         .into(object.into)
         .fieldInto("id", string.into)
         .fieldInto("name", string.into)
         .fieldInto("url_private", string.into)
         .it;
   }
}

export type DecentChannel =
   & import("@slack/web-api/dist/response/UsersConversationsResponse").Channel
   & {id: string};
export namespace DecentChannel {
   export function into(u: unknown): DecentChannel {
      return transmute(u)
         .into(object.into)
         .fieldInto("id", string.into)
         .it;
   }
}

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
