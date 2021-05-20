import fs from "fs";
import rls from "readline-sync";

type str = string;
type int = number;

const input = rls.question;
const print = console.log.bind(console);
// const path  = input("Enter the path\n> ");
const path = "../dctco.slack.com"

{
   if (!fs.existsSync(path)) {
      print("does not exist");
      // @ts-ignore
      return;
   }

   const path_stats = fs.statSync(path);
   if (!path_stats.isDirectory()) {
      print("Not a directory!");
      // @ts-ignore
      return;
   }
}

// build index
var index: (str | undefined)[] = [];
const read_json = (file: str) => JSON.parse(fs.readFileSync(file, "utf8"));

import {Member} from "../vendor/UsersListResponse";
const users: Member[] = read_json(`${path}/users.json`);

for (const {profile} of users) {
   if (!profile) {
      continue;
   }
   const ikeys = Object.keys(profile).filter(e => e.startsWith("image"));
   ikeys.forEach(key => index.push(profile[key]));
}

const channels: str[] = read_json(`${path}/channels.json`).map(c => c.name);

import {Message} from "../vendor/ConversationsHistoryResponse";

var msgs_read = 0;

for (const n of channels) {
   const days = fs.readdirSync(`${path}/${n}`)
      .filter(d => d.endsWith(".json"))
      .map(dirent => `${path}/${n}/${dirent}`);

   for (const d of days) {
      const msgs: Message[] = read_json(d);
      for (const m of msgs) {
         msgs_read++;
         if (m.files) {
            for (const f of m.files) {
               index.push(f.url_private);
               index.push(f.url_private_download);
               Object.keys(f).filter(e => e.startsWith("thumb_") && !(e.endsWith('w') || e.endsWith('h'))).forEach(k => index.push(f[k]));
            }
         }

         if (m.attachments) {
            for (const a of m.attachments) {
               index.push(a.image_url);
               index.push(a.thumb_url);
            }
         }
      }
   }
}

print("The index has been built.");
print(`${msgs_read} messages read.`);
print(`There are ${index.length} files to download`);

const deduped_index = [...new Set(index)];

print(`${index.length - deduped_index.length} duplicates found, skipping...`);
index = null;

import fetch from "node-fetch";
import sanitize = require("sanitize-filename");

try {fs.mkdirSync("downloads")} catch (_) {}

const len = deduped_index.length;

const short_nap = () => new Promise(res => setTimeout(res, 69));

void async function dl() {
   for (var i = 0; i < len; ++i) {
      print(`Downloading ${i + 1} of ${len}`);
      var url = deduped_index[i];
      if (!url) {
         continue;
      }
      var fname;
      const token = url.indexOf("?t=xoxe");
      if (token === -1) {
         fname = `downloads/${sanitize(url, {replacement: '-'})}`;
      } else {
         fname = `downloads/${sanitize(url.slice(0, token), {replacement: '-'})}`;
      }
      if (fs.existsSync(fname)) {
         print(`Already have ${fname}`);
         continue;
      }
      const buf = await fetch(url).then(res => res.buffer());
      fs.writeFileSync(fname, buf);
      print(`Downloaded to ${fname}`);
      await short_nap();
   }
}();

