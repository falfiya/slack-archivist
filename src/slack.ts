import axios from "axios";
import {WebClient} from "@slack/web-api";
import {IncomingMessage} from "http";
import {object, string, transmute, u64} from "./types";
import type {Message as SlackMessage, File as SlackFile} from
   "@slack/web-api/dist/response/ConversationsHistoryResponse";
import type {Channel as SlackChannel} from
   "@slack/web-api/dist/response/ConversationsListResponse";

declare const timestamp_s: unique symbol;
export type timestamp_o = {[timestamp_s]: void};
export type Timestamp = timestamp_o & string;
export namespace Timestamp {
   const reSlackTimeStamp = /^\d{10}\.\d{6}$/;

   export function into(u: unknown): Timestamp {
      if (typeof u !== "string") {
         throw new TypeError(`Cannot convert type "${typeof u}" to Timestamp!`);
      }
      if (!reSlackTimeStamp.test(u)) {
         throw new TypeError(`"${u}" does not match the regex ${reSlackTimeStamp}!`);
      }
      return u as any;
   }

   export function toDate(ts: Timestamp): Date {
      return new Date(+ts.replace('.', "").slice(0, -3));
   }

   export const MIN = into("0000000000.000000");
}

export type Message = SlackMessage & {ts: Timestamp};
export namespace Message {
   export function into(u: unknown): Message {
      return transmute(u)
         .into(object.into)
         .fieldInto("ts", Timestamp.into)
         .it;
   }
}

export type File = SlackFile & {id: string; name: string; url_private: string};
export namespace File {
   export function into(u: unknown): File {
      return transmute(u)
         .into(object.into)
         .fieldInto("id", string.into)
         .fieldInto("name", string.into)
         .fieldInto("url_private", string.into)
         .it;
   }
}

export type Channel = SlackChannel & {id: string};
export namespace Channel {
   export function into(u: unknown): Channel {
      return transmute(u)
         .into(object.into)
         .fieldInto("id", string.into)
         .it;
   }
}

export class Client extends WebClient {
   messageExists(channel: string, ts: Timestamp): Promise<boolean> {
      return (
         this.conversations.history(
            {channel, latest: ts, limit: 1, inclusive: true})
               .then(_ => true)
               .catch(_ => false))
   }

   async downloadFile(file: File, startingAt: u64 = u64.ZERO): Promise<IncomingMessage> {
      return ((
         await axios({
            url: file.url_private,
            method: "GET",
            responseType: "stream",
            headers: {
               authorization: `Bearer ${this.token}`,
               range: `bytes=${startingAt}-`,
            },
         })
      ).data);
   }
}
