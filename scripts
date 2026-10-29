// scripts/bgm-list.js — public/bgm/분위기폴더 의 mp3 목록을 public/bgm/list.json 으로 만든다.
// 배포(npm run build) 때마다 자동 실행 (package.json 의 "prebuild"). 곡은 폴더에 넣고 GitHub 에 올리기만 하면 됨.
// 출처 표기가 필요한 곡은 같은 이름의 .txt (예: Open Road.mp3 + Open Road.txt) 에 표기 문구를 넣어두기.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "public", "bgm");
const CATS = { cute: "귀여운", calm: "잔잔한", dreamy: "몽환적인", exciting: "신나는", emotional: "감성적인" };
const AUDIO = /\.(mp3|m4a|aac|ogg|wav)$/i;

const out = { updated: new Date().toISOString(), cats: {} };
for (const [dir, label] of Object.entries(CATS)) {
  const d = path.join(ROOT, dir);
  let files = [];
  try { files = fs.readdirSync(d).filter((f) => AUDIO.test(f)).sort(); } catch (e) { fs.mkdirSync(d, { recursive: true }); }
  out.cats[dir] = {
    label,
    tracks: files.map((f) => {
      const base = f.replace(AUDIO, "");
      let credit = "";
      try { credit = fs.readFileSync(path.join(d, base + ".txt"), "utf8").trim(); } catch (e) {}
      return { name: base, url: `/bgm/${dir}/${encodeURIComponent(f)}`, credit };
    }),
  };
}
fs.mkdirSync(ROOT, { recursive: true });
fs.writeFileSync(path.join(ROOT, "list.json"), JSON.stringify(out, null, 1));
console.log("BGM 목록: " + Object.values(out.cats).map((c) => `${c.label} ${c.tracks.length}곡`).join(" · "));
