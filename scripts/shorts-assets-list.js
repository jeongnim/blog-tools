// scripts/shorts-assets-list.js — 배포(빌드) 때 public/shorts-assets 폴더의 파일 목록을 list.json 으로 만든다.
// 쇼츠 자동화 PC 프로그램이 이 목록을 보고 새로 생기거나 바뀐 파일만 내려받는다.
//   public/shorts-assets/sfx/            효과음
//   public/shorts-assets/gif/<기분>/      짤 (gif·mp4·webm)
//   public/shorts-assets/ending/         엔딩 제품 이미지 (파일 이름에 제품명)
//   public/shorts-assets/models/         얼굴 감지 파일 (face_yunet.onnx)
//   public/shorts-assets/logo_full.png, logo_icon.png
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(process.cwd(), "public", "shorts-assets");
const OUT = path.join(ROOT, "list.json");
const SKIP = new Set(["list.json", ".gitkeep", ".DS_Store", "Thumbs.db", "desktop.ini"]);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (!SKIP.has(name) && !name.startsWith(".")) {
      const rel = path.relative(ROOT, full).split(path.sep).join("/");
      const sha1 = crypto.createHash("sha1").update(fs.readFileSync(full)).digest("hex");
      out.push({ path: rel, size: st.size, sha1 });
    }
  }
  return out;
}

fs.mkdirSync(ROOT, { recursive: true });
const files = walk(ROOT, []).sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), files }, null, 1));
console.log(`[shorts-assets] ${files.length}개 파일 목록 생성 → public/shorts-assets/list.json`);
