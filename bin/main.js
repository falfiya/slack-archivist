"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const readline_sync_1 = __importDefault(require("readline-sync"));
const input = readline_sync_1.default.question;
const print = console.log.bind(console);
// const path  = input("Enter the path\n> ");
const path = "../dctco.slack.com";
{
    if (!fs_1.default.existsSync(path)) {
        print("does not exist");
        // @ts-ignore
        return;
    }
    const path_stats = fs_1.default.statSync(path);
    if (!path_stats.isDirectory()) {
        print("Not a directory!");
        // @ts-ignore
        return;
    }
}
// build index
var index = [];
const read_json = (file) => JSON.parse(fs_1.default.readFileSync(file, "utf8"));
const users = read_json(`${path}/users.json`);
for (const { profile } of users) {
    if (!profile) {
        continue;
    }
    const ikeys = Object.keys(profile).filter(e => e.startsWith("image"));
    ikeys.forEach(key => index.push(profile[key]));
}
const channels = read_json(`${path}/channels.json`).map(c => c.name);
var msgs_read = 0;
for (const n of channels) {
    const days = fs_1.default.readdirSync(`${path}/${n}`)
        .filter(d => d.endsWith(".json"))
        .map(dirent => `${path}/${n}/${dirent}`);
    for (const d of days) {
        const msgs = read_json(d);
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
const node_fetch_1 = __importDefault(require("node-fetch"));
const sanitize = require("sanitize-filename");
try {
    fs_1.default.mkdirSync("downloads");
}
catch (_) { }
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
            fname = `downloads/${sanitize(url, { replacement: '-' })}`;
        }
        else {
            fname = `downloads/${sanitize(url.slice(0, token), { replacement: '-' })}`;
        }
        if (fs_1.default.existsSync(fname)) {
            print(`Already have ${fname}`);
            continue;
        }
        const buf = await node_fetch_1.default(url).then(res => res.buffer());
        fs_1.default.writeFileSync(fname, buf);
        print(`Downloaded to ${fname}`);
        await short_nap();
    }
}();
//# sourceMappingURL=main.js.map