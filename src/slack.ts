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
   export const MIN = parse("0000000000.000000");

   export const is = (u: unknown): u is Timestamp =>
      typeof u === "string" && reSlackTimeStamp.test(u);

   export function parse(s: string): Timestamp {
      if (!is(s))
         throw new TypeError(`"${s}"" is not a slack timestamp!`);

      return s as Timestamp;
   }
   export const toDate = (ts: Timestamp): Date =>
      new Date(+ts.replace('.', "").slice(0, -3));
}
