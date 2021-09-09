export {WebClient} from "@slack/web-api";
export {Channel} from "@slack/web-api/dist/response/UsersConversationsResponse";
export {File} from "@slack/web-api/dist/response/FilesListResponse";
export {Message} from "@slack/web-api/dist/response/ConversationsHistoryResponse";

export function dateFromTS(ts: string): Date {
   return new Date(+ts.replace('.', "").slice(0, -3));
}
