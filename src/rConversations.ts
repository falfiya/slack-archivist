import {Conversation} from "@slack/web-api/dist/response/AdminConversationsSearchResponse";

export type ConversationsRecord = Conversation[];
export function _new(): ConversationsRecord { return [] };
