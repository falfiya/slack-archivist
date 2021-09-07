export class sConfig {
   userToken: string;
   archiveDir: string;

   static default: sConfig = {
      userToken: "xoxp-fill-in-the-rest-yourself",
      archiveDir: "my-slack-export-folder",
   }

   static fromAny(a: any): sConfig {
      if (1
      && typeof a.userToken  === "string"
      && typeof a.archiveDir === "string")
         return a;
      throw new TypeError("Object is not a valid ArchivistConfigRecord!");
   }
}
