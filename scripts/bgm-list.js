// scripts/bgm-list.js — 배포할 때 public/shorts-assets/bgm/ 아래 폴더를 읽어 public/bgm/list.json 을 만든다
// (사이트 'AI 영상생성'과 쇼츠 프로그램이 이 목록을 같이 씀)
// (package.json 의 predev·prebuild 에서 자동 실행 — 직접 돌릴 필요 없음)
//
//  · public/shorts-assets/bgm/<폴더>/곡.mp3   → 폴더 하나 = 분위기 하나. 폴더 이름은 아무거나 OK (새로 만들면 자동으로 목록에 뜸)
//  · 곡이 없는 폴더는 목록에서 뺌
//  · 출처 표기가 필요한 곡: 곡 옆에 같은 이름의 .txt (예: 곡.mp3 + 곡.txt) 에 출처 문구를 적으면 그 곡에만 붙음
//                          폴더 전체에 같은 문구면 그 폴더에 credit.txt 하나
//  · public/shorts-assets/bgm/ 바로 아래에 둔 곡은 읽지 않음 (분위기 폴더에 넣어주세요)
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "public", "shorts-assets", "bgm");
const OUT = path.join(__dirname, "..", "public", "bgm", "list.json");   // 목록 주소는 그대로 /bgm/list.json
const AUDIO = /\.(mp3|m4a|wav|ogg|aac)$/i;

// 선택칸에 보일 한글 이름 (여기 없는 폴더는 폴더 이름 그대로)
const LABELS = {
  bright: "밝은", calm: "차분한", dark: "어두운", dramatic: "극적인",
  funky: "펑키한", happy: "행복한", romantic: "로맨틱한", sad: "슬픈",
  emotional: "감성적인", upbeat: "신나는", inspirational: "희망찬", angry: "강렬한",
};

const readTxt = f => { try { return fs.readFileSync(f, "utf8").replace(/^﻿/, "").trim(); } catch (e) { return ""; } };
const url = (...parts) => "/shorts-assets/bgm/" + parts.map(encodeURIComponent).join("/");

fs.mkdirSync(ROOT, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const cats = {};
let total = 0;
const loose = [];
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!ent.isDirectory()) {
    if (AUDIO.test(ent.name)) loose.push(ent.name);
    continue;
  }
  if (ent.name.startsWith(".") || ent.name.startsWith("_")) continue;
  const dir = path.join(ROOT, ent.name);
  const folderCredit = readTxt(path.join(dir, "credit.txt"));
  const tracks = fs.readdirSync(dir).filter(f => AUDIO.test(f)).sort((a, b) => a.localeCompare(b)).map(f => {
    const base = f.replace(/\.[^.]+$/, "");
    return { url: url(ent.name, f), name: base, credit: readTxt(path.join(dir, base + ".txt")) || folderCredit };
  });
  if (!tracks.length) continue;                       // 곡 없는 폴더는 선택칸에 안 보이게
  cats[ent.name] = { label: LABELS[ent.name.toLowerCase()] || ent.name, tracks };
  total += tracks.length;
}

fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), cats }, null, 1));
console.log(`[bgm] 분위기 ${Object.keys(cats).length}개 · 곡 ${total}개 (public/shorts-assets/bgm) → public/bgm/list.json`);
for (const [k, c] of Object.entries(cats)) console.log(`   ${k} (${c.label}) ${c.tracks.length}곡`);
if (loose.length) console.log(`[bgm] ⚠ public/shorts-assets/bgm/ 바로 아래 곡 ${loose.length}개는 읽지 않았어요 — 분위기 폴더에 넣어주세요: ${loose.slice(0, 5).join(", ")}${loose.length > 5 ? " …" : ""}`);
