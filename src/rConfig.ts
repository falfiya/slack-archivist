export type ConfigRecord = {
   userToken: string;
   downloadDir: string;
}

export function _new(): ConfigRecord {
   return {
      userToken: "xoxp-fill-in-the-rest-yourself",
      downloadDir: "my-slack-export-folder"
   };
}
