export {WebClient} from "@slack/web-api";
export {Channel} from "@slack/web-api/dist/response/UsersConversationsResponse";
export {File} from "@slack/web-api/dist/response/FilesListResponse";
export {Message} from "@slack/web-api/dist/response/ConversationsHistoryResponse";

// timestamp
declare const ts_s: unique symbol;
export type ts_o = {[ts_s]: void};
/** slack timestamp */
export type TS = ts_o & string;

const reSlackTimeStamp = /^\d{10}\.\d{6}$/;
export function isTS(u: unknown): u is TS {
   return typeof u === "string" && reSlackTimeStamp.test(u);
}

export function dateFromTS(ts: TS): Date {
   return new Date(+ts.replace('.', "").slice(0, -3));
}
