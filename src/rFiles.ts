import {File} from "@slack/web-api/dist/response/FilesListResponse";

export type FilesRecord = File[];
export function _new(): FilesRecord { return [] };
