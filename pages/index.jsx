import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ─── Constants ────────────────────────────────────────────────────────────
const FORBIDDEN_CATEGORIES = [
  {
    id:"adult", icon:"🔞", label:"19금·성인",
    color:"#f85149", bg:"#2d0b0b", border:"#f8514944",
    severity:"high", desc:"네이버 검색 노출 차단 위험",
    words:[
      "섹스","성관계","오르가즘","야동","포르노","음란","성매매","매춘","원조교제",
      "조건만남","야설","에로","누드","자위","강간","성폭행","몰카","불법촬영",
      "보지","자지","씹","성기","음경","음부","항문","구강성교","페니스","딜도",
      "바이브레이터","스와핑","원나잇","섹파","성욕","변태","관음",
      "노출증","음란물","성인물","하드코어","포르노그래피","성인동영상",
      "성인사이트","야한","야사","야화","성행위","성경험","성감대","에로틱",
      "19금","18금","성인전용","만남구함","만남신청","잠자리","합방",
      // 성인용품/콘텐츠
      "성인용품","성인샵","러브샵","섹스샵","딜도샵","바이브샵","성인몰",
      "애널","SM","BDSM","bondage","페티시","코스프레야동","성인코스프레",
      "유흥알바","조건알바","만남알바","성인알바","밤알바","룸알바","노래방도우미"
    ]
  },
  {
    id:"gambling", icon:"🎰", label:"사행산업·도박",
    color:"#ff7b72", bg:"#2d1117", border:"#ff7b7244",
    severity:"high", desc:"사행성·불법 도박 관련 차단 대상",
    words:[
      "카지노","도박","슬롯","배팅","토토","먹튀","스포츠토토","불법도박",
      "사설토토","온라인도박","배당률","핸디캡","불법카지노","해외카지노",
      "강원랜드꿀팁","블랙잭","룰렛","포커머니","홀덤머니","바카라",
      "복권당첨비법","로또조작","경마베팅","개경주","투견","소싸움베팅"
    ]
  },
  {
    id:"drug_weapon", icon:"🚫", label:"마약·무기·불법",
    color:"#f85149", bg:"#2d0b0b", border:"#f8514944",
    severity:"high", desc:"불법 물품 거래·제조 관련",
    words:[
      // 마약류
      "마약","대마","필로폰","히로뽕","헤로인","코카인","엑스터시","LSD","케타민",
      "마약구매","마약판매","마약거래","마약제조","마약밀수","대마초구매","대마구입",
      "향정신성","마약류관리","GHB","프로포폴남용","졸피뎀남용",
      // 총포도검화약
      "총기구매","총기판매","불법총기","권총구매","엽총개조","화약구매",
      "폭발물","폭탄제조","수류탄","다이너마이트","뇌관구매","화공품불법",
      "도검판매","칼구매불법","둔기제조",
      // 불법개조
      "불법개조","튜닝불법","소음기제작","총열개조","불법개조부품",
      // 저작권
      "무료다운로드영화","무료드라마다시보기","토렌트","웹하드불법","불법복제",
      "저작권위반","크랙다운","시리얼크랙","불법소프트웨어","키젠","무료툴불법"
    ]
  },
  {
    id:"medical_illegal", icon:"💊", label:"의료·의약품 불법",
    color:"#ffa657", bg:"#2d1e0a", border:"#ffa65744",
    severity:"high", desc:"의료법·약사법 위반 가능성",
    words:[
      "비아그라","시알리스","레비트라","발기부전약무처방","낙태약","낙태시술",
      "낙태병원","임신중절비용","낙태비용","미프진구매","미소프로스톨",
      "무처방약","처방전없이","약처방없이","의사처방없이","무허가의약품",
      "탈모약직구","다이어트약직구","식욕억제제불법","리덕틸","시부트라민",
      "스테로이드구매","근육증가제불법","도핑약물","EPO구매","성장호르몬불법"
    ]
  },
  {
    id:"finance_illegal", icon:"💸", label:"금융·대출·코인 불법",
    color:"#d2a8ff", bg:"#1e1533", border:"#d2a8ff44",
    severity:"high", desc:"불법 금융·사기 관련 표현",
    words:[
      // 대출·대부
      "불법대출","사채","사금융","고리대금","일수","週수","무직자대출무심사",
      "신불자대출","대출사기","작업대출","통장매매","통장팔기","통장구매",
      // 코인·투자사기
      "코인다단계","코인사기","폰지","다단계투자","불법다단계","유사수신",
      "폰테크","대포폰","폰개통대리","명의도용개통","소액결제현금화",
      // 핀테크 사기
      "상품권현금화","상품권깡","카드깡","카드현금화불법","신용카드깡",
      "피싱","보이스피싱","스미싱","파밍","해킹","개인정보판매","개인정보불법"
    ]
  },
  {
    id:"regulated_biz", icon:"⚖️", label:"규제업종 광고",
    color:"#79c0ff", bg:"#0d1e33", border:"#79c0ff44",
    severity:"mid", desc:"네이버 정책상 광고 제한 업종",
    words:[
      // 병원·의료기기·의약품
      "병원비교","병원순위","성형비용공개","성형전후사진","의료기기무허가",
      "의약품직거래","약직거래","처방약판매","의료광고불법",
      // 건강기능식품
      "질병치료효능","암치료효능","당뇨완치","혈압완치","효능보장","임상미검증",
      "건기식치료","건강식품처방","의약품급효능",
      // 법률
      "불법법률상담","변호사무허가","무자격법률","법률사기",
      // 부동산
      "부동산무허가중개","무자격중개","복비흥정불법","이중계약","전세사기방법",
      // 맛집 허위
      "맛집조작","리뷰조작","별점조작","바이럴마케팅허위","후기조작",
      // 주류
      "미성년자주류","청소년술","미성년음주","술배달불법","주류불법거래",
      // 웨딩
      "웨딩사기","결혼사기","웨딩업체먹튀",
      // 안경·렌즈
      "렌즈무처방","안경무자격","콘택트렌즈불법판매",
      // 안마·마사지
      "불법안마","무자격마사지","성인마사지","해피엔딩","풀사롱","키스방","오피",
      "건마","감성마사지","조건마사지",
      // 중고차
      "침수차판매","사고차숨김","허위매물","주행거리조작","중고차사기",
      // 운전연수·주차대행
      "무자격운전연수","불법운전연수","주차대행사기",
      // 문신·타투
      "무면허타투","불법문신시술","타투무허가",
      // 왁싱
      "불법왁싱","무자격왁싱시술",
      // 누수
      "누수사기","누수허위수리","누수바가지"
    ]
  },
  {
    id:"sensitive", icon:"🏛️", label:"정치·종교·사회 분란",
    color:"#ffa657", bg:"#2d1e0a", border:"#ffa65744",
    severity:"mid", desc:"커뮤니티 분란·혐오 표현",
    words:[
      // 정치
      "선거조작","투표조작","부정선거","정치공작","종북","빨갱이","토착왜구",
      "극우","극좌","일베","좌파척결","우파척결","정치테러","정치음모",
      // 종교
      "사이비종교","이단","신천지","JMS","구원파","사이비교주","종교사기",
      "종교착취","헌금강요","세뇌종교",
      // 혐오
      "여혐","남혐","인종혐오","장애인혐오","성소수자혐오","외국인혐오",
      "지역혐오","집단따돌림조장","학교폭력조장"
    ]
  },
  {
    id:"counterfeit", icon:"👜", label:"이미테이션·불법복제",
    color:"#8b949e", bg:"#21262d", border:"#8b949e44",
    severity:"mid", desc:"상표권·지식재산권 침해",
    words:[
      "이미테이션","짝퉁","레플리카","A급짝퉁","명품짝퉁","고퀄짝퉁",
      "샤넬짝퉁","루이비통짝퉁","구찌짝퉁","롤렉스짝퉁","명품레플",
      "레플구매","짝퉁구매","가품판매","위조상품","짝퉁쇼핑몰",
      "상표위조","특허침해","디자인도용","위조지폐","위조화폐"
    ]
  },
  {
    id:"tobacco_diet", icon:"🚬", label:"담배·다이어트·탈모",
    color:"#8b949e", bg:"#21262d", border:"#8b949e44",
    severity:"low", desc:"네이버 광고 제한·저품질 처리 가능",
    words:[
      // 담배·전자담배
      "담배추천","전자담배추천","액상추천","니코틴무제한","미성년자흡연",
      "담배불법거래","담배밀수","담배무관세",
      // 다이어트 과장
      "한달에10kg","일주일다이어트","기적의다이어트","살빼는약추천",
      "다이어트보장","체중감량보장","비만치료보장",
      // 탈모 과장
      "탈모완치","탈모보장치료","머리카락재생보장","탈모약효능보장"
    ]
  },
  {
    id:"ad", icon:"📢", label:"광고·협찬",
    color:"#ffa657", bg:"#2d1e0a", border:"#ffa65744",
    severity:"mid", desc:"네이버 블로그 저품질 처리 대상",
    words:[
      "협찬","대가성","체험단","서포터즈","기자단","무료제공","홍보비","원고료",
      "광고비","제공받아","지원받아","협찬받은","무료로받은","광고성","유료광고",
      "뒷광고","내돈내산아님","제품협찬","서비스협찬","금전적대가"
    ]
  },
  {
    id:"spam", icon:"💰", label:"상업·스팸",
    color:"#d2a8ff", bg:"#1e1533", border:"#d2a8ff44",
    severity:"low", desc:"스팸성 키워드로 검색 순위 하락",
    words:[
      "클릭","지금바로","한정수량","선착순","특가","최저가","공구","당첨",
      "프로모션","이벤트참여","캐시백","포인트적립","카드할인","무료배송",
      "특별할인","할인쿠폰","공짜","사은품","경품","초특가","역대급","미친가격",
      "대박","압도적","엄청난혜택","공짜로","무조건당첨","100%당첨"
    ]
  },
  {
    id:"quality", icon:"⚠️", label:"저품질 패턴",
    color:"#484f58", bg:"#161b22", border:"#48485844",
    severity:"low", desc:"네이버 AI가 저품질로 판단할 수 있는 표현",
    words:[
      "무조건","반드시","꼭봐야","충격적","놀라운","대박나는","돈버는","부업",
      "재택근무","월수익","월천","투자수익","수익인증","불로소득","주식대박","코인대박",
      "클릭하세요","지금확인","바로가기","여기클릭","링크클릭","지금신청"
    ]
  },
];

// 금칙어 전체 목록 (detectForbidden에서 사용)
const FORBIDDEN_WORDS = FORBIDDEN_CATEGORIES.flatMap(c=>c.words);

// 카테고리 매핑
function getForbiddenCategory(word){
  return FORBIDDEN_CATEGORIES.find(c=>c.words.includes(word));
}
const OUTPUT_FORMATS = [
  { id:"jpeg", label:"JPEG", mime:"image/jpeg", ext:"jpg", hasQuality:true },
  { id:"png",  label:"PNG",  mime:"image/png",  ext:"png", hasQuality:false },
  { id:"webp", label:"WEBP", mime:"image/webp", ext:"webp", hasQuality:true },
];
const COMPETITION_COLOR = {"매우낮음":"#3fb950","낮음":"#79c0ff","보통":"#ffa657","높음":"#ff7b72","매우높음":"#f85149"};

// ─── Helpers ──────────────────────────────────────────────────────────────
function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function detectForbidden(text){
  const results=[];
  FORBIDDEN_CATEGORIES.forEach(cat=>{
    cat.words.forEach(w=>{
      const matches=text.match(new RegExp(escapeRegex(w),"g"))||[];
      if(matches.length>0){
        // 구문 추출: 단어 주변 20자
        const idx=text.indexOf(w);
        const start=Math.max(0,idx-10);
        const end=Math.min(text.length,idx+w.length+10);
        const phrase=text.slice(start,end).replace(/\n/g," ");
        results.push({word:w,count:matches.length,catId:cat.id,catIcon:cat.icon,catLabel:cat.label,catColor:cat.color,catBg:cat.bg,catBorder:cat.border,severity:cat.severity,phrase});
      }
    });
  });
  // 심각도 순 정렬: high → mid → low
  const sevOrder={high:0,mid:1,low:2};
  return results.sort((a,b)=>(sevOrder[a.severity]??2)-(sevOrder[b.severity]??2));
}
function highlightText(text,list,repl){
  const active=list.filter(({word})=>!repl[word]?.trim()).map(({word})=>word);
  if(!active.length) return text;
  const pat=new RegExp(`(${active.map(escapeRegex).join("|")})`, "g");
  const parts=[]; let last=0,m;
  while((m=pat.exec(text))!==null){
    if(m.index>last) parts.push({text:text.slice(last,m.index),h:false});
    parts.push({text:m[0],h:true}); last=m.index+m[0].length;
  }
  if(last<text.length) parts.push({text:text.slice(last),h:false});
  return parts;
}
function countChars(t){
  return{total:t.length,noSpace:t.replace(/\s/g,"").length,bytes:new TextEncoder().encode(t).length,
    words:t.trim()?t.trim().split(/\s+/).length:0,lines:t.split("\n").length,
    sentences:t.split(/[.!?。！？]+/).filter(s=>s.trim()).length};
}
function analyzeRepetition(text,threshold=3){
  const words=text.match(/[가-힣a-zA-Z0-9]{2,}/g)||[];
  const freq={}; words.forEach(w=>{const k=w.toLowerCase();freq[k]=(freq[k]||0)+1;});
  return Object.entries(freq).filter(([,c])=>c>=threshold).sort((a,b)=>b[1]-a[1]).slice(0,50);
}
function fmtSize(bytes){
  if(bytes<1024) return bytes+"B";
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+"KB";
  return (bytes/1024/1024).toFixed(2)+"MB";
}
function fixRawControlChars(str) {
  let result = "", inString = false, escaped = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\" && inString) { result += ch; escaped = true; continue; }
    if (ch === '"') { result += ch; inString = !inString; continue; }
    if (inString && (ch === "\n" || ch === "\r" || ch === "\t")) {
      result += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : "\\t";
    } else {
      result += ch;
    }
  }
  return result;
}
function safeParseJson(raw) {
  const si = raw.indexOf("{"), ei = raw.lastIndexOf("}");
  const jsonStr = si !== -1 && ei !== -1 ? raw.slice(si, ei + 1) : raw;
  try { return JSON.parse(jsonStr); }
  catch (_) { return JSON.parse(fixRawControlChars(jsonStr)); }
}

async function callClaude(messages,system,maxTokens=2000,model="claude-haiku-4-5-20251001"){
  const body={model,max_tokens:maxTokens,messages};
  if(system) body.system=system;

  const res=await fetch("/api/claude",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });

  const rawText=await res.text();
  let data;
  try{ data=JSON.parse(rawText); }
  catch(_){ throw new Error("API 응답 파싱 실패: "+rawText.slice(0,120)); }

  if(!res.ok){
    const msg=data?.message||data?.error||("HTTP "+res.status);
    throw new Error(typeof msg==="object"?(msg.message||JSON.stringify(msg)):msg);
  }
  if(data.error){
    const errMsg = typeof data.error === "object"
      ? (data.error.message || JSON.stringify(data.error))
      : (data.message || data.error);
    throw new Error(errMsg);
  }

  return data.content?.[0]?.text||"";
}

// 웹 검색 도구를 붙인 호출. [확인필요:] 항목을 실제 출처로 채울 때 쓴다.
// 응답에 검색 결과 블록이 섞여 오므로 text 블록만 모아서 돌려준다.
async function callClaudeSearch(messages, system, maxTokens=3000, model="claude-sonnet-4-5-20250929", maxSearches=6) {
  const body = {
    model,
    max_tokens: maxTokens,
    messages,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: maxSearches }],
  };
  if (system) body.system = system;

  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  let data;
  try { data = JSON.parse(rawText); }
  catch(_) {
    throw new Error(
      /TIMEOUT/i.test(rawText)
        ? "조사 시간이 초과됐습니다. 항목을 줄여서 다시 시도해주세요."
        : "API 응답 파싱 실패: " + rawText.slice(0, 120)
    );
  }
  if (data.error) {
    const msg = typeof data.error === "object"
      ? (data.error.message || JSON.stringify(data.error))
      : (data.message || data.error);
    throw new Error(msg);
  }

  const text = (data.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("조사 결과가 비어있습니다.");
  return stripCodeFence(text);
}

function stripCodeFence(text) {
  return String(text || "")
    .replace(/^```json\n*/i, "")
    .replace(/^```\n*/i, "")
    .replace(/\n*```$/i, "")
    .trim();
}

// 실제 SSE 스트리밍. 토큰이 오는 대로 받으므로 긴 본문에서도 중간 결과가 남는다.
async function callClaudeStream(messages, system, maxTokens=3500, model="claude-sonnet-4-5-20250929", onChunk) {
  const body = { model, max_tokens: maxTokens, messages, stream: true };
  if (system) body.system = system;

  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const ctype = res.headers.get("content-type") || "";

  // 스트리밍이 아닌 응답(에러 JSON 등)은 기존 방식으로 처리
  if (!ctype.includes("text/event-stream") || !res.body) {
    const rawText = await res.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch(_) {
      throw new Error(
        res.status === 504 || /TIMEOUT/i.test(rawText)
          ? "생성 시간이 초과됐습니다. 잠시 후 다시 시도해주세요."
          : "API 응답 파싱 실패: " + rawText.slice(0, 120)
      );
    }
    if (data.error) {
      const msg = typeof data.error === "object"
        ? (data.error.message || JSON.stringify(data.error))
        : (data.message || data.error);
      throw new Error(msg);
    }
    const text = data.content?.[0]?.text || "";
    if (!text) throw new Error("응답이 비어있습니다.");
    if (onChunk) onChunk(text);
    return stripCodeFence(text);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full   = "";
  let apiError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE는 빈 줄로 이벤트가 구분된다
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const evt of events) {
      for (const line of evt.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const obj = JSON.parse(payload);
          if (obj.type === "content_block_delta" && obj.delta?.type === "text_delta") {
            full += obj.delta.text;
            if (onChunk) onChunk(full);
          } else if (obj.type === "error") {
            apiError = obj.error?.message || "생성 중 오류가 발생했습니다.";
          }
        } catch(_) { /* 조각난 JSON은 무시 */ }
      }
    }
  }

  if (apiError) throw new Error(apiError);
  if (!full.trim()) throw new Error("응답이 비어있습니다.");

  return stripCodeFence(full);
}

// 메인 탭 (네비바에 표시)
const TABS=[
  {id:"write",   icon:"✍️",  label:"글쓰기",     isGroup:true},
  {id:"missing", icon:"📡",  label:"누락 확인"},
  {id:"image",   icon:"🖼️", label:"이미지 편집", isGroup:true},
];

// 동영상 편집 서브탭
const VIDEO_SUBTABS=[
  {id:"video",    icon:"🎬", label:"동영상 용량 조절"},
  {id:"videogif", icon:"🎞️", label:"동영상 → GIF 변환"},
  {id:"videomake-ai",  icon:"🤖", label:"AI 영상 생성"},
  {id:"videomake-ken", icon:"✨", label:"켄번스 효과"},
  {id:"videomake-sub", icon:"💬", label:"자막 + 음성"},
];

// 글쓰기 서브탭
const WRITE_SUBTABS=[
  {id:"autowrite", icon:"🏷️", label:"카테고리별 키워드추출"},
  {id:"keyword",   icon:"🔍", label:"키워드 글쓰기"},
  {id:"analyze",   icon:"📊", label:"글분석"},
  {id:"rewrite",   icon:"🔗", label:"기사 리라이팅", hidden:true},
  {id:"emoji",     icon:"😃", label:"이모지"},
];

// 이미지 편집 서브탭
const IMAGE_SUBTABS=[
  {id:"ocr",         icon:"🖼️", label:"이미지 텍스트추출"},
  {id:"convert",     icon:"🔄", label:"이미지 형식변환"},
  {id:"crop",        icon:"✂️",  label:"이미지 자르기"},
  {id:"resize",      icon:"📐", label:"이미지 크기조절"},
  {id:"imgcompress", icon:"💾", label:"이미지 용량압축"},
  {id:"restore",     icon:"✨", label:"사진 복원·향상"},
  {id:"exif",        icon:"🔒", label:"이미지 데이터제거"},
];

// 전체 렌더링 대상 탭 (display:none 마운트용 — 서브탭 포함)
const ALL_TABS=[
  ...WRITE_SUBTABS,
  ...TABS.filter(t=>!t.isGroup),
  ...IMAGE_SUBTABS,
  ...VIDEO_SUBTABS,
];
// ─── Shared UI ────────────────────────────────────────────────────────────
function Textarea({value,onChange,placeholder,rows=9}){
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{width:"100%",boxSizing:"border-box",padding:"14px 16px",background:"#0d1117",
      border:"1px solid #30363d",borderRadius:"10px",color:"#e6edf3",
      fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",lineHeight:"1.7",resize:"vertical",outline:"none"}}
    onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>;
}
// ─── 블로그 본문 미리보기 (네이버 블로그 형식 렌더링) ──────────────────────
function BlogPreview({ text }) {
  const [open, setOpen] = React.useState(false);

  const renderContent = (md) => {
    const lines = md.split("\n");
    const result = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // ━━━ 텍스트 표 감지 (━ 또는 ─ 로 된 구분선 포함 블록)
      if (line.includes("━━") || line.includes("───")) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim() !== "") {
          tableLines.push(lines[i]);
          i++;
        }
        result.push(
          <div key={`tt${i}`} style={{background:"#0d1117",border:"1px solid #30363d",borderRadius:"8px",
            padding:"10px 14px",margin:"10px 0",fontFamily:"monospace",fontSize:"12px",
            color:"#c9d1d9",whiteSpace:"pre",overflowX:"auto"}}>
            {tableLines.join("\n")}
          </div>
        );
        continue;
      }

      // ▶ 소제목
      if (line.startsWith("▶ ") || line.startsWith("▶")) {
        const heading = line.replace(/^▶\s*/, "");
        result.push(<div key={i} style={{fontSize:"15px",fontWeight:700,color:"#e6edf3",
          margin:"16px 0 6px",borderLeft:"3px solid #1f6feb",paddingLeft:"10px"}}>{heading}</div>);
      }
      // ## 소제목 (하위호환)
      else if (line.startsWith("## ")) {
        result.push(<div key={i} style={{fontSize:"15px",fontWeight:700,color:"#e6edf3",
          margin:"16px 0 6px",borderLeft:"3px solid #1f6feb",paddingLeft:"10px"}}>{line.slice(3)}</div>);
      } else if (line.startsWith("# ")) {
        result.push(<div key={i} style={{fontSize:"16px",fontWeight:700,color:"#fff",margin:"16px 0 8px"}}>{line.slice(2)}</div>);
      } else if (line.trim() === "") {
        result.push(<div key={i} style={{height:"6px"}}/>);
      } else {
        result.push(<div key={i} style={{fontSize:"13px",color:"#c9d1d9",lineHeight:"1.8",marginBottom:"2px"}}>{line}</div>);
      }
      i++;
    }
    return result;
  };

  // 표가 있는지 확인
  const hasTable = text.includes("━━") || text.includes("───");

  return <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",overflow:"hidden"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"10px 14px",cursor:"pointer",userSelect:"none"}}
      onClick={()=>setOpen(o=>!o)}>
      <span style={{fontSize:"12px",fontWeight:700,color:"#8b949e"}}>
        📄 본문 미리보기
        {hasTable&&<span style={{marginLeft:"8px",background:"#1f6feb33",color:"#58a6ff",
          fontSize:"10px",padding:"2px 7px",borderRadius:"10px",border:"1px solid #1f6feb44"}}>표 포함</span>}
      </span>
      <span style={{color:"#484f58",fontSize:"11px"}}>{open?"▲ 접기":"▼ 펼치기"}</span>
    </div>
    {open&&<div style={{padding:"14px 16px",borderTop:"1px solid #21262d",maxHeight:"500px",overflowY:"auto"}}>
      {renderContent(text)}
    </div>}
  </div>;
}

function Btn({onClick,children,variant="primary",loading,disabled}){
  const bg={primary:"#1f6feb",secondary:"#21262d",success:"#2ea043",danger:"#da3633"};
  return <button onClick={onClick} disabled={loading||disabled} style={{
    background:bg[variant],color:variant==="secondary"?"#c9d1d9":"#fff",
    padding:"9px 20px",borderRadius:"8px",border:variant==="secondary"?"1px solid #30363d":"none",
    cursor:(loading||disabled)?"not-allowed":"pointer",fontFamily:"'Noto Sans KR',sans-serif",
    fontSize:"13px",fontWeight:600,opacity:(loading||disabled)?.6:1,
  }}>{loading?"⏳ 처리중...":children}</button>;
}
function StatCard({label,value,accent}){
  return <div style={{background:"#161b22",borderRadius:"10px",padding:"14px 18px",textAlign:"center",borderTop:`3px solid ${accent||"#1f6feb"}`}}>
    <div style={{color:accent||"#58a6ff",fontSize:"22px",fontWeight:700}}>{typeof value==="number"?value.toLocaleString():value}</div>
    <div style={{color:"#8b949e",fontSize:"12px",marginTop:"4px"}}>{label}</div>
  </div>;
}
function SectionTitle({children}){
  return <div style={{color:"#8b949e",fontSize:"12px",fontWeight:700,marginBottom:"10px",letterSpacing:"0.04em"}}>{children}</div>;
}

// ─── 금칙어 섹션 (AI 추천 포함) ──────────────────────────────────────────
function ForbiddenSection({workingText,forbidden,hp,replacements,setReplacements,doReplace,doReplaceAll}){
  const [aiLoading,setAiLoading]=useState(false);
  const [perLoading,setPerLoading]=useState({});

  const aiRecommendAll=async()=>{
    if(!forbidden.length||aiLoading) return;
    setAiLoading(true);
    try{
      const contexts=forbidden.map(({word})=>{
        const idx=workingText.indexOf(word);
        if(idx===-1) return{word,context:""};
        const start=Math.max(0,idx-30);
        const end=Math.min(workingText.length,idx+word.length+30);
        return{word,context:workingText.slice(start,end)};
      });
      const prompt=`블로그 글에서 금칙어가 발견됐습니다. 각 금칙어를 문맥에 맞는 자연스러운 대체 단어로 추천해주세요.
반드시 순수 JSON 배열만 출력. 마크다운 없이.

규칙:
- 대체어는 반드시 아래 금칙어 목록에 없는 단어
- 문장 흐름을 유지하는 자연스러운 한국어 단어
- 대체어는 쉼표로 구분된 1~3개 문자열
- 금칙어 목록: ${FORBIDDEN_WORDS.join(",")}

발견된 금칙어와 문맥:
${contexts.map(({word,context})=>`- 금칙어: "${word}" / 문맥: "...${context}..."`).join("\n")}

출력 형식:
[{"word":"금칙어1","suggestions":"대체어1, 대체어2"},{"word":"금칙어2","suggestions":"대체어1"}]`;

      const raw=await callClaude([{role:"user",content:prompt}],
        "Korean blog writing expert. Output ONLY valid JSON array.",800);
      const s=raw.indexOf("["),e=raw.lastIndexOf("]");
      const arrStr=s!==-1&&e!==-1?raw.slice(s,e+1):raw;
      const arr=JSON.parse(fixRawControlChars(arrStr));
      const updates={};
      const suggMap={};
      arr.forEach(({word,suggestions})=>{
        if(word&&suggestions){
          const parts=suggestions.split(",").map(x=>x.trim()).filter(Boolean);
          updates[word]=parts[0]||"";
          suggMap[`${word}__suggestions`]=suggestions;
        }
      });
      setReplacements(prev=>({...prev,...updates}));
      setPerLoading(prev=>({...prev,...suggMap}));
    }catch(err){}
    setAiLoading(false);
  };

  const aiRecommendOne=async(word)=>{
    if(perLoading[word]===true) return;
    setPerLoading(p=>({...p,[word]:true}));
    try{
      const idx=workingText.indexOf(word);
      const start=Math.max(0,idx-50);
      const end=Math.min(workingText.length,idx+word.length+50);
      const context=idx!==-1?workingText.slice(start,end):"";
      const prompt=`블로그 글에서 금칙어 "${word}"를 대체할 자연스러운 단어를 추천해주세요.
문맥: "...${context}..."
금칙어 목록(사용 금지): ${FORBIDDEN_WORDS.join(",")}

규칙:
- 금칙어 목록에 없는 단어만 추천
- 문장 흐름에 자연스러운 한국어
- 쉼표로 구분된 추천 단어 3개만 출력 (설명 없이)
예시 출력: 합리적인, 경제적인, 알맞은`;
      const raw=await callClaude([{role:"user",content:prompt}],
        "Korean blog writing expert. Output ONLY comma-separated Korean words, nothing else.",300);
      const suggestions=raw.replace(/["""*]/g,"").trim();
      const first=suggestions.split(",")[0].trim();
      if(first) setReplacements(p=>({...p,[word]:first}));
      setPerLoading(p=>({...p,[word]:false,[`${word}__suggestions`]:suggestions}));
    }catch(err){
      setPerLoading(p=>({...p,[word]:false}));
    }
  };

  // 카테고리별 그룹화
  const byCat={};
  forbidden.forEach(item=>{
    if(!byCat[item.catId]) byCat[item.catId]=[];
    byCat[item.catId].push(item);
  });
  const highCount=forbidden.filter(f=>f.severity==="high").length;

  return <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
    {!workingText&&<div style={{background:"#161b22",borderRadius:"10px",padding:"24px",border:"1px solid #30363d",color:"#484f58",fontSize:"14px",textAlign:"center"}}>글 입력 후 잠시 기다리면 자동으로 분석됩니다</div>}
    {workingText&&<>
      {/* 요약 헤더 */}
      <div style={{background:highCount>0?"#2d0b0b":"#0d2019",border:`1px solid ${highCount>0?"#f8514944":"#2ea04344"}`,borderRadius:"12px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"14px"}}>
        <div style={{fontSize:"28px"}}>{highCount>0?"🔞":forbidden.length>0?"⚠️":"✅"}</div>
        <div style={{flex:1}}>
          <div style={{color:highCount>0?"#f85149":forbidden.length>0?"#ffa657":"#3fb950",fontSize:"15px",fontWeight:700,marginBottom:"4px"}}>
            {highCount>0?`19금·위험 단어 ${highCount}개 발견 — 네이버 노출 차단 위험`:forbidden.length>0?`금칙어 총 ${forbidden.length}개 발견`:"금칙어 없음 ✓"}
          </div>
          <div style={{color:"#8b949e",fontSize:"12px"}}>
            {FORBIDDEN_CATEGORIES.filter(c=>byCat[c.id]).map(c=>`${c.icon} ${c.label} ${byCat[c.id].length}개`).join(" · ")||"모든 카테고리 통과"}
          </div>
        </div>
        <div style={{display:"flex",gap:"6px",flexDirection:"column",alignItems:"flex-end"}}>
          {forbidden.length>0&&<button onClick={aiRecommendAll} disabled={aiLoading}
            style={{padding:"7px 14px",background:aiLoading?"#21262d":"linear-gradient(135deg,#1f6feb,#8957e5)",
              color:aiLoading?"#484f58":"#fff",border:"none",borderRadius:"8px",cursor:aiLoading?"not-allowed":"pointer",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:700}}>
            {aiLoading?"⏳ 추천중...":"✨ AI 전체 대체 추천"}
          </button>}
          {forbidden.length>0&&Object.values(replacements).some(v=>v?.trim())&&
            <button onClick={doReplaceAll}
              style={{padding:"7px 14px",background:"#2ea043",color:"#fff",border:"none",borderRadius:"8px",
                cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:700}}>
              ✅ 전체 바꾸기
            </button>}
          <button onClick={()=>navigator.clipboard.writeText(workingText)}
            style={{padding:"7px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
              borderRadius:"8px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px"}}>
            📋 결과 복사
          </button>
        </div>
      </div>

      {/* 카테고리별 금칙어 목록 */}
      {forbidden.length>0&&<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {FORBIDDEN_CATEGORIES.filter(c=>byCat[c.id]).map(cat=>(
          <div key={cat.id} style={{background:cat.bg,border:`1px solid ${cat.border}`,borderRadius:"12px",overflow:"hidden"}}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${cat.border}`,display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"16px"}}>{cat.icon}</span>
              <span style={{color:cat.color,fontWeight:700,fontSize:"13px"}}>{cat.label}</span>
              <span style={{background:cat.color+"22",color:cat.color,border:`1px solid ${cat.color}44`,borderRadius:"20px",padding:"1px 10px",fontSize:"11px",fontWeight:700}}>{byCat[cat.id].length}개</span>
              <span style={{color:"#484f58",fontSize:"11px",marginLeft:"4px"}}>{cat.desc}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column"}}>
              {byCat[cat.id].map((item,i)=>{
                const isPerLoading=perLoading[item.word]===true;
                const suggRaw=perLoading[`${item.word}__suggestions`];
                const suggList=suggRaw?suggRaw.split(",").map(s=>s.trim()).filter(Boolean):[];
                return <div key={item.word} style={{borderBottom:i<byCat[cat.id].length-1?`1px solid ${cat.border}`:"none",padding:"10px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:suggList.length>0?"6px":"0"}}>
                    {/* 금칙어 + 구문 */}
                    <div style={{minWidth:"120px"}}>
                      <span style={{color:cat.color,fontWeight:700,fontSize:"13px"}}>"{item.word}"</span>
                      <span style={{color:"#484f58",fontSize:"10px",marginLeft:"6px"}}>{item.count}회</span>
                      {item.phrase&&<div style={{color:"#8b949e",fontSize:"10px",marginTop:"2px",fontStyle:"italic"}}>
                        ...{item.phrase}...
                      </div>}
                    </div>
                    {/* 대체어 입력 */}
                    <input
                      value={replacements[item.word]||""}
                      onChange={e=>setReplacements(p=>({...p,[item.word]:e.target.value}))}
                      placeholder={isPerLoading?"AI 추천 중...":"대체 단어 입력 또는 AI 추천 →"}
                      onKeyDown={e=>e.key==="Enter"&&doReplace(item.word)}
                      style={{flex:1,padding:"6px 8px",background:"#0d1117",
                        border:`1px solid ${replacements[item.word]?.trim()?"#1f6feb66":"#30363d"}`,
                        borderRadius:"6px",color:"#e6edf3",fontSize:"12px",outline:"none",
                        fontFamily:"'Noto Sans KR',sans-serif",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#58a6ff"}
                      onBlur={e=>e.target.style.borderColor=replacements[item.word]?.trim()?"#1f6feb66":"#30363d"}/>
                    {/* 버튼 */}
                    <button onClick={()=>aiRecommendOne(item.word)} disabled={isPerLoading} title="AI 대체어 추천"
                      style={{padding:"6px 8px",background:isPerLoading?"#21262d":"#8957e522",
                        color:isPerLoading?"#484f58":"#d2a8ff",border:`1px solid ${isPerLoading?"#30363d":"#8957e544"}`,
                        borderRadius:"6px",cursor:isPerLoading?"not-allowed":"pointer",fontSize:"13px",flexShrink:0}}>
                      {isPerLoading?"⏳":"✨"}
                    </button>
                    <button onClick={()=>doReplace(item.word)}
                      style={{padding:"6px 12px",background:replacements[item.word]?.trim()?"#1f6feb":"#21262d",
                        color:replacements[item.word]?.trim()?"#fff":"#484f58",border:"none",
                        borderRadius:"6px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",
                        fontSize:"11px",fontWeight:600,flexShrink:0}}>
                      바꾸기
                    </button>
                  </div>
                  {suggList.length>0&&<div style={{display:"flex",gap:"5px",flexWrap:"wrap",paddingLeft:"130px"}}>
                    <span style={{color:"#484f58",fontSize:"10px",flexShrink:0,alignSelf:"center"}}>추천:</span>
                    {suggList.map((s,si)=>(
                      <button key={si} onClick={()=>setReplacements(p=>({...p,[item.word]:s}))}
                        style={{padding:"2px 10px",background:replacements[item.word]===s?"#1f6feb22":"#21262d",
                          color:replacements[item.word]===s?"#58a6ff":"#8b949e",
                          border:`1px solid ${replacements[item.word]===s?"#1f6feb55":"#30363d"}`,
                          borderRadius:"20px",cursor:"pointer",fontSize:"11px",
                          fontFamily:"'Noto Sans KR',sans-serif"}}>
                        {s}
                      </button>
                    ))}
                  </div>}
                </div>;
              })}
            </div>
          </div>
        ))}
      </div>}

      {/* 미리보기 */}
      {forbidden.length>0&&<div>
        <div style={{fontSize:"12px",color:"#8b949e",marginBottom:"8px",fontWeight:600}}>📄 텍스트 미리보기 (금칙어 하이라이트)</div>
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"14px",
          fontSize:"13px",lineHeight:"1.9",color:"#c9d1d9",maxHeight:"300px",overflowY:"auto",
          whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
          {Array.isArray(hp)
            ?hp.map((p,i)=>{
              const cat=p.h?getForbiddenCategory(p.text):null;
              return <span key={i} style={p.h?{color:cat?.color||"#ff7b72",background:(cat?.color||"#ff7b72")+"22",borderRadius:"2px",padding:"0 2px",fontWeight:700}:{}}>
                {p.text}
              </span>;
            })
            :workingText}
        </div>
      </div>}

      {forbidden.length===0&&<div style={{background:"#0d2019",border:"1px solid #2ea04344",borderRadius:"10px",padding:"20px",textAlign:"center"}}>
        <div style={{fontSize:"24px",marginBottom:"8px"}}>✅</div>
        <div style={{color:"#3fb950",fontSize:"14px",fontWeight:700}}>모든 카테고리 금칙어 없음</div>
        <div style={{color:"#484f58",fontSize:"12px",marginTop:"4px"}}>19금 · 도박 · 광고 · 스팸 · 저품질 패턴 모두 통과</div>
      </div>}
    </>}
  </div>;
}


// ─── 단락별 이미지 프롬프트 생성 컴포넌트 (GPT 이미지 생성용) ─────────────────
const IMG_STYLES=[
  {id:"photo", label:"실사 사진",
   en:"photorealistic editorial photograph, natural soft lighting, shallow depth of field, bright and clean, high detail",
   ko:"실사 사진 느낌, 자연스럽고 부드러운 조명, 얕은 심도, 밝고 깔끔한 분위기, 높은 디테일"},
  {id:"3d", label:"3D 일러스트",
   en:"soft 3D rendered illustration, rounded friendly shapes, pastel color palette, studio lighting, clean simple background",
   ko:"부드러운 3D 렌더링 일러스트, 둥글둥글한 형태, 파스텔 색감, 스튜디오 조명, 단순하고 깔끔한 배경"},
  {id:"flat", label:"플랫 일러스트",
   en:"flat vector illustration, simple geometric shapes, limited color palette, minimal shading, modern web illustration style",
   ko:"플랫 벡터 일러스트, 단순한 도형 위주, 절제된 색상, 최소한의 음영, 모던한 웹 일러스트 스타일"},
  {id:"info", label:"미니멀 인포그래픽",
   en:"minimal infographic style illustration, clean icons and simple shapes, generous white space, two accent colors",
   ko:"미니멀 인포그래픽 스타일, 깔끔한 아이콘과 단순한 도형, 넉넉한 여백, 두 가지 포인트 컬러"},
];
const IMG_RATIOS=["16:9","4:3","1:1","3:4"];

function buildFullPrompt(item,styleId,ratio,lang){
  const st=IMG_STYLES.find(s=>s.id===styleId)||IMG_STYLES[0];
  if(lang==="ko"){
    const scene=(item.sceneKo||item.scene||"").trim();
    return `${scene} ${st.ko}. ${ratio} 비율. 이미지 안에 글자·문자·로고·워터마크는 넣지 말 것.`;
  }
  const scene=(item.scene||"").trim();
  return `${scene} ${st.en}. ${ratio} aspect ratio. No text, letters, watermarks or logos in the image.`;
}

function ImageGenSection({postMeta,postContent,genImages,setGenImages,imgLoading,setImgLoading,imgError,setImgError,imgSections,setImgSections}){
  const [styleId,setStyleId]=useState("photo");
  const [ratio,setRatio]=useState("16:9");
  const [lang,setLang]=useState("ko");
  const [copied,setCopied]=useState(null);

  const copyText=async(txt,key)=>{
    try{
      await navigator.clipboard.writeText(txt);
    }catch(_){
      const ta=document.createElement("textarea");
      ta.value=txt; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      try{ document.execCommand("copy"); }catch(_e){}
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(()=>setCopied(c=>c===key?null:c),1500);
  };

  const startGenerate=async()=>{
    if(!postContent||postContent.trim().length<50){
      setImgError("본문이 너무 짧습니다. 글을 먼저 입력해주세요.");
      return;
    }
    setImgLoading(true);
    setGenImages([]);
    setImgSections([]);
    setImgError("");

    try{
      // ── Claude가 본문을 5개 단락으로 나누고 각 단락의 '장면'을 묘사 ──
      const analysisReq=`You are a blog image art director. Read the Korean blog post below and split it into exactly 5 key sections, following the flow of the post from beginning to end. For each section, describe ONE concrete visual scene that would illustrate it well.

Blog Title: ${postMeta.title||""}
Main Keyword: ${postMeta.main_keyword||""}
Tags: ${(postMeta.tags||[]).join(", ")}

Blog Content:
${postContent.slice(0,3000)}

Rules:
- GROUNDING (most important): every section and every scene must come STRICTLY from what the post actually says. Follow the post's real order. Do not add objects, places, activities, situations or facts that do not appear in the post.
- "sectionDesc" must summarise an actual passage of the post — never a topic the post does not cover.
- Exactly 5 sections, each covering a DIFFERENT aspect of the post
- Each scene must be visually distinct from the others (different subject, setting, angle)
- Describe the SCENE ONLY: subject, setting, composition, mood, colors. Do NOT include style keywords, camera specs, aspect ratio, or "no text" instructions — those are appended later
- If the post is about a specific product, brand or service, depict it accurately at CATEGORY level — correct form factor, scale and usage context (e.g. "a modern foldable smartphone held open in both hands"). Never depict a shape, feature or usage that contradicts the post, and never guess at details the post does not state.
- Never visualise prices, numbers, charts, graphs, screens or UI text — an image must not assert a fact the post has not stated.
- 25-50 words per scene, plain descriptive English
- No real brand names, no logos, no brand marks, no readable text, no recognizable real people or celebrity faces
- "sceneKo" = natural Korean rendering of the exact same scene
- "sectionTitle" = short Korean title, "sectionDesc" = one-line Korean summary of that section

Return ONLY valid JSON, no markdown:
{"sections":[
  {"sectionTitle":"단락 제목 (Korean)","sectionDesc":"어떤 내용인지 한 줄 (Korean)","scene":"English scene description","sceneKo":"같은 장면의 한글 묘사"},
  {"sectionTitle":"...","sectionDesc":"...","scene":"...","sceneKo":"..."},
  {"sectionTitle":"...","sectionDesc":"...","scene":"...","sceneKo":"..."},
  {"sectionTitle":"...","sectionDesc":"...","scene":"...","sceneKo":"..."},
  {"sectionTitle":"...","sectionDesc":"...","scene":"...","sceneKo":"..."}
]}`;

      const raw=await callClaude([{role:"user",content:analysisReq}],
        "You are an expert at analyzing blog posts and writing image generation prompts. Base every section and scene strictly on the given post content — never invent details, products, brands or facts the post does not contain. Depict named products only at an accurate category level, with no logos or readable text. Output ONLY valid JSON.",2500,"claude-haiku-4-5-20251001");

      if(!raw||raw.trim()==="") throw new Error("단락 분석 응답이 비어있습니다.");
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      if(s===-1||e===-1) throw new Error("단락 분석 JSON 형식 오류: "+raw.slice(0,100));
      const parsed=safeParseJson(raw);
      const sections=(parsed.sections||[]).filter(x=>x&&(x.scene||x.sceneKo)).slice(0,5);
      if(sections.length===0) throw new Error("단락 분석 실패");

      setImgSections(sections);
      setGenImages(sections);

    }catch(e){
      setImgError(e.message);
    }
    setImgLoading(false);
  };

  const allText=genImages.map((it,i)=>
    `[${i+1}] ${it.sectionTitle||`단락 ${i+1}`}\n${buildFullPrompt(it,styleId,ratio,lang)}`
  ).join("\n\n");

  return <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",overflow:"hidden"}}>
    <style>{"@keyframes imgSpin{to{transform:rotate(360deg)}}"}</style>

    {/* 헤더 */}
    <div style={{padding:"14px 18px",background:"linear-gradient(135deg,#0d1117,#161b22)",borderBottom:"1px solid #30363d",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px"}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"18px"}}>🎨</span>
          <span style={{color:"#e6edf3",fontSize:"14px",fontWeight:700}}>단락별 이미지 프롬프트 생성</span>
          <span style={{fontSize:"10px",background:"linear-gradient(135deg,#1f6feb22,#388bfd22)",color:"#58a6ff",border:"1px solid #1f6feb55",borderRadius:"10px",padding:"2px 8px",fontWeight:700}}>GPT 붙여넣기용</span>
        </div>
        <div style={{color:"#484f58",fontSize:"11px",marginTop:"3px"}}>
          본문을 5개 단락으로 분석하여 각 단락에 어울리는 이미지 생성 프롬프트 5개를 만들어줍니다
        </div>
      </div>
      <button onClick={startGenerate} disabled={imgLoading}
        style={{
          padding:"9px 20px",
          background:imgLoading?"#21262d":"linear-gradient(135deg,#1f6feb,#388bfd)",
          color:imgLoading?"#484f58":"#fff",
          border:"none",borderRadius:"8px",cursor:imgLoading?"not-allowed":"pointer",
          fontSize:"12px",fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif",
          whiteSpace:"nowrap",boxShadow:imgLoading?"none":"0 3px 12px #1f6feb55",
          transition:"all .2s",display:"flex",alignItems:"center",gap:"6px",
        }}>
        {imgLoading
          ? <><span style={{display:"inline-block",width:"12px",height:"12px",border:"2px solid #484f58",borderTopColor:"#8b949e",borderRadius:"50%",animation:"imgSpin .8s linear infinite"}}/>단락 분석 중...</>
          : genImages.length>0 ? "🔄 다시 생성" : "✨ 프롬프트 5개 생성"
        }
      </button>
    </div>

    {/* 옵션 바 */}
    <div style={{padding:"10px 16px",borderBottom:"1px solid #21262d",display:"flex",flexWrap:"wrap",gap:"14px",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
        <span style={{color:"#484f58",fontSize:"11px",fontWeight:600}}>스타일</span>
        {IMG_STYLES.map(st=>(
          <button key={st.id} onClick={()=>setStyleId(st.id)} style={{
            padding:"4px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",
            background:styleId===st.id?"#1f6feb":"#0d1117",
            color:styleId===st.id?"#fff":"#8b949e",
            border:`1px solid ${styleId===st.id?"#1f6feb":"#30363d"}`,
          }}>{st.label}</button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
        <span style={{color:"#484f58",fontSize:"11px",fontWeight:600}}>비율</span>
        {IMG_RATIOS.map(r=>(
          <button key={r} onClick={()=>setRatio(r)} style={{
            padding:"4px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",
            background:ratio===r?"#1f6feb":"#0d1117",
            color:ratio===r?"#fff":"#8b949e",
            border:`1px solid ${ratio===r?"#1f6feb":"#30363d"}`,
          }}>{r}</button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
        <span style={{color:"#484f58",fontSize:"11px",fontWeight:600}}>언어</span>
        {[{id:"en",label:"영문"},{id:"ko",label:"국문"}].map(l=>(
          <button key={l.id} onClick={()=>setLang(l.id)} style={{
            padding:"4px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:600,cursor:"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",
            background:lang===l.id?"#1f6feb":"#0d1117",
            color:lang===l.id?"#fff":"#8b949e",
            border:`1px solid ${lang===l.id?"#1f6feb":"#30363d"}`,
          }}>{l.label}</button>
        ))}
      </div>
      {genImages.length>0&&<button onClick={()=>copyText(allText,"all")} style={{
        marginLeft:"auto",padding:"5px 14px",borderRadius:"6px",fontSize:"11px",fontWeight:700,cursor:"pointer",
        fontFamily:"'Noto Sans KR',sans-serif",
        background:copied==="all"?"#2ea043":"#21262d",
        color:copied==="all"?"#fff":"#c9d1d9",
        border:`1px solid ${copied==="all"?"#2ea043":"#30363d"}`,
      }}>{copied==="all"?"✅ 복사됨":"📋 5개 전체 복사"}</button>}
    </div>

    {/* 에러 */}
    {imgError&&<div style={{margin:"12px 16px",background:"#2d1117",border:"1px solid #da363344",borderRadius:"8px",padding:"10px 14px",color:"#ff7b72",fontSize:"12px"}}>⚠️ {imgError}</div>}

    {/* 초기 안내 (생성 전) */}
    {!imgLoading&&genImages.length===0&&!imgError&&<div style={{padding:"28px 20px",textAlign:"center"}}>
      <div style={{fontSize:"36px",marginBottom:"10px"}}>📝</div>
      <div style={{color:"#8b949e",fontSize:"13px",fontWeight:600,marginBottom:"6px"}}>글 내용을 분석해서 5개 단락에 맞는 이미지 프롬프트를 만들어줍니다</div>
      <div style={{color:"#484f58",fontSize:"11px",lineHeight:"1.7"}}>
        · 각 단락마다 서로 다른 장면 프롬프트 1개씩 총 5개<br/>
        · 복사해서 ChatGPT · Gemini · Midjourney 등에 그대로 붙여넣기<br/>
        · 스타일 · 비율 · 언어는 재생성 없이 바로 바꿔서 복사 가능
      </div>
    </div>}

    {/* 프롬프트 5개 리스트 */}
    {genImages.length>0&&<div style={{padding:"14px",display:"flex",flexDirection:"column",gap:"10px"}}>
      {genImages.map((item,i)=>{
        const full=buildFullPrompt(item,styleId,ratio,lang);
        return <div key={i} style={{borderRadius:"10px",border:"1px solid #30363d",background:"#0d1117",overflow:"hidden"}}>
          <div style={{padding:"9px 12px",borderBottom:"1px solid #21262d",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{background:"#1f6feb",color:"#fff",borderRadius:"4px",padding:"1px 7px",fontSize:"10px",fontWeight:700,flexShrink:0}}>{i+1}</span>
            <div style={{minWidth:0,flex:1}}>
              <div style={{color:"#c9d1d9",fontSize:"12px",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.sectionTitle||`단락 ${i+1}`}</div>
              {item.sectionDesc&&<div style={{color:"#484f58",fontSize:"11px",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.sectionDesc}</div>}
            </div>
            <button onClick={()=>copyText(full,i)} style={{
              padding:"4px 12px",borderRadius:"6px",fontSize:"11px",fontWeight:700,cursor:"pointer",flexShrink:0,
              fontFamily:"'Noto Sans KR',sans-serif",
              background:copied===i?"#2ea043":"#21262d",
              color:copied===i?"#fff":"#c9d1d9",
              border:`1px solid ${copied===i?"#2ea043":"#30363d"}`,
            }}>{copied===i?"✅ 복사됨":"📋 복사"}</button>
          </div>
          <div onClick={()=>copyText(full,i)} style={{
            padding:"11px 13px",color:"#8b949e",fontSize:"12px",lineHeight:"1.65",cursor:"pointer",
            wordBreak:"break-word",whiteSpace:"pre-wrap",
          }}>{full}</div>
        </div>;
      })}
    </div>}

    {/* 완료 메시지 */}
    {genImages.length>0&&!imgLoading&&<div style={{padding:"8px 16px 12px",textAlign:"center",color:"#484f58",fontSize:"11px",borderTop:"1px solid #21262d"}}>
      ✅ 프롬프트 {genImages.length}개 생성 완료 · 박스를 클릭해도 복사됩니다
    </div>}
  </div>;
}


// ─── TAB 1: 글분석 ──────────────────────────────────────────────────────
function AnalyzeTab({pendingAnalyzeText="",setPendingAnalyzeText,
  pendingAnalyzePost,setPendingAnalyzePost,
  analyzeText,setAnalyzeText,analyzeAiResult,setAnalyzeAiResult,
  analyzeLastText,setAnalyzeLastText,analyzeThreshold,setAnalyzeThreshold,
  analyzeReplacements,setAnalyzeReplacements,analyzeWorkingText,setAnalyzeWorkingText,
  analyzeActiveSection,setAnalyzeActiveSection,
  analyzePostMeta,setAnalyzePostMeta}){

  const text=analyzeText; const setText=setAnalyzeText;
  const activeSection=analyzeActiveSection; const setActiveSection=setAnalyzeActiveSection;
  const [analyzing,setAnalyzing]=useState(false);
  const [autoLoading,setAutoLoading]=useState(false);
  const postMeta=analyzePostMeta; const setPostMeta=setAnalyzePostMeta;
  const [qualReplacements,setQualReplacements]=useState({});
  const [qualLoading,setQualLoading]=useState({});
  const [copiedAll,setCopiedAll]=useState(false);
  const [genImages,setGenImages]=useState([]); // [{sectionTitle, sectionDesc, scene, sceneKo}]
  const [imgLoading,setImgLoading]=useState(false);
  const [imgError,setImgError]=useState("");
  const [imgSections,setImgSections]=useState([]); // Claude가 분석한 5개 단락
  const aiResult=analyzeAiResult; const setAiResult=setAnalyzeAiResult;
  const lastText=analyzeLastText; const setLastText=setAnalyzeLastText;
  const threshold=analyzeThreshold; const setThreshold=setAnalyzeThreshold;
  const replacements=analyzeReplacements; const setReplacements=setAnalyzeReplacements;
  const workingText=analyzeWorkingText; const setWorkingText=setAnalyzeWorkingText;

  // ── [확인필요:] 항목 웹 조사 ──
  const [factLoading,setFactLoading]=useState(false);
  const [factResults,setFactResults]=useState(null);
  const [factError,setFactError]=useState("");
  const [factApplied,setFactApplied]=useState({});

  const liveText = workingText || text;
  const placeholders = useMemo(()=>{
    const out=[]; const re=/\[확인필요:\s*([^\]]+)\]/g; let m;
    while((m=re.exec(liveText))!==null){
      const label=m[1].trim();
      if(!out.includes(label)) out.push(label);
    }
    return out;
  },[liveText]);

  const runFactCheck=async()=>{
    if(placeholders.length===0) return;
    setFactLoading(true); setFactError(""); setFactResults(null); setFactApplied({});
    try{
      const prompt=`아래 블로그 글에 확인이 필요한 항목이 남아 있습니다. 웹에서 검색해서 각 항목의 실제 값을 찾아주세요.

글 제목: ${postMeta?.title||"(제목 없음)"}
메인 키워드: ${postMeta?.main_keyword||""}
오늘 날짜: ${new Date().toLocaleDateString("ko-KR")}

확인이 필요한 항목:
${placeholders.map((x,i)=>`${i+1}. ${x}`).join("\n")}

글의 맥락 (어떤 상황에서 쓰인 값인지 파악용):
${liveText.slice(0,2000)}

규칙:
- 반드시 웹 검색으로 확인된 값만 답할 것. 검색해도 확실하지 않으면 found를 false로 둘 것
- 추측하거나 일반적인 시세로 메우지 말 것. 모르면 모른다고 하는 게 맞다
- 공식 출처(사업자 공식 홈페이지, 정부·기관 사이트, 통신사 요금제 페이지 등)를 우선할 것
- value는 본문에 그대로 넣을 수 있는 짧은 형태로 (예: "5,500", "9월 15일", "약 3만원")
  단위나 조사는 본문에 이미 있으니 숫자·날짜 위주로 쓸 것
- source에는 확인한 페이지의 URL을, sourceName에는 그 사이트 이름을 적을 것
- note에는 조건이나 예외가 있으면 한 줄로 (예: "요금제별로 다름", "2026년 8월 기준")
- 지역·요금제·시점에 따라 값이 여러 개면 가장 대표적인 것 하나만 고르고 note에 범위를 적을 것

순수 JSON만 출력:
{"items":[{"label":"항목명(위 목록과 똑같이)","found":true,"value":"찾은 값","source":"https://...","sourceName":"출처 사이트명","note":"조건·기준 시점"},{"label":"...","found":false,"reason":"찾지 못한 이유"}]}`;

      const raw=await callClaudeSearch(
        [{role:"user",content:prompt}],
        `You verify factual placeholders in Korean blog drafts using web search.

Search before answering every item. Never fill a value from memory or from what seems typical — if the search does not confirm it, set found to false.
Prefer official primary sources over blogs and aggregators. When a value varies by plan, region or date, pick the most representative one and state the condition in note.
Output ONLY valid JSON.`,
        4000, "claude-sonnet-4-5-20250929", Math.min(placeholders.length * 2 + 2, 10)
      );
      const parsed=safeParseJson(raw);
      setFactResults(parsed.items||[]);
    }catch(e){ setFactError(e.message||"조사 중 오류가 발생했습니다."); }
    setFactLoading(false);
  };

  const applyFactValue=(label,value)=>{
    const esc=String(label).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const re=new RegExp("\\[확인필요:\\s*"+esc+"\\s*\\]","g");
    const next=liveText.replace(re,String(value));
    if(workingText) setWorkingText(next); else setText(next);
    setFactApplied(a=>({...a,[label]:true}));
  };


  const resetAll=()=>{
    setAnalyzeText("");setAnalyzeAiResult(null);setAnalyzeLastText("");
    setAnalyzeWorkingText("");setAnalyzeReplacements({});setAnalyzeActiveSection("morpheme");
    setPostMeta(null);setQualReplacements({});setQualLoading({});
    setGenImages([]);setImgError("");setImgSections([]);
    if(setPendingAnalyzePost) setPendingAnalyzePost(null);
  };

  // pendingAnalyzeText: 로딩 신호 처리
  useEffect(()=>{
    if(pendingAnalyzeText==="__loading__"){
      setAutoLoading(true);
      setPostMeta(null);
      setAnalyzeText("");
    } else if(pendingAnalyzeText===""){
      // goAutoWrite 완료 or 에러 시 loading 해제
      setAutoLoading(false);
    }
  },[pendingAnalyzeText]);

  const s=countChars(text);
  const grade=s.noSpace<1000?["#ff7b72","⚠️ 짧음 (1,000자 미만)","SEO 불리"]:
    s.noSpace<2000?["#ffa657","🟡 보통","2,000자 이상 권장"]:
    s.noSpace<5000?["#3fb950","✅ 적정","SEO 좋음"]:["#79c0ff","🏆 우수 콘텐츠","5,000자+"];

  const isDirty=text!==lastText&&lastText!=="";

  const runAnalysis=async()=>{
    if(!text.trim()) return;
    setAnalyzing(true); setAiResult(null);
    setWorkingText(text); setReplacements({}); setQualReplacements({});

    const prompt=`다음 블로그 글을 두 가지 관점에서 분석해줘. 반드시 순수 JSON만 출력해. 마크다운 없이.

=== 분석할 글 ===
${text.slice(0,4000)}
=== 끝 ===

JSON 형식:
{
  "morpheme": {
    "summary": "글 성격 한 줄 요약",
    "sentiment": {"positive":숫자,"neutral":숫자,"negative":숫자},
    "seoScore": 0~100,
    "seoFeedback": "검색엔진 관점 핵심 피드백 2~3문장",
    "mainKeywords": ["핵심키워드1","핵심키워드2","핵심키워드3"],
    "words": [{"word":"단어","count":횟수,"type":"명사|동사|형용사","seo":"high|mid|low"}]
  },
  "lowQuality": {
    "score": 0~100,
    "verdict": "양호|주의|경고|위험",
    "items": [
      {"category":"비속어|광고성문구|키워드도배|저품질패턴|어뷰징의심","text":"발견된 단어/문구","count":횟수,"severity":"low|mid|high","suggestion":"개선 방법"}
    ],
    "tips": ["개선 팁1","개선 팁2","개선 팁3"]
  }
}

분석 기준:
- morpheme.words: 명사/동사/형용사 어근만, 조사·어미 제거, 2글자 이상, 빈도순 상위 20개
- morpheme.seo: high=SEO 핵심어(메인키워드급), mid=관련어, low=일반어
- lowQuality.items 감지 대상:
  * 19금/성인: 성적 표현, 성행위 묘사, 음란성 단어·구문 → category="19금·성인" severity="high"
  * 도박/불법: 토토·카지노·마약·해킹 관련 → category="도박·불법" severity="high"
  * 광고/협찬: 협찬·체험단·대가성 표현 → category="광고·협찬" severity="mid"
  * 키워드 도배: 동일 단어 15회 이상 반복 → category="키워드도배" severity="mid"
  * 스팸 패턴: 과도한 상업성·어뷰징 표현 → category="스팸·어뷰징" severity="low"
- lowQuality.score: 낮을수록 저품질 위험 적음 (0=완전 안전, 100=매우 위험)
- 19금 단어나 성인 구문이 하나라도 있으면 score 80 이상, verdict="위험"`;

    try{
      const raw=await callClaude([{role:"user",content:prompt}],
        "You are a Korean blog SEO and quality analysis expert. Output ONLY valid JSON.", 2500);
      const parsed=safeParseJson(raw);

      // AI 추출 단어 목록으로 실제 텍스트에서 직접 카운트 (AI 추정값 사용 안 함)
      if(parsed.morpheme?.words){
        parsed.morpheme.words = parsed.morpheme.words.map(item => {
          const word = item.word;
          if(!word) return item;
          let count = 0;
          let idx = 0;
          while((idx = text.indexOf(word, idx)) !== -1){ count++; idx += word.length; }
          return { ...item, count };
        })
        .filter(item => item.count > 0)
        .sort((a,b) => b.count - a.count);
      }

      setAiResult(parsed);
      setLastText(text);
      setActiveSection("quality");
    }catch(err){
      setAiResult({error:true, message:err.message||"AI 분석 중 오류가 발생했습니다."});
    }
    setAnalyzing(false);
  };

  // autoRun: postMeta + text가 함께 세팅되면 자동 분석 실행
  useEffect(()=>{
    if(!postMeta) return;
    if(!text.trim()) return;
    runAnalysis();
  },[postMeta]);

  // 금칙어
  const forbidden=workingText?detectForbidden(workingText):[];
  const hp=workingText?highlightText(workingText,forbidden,replacements):null;
  const doReplace=(word)=>{const r=replacements[word];if(!r?.trim())return;setWorkingText(p=>p.split(word).join(r.trim()));setReplacements(p=>{const n={...p};delete n[word];return n;});};
  const doReplaceAll=()=>{let t=workingText;Object.entries(replacements).forEach(([w,r])=>{if(r?.trim())t=t.split(w).join(r.trim());});setWorkingText(t);setReplacements({});};

  // 저품질 AI 대체어 추천 (개별)
  const aiQualRecommend=async(item)=>{
    const key=item.text;
    setQualLoading(p=>({...p,[key]:true}));
    try{
      const prompt=`블로그 글에서 저품질/스팸으로 감지된 표현이 있습니다.
감지된 표현: "${item.text}" (카테고리: ${item.category})
맥락: ${item.suggestion}

이 표현을 대체할 수 있는 자연스러운 한국어 표현 3개를 추천해주세요.
반드시 순수 JSON만 출력. 마크다운 없이.
{"suggestions":["대체표현1","대체표현2","대체표현3"]}`;
      const raw=await callClaude([{role:"user",content:prompt}],null,500);
      const parsed=safeParseJson(raw);
      const suggs=(parsed.suggestions||[]).join(",");
      const firstSugg=(parsed.suggestions||[])[0]||"";
      setQualLoading(p=>({...p,[key]:false,[key+"__sugg"]:suggs}));
      // 첫 번째 추천어를 자동으로 입력창에 채워주기
      if(firstSugg) setQualReplacements(p=>({...p,[key]:firstSugg}));
    }catch(e){
      setQualLoading(p=>({...p,[key]:false}));
    }
  };

  // 저품질 단어 본문에서 직접 교체
  const doQualReplace=(word)=>{
    const r=qualReplacements[word];
    if(!r?.trim()) return;
    setWorkingText(prev=>{
      // 정확히 일치하는 경우
      if(prev.includes(word)) return prev.split(word).join(r.trim());
      // 대소문자 무시 검색
      const lower=prev.toLowerCase();
      const wLower=word.toLowerCase();
      if(lower.includes(wLower)){
        const idx=lower.indexOf(wLower);
        return prev.slice(0,idx)+r.trim()+prev.slice(idx+word.length);
      }
      // 못 찾으면 원문 그대로 (텍스트 영역에서 직접 수정 필요)
      return prev;
    });
    // 교체된 항목은 aiResult items에서 제거
    setAnalyzeAiResult(prev=>{
      if(!prev?.lowQuality?.items) return prev;
      return {...prev,lowQuality:{...prev.lowQuality,
        items:prev.lowQuality.items.filter(it=>it.text!==word)}};
    });
    setQualReplacements(p=>{const n={...p};delete n[word];return n;});
    setQualLoading(p=>{const n={...p};delete n[word];delete n[word+"__sugg"];return n;});
  };

  // 복사/다운로드 (제목+본문+해시태그)
  // 본문 끝에 이미 해시태그가 붙어 있으면 또 붙이지 않는다 (중복 방지)
  const buildFullText=()=>{
    const title=postMeta?.title||"";
    const kw=postMeta?.main_keyword||"";
    const body=workingText||text;
    const bodyHasTags=/(?:^|\n)\s*#[^\n]+\s*$/.test(String(body||"").trimEnd());
    const tags=bodyHasTags?"":(postMeta?.tags||[]).map(t=>"#"+t).join(" ");
    return [kw?"[메인키워드] "+kw:"",title?"[제목] "+title:"",body,tags].filter(Boolean).join("\n\n");
  };
  const doCopyAll=()=>{
    navigator.clipboard.writeText(buildFullText());
    setCopiedAll(true); setTimeout(()=>setCopiedAll(false),2000);
  };
  const doDownload=()=>{
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([buildFullText()],{type:"text/plain"}));
    a.download="블로그글_분석완료.txt"; a.click();
  };

  const SECTIONS=[
    {id:"morpheme",icon:"🔤", label:"형태소·SEO"},
    {id:"quality", icon:"🛡️", label:"저품질·금칙어"},
  ];
  const typeColor={"명사":"#58a6ff","동사":"#3fb950","형용사":"#ffa657"};
  const seoColor={"high":"#3fb950","mid":"#58a6ff","low":"#484f58"};
  const seoLabel={"high":"핵심","mid":"관련","low":"일반"};
  const verdictStyle={
    "양호":["#3fb950","#0d2019","✅"],
    "주의":["#ffa657","#2d1e0a","⚠️"],
    "경고":["#ff7b72","#2d1117","🔶"],
    "위험":["#f85149","#2d0b0b","🚨"],
  };
  const filtered=(aiResult?.morpheme?.words||[]).filter(w=>w.count>=threshold);
  const maxCount=filtered[0]?.count||1;

  // 합산 이슈 수 (저품질 + 금칙어)
  const totalIssues=(aiResult?.lowQuality?.items?.length||0)+(forbidden?.length||0);

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>

    {/* ── 카테고리글쓰기에서 넘어온 경우: 메타 정보 표시 ── */}
    {postMeta&&<div style={{background:"#0d1117",border:"1px solid #30363d",borderRadius:"10px",padding:"10px 14px",fontSize:"12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"6px",color:"#3fb950",fontWeight:700,marginBottom:"8px"}}>
        <span>{postMeta._source==="keyword"?"🔍 키워드 글쓰기 결과":"📋 카테고리 글쓰기 결과"}</span>
        <span style={{color:"#484f58",fontWeight:400,fontSize:"11px",marginLeft:"auto"}}>분석 후 아래에서 복사·다운로드 가능</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"56px 1fr",rowGap:"5px",alignItems:"baseline"}}>
        <span style={{color:"#484f58"}}>메인키워드</span>
        <span style={{color:"#58a6ff",fontWeight:700}}>{postMeta.main_keyword||"-"}</span>
        <span style={{color:"#484f58"}}>제목</span>
        <span style={{color:"#e6edf3",fontWeight:600,lineHeight:"1.5"}}>
          {postMeta.title||"(없음)"}
          {postMeta.title&&<span style={{color:"#484f58",fontWeight:400,marginLeft:"6px",fontSize:"11px"}}>
            {postMeta.title.length}자{postMeta.titlePattern?` · ${postMeta.titlePattern}`:""}
          </span>}
          {postMeta.titleNotice&&<span style={{display:"block",color:"#d29922",fontWeight:400,fontSize:"11px",marginTop:"3px"}}>
            ⚠️ {postMeta.titleNotice} — 직접 다듬는 걸 권합니다
          </span>}
        </span>
        <span style={{color:"#484f58"}}>본문내용</span>
        <span style={{color:"#8b949e"}}>{(workingText||text).length.toLocaleString()}자</span>
        {postMeta.tags?.length>0&&<><span style={{color:"#484f58"}}>해시태그</span>
        <span style={{color:"#58a6ff",lineHeight:"1.8"}}>{postMeta.tags.map(t=>"#"+t).join(" ")}</span></>}
        {postMeta.factSummary&&<><span style={{color:"#484f58"}}>수치조사</span>
        <span style={{color:"#8b949e",lineHeight:"1.6"}}>
          검색으로 확인 <b style={{color:"#3fb950"}}>{postMeta.factSummary.resolved}</b>
          {postMeta.factSummary.approx>0&&<> · 대략치 <b style={{color:"#d29922"}}>{postMeta.factSummary.approx}</b></>}
          {postMeta.factSummary.unresolved?.length>0&&<> · 미해결 <b style={{color:"#f85149"}}>{postMeta.factSummary.unresolved.length}</b></>}
          {postMeta.factSummary.sources?.length>0&&<span style={{display:"block",marginTop:"3px"}}>
            {postMeta.factSummary.sources.slice(0,3).map((src,i)=>(
              <a key={i} href={src.url} target="_blank" rel="noreferrer"
                style={{color:"#58a6ff",textDecoration:"none",marginRight:"8px",fontSize:"11px"}}>🔗 {src.name}</a>
            ))}
          </span>}
        </span></>}
      </div>
    </div>}

    {/* ── [확인필요:] 항목 웹 조사 ── */}
    {placeholders.length>0&&<div style={{background:"#161b22",border:"1px solid #d2992244",borderRadius:"10px",overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid #21262d",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
        <span style={{color:"#d29922",fontWeight:700,fontSize:"13px"}}>🔎 확인이 필요한 항목 {placeholders.length}개</span>
        <span style={{color:"#484f58",fontSize:"11px"}}>웹에서 실제 값을 찾아 채웁니다 · 확인 안 되는 항목은 그대로 둡니다</span>
        <button onClick={runFactCheck} disabled={factLoading}
          style={{marginLeft:"auto",padding:"6px 14px",borderRadius:"6px",border:"none",
            background:factLoading?"#21262d":"#d29922",color:factLoading?"#484f58":"#0d1117",
            fontSize:"12px",fontWeight:700,cursor:factLoading?"wait":"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>
          {factLoading?"⏳ 검색 중...":factResults?"🔄 다시 조사":"🔎 웹에서 찾기"}
        </button>
      </div>

      {!factResults&&!factLoading&&<div style={{padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:"6px"}}>
        {placeholders.map((x,i)=>(
          <span key={i} style={{background:"#0d1117",border:"1px solid #30363d",borderRadius:"6px",padding:"3px 9px",color:"#8b949e",fontSize:"11px"}}>{x}</span>
        ))}
      </div>}

      {factError&&<div style={{margin:"10px 16px",background:"#2d1117",border:"1px solid #da363344",borderRadius:"8px",padding:"10px 12px",color:"#ff7b72",fontSize:"12px"}}>⚠️ {factError}</div>}

      {factResults&&<div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:"8px"}}>
        {factResults.map((it,i)=>{
          const done=factApplied[it.label];
          return <div key={i} style={{background:"#0d1117",border:`1px solid ${it.found?"#3fb95033":"#30363d"}`,borderRadius:"8px",padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
              <span style={{color:"#8b949e",fontSize:"11px"}}>{it.label}</span>
              {it.found
                ? <span style={{color:"#3fb950",fontWeight:700,fontSize:"13px"}}>{it.value}</span>
                : <span style={{color:"#f85149",fontSize:"12px"}}>확인 실패 — 직접 채워주세요</span>}
              {it.found&&<button onClick={()=>applyFactValue(it.label,it.value)} disabled={done}
                style={{marginLeft:"auto",padding:"4px 12px",borderRadius:"6px",
                  border:`1px solid ${done?"#2ea043":"#30363d"}`,
                  background:done?"#2ea043":"#21262d",color:done?"#fff":"#c9d1d9",
                  fontSize:"11px",fontWeight:700,cursor:done?"default":"pointer",
                  fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>
                {done?"✅ 적용됨":"본문에 넣기"}
              </button>}
            </div>
            {(it.note||it.reason)&&<div style={{color:"#484f58",fontSize:"11px",marginTop:"4px"}}>{it.note||it.reason}</div>}
            {it.source&&<a href={it.source} target="_blank" rel="noreferrer"
              style={{color:"#58a6ff",fontSize:"11px",marginTop:"3px",display:"inline-block",textDecoration:"none",wordBreak:"break-all"}}>
              🔗 {it.sourceName||it.source}
            </a>}
          </div>;
        })}
        <div style={{color:"#484f58",fontSize:"11px",marginTop:"2px"}}>
          출처 링크를 눌러 원문을 직접 확인한 뒤 넣으시는 걸 권합니다
        </div>
      </div>}
    </div>}

    {/* ── 단락별 이미지 프롬프트 생성 (GPT용) ── */}
    {postMeta&&<ImageGenSection
      postMeta={postMeta}
      postContent={workingText||text}
      genImages={genImages} setGenImages={setGenImages}
      imgLoading={imgLoading} setImgLoading={setImgLoading}
      imgError={imgError} setImgError={setImgError}
      imgSections={imgSections} setImgSections={setImgSections}
    />}

    {/* ── 텍스트 입력 영역 ── */}
    <div style={{position:"relative"}}>
      {autoLoading&&<div style={{background:"#0d2019",border:"1px solid #2ea04333",borderRadius:"10px",padding:"20px",textAlign:"center",marginBottom:"10px"}}>
        <div style={{color:"#3fb950",fontSize:"14px",fontWeight:700,marginBottom:"8px"}}>✍️ 키워드 기반 글 자동 생성 중...</div>
        <div style={{color:"#484f58",fontSize:"12px"}}>Sonnet으로 SEO 최적화 글 작성중. 잠시만 기다려주세요.</div>
        <div style={{marginTop:"12px",height:"4px",background:"#21262d",borderRadius:"2px",overflow:"hidden"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#2ea043,#3fb950)",animation:"slideBar 1.5s ease infinite",borderRadius:"2px"}}/>
        </div>
        <style>{"@keyframes slideBar{0%{width:0%;marginLeft:0}50%{width:70%}100%{width:0%;marginLeft:100%}}"}</style>
      </div>}
      {!autoLoading&&<Textarea value={text} onChange={t=>{setText(t);}} placeholder="분석할 블로그 글을 입력하세요..." rows={9}/>}
      <div style={{position:"absolute",bottom:"10px",right:"14px",color:text.length>9000?"#ff7b72":"#484f58",fontSize:"12px"}}>{text.length.toLocaleString()} / 10,000자</div>
    </div>


    {/* ── 버튼 행 ── */}
    <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
      {/* 글분석하기 — 텍스트 있을 때 항상 표시 */}
      {text&&<Btn onClick={runAnalysis} loading={analyzing}>
        {aiResult&&!aiResult.error ? "🔄 다시 분석하기" : "🔍 글분석하기"}
      </Btn>}
      {/* 초기화 */}
      {(text||aiResult)&&<Btn onClick={resetAll} variant="secondary">🗑️ 초기화</Btn>}
      {/* 상태 메시지 */}
      {analyzing&&<span style={{color:"#58a6ff",fontSize:"12px"}}>⏳ 분석 중...</span>}
      {isDirty&&!analyzing&&<span style={{color:"#ffa657",fontSize:"12px"}}>⚠️ 텍스트가 변경됐습니다. 다시 분석해보세요.</span>}
      {aiResult&&!aiResult.error&&!isDirty&&!analyzing&&<span style={{color:"#3fb950",fontSize:"12px"}}>✅ 분석 완료</span>}
      {/* 제목+본문+해시태그 복사/다운로드 — 분석 완료 후 표시 */}
      {aiResult&&!aiResult.error&&(
        <>
          <button onClick={doCopyAll} style={{
            marginLeft:"auto",padding:"8px 16px",
            background:copiedAll?"#2ea043":"#1f6feb",
            color:"#fff",border:"none",borderRadius:"8px",cursor:"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:700,
            display:"flex",alignItems:"center",gap:"6px",transition:"background .2s",whiteSpace:"nowrap",
          }}>
            {copiedAll?"✅ 복사됨!":"📋 제목+본문+해시태그 복사"}
          </button>
          <button onClick={doDownload} style={{
            padding:"8px 14px",background:"#21262d",color:"#8b949e",
            border:"1px solid #30363d",borderRadius:"8px",cursor:"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,whiteSpace:"nowrap",
          }}>⬇️ TXT 다운로드</button>
        </>
      )}
    </div>

    {/* 로딩 */}
    {analyzing&&<div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      {["텍스트 파싱 중...","형태소·SEO 분석 중...","저품질·비속어 감지 중...","금칙어 목록 대조 중..."].map((m,i)=>(
        <div key={i} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"8px",padding:"10px 14px",color:"#8b949e",fontSize:"13px",animation:`pulse 1.6s ease ${i*0.3}s infinite`}}>⏳ {m}</div>
      ))}
    </div>}

    {aiResult?.error&&<div style={{background:"#2d1117",border:"1px solid #da3633",borderRadius:"10px",padding:"16px",display:"flex",flexDirection:"column",gap:"6px"}}>
      <div style={{color:"#ff7b72",fontWeight:700,fontSize:"14px"}}>⚠️ 오류가 발생했습니다</div>
      <div style={{color:"#c9d1d9",fontSize:"13px"}}>{aiResult.message||"AI 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}</div>
      <div style={{fontSize:"11px",color:"#484f58",marginTop:"4px"}}>문제가 지속되면 API 키 또는 네트워크 상태를 확인해주세요.</div>
    </div>}

    {/* ── 섹션 탭 ── */}
    {(text||aiResult)&&<div style={{display:"flex",gap:"4px",background:"#0d1117",borderRadius:"10px",padding:"4px",border:"1px solid #21262d"}}>
      {SECTIONS.map(sec=>{
        const badge=sec.id==="quality"&&(aiResult||workingText)?totalIssues:0;
        return <button key={sec.id} onClick={()=>setActiveSection(sec.id)} style={{
          flex:1,padding:"9px 6px",borderRadius:"7px",border:"none",
          background:activeSection===sec.id?"#161b22":"none",
          color:activeSection===sec.id?"#e6edf3":"#8b949e",
          cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,
          boxShadow:activeSection===sec.id?"0 1px 4px #00000066":"none",transition:"all .15s",
          position:"relative",
        }}>
          {sec.icon} {sec.label}
          {badge>0&&<span style={{marginLeft:"5px",background:"#f85149",color:"#fff",borderRadius:"10px",padding:"0 6px",fontSize:"10px",fontWeight:700}}>{badge}</span>}
        </button>;
      })}
    </div>}

    {/* ── 섹션 1: 형태소·SEO ── */}
    {activeSection==="morpheme"&&<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {!aiResult&&<div style={{background:"#161b22",borderRadius:"10px",padding:"24px",border:"1px solid #30363d",color:"#484f58",fontSize:"14px",textAlign:"center"}}>글 입력 후 잠시 기다리면 자동으로 분석됩니다</div>}
      {aiResult&&!aiResult.error&&<>
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"12px"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"32px",fontWeight:700,color:aiResult.morpheme.seoScore>=70?"#3fb950":aiResult.morpheme.seoScore>=40?"#ffa657":"#ff7b72"}}>{aiResult.morpheme.seoScore}</div>
              <div style={{color:"#8b949e",fontSize:"11px"}}>SEO 점수</div>
            </div>
            <div style={{flex:1}}>
              <div style={{height:"8px",background:"#21262d",borderRadius:"4px",overflow:"hidden",marginBottom:"8px"}}>
                <div style={{width:`${aiResult.morpheme.seoScore}%`,height:"100%",background:aiResult.morpheme.seoScore>=70?"#3fb950":aiResult.morpheme.seoScore>=40?"#ffa657":"#ff7b72",borderRadius:"4px",transition:"width .5s"}}/>
              </div>
              <div style={{color:"#c9d1d9",fontSize:"13px",lineHeight:"1.7"}}>{aiResult.morpheme.seoFeedback}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {aiResult.morpheme.mainKeywords?.map(kw=>(
              <span key={kw} style={{background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",borderRadius:"20px",padding:"3px 12px",fontSize:"12px",fontWeight:600}}>{kw}</span>
            ))}
          </div>
        </div>
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"14px 16px"}}>
          <div style={{fontSize:"12px",color:"#8b949e",marginBottom:"8px",fontWeight:600}}>😊 감정 분석 · {aiResult.morpheme.summary}</div>
          <div style={{display:"flex",height:"10px",borderRadius:"5px",overflow:"hidden",gap:"2px"}}>
            <div style={{width:`${aiResult.morpheme.sentiment?.positive||33}%`,background:"#3fb950",borderRadius:"3px 0 0 3px"}}/>
            <div style={{width:`${aiResult.morpheme.sentiment?.neutral||33}%`,background:"#8b949e"}}/>
            <div style={{width:`${aiResult.morpheme.sentiment?.negative||34}%`,background:"#ff7b72",borderRadius:"0 3px 3px 0"}}/>
          </div>
          <div style={{display:"flex",gap:"16px",marginTop:"6px",fontSize:"11px"}}>
            <span style={{color:"#3fb950"}}>😊 긍정 {aiResult.morpheme.sentiment?.positive}%</span>
            <span style={{color:"#8b949e"}}>😐 중립 {aiResult.morpheme.sentiment?.neutral}%</span>
            <span style={{color:"#ff7b72"}}>😟 부정 {aiResult.morpheme.sentiment?.negative}%</span>
          </div>
        </div>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
            <SectionTitle>🔤 형태소 단어 빈도</SectionTitle>
            <div style={{display:"flex",alignItems:"center",gap:"5px",marginLeft:"auto"}}>
              <span style={{color:"#8b949e",fontSize:"12px"}}>기준</span>
              <input type="number" value={threshold} min={1} max={20} onChange={e=>setThreshold(Number(e.target.value))}
                style={{width:"46px",padding:"4px 6px",background:"#0d1117",border:"1px solid #30363d",borderRadius:"6px",color:"#e6edf3",fontSize:"13px",outline:"none",textAlign:"center"}}/>
              <span style={{color:"#8b949e",fontSize:"12px"}}>회↑</span>
            </div>
          </div>
          <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"8px"}}>
            {Object.entries(typeColor).map(([t,c])=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:"4px"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"2px",background:c}}/>
                <span style={{color:"#8b949e",fontSize:"11px"}}>{t}</span>
              </div>
            ))}
            <span style={{color:"#484f58",fontSize:"11px",marginLeft:"auto"}}>총 {aiResult.morpheme.words?.length}개 추출</span>
          </div>
          {filtered.length>0
            ?<div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {filtered.map(({word,count,type,seo})=>{
                const isHigh=seo==="high";
                const tc=typeColor[type]||"#8b949e";
                return <div key={word} style={{display:"flex",alignItems:"center",gap:"8px",background:"#161b22",borderRadius:"8px",padding:"7px 12px",border:`1px solid ${isHigh?"#2ea04355":"#21262d"}`}}>
                  <span style={{background:tc+"22",color:tc,border:`1px solid ${tc}33`,borderRadius:"3px",padding:"1px 5px",fontSize:"10px",fontWeight:700,minWidth:"28px",textAlign:"center"}}>{type||"기타"}</span>
                  <span style={{background:seoColor[seo||"low"]+"22",color:seoColor[seo||"low"],border:`1px solid ${seoColor[seo||"low"]}33`,borderRadius:"3px",padding:"1px 5px",fontSize:"10px",fontWeight:700,minWidth:"24px",textAlign:"center"}}>{seoLabel[seo||"low"]}</span>
                  <span style={{flex:1,color:isHigh?"#3fb950":"#c9d1d9",fontSize:"13px",fontWeight:isHigh?700:400}}>{word}</span>
                  <span style={{color:"#8b949e",fontSize:"12px",minWidth:"30px",textAlign:"right"}}>{count}회</span>
                  <div style={{width:"80px",height:"6px",background:"#21262d",borderRadius:"3px",overflow:"hidden"}}>
                    <div style={{height:"100%",background:tc,width:`${Math.round((count/maxCount)*100)}%`,borderRadius:"3px"}}/>
                  </div>
                </div>;
              })}
            </div>
            :<div style={{background:"#0d2019",border:"1px solid #2ea043",borderRadius:"10px",padding:"12px",color:"#3fb950",fontSize:"14px"}}>✅ {threshold}회 이상 반복 단어 없음</div>
          }
        </div>
      </>}
    </div>}

    {/* ── 섹션 3: 저품질·금칙어 통합 ── */}
    {activeSection==="quality"&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

      {/* 저품질 감지 결과 */}
      {!aiResult&&!workingText&&<div style={{background:"#161b22",borderRadius:"10px",padding:"24px",border:"1px solid #30363d",color:"#484f58",fontSize:"14px",textAlign:"center"}}>글 입력 후 잠시 기다리면 자동으로 분석됩니다</div>}

      {aiResult&&!aiResult.error&&(()=>{
        const v=aiResult.lowQuality.verdict||"양호";
        const [vc,vbg,vi]=verdictStyle[v]||verdictStyle["양호"];
        const sc=aiResult.lowQuality.score||0;
        return <div style={{background:vbg,border:`1px solid ${vc}44`,borderRadius:"12px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"14px"}}>
          <div style={{textAlign:"center",minWidth:"52px"}}>
            <div style={{fontSize:"24px"}}>{vi}</div>
            <div style={{color:vc,fontWeight:700,fontSize:"13px"}}>{v}</div>
          </div>
          <div style={{flex:1}}>
            <div style={{color:"#c9d1d9",fontSize:"12px",marginBottom:"6px"}}>저품질 위험도: <strong style={{color:vc}}>{sc}점</strong> <span style={{color:"#484f58",fontSize:"11px"}}>(낮을수록 안전)</span></div>
            <div style={{height:"7px",background:"#21262d",borderRadius:"4px",overflow:"hidden"}}>
              <div style={{width:`${sc}%`,height:"100%",background:sc<30?"#3fb950":sc<60?"#ffa657":"#f85149",borderRadius:"4px",transition:"width .5s"}}/>
            </div>
          </div>
        </div>;
      })()}

      {/* ── 저품질 항목 (AI 대체어 추천 + 바로 수정) ── */}
      {aiResult&&!aiResult.error&&aiResult.lowQuality.items?.length>0&&(
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:"1px solid #30363d",background:"#0d1117",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{color:"#ffa657",fontWeight:700,fontSize:"13px"}}>⚠️ 저품질 요소 {aiResult.lowQuality.items.length}개</span>
            <span style={{color:"#484f58",fontSize:"11px"}}>· AI 추천 후 바로 수정 가능</span>
          </div>
          <div style={{display:"flex",flexDirection:"column"}}>
            {aiResult.lowQuality.items.map((item,i)=>{
              const sev=item.severity;
              const sc2=sev==="high"?"#f85149":sev==="mid"?"#ffa657":"#8b949e";
              const sevLabel=sev==="high"?"심각":sev==="mid"?"주의":"낮음";
              const isLoading=qualLoading[item.text]===true;
              const suggRaw=qualLoading[item.text+"__sugg"];
              const suggList=suggRaw?suggRaw.split(",").map(s=>s.trim()).filter(Boolean):[];
              return <div key={i} style={{padding:"12px 14px",borderBottom:i<aiResult.lowQuality.items.length-1?"1px solid #21262d":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px",flexWrap:"wrap"}}>
                  <span style={{background:sc2+"22",color:sc2,border:`1px solid ${sc2}44`,borderRadius:"4px",padding:"1px 8px",fontSize:"11px",fontWeight:700}}>{item.category}</span>
                  <span style={{background:"#21262d",color:sc2,borderRadius:"4px",padding:"1px 7px",fontSize:"10px"}}>{sevLabel}</span>
                  <span style={{color:"#ff7b72",fontWeight:700,fontSize:"13px"}}>"{item.text}"</span>
                  {item.count>1&&<span style={{color:"#484f58",fontSize:"11px"}}>({item.count}회)</span>}
                </div>
                <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"8px",lineHeight:"1.5"}}>💡 {item.suggestion}</div>
                <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
                  <input
                    value={qualReplacements[item.text]||""}
                    onChange={e=>setQualReplacements(p=>({...p,[item.text]:e.target.value}))}
                    placeholder={isLoading?"AI 추천 중...":"대체 표현 입력 또는 AI 추천 →"}
                    onKeyDown={e=>e.key==="Enter"&&doQualReplace(item.text)}
                    style={{flex:1,minWidth:"120px",padding:"6px 8px",background:"#0d1117",
                      border:`1px solid ${qualReplacements[item.text]?.trim()?"#1f6feb66":"#30363d"}`,
                      borderRadius:"6px",color:"#e6edf3",fontSize:"12px",outline:"none",
                      fontFamily:"'Noto Sans KR',sans-serif",boxSizing:"border-box"}}
                    onFocus={e=>e.target.style.borderColor="#58a6ff"}
                    onBlur={e=>e.target.style.borderColor=qualReplacements[item.text]?.trim()?"#1f6feb66":"#30363d"}/>
                  <button onClick={()=>aiQualRecommend(item)} disabled={isLoading} title="AI 대체어 추천"
                    style={{padding:"6px 9px",background:isLoading?"#21262d":"#8957e522",
                      color:isLoading?"#484f58":"#d2a8ff",border:`1px solid ${isLoading?"#30363d":"#8957e544"}`,
                      borderRadius:"6px",cursor:isLoading?"not-allowed":"pointer",fontSize:"13px",flexShrink:0}}>
                    {isLoading?"⏳":"✨"}
                  </button>
                  <button onClick={()=>doQualReplace(item.text)} disabled={!qualReplacements[item.text]?.trim()}
                    style={{padding:"6px 12px",
                      background:qualReplacements[item.text]?.trim()?"#1f6feb":"#21262d",
                      color:qualReplacements[item.text]?.trim()?"#fff":"#484f58",
                      border:"none",borderRadius:"6px",cursor:qualReplacements[item.text]?.trim()?"pointer":"not-allowed",
                      fontFamily:"'Noto Sans KR',sans-serif",fontSize:"11px",fontWeight:600,flexShrink:0}}>
                    바꾸기
                  </button>
                </div>
                {suggList.length>0&&<div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginTop:"6px"}}>
                  <span style={{color:"#484f58",fontSize:"10px",alignSelf:"center"}}>추천:</span>
                  {suggList.map((sg,si)=>(
                    <button key={si} onClick={()=>setQualReplacements(p=>({...p,[item.text]:sg}))}
                      style={{padding:"2px 10px",background:qualReplacements[item.text]===sg?"#1f6feb22":"#21262d",
                        color:qualReplacements[item.text]===sg?"#58a6ff":"#8b949e",
                        border:`1px solid ${qualReplacements[item.text]===sg?"#1f6feb55":"#30363d"}`,
                        borderRadius:"20px",cursor:"pointer",fontSize:"11px",fontFamily:"'Noto Sans KR',sans-serif"}}>
                      {sg}
                    </button>
                  ))}
                </div>}
              </div>;
            })}
          </div>
        </div>
      )}
      {aiResult&&!aiResult.error&&!aiResult.lowQuality.items?.length&&(
        <div style={{background:"#0d2019",border:"1px solid #2ea043",borderRadius:"10px",padding:"14px",color:"#3fb950",fontSize:"14px",textAlign:"center"}}>✅ 저품질 요소가 감지되지 않았습니다!</div>
      )}



      {/* ── 금칙어 (통합) ── */}
      {workingText&&<ForbiddenSection
        workingText={workingText} forbidden={forbidden} hp={hp}
        replacements={replacements} setReplacements={setReplacements}
        doReplace={doReplace} doReplaceAll={doReplaceAll}
      />}
      {!workingText&&text&&aiResult&&!aiResult.error&&(
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"12px 14px",color:"#8b949e",fontSize:"12px",textAlign:"center"}}>
          ⚠️ 금칙어 검사는 통합 분석 실행 후 나타납니다.
        </div>
      )}
    </div>}
  </div>;
}

// ─── TAB 3: 이미지→텍스트 OCR ────────────────────────────────────────────
function OcrTab(){
  const [images,setImages]=useState([]);
  const [dragOver,setDragOver]=useState(false);
  const [tesseractReady,setTesseractReady]=useState(false);
  const [tesseractLoading,setTesseractLoading]=useState(false);
  const fileInputRef=useRef(null);
  const workerRef=useRef(null);

  // Tesseract.js 로드 (CDN)
  const loadTesseract=async()=>{
    if(workerRef.current) return workerRef.current;
    setTesseractLoading(true);
    return new Promise((resolve,reject)=>{
      if(window.Tesseract){
        initWorker(resolve,reject);
        return;
      }
      const script=document.createElement("script");
      script.src="https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.5/tesseract.min.js";
      script.onload=()=>initWorker(resolve,reject);
      script.onerror=()=>reject(new Error("Tesseract 로드 실패"));
      document.head.appendChild(script);
    });
  };
  const initWorker=async(resolve,reject)=>{
    try{
      const worker=await window.Tesseract.createWorker(["kor","eng"],1,{
        logger: m=>{
          if(m.status==="recognizing text"){
            const pct=Math.round((m.progress||0)*100);
            setImages(prev=>prev.map(i=>i.processing?{...i,progress:pct}:i));
          }
        }
      });
      workerRef.current=worker;
      setTesseractReady(true);
      setTesseractLoading(false);
      resolve(worker);
    }catch(e){ setTesseractLoading(false); reject(e); }
  };

  const addFiles=useCallback((files)=>{
    const valid=[...files].filter(f=>f.type.startsWith("image/"));
    if(!valid.length) return;
    setImages(prev=>[...prev,...valid.map(f=>({file:f,preview:URL.createObjectURL(f),result:"",loading:false,processing:false,progress:0,id:Date.now()+Math.random()}))]);
  },[]);

  useEffect(()=>{
    const onPaste=e=>{
      const files=[...e.clipboardData.items].filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);
      if(files.length) addFiles(files);
    };
    window.addEventListener("paste",onPaste);
    return()=>window.removeEventListener("paste",onPaste);
  },[addFiles]);

  // 컴포넌트 언마운트 시 워커 종료
  useEffect(()=>()=>{ workerRef.current?.terminate(); },[]);

  const extractText=async(img)=>{
    setImages(prev=>prev.map(i=>i.id===img.id?{...i,loading:true,processing:true,result:"",progress:0}:i));
    try{
      const worker=await loadTesseract();
      const {data:{text}}=await worker.recognize(img.file);
      setImages(prev=>prev.map(i=>i.id===img.id?{...i,loading:false,processing:false,result:text.trim(),progress:100}:i));
    }catch(e){
      setImages(prev=>prev.map(i=>i.id===img.id?{...i,loading:false,processing:false,result:"⚠️ 오류: "+e.message}:i));
    }
  };

  const extractAll=()=>images.filter(i=>!i.result&&!i.loading).forEach(i=>extractText(i));
  const totalChars=images.reduce((s,i)=>s+(i.result?.length||0),0);
  const fmtSize=n=>n>1024*1024?(n/1024/1024).toFixed(1)+"MB":(n/1024).toFixed(0)+"KB";

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    {tesseractLoading&&<div style={{color:"#ffa657",fontSize:"12px"}}>⏳ OCR 엔진 로딩중...</div>}
    {tesseractReady&&<div style={{color:"#3fb950",fontSize:"12px"}}>✅ OCR 준비됨</div>}

    <div onClick={()=>fileInputRef.current?.click()} onTouchEnd={e=>{e.preventDefault();fileInputRef.current?.click();}}
      onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}
      onDragOver={e=>{e.preventDefault();setDragOver(true);}}
      onDragLeave={()=>setDragOver(false)}
      style={{border:`2px dashed ${dragOver?"#58a6ff":"#30363d"}`,borderRadius:"12px",padding:"36px 20px",
        textAlign:"center",cursor:"pointer",background:dragOver?"#1f6feb11":"#0d1117",transition:"all .2s"}}>
      <div style={{fontSize:"36px",marginBottom:"10px"}}>🖼️</div>
      <div style={{color:"#c9d1d9",fontSize:"15px",fontWeight:600,marginBottom:"6px"}}>이미지를 드래그하거나 클릭하여 업로드</div>
      <div style={{color:"#484f58",fontSize:"13px"}}>JPG, PNG, GIF, WEBP · 긴 스크린샷도 가능</div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
    </div>

    <div style={{background:"#161b22",borderRadius:"8px",padding:"10px 14px",border:"1px solid #30363d",color:"#8b949e",fontSize:"12px"}}>
      💡 <strong style={{color:"#c9d1d9"}}>Ctrl+V</strong> 로 클립보드 이미지(스크린샷)를 바로 붙여넣기 가능
    </div>

    {images.length>0&&<>
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
        <Btn onClick={extractAll} loading={images.some(i=>i.loading)}>🔍 전체 텍스트 추출</Btn>
        {images.filter(i=>i.result).length>0&&<>
          <Btn onClick={()=>navigator.clipboard.writeText(images.filter(i=>i.result).map((i,idx)=>`[이미지 ${idx+1}]\n${i.result}`).join("\n\n---\n\n"))} variant="secondary">📋 전체 복사</Btn>
          <Btn onClick={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([images.filter(i=>i.result).map((i,idx)=>`[이미지 ${idx+1}]\n${i.result}`).join("\n\n---\n\n")],{type:"text/plain"}));a.download="extracted_text.txt";a.click();}} variant="secondary">⬇️ 전체 다운로드</Btn>
          {totalChars>0&&<span style={{color:"#8b949e",fontSize:"13px",marginLeft:"auto"}}>총 {totalChars.toLocaleString()}자</span>}
        </>}
        <Btn onClick={()=>setImages([])} variant="secondary">🗑️ 전체 삭제</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {images.map((img,idx)=><div key={img.id} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 16px",borderBottom:"1px solid #21262d",background:"#0d1117"}}>
            <span style={{color:"#8b949e",fontSize:"13px",fontWeight:600}}>이미지 {idx+1}</span>
            <span style={{color:"#484f58",fontSize:"12px",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{img.file.name}</span>
            <span style={{color:"#484f58",fontSize:"11px"}}>{fmtSize(img.file.size)}</span>
            <div style={{display:"flex",gap:"6px"}}>
              {!img.result&&!img.loading&&<button onClick={()=>extractText(img)} style={{padding:"5px 12px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif"}}>추출</button>}
              <button onClick={()=>setImages(p=>p.filter(i=>i.id!==img.id))} style={{padding:"5px 10px",background:"none",color:"#8b949e",border:"1px solid #30363d",borderRadius:"6px",cursor:"pointer",fontSize:"12px"}}>✕</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"200px 1fr"}}>
            <div style={{padding:"12px",borderRight:"1px solid #21262d",display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
              <img src={img.preview} alt="" style={{maxWidth:"100%",maxHeight:"180px",objectFit:"contain",borderRadius:"6px"}}/>
            </div>
            <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:"8px"}}>
              {img.loading?<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:"#8b949e",fontSize:"13px"}}>⏳ 텍스트 인식중...</span>
                  <span style={{color:"#58a6ff",fontSize:"13px",fontWeight:700}}>{img.progress||0}%</span>
                </div>
                <div style={{background:"#21262d",borderRadius:"4px",height:"6px",overflow:"hidden"}}>
                  <div style={{background:"linear-gradient(90deg,#1f6feb,#58a6ff)",height:"100%",width:`${img.progress||0}%`,transition:"width .3s",borderRadius:"4px"}}/>
                </div>
              </div>:img.result?<>
                <div style={{display:"flex",justifyContent:"flex-end",gap:"6px"}}>
                  <span style={{color:"#484f58",fontSize:"11px",marginRight:"auto"}}>{img.result.length.toLocaleString()}자 추출됨</span>
                  <button onClick={()=>navigator.clipboard.writeText(img.result)} style={{padding:"4px 10px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"5px",cursor:"pointer",fontSize:"11px"}}>복사</button>
                  <button onClick={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([img.result],{type:"text/plain"}));a.download=`image_${idx+1}_text.txt`;a.click();}} style={{padding:"4px 10px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"5px",cursor:"pointer",fontSize:"11px"}}>다운로드</button>
                </div>
                <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:"8px",padding:"12px",color:"#e6edf3",fontSize:"13px",lineHeight:"1.8",whiteSpace:"pre-wrap",maxHeight:"200px",overflowY:"auto",wordBreak:"break-all"}}>{img.result}</div>
              </>:<div style={{color:"#484f58",fontSize:"13px",display:"flex",alignItems:"center",justifyContent:"center",height:"100%",minHeight:"80px"}}>위의 '추출' 버튼을 클릭하세요</div>}
            </div>
          </div>
        </div>)}
      </div>
    </>}
  </div>;
}

// ─── TAB 4: 이미지 변환기 (Canvas API) ───────────────────────────────────
function ConvertTab(){
  const [files,setFiles]=useState([]);
  const [outputFormat,setOutputFormat]=useState("jpeg");
  const [quality,setQuality]=useState(90);
  const [resize,setResize]=useState(false);
  const [maxWidth,setMaxWidth]=useState(1920);
  const [dragOver,setDragOver]=useState(false);
  const fileInputRef=useRef(null);

  const fmt=OUTPUT_FORMATS.find(f=>f.id===outputFormat);

  const addFiles=useCallback((newFiles)=>{
    const valid=[...newFiles].filter(f=>f.type.startsWith("image/"));
    if(!valid.length) return;
    setFiles(prev=>[...prev,...valid.map(f=>({
      file:f, preview:URL.createObjectURL(f), result:null,
      loading:false, error:"", id:Date.now()+Math.random(),
      origSize:f.size,
    }))]);
  },[]);

  const convertFile=useCallback(async(item)=>{
    setFiles(prev=>prev.map(f=>f.id===item.id?{...f,loading:true,result:null,error:""}:f));
    try{
      const blob=await new Promise((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>{
          let w=img.naturalWidth, h=img.naturalHeight;
          if(resize&&w>maxWidth){ h=Math.round(h*(maxWidth/w)); w=maxWidth; }
          const canvas=document.createElement("canvas");
          canvas.width=w; canvas.height=h;
          const ctx=canvas.getContext("2d");
          // fill white background for JPEG (transparent → white)
          if(outputFormat==="jpeg"){ ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,w,h); }
          ctx.drawImage(img,0,0,w,h);
          canvas.toBlob(b=>{ if(b) resolve(b); else reject(new Error("변환 실패")); }, fmt.mime, outputFormat!=="png"?quality/100:undefined);
        };
        img.onerror=()=>reject(new Error("이미지 로드 실패"));
        img.src=URL.createObjectURL(item.file);
      });
      const resultUrl=URL.createObjectURL(blob);
      setFiles(prev=>prev.map(f=>f.id===item.id?{...f,loading:false,result:{url:resultUrl,blob,size:blob.size}}:f));
    }catch(e){
      setFiles(prev=>prev.map(f=>f.id===item.id?{...f,loading:false,error:e.message}:f));
    }
  },[outputFormat,quality,resize,maxWidth,fmt]);

  const convertAll=()=>files.filter(f=>!f.loading).forEach(f=>convertFile(f));

  const downloadFile=(item)=>{
    const a=document.createElement("a");
    a.href=item.result.url;
    const base=item.file.name.replace(/\.[^.]+$/,"");
    a.download=`${base}.${fmt.ext}`;
    a.click();
  };

  const downloadAll=()=>files.filter(f=>f.result).forEach(f=>downloadFile(f));

  const INPUT_FORMATS = ["JPG","PNG","WEBP","GIF","BMP","AVIF","ICO","TIFF"];

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

    {/* 변환 설정 패널 */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
      <SectionTitle>⚙️ 변환 설정</SectionTitle>
      <div style={{display:"flex",gap:"20px",flexWrap:"wrap",alignItems:"flex-start"}}>

        {/* 출력 포맷 */}
        <div>
          <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"8px"}}>출력 형식</div>
          <div style={{display:"flex",gap:"6px"}}>
            {OUTPUT_FORMATS.map(f=>(
              <button key={f.id} onClick={()=>{setOutputFormat(f.id);setFiles(p=>p.map(i=>({...i,result:null,error:""})));}} style={{
                padding:"8px 18px",borderRadius:"8px",border:`1px solid ${outputFormat===f.id?"#58a6ff":"#30363d"}`,
                background:outputFormat===f.id?"#1f6feb":"#21262d",
                color:outputFormat===f.id?"#fff":"#8b949e",
                cursor:"pointer",fontWeight:700,fontSize:"14px",fontFamily:"'Noto Sans KR',sans-serif",
              }}>{f.label}</button>
            ))}
          </div>
          <div style={{marginTop:"6px",fontSize:"11px",color:"#484f58"}}>
            입력: {INPUT_FORMATS.join(", ")} → 출력: {fmt.label}
          </div>
        </div>

        {/* 품질 슬라이더 */}
        {fmt.hasQuality&&<div style={{flex:1,minWidth:"200px"}}>
          <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"8px"}}>
            품질 <span style={{color:"#58a6ff",fontWeight:700}}>{quality}%</span>
            <span style={{color:"#484f58",marginLeft:"8px"}}>{quality>=85?"높은 품질":quality>=60?"보통 품질":"낮은 품질 (파일 작음)"}</span>
          </div>
          <input type="range" min={10} max={100} value={quality} onChange={e=>{setQuality(Number(e.target.value));setFiles(p=>p.map(i=>({...i,result:null,error:""})));}}
            style={{width:"100%",accentColor:"#1f6feb",cursor:"pointer"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"#484f58",marginTop:"4px"}}>
            <span>저화질 (작은 파일)</span><span>고화질 (큰 파일)</span>
          </div>
        </div>}

        {/* 리사이즈 옵션 */}
        <div>
          <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"8px"}}>크기 조절</div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <button onClick={()=>{setResize(!resize);setFiles(p=>p.map(i=>({...i,result:null,error:""})));}} style={{
              padding:"7px 14px",borderRadius:"6px",border:`1px solid ${resize?"#58a6ff":"#30363d"}`,
              background:resize?"#1f6feb22":"#21262d",color:resize?"#58a6ff":"#8b949e",
              cursor:"pointer",fontSize:"13px",fontFamily:"'Noto Sans KR',sans-serif",
            }}>{resize?"✅ 리사이즈 ON":"리사이즈 OFF"}</button>
            {resize&&<div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              <span style={{color:"#8b949e",fontSize:"12px"}}>최대 너비</span>
              <input type="number" value={maxWidth} min={100} max={8000} onChange={e=>{setMaxWidth(Number(e.target.value));setFiles(p=>p.map(i=>({...i,result:null,error:""})));}}
                style={{width:"80px",padding:"5px 8px",background:"#0d1117",border:"1px solid #30363d",borderRadius:"6px",color:"#e6edf3",fontSize:"13px",outline:"none",textAlign:"center"}}/>
              <span style={{color:"#8b949e",fontSize:"12px"}}>px</span>
            </div>}
          </div>
        </div>
      </div>
    </div>

    {/* 업로드 영역 */}
    <div onClick={()=>fileInputRef.current?.click()} onTouchEnd={e=>{e.preventDefault();fileInputRef.current?.click();}}
      onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}
      onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
      style={{border:`2px dashed ${dragOver?"#58a6ff":"#30363d"}`,borderRadius:"12px",padding:"32px 20px",
        textAlign:"center",cursor:"pointer",background:dragOver?"#1f6feb11":"#0d1117",transition:"all .2s"}}>
      <div style={{fontSize:"32px",marginBottom:"8px"}}>🔄</div>
      <div style={{color:"#c9d1d9",fontSize:"15px",fontWeight:600,marginBottom:"6px"}}>
        이미지를 드래그하거나 클릭하여 업로드
      </div>
      <div style={{color:"#484f58",fontSize:"13px"}}>
        {INPUT_FORMATS.join(", ")} → <span style={{color:"#58a6ff",fontWeight:600}}>{fmt.label}</span> 변환
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addFiles(e.target.files)}/>
    </div>

    {files.length>0&&<>
      {/* 액션 버튼 */}
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
        <Btn onClick={convertAll} loading={files.some(f=>f.loading)}>
          🔄 전체 변환 ({files.length}개)
        </Btn>
        {files.filter(f=>f.result).length>0&&<>
          <Btn onClick={downloadAll} variant="success">
            ⬇️ 전체 다운로드 ({files.filter(f=>f.result).length}개)
          </Btn>
          <span style={{color:"#8b949e",fontSize:"13px",marginLeft:"auto"}}>
            {files.filter(f=>f.result).length} / {files.length} 완료
          </span>
        </>}
        <Btn onClick={()=>setFiles([])} variant="secondary">🗑️ 초기화</Btn>
      </div>

      {/* 파일 목록 */}
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {/* 헤더 */}
        <div style={{display:"grid",gridTemplateColumns:"60px 1fr 120px 120px 90px 80px",gap:"10px",
          padding:"8px 14px",background:"#21262d",borderRadius:"8px",
          fontSize:"11px",color:"#8b949e",fontWeight:600}}>
          <span>미리보기</span><span>파일명</span><span>원본 크기</span><span>변환 후 크기</span><span>압축률</span><span>액션</span>
        </div>

        {files.map((item,idx)=>{
          const saving=item.result?Math.round((1-item.result.size/item.origSize)*100):null;
          return <div key={item.id} style={{display:"grid",gridTemplateColumns:"60px 1fr 120px 120px 90px 80px",gap:"10px",
            padding:"10px 14px",background:"#161b22",borderRadius:"8px",
            border:`1px solid ${item.error?"#da363333":item.result?"#2ea04333":"#21262d"}`,
            alignItems:"center"}}>
            {/* 미리보기 */}
            <img src={item.preview} alt="" style={{width:"52px",height:"52px",objectFit:"cover",borderRadius:"6px",border:"1px solid #30363d"}}/>
            {/* 파일명 */}
            <div>
              <div style={{color:"#e6edf3",fontSize:"13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.file.name}</div>
              <div style={{color:"#484f58",fontSize:"11px",marginTop:"2px"}}>{item.file.type||"unknown"}</div>
              {item.error&&<div style={{color:"#ff7b72",fontSize:"11px",marginTop:"2px"}}>⚠️ {item.error}</div>}
            </div>
            {/* 원본 크기 */}
            <div style={{color:"#8b949e",fontSize:"13px"}}>{fmtSize(item.origSize)}</div>
            {/* 변환 후 크기 */}
            <div style={{fontSize:"13px",color:item.result?"#3fb950":"#484f58"}}>
              {item.loading?"변환중...":item.result?fmtSize(item.result.size):"-"}
            </div>
            {/* 압축률 */}
            <div style={{fontSize:"13px"}}>
              {saving!=null?<span style={{color:saving>0?"#3fb950":saving<0?"#ff7b72":"#8b949e",fontWeight:600}}>
                {saving>0?`▼ ${saving}%`:saving<0?`▲ ${Math.abs(saving)}%`:"동일"}
              </span>:"-"}
            </div>
            {/* 액션 */}
            <div style={{display:"flex",gap:"4px",flexDirection:"column"}}>
              {item.loading?<span style={{color:"#8b949e",fontSize:"11px"}}>⏳ 처리중</span>
              :item.result?<>
                <button onClick={()=>downloadFile(item)} style={{padding:"5px 8px",background:"#2ea043",color:"#fff",border:"none",borderRadius:"5px",cursor:"pointer",fontSize:"11px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif"}}>⬇️ 저장</button>
                <button onClick={()=>convertFile(item)} style={{padding:"4px 8px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"5px",cursor:"pointer",fontSize:"10px",fontFamily:"'Noto Sans KR',sans-serif"}}>재변환</button>
              </>:<>
                <button onClick={()=>convertFile(item)} style={{padding:"5px 8px",background:"#1f6feb",color:"#fff",border:"none",borderRadius:"5px",cursor:"pointer",fontSize:"11px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif"}}>변환</button>
                <button onClick={()=>setFiles(p=>p.filter(f=>f.id!==item.id))} style={{padding:"4px 8px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"5px",cursor:"pointer",fontSize:"10px"}}>✕ 삭제</button>
              </>}
            </div>
          </div>;
        })}
      </div>

      {/* 변환 완료 미리보기 */}
      {files.some(f=>f.result)&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
        <SectionTitle>✅ 변환 완료 미리보기</SectionTitle>
        <div style={{display:"flex",flexWrap:"wrap",gap:"12px"}}>
          {files.filter(f=>f.result).map((item,idx)=>(
            <div key={item.id} style={{display:"flex",flexDirection:"column",gap:"6px",alignItems:"center"}}>
              <img src={item.result.url} alt="" style={{width:"100px",height:"80px",objectFit:"contain",borderRadius:"6px",border:"1px solid #30363d",background:"#0d1117"}}/>
              <div style={{fontSize:"10px",color:"#8b949e",textAlign:"center"}}>{fmtSize(item.result.size)}</div>
              <button onClick={()=>downloadFile(item)} style={{padding:"4px 12px",background:"#2ea043",color:"#fff",border:"none",borderRadius:"5px",cursor:"pointer",fontSize:"11px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif"}}>⬇️ 저장</button>
            </div>
          ))}
        </div>
      </div>}
    </>}
  </div>;
}

// ─── TAB 5: 키워드 조회 ──────────────────────────────────────────────────
// 키워드 분석 캐시 (세션 동안 유지, 같은 키워드 재분석 시 AI 호출 생략)
const KW_CACHE = {};

async function fetchNaverKeywordStats(keywords) {
  const res = await fetch(`/api/keyword-stats?keywords=${keywords.map(encodeURIComponent).join(",")}`);
  if (!res.ok) throw new Error(`API 오류 ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { keywordList: data.keywordList || [], autoComplete: data.autoComplete || [] };
}

function KeywordTab({goWrite, goAutoWrite, kwResult, setKwResult, isMobile, pendingKeywordSearch, setPendingKeywordSearch}){
  const [inputVal,setInputVal]=useState(kwResult?._inputVal||"");

  const pendingKwRef = useRef(null);
  useEffect(()=>{
    if(pendingKeywordSearch){
      pendingKwRef.current = pendingKeywordSearch;
      setInputVal(pendingKeywordSearch);
      setPendingKeywordSearch("");
    }
  },[pendingKeywordSearch]);
  useEffect(()=>{
    if(pendingKwRef.current){
      const kw = pendingKwRef.current;
      pendingKwRef.current = null;
      analyze(kw);
    }
  },[inputVal]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [customTopic,setCustomTopic]=useState("");   // 직접 입력한 글 주제

  const result = kwResult; // 단일 객체: naver + AI 모두 포함

  // 키워드가 바뀌면 직접 입력한 주제 초기화
  useEffect(()=>{ setCustomTopic(""); },[result?.keyword]);

  // 주제 하나로 자동글쓰기 실행 (추천 주제 / 직접 입력 공통)
  const writeTopic=(topic)=>{
    const t=(topic||"").trim();
    if(!t||!goAutoWrite) return;
    goAutoWrite(t,result?.smartBlockType,result?.smartBlockReason,result?.blogStrategy,result?.keyword);
  };
  const fmtNum = n => { if(n===null||n===undefined) return "-"; const num=Number(n); if(isNaN(num)) return "-"; if(num<=10) return "10 이하"; return num.toLocaleString(); };

  const analyze=async(overrideKw)=>{
    const kw=(overrideKw||inputVal).trim(); if(!kw) return;
    setInputVal(kw);
    // 캐시 확인 - 같은 키워드면 저장된 결과 바로 표시
    if(KW_CACHE[kw]){
      setKwResult(KW_CACHE[kw]);
      return;
    }
    setLoading(true); setError(""); setKwResult(null);
    try{
      // ① 네이버 광고 API (메인 키워드)
      let naverMain = [];
      let autoComplete = [];
      let naverOk = false;
      try{
        const result = await fetchNaverKeywordStats([kw]);
        naverMain = result.keywordList;
        autoComplete = result.autoComplete;
        naverOk = true;
      }catch(e){ naverOk = false; }

      // naverMain에서 메인 키워드 수치 바로 추출 (대소문자 무시)
      const mainStat = naverMain.find(i=>i.relKeyword?.toLowerCase()===kw.toLowerCase()) || naverMain[0] || null;
      const pcMonthly   = mainStat?.monthlyPcQcCnt!=null ? Number(mainStat.monthlyPcQcCnt)||0 : null;
      const mobMonthly  = mainStat?.monthlyMobileQcCnt!=null ? Number(mainStat.monthlyMobileQcCnt)||0 : null;
      const totalMonthly = (pcMonthly!==null&&mobMonthly!==null) ? pcMonthly+mobMonthly : null;

      // ② 블로그 총 게시물 수 + 월 발행량 (Search API 실측값만 사용)
      let totalBlogPosts = null;
      let monthlyBlogPostsReal = null;
      let blogCountOk = false;
      try {
        const bcRes = await fetch(`/api/blog-count?keyword=${encodeURIComponent(kw)}`);
        const bcData = await bcRes.json();
        if (!bcData.error) {
          totalBlogPosts = bcData.total ?? null;
          if (bcData.monthly != null) { monthlyBlogPostsReal = bcData.monthly; blogCountOk = true; }
        }
      } catch(e) {}

      // ③ 네이버 인기 블로그 글 제목 가져오기 (롱테일 기반)
      let blogTitles = [];
      try {
        const btRes = await fetch(`/api/blog-titles?keyword=${encodeURIComponent(kw)}`);
        const btData = await btRes.json();
        blogTitles = btData.titles || [];
      } catch(e) {}

      // ④ 상위 블로그 정보 (평균 발행일자, 고지수 비율)
      let top10Blogs = [];
      let avgPostAgeDays = null;
      let highIndexRatio = 0;
      try {
        const rankRes = await fetch(`/api/naver-rank?keyword=${encodeURIComponent(kw)}&blogId=__none__`);
        const rankData = await rankRes.json();
        const items = (rankData.items || []).slice(0, 10);
        top10Blogs = items;
        const now = Date.now();
        const ages = items.map(i=>i.postDate).filter(Boolean).map(d=>{
          const s=String(d).replace(/-/g,"");
          return (now-new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`).getTime())/(1000*60*60*24);
        }).filter(n=>!isNaN(n)&&n>=0);
        if(ages.length>0) avgPostAgeDays=Math.round(ages.reduce((a,b)=>a+b,0)/ages.length);
        const highIdx=items.filter(i=>{const n=i.bloggerName||"";return n.length>=3&&!/^\d+$/.test(n);});
        highIndexRatio=items.length>0?highIdx.length/items.length:0;
      } catch(e) {}

      // ⑤ AI 분석 (트렌드 + 인기글 기반 롱테일)
      // ④ AI 분석 (트렌드 + 인기글 기반 롱테일)
      const titlesAppend = blogTitles.length > 0
        ? ["", "", "실제 네이버 블로그 인기글 제목 (참고용):"].concat(blogTitles.slice(0,15).map((t,i)=>(i+1)+". "+t)).join("\n")
        : "";
      const nowDate=new Date();
      const yearMonthNow=`${nowDate.getFullYear()}년 ${nowDate.getMonth()+1}월`;
      const msgContent = [
        `현재 날짜: ${yearMonthNow}`,
        '"'+kw+'" 키워드 분석. 순수 JSON만 출력.',
        '{',
        '  "trend": "상승|하락|유지",',
        '  "trendReason": "최근 검색 트렌드 이유 한 줄",',
        '  "peakSeason": "검색량이 높은 시기 설명",',
        '  "difficultyComment": "상위노출 핵심 조언 한 줄",',
        '  "smartBlockType": "블로그|지도/플레이스|리뷰|쇼핑|비교/추천|정보/지식 중 이 키워드 검색 시 네이버에서 가장 먼저 뜨는 스마트블록 유형",',
        '  "smartBlockReason": "왜 이 유형의 스마트블록이 뜨는지 한 줄",',
        '  "blogStrategy": "이 스마트블록 유형에서 블로그가 노출될 수 있는 전략 한 줄",',
        '  "longtailKeywords": [',
        `    "${yearMonthNow} 현재 기준 최신 트렌드를 반영한, 이 키워드로 블로그 글을 쓸 때 활용할 수 있는 구체적인 글 주제 10개.",`,
        '    "형식: 실제 블로거가 쓸 법한 완성된 제목 형태로.",',
        '    "예: 천안맛집 → \'천안 성정동 점심 혼밥하기 좋은 국밥집 솔직 후기\' 처럼.",',
        '    "키워드를 자연스럽게 포함하되 독자 클릭을 유도하는 제목으로. 과거 연도(2024년 등) 절대 사용 금지."',
        '  ]',
        '}' + titlesAppend
      ].join("\n");
      const raw = await callClaude([{role:"user",content:msgContent}],"Respond ONLY with valid JSON.");
      const cleaned = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const aiResult = safeParseJson(cleaned);
      const relStats = [];

      // 경쟁 강도 계산 (판다랭크 방식: 포화도 = 월발행량 ÷ 월검색량 × 100%)
      // monthlyBlogPostsReal = 네이버 Search API 실측 월 발행량 (가장 신뢰)
      // AI 추정값은 사용하지 않음 — 실측값만 신뢰
      const monthlyBlogPosts = monthlyBlogPostsReal ?? null;

      // 포화도(%) = 월발행량 / 월검색량 × 100 + total 보정
      let saturation = null;
      if (monthlyBlogPosts !== null && totalMonthly && totalMonthly > 0) {
        const rawSat = (monthlyBlogPosts / totalMonthly) * 100;
        const totalFactor = totalBlogPosts
          ? 1 + Math.log10(Math.max(totalBlogPosts, 1)) / 4
          : 1;
        saturation = Math.round(rawSat * totalFactor);
      } else if (monthlyBlogPosts !== null && monthlyBlogPosts > 0) {
        saturation = monthlyBlogPosts < 100 ? 10 : monthlyBlogPosts < 500 ? 50
          : monthlyBlogPosts < 2000 ? 200 : monthlyBlogPosts < 10000 ? 800
          : monthlyBlogPosts < 30000 ? 3000 : 9000;
      }

      // 경쟁 강도 5단계
      let compLevel = "알 수 없음";
      let compScore_raw = 50;
      if (saturation !== null) {
        const satFactor  = Math.log10(Math.max(saturation, 0.1)) / Math.log10(10000);
        const srchFactor = totalMonthly
          ? Math.min(Math.log10(Math.max(totalMonthly, 1)) / Math.log10(1000000), 1)
          : 0.3;
        const combined = satFactor * 0.6 + srchFactor * 0.4;
        compScore_raw = Math.round(combined * 100);
        compLevel = combined < 0.2 ? "매우쉬움"
          : combined < 0.4 ? "쉬움"
          : combined < 0.6 ? "보통"
          : combined < 0.8 ? "어려움"
          : "매우어려움";
      }

      let dailyVisitReq = null;
      if (saturation !== null) {
        dailyVisitReq = compScore_raw < 20 ? 30 : compScore_raw < 40 ? 50
          : compScore_raw < 50 ? 200 : compScore_raw < 60 ? 550
          : compScore_raw < 70 ? 700 : compScore_raw < 80 ? 1000 : 2000;
      } else if (totalMonthly) {
        dailyVisitReq = Math.max(30, Math.round(totalMonthly / 30 * 0.03 / 10) * 10);
      }

      const compComment = compLevel === "알 수 없음" ? null
        : compLevel === "매우쉬움" ? "초보 블로거도 쉽게 상위노출 가능한 키워드예요!"
        : compLevel === "쉬움"     ? "발행글이 적어 노출 기회가 많아요. 도전해보세요!"
        : compLevel === "보통"     ? "품질 좋은 글이라면 충분히 노출 가능해요."
        : compLevel === "어려움"   ? "전문성 있는 글과 어느 정도 블로그 지수가 필요해요."
        : "상위권 블로거에게 추천하는 고경쟁 키워드예요.";

      // UI 게이지용 0~100 스코어 (로그 스케일: 포화도 1~3000%를 0~100으로)
      const compScore = compScore_raw;

      // ratio는 하위 호환성 유지 (포화도를 배수로 표현)
      const ratio = saturation !== null ? saturation / 100 : null;

      // 연관검색어: naverMain에서 메인 키워드 제외한 나머지 (월검색량 내림차순)
      let relKeywords = naverMain
        .filter(i=>i.relKeyword?.toLowerCase()!==kw.toLowerCase())
        .map(i=>({
          keyword: i.relKeyword,
          total: (Number(i.monthlyPcQcCnt)||0)+(Number(i.monthlyMobileQcCnt)||0),
          pc: Number(i.monthlyPcQcCnt)||0,
          mob: Number(i.monthlyMobileQcCnt)||0,
        }))
        .sort((a,b)=>b.total-a.total)
        .slice(0,30);

      // 광고 API 연관검색어 부족 시 자동완성으로 보완 + 검색량 조회
      if(relKeywords.length < 3 && autoComplete.length > 0){
        const existing = new Set(relKeywords.map(r=>r.keyword?.toLowerCase()));
        const newAcKws = autoComplete.filter(ac=>
          ac.toLowerCase()!==kw.toLowerCase()&&!existing.has(ac.toLowerCase())
        );

        if(newAcKws.length > 0){
          // 자동완성 키워드들 검색량 한번에 조회
          try{
            const acResult = await fetchNaverKeywordStats(newAcKws.slice(0,10));
            const acStatMap = {};
            (acResult.keywordList||[]).forEach(i=>{
              acStatMap[i.relKeyword?.toLowerCase()]={
                total:(Number(i.monthlyPcQcCnt)||0)+(Number(i.monthlyMobileQcCnt)||0),
                pc:Number(i.monthlyPcQcCnt)||0,
                mob:Number(i.monthlyMobileQcCnt)||0,
              };
            });
            const acKws = newAcKws.map(ac=>({
              keyword: ac,
              ...(acStatMap[ac.toLowerCase()]||{total:null,pc:null,mob:null}),
              fromAutoComplete: true,
            })).sort((a,b)=>(b.total||0)-(a.total||0));
            relKeywords = [...relKeywords, ...acKws].slice(0,30);
          }catch(e){
            // 조회 실패 시 검색량 없이 표시
            const acKws = newAcKws.map(ac=>({keyword:ac,total:null,pc:null,mob:null,fromAutoComplete:true}));
            relKeywords = [...relKeywords, ...acKws].slice(0,30);
          }
        }
      }

      const kwRes = {
        _inputVal: kw,
        keyword: kw,
        naverOk,
        blogCountOk,
        pcMonthly, mobMonthly, totalMonthly,
        pcAvgClick: mainStat?.monthlyAvePcClkCnt ?? null,
        mobAvgClick: mainStat?.monthlyAveMobileClkCnt ?? null,
        totalBlogPosts,
        saturation, ratio, compLevel, compScore, dailyVisitReq, compComment,
        blogTitles,
        relKeywords,
        ...aiResult,
        monthlyBlogPosts,
        top10Blogs, avgPostAgeDays, highIndexRatio,
      };
      KW_CACHE[kw] = kwRes;
      setKwResult(kwRes);
    }catch(e){
      setError("분석 오류: "+e.message);
    }
    setLoading(false);
  };

  const COMP_COLOR={"매우쉬움":"#3fb950","쉬움":"#58a6ff","보통":"#ffa657","어려움":"#ff7b72","매우어려움":"#f85149","알 수 없음":"#8b949e"};
  const compColor = COMP_COLOR[result?.compLevel||"보통"]||"#ffa657";


  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
    <div style={{display:"flex",gap:"8px"}}>
      <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}
        placeholder="키워드 입력 (예: 강남맛집)"
        style={{flex:1,minWidth:0,padding:"10px 12px",background:"#0d1117",border:"1px solid #30363d",borderRadius:"10px",
          color:"#e6edf3",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",outline:"none"}}
        onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
      <Btn onClick={()=>analyze()} loading={loading}>🔍 분석</Btn>
      {result&&<button onClick={()=>{setKwResult(null);setInputVal("");setError("");}}
        style={{padding:"10px 10px",background:"#21262d",border:"1px solid #30363d",borderRadius:"10px",
          color:"#8b949e",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",whiteSpace:"nowrap"}}>
        🗑️
      </button>}
    </div>

    {error&&<div style={{background:"#2d1117",border:"1px solid #da3633",borderRadius:"10px",padding:"14px",color:"#ff7b72"}}>{error}</div>}

    {loading&&<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      {["📡 네이버 광고 API 검색량 조회 중...","📊 블로그 총 게시물 수 조회 중...","🤖 AI 트렌드 분석 중...","🔗 연관 키워드 검색량 조회 중..."].map((msg,i)=>(
        <div key={i} style={{background:"#161b22",borderRadius:"10px",padding:"12px 16px",border:"1px solid #30363d",
          color:"#8b949e",fontSize:"13px",animation:`pulse 1.5s ease ${i*0.3}s infinite`}}>
          {msg}
        </div>
      ))}
    </div>}

    {result&&!loading&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

      {/* ── 키워드 헤더 ── */}
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",padding:"4px 0"}}>
        <div style={{fontSize:"18px",fontWeight:700,color:"#fff"}}>🔍 <span style={{color:"#58a6ff"}}>"{result.keyword}"</span></div>
        <span style={{fontSize:"10px",color:result.naverOk?"#3fb950":"#ffa657",
          background:result.naverOk?"#0d2019":"#2d1e0a",
          border:`1px solid ${result.naverOk?"#2ea04333":"#ffa65733"}`,
          borderRadius:"20px",padding:"2px 8px",whiteSpace:"nowrap"}}>
          {result.naverOk?"📡 실제 데이터":"⚠️ API 실패"}
        </span>
        <span style={{marginLeft:"auto",
          color:result.trend==="상승"?"#3fb950":result.trend==="하락"?"#ff7b72":"#8b949e",
          background:result.trend==="상승"?"#0d201966":result.trend==="하락"?"#2d111766":"#21262d",
          border:`1px solid ${result.trend==="상승"?"#2ea04344":result.trend==="하락"?"#da363344":"#30363d"}`,
          borderRadius:"20px",padding:"3px 10px",fontSize:"12px",fontWeight:600,whiteSpace:"nowrap"}}>
          {result.trend==="상승"?"📈 상승세":result.trend==="하락"?"📉 하락세":"➡️ 유지"}
        </span>
      </div>

      {/* ── PC: 2열 그리드 / 모바일: 단일 열 ── */}
      <div style={isMobile
        ? {display:"flex",flexDirection:"column",gap:"12px"}
        : {display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>

        {/* 검색량 */}
        <div style={{background:"linear-gradient(135deg,#1a2332,#0d1f35)",border:"1px solid #1f6feb44",borderRadius:"12px",padding:"14px",...(!isMobile&&{gridColumn:"1/3"})}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"7px"}}>
            {[
              ["월간 검색량", result.totalMonthly!==null?fmtNum(result.totalMonthly)+"회":"없음","#58a6ff"],
              ["모바일 검색량", result.mobMonthly!==null?fmtNum(result.mobMonthly)+"회":"-","#d2a8ff"],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:"#0d1117aa",borderRadius:"8px",padding:"10px 8px",border:"1px solid #30363d",textAlign:"center"}}>
                <div style={{color:c,fontSize:"16px",fontWeight:700,marginBottom:"3px"}}>{v}</div>
                <div style={{color:"#8b949e",fontSize:"10px"}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"7px"}}>
            {[
              ["PC 검색량", result.pcMonthly!==null?fmtNum(result.pcMonthly)+"회":"-","#79c0ff"],
              ["클릭(PC)", result.pcAvgClick!==null?fmtNum(result.pcAvgClick)+"회":"-","#56d364"],
              ["클릭(모바일)", result.mobAvgClick!==null?fmtNum(result.mobAvgClick)+"회":"-","#ffa657"],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:"#0d1117aa",borderRadius:"8px",padding:"8px 6px",border:"1px solid #30363d",textAlign:"center"}}>
                <div style={{color:c,fontSize:"13px",fontWeight:700,marginBottom:"3px"}}>{v}</div>
                <div style={{color:"#8b949e",fontSize:"10px"}}>{l}</div>
              </div>
            ))}
          </div>
          {result.totalMonthly!==null&&<div style={{marginTop:"7px",fontSize:"10px",color:"#484f58",textAlign:"right"}}>
            ※ 네이버 검색광고 API 기준 · 10 이하는 "10 이하"로 표시
          </div>}
        </div>

        {/* 연관검색어 */}
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"14px",...(!isMobile&&{gridColumn:"1/3"})}}>
          <SectionTitle>🔗 연관검색어 <span style={{color:"#484f58",fontWeight:400,fontSize:"11px"}}>· 월 검색량</span></SectionTitle>
          {result.relKeywords?.length>0?(
            <div style={{maxHeight:"320px",overflowY:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 64px 64px",gap:"6px",padding:"5px 8px",borderBottom:"1px solid #21262d",marginBottom:"4px"}}>
                <span style={{color:"#484f58",fontSize:"10px",fontWeight:700}}>키워드</span>
                <span style={{color:"#484f58",fontSize:"10px",fontWeight:700,textAlign:"right"}}>월검색량</span>
                <span style={{color:"#484f58",fontSize:"10px",fontWeight:700,textAlign:"right"}}>모바일</span>
              </div>
              {result.relKeywords.map((rk,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 64px 64px",gap:"6px",
                  padding:"6px 8px",borderRadius:"6px",cursor:"pointer",transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#21262d"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>{setInputVal(rk.keyword);analyze(rk.keyword);}}>
                  <span style={{color:"#c9d1d9",fontSize:"12px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {rk.keyword}
                    {rk.fromAutoComplete&&<span style={{marginLeft:"5px",fontSize:"9px",color:"#484f58",background:"#21262d",borderRadius:"4px",padding:"1px 5px"}}>자동완성</span>}
                  </span>
                  <span style={{color:"#58a6ff",fontSize:"12px",fontWeight:600,textAlign:"right"}}>{rk.total!==null?fmtNum(rk.total):"-"}</span>
                  <span style={{color:"#d2a8ff",fontSize:"12px",textAlign:"right"}}>{rk.mob!==null?fmtNum(rk.mob):"-"}</span>
                </div>
              ))}
            </div>
          ):(
            <div style={{color:"#484f58",fontSize:"12px",textAlign:"center",padding:"16px 0"}}>연관검색어 없음</div>
          )}
        </div>

        {/* 경쟁 강도 */}
        <div style={{background:"#161b22",border:`1px solid ${compColor}55`,borderRadius:"12px",padding:"16px",...(!isMobile&&{gridColumn:"1/3",gridRow:"3"})}}>
          <SectionTitle>⚡ 경쟁 강도</SectionTitle>

          {/* 등급 + 추천 */}
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"10px"}}>
            <div style={{background:`${compColor}18`,border:`2px solid ${compColor}`,borderRadius:"12px",padding:"8px 18px",flexShrink:0,textAlign:"center"}}>
              <div style={{color:compColor,fontSize:"20px",fontWeight:900,lineHeight:1}}>{result.compLevel}</div>
            </div>
            <div style={{flex:1}}>
              {result.dailyVisitReq!=null&&<div style={{color:"#e6edf3",fontSize:"13px",fontWeight:600,marginBottom:"2px"}}>
                일 방문자 <span style={{color:compColor}}>{fmtNum(result.dailyVisitReq)}명 이상</span> 블로거 추천
              </div>}
              {result.compComment&&<div style={{color:"#8b949e",fontSize:"12px",lineHeight:"1.4"}}>{result.compComment}</div>}
            </div>
          </div>

          {/* 게이지 */}
          <div style={{position:"relative",marginBottom:"4px"}}>
            <div style={{height:"10px",background:"linear-gradient(90deg,#3fb950,#58a6ff,#ffa657,#ff7b72,#f85149)",borderRadius:"5px"}}/>
            <div style={{position:"absolute",top:"-4px",left:`calc(${Math.min(Math.max(result.compScore,2),96)}% - 9px)`,width:"18px",height:"18px",background:"#161b22",borderRadius:"50%",border:`3px solid ${compColor}`,boxShadow:`0 0 8px ${compColor}99`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"#484f58",marginBottom:"14px"}}>
            <span>매우쉬움</span><span>매우어려움</span>
          </div>

          {/* 수치: 월발행량 + 포화도 + 평균발행일 + 고지수비율 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
            {[
              {label:"월 발행량", value:result.monthlyBlogPosts!=null?fmtNum(result.monthlyBlogPosts)+"개":"—", color:"#ffa657", badge:result.blogCountOk?"✓":null},
              {label:"포화도",   value:result.saturation!=null?result.saturation+"%":"—", color:compColor},
            ].map(({label,value,color,badge},i)=>(
              <div key={i} style={{background:"#0d1117",borderRadius:"10px",padding:"10px 8px",textAlign:"center",border:"1px solid #21262d"}}>
                <div style={{color:"#484f58",fontSize:"10px",marginBottom:"4px"}}>{label}</div>
                <div style={{color,fontSize:"14px",fontWeight:700}}>
                  {value}{badge&&<span style={{color:"#3fb950",fontSize:"9px",marginLeft:"2px"}}>{badge}</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <div style={{background:"#0d1117",borderRadius:"10px",padding:"10px 8px",textAlign:"center",border:"1px solid #21262d"}}>
              <div style={{color:"#484f58",fontSize:"10px",marginBottom:"4px"}}>평균 발행일자</div>
              <div style={{color:"#79c0ff",fontSize:"14px",fontWeight:700}}>{result.avgPostAgeDays!=null?result.avgPostAgeDays+"일 전":"—"}</div>
              <div style={{color:"#484f58",fontSize:"9px",marginTop:"2px"}}>상위 10개 글 기준</div>
            </div>
            <div style={{background:"#0d1117",borderRadius:"10px",padding:"10px 8px",textAlign:"center",border:"1px solid #21262d"}}>
              <div style={{color:"#484f58",fontSize:"10px",marginBottom:"4px"}}>상위 블로그 비율</div>
              <div style={{color:result.highIndexRatio>=0.7?"#f85149":result.highIndexRatio>=0.4?"#ffa657":"#3fb950",fontSize:"14px",fontWeight:700}}>
                {result.highIndexRatio!=null?Math.round(result.highIndexRatio*100)+"%":"—"}
              </div>
              <div style={{color:"#484f58",fontSize:"9px",marginTop:"2px"}}>고지수 블로거 추정</div>
            </div>
          </div>
        </div>

        {/* ── 글 주제 정하기 (직접 입력 + AI 추천) ── */}
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"14px",...(!isMobile&&{gridColumn:"1/3"})}}>
          <SectionTitle>✍️ 글 주제 정하기</SectionTitle>

          {/* 직접 주제 입력 */}
          <div style={{background:"#0d1117",border:"1px solid #1f6feb55",borderRadius:"10px",padding:"11px 12px",marginBottom:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"8px",flexWrap:"wrap"}}>
              <span style={{color:"#58a6ff",fontSize:"12px",fontWeight:700}}>✏️ 직접 주제 입력</span>
              <span style={{color:"#484f58",fontSize:"10px"}}>· 아래 추천 주제를 불러와서 고쳐 써도 됩니다</span>
            </div>
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
              <input value={customTopic} onChange={e=>setCustomTopic(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") writeTopic(customTopic); }}
                placeholder={`예: ${result.keyword} 처음 알아볼 때 꼭 확인해야 할 5가지`}
                style={{flex:"1 1 240px",minWidth:0,padding:"9px 11px",background:"#010409",border:"1px solid #30363d",
                  borderRadius:"8px",color:"#e6edf3",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",outline:"none"}}
                onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
              <button onClick={()=>writeTopic(customTopic)} disabled={!customTopic.trim()}
                style={{background:customTopic.trim()?"linear-gradient(135deg,#1f6feb,#388bfd)":"#21262d",
                  border:"none",color:customTopic.trim()?"#fff":"#484f58",borderRadius:"8px",padding:"9px 16px",
                  fontSize:"12px",fontWeight:700,cursor:customTopic.trim()?"pointer":"not-allowed",
                  fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                ✍️ 이 주제로 글쓰기
              </button>
              {customTopic&&<button onClick={()=>setCustomTopic("")}
                style={{background:"#21262d",border:"1px solid #30363d",color:"#8b949e",borderRadius:"8px",
                  padding:"9px 10px",fontSize:"12px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",flexShrink:0}}>
                🗑️
              </button>}
            </div>
            {customTopic.trim()&&!customTopic.replace(/\s/g,"").toLowerCase().includes((result.keyword||"").replace(/\s/g,"").toLowerCase())&&
              <div style={{color:"#ffa657",fontSize:"10px",marginTop:"7px"}}>
                ⚠️ 제목에 키워드 "{result.keyword}"를 그대로 넣어야 검색 노출에 유리합니다
              </div>}
          </div>

          {/* AI 추천 주제 */}
          <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"7px"}}>
            🤖 AI 추천 주제 {result.longtailKeywords?.length>0&&<span style={{color:"#484f58",fontWeight:400}}>· {result.longtailKeywords.length}개 · ✏️ 를 누르면 위 칸으로 가져와 수정할 수 있어요</span>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
            {result.longtailKeywords?.map((kw,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",background:"#0d1117",
                borderRadius:"8px",padding:"8px 10px",border:`1px solid ${customTopic===kw?"#1f6feb":"#21262d"}`}}>
                <span style={{color:"#484f58",fontSize:"11px",minWidth:"16px",flexShrink:0}}>{i+1}</span>
                <span style={{flex:1,color:"#c9d1d9",fontSize:"12px",lineHeight:"1.4"}}>{kw}</span>
                <button onClick={()=>setCustomTopic(kw)} title="위 입력칸으로 가져와서 수정하기"
                  style={{background:"#21262d",border:"1px solid #30363d",color:"#8b949e",
                    borderRadius:"6px",padding:"4px 8px",fontSize:"11px",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                  ✏️
                </button>
                <button onClick={()=>writeTopic(kw)}
                  style={{background:"linear-gradient(135deg,#1f6feb,#388bfd)",border:"none",color:"#fff",
                    borderRadius:"6px",padding:"4px 10px",fontSize:"11px",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                  ✍️ 자동글쓰기
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>}
  </div>;
}


// ─── TAB 4: 누락 확인 & 포스팅 분석 ─────────────────────────────────────
function MissingTab(){
  const [mode,setMode]=useState("blogId");   // "blogId" | "url"
  // 방법1
  const [blogId,setBlogId]=useState("");
  const [loadingFeed,setLoadingFeed]=useState(false);
  const [feedError,setFeedError]=useState("");
  // 방법2
  const [singleUrl,setSingleUrl]=useState("");
  const [singleTitle,setSingleTitle]=useState("");
  const [singleBody,setSingleBody]=useState("");
  // 공통
  const [posts,setPosts]=useState(null);
  const [analysis,setAnalysis]=useState({});
  const [analyzing,setAnalyzing]=useState(-1);
  const [expanded,setExpanded]=useState(null);
  const [page,setPage]=useState(1);
  const PER_PAGE=10;
  // 방법3 — 엑셀 업로드
  const [excelHeaders,setExcelHeaders]=useState([]);
  const [excelRows,setExcelRows]=useState([]);
  const [excelParsed,setExcelParsed]=useState(false);
  const [excelError,setExcelError]=useState("");
  const [urlCol,setUrlCol]=useState("");
  const [titleCol,setTitleCol]=useState("");
  const [batchRunning,setBatchRunning]=useState(false);
  const [batchProgress,setBatchProgress]=useState({done:0,total:0});
  const excelFileRef=useRef(null);
  // 추가검색 — 제목 옆 입력창으로 직접 넣은 키워드 순위
  const [extraKw,setExtraKw]=useState({});            // {postNo: 입력중인 키워드}
  const [extraResults,setExtraResults]=useState({});  // {postNo: [{keyword,realRank,loading}]}
  const [extraLoading,setExtraLoading]=useState({});  // {postNo: bool}

  // ── 방법1: 블로그 전체 글 목록을 10개씩 페이지 단위로 조회 (과거 글까지) ──
  const fetchBlogPage=async(id,pg=1,keep=false)=>{
    const bid=(id||"").trim();
    if(!bid){alert("블로그 아이디를 입력해주세요.");return;}
    lsSet(LS_BLOGID, bid);   // 글쓰기 탭에서 제목 반복 단어를 분석할 때 사용
    setLoadingFeed(true);setFeedError("");setExpanded(null);
    if(!keep){setPosts(null);setAnalysis({});setExtraResults({});setExtraKw({});}
    try{
      const res=await fetch(`/api/blog-posts?blogId=${encodeURIComponent(bid)}&page=${pg}&size=${PER_PAGE}`);
      let data=null;
      try{ data=await res.json(); }catch(e){}
      if(!res.ok||!data) throw new Error(data?.error||`오류 (${res.status})`);
      if(data.error||data.success===false) throw new Error(data.error||"게시글 목록을 불러오지 못했습니다.");

      const list=(data.posts||[]).map(p=>({
        title:p.title||"(제목 없음)",
        link:p.link||`https://blog.naver.com/${data.blogId||bid}/${p.postNo}`,
        postNo:String(p.postNo||Math.random().toString().slice(2,10)),
        date:p.date||"",
        description:"",
        tags:[],
        source:"list",
        _blogId:data.blogId||bid,
      }));
      if(!list.length) throw new Error(pg>1?"이 페이지에는 게시글이 없습니다.":"게시글을 찾을 수 없어요. 블로그 아이디를 다시 확인해주세요.");

      const totalCount=data.totalCount||list.length;
      setPosts({
        all:list, current:list, total:totalCount, page:pg,
        blogId:data.blogId||bid, serverPaged:true,
        totalPages:data.totalPages||Math.max(Math.ceil(totalCount/PER_PAGE),1),
        notice:data.notice||"",
      });
      setPage(pg);
    }catch(e){setFeedError(e.message||"오류가 발생했습니다.");}
    setLoadingFeed(false);
  };

  const fetchByBlogId=()=>fetchBlogPage(blogId,1,false);

  // ── 방법2: URL+제목+본문 직접 입력 → 즉시 분석 ──
  const analyzeManual=()=>{
    const url=singleUrl.trim();
    const title=singleTitle.trim();
    if(!url){alert("URL을 입력해주세요.");return;}
    if(!title){alert("제목을 입력해주세요.");return;}
    const m=url.match(/blog\.naver\.com\/([^/\s?#]+)\/(\d+)/);
    if(!m){alert("올바른 네이버 블로그 URL을 입력해주세요.\n예: https://blog.naver.com/아이디/포스트번호");return;}
    const postNo=m[2];
    const post={title,link:url,postNo,date:"",description:singleBody.slice(0,300),bodyText:singleBody,source:"manual",_blogId:m[1]};
    setPosts({all:[post],current:[post],total:1,page:1,blogId:m[1]});
    setPage(1);setAnalysis({});setExpanded(null);setExtraResults({});setExtraKw({});
    setTimeout(()=>runAnalyze(post,0),80);
  };

  const goPage=(pg)=>{
    if(!posts)return;
    const tp=posts.serverPaged?(posts.totalPages||1):Math.max(Math.ceil(posts.all.length/PER_PAGE),1);
    if(pg<1||pg>tp||pg===posts.page)return;
    // 방법1(블로그 ID)은 서버에서 해당 페이지를 새로 불러옴 → 과거 글까지 조회 가능
    if(posts.serverPaged){
      if(loadingFeed)return;
      fetchBlogPage(posts.blogId,pg,true);
      return;
    }
    setPosts(p=>({...p,current:p.all.slice((pg-1)*PER_PAGE,pg*PER_PAGE),page:pg}));
    setPage(pg);setExpanded(null);
  };

  // ── 네이버 순위 조회 (통합검색/블로그탭 2영역) ──
  const getNaverRank=async(kw,blogId,postNo)=>{
    try{
      const params=new URLSearchParams({keyword:kw});
      if(blogId) params.append("blogId",blogId);
      if(postNo) params.append("postNo",postNo);
      const res=await fetch(`/api/naver-rank?${params.toString()}`);
      if(!res.ok) return null;
      const data=await res.json();
      if(data.error) return null;
      return {
        myRank: data.myRank??null,
        rankSource: data.rankSource??null,
        areas: data.areas??null, // { main_search:{rank,exposed_area,...}, blog:{...} }
        proxyError: data.proxyError??null,
      };
    }catch(e){return null;}
  };

  // ── 추가검색: 제목 옆 입력창 키워드로 순위 조회 ──
  const runExtraKeyword=async(post)=>{
    const kw=(extraKw[post.postNo]||"").trim();
    if(!kw) return;
    if(extraLoading[post.postNo]) return;
    const urlMatch=post.link?.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
    const bid=urlMatch?.[1]||post._blogId||"";
    const pno=urlMatch?.[2]||post.postNo||"";

    setExtraLoading(p=>({...p,[post.postNo]:true}));
    setExtraKw(p=>({...p,[post.postNo]:""}));
    // 같은 키워드를 다시 검색하면 기존 결과를 갱신
    setExtraResults(p=>({...p,[post.postNo]:[
      ...(p[post.postNo]||[]).filter(x=>x.keyword!==kw),
      {keyword:kw,realRank:null,loading:true},
    ]}));

    let r=null;
    try{ r=await getNaverRank(kw,bid,pno); }catch(e){ r=null; }

    setExtraResults(p=>({...p,[post.postNo]:(p[post.postNo]||[]).map(x=>
      x.keyword===kw?{keyword:kw,realRank:r,loading:false}:x
    )}));
    setExtraLoading(p=>({...p,[post.postNo]:false}));
  };

  const removeExtraKeyword=(postNo,keyword)=>{
    setExtraResults(p=>({...p,[postNo]:(p[postNo]||[]).filter(x=>x.keyword!==keyword)}));
  };

  // ── 본문 크롤링 — blog-content API 통해 서버에서 모바일 URL 크롤링 ──
  const fetchPostBody=async(post)=>{
    if(post.bodyText) return {text: post.bodyText, loaded: true};
    if(!post.link) return {text: post.description||"", loaded: false};
    try{
      const m=post.link.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
      if(!m) return {text: post.description||"", loaded: false};
      const blogId=m[1], logNo=m[2];
      const postUrl=`https://blog.naver.com/${blogId}/${logNo}`;
      const res=await fetch(`/api/blog-content?url=${encodeURIComponent(postUrl)}`);
      if(res.ok){
        const data=await res.json();
        if(data.success && data.bodies?.length>0 && data.bodies[0].length>=200){
          return {text: data.bodies[0], loaded: true};
        }
      }
    }catch(e){}
    return {text: post.description||"", loaded: false};
  };

  // ── AI 분석 ──
  const runAnalyze=async(post,idx)=>{
    if(analysis[post.postNo])return;
    setAnalyzing(idx);
    try{
      const {text: body, loaded: bodyLoaded} = await fetchPostBody(post);

      // ── Step 1: 본문 크롤링 + Claude AI 키워드 추출 ──
      // 본문은 이미 위에서 fetchPostBody로 가져온 body 사용
      let kws = [];
      try {
        const tagStr = (post.tags||[]).slice(0,10).join(', ');
        const bodySnippet = body.slice(0, 800); // 본문 앞 800자만 사용
        const prompt = `네이버 블로그 글의 제목, 해시태그, 본문을 보고 이 글이 네이버 검색에서 상위노출될 가능성이 있는 핵심 키워드 5개를 추출해줘.

제목: ${post.title}
해시태그: ${tagStr||'없음'}
본문 일부: ${bodySnippet||'없음'}

규칙:
- 실제로 네이버에서 사람들이 검색할 법한 구체적인 키워드
- 단순 연속 단어 조합 금지 (예: "즉시 실천한", "실천한 대응" 같은 의미없는 조합 X)
- 핵심 명사+명사, 명사+동사 조합 위주 (예: "SKT 해킹", "KT 해킹 사고", "해킹 대응 방법")
- 검색량이 있을 것 같은 2~4단어 복합 키워드 우선
- 단, 제목에서 의미있는 단독 명사(예: "봄", "비", "벚꽃")가 있으면 포함 가능
- JSON 배열만 반환, 다른 텍스트 없이

예시 출력: ["SKT 해킹","KT 해킹 사고","해킹 대응 방법","통신사 해킹","개인정보 유출 대처"]

JSON 배열만 출력:`;

        const aiRes = await fetch('/api/claude', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 200,
            messages: [{role:'user', content: prompt}]
          })
        });
        if(aiRes.ok){
          const aiData = await aiRes.json();
          const rawText = (aiData.content||[]).find(c=>c.type==='text')?.text||'';
          const cleaned = rawText.replace(/```json|```/g,'').trim();
          const parsed = safeParseJson(cleaned);
          if(Array.isArray(parsed) && parsed.length > 0){
            kws = parsed.slice(0,5).map(k=>String(k).trim()).filter(Boolean);
          }
        }
      } catch(e) {
        console.warn('[AI 키워드 추출 실패]', e?.message||e);
      }

      // AI 실패 시 fallback — 해시태그 + 제목 핵심어 추출
      if(kws.length === 0){
        const seen = new Set();
        const add = (k) => { k=(k||'').trim(); if(k&&k.length>=2&&!seen.has(k)&&kws.length<5){seen.add(k);kws.push(k);}};
        const addSingle = (k) => { k=(k||'').trim(); if(k&&k.length>=1&&!seen.has(k)&&kws.length<5){seen.add(k);kws.push(k);}};
        (post.tags||[]).forEach(t=>add(t));
        // 영문+한글 단어 분리 후 2-gram
        const allWords = (post.title.match(/[가-힣A-Za-z0-9]+/g)||[]).filter(w=>w.length>=2);
        const stopWords = new Set(['하는','하기','방법','하면','있는','없는','위한','대한','그리고','그래서','때문','정도','너무','아주','매우','바로','이제','같은','다른','가장','특히','주로','항상']);
        const meaningful = allWords.filter(w=>!stopWords.has(w));
        for(let i=0;i<meaningful.length-1;i++) add(meaningful[i]+' '+meaningful[i+1]);
        for(let i=0;i<meaningful.length-2;i++) add(meaningful[i]+' '+meaningful[i+1]+' '+meaningful[i+2]);
        meaningful.filter(w=>w.length>=3).forEach(w=>add(w));
        // 제목에서 1글자 한글 명사도 추출 (복합어 조합 후 자리 남을 때)
        const singleNouns = (post.title.match(/[가-힣]/g)||[]).filter(w=>!seen.has(w));
        singleNouns.forEach(w=>addSingle(w));
      }

      // ── SEO 점수 계산 ──────────────────────────────────────────────────────
      const bodyNoSpace = body.replace(/\s/g, "").length;
      const bodyLines   = body.split("\n").filter(l => l.trim().length > 0);

      // 1. 본문 글자수 (30점) — 본문 로딩 실패 시 0점 + 안내
      const lenScore = !bodyLoaded ? 0 :
        bodyNoSpace >= 3000 ? 30 :
        bodyNoSpace >= 1500 ? 22 :
        bodyNoSpace >= 1000 ? 13 :
        bodyNoSpace >= 500  ? 6  : 0;

      // 2. 제목 길이 (20점)
      const titleLen = post.title.length;
      const titleScore =
        titleLen >= 15 && titleLen <= 32 ? 20 :
        titleLen >= 10 && titleLen <= 40 ? 12 :
        titleLen >= 6  ? 5 : 0;

      // 3. 본문 구조 (20점) — 본문 로딩 실패 시 0점
      const paraScore = !bodyLoaded ? 0 :
        bodyLines.length >= 15 ? 20 :
        bodyLines.length >= 8  ? 14 :
        bodyLines.length >= 4  ? 7  : 0;

      // 4. 키워드 밀도 (15점)
      const titleWords   = post.title.match(/[가-힣a-zA-Z0-9]{2,}/g) || [];
      const bodyLower    = body.toLowerCase();
      const matchedWords = titleWords.filter(w => bodyLower.includes(w.toLowerCase()));
      const kwRatio      = titleWords.length > 0 ? matchedWords.length / titleWords.length : 0;
      const kwScore = !bodyLoaded ? 0 :
        kwRatio >= 0.7 ? 15 :
        kwRatio >= 0.4 ? 10 :
        kwRatio >= 0.2 ? 5  : 0;

      // 5. 광고·스팸성 패턴 (15점)
      const spamPatterns = ["협찬","광고비","원고료","제공받","체험단","서포터즈","뒷광고","내돈내산아님","유료광고","무료제공","클릭하세요","지금바로","한정수량","선착순","공구","당첨"];
      const spamCount    = spamPatterns.filter(p => body.includes(p)).length;
      const spamScore    = spamCount === 0 ? 15 : spamCount <= 1 ? 9 : spamCount <= 3 ? 3 : 0;

      const seoScore = lenScore + titleScore + paraScore + kwScore + spamScore;

      // SEO 개선 조언
      const seoAdvice = [];
      if(!bodyLoaded){
        seoAdvice.push(`__BODY_NOT_LOADED__`); // 렌더링에서 특별 처리
      }
      if(bodyLoaded && lenScore < 22){
        const needed = bodyNoSpace < 1500 ? 1500 - bodyNoSpace : 3000 - bodyNoSpace;
        seoAdvice.push(`📝 본문을 ${needed.toLocaleString()}자 더 늘리세요. 현재 ${bodyNoSpace.toLocaleString()}자 → ${bodyNoSpace<1500?"1,500자 이상":"3,000자 이상"} 권장`);
      }
      if(bodyLoaded && paraScore < 14){
        seoAdvice.push(`📑 본문을 더 잘게 나눠 단락을 늘리세요. 현재 ${bodyLines.length}개 단락 → 8개 이상, ▶ 소제목을 2~3개 추가하면 좋습니다`);
      }
      if(titleScore < 12){
        seoAdvice.push(`✏️ 제목 길이를 조정하세요. 현재 ${titleLen}자 → 15~32자가 네이버 권장 길이입니다`);
      }
      if(bodyLoaded && kwScore < 10){
        seoAdvice.push(`🔑 제목의 핵심 키워드를 본문에 더 자연스럽게 포함시키세요. 현재 포함률 ${Math.round(kwRatio*100)}% → 70% 이상 권장 (C-Rank 기준)`);
      }
      if(spamScore < 9){
        seoAdvice.push(`🚫 광고·협찬 표현 ${spamCount}개가 감지됐습니다. 해당 표현을 제거하면 D.I.A. 점수가 올라갑니다`);
      }
      if(seoAdvice.length === 0){
        seoAdvice.push(`✅ SEO 최적화 상태가 양호합니다. 꾸준히 이 수준을 유지하세요`);
      }

      const seoDetail = {
        lenScore, titleScore, paraScore, kwScore, spamScore,
        bodyNoSpace, titleLen,
        paraCount: bodyLines.length,
        kwRatio: Math.round(kwRatio * 100),
        spamCount, bodyLoaded,
        seoAdvice,
      };

      // ── Step 2: 글 제목으로 네이버 검색 → 실제 누락 여부 확인 ──
      const urlMatch=post.link?.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
      const extractedBlogId=urlMatch?.[1]||post._blogId||"";
      const extractedPostNo=urlMatch?.[2]||post.postNo||"";

      // 제목 전체를 검색어로 넣어서 내 글이 결과에 있는지 확인
      const titleRank=await getNaverRank(post.title, extractedBlogId, extractedPostNo);
      const missingStatus = titleRank?.myRank!=null ? "노출" : "누락";

      const kwData=kws.map((kw,i)=>({rank:i+1,keyword:kw,realRank:null,rankLoading:true}));
      setAnalysis(prev=>({...prev,[post.postNo]:{
        missingStatus, seoScore, seoDetail,
        titleRank,
        topKeywords:kwData
      }}));

      // 키워드 순위 순차 조회 (200ms 간격 — rate limit 방지)
      const rankResults=[];
      for(const kw of kws){
        const r=await getNaverRank(kw,extractedBlogId,extractedPostNo);
        rankResults.push(r);
        await new Promise(res=>setTimeout(res,200));
      }

      // 전체 키워드 저장 — null은 100위 밖으로 표시
      const exposedKeywords=kws
        .map((kw,i)=>({rank:i+1,keyword:kw,realRank:rankResults[i]??null,rankLoading:false}));

      setAnalysis(prev=>({...prev,[post.postNo]:{
        missingStatus, seoScore, seoDetail, titleRank,
        topKeywords:exposedKeywords
      }}));
    }catch(e){
      setAnalysis(prev=>({...prev,[post.postNo]:{error:true, errorMsg: e?.message||String(e)}}));
    }
    setAnalyzing(-1);
  };

  const analyzeAll=async()=>{
    if(!posts?.current)return;
    for(let i=0;i<posts.current.length;i++){
      const p=posts.current[i];
      if(!analysis[p.postNo]){await runAnalyze(p,i);await new Promise(r=>setTimeout(r,300));}
    }
  };

  // ── 방법3: 엑셀 파싱 (CDN 런타임 로드 — 빌드 의존성 없음) ──
  const parseExcelFile=async(file)=>{
    setExcelError("");setExcelParsed(false);setExcelRows([]);setExcelHeaders([]);setUrlCol("");setTitleCol("");
    const ext=file.name.split(".").pop().toLowerCase();

    // CSV — 별도 라이브러리 불필요
    if(ext==="csv"){
      try{
        const text=await file.text();
        const lines=text.split(/\r?\n/).filter(l=>l.trim());
        if(lines.length<2){setExcelError("데이터가 없습니다. 첫 행은 헤더, 2행부터 데이터여야 합니다.");return;}
        const sep=lines[0].includes("\t")?"\t":",";
        const headers=lines[0].split(sep).map(h=>h.replace(/^"|"$/g,"").trim());
        const rows=lines.slice(1).map(l=>l.split(sep).map(c=>c.replace(/^"|"$/g,"").trim())).filter(r=>r.some(c=>c));
        if(!rows.length){setExcelError("데이터 행이 없습니다.");return;}
        setExcelHeaders(headers);setExcelRows(rows);setExcelParsed(true);
        const uIdx=headers.findIndex(h=>/url|링크|주소/i.test(h));
        const tIdx=headers.findIndex(h=>/제목|title/i.test(h));
        if(uIdx>=0) setUrlCol(headers[uIdx]);
        if(tIdx>=0) setTitleCol(headers[tIdx]);
      }catch(e){setExcelError("CSV 파싱 오류: "+e.message);}
      return;
    }

    // xlsx / xls — CDN에서 런타임 로드 (npm install 불필요)
    try{
      if(!window.XLSX){
        await new Promise((resolve,reject)=>{
          const s=document.createElement("script");
          s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload=resolve;
          s.onerror=()=>reject(new Error("xlsx 라이브러리 로드 실패. 인터넷 연결을 확인하거나 CSV 파일을 사용해주세요."));
          document.head.appendChild(s);
        });
      }
      const XLSX=window.XLSX;
      const ab=await file.arrayBuffer();
      const wb=XLSX.read(ab);
      const ws=wb.Sheets[wb.SheetNames[0]];
      const data=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      if(!data||data.length<2){setExcelError("데이터가 없습니다. 첫 행은 헤더, 2행부터 데이터여야 합니다.");return;}
      const headers=data[0].map(h=>String(h||"").trim());
      const rows=data.slice(1).filter(r=>r.some(c=>String(c).trim()));
      if(!rows.length){setExcelError("데이터 행이 없습니다.");return;}
      setExcelHeaders(headers);setExcelRows(rows);setExcelParsed(true);
      const uIdx=headers.findIndex(h=>/url|링크|주소/i.test(h));
      const tIdx=headers.findIndex(h=>/제목|title/i.test(h));
      if(uIdx>=0) setUrlCol(headers[uIdx]);
      if(tIdx>=0) setTitleCol(headers[tIdx]);
    }catch(e){setExcelError(e.message||"파일 파싱 오류");}
  };

  // ── 방법3: 배치 분석 실행 ──
  const runBatchAnalysis=async()=>{
    if(!urlCol||!excelRows.length) return;
    const uIdx=excelHeaders.indexOf(urlCol);
    const tIdx=titleCol?excelHeaders.indexOf(titleCol):-1;
    const validPosts=excelRows.map((row,i)=>{
      const url=String(row[uIdx]||"").trim();
      const title=tIdx>=0?String(row[tIdx]||"").trim():"";
      const m=url.match(/blog\.naver\.com\/([^/\s?#]+)\/(\d+)/);
      if(!m) return null;
      return{title:title||`게시글 ${i+1}`,link:url,postNo:m[2],date:"",description:"",source:"excel",_blogId:m[1]};
    }).filter(Boolean);
    if(!validPosts.length){setExcelError("유효한 네이버 블로그 URL이 없습니다.\nblog.naver.com/아이디/번호 형식인지 확인해주세요.");return;}
    setPosts({all:validPosts,current:validPosts.slice(0,PER_PAGE),total:validPosts.length,page:1,blogId:""});
    setPage(1);setAnalysis({});setExpanded(null);setExtraResults({});setExtraKw({});
    setBatchRunning(true);setBatchProgress({done:0,total:validPosts.length});
    for(let i=0;i<validPosts.length;i++){
      await runAnalyze(validPosts[i],i);
      setBatchProgress(p=>({...p,done:i+1}));
      await new Promise(r=>setTimeout(r,400));
    }
    setBatchRunning(false);
  };

  const RC={"낮음":"#3fb950","보통":"#ffa657","높음":"#ff7b72","매우높음":"#f85149"};
  const RB={"낮음":"#0d2019","보통":"#2d1e0a","높음":"#2d1117","매우높음":"#2d0b0b"};
  const SC={"노출":"#3fb950","누락":"#f85149"};
  const rankColor=r=>r==null?"#484f58":r<=3?"#3fb950":r<=10?"#58a6ff":r<=20?"#ffa657":"#ff7b72";
  const totalPages=posts?(posts.serverPaged?(posts.totalPages||1):Math.ceil(posts.all.length/PER_PAGE)):0;

  return <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>

    {/* ── 모드 탭 ── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:"#0d1117",borderRadius:"10px",border:"1px solid #21262d",overflow:"hidden"}}>
      {[["blogId","📋 방법1 · 블로그 ID"],["url","🔗 방법2 · URL 직접 입력"],["excel","📊 방법3 · 엑셀 업로드"]].map(([id,lbl])=>(
        <button key={id} data-mode-url={id==="url"?"true":undefined} onClick={()=>{setMode(id);setPosts(null);setAnalysis({});setExpanded(null);setFeedError("");setExtraResults({});setExtraKw({});}} style={{
          padding:"13px 8px",border:"none",background:mode===id?"#161b22":"transparent",
          color:mode===id?"#e6edf3":"#8b949e",cursor:"pointer",
          fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:mode===id?700:400,
          borderBottom:mode===id?"2px solid #1f6feb":"2px solid transparent",transition:"all .15s"}}>
          {lbl}
        </button>
      ))}
    </div>

    {/* ── 방법1: 블로그 ID ── */}
    {mode==="blogId"&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px",display:"flex",flexDirection:"column",gap:"12px"}}>
      <div>
        <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:700,marginBottom:"4px"}}>블로그 아이디 입력</div>
        <div style={{color:"#484f58",fontSize:"11px",marginBottom:"10px"}}>blog.naver.com/<strong style={{color:"#8b949e"}}>아이디</strong> 에서 아이디 부분만 입력</div>
        <div style={{display:"flex",gap:"8px"}}>
          <div style={{position:"relative",flex:1}}>
            <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#484f58",fontSize:"12px",pointerEvents:"none",whiteSpace:"nowrap"}}>blog.naver.com/</span>
            <input value={blogId} onChange={e=>setBlogId(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!loadingFeed&&fetchByBlogId()}
              placeholder="아이디"
              style={{width:"100%",boxSizing:"border-box",padding:"12px 12px 12px 138px",background:"#0d1117",
                border:"1px solid #30363d",borderRadius:"8px",color:"#e6edf3",
                fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
          </div>
          <button onClick={fetchByBlogId} disabled={loadingFeed||!blogId.trim()}
            style={{padding:"12px 20px",background:blogId.trim()&&!loadingFeed?"#1f6feb":"#21262d",
              color:blogId.trim()&&!loadingFeed?"#fff":"#484f58",border:"none",borderRadius:"8px",
              cursor:blogId.trim()&&!loadingFeed?"pointer":"not-allowed",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",fontWeight:700,whiteSpace:"nowrap"}}>
            {loadingFeed?"⏳ 불러오는 중...":"🔍 확인"}
          </button>
        </div>
      </div>

      {loadingFeed&&<div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
        {["블로그 글 목록 연결 중...",`${posts?.serverPaged?`${page}페이지`:"1페이지"} 게시글 10개 불러오는 중...`,"목록 구성 중..."].map((m,i)=>(
          <div key={i} style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:"7px",padding:"8px 12px",
            color:"#8b949e",fontSize:"12px",animation:`pulse 1.6s ease ${i*0.3}s infinite`,display:"flex",gap:"8px"}}>
            ⏳ {m}
          </div>
        ))}
      </div>}

      {feedError&&<div style={{background:"#2d1117",border:"1px solid #da3633",borderRadius:"8px",padding:"12px 14px",
        color:"#ff7b72",fontSize:"13px",display:"flex",gap:"8px",alignItems:"flex-start"}}>
        <span style={{flexShrink:0}}>⚠️</span><span>{feedError}</span>
      </div>}

      <div style={{background:"#0d1117",border:"1px solid #1f6feb22",borderRadius:"8px",padding:"10px 13px",fontSize:"11px",color:"#484f58",lineHeight:"1.7"}}>
        💡 게시글을 <strong style={{color:"#8b949e"}}>10개씩</strong> 불러와 누락여부 · 상위노출 키워드를 분석합니다.
        목록 아래 <strong style={{color:"#8b949e"}}>페이지 버튼</strong>으로 과거 글까지 계속 넘겨서 확인할 수 있어요.
      </div>
    </div>}

    {/* ── 방법2: URL + 제목 + 본문 직접 입력 ── */}
    {mode==="url"&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px",display:"flex",flexDirection:"column",gap:"12px"}}>
      <div>
        <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:700,marginBottom:"4px"}}>게시글 정보 입력</div>
        <div style={{color:"#484f58",fontSize:"11px",marginBottom:"12px"}}>특정 글 1개만 확인할 때 · 제목+본문을 직접 붙여넣으면 가장 정확한 분석이 됩니다</div>

        {/* URL */}
        <div style={{marginBottom:"8px"}}>
          <div style={{color:"#8b949e",fontSize:"11px",fontWeight:600,marginBottom:"5px"}}>📎 게시글 URL</div>
          <input value={singleUrl} onChange={e=>setSingleUrl(e.target.value)}
            placeholder="https://blog.naver.com/아이디/포스트번호"
            style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",background:"#0d1117",
              border:"1px solid #30363d",borderRadius:"8px",color:"#e6edf3",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
        </div>

        {/* 제목 */}
        <div style={{marginBottom:"8px"}}>
          <div style={{color:"#8b949e",fontSize:"11px",fontWeight:600,marginBottom:"5px"}}>✏️ 글 제목 <span style={{color:"#ff7b72"}}>*필수</span></div>
          <input value={singleTitle} onChange={e=>setSingleTitle(e.target.value)}
            placeholder="블로그 글 제목을 그대로 붙여넣으세요"
            style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",background:"#0d1117",
              border:"1px solid #30363d",borderRadius:"8px",color:"#e6edf3",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
        </div>

        {/* 본문 */}
        <div style={{marginBottom:"12px"}}>
          <div style={{color:"#8b949e",fontSize:"11px",fontWeight:600,marginBottom:"5px"}}>📄 본문 내용 <span style={{color:"#484f58"}}>(선택 · 있으면 더 정확)</span></div>
          <textarea value={singleBody} onChange={e=>setSingleBody(e.target.value)}
            placeholder="본문 텍스트를 붙여넣으세요 (일부만 있어도 됩니다)"
            rows={4}
            style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",background:"#0d1117",
              border:"1px solid #30363d",borderRadius:"8px",color:"#e6edf3",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",outline:"none",resize:"vertical",lineHeight:"1.6"}}
            onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
        </div>

        <button onClick={analyzeManual} disabled={!singleUrl.trim()||!singleTitle.trim()}
          style={{width:"100%",padding:"13px",
            background:singleUrl.trim()&&singleTitle.trim()?"#1f6feb":"#21262d",
            color:singleUrl.trim()&&singleTitle.trim()?"#fff":"#484f58",
            border:"none",borderRadius:"8px",cursor:singleUrl.trim()&&singleTitle.trim()?"pointer":"not-allowed",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",fontWeight:700}}>
          🔍 누락 확인 · 키워드 분석 시작
        </button>
      </div>
    </div>}

    {/* ── 방법3: 엑셀 업로드 ── */}
    {mode==="excel"&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px",display:"flex",flexDirection:"column",gap:"14px"}}>
      <div>
        <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:700,marginBottom:"4px"}}>엑셀 / CSV 파일 업로드</div>
        <div style={{color:"#484f58",fontSize:"11px",marginBottom:"12px"}}>
          첫 번째 행은 헤더 · URL 컬럼 + 제목 컬럼이 있으면 더 정확합니다 · .xlsx .xls .csv 지원
        </div>
        {/* 파일 드롭존 */}
        <div
          onClick={()=>excelFileRef.current?.click()}
          onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#1f6feb";}}
          onDragLeave={e=>{e.currentTarget.style.borderColor="#30363d";}}
          onDrop={e=>{
            e.preventDefault();
            e.currentTarget.style.borderColor="#30363d";
            const f=e.dataTransfer.files[0];
            if(f) parseExcelFile(f);
          }}
          style={{border:"2px dashed #30363d",borderRadius:"10px",padding:"28px 16px",
            textAlign:"center",cursor:"pointer",transition:"border-color .2s",background:"#0d1117"}}>
          <div style={{fontSize:"28px",marginBottom:"8px"}}>📂</div>
          <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:600,marginBottom:"4px"}}>파일을 여기에 드래그하거나 클릭해서 선택</div>
          <div style={{color:"#484f58",fontSize:"11px"}}>.xlsx · .xls · .csv 파일 지원</div>
          <input ref={excelFileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}}
            onChange={e=>{const f=e.target.files?.[0];if(f) parseExcelFile(f);e.target.value="";}}/>
        </div>
      </div>

      {/* 파싱 오류 */}
      {excelError&&<div style={{background:"#2d1117",border:"1px solid #da3633",borderRadius:"8px",padding:"12px 14px",
        color:"#ff7b72",fontSize:"13px",whiteSpace:"pre-wrap",display:"flex",gap:"8px"}}>
        <span>⚠️</span><span>{excelError}</span>
      </div>}

      {/* 파싱 완료 — 컬럼 매핑 */}
      {excelParsed&&<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        <div style={{background:"#0d1117",border:"1px solid #1f6feb33",borderRadius:"8px",padding:"10px 14px",fontSize:"11px",color:"#58a6ff"}}>
          ✅ {excelRows.length}개 행 파싱 완료 · 헤더: {excelHeaders.join(", ")}
        </div>

        <div>
          <div style={{color:"#8b949e",fontSize:"11px",fontWeight:600,marginBottom:"5px"}}>
            📎 URL 컬럼 선택 <span style={{color:"#ff7b72"}}>*필수</span>
          </div>
          <select value={urlCol} onChange={e=>setUrlCol(e.target.value)}
            style={{width:"100%",padding:"10px 12px",background:"#0d1117",border:"1px solid #30363d",
              borderRadius:"8px",color:"#e6edf3",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",outline:"none",cursor:"pointer"}}>
            <option value="">— URL이 있는 열을 선택하세요 —</option>
            {excelHeaders.map((h,i)=><option key={i} value={h}>{h||`(열 ${i+1})`}</option>)}
          </select>
        </div>

        <div>
          <div style={{color:"#8b949e",fontSize:"11px",fontWeight:600,marginBottom:"5px"}}>
            ✏️ 제목 컬럼 선택 <span style={{color:"#484f58"}}>(선택 · 없으면 AI가 본문에서 키워드 추출)</span>
          </div>
          <select value={titleCol} onChange={e=>setTitleCol(e.target.value)}
            style={{width:"100%",padding:"10px 12px",background:"#0d1117",border:"1px solid #30363d",
              borderRadius:"8px",color:"#e6edf3",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",outline:"none",cursor:"pointer"}}>
            <option value="">— 제목 열 없음 —</option>
            {excelHeaders.map((h,i)=><option key={i} value={h}>{h||`(열 ${i+1})`}</option>)}
          </select>
        </div>

        {urlCol&&(()=>{
          const uIdx=excelHeaders.indexOf(urlCol);
          const tIdx=titleCol?excelHeaders.indexOf(titleCol):-1;
          const preview=excelRows.slice(0,5);
          const validCount=excelRows.filter(r=>{const u=String(r[uIdx]||"");return/blog\.naver\.com\/[^/\s?#]+\/\d+/.test(u);}).length;
          return(
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              <div style={{color:"#8b949e",fontSize:"11px",fontWeight:600}}>
                📋 미리보기 (상위 5개) · 유효한 네이버 블로그 URL: <span style={{color:"#3fb950"}}>{validCount}개</span> / 전체 {excelRows.length}개
              </div>
              {preview.map((row,i)=>{
                const url=String(row[uIdx]||"").trim();
                const title=tIdx>=0?String(row[tIdx]||"").trim():"";
                const ok=/blog\.naver\.com\/[^/\s?#]+\/\d+/.test(url);
                return<div key={i} style={{background:"#0d1117",border:`1px solid ${ok?"#1f6feb33":"#da363333"}`,
                  borderRadius:"7px",padding:"8px 12px",display:"flex",gap:"8px",alignItems:"flex-start"}}>
                  <span style={{color:ok?"#3fb950":"#ff7b72",fontSize:"12px",flexShrink:0,paddingTop:"1px"}}>{ok?"✅":"❌"}</span>
                  <div style={{flex:1,minWidth:0}}>
                    {title&&<div style={{color:"#c9d1d9",fontSize:"11px",fontWeight:600,marginBottom:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>}
                    <div style={{color:ok?"#58a6ff":"#484f58",fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{url||"(URL 없음)"}</div>
                  </div>
                </div>;
              })}
            </div>
          );
        })()}

        {batchRunning&&<div style={{background:"#0d1117",border:"1px solid #1f6feb33",borderRadius:"8px",padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
            <div style={{color:"#58a6ff",fontSize:"12px",fontWeight:700}}>⚡ 배치 분석 진행 중...</div>
            <div style={{marginLeft:"auto",color:"#8b949e",fontSize:"11px"}}>{batchProgress.done} / {batchProgress.total}</div>
          </div>
          <div style={{height:"6px",background:"#21262d",borderRadius:"3px",overflow:"hidden"}}>
            <div style={{height:"100%",background:"#1f6feb",borderRadius:"3px",
              width:`${batchProgress.total>0?(batchProgress.done/batchProgress.total*100):0}%`,transition:"width .3s ease"}}/>
          </div>
        </div>}

        {!batchRunning&&<button onClick={runBatchAnalysis} disabled={!urlCol}
          style={{width:"100%",padding:"13px",background:urlCol?"#1f6feb":"#21262d",
            color:urlCol?"#fff":"#484f58",border:"none",borderRadius:"8px",cursor:urlCol?"pointer":"not-allowed",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",fontWeight:700}}>
          📊 {excelRows.length}개 URL 배치 분석 시작
        </button>}
      </div>}

      {!excelParsed&&!excelError&&<div style={{background:"#0d1117",border:"1px solid #1f6feb22",borderRadius:"8px",padding:"10px 13px",fontSize:"11px",color:"#484f58",lineHeight:"1.8"}}>
        💡 엑셀 형식 예시 (첫 행 헤더):<br/>
        <span style={{color:"#8b949e"}}>| URL | 제목 |</span><br/>
        <span style={{color:"#8b949e"}}>| https://blog.naver.com/abc/123 | 글 제목 |</span><br/>
        · URL만 있어도 분석 가능 · xlsx 없을 경우 CSV(.csv)로 저장해서 올려주세요
      </div>}
    </div>}

    {/* ── 게시글 목록 ── */}
    {posts&&<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
        <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:600}}>
          총 <span style={{color:"#58a6ff"}}>{posts.total}개</span>
          {posts.blogId&&<span style={{color:"#8b949e",marginLeft:"6px"}}>· @{posts.blogId}</span>}
          {totalPages>1&&<span style={{color:"#484f58",fontSize:"12px",marginLeft:"6px"}}>{page}/{totalPages}p</span>}
          {posts.serverPaged&&loadingFeed&&<span style={{color:"#58a6ff",fontSize:"12px",marginLeft:"6px"}}>⏳ 페이지 불러오는 중...</span>}
          {posts.notice&&<span style={{color:"#ffa657",fontSize:"11px",marginLeft:"6px"}}>· {posts.notice}</span>}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:"6px"}}>
          {posts.current.some(p=>!analysis[p.postNo])&&analyzing===-1&&
            <button onClick={analyzeAll} style={{padding:"6px 14px",background:"#1f6feb",color:"#fff",border:"none",
              borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif"}}>
              ⚡ 전체 분석
            </button>}
          <button onClick={()=>{setPosts(null);setAnalysis({});setExpanded(null);setExtraResults({});setExtraKw({});}}
            style={{padding:"6px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
              borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontFamily:"'Noto Sans KR',sans-serif"}}>
            🗑️ 초기화
          </button>
        </div>
      </div>

      {posts.current.map((post,idx)=>{
        const a=analysis[post.postNo];
        const isAn=analyzing===idx;
        return <div key={post.postNo} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",overflow:"hidden"}}>
          <div style={{padding:"13px 16px",display:"flex",alignItems:"flex-start",gap:"10px"}}>
            <div style={{color:"#484f58",fontSize:"11px",fontWeight:700,minWidth:"20px",paddingTop:"3px",flexShrink:0,textAlign:"right"}}>
              {(page-1)*PER_PAGE+idx+1}
            </div>
            <div style={{flex:1,minWidth:0}}>
              {/* 제목 — 클릭 시 네이버 검색결과로 이동 */}
              <div style={{marginBottom:"5px",display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}>
                <a href={`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(post.title)}`}
                    target="_blank" rel="noreferrer"
                    style={{color:"#e6edf3",fontSize:"14px",fontWeight:600,textDecoration:"none",lineHeight:"1.5",flex:1,minWidth:"160px",wordBreak:"break-word"}}
                    title="클릭 시 네이버에서 이 제목으로 검색한 결과를 확인합니다"
                    onMouseEnter={e=>e.target.style.color="#58a6ff"} onMouseLeave={e=>e.target.style.color="#e6edf3"}>
                    {post.title}
                  </a>
                {post.date&&<span style={{color:"#484f58",fontSize:"11px",flexShrink:0,paddingTop:"2px"}}>{post.date}</span>}
                {/* 추가검색 — 원하는 키워드 직접 입력 */}
                <div style={{display:"flex",gap:"4px",alignItems:"center",flexShrink:0}}>
                  <input
                    value={extraKw[post.postNo]||""}
                    onChange={e=>setExtraKw(p=>({...p,[post.postNo]:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter")runExtraKeyword(post);}}
                    placeholder="키워드 직접 확인"
                    style={{width:"124px",boxSizing:"border-box",padding:"5px 9px",background:"#0d1117",
                      border:"1px solid #30363d",borderRadius:"6px",color:"#e6edf3",
                      fontFamily:"'Noto Sans KR',sans-serif",fontSize:"11px",outline:"none"}}
                    onFocus={e=>e.target.style.borderColor="#d29922"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
                  <button onClick={()=>runExtraKeyword(post)}
                    disabled={!(extraKw[post.postNo]||"").trim()||!!extraLoading[post.postNo]}
                    title="이 글이 입력한 키워드로 몇 위에 있는지 확인합니다"
                    style={{padding:"5px 10px",
                      background:(extraKw[post.postNo]||"").trim()&&!extraLoading[post.postNo]?"#d2992222":"#21262d",
                      color:(extraKw[post.postNo]||"").trim()&&!extraLoading[post.postNo]?"#e3b341":"#484f58",
                      border:`1px solid ${(extraKw[post.postNo]||"").trim()&&!extraLoading[post.postNo]?"#d2992255":"#30363d"}`,
                      borderRadius:"6px",
                      cursor:(extraKw[post.postNo]||"").trim()&&!extraLoading[post.postNo]?"pointer":"not-allowed",
                      fontSize:"11px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>
                    {extraLoading[post.postNo]?"조회 중...":"➕ 추가검색"}
                  </button>
                </div>
              </div>
              {/* 설명 */}
              {post.description&&!a&&<div style={{color:"#484f58",fontSize:"12px",marginBottom:"5px",lineHeight:"1.5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.description}</div>}
              {/* 뱃지 */}
              {a&&!a.error&&<div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"8px"}}>
                <span style={{
                  background:a.missingStatus==="노출"?"#2ea04322":"#f8514922",
                  color:a.missingStatus==="노출"?"#3fb950":"#f85149",
                  border:`1px solid ${a.missingStatus==="노출"?"#2ea04344":"#f8514944"}`,
                  borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700
                }}>
                  {a.missingStatus==="노출"?"✅ 노출":"🚨 누락"}
                </span>
              </div>}
              {/* 분석 중 */}
              {isAn&&<div style={{display:"flex",flexDirection:"column",gap:"3px",marginTop:"4px"}}>
                {["🤖 AI 키워드 분석 중...","🔍 제목으로 네이버 실제 검색 중...","📊 키워드 블로그탭 순위 조회 중..."].map((msg,i)=>(
                  <div key={i} style={{color:"#8b949e",fontSize:"11px",animation:`pulse 1.6s ease ${i*0.4}s infinite`}}>{msg}</div>
                ))}
              </div>}
              {a?.error&&<div style={{color:"#ff7b72",fontSize:"12px",marginTop:"3px"}}>⚠️ 분석 실패: {a.errorMsg||"알 수 없는 오류"}. 재시도 버튼을 눌러주세요.</div>}

              {/* 키워드 순위 — 분석 완료 시 바로 표시 */}
              {a&&!a.error&&a.topKeywords&&(
                <div style={{marginTop:"4px"}}>
                  {/* 로딩 중 */}
                  {a.topKeywords.some(kw=>kw.rankLoading)&&(
                    <div style={{color:"#8b949e",fontSize:"11px",padding:"4px 0"}}>⏳ 키워드 순위 조회 중...</div>
                  )}
                  {/* 완료 후 — 노출된 것만 표시 */}

                  {!a.topKeywords.some(kw=>kw.rankLoading)&&(()=>{
                    const ranked=a.topKeywords.filter(kw=>kw.realRank?.myRank!=null);
                    const outOf=a.topKeywords.filter(kw=>!kw.realRank||kw.realRank.myRank==null);

                    const AREA_LABELS=[
                      {key:"main_search",label:"통합검색"},
                      {key:"blog",label:"블로그탭"},
                    ];

                    return <>
                      {ranked.map((kw,i)=>{
                        const areas=kw.realRank?.areas;
                        const mainRank=kw.realRank?.myRank??null;
                        const rc=rankColor(mainRank);
                        return <div key={i} style={{padding:"7px 10px",
                          background:"#0d1117",border:`1px solid ${rc+"44"}`,
                          borderRadius:"8px",marginBottom:"5px"}}>
                          <a href={`https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(kw.keyword)}`}
                            target="_blank" rel="noreferrer"
                            style={{color:"#c9d1d9",fontSize:"12px",fontWeight:600,textDecoration:"none"}}
                            onMouseEnter={e=>e.target.style.color="#58a6ff"} onMouseLeave={e=>e.target.style.color="#c9d1d9"}>
                            {kw.keyword} ↗
                          </a>
                          <div style={{display:"flex",gap:"6px",marginTop:"5px",flexWrap:"wrap"}}>
                            {areas ? AREA_LABELS.map(({key,label})=>{
                              const area=areas[key];
                              const r=area?.rank??null;
                              const ac=rankColor(r);
                              return <div key={key} style={{
                                background: r!=null ? ac+"22" : "#161b22",
                                color: r!=null ? ac : "#484f58",
                                border:`1px solid ${r!=null?ac+"55":"#30363d"}`,
                                borderRadius:"6px",padding:"3px 8px",fontSize:"11px",
                                display:"flex",alignItems:"center",gap:"4px"}}>
                                <span style={{opacity:0.8}}>{label}</span>
                                <span style={{fontWeight:800}}>{r!=null?`${r}위`:"—"}</span>
                              </div>;
                            }) : (
                              <span style={{fontSize:"11px",color:"#484f58"}}>
                                {rankColor(mainRank)&&kw.realRank?.rankSource==="sim"||kw.realRank?.rankSource==="date"
                                  ? `API 기준 ${mainRank}위 (영역 확인 불가)`
                                  : "영역 데이터 없음"}
                                {kw.realRank?.proxyError && (
                                  <span style={{color:"#ff7b72",marginLeft:"6px"}}>
                                    [프록시: {kw.realRank.proxyError}]
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>;
                      })}
                      {outOf.length>0&&<div style={{padding:"5px 10px",fontSize:"11px",color:"#484f58",lineHeight:"1.6"}}>
                        <span style={{color:"#30363d",marginRight:"6px"}}>100위↓</span>
                        {outOf.map((kw,i)=>(
                          <span key={i}>
                            <a href={`https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(kw.keyword)}`}
                              target="_blank" rel="noreferrer"
                              style={{color:"#484f58",textDecoration:"none",fontSize:"11px"}}
                              onMouseEnter={e=>e.target.style.color="#8b949e"} onMouseLeave={e=>e.target.style.color="#484f58"}>
                              {kw.keyword}
                            </a>
                            {i<outOf.length-1&&<span style={{margin:"0 4px",color:"#21262d"}}>·</span>}
                          </span>
                        ))}
                      </div>}
                    </>;
                  })()}
                </div>
              )}

              {/* ── 추가 분석 — 직접 입력한 키워드 순위 ── */}
              {(extraResults[post.postNo]||[]).length>0&&(
                <div style={{marginTop:"8px",paddingTop:"8px",borderTop:"1px dashed #30363d"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
                    <span style={{color:"#e3b341",fontSize:"11px",fontWeight:700}}>➕ 추가 분석</span>
                    <span style={{color:"#484f58",fontSize:"10px"}}>
                      직접 입력한 키워드 {(extraResults[post.postNo]||[]).length}개
                    </span>
                    <button onClick={()=>setExtraResults(p=>({...p,[post.postNo]:[]}))}
                      style={{marginLeft:"auto",padding:"2px 8px",background:"transparent",color:"#484f58",
                        border:"1px solid #30363d",borderRadius:"5px",cursor:"pointer",fontSize:"10px",
                        fontFamily:"'Noto Sans KR',sans-serif"}}>전체 지우기</button>
                  </div>

                  {(extraResults[post.postNo]||[]).map((kw,i)=>{
                    const areas=kw.realRank?.areas;
                    const mainRank=kw.realRank?.myRank??null;
                    const rc=rankColor(mainRank);
                    const AREA_LABELS=[
                      {key:"main_search",label:"통합검색"},
                      {key:"blog",label:"블로그탭"},
                    ];
                    return <div key={i} style={{padding:"7px 10px",background:"#0d1117",
                      border:`1px solid ${kw.loading?"#30363d":(mainRank!=null?rc+"44":"#30363d")}`,
                      borderRadius:"8px",marginBottom:"5px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                        <a href={`https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(kw.keyword)}`}
                          target="_blank" rel="noreferrer"
                          style={{color:"#c9d1d9",fontSize:"12px",fontWeight:600,textDecoration:"none",wordBreak:"break-word"}}
                          onMouseEnter={e=>e.target.style.color="#58a6ff"} onMouseLeave={e=>e.target.style.color="#c9d1d9"}>
                          {kw.keyword} ↗
                        </a>
                        <button onClick={()=>removeExtraKeyword(post.postNo,kw.keyword)}
                          title="이 키워드 결과 삭제"
                          style={{marginLeft:"auto",padding:"0 5px",background:"transparent",color:"#484f58",
                            border:"none",cursor:"pointer",fontSize:"13px",lineHeight:1}}>×</button>
                      </div>

                      {kw.loading
                        ? <div style={{color:"#8b949e",fontSize:"11px",marginTop:"5px",animation:"pulse 1.6s ease infinite"}}>
                            ⏳ 네이버 순위 조회 중...
                          </div>
                        : <div style={{display:"flex",gap:"6px",marginTop:"5px",flexWrap:"wrap",alignItems:"center"}}>
                            {areas ? AREA_LABELS.map(({key,label})=>{
                              const area=areas[key];
                              const r=area?.rank??null;
                              const ac=rankColor(r);
                              return <div key={key} style={{
                                background: r!=null ? ac+"22" : "#161b22",
                                color: r!=null ? ac : "#484f58",
                                border:`1px solid ${r!=null?ac+"55":"#30363d"}`,
                                borderRadius:"6px",padding:"3px 8px",fontSize:"11px",
                                display:"flex",alignItems:"center",gap:"4px"}}>
                                <span style={{opacity:0.8}}>{label}</span>
                                <span style={{fontWeight:800}}>{r!=null?`${r}위`:"—"}</span>
                              </div>;
                            }) : (
                              <span style={{fontSize:"11px",color:"#484f58"}}>
                                {mainRank!=null
                                  ? `API 기준 ${mainRank}위 (영역 확인 불가)`
                                  : "100위 밖 · 미노출"}
                                {kw.realRank?.proxyError && (
                                  <span style={{color:"#ff7b72",marginLeft:"6px"}}>
                                    [프록시: {kw.realRank.proxyError}]
                                  </span>
                                )}
                              </span>
                            )}
                            {areas&&mainRank==null&&
                              <span style={{fontSize:"11px",color:"#484f58"}}>100위 밖 · 미노출</span>}
                          </div>}
                    </div>;
                  })}
                </div>
              )}
            </div>
            {/* 버튼 — 분석/재시도만 */}
            <div style={{display:"flex",flexDirection:"column",gap:"5px",flexShrink:0}}>
              {!a&&!isAn&&<button onClick={()=>runAnalyze(post,idx)}
                style={{padding:"6px 12px",background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",
                  borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:600,
                  fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>🔍 분석</button>}
              {a?.error&&<button onClick={()=>{setAnalysis(p=>{const n={...p};delete n[post.postNo];return n;});runAnalyze(post,idx);}}
                style={{padding:"6px 12px",background:"#da363322",color:"#ff7b72",border:"1px solid #da363344",
                  borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:600,
                  fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>🔄 재시도</button>}
            </div>
          </div>
        </div>;
      })}

      {/* 페이지네이션 */}
      {totalPages>1&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",paddingTop:"4px",flexWrap:"wrap"}}>
        <button onClick={()=>goPage(1)} disabled={page<=1} style={{padding:"6px 10px",background:page<=1?"#0d1117":"#161b22",color:page<=1?"#484f58":"#8b949e",border:"1px solid #30363d",borderRadius:"6px",cursor:page<=1?"not-allowed":"pointer",fontSize:"12px"}}>«</button>
        <button onClick={()=>goPage(page-1)} disabled={page<=1} style={{padding:"6px 12px",background:page<=1?"#0d1117":"#161b22",color:page<=1?"#484f58":"#8b949e",border:"1px solid #30363d",borderRadius:"6px",cursor:page<=1?"not-allowed":"pointer",fontSize:"12px",fontFamily:"'Noto Sans KR',sans-serif"}}>← 이전</button>
        {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
          const pg=totalPages<=7?i+1:page<=4?i+1:page>=totalPages-3?totalPages-6+i:page-3+i;
          return <button key={pg} onClick={()=>goPage(pg)} style={{padding:"6px 11px",background:pg===page?"#1f6feb":"#161b22",color:pg===page?"#fff":"#8b949e",border:`1px solid ${pg===page?"#1f6feb":"#30363d"}`,borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontWeight:pg===page?700:400,minWidth:"32px",fontFamily:"'Noto Sans KR',sans-serif"}}>{pg}</button>;
        })}
        <button onClick={()=>goPage(page+1)} disabled={page>=totalPages} style={{padding:"6px 12px",background:page>=totalPages?"#0d1117":"#161b22",color:page>=totalPages?"#484f58":"#8b949e",border:"1px solid #30363d",borderRadius:"6px",cursor:page>=totalPages?"not-allowed":"pointer",fontSize:"12px",fontFamily:"'Noto Sans KR',sans-serif"}}>다음 →</button>
        <button onClick={()=>goPage(totalPages)} disabled={page>=totalPages} style={{padding:"6px 10px",background:page>=totalPages?"#0d1117":"#161b22",color:page>=totalPages?"#484f58":"#8b949e",border:"1px solid #30363d",borderRadius:"6px",cursor:page>=totalPages?"not-allowed":"pointer",fontSize:"12px"}}>»</button>
      </div>}

    </div>}
  </div>;
}


const EMOJI_CATEGORIES = [
  { id:"face", label:"😀 표정·사람", emojis:"😀 😃 😄 😁 😆 😅 🤣 😂 🙂 😉 😊 😇 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲 😏 😋 😛 😜 🤪 😝 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤤 🤠 🥳 🥸 😎 🤓 🧐 🙃 🫠 🤐 🤨 😐 😑 😶 🫥 😒 🙄 😬 🤥 🫨 😌 😔 😪 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🥱 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 😤 😡 😠 🤬 👿 😈 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾 🙈 🙉 🙊 👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 🫷 🫸 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👅 👄 🫦 👶 🧒 👦 👧 🧑 👨 👩 👴 👵 🧓 🧏 🧑‍⚕️ 🧑‍🎓 🧑‍🏫 🧑‍⚖️ 🧑‍🌾 🧑‍🍳 🧑‍🔧 🧑‍🏭 🧑‍💼 🧑‍🔬 🧑‍💻 🧑‍🎤 🧑‍🎨 🧑‍✈️ 🧑‍🚀 🧑‍🚒 👮 🕵️ 💂 🥷 👷 🤴 👸 🤵 👰 🎅 🤶 🦸 🦹 🧙 🧚 🧛 🧜 🧝 🧞 🧟 🧌 💏 💑 👨‍👩‍👦 👨‍👩‍👧 👨‍👦 👩‍👦 👨‍👧 👩‍👧 🗣️ 👤 👥" },
  { id:"animal", label:"🐹 동물·자연", emojis:"🐵 🐒 🦍 🦧 🐶 🐕 🦮 🐕‍🦺 🐩 🐺 🦊 🦝 🐱 🐈 🐈‍⬛ 🦁 🐯 🐅 🐆 🐴 🫎 🫏 🐎 🦄 🦓 🦌 🦬 🐮 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏 🦛 🐭 🐁 🐀 🐹 🐰 🐇 🐿️ 🦫 🦔 🦇 🐻 🐻‍❄️ 🐨 🐼 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐦‍🔥 🪹 🪺 🐸 🐊 🐢 🦎 🐍 🐲 🐉 🦕 🦖 🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🪸 🪼 🦀 🦞 🦐 🦑 🦪 🐌 🦋 🐛 🐜 🐝 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂 🦟 🪰 🪱 🦠 💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌲 🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🍄 🪨 🪵 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 ☀️ 🌝 🌞 🪐 ⭐ 🌟 🌠 🌌 ☁️ ⛅ ⛈️ 🌤️ 🌥️ 🌦️ 🌧️ 🌨️ 🌩️ 🌪️ 🌫️ 🌬️ 🌀 🌈 🌂 ☂️ ☔ ⛱️ ⚡ ❄️ ☃️ ⛄ ☄️ 🔥 💧 🌊" },
  { id:"food", label:"🍔 음식·음료", emojis:"🍇 🍈 🍉 🍊 🍋 🍌 🍍 🥭 🍎 🍏 🍐 🍑 🍒 🍓 🫐 🥝 🍅 🫒 🥥 🥑 🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🥜 🫘 🌰 🫚 🫛 🍞 🥐 🥖 🫓 🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥚 🍳 🥘 🍲 🫕 🥣 🥗 🍿 🧈 🧂 🥫 🍝 🍱 🍘 🍙 🍚 🍛 🍜 🍠 🍢 🍣 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🫖 🍵 🍶 🍾 🍷 🍸 🍹 🍺 🍻 🥂 🥃 🫗 🥤 🧋 🧃 🧉 🥢 🍽️ 🍴 🥄 🔪 🫙 🏺" },
  { id:"activity", label:"⚽ 활동", emojis:"🎃 🎄 🎆 🎇 🧨 ✨ 🎈 🎉 🎊 🎋 🎍 🎎 🎏 🎐 🎑 🧧 🎁 🎟️ 🎫 🏮 🪔 🎖️ 🏆 🏅 🥇 🥈 🥉 ⚽ ⚾ 🥎 🏀 🏐 🏈 🏉 🎾 🥏 🎳 🏏 🏑 🏒 🥍 🏓 🏸 🥊 🥋 🥅 ⛳ ⛸️ 🎣 🤿 🎽 🎿 🛷 🥌 🎯 🪀 🪁 🎱 🔮 🪄 🎮 🕹️ 🎰 🎲 🧩 🪅 🪩 🪆 ♠️ ♥️ ♦️ ♣️ ♟️ 🃏 🀄 🎴 🎭 🖼️ 🎨 🧵 🪡 🧶 🪢 👓 🕶️ 🥽" },
  { id:"travel", label:"✈️ 여행·장소", emojis:"🌍 🌎 🌏 🌐 🗺️ 🗾 🧭 🏔️ ⛰️ 🌋 🗻 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🧱 🛖 🏘️ 🏚️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🛕 🕍 ⛩️ 🕋 ⛲ ⛺ 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 ♨️ 🎠 🎡 🎢 🎪 💈 🗿 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚝 🚞 🚋 🚌 🚍 🚎 🚐 🚑 🚒 🚓 🚔 🚕 🚖 🚗 🚘 🚙 🛻 🚚 🚛 🚜 🏎️ 🏍️ 🛵 🚲 🛴 🛹 🛼 🚏 🛣️ 🛤️ ⛽ 🛞 🚨 🚥 🚦 🛑 🚧 ⚓ 🛟 ⛵ 🛶 🚤 🛳️ ⛴️ 🛥️ 🚢 ✈️ 🛩️ 🛫 🛬 🪂 💺 🚁 🚀 🛸" },
  { id:"object", label:"💎 사물", emojis:"👗 👘 🥻 🩱 🩲 🩳 👙 👚 👛 👜 👝 🛍️ 🎒 🩴 👞 👟 🥾 🥿 👠 👡 🩰 👢 👑 👒 🎩 🎓 🧢 🪖 ⛑️ 📿 💄 💍 💎 🦯 🔇 🔈 🔉 🔊 📢 📣 📯 🔔 🔕 🎵 🎶 🎙️ 🎚️ 🎛️ 🎤 🎧 📻 🎷 🪗 🎸 🎹 🎺 🎻 🪕 🥁 🪘 🪇 🪈 📱 📲 ☎️ 📞 📟 📠 🔋 🪫 🔌 💻 🖥️ 🖨️ ⌨️ 🖱️ 💽 💾 💿 📀 🎥 🎞️ 📽️ 🎬 📺 📷 📸 📹 📼 📔 📕 📖 📗 📘 📙 📚 📓 📒 📃 📜 📄 📰 🗞️ 📑 🔖 🏷️ ✉️ 📧 📨 📩 📤 📥 📦 📫 📪 📬 📭 📮 🗳️ ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📝 💼 📁 📂 🗂️ 📅 📆 🗒️ 🗓️ 📇 📈 📉 📊 📋 📌 📍 📎 🖇️ 📏 📐 ✂️ 🗃️ 🗄️ 🗑️ ⌛ ⏳ ⌚ ⏰ ⏱️ ⏲️ 🕰️ 💰 🪙 💴 💵 💶 💷 💸 💳 🧾 💹 🧳 🌡️ 🧸 🔍 🔎 🕯️ 💡 🔦 🔒 🔓 🔑 🗝️ 🔨 🪓 ⛏️ ⚒️ 🛠️ 🗡️ ⚔️ 💣 🏹 🛡️ 🔧 🪛 🔩 ⚙️ 🗜️ ⚖️ 🔗 ⛓️ 🪝 🧰 🧲 🪜 ⚗️ 🧪 🧫 🔬 🔭 📡 💉 🩹 🩼 🩺 🩻 🚪 🪞 🪟 🛏️ 🛋️ 🪑 🚽 🪠 🚿 🛁 🪒 🧴 🧷 🧹 🧺 🧻 🪣 🧼 🫧 🪥 🧽 🧯 🛒" },
  { id:"symbol", label:"💚 상징", emojis:"💌 💘 💝 💖 💗 💓 💞 💕 💟 ❣️ 💔 ❤️‍🔥 ❤️‍🩹 ❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💋 💯 💢 💥 💦 💨 🕳️ 💬 🗨️ 🗯️ 💭 💤 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ ◼️ ◻️ ◾ ◽ ▪️ ▫️ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔘 🔳 🔲 🏧 🚮 🚰 ♿ 🚹 🚺 🚻 🚼 🚾 ⚠️ 🚸 ⛔ 🚫 🚳 🚭 🚯 🚱 🚷 📵 🔞 ☢️ ☣️ ⬆️ ↗️ ➡️ ↘️ ⬇️ ↙️ ⬅️ ↖️ ↕️ ↔️ ↩️ ↪️ ⤴️ ⤵️ 🔃 🔄 🔙 🔚 🔛 🔜 🔝 🔀 🔁 🔂 ▶️ ⏩ ⏭️ ⏯️ ◀️ ⏪ ⏮️ 🔼 ⏫ 🔽 ⏬ ⏸️ ⏹️ ⏺️ ⏏️ 🎦 🔅 🔆 📶 🛜 🛐 ✡️ ☸️ ☯️ ✝️ ☦️ ☪️ ☮️ 🕎 🔯 🪯 ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎ ♀️ ♂️ ⚧️ ✖️ ➕ ➖ ➗ 🟰 ♾️ ‼️ ⁉️ ❓ ❔ ❕ ❗ 〰️ 💱 💲 🅰️ 🆎 🅱️ 🆑 🆒 🆓 ℹ️ 🆔 Ⓜ️ 🆕 🆖 🅾️ 🆗 🆘 🆙 🆚 ✅ ☑️ ✔️ ❌ ❎ ➰ ➿ 〽️ ✳️ ✴️ ❇️ ©️ ®️ ™️" },
  { id:"flag", label:"🚩 깃발", emojis:"🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇺🇳 🇰🇷 🇺🇸 🇯🇵 🇨🇳 🇬🇧 🇫🇷 🇩🇪 🇮🇹 🇪🇸 🇷🇺 🇧🇷 🇮🇳 🇦🇺 🇨🇦 🇲🇽 🇰🇵 🇵🇭 🇻🇳 🇹🇭 🇮🇩 🇲🇾 🇸🇬 🇭🇰 🇹🇼 🇸🇦 🇦🇪 🇹🇷 🇪🇬 🇿🇦 🇳🇬 🇦🇷 🇨🇱 🇨🇴 🇵🇪 🇪🇺 🇵🇹 🇳🇱 🇧🇪 🇨🇭 🇦🇹 🇵🇱 🇸🇪 🇳🇴 🇩🇰 🇫🇮 🇬🇷 🇨🇿 🇭🇺 🇷🇴 🇺🇦 🇮🇱 🇮🇷 🇮🇶 🇵🇰 🇧🇩 🇳🇵 🇱🇰 🇲🇲 🇰🇭 🇱🇦 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🏴󠁧󠁢󠁳󠁣󠁴󠁿 🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
];

// ─── TAB: 동영상 압축 (FFmpeg.wasm) ────────────────────────────────────────
// ─── TAB: 동영상 압축 (FFmpeg.wasm) ────────────────────────────────────────
function VideoTab(){
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [status,setStatus]=useState("idle"); // idle|loading|ready|processing|done|error
  const [progress,setProgress]=useState(0);
  const [log,setLog]=useState("");
  const [resultUrl,setResultUrl]=useState(null);
  const [origSize,setOrigSize]=useState(0);
  const [resultSize,setResultSize]=useState(0);
  const [dragOver,setDragOver]=useState(false);
  const [opts,setOpts]=useState({
    crf:"28",         // 압축 품질 (18=고화질, 28=기본, 40=저용량)
    preset:"medium",  // 인코딩 속도
    scale:"original", // 해상도
    fps:"original",   // 프레임
    format:"mp4",     // 출력 포맷
  });
  const ffmpegRef=useRef(null);
  const fileInputRef=useRef(null);

  // FFmpeg.wasm 로드 (0.11.x - crossOriginIsolated 불필요)
  const loadFFmpeg=async()=>{
    if(ffmpegRef.current) return ffmpegRef.current;
    setStatus("loading");
    setLog("FFmpeg 엔진 로딩 중... (최초 1회 약 25MB 다운로드)");
    try{
      await loadScript("https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js");
      const {createFFmpeg,fetchFile:ff_fetchFile}=window.FFmpeg||{};
      if(!createFFmpeg) throw new Error("FFmpeg 스크립트 로드 실패");
      window._ffFetchFile=ff_fetchFile;
      const ff=createFFmpeg({
        log:false,
        logger:({message})=>setLog(message),
        progress:({ratio})=>setProgress(Math.round(ratio*100)),
        corePath:"https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
      });
      await ff.load();
      ffmpegRef.current=ff;
      setStatus("ready");
      setLog("");
      return ff;
    }catch(e){
      setStatus("error");
      setLog("FFmpeg 로드 실패: "+e.message);
      return null;
    }
  };

  const loadScript=(src)=>new Promise((res,rej)=>{
    if(document.querySelector(`script[src="${src}"]`)){res();return;}
    const s=document.createElement("script");
    s.crossOrigin="anonymous";
    s.src=src; s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });

  const onFile=(f)=>{
    if(!f||!f.type.startsWith("video/")) return;
    setFile(f);
    setOrigSize(f.size);
    setResultUrl(null);
    setResultSize(0);
    setProgress(0);
    setLog("");
    setStatus("ready");
    const url=URL.createObjectURL(f);
    setPreview(url);
  };

  const compress=async()=>{
    if(!file) return;
    const ff=await loadFFmpeg();
    if(!ff){return;}
    setStatus("processing");
    setProgress(0);
    setLog("파일 읽는 중...");
    try{
      const fetchFile=window._ffFetchFile||(async(f)=>new Uint8Array(await f.arrayBuffer()));
      const ext=file.name.split(".").pop().toLowerCase();
      const inputName="input."+ext;
      const outputName="output."+opts.format;

      ff.FS("writeFile", inputName, await fetchFile(file));
      setLog("압축 시작...");

      // FFmpeg 명령 구성 (0.11.x: ff.run 사용)
      const args=["-i",inputName];
      // 비디오 코덱
      if(opts.format==="mp4"||opts.format==="mov"){
        args.push("-c:v","libx264","-crf",opts.crf,"-preset",opts.preset);
      } else if(opts.format==="webm"){
        args.push("-c:v","libvpx-vp9","-crf",opts.crf,"-b:v","0");
      }
      // 오디오
      args.push("-c:a","aac","-b:a","128k");
      // 해상도
      if(opts.scale!=="original") args.push("-vf",`scale=${opts.scale}:-2`);
      // FPS
      if(opts.fps!=="original") args.push("-r",opts.fps);
      args.push("-movflags","+faststart",outputName);

      await ff.run(...args);

      const data=ff.FS("readFile", outputName);
      const blob=new Blob([data.buffer],{type:`video/${opts.format}`});
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setStatus("done");
      setLog("압축 완료!");
      setProgress(100);
    }catch(e){
      setStatus("error");
      setLog("오류: "+e.message);
    }
  };

  const fmtSz=n=>{
    if(n===0) return "-";
    if(n>1024*1024*1024) return (n/1024/1024/1024).toFixed(2)+"GB";
    if(n>1024*1024) return (n/1024/1024).toFixed(1)+"MB";
    return (n/1024).toFixed(0)+"KB";
  };
  const saving=resultSize&&origSize?Math.round((1-resultSize/origSize)*100):null;

  const crfOptions=[
    {val:"18",label:"고화질",desc:"파일 큼"},
    {val:"23",label:"표준",desc:"균형"},
    {val:"28",label:"기본",desc:"권장"},
    {val:"35",label:"소용량",desc:"화질 저하"},
    {val:"40",label:"최소화",desc:"파일 최소"},
  ];
  const presetOptions=[
    {val:"ultrafast",label:"초고속"},
    {val:"fast",label:"빠름"},
    {val:"medium",label:"보통"},
    {val:"slow",label:"느림 (고효율)"},
  ];
  const scaleOptions=[
    {val:"original",label:"원본"},
    {val:"1920",label:"1080p"},
    {val:"1280",label:"720p"},
    {val:"854",label:"480p"},
    {val:"640",label:"360p"},
  ];
  const fpsOptions=[
    {val:"original",label:"원본"},
    {val:"30",label:"30fps"},
    {val:"24",label:"24fps"},
    {val:"15",label:"15fps"},
  ];

  const isProcessing=status==="processing"||status==="loading";

  return <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

    {/* 업로드 */}
    {!file&&<div
      onClick={()=>fileInputRef.current?.click()} onTouchEnd={e=>{e.preventDefault();fileInputRef.current?.click();}}
      onDrop={e=>{e.preventDefault();setDragOver(false);onFile(e.dataTransfer.files[0]);}}
      onDragOver={e=>{e.preventDefault();setDragOver(true);}}
      onDragLeave={()=>setDragOver(false)}
      style={{border:`2px dashed ${dragOver?"#58a6ff":"#30363d"}`,borderRadius:"12px",
        padding:"48px 20px",textAlign:"center",cursor:"pointer",
        background:dragOver?"#1f6feb11":"#0d1117",transition:"all .2s"}}>
      <div style={{fontSize:"48px",marginBottom:"12px"}}>🎬</div>
      <div style={{color:"#c9d1d9",fontSize:"16px",fontWeight:700,marginBottom:"6px"}}>동영상을 드래그하거나 클릭하여 업로드</div>
      <div style={{color:"#484f58",fontSize:"13px"}}>MP4, MOV, AVI, WEBM, MKV 등 모든 형식</div>
      <input ref={fileInputRef} type="file" accept="video/*" style={{display:"none"}}
        onChange={e=>onFile(e.target.files[0])}/>
    </div>}

    {file&&<div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:"14px",alignItems:"start"}}>

      {/* ─ 왼쪽: 옵션 ─ */}
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

        {/* 파일 정보 */}
        <div style={{background:"#161b22",borderRadius:"10px",padding:"12px 14px",border:"1px solid #30363d"}}>
          <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:600,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:"4px"}}>
            🎬 {file.name}
          </div>
          <div style={{color:"#484f58",fontSize:"11px"}}>{fmtSz(origSize)}</div>
        </div>

        {/* 압축 품질 */}
        <div style={{background:"#161b22",borderRadius:"10px",padding:"14px",border:"1px solid #30363d"}}>
          <div style={{fontSize:"11px",color:"#8b949e",fontWeight:700,marginBottom:"8px"}}>🎯 압축 품질 (CRF)</div>
          <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
            {crfOptions.map(o=>(
              <button key={o.val} onClick={()=>setOpts(p=>({...p,crf:o.val}))}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 12px",borderRadius:"6px",border:`1px solid ${opts.crf===o.val?"#58a6ff":"#30363d"}`,
                  background:opts.crf===o.val?"#1f6feb22":"transparent",
                  color:opts.crf===o.val?"#58a6ff":"#8b949e",
                  cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",textAlign:"left"}}>
                <span style={{fontWeight:opts.crf===o.val?700:400}}>{o.label}</span>
                <span style={{fontSize:"10px",color:"#484f58"}}>{o.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 해상도 */}
        <div style={{background:"#161b22",borderRadius:"10px",padding:"14px",border:"1px solid #30363d"}}>
          <div style={{fontSize:"11px",color:"#8b949e",fontWeight:700,marginBottom:"8px"}}>📐 출력 해상도</div>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {scaleOptions.map(o=>(
              <button key={o.val} onClick={()=>setOpts(p=>({...p,scale:o.val}))}
                style={{padding:"6px 10px",borderRadius:"6px",border:`1px solid ${opts.scale===o.val?"#3fb950":"#30363d"}`,
                  background:opts.scale===o.val?"#3fb95022":"transparent",
                  color:opts.scale===o.val?"#3fb950":"#8b949e",
                  cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"11px",fontWeight:opts.scale===o.val?700:400}}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* FPS + 포맷 */}
        <div style={{background:"#161b22",borderRadius:"10px",padding:"14px",border:"1px solid #30363d",display:"flex",flexDirection:"column",gap:"12px"}}>
          <div>
            <div style={{fontSize:"11px",color:"#8b949e",fontWeight:700,marginBottom:"6px"}}>🎞️ 프레임레이트</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {fpsOptions.map(o=>(
                <button key={o.val} onClick={()=>setOpts(p=>({...p,fps:o.val}))}
                  style={{padding:"5px 10px",borderRadius:"6px",border:`1px solid ${opts.fps===o.val?"#ffa657":"#30363d"}`,
                    background:opts.fps===o.val?"#ffa65722":"transparent",
                    color:opts.fps===o.val?"#ffa657":"#8b949e",
                    cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"11px"}}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:"11px",color:"#8b949e",fontWeight:700,marginBottom:"6px"}}>📦 출력 포맷</div>
            <div style={{display:"flex",gap:"5px"}}>
              {["mp4","webm","mov"].map(f=>(
                <button key={f} onClick={()=>setOpts(p=>({...p,format:f}))}
                  style={{flex:1,padding:"6px",borderRadius:"6px",border:`1px solid ${opts.format===f?"#d2a8ff":"#30363d"}`,
                    background:opts.format===f?"#d2a8ff22":"transparent",
                    color:opts.format===f?"#d2a8ff":"#8b949e",
                    cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:700}}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 속도 */}
        <div style={{background:"#161b22",borderRadius:"10px",padding:"14px",border:"1px solid #30363d"}}>
          <div style={{fontSize:"11px",color:"#8b949e",fontWeight:700,marginBottom:"6px"}}>⚡ 인코딩 속도</div>
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
            {presetOptions.map(o=>(
              <button key={o.val} onClick={()=>setOpts(p=>({...p,preset:o.val}))}
                style={{flex:1,padding:"5px 4px",borderRadius:"6px",border:`1px solid ${opts.preset===o.val?"#79c0ff":"#30363d"}`,
                  background:opts.preset===o.val?"#79c0ff22":"transparent",
                  color:opts.preset===o.val?"#79c0ff":"#8b949e",
                  cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"10px",
                  fontWeight:opts.preset===o.val?700:400}}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 압축 버튼 */}
        <button onClick={compress} disabled={isProcessing}
          style={{padding:"13px",background:isProcessing?"#21262d":"linear-gradient(135deg,#1f6feb,#388bfd)",
            border:"none",borderRadius:"10px",color:isProcessing?"#484f58":"#fff",
            cursor:isProcessing?"not-allowed":"pointer",fontSize:"14px",fontWeight:700,
            fontFamily:"'Noto Sans KR',sans-serif",transition:"all .2s"}}>
          {status==="loading"?"⏳ FFmpeg 로딩 중...":isProcessing?"⏳ 압축 중...":"🎬 압축 시작"}
        </button>

        {/* 결과 다운로드 */}
        {status==="done"&&resultUrl&&<>
          <div style={{background:"#0d2019",border:"1px solid #2ea04344",borderRadius:"10px",padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
              <span style={{color:"#8b949e",fontSize:"12px"}}>원본</span>
              <span style={{color:"#8b949e",fontSize:"12px",fontWeight:600}}>{fmtSz(origSize)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
              <span style={{color:"#3fb950",fontSize:"12px"}}>결과</span>
              <span style={{color:"#3fb950",fontSize:"12px",fontWeight:700}}>{fmtSz(resultSize)}</span>
            </div>
            {saving!=null&&<div style={{textAlign:"center",color:saving>0?"#3fb950":"#ff7b72",fontSize:"18px",fontWeight:700}}>
              {saving>0?`▼ ${saving}% 압축`:saving<0?`▲ ${Math.abs(saving)}% 증가`:"변화 없음"}
            </div>}
          </div>
          <a href={resultUrl} download={`compressed.${opts.format}`}
            style={{display:"block",padding:"11px",background:"#2ea043",borderRadius:"10px",
              color:"#fff",textDecoration:"none",fontSize:"13px",fontWeight:700,
              textAlign:"center",fontFamily:"'Noto Sans KR',sans-serif"}}>
            ⬇️ 결과 다운로드
          </a>
        </>}

        <button onClick={()=>{setFile(null);setPreview(null);setResultUrl(null);setStatus("idle");setLog("");}}
          style={{padding:"9px",background:"none",border:"1px solid #30363d",borderRadius:"8px",
            color:"#8b949e",cursor:"pointer",fontSize:"12px",fontFamily:"'Noto Sans KR',sans-serif"}}>
          🗑️ 새 파일 업로드
        </button>
      </div>

      {/* ─ 오른쪽: 미리보기 + 로그 ─ */}
      <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

        {/* 동영상 미리보기 */}
        <div style={{background:"#0d1117",borderRadius:"12px",overflow:"hidden",border:"1px solid #30363d"}}>
          {preview&&<video src={resultUrl||preview} controls
            style={{width:"100%",maxHeight:"400px",display:"block",background:"#000"}}/>}
          {resultUrl&&<div style={{padding:"8px 12px",fontSize:"11px",color:"#3fb950",background:"#0d2019",
            borderTop:"1px solid #2ea04333"}}>
            ✅ 압축 완료 — 위 영상은 결과물 미리보기입니다
          </div>}
        </div>

        {/* 진행 상태 */}
        {isProcessing&&<div style={{background:"#161b22",borderRadius:"10px",padding:"16px",border:"1px solid #30363d"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
            <span style={{color:"#8b949e",fontSize:"13px"}}>⏳ 압축 진행 중...</span>
            <span style={{color:"#58a6ff",fontWeight:700,fontSize:"13px"}}>{progress}%</span>
          </div>
          <div style={{height:"6px",background:"#21262d",borderRadius:"3px",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progress}%`,
              background:"linear-gradient(90deg,#1f6feb,#58a6ff)",
              borderRadius:"3px",transition:"width .3s"}}/>
          </div>
          <div style={{color:"#484f58",fontSize:"11px",marginTop:"8px",fontFamily:"monospace",
            whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {log||"처리 중..."}
          </div>
        </div>}

        {/* 에러 */}
        {status==="error"&&<div style={{background:"#2d1117",border:"1px solid #da363333",
          borderRadius:"10px",padding:"14px",color:"#ff7b72",fontSize:"13px"}}>
          ⚠️ {log}
          <div style={{marginTop:"8px",fontSize:"11px",color:"#484f58"}}>
            FFmpeg.wasm은 브라우저 환경에 따라 동작하지 않을 수 있습니다. SharedArrayBuffer가 필요합니다.
          </div>
        </div>}

        {/* 안내 */}
        <div style={{background:"#161b22",borderRadius:"8px",padding:"12px 14px",border:"1px solid #30363d",
          fontSize:"11px",color:"#484f58",lineHeight:"1.8"}}>
          <div style={{color:"#8b949e",fontWeight:600,marginBottom:"4px"}}>💡 사용 안내</div>
          · 모든 처리는 <strong style={{color:"#c9d1d9"}}>브라우저 내에서만</strong> 이루어져 서버로 업로드되지 않습니다<br/>
          · FFmpeg.wasm 첫 로드 시 약 20MB 다운로드가 필요합니다<br/>
          · 대용량 파일(1GB+)은 브라우저 메모리 한계로 실패할 수 있습니다<br/>
          · 일부 브라우저에서 <strong style={{color:"#c9d1d9"}}>SharedArrayBuffer</strong> 제한으로 동작하지 않을 수 있습니다
        </div>
      </div>
    </div>}
  </div>;
}


// ─── TAB: 동영상 → GIF 변환 ─────────────────────────────────────────────────
function VideoGifTab(){
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [duration,setDuration]=useState(0);
  const [status,setStatus]=useState("idle"); // idle|loading|ready|processing|done|error
  const [progress,setProgress]=useState(0);
  const [log,setLog]=useState("");
  const [resultUrl,setResultUrl]=useState(null);
  const [resultSize,setResultSize]=useState(0);
  const [dragOver,setDragOver]=useState(false);
  const [opts,setOpts]=useState({
    startTime: "0",
    endTime:   "",
    fps:       "10",
    width:     "480",
    loop:      "0",   // 0=무한
  });
  const ffmpegRef=useRef(null);
  const fileInputRef=useRef(null);
  const videoRef=useRef(null);

  const loadScript=(src)=>new Promise((res,rej)=>{
    if(document.querySelector(`script[src="${src}"]`)){res();return;}
    const s=document.createElement("script");
    s.crossOrigin="anonymous";
    s.src=src; s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });

  const loadFFmpeg=async()=>{
    if(ffmpegRef.current) return ffmpegRef.current;
    setStatus("loading");
    setLog("FFmpeg 엔진 로딩 중... (최초 1회 약 25MB)");
    try{
      await loadScript("https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js");
      const {createFFmpeg,fetchFile:ff_fetchFile}=window.FFmpeg||{};
      if(!createFFmpeg) throw new Error("FFmpeg 스크립트 로드 실패");
      window._ffFetchFile=ff_fetchFile;
      const ff=createFFmpeg({
        log:false,
        logger:({message})=>setLog(message),
        progress:({ratio})=>setProgress(Math.round(ratio*100)),
        corePath:"https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
      });
      await ff.load();
      ffmpegRef.current=ff;
      setStatus("ready");
      setLog("");
      return ff;
    }catch(e){
      setStatus("error");
      setLog("FFmpeg 로드 실패: "+e.message);
      return null;
    }
  };

  const onFile=(f)=>{
    if(!f||!f.type.startsWith("video/")) return;
    setFile(f);
    setResultUrl(null);
    setResultSize(0);
    setProgress(0);
    setLog("");
    setStatus("ready");
    const url=URL.createObjectURL(f);
    setPreview(url);
  };

  const onVideoLoaded=()=>{
    if(videoRef.current){
      const d=videoRef.current.duration||0;
      setDuration(d);
      setOpts(o=>({...o, endTime: d>0?Math.min(d,15).toFixed(1):""}));
    }
  };

  const useCurrentTime=(field)=>{
    if(videoRef.current){
      const t=videoRef.current.currentTime.toFixed(2);
      setOpts(o=>({...o,[field]:t}));
    }
  };

  const convert=async()=>{
    if(!file) return;
    const ff=await loadFFmpeg();
    if(!ff) return;
    setStatus("processing");
    setProgress(0);
    setLog("파일 읽는 중...");
    try{
      const fetchFile=window._ffFetchFile||(async(f)=>new Uint8Array(await f.arrayBuffer()));
      const ext=file.name.split(".").pop().toLowerCase();
      const inputName="input."+ext;
      ff.FS("writeFile", inputName, await fetchFile(file));
      setLog("GIF 변환 중...");

      const start=parseFloat(opts.startTime)||0;
      const end=parseFloat(opts.endTime)||0;
      const dur=end>start?end-start:0;
      const fps=opts.fps||"10";
      const width=opts.width||"480";
      const loop=opts.loop||"0";

      // 팔레트 생성 → GIF 변환 (고품질 2패스)
      const paletteArgs=["-i",inputName];
      if(start>0) paletteArgs.splice(0,0,"-ss",String(start));
      if(dur>0) paletteArgs.push("-t",String(dur));
      paletteArgs.push("-vf",`fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`);
      paletteArgs.push("palette.png");
      await ff.run(...paletteArgs);

      const gifArgs=[];
      if(start>0) gifArgs.push("-ss",String(start));
      gifArgs.push("-i",inputName,"-i","palette.png");
      if(dur>0) gifArgs.push("-t",String(dur));
      gifArgs.push(
        "-lavfi",`fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
        "-loop",loop,
        "output.gif"
      );
      await ff.run(...gifArgs);

      const data=ff.FS("readFile","output.gif");
      const blob=new Blob([data.buffer],{type:"image/gif"});
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setStatus("done");
      setLog("변환 완료!");
      setProgress(100);
    }catch(e){
      setStatus("error");
      setLog("오류: "+e.message);
    }
  };

  const download=()=>{
    if(!resultUrl) return;
    const a=document.createElement("a");
    const base=file.name.replace(/\.[^.]+$/,"");
    a.href=resultUrl; a.download=base+".gif"; a.click();
  };

  const isProcessing=status==="processing"||status==="loading";
  const fmtTime=(s)=>{
    if(!s&&s!==0) return "-";
    const m=Math.floor(s/60), sec=(s%60).toFixed(1);
    return `${m}:${String(sec).padStart(4,"0")}`;
  };

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>

    {/* 업로드 */}
    {!file&&<div
      onClick={()=>fileInputRef.current?.click()}
      onDragOver={e=>{e.preventDefault();setDragOver(true);}}
      onDragLeave={()=>setDragOver(false)}
      onDrop={e=>{e.preventDefault();setDragOver(false);onFile(e.dataTransfer.files[0]);}}
      style={{border:`2px dashed ${dragOver?"#1f6feb":"#30363d"}`,borderRadius:"12px",
        padding:"40px 20px",textAlign:"center",cursor:"pointer",
        background:dragOver?"#1f6feb11":"#0d1117",transition:"all .2s"}}>
      <div style={{fontSize:"40px",marginBottom:"12px"}}>🎞️</div>
      <div style={{color:"#c9d1d9",fontSize:"15px",fontWeight:600,marginBottom:"6px"}}>동영상을 드래그하거나 클릭하여 업로드</div>
      <div style={{color:"#484f58",fontSize:"13px"}}>MP4, WebM, AVI, MOV, MKV 등 · 브라우저 내 처리 (서버 미업로드)</div>
      <input ref={fileInputRef} type="file" accept="video/*" style={{display:"none"}} onChange={e=>onFile(e.target.files[0])}/>
    </div>}

    {file&&<div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
      {/* 파일 정보 + 초기화 */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"12px 16px",
        display:"flex",alignItems:"center",gap:"12px"}}>
        <span style={{fontSize:"20px"}}>🎞️</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:"#e6edf3",fontSize:"13px",fontWeight:600,
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</div>
          <div style={{color:"#484f58",fontSize:"11px",marginTop:"2px"}}>
            {fmtSize(file.size)}{duration>0&&` · 총 ${fmtTime(duration)}`}
          </div>
        </div>
        <button onClick={()=>{setFile(null);setPreview(null);setResultUrl(null);setStatus("idle");}}
          style={{padding:"6px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
            borderRadius:"6px",cursor:"pointer",fontSize:"12px"}}>🗑️ 초기화</button>
      </div>

      {/* 비디오 미리보기 */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",overflow:"hidden"}}>
        <div style={{padding:"8px 14px",borderBottom:"1px solid #21262d",
          color:"#8b949e",fontSize:"11px",fontWeight:700}}>🎬 원본 미리보기</div>
        <div style={{padding:"12px",display:"flex",justifyContent:"center"}}>
          <video key={preview} ref={videoRef} src={preview} controls preload="auto" playsInline onLoadedMetadata={onVideoLoaded}
            style={{maxWidth:"100%",maxHeight:"260px",borderRadius:"8px",background:"#000"}}/>
        </div>
        <div style={{padding:"8px 14px",borderTop:"1px solid #21262d",display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <button onClick={()=>useCurrentTime("startTime")}
            style={{padding:"5px 12px",background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",
              borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontWeight:600}}>
            ▶ 현재 위치를 시작점으로
          </button>
          <button onClick={()=>useCurrentTime("endTime")}
            style={{padding:"5px 12px",background:"#2ea04322",color:"#3fb950",border:"1px solid #2ea04344",
              borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontWeight:600}}>
            ⏹ 현재 위치를 종료점으로
          </button>
        </div>
      </div>

      {/* 변환 옵션 */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"16px"}}>
        <div style={{color:"#8b949e",fontSize:"12px",fontWeight:700,marginBottom:"14px"}}>⚙️ 변환 옵션</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>

          {/* 시작 시간 */}
          <div>
            <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"6px"}}>시작 시간 (초)</div>
            <input type="number" value={opts.startTime} min="0" step="0.1"
              onChange={e=>setOpts(o=>({...o,startTime:e.target.value}))}
              style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"#0d1117",
                border:"1px solid #30363d",borderRadius:"6px",color:"#e6edf3",fontSize:"13px",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#58a6ff"}
              onBlur={e=>e.target.style.borderColor="#30363d"}/>
          </div>

          {/* 종료 시간 */}
          <div>
            <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"6px"}}>
              종료 시간 (초){duration>0&&<span style={{color:"#484f58",marginLeft:"4px"}}>/ {fmtTime(duration)}</span>}
            </div>
            <input type="number" value={opts.endTime} min="0" step="0.1"
              onChange={e=>setOpts(o=>({...o,endTime:e.target.value}))}
              style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",background:"#0d1117",
                border:"1px solid #30363d",borderRadius:"6px",color:"#e6edf3",fontSize:"13px",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#58a6ff"}
              onBlur={e=>e.target.style.borderColor="#30363d"}/>
          </div>

          {/* FPS */}
          <div>
            <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"6px"}}>프레임 (FPS)</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {["5","10","15","20"].map(v=>(
                <button key={v} onClick={()=>setOpts(o=>({...o,fps:v}))}
                  style={{padding:"6px 12px",borderRadius:"6px",border:"none",cursor:"pointer",
                    fontSize:"12px",fontWeight:600,
                    background:opts.fps===v?"#1f6feb":"#21262d",
                    color:opts.fps===v?"#fff":"#8b949e"}}>
                  {v}fps
                </button>
              ))}
            </div>
            <div style={{color:"#484f58",fontSize:"10px",marginTop:"5px"}}>높을수록 부드럽지만 파일 용량 증가</div>
          </div>

          {/* 가로 크기 */}
          <div>
            <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"6px"}}>가로 크기 (px)</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              {["320","480","640","original"].map(v=>(
                <button key={v} onClick={()=>setOpts(o=>({...o,width:v}))}
                  style={{padding:"6px 10px",borderRadius:"6px",border:"none",cursor:"pointer",
                    fontSize:"12px",fontWeight:600,
                    background:opts.width===v?"#1f6feb":"#21262d",
                    color:opts.width===v?"#fff":"#8b949e"}}>
                  {v==="original"?"원본":v}
                </button>
              ))}
            </div>
            <div style={{color:"#484f58",fontSize:"10px",marginTop:"5px"}}>세로는 비율 자동 유지</div>
          </div>

          {/* 루프 */}
          <div style={{gridColumn:"1/-1"}}>
            <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"6px"}}>반복 횟수</div>
            <div style={{display:"flex",gap:"5px"}}>
              {[["0","무한 반복"],["1","1회"],["2","2회"],["3","3회"]].map(([v,lbl])=>(
                <button key={v} onClick={()=>setOpts(o=>({...o,loop:v}))}
                  style={{padding:"6px 14px",borderRadius:"6px",border:"none",cursor:"pointer",
                    fontSize:"12px",fontWeight:600,
                    background:opts.loop===v?"#1f6feb":"#21262d",
                    color:opts.loop===v?"#fff":"#8b949e"}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 변환 버튼 */}
      <button onClick={convert} disabled={isProcessing}
        style={{padding:"13px",background:isProcessing?"#21262d":"linear-gradient(135deg,#1f6feb,#58a6ff)",
          color:isProcessing?"#484f58":"#fff",border:"none",borderRadius:"10px",
          cursor:isProcessing?"not-allowed":"pointer",fontFamily:"'Noto Sans KR',sans-serif",
          fontSize:"15px",fontWeight:700,transition:"all .2s"}}>
        {status==="loading"?"⏳ FFmpeg 로딩 중...":isProcessing?"⏳ GIF 변환 중...":"🎞️ GIF 변환 시작"}
      </button>

      {/* 진행률 */}
      {isProcessing&&<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#8b949e",fontSize:"12px",animation:"pulse 1s infinite"}}>{log||"처리 중..."}</span>
          <span style={{color:"#58a6ff",fontSize:"13px",fontWeight:700}}>{progress}%</span>
        </div>
        <div style={{background:"#21262d",borderRadius:"4px",height:"6px",overflow:"hidden"}}>
          <div style={{background:"linear-gradient(90deg,#1f6feb,#58a6ff)",height:"100%",
            width:`${progress}%`,transition:"width .3s",borderRadius:"4px"}}/>
        </div>
      </div>}

      {/* 에러 */}
      {status==="error"&&<div style={{background:"#2d1117",border:"1px solid #da3633",
        borderRadius:"10px",padding:"14px",color:"#ff7b72",fontSize:"13px"}}>
        ⚠️ {log}
      </div>}

      {/* 결과 */}
      {status==="done"&&resultUrl&&<div style={{background:"#0d2019",border:"1px solid #2ea04344",
        borderRadius:"10px",overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:"1px solid #2ea04322",
          display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",flexWrap:"wrap"}}>
          <div>
            <div style={{color:"#3fb950",fontWeight:700,fontSize:"14px"}}>✅ GIF 변환 완료!</div>
            <div style={{color:"#484f58",fontSize:"11px",marginTop:"2px"}}>
              파일 크기: <span style={{color:"#58a6ff",fontWeight:600}}>{fmtSize(resultSize)}</span>
            </div>
          </div>
          <button onClick={download}
            style={{padding:"9px 20px",background:"#2ea043",color:"#fff",border:"none",
              borderRadius:"8px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",
              fontSize:"13px",fontWeight:700}}>
            ⬇️ GIF 다운로드
          </button>
        </div>
        <div style={{padding:"16px",display:"flex",justifyContent:"center",background:"#0d1117"}}>
          <img src={resultUrl} alt="변환된 GIF"
            style={{maxWidth:"100%",maxHeight:"400px",borderRadius:"8px",border:"1px solid #30363d"}}/>
        </div>
      </div>}

    </div>}
  </div>;
}



// ─── TAB: 사진 복원·향상 ────────────────────────────────────────────────────

// ─── TAB: 사진 복원·향상 (AI Real-ESRGAN) ──────────────────────────────────
let _aiSession = null; // 브라우저 세션 동안 모델 캐시

const ORT_CDN = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/";
const AI_MODEL_URLS = [
  "/models/realesr.onnx",
];

function RestoreTab(){
  const [origUrl,setOrigUrl]=useState(null);
  const [resultUrl,setResultUrl]=useState(null);
  const [processing,setProcessing]=useState(false);
  const [progress,setProgress]=useState(0);
  const [statusMsg,setStatusMsg]=useState("");
  const [errMsg,setErrMsg]=useState("");
  const [dragOver,setDragOver]=useState(false);
  const [sliderX,setSliderX]=useState(50);
  const [dragging,setDragging]=useState(false);
  const [origInfo,setOrigInfo]=useState(null);
  const [resultInfo,setResultInfo]=useState(null);
  const [useAI,setUseAI]=useState(true);
  const [scale,setScale]=useState("2");
  const fileRef=useRef(null);
  const sliderRef=useRef(null);

  const loadFile=useCallback((file)=>{
    if(!file||!file.type.startsWith("image/")) return;
    const url=URL.createObjectURL(file);
    setOrigUrl(url); setResultUrl(null); setResultInfo(null);
    setErrMsg(""); setProgress(0); setStatusMsg("");
    const img=new Image();
    img.onload=()=>setOrigInfo({w:img.naturalWidth,h:img.naturalHeight,bytes:file.size});
    img.src=url;
  },[]);

  useEffect(()=>{
    const fn=e=>{
      const item=[...e.clipboardData.items].find(i=>i.type.startsWith("image/"));
      if(item) loadFile(item.getAsFile());
    };
    window.addEventListener("paste",fn);
    return()=>window.removeEventListener("paste",fn);
  },[loadFile]);

  const loadImg=src=>new Promise((res,rej)=>{
    const img=new Image(); img.crossOrigin="anonymous";
    img.onload=()=>res(img); img.onerror=rej; img.src=src;
    if(img.complete&&img.naturalWidth>0) res(img);
  });

  // ── ORT 스크립트 로드 + 모델 세션 획득 ──
  const getAISession=async(setProg,setMsg)=>{
    if(_aiSession) return _aiSession;

    // 1. ORT Web 스크립트 로드
    if(!window.ort){
      setMsg("AI 라이브러리 로딩 중...");
      await new Promise((res,rej)=>{
        const s=document.createElement("script");
        s.src=ORT_CDN+"ort.min.js";
        s.onload=res; s.onerror=()=>rej(new Error("ORT 스크립트 로드 실패"));
        document.head.appendChild(s);
      });
      window.ort.env.wasm.wasmPaths=ORT_CDN;
    }

    // 2. 모델 다운로드 (타임아웃 없이 스트리밍)
    setMsg("AI 모델 다운로드 중... (약 70MB, 처음 한 번만)");
    let modelBuffer=null;
    for(const url of AI_MODEL_URLS){
      try{
        const resp=await fetch(url,{cache:"default"});
        if(!resp.ok) continue;
        const reader=resp.body.getReader();
        const chunks=[];
        let loaded=0;
        const ESTIMATED=70*1024*1024;
        while(true){
          const {done,value}=await reader.read();
          if(done) break;
          chunks.push(value); loaded+=value.length;
          setProg(Math.min(35,Math.round(loaded/ESTIMATED*35)));
          setMsg(`모델 다운로드 중... ${Math.round(loaded/1024/1024)}MB / 70MB`);
          await new Promise(r=>setTimeout(r,0));
        }
        if(loaded<10*1024){ continue; }
        const buf=new Uint8Array(loaded);
        let off=0; for(const c of chunks){buf.set(c,off); off+=c.length;}
        modelBuffer=buf.buffer;
        break;
      }catch(e){ continue; }
    }

    if(!modelBuffer){
      throw new Error("AI 모델 로드 실패. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.");
    }

    // 3. 세션 생성
    setMsg("AI 모델 초기화 중..."); setProg(42);
    const session=await window.ort.InferenceSession.create(modelBuffer,{
      executionProviders:["wasm"],
    });
    _aiSession=session;
    return session;
  };

  // ── AI 업스케일 (Real-ESRGAN, 타일 처리) ──
  const runAIUpscale=async()=>{
    if(!origUrl) return;
    setProcessing(true); setResultUrl(null); setErrMsg(""); setProgress(0);
    const setProg=p=>setProgress(p);
    const setMsg=m=>setStatusMsg(m);
    try{
      const img=await loadImg(origUrl);
      const sw=img.naturalWidth, sh=img.naturalHeight;
      const srcCvs=document.createElement("canvas");
      srcCvs.width=sw; srcCvs.height=sh;
      const srcCtx=srcCvs.getContext("2d"); srcCtx.drawImage(img,0,0);

      const session=await getAISession(setProg,setMsg);
      const inputName=session.inputNames[0];
      const outputName=session.outputNames[0];

      // 타일 설정 (256px 타일, 16px 오버랩)
      const TILE=256, OVERLAP=16, INNER=TILE-OVERLAP*2;
      const MODEL_SCALE=4; // Real-ESRGAN x4

      setMsg(`AI 업스케일 처리 중... (${sw}×${sh} → ${sw*MODEL_SCALE}×${sh*MODEL_SCALE})`);
      setProg(45);

      const dw=sw*MODEL_SCALE, dh=sh*MODEL_SCALE;
      const dstCvs=document.createElement("canvas");
      dstCvs.width=dw; dstCvs.height=dh;
      const dstCtx=dstCvs.getContext("2d");

      const tilesX=Math.ceil(sw/INNER), tilesY=Math.ceil(sh/INNER);
      const totalTiles=tilesX*tilesY;
      let done=0;

      for(let ty=0;ty<tilesY;ty++){
        for(let tx=0;tx<tilesX;tx++){
          const sx0=Math.max(0,tx*INNER-OVERLAP);
          const sy0=Math.max(0,ty*INNER-OVERLAP);
          const sx1=Math.min(sw,tx*INNER+INNER+OVERLAP);
          const sy1=Math.min(sh,ty*INNER+INNER+OVERLAP);
          const tw=sx1-sx0, th=sy1-sy0;

          const px=srcCtx.getImageData(sx0,sy0,tw,th).data;
          const inp=new Float32Array(3*th*tw);
          for(let i=0;i<th*tw;i++){
            inp[i]                =px[i*4]  /255;
            inp[th*tw+i]          =px[i*4+1]/255;
            inp[2*th*tw+i]        =px[i*4+2]/255;
          }

          const tensor=new window.ort.Tensor("float32",inp,[1,3,th,tw]);
          const out=await session.run({[inputName]:tensor});
          const outData=out[outputName].data;
          const outW=tw*MODEL_SCALE, outH=th*MODEL_SCALE;

          const pixels=new Uint8ClampedArray(outW*outH*4);
          for(let i=0;i<outH*outW;i++){
            pixels[i*4]  =Math.max(0,Math.min(255,outData[i]*255));
            pixels[i*4+1]=Math.max(0,Math.min(255,outData[outH*outW+i]*255));
            pixels[i*4+2]=Math.max(0,Math.min(255,outData[2*outH*outW+i]*255));
            pixels[i*4+3]=255;
          }

          // 오버랩 제거 후 dst에 붙이기
          const padL=(sx0===0?0:OVERLAP)*MODEL_SCALE;
          const padT=(sy0===0?0:OVERLAP)*MODEL_SCALE;
          const padR=(sx1===sw?0:OVERLAP)*MODEL_SCALE;
          const padB=(sy1===sh?0:OVERLAP)*MODEL_SCALE;
          const cropW=outW-padL-padR, cropH=outH-padT-padB;
          const dstX=tx*INNER*MODEL_SCALE, dstY=ty*INNER*MODEL_SCALE;

          const tmp=document.createElement("canvas");
          tmp.width=outW; tmp.height=outH;
          tmp.getContext("2d").putImageData(new ImageData(pixels,outW,outH),0,0);
          dstCtx.drawImage(tmp,padL,padT,cropW,cropH,dstX,dstY,cropW,cropH);

          done++;
          setProg(45+Math.round(done/totalTiles*50));
          setMsg(`AI 처리 중... ${done}/${totalTiles} 타일 완료`);
          await new Promise(r=>setTimeout(r,0)); // UI 업데이트 허용
        }
      }

      setProg(97); setMsg("저장 중...");
      const blob=await new Promise(res=>dstCvs.toBlob(res,"image/jpeg",0.95));
      setResultUrl(URL.createObjectURL(blob));
      setResultInfo({w:dw,h:dh,bytes:blob.size});
      setProg(100); setMsg("✅ AI 복원 완료!");
    }catch(e){
      setErrMsg("AI 오류: "+e.message);
    }
    setProcessing(false);
  };

  // ── 기본 Canvas 처리 (AI 실패 시 또는 기본 모드) ──
  const runBasicProcess=async()=>{
    if(!origUrl) return;
    setProcessing(true); setResultUrl(null); setErrMsg(""); setProgress(0);
    const setProg=p=>setProgress(p);
    const setMsg=m=>setStatusMsg(m);
    try{
      await new Promise(r=>setTimeout(r,20));
      const img=await loadImg(origUrl);
      const sc=Number(scale);
      const dw=img.naturalWidth*sc, dh=img.naturalHeight*sc;
      setProg(15); setMsg("이미지 스케일 업...");

      const cvs=document.createElement("canvas");
      cvs.width=dw; cvs.height=dh;
      const ctx=cvs.getContext("2d",{willReadFrequently:true});
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality="high";
      ctx.drawImage(img,0,0,dw,dh);
      setProg(30); setMsg("색상·대비 보정 중...");

      // 자동 밝기·대비·채도
      {
        const id=ctx.getImageData(0,0,dw,dh); const d=id.data;
        let sum=0; for(let i=0;i<d.length;i+=4) sum+=(d[i]+d[i+1]+d[i+2])/3;
        const avg=sum/(d.length/4);
        const autoBr=avg<100?20:avg<160?10:avg>200?-10:0;
        const br=(autoBr/100)*255;
        const ctF=(259*(15+255))/(255*(259-15));
        const sat=1.15;
        for(let i=0;i<d.length;i+=4){
          let r=d[i]+br,g=d[i+1]+br,b=d[i+2]+br;
          r=ctF*(r-128)+128; g=ctF*(g-128)+128; b=ctF*(b-128)+128;
          const L=0.299*r+0.587*g+0.114*b;
          r=L+(r-L)*sat; g=L+(g-L)*sat; b=L+(b-L)*sat;
          d[i]=r<0?0:r>255?255:r; d[i+1]=g<0?0:g>255?255:g; d[i+2]=b<0?0:b>255?255:b;
        }
        ctx.putImageData(id,0,0);
      }
      setProg(50); setMsg("노이즈 제거 중...");

      // 노이즈 제거
      for(let p=0;p<2;p++){
        const id=ctx.getImageData(0,0,dw,dh);
        const s=new Uint8ClampedArray(id.data), d=id.data;
        for(let y=1;y<dh-1;y++) for(let x=1;x<dw-1;x++){
          const i=(y*dw+x)*4;
          for(let c=0;c<3;c++) d[i+c]=(s[i+c]+s[((y-1)*dw+x)*4+c]+s[((y+1)*dw+x)*4+c]+s[(y*dw+x-1)*4+c]+s[(y*dw+x+1)*4+c]+1)/5|0;
        }
        ctx.putImageData(id,0,0);
      }
      setProg(70); setMsg("선명도 향상 중...");

      // 언샤프 마스킹
      {
        const sharp=ctx.getImageData(0,0,dw,dh);
        const tmp=document.createElement("canvas"); tmp.width=dw; tmp.height=dh;
        const tc=tmp.getContext("2d"); tc.filter="blur(1px)"; tc.drawImage(cvs,0,0);
        const blurred=tc.getImageData(0,0,dw,dh);
        const sd=sharp.data, bd=blurred.data;
        for(let i=0;i<sd.length;i+=4) for(let c=0;c<3;c++){
          const v=sd[i+c]+(sd[i+c]-bd[i+c])*1.4;
          sd[i+c]=v<0?0:v>255?255:v;
        }
        ctx.putImageData(sharp,0,0);
      }
      setProg(90); setMsg("저장 중...");

      const blob=await new Promise(res=>cvs.toBlob(res,"image/jpeg",0.95));
      setResultUrl(URL.createObjectURL(blob));
      setResultInfo({w:dw,h:dh,bytes:blob.size});
      setProg(100); setMsg("완료!");
    }catch(e){
      setErrMsg("처리 오류: "+e.message);
    }
    setProcessing(false);
  };

  const runProcess=()=>{ useAI?runAIUpscale():runBasicProcess(); };

  const onMove=useCallback(e=>{
    if(!dragging||!sliderRef.current) return;
    const rect=sliderRef.current.getBoundingClientRect();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    setSliderX(Math.max(2,Math.min(98,((cx-rect.left)/rect.width)*100)));
  },[dragging]);

  useEffect(()=>{
    const up=()=>setDragging(false);
    window.addEventListener("mousemove",onMove); window.addEventListener("mouseup",up);
    window.addEventListener("touchmove",onMove,{passive:true}); window.addEventListener("touchend",up);
    return()=>{
      window.removeEventListener("mousemove",onMove); window.removeEventListener("mouseup",up);
      window.removeEventListener("touchmove",onMove); window.removeEventListener("touchend",up);
    };
  },[onMove]);

  const fmtSz=n=>n>1048576?(n/1048576).toFixed(1)+"MB":(n/1024).toFixed(0)+"KB";
  const fmtPx=(w,h)=>`${w}×${h}px`;

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

    {/* ── 업로드 화면 ── */}
    {!origUrl&&<>
      <div onClick={()=>fileRef.current?.click()}
        onTouchEnd={e=>{e.preventDefault();fileRef.current?.click();}}
        onDrop={e=>{e.preventDefault();setDragOver(false);loadFile(e.dataTransfer.files[0]);}}
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        style={{border:`2px dashed ${dragOver?"#58a6ff":"#30363d"}`,borderRadius:"14px",
          padding:"56px 20px",textAlign:"center",cursor:"pointer",
          background:dragOver?"#1f6feb11":"#0d1117",transition:"all .2s"}}>
        <div style={{fontSize:"56px",marginBottom:"14px"}}>🤖</div>
        <div style={{color:"#c9d1d9",fontSize:"17px",fontWeight:700,marginBottom:"8px"}}>
          이미지 드래그 · 클릭 · Ctrl+V
        </div>
        <div style={{color:"#484f58",fontSize:"13px"}}>AI가 진짜 디테일을 복원합니다 (Real-ESRGAN)</div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={e=>loadFile(e.target.files[0])}/>
      </div>
      </>}

    {/* ── 처리 화면 ── */}
    {origUrl&&<>

      {/* 컨트롤 바 */}
      {!resultUrl&&!processing&&<>
        <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={runAIUpscale} style={{
            marginLeft:"auto",padding:"11px 28px",
            background:"linear-gradient(135deg,#7928ca,#1f6feb)",
            border:"none",borderRadius:"10px",color:"#fff",cursor:"pointer",
            fontSize:"14px",fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",
          }}>🤖 AI 복원 시작</button>
          <button onClick={()=>{setOrigUrl(null);setOrigInfo(null);}} style={{
            padding:"11px 14px",background:"none",border:"1px solid #30363d",
            borderRadius:"10px",color:"#484f58",cursor:"pointer",fontSize:"13px",
          }}>🗑️</button>
        </div>
      </>}

      {/* 진행 표시 */}
      {processing&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"20px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
          <span style={{color:"#8b949e",fontSize:"13px"}}>{statusMsg||"처리 중..."}</span>
          <span style={{color:"#58a6ff",fontWeight:700}}>{progress}%</span>
        </div>
        <div style={{height:"6px",background:"#21262d",borderRadius:"3px",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${progress}%`,borderRadius:"3px",transition:"width .4s",
            background:"linear-gradient(90deg,#7928ca,#1f6feb,#58a6ff)"}}/></div>
      </div>}

      {/* 오류 */}
      {errMsg&&<div style={{background:"#2d1117",border:"1px solid #da363333",borderRadius:"8px",
        padding:"14px",display:"flex",flexDirection:"column",gap:"8px"}}>
        <div style={{color:"#ff7b72",fontSize:"13px",fontWeight:700}}>⚠️ {errMsg}</div>
      </div>}

      {/* 결과 */}
      {resultUrl&&<>
        <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
          {origInfo&&<span style={{color:"#484f58",fontSize:"12px"}}>원본 {fmtPx(origInfo.w,origInfo.h)}</span>}
          {resultInfo&&<span style={{color:"#3fb950",fontSize:"12px",fontWeight:700}}>
            → {fmtPx(resultInfo.w,resultInfo.h)} · {fmtSz(resultInfo.bytes)}
          </span>}
          <a href={resultUrl} download="restored.jpg" style={{
            marginLeft:"auto",padding:"9px 22px",background:"#2ea043",
            borderRadius:"8px",color:"#fff",textDecoration:"none",
            fontSize:"13px",fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif",
          }}>⬇️ 다운로드</a>
          <button onClick={()=>{setResultUrl(null);setResultInfo(null);setProgress(0);setStatusMsg("");}} style={{
            padding:"9px 14px",background:"none",border:"1px solid #30363d",
            borderRadius:"8px",color:"#8b949e",cursor:"pointer",fontSize:"12px",
            fontFamily:"'Noto Sans KR',sans-serif",
          }}>🔄 다시</button>
          <button onClick={()=>{setOrigUrl(null);setResultUrl(null);setOrigInfo(null);setResultInfo(null);}} style={{
            padding:"9px 14px",background:"none",border:"1px solid #30363d",
            borderRadius:"8px",color:"#484f58",cursor:"pointer",fontSize:"12px",
            fontFamily:"'Noto Sans KR',sans-serif",
          }}>🗑️ 새 이미지</button>
        </div>

        {/* Before/After 슬라이더 */}
        <div ref={sliderRef}
          onMouseDown={e=>{e.preventDefault();setDragging(true);}}
          onTouchStart={()=>setDragging(true)}
          style={{position:"relative",borderRadius:"14px",overflow:"hidden",cursor:"ew-resize",
            border:"1px solid #30363d",userSelect:"none",touchAction:"none"}}>
          <img src={resultUrl} style={{width:"100%",display:"block",maxHeight:"500px",objectFit:"contain"}} alt="복원 결과"/>
          <div style={{position:"absolute",inset:0,overflow:"hidden",width:`${sliderX}%`}}>
            <img src={origUrl} style={{width:`${100/sliderX*100}%`,maxWidth:"none",display:"block",
              maxHeight:"500px",objectFit:"contain"}} alt="원본"/>
          </div>
          {/* 슬라이더 핸들 */}
          <div style={{position:"absolute",top:0,bottom:0,left:`${sliderX}%`,
            transform:"translateX(-50%)",width:"3px",background:"#fff",boxShadow:"0 0 8px #00000088"}}>
            <div style={{position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",width:"36px",height:"36px",
              background:"#fff",borderRadius:"50%",boxShadow:"0 2px 12px #00000066",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#333",fontSize:"14px",fontWeight:700}}>↔</div>
          </div>
          {/* 라벨 */}
          <div style={{position:"absolute",top:"10px",left:"12px",background:"#00000088",
            color:"#fff",fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"20px"}}>원본</div>
          <div style={{position:"absolute",top:"10px",right:"12px",background:"#1f6feb",
            color:"#fff",fontSize:"11px",fontWeight:700,padding:"3px 10px",borderRadius:"20px"}}>
            AI 복원
          </div>
        </div>
      </>}

      {/* 원본 미리보기 */}
      {!resultUrl&&!processing&&<img src={origUrl} alt="원본"
        style={{width:"100%",borderRadius:"12px",maxHeight:"400px",objectFit:"contain",border:"1px solid #30363d"}}/>}
    </>}
  </div>;
}

// ─── TAB: 자동글쓰기 ─────────────────────────────────────────────────────
const NAVER_DIR_MAP = {
  // 생활 노하우·쇼핑
  "요리·레시피": 20, "맛집": 29, "카페·디저트": 29,
  "패션·뷰티": 18, "인테리어·DIY": 19, "살림·생활꿀팁": 14,
  "원예·식물": 36, "상품리뷰": 21,
  // 취미·여가·여행
  "국내여행": 27, "세계여행": 28, "자동차": 25, "중고차·신차": 25, "전기차·하이브리드": 25,
  "게임": 22, "스포츠": 23, "취미": 26,
  // 반려동물
  "반려견": 16, "반려묘": 16, "반려동물 건강": 16,
  // 육아·교육
  "육아·아이": 15, "임신·출산": 15, "교육·학습": 34, "유아교육·장난감": 15,
  // 지식·동향
  "IT·가전": 30, "스마트폰·앱": 30, "AI·기술트렌드": 30,
  "건강·의학정보": 32, "멘탈케어·심리": 32, "한방·영양제": 32,
  "재테크·투자": 33, "부동산": 33, "주식·ETF": 33, "보험·연금": 33,
  // 엔터테인먼트·예술
  "영화": 6, "드라마": 9, "음악·공연": 11, "책·독서": 5,
  "웹툰·만화": 13, "스타·연예인": 12, "방송": 10,
};

const NAVER_AUTO_CATEGORIES=[
  {group:"🍽️ 생활/음식",items:[
    {value:"요리·레시피",label:"요리·레시피"},{value:"맛집",label:"맛집"},
    {value:"카페·디저트",label:"카페·디저트"},{value:"살림·생활꿀팁",label:"살림·생활꿀팁"},
  ]},
  {group:"💄 패션/뷰티",items:[
    {value:"패션·뷰티",label:"패션·뷰티"},{value:"인테리어·DIY",label:"인테리어·DIY"},
    {value:"원예·식물",label:"원예·식물"},{value:"상품리뷰",label:"상품리뷰"},
  ]},
  {group:"✈️ 여행/취미",items:[
    {value:"국내여행",label:"국내여행"},{value:"세계여행",label:"세계여행"},
    {value:"취미",label:"취미"},{value:"스포츠",label:"스포츠"},
  ]},
  {group:"🚗 자동차",items:[
    {value:"자동차",label:"자동차"},{value:"중고차·신차",label:"중고차·신차"},
    {value:"전기차·하이브리드",label:"전기차·하이브리드"},
  ]},
  {group:"🐾 반려동물",items:[
    {value:"반려견",label:"반려견"},{value:"반려묘",label:"반려묘"},
    {value:"반려동물 건강",label:"반려동물 건강"},
  ]},
  {group:"👶 육아/교육",items:[
    {value:"육아·아이",label:"육아·아이"},{value:"임신·출산",label:"임신·출산"},
    {value:"교육·학습",label:"교육·학습"},{value:"유아교육·장난감",label:"유아교육·장난감"},
  ]},
  {group:"💻 IT/지식",items:[
    {value:"IT·가전",label:"IT·컴퓨터"},{value:"스마트폰·앱",label:"스마트폰·앱"},
    {value:"AI·기술트렌드",label:"AI·기술트렌드"},{value:"게임",label:"게임"},
  ]},
  {group:"💰 경제/비즈니스",items:[
    {value:"재테크·투자",label:"재테크·투자"},{value:"부동산",label:"부동산"},
    {value:"주식·ETF",label:"주식·ETF"},{value:"보험·연금",label:"보험·연금"},
  ]},
  {group:"🏥 건강/의학",items:[
    {value:"건강·의학정보",label:"건강·의학"},{value:"멘탈케어·심리",label:"멘탈케어·심리"},
    {value:"한방·영양제",label:"한방·영양제"},
  ]},
  {group:"🎬 엔터테인먼트",items:[
    {value:"영화",label:"영화"},{value:"드라마",label:"드라마"},
    {value:"음악·공연",label:"음악·공연"},{value:"스타·연예인",label:"스타·연예인"},
    {value:"방송",label:"방송"},{value:"웹툰·만화",label:"웹툰·만화"},
    {value:"책·독서",label:"책·독서"},
  ]},
];

function AutoWriteTab({setActive, goAutoWrite, setPendingKeywordSearch}){
  const [selCat,setSelCat]=useState("");
  const [loadingKw,setLoadingKw]=useState(false);
  const [keywords,setKeywords]=useState([]);
  const [err,setErr]=useState("");
  const [trendingCount,setTrendingCount]=useState(0);
  const [googleCount,setGoogleCount]=useState(0);
  const [stats,setStats]=useState({});        // { 메인키워드: {monthly, commercial} }
  const [detail,setDetail]=useState({});      // { 메인키워드: {loading, related[], monthlyPosts, saturation, source} }
  const now=new Date();
  const yearMonth=`${now.getFullYear()}년 ${now.getMonth()+1}월`;

  const genKeywords=async()=>{
    if(!selCat) return;
    setLoadingKw(true); setKeywords([]); setErr("");
    setStats({}); setDetail({}); setTrendingCount(0); setGoogleCount(0);
    try{
      const dirNo = NAVER_DIR_MAP[selCat] || 0;

      // ── 트렌드 소스: 구글 트렌드(일간) + 네이버 주제별 인기글 ──
      let trendingTitles = [];
      let googleTrends   = [];
      try {
        const tr = await fetch(`/api/trending-keywords?dirNo=${dirNo}`);
        const td = await tr.json();
        trendingTitles = td.naverTopPosts || [];
        googleTrends   = (td.google || []).map(g => g.keyword).filter(Boolean);
        setTrendingCount(trendingTitles.length);
        setGoogleCount(googleTrends.length);
      } catch(e) { /* 실패해도 AI 추천은 계속 진행 */ }

      const trendingBlock = trendingTitles.length > 0
        ? `\n\n현재 네이버 블로그 "${selCat}" 카테고리 실시간 인기글 제목 (참고용):\n${trendingTitles.map((t,i)=>`${i+1}. ${t}`).join("\n")}`
        : "";

      const googleBlock = googleTrends.length > 0
        ? `\n\n오늘 구글 트렌드 한국 인기 급상승 검색어 (참고용):\n${googleTrends.map((t,i)=>`${i+1}. ${t}`).join(", ")}\n※ 이 중 "${selCat}" 카테고리와 실제로 연결되는 것만 활용할 것. 억지로 끼워 맞추지 말 것.`
        : "";

      const prompt=`카테고리: "${selCat}"
${yearMonth} 현재 네이버 블로그로 쓰기 좋은 글 주제 10개와 각각의 메인 키워드를 추천해줘.${trendingBlock}${googleBlock}

선정 기준:
1. 실제 블로거가 쓸 법한 완성된 제목 형태 (경험·후기·정보·비교 등 독자가 클릭하고 싶은 구체적 제목)
2. ${yearMonth} 최신 트렌드와 시의성 반영${trendingTitles.length > 0 ? " (위 실시간 인기글 소재를 참고해 유사하거나 파생된 주제 우선)" : ""}
3. 메인 키워드는 반드시 1~2개의 형태소로만 구성 (예: "옷장정리", "옷장 정리"). "옷장 정리 방법"처럼 3형태소 이상은 절대 불가. 네이버에서 실제로 많이 검색되는 단어
4. 인기글과 너무 똑같은 제목은 피하고, 소재만 참고해서 차별화된 새 주제로 발전시킬 것
5. 10개의 메인 키워드는 서로 겹치지 않게 분산시킬 것 (같은 단어를 변형만 해서 반복하지 말 것)

※ 검색량과 경쟁도는 추측하지 말 것. 추천 후 실제 데이터로 따로 조회한다.

반드시 순수 JSON만 출력. 마크다운 없이.
{"keywords":[{"rank":1,"title":"추천 글 주제 제목","mainKeyword":"메인 키워드 (1~2형태소, 예:옷장정리)","reason":"선정 이유 한 줄 (유행성 포함)"},...]}`

      const raw=await callClaude([{role:"user",content:prompt}],
        "You are a Naver blog SEO expert. Output ONLY valid JSON, no markdown.",1500,"claude-haiku-4-5-20251001");
      const parsed=safeParseJson(raw);
      const list=parsed.keywords||[];
      setKeywords(list);
      fetchBulkStats(list);
    }catch(ex){setErr("추천 글 주제 생성 오류: "+(ex?.message||String(ex)));}
    setLoadingKw(false);
  };

  // ── 추천된 10개의 월 검색량·상업성을 실제 광고 API로 조회 (5개씩 2회) ──
  const fetchBulkStats=async(list)=>{
    const kws=list.map(k=>k.mainKeyword||k.keyword).filter(Boolean);
    const flat=s=>String(s||"").replace(/\s+/g,"").toUpperCase();
    const next={};

    for(let i=0;i<kws.length;i+=5){
      const chunk=kws.slice(i,i+5);
      try{
        const r=await fetch(`/api/keyword-stats?keywords=${encodeURIComponent(chunk.join(","))}`);
        const d=await r.json();
        (d.keywordList||[]).forEach(item=>{
          const hit=chunk.find(k=>flat(k)===flat(item.relKeyword));
          if(!hit) return;
          const pc =Number(item.monthlyPcQcCnt)||0;
          const mob=Number(item.monthlyMobileQcCnt)||0;
          next[hit]={ monthly: pc+mob, commercial: isCommercialStat(item), depth: Number(item.plAvgDepth)||0 };
        });
      }catch(e){}
    }
    setStats(s=>({...s,...next}));
  };

  // ── 개별 키워드: 연관검색어 + 이번 달 발행량 + 포화도 ──
  const loadDetail=async(mainKeyword)=>{
    if(!mainKeyword) return;
    setDetail(d=>({...d,[mainKeyword]:{...(d[mainKeyword]||{}),loading:true}}));

    const flat=s=>String(s||"").replace(/\s+/g,"").toUpperCase();
    let related=[]; let monthlyPosts=null; let totalPosts=null; let source=null; let capped=false;

    try{
      const r=await fetch(`/api/keyword-stats?keywords=${encodeURIComponent(mainKeyword)}`);
      const d=await r.json();
      related=(d.keywordList||[])
        .filter(i=>flat(i.relKeyword)!==flat(mainKeyword))
        .map(i=>({
          keyword:i.relKeyword,
          monthly:(Number(i.monthlyPcQcCnt)||0)+(Number(i.monthlyMobileQcCnt)||0),
          commercial:isCommercialStat(i),
        }))
        .sort((a,b)=>b.monthly-a.monthly)
        .slice(0,12);
      if(related.length===0&&(d.autoComplete||[]).length>0){
        related=d.autoComplete.map(k=>({keyword:k,monthly:null,commercial:false}));
      }
    }catch(e){}

    try{
      const r=await fetch(`/api/blog-count?keyword=${encodeURIComponent(mainKeyword)}`);
      const d=await r.json();
      monthlyPosts=d.monthly??null;
      totalPosts=d.total??null;
      source=d.source||null;
      capped=!!d.capped;
    }catch(e){}

    const searchVol=stats[mainKeyword]?.monthly||null;
    let saturation=null;
    if(monthlyPosts!==null&&searchVol&&searchVol>0){
      saturation=Math.round((monthlyPosts/searchVol)*100);
    }

    setDetail(d=>({...d,[mainKeyword]:{loading:false,related,monthlyPosts,totalPosts,saturation,source,capped}}));
  };

  const goKeywordSearch=(mainKeyword)=>{
    if(!mainKeyword) return;
    setPendingKeywordSearch(mainKeyword);
    setActive("keyword");
  };

  const fmt=n=>{ if(n===null||n===undefined) return "-"; const v=Number(n); if(isNaN(v)) return "-"; return v.toLocaleString(); };

  // 포화도 해석 — 낮을수록 등록 난이도가 낮다
  const satLabel=s=>{
    if(s===null||s===undefined) return {text:"-",color:"#484f58"};
    if(s<30)   return {text:`포화도 ${s}% · 매우 낮음`,color:"#3fb950"};
    if(s<100)  return {text:`포화도 ${s}% · 낮음`,color:"#3fb950"};
    if(s<300)  return {text:`포화도 ${s}% · 보통`,color:"#d29922"};
    if(s<1000) return {text:`포화도 ${s}% · 높음`,color:"#f85149"};
    return {text:`포화도 ${s}% · 매우 높음`,color:"#f85149"};
  };

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px 20px"}}>
      <div style={{display:"inline-block",background:"#1f6feb",color:"#fff",fontSize:"10px",fontWeight:700,borderRadius:"4px",padding:"2px 7px",marginBottom:"8px",letterSpacing:"0.05em"}}>STEP 1</div>
      <div style={{color:"#e6edf3",fontSize:"14px",fontWeight:700,marginBottom:"12px"}}>카테고리 선택</div>
      <select value={selCat} onChange={e=>{setSelCat(e.target.value);setKeywords([]);setErr("");setStats({});setDetail({});}}
        style={{width:"100%",padding:"10px 14px",background:"#0d1117",border:"1px solid #30363d",
          borderRadius:"8px",color:selCat?"#e6edf3":"#484f58",fontSize:"14px",outline:"none",cursor:"pointer",
          fontFamily:"'Noto Sans KR',sans-serif",boxSizing:"border-box"}}>
        <option value="">── 카테고리를 선택하세요 ──</option>
        {NAVER_AUTO_CATEGORIES.map(g=>(
          <optgroup key={g.group} label={g.group}>
            {g.items.map(it=><option key={it.value} value={it.value}>{it.label}</option>)}
          </optgroup>
        ))}
      </select>
      <button onClick={genKeywords} disabled={!selCat||loadingKw}
        style={{marginTop:"12px",padding:"10px 22px",background:!selCat||loadingKw?"#21262d":"#1f6feb",
          color:!selCat||loadingKw?"#484f58":"#fff",border:"none",borderRadius:"8px",
          cursor:!selCat||loadingKw?"not-allowed":"pointer",
          fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700,transition:"background .2s"}}>
        {loadingKw?"⏳ 분석 중...":"🏷️ 추천 글 주제 10개 추출"}
      </button>
    </div>

    {err&&<div style={{background:"#2d1117",border:"1px solid #da363344",borderRadius:"10px",padding:"12px 16px",color:"#ff7b72",fontSize:"13px"}}>⚠️ {err}</div>}

    {keywords.length>0&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px 20px"}}>
      <div style={{display:"inline-block",background:"#1f6feb",color:"#fff",fontSize:"10px",fontWeight:700,borderRadius:"4px",padding:"2px 7px",marginBottom:"8px",letterSpacing:"0.05em"}}>STEP 2</div>
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px",flexWrap:"wrap"}}>
        <span style={{color:"#e6edf3",fontSize:"14px",fontWeight:700}}>추천 글 주제 & 메인 키워드</span>
        {trendingCount>0&&<span style={{background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",borderRadius:"10px",padding:"2px 9px",fontSize:"11px",fontWeight:700}}>📡 네이버 인기글 {trendingCount}</span>}
        {googleCount>0&&<span style={{background:"#3fb95022",color:"#3fb950",border:"1px solid #3fb95044",borderRadius:"10px",padding:"2px 9px",fontSize:"11px",fontWeight:700}}>📈 구글 트렌드 {googleCount}</span>}
      </div>
      <div style={{color:"#484f58",fontSize:"12px",marginBottom:"14px"}}>
        월 검색량은 네이버 광고 API 실측값입니다 · <span style={{color:"#58a6ff",fontWeight:700}}>연관검색어 · 난이도</span>를 누르면 이번 달 발행량까지 조회합니다
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {keywords.map((kw,idx)=>{
          const mainKw=kw.mainKeyword||kw.keyword;
          const st=stats[mainKw];
          const dt=detail[mainKw];
          const sat=dt?satLabel(dt.saturation):null;
          return <div key={idx} style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:"10px",padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px"}}>
              <span style={{minWidth:"24px",height:"24px",borderRadius:"50%",background:"#1f6feb22",
                color:"#58a6ff",border:"1px solid #1f6feb44",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:"11px",fontWeight:700,flexShrink:0,marginTop:"1px"}}>
                {kw.rank}
              </span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#e6edf3",fontWeight:600,fontSize:"14px",lineHeight:"1.5"}}>{kw.title||kw.keyword}</div>
                <div style={{color:"#484f58",fontSize:"11px",marginTop:"2px"}}>{kw.reason}</div>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:"8px",paddingLeft:"34px",flexWrap:"wrap"}}>
              <span style={{fontSize:"11px",color:"#8b949e",flexShrink:0}}>메인 키워드</span>
              <span style={{background:"#1f6feb15",border:"1px solid #1f6feb44",borderRadius:"6px",
                padding:"3px 10px",color:"#79c0ff",fontSize:"12px",fontWeight:700}}>
                {mainKw}
              </span>
              {st&&<span style={{fontSize:"11px",color:"#8b949e"}}>월 검색량 <b style={{color:"#e6edf3"}}>{fmt(st.monthly)}</b></span>}
              {st?.commercial&&<span title={`통합검색 평균 광고 노출 ${st.depth}개`}
                style={{background:"#f8514915",border:"1px solid #f8514944",borderRadius:"6px",padding:"2px 8px",color:"#ff7b72",fontSize:"10px",fontWeight:700}}>
                💰 상업성 키워드
              </span>}
              <div style={{marginLeft:"auto",display:"flex",gap:"6px",flexShrink:0}}>
                <button onClick={()=>loadDetail(mainKw)} disabled={dt?.loading}
                  style={{padding:"5px 12px",borderRadius:"6px",border:"1px solid #30363d",background:"#21262d",
                    color:dt?.loading?"#484f58":"#c9d1d9",fontSize:"11px",fontWeight:700,
                    cursor:dt?.loading?"wait":"pointer",fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>
                  {dt?.loading?"⏳ 조회 중":dt?"🔄 다시 조회":"📊 연관검색어 · 난이도"}
                </button>
                <button onClick={()=>goKeywordSearch(mainKw)}
                  style={{padding:"5px 12px",borderRadius:"6px",border:"none",background:"#1f6feb",color:"#fff",
                    fontSize:"11px",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#388bfd"}
                  onMouseLeave={e=>e.currentTarget.style.background="#1f6feb"}>
                  🔍 키워드 조회
                </button>
              </div>
            </div>

            {dt&&!dt.loading&&<div style={{marginTop:"10px",marginLeft:"34px",padding:"10px 12px",background:"#161b22",border:"1px solid #21262d",borderRadius:"8px"}}>
              <div style={{display:"flex",gap:"16px",flexWrap:"wrap",marginBottom:dt.related?.length?"10px":0}}>
                <span style={{fontSize:"11px",color:"#8b949e"}}>
                  이번 달 발행량 <b style={{color:"#e6edf3"}}>{fmt(dt.monthlyPosts)}</b>
                  <span style={{color:"#484f58",marginLeft:"5px"}}>
                    {dt.source==="proxy"?(dt.capped?"(실측 · 하한값)":"(실측)"):dt.source==="estimate"?"(추정 · 프록시 미연결)":""}
                  </span>
                </span>
                {dt.totalPosts!==null&&<span style={{fontSize:"11px",color:"#8b949e"}}>누적 <b style={{color:"#e6edf3"}}>{fmt(dt.totalPosts)}</b></span>}
                {sat&&<span style={{fontSize:"11px",fontWeight:700,color:sat.color}}>{sat.text}</span>}
              </div>
              {dt.related?.length>0&&<div>
                <div style={{fontSize:"11px",color:"#484f58",marginBottom:"6px",fontWeight:600}}>연관 검색어</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {dt.related.map((r,i)=>(
                    <button key={i} onClick={()=>goKeywordSearch(r.keyword)}
                      title={r.commercial?"통합검색에서 광고가 먼저 뜨는 상업성 키워드":""}
                      style={{padding:"4px 9px",borderRadius:"6px",cursor:"pointer",
                        fontFamily:"'Noto Sans KR',sans-serif",fontSize:"11px",
                        background:"#0d1117",
                        border:`1px solid ${r.commercial?"#f8514944":"#30363d"}`,
                        color:r.commercial?"#ff7b72":"#c9d1d9"}}>
                      {r.commercial?"💰 ":""}{r.keyword}
                      {r.monthly!==null&&<span style={{color:"#484f58",marginLeft:"5px"}}>{fmt(r.monthly)}</span>}
                    </button>
                  ))}
                </div>
              </div>}
              {!dt.related?.length&&<div style={{fontSize:"11px",color:"#484f58"}}>연관 검색어가 조회되지 않았습니다 (광고 DB에 없는 키워드일 수 있어요)</div>}
            </div>}
          </div>;
        })}
      </div>
    </div>}
  </div>;
}

// ─── TAB: EXIF 제거 ──────────────────────────────────────────────────────
// piexifjs (CDN) 으로 JPEG EXIF 완전 제거
// PNG/WebP/GIF 는 Canvas re-draw 로 메타데이터 제거
// PDF 는 텍스트 재패키징 방식 (기본 메타만 제거)
// 모든 처리 100% 브라우저 로컬 — 파일 서버 전송 없음

const EXIF_SUPPORTED = ["image/jpeg","image/jpg","image/png","image/webp","image/gif"];

function readableTag(key, val) {
  if (val === undefined || val === null) return "";
  if (typeof val === "object" && val.numerator !== undefined) return `${val.numerator}/${val.denominator}`;
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "string") return val.replace(/\x00/g,"").trim();
  return String(val);
}

function ExifTab() {
  const [files, setFiles] = useState([]);       // [{file, url, name, type, size, meta, cleaned, cleanedUrl, status}]
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [allSaved, setAllSaved] = useState(false);
  const inputRef = useRef(null);

  // ── 파일 추가 ──
  const addFiles = async (newFiles) => {
    const arr = Array.from(newFiles).slice(0, 20 - files.length);
    const entries = arr.map(f => ({
      file: f, name: f.name, type: f.type, size: f.size,
      url: URL.createObjectURL(f),
      meta: null, cleaned: null, cleanedUrl: null, status: "idle",
    }));
    setFiles(prev => {
      const next = [...prev, ...entries];
      // 자동으로 메타데이터 파싱
      next.slice(prev.length).forEach((_, i) => parseMeta(prev.length + i, next[prev.length + i].file, next));
      return next;
    });
  };

  // ── EXIF 메타데이터 파싱 ──
  const parseMeta = async (idx, file, currentFiles) => {
    try {
      const buf = await file.arrayBuffer();
      const view = new DataView(buf);
      const tags = {};

      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        // JPEG: EXIF 마커 파싱
        let offset = 2;
        while (offset < view.byteLength - 2) {
          const marker = view.getUint16(offset);
          if (marker === 0xFFE1) { // APP1 (EXIF)
            const len = view.getUint16(offset + 2);
            const exifData = new Uint8Array(buf, offset + 4, len - 2);
            const str = Array.from(exifData.slice(0, 4)).map(b => String.fromCharCode(b)).join("");
            if (str === "Exif") {
              // 기본 EXIF 태그 추출
              const tiffOffset = offset + 10;
              const littleEndian = view.getUint16(tiffOffset) === 0x4949;
              const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
              const tagCount = view.getUint16(tiffOffset + ifdOffset, littleEndian);
              const TAG_NAMES = {
                0x010F:"카메라 제조사", 0x0110:"카메라 모델", 0x0112:"방향",
                0x011A:"X 해상도", 0x011B:"Y 해상도", 0x0128:"해상도 단위",
                0x0132:"수정 날짜", 0x013B:"작성자", 0x8769:"EXIF IFD",
                0x8825:"GPS IFD", 0x9000:"EXIF 버전", 0x9003:"원본 촬영일",
                0x9004:"디지털화 날짜", 0x9201:"셔터 속도", 0x9202:"조리개",
                0x9203:"밝기", 0x9204:"노출 보정", 0x9205:"최대 조리개",
                0x9207:"측광 모드", 0x9208:"광원", 0x9209:"플래시",
                0x920A:"초점 거리", 0xA002:"이미지 너비", 0xA003:"이미지 높이",
                0xA433:"렌즈 제조사", 0xA434:"렌즈 모델",
              };
              for (let i = 0; i < Math.min(tagCount, 30); i++) {
                const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
                if (entryOffset + 12 > view.byteLength) break;
                const tagId = view.getUint16(entryOffset, littleEndian);
                const tagName = TAG_NAMES[tagId] || `TAG_0x${tagId.toString(16).toUpperCase()}`;
                const type = view.getUint16(entryOffset + 2, littleEndian);
                const count = view.getUint32(entryOffset + 4, littleEndian);
                let val = "";
                if (type === 2) { // ASCII
                  const vOffset = count > 4 ? view.getUint32(entryOffset + 8, littleEndian) + tiffOffset : entryOffset + 8;
                  val = "";
                  for (let j = 0; j < count - 1 && vOffset + j < view.byteLength; j++) {
                    const c = view.getUint8(vOffset + j);
                    if (c) val += String.fromCharCode(c);
                  }
                } else if (type === 3) { val = view.getUint16(entryOffset + 8, littleEndian); }
                else if (type === 4) { val = view.getUint32(entryOffset + 8, littleEndian); }
                else if (type === 5) { // RATIONAL
                  const rOffset = view.getUint32(entryOffset + 8, littleEndian) + tiffOffset;
                  if (rOffset + 8 <= view.byteLength) {
                    const n = view.getUint32(rOffset, littleEndian);
                    const d = view.getUint32(rOffset + 4, littleEndian);
                    val = d ? `${n}/${d}` : n;
                  }
                }
                if (val !== "" && val !== undefined) tags[tagName] = String(val);
              }
              // GPS 간단 감지
              if (Object.keys(tags).some(k => k.includes("GPS"))) {
                tags["⚠️ GPS 정보"] = "위치 정보 포함됨 — 제거 권장";
              }
            }
            break;
          }
          if (marker === 0xFFDA) break;
          offset += 2 + view.getUint16(offset + 2);
        }
      }

      // 공통 메타
      tags["파일명"] = file.name;
      tags["파일 크기"] = fmtSize(file.size);
      tags["파일 형식"] = file.type || "알 수 없음";

      // 이미지 크기
      await new Promise(res => {
        const img = new Image();
        img.onload = () => { tags["이미지 크기"] = `${img.naturalWidth} × ${img.naturalHeight} px`; res(); };
        img.onerror = res;
        img.src = URL.createObjectURL(file);
      });

      setFiles(prev => prev.map((f, i) => i === idx ? { ...f, meta: tags, status: "parsed" } : f));
    } catch(e) {
      setFiles(prev => prev.map((f, i) => i === idx ? { ...f, meta: { "오류": "메타데이터 파싱 실패" }, status: "error" } : f));
    }
  };

  // ── EXIF 제거 (단일) ──
  const removeExif = async (idx) => {
    const f = files[idx];
    if (!f || !EXIF_SUPPORTED.includes(f.type)) return;
    setFiles(prev => prev.map((ff, i) => i === idx ? { ...ff, status: "cleaning" } : ff));

    try {
      let cleanedBlob;
      if (f.type === "image/jpeg" || f.type === "image/jpg") {
        // JPEG: EXIF APP1 마커 제거 후 재조립
        const buf = await f.file.arrayBuffer();
        const src = new Uint8Array(buf);
        const out = [];
        let i = 0;
        // SOI 마커 유지
        out.push(src[0], src[1]);
        i = 2;
        while (i < src.length - 1) {
          if (src[i] !== 0xFF) { i++; continue; }
          const marker = (src[i] << 8) | src[i+1];
          if (marker === 0xFFDA) { // SOS — 나머지 전부 복사
            for (let j = i; j < src.length; j++) out.push(src[j]);
            break;
          }
          const segLen = (src[i+2] << 8) | src[i+3];
          // APP1(EXIF), APP2~APP15 제거, 나머지 유지
          if (marker >= 0xFFE1 && marker <= 0xFFEF) {
            i += 2 + segLen; // skip
          } else {
            for (let j = i; j < i + 2 + segLen && j < src.length; j++) out.push(src[j]);
            i += 2 + segLen;
          }
        }
        cleanedBlob = new Blob([new Uint8Array(out)], { type: "image/jpeg" });
      } else {
        // PNG / WebP / GIF: Canvas re-draw (메타데이터 전부 제거됨)
        cleanedBlob = await new Promise((res, rej) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const mime = f.type === "image/gif" ? "image/png" : f.type;
            canvas.toBlob(b => b ? res(b) : rej(new Error("canvas toBlob 실패")), mime, 0.95);
          };
          img.onerror = rej;
          img.src = f.url;
        });
      }

      const cleanedUrl = URL.createObjectURL(cleanedBlob);
      const cleanedMeta = {
        "파일명": f.name, "파일 크기": fmtSize(cleanedBlob.size),
        "파일 형식": cleanedBlob.type,
        "✅ 상태": "EXIF 메타데이터 제거 완료",
      };
      setFiles(prev => prev.map((ff, i) => i === idx
        ? { ...ff, cleaned: cleanedBlob, cleanedUrl, meta: cleanedMeta, status: "done" }
        : ff));
    } catch(e) {
      setFiles(prev => prev.map((ff, i) => i === idx ? { ...ff, status: "error" } : ff));
    }
  };

  // ── 일괄 제거 ──
  const removeAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "done") await removeExif(i);
    }
  };

  // ── 저장 ──
  const saveFile = (idx) => {
    const f = files[idx];
    const blob = f.cleaned || f.file;
    const ext = f.name.split(".").pop();
    const name = f.cleaned ? `EXIF제거_${f.name}` : f.name;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const saveAll = () => {
    files.forEach((_, i) => saveFile(i));
    setAllSaved(true);
    setTimeout(() => setAllSaved(false), 2000);
  };

  // ── 메타 테이블 필터 ──
  const curMeta = files[selected]?.meta || {};
  const metaRows = Object.entries(curMeta).filter(([k]) =>
    !search || k.toLowerCase().includes(search.toLowerCase()) ||
    String(curMeta[k]).toLowerCase().includes(search.toLowerCase())
  );

  const hasGps = Object.keys(curMeta).some(k => k.includes("GPS") || k.includes("위치"));

  return <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    <style>{`
      @keyframes exifSpin { to { transform: rotate(360deg); } }
      .exif-drop:hover { border-color: #58a6ff !important; background: #0d1e3322 !important; }
    `}</style>

    {/* 파일 추가 영역 */}
    <div className="exif-drop"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()} onTouchEnd={e=>{e.preventDefault();inputRef.current?.click();}}
      style={{
        border: `2px dashed ${dragging ? "#58a6ff" : "#30363d"}`,
        borderRadius: "12px", padding: "28px 20px", textAlign: "center",
        cursor: "pointer", background: dragging ? "#0d1e3333" : "#0d1117",
        transition: "all .2s",
      }}>
      <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: "none" }}
        onChange={e => addFiles(e.target.files)} />
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔒</div>
      <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
        이미지를 드래그하거나 클릭해서 추가
      </div>
      <div style={{ color: "#484f58", fontSize: "12px" }}>
        JPEG · PNG · WebP · GIF 지원 · 최대 20개 · 모든 처리는 브라우저 로컬에서만 진행 (서버 전송 없음)
      </div>
    </div>

    {/* 파일 목록 */}
    {files.length > 0 && <>
      {/* 상단 액션 바 */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={removeAll}
          style={{ padding: "8px 16px", background: "#1f6feb", color: "#fff", border: "none",
            borderRadius: "8px", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif",
            fontSize: "13px", fontWeight: 700 }}>
          🗑️ 일괄 EXIF 제거
        </button>
        <button onClick={saveAll}
          style={{ padding: "8px 16px", background: allSaved ? "#2ea043" : "#21262d",
            color: allSaved ? "#fff" : "#8b949e", border: "1px solid #30363d",
            borderRadius: "8px", cursor: "pointer", fontFamily: "'Noto Sans KR',sans-serif",
            fontSize: "13px", fontWeight: 600, transition: "all .2s" }}>
          {allSaved ? "✅ 저장됨!" : "⬇️ 모두 저장"}
        </button>
        <button onClick={() => setFiles([])}
          style={{ padding: "8px 14px", background: "#21262d", color: "#8b949e",
            border: "1px solid #30363d", borderRadius: "8px", cursor: "pointer",
            fontFamily: "'Noto Sans KR',sans-serif", fontSize: "13px" }}>
          🗑️ 초기화
        </button>
        <span style={{ color: "#484f58", fontSize: "12px", marginLeft: "auto" }}>
          {files.filter(f => f.status === "done").length} / {files.length} 완료
        </span>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
        {/* 썸네일 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "180px", maxWidth: "200px" }}>
          {files.map((f, i) => (
            <div key={i} onClick={() => setSelected(i)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 10px", borderRadius: "8px", cursor: "pointer",
                background: selected === i ? "#161b22" : "#0d1117",
                border: `1px solid ${selected === i ? "#1f6feb66" : "#21262d"}`,
                transition: "all .15s",
              }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "6px", overflow: "hidden",
                background: "#21262d", flexShrink: 0, position: "relative" }}>
                <img src={f.cleanedUrl || f.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {f.status === "done" && <div style={{ position: "absolute", bottom: 0, right: 0,
                  background: "#2ea043", borderRadius: "3px 0 0 0", padding: "1px 3px", fontSize: "9px" }}>✓</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#e6edf3", fontSize: "11px", fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                <div style={{ fontSize: "10px", color:
                  f.status === "done" ? "#3fb950" :
                  f.status === "cleaning" ? "#ffa657" :
                  f.status === "error" ? "#ff7b72" : "#484f58" }}>
                  {f.status === "done" ? "✅ 제거 완료" :
                   f.status === "cleaning" ? "⏳ 처리중..." :
                   f.status === "error" ? "❌ 오류" :
                   fmtSize(f.size)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 메타데이터 패널 */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* 선택 파일 프리뷰 + 액션 */}
          {files[selected] && <div style={{ background: "#161b22", border: "1px solid #30363d",
            borderRadius: "10px", padding: "14px 16px", display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <img src={files[selected].cleanedUrl || files[selected].url} alt=""
              style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px",
                border: "1px solid #30363d", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: "14px", marginBottom: "4px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {files[selected].name}
              </div>
              <div style={{ color: "#8b949e", fontSize: "12px", marginBottom: "8px" }}>
                {fmtSize(files[selected].size)} · {files[selected].type}
              </div>
              {hasGps && files[selected].status !== "done" && (
                <div style={{ background: "#2d1117", border: "1px solid #f8514944",
                  borderRadius: "6px", padding: "6px 10px", fontSize: "12px",
                  color: "#ff7b72", marginBottom: "8px" }}>
                  ⚠️ GPS 위치 정보가 포함되어 있습니다. 제거를 권장합니다.
                </div>
              )}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {files[selected].status !== "done" ? (
                  <button onClick={() => removeExif(selected)}
                    disabled={files[selected].status === "cleaning"}
                    style={{ padding: "7px 14px", background: files[selected].status === "cleaning" ? "#21262d" : "#da3633",
                      color: files[selected].status === "cleaning" ? "#484f58" : "#fff",
                      border: "none", borderRadius: "7px", cursor: files[selected].status === "cleaning" ? "not-allowed" : "pointer",
                      fontFamily: "'Noto Sans KR',sans-serif", fontSize: "12px", fontWeight: 700 }}>
                    {files[selected].status === "cleaning" ? "⏳ 처리중..." : "🗑️ EXIF 제거"}
                  </button>
                ) : (
                  <div style={{ color: "#3fb950", fontSize: "13px", fontWeight: 700, alignSelf: "center" }}>
                    ✅ EXIF 제거 완료
                  </div>
                )}
                <button onClick={() => saveFile(selected)}
                  style={{ padding: "7px 14px", background: "#21262d", color: "#8b949e",
                    border: "1px solid #30363d", borderRadius: "7px", cursor: "pointer",
                    fontFamily: "'Noto Sans KR',sans-serif", fontSize: "12px" }}>
                  ⬇️ {files[selected].status === "done" ? "정리된 파일 저장" : "원본 저장"}
                </button>
                <button onClick={() => setFiles(prev => prev.filter((_, i) => i !== selected))}
                  style={{ padding: "7px 10px", background: "#21262d", color: "#8b949e",
                    border: "1px solid #30363d", borderRadius: "7px", cursor: "pointer", fontSize: "12px" }}>
                  ✕
                </button>
              </div>
            </div>
          </div>}

          {/* 메타데이터 테이블 */}
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #21262d",
              display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#8b949e", fontSize: "12px", fontWeight: 700 }}>
                📋 메타데이터 ({metaRows.length}개)
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="태그 검색 (예: GPS, 날짜)"
                style={{ flex: 1, padding: "5px 10px", background: "#0d1117",
                  border: "1px solid #30363d", borderRadius: "6px", color: "#e6edf3",
                  fontSize: "12px", outline: "none", fontFamily: "'Noto Sans KR',sans-serif" }} />
            </div>
            {metaRows.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#484f58", fontSize: "13px" }}>
                {files[selected] ? (search ? "검색 결과 없음" : "메타데이터 분석 중...") : "파일을 선택하세요"}
              </div>
            ) : (
              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#0d1117" }}>
                      <th style={{ padding: "8px 14px", color: "#484f58", fontWeight: 600,
                        textAlign: "left", borderBottom: "1px solid #21262d", width: "40%" }}>태그</th>
                      <th style={{ padding: "8px 14px", color: "#484f58", fontWeight: 600,
                        textAlign: "left", borderBottom: "1px solid #21262d" }}>값</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaRows.map(([k, v], i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #21262d22",
                        background: k.includes("⚠️") ? "#2d111711" : k.includes("✅") ? "#0d201911" : "transparent" }}>
                        <td style={{ padding: "7px 14px", color: k.includes("⚠️") ? "#ff7b72" : k.includes("✅") ? "#3fb950" : "#8b949e",
                          fontWeight: k.includes("⚠️") || k.includes("✅") ? 700 : 400 }}>{k}</td>
                        <td style={{ padding: "7px 14px", color: "#c9d1d9", wordBreak: "break-all" }}>{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 개인정보 안내 */}
          <div style={{ background: "#0d1a2d", border: "1px solid #1f6feb33",
            borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#484f58" }}>
            🔒 <span style={{ color: "#58a6ff" }}>100% 로컬 처리</span> — 파일이 서버로 전송되지 않습니다.
            모든 EXIF 제거는 브라우저 내에서만 실행됩니다.
          </div>
        </div>
      </div>
    </>}

    {/* 빈 상태 안내 */}
    {files.length === 0 && <div style={{ background: "#161b22", border: "1px solid #30363d",
      borderRadius: "12px", padding: "24px 20px" }}>
      <div style={{ color: "#8b949e", fontSize: "12px", fontWeight: 700, marginBottom: "12px" }}>
        📌 EXIF란?
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[
          ["📍 GPS 좌표", "사진에 집/직장 위치가 기록됩니다"],
          ["📷 카메라 정보", "제조사, 모델, 렌즈 정보가 포함됩니다"],
          ["🕐 촬영 날짜/시간", "정확한 촬영 시간이 저장됩니다"],
          ["🔢 기기 일련번호", "익명 사진도 기기로 추적 가능합니다"],
        ].map(([icon, desc], i) => (
          <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "14px" }}>{icon.split(" ")[0]}</span>
            <div>
              <span style={{ color: "#e6edf3", fontSize: "13px", fontWeight: 600 }}>{icon.slice(2)}</span>
              <span style={{ color: "#484f58", fontSize: "12px" }}> — {desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>}
  </div>;
}

// ─── TAB: 이미지 자르기 ──────────────────────────────────────────────────
function CropTab() {
  const [img, setImg] = useState(null);       // {src, el, w, h, name, type}
  const [sliceH, setSliceH] = useState(8000);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const fileRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const PREVIEW_MAX_W = 480;
  const COLORS = ["#f59e0b","#10b981","#6366f1","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316"];

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => {
      setImg({src:url, el, w:el.naturalWidth, h:el.naturalHeight, name:file.name.replace(/\.[^.]+$/,""), type:file.type});
    };
    el.src = url;
  };

  const getSlices = () => {
    if (!img || !sliceH || sliceH < 1) return [];
    const slices = [];
    let y = 0;
    while (y < img.h) {
      const h = Math.min(sliceH, img.h - y);
      slices.push({y, h});
      y += h;
    }
    return slices;
  };

  const slices = getSlices();
  const scale = img ? Math.min(1, PREVIEW_MAX_W / img.w) : 1;
  const pw = img ? Math.round(img.w * scale) : 0;
  const ph = img ? Math.round(img.h * scale) : 0;

  const fullCount = slices.filter(s => s.h === sliceH).length;
  const remSlice = slices.find(s => s.h !== sliceH);

  const downloadAll = async () => {
    if (!img || !slices.length) return;
    setDownloading(true);
    setDlProgress(0);
    for (let i = 0; i < slices.length; i++) {
      const {y, h} = slices[i];
      const out = document.createElement("canvas");
      out.width = img.w; out.height = h;
      out.getContext("2d").drawImage(img.el, 0, y, img.w, h, 0, 0, img.w, h);
      await new Promise(res => {
        out.toBlob(blob => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${img.name}-${i+1}.png`;
          a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); res(); }, 300);
        }, "image/png");
      });
      setDlProgress(i + 1);
      await new Promise(r => setTimeout(r, 200));
    }
    setDownloading(false);
  };

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

    {/* 업로드 */}
    {!img && <div onClick={()=>fileRef.current?.click()}
      onTouchEnd={e=>{e.preventDefault();fileRef.current?.click();}}
      onDragOver={e=>e.preventDefault()}
      onDrop={e=>{e.preventDefault();loadFile(e.dataTransfer.files[0]);}}
      style={{border:"2px dashed #30363d",borderRadius:"12px",padding:"32px",textAlign:"center",
        cursor:"pointer",background:"#0d1117"}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])}/>
      <div style={{fontSize:"28px",marginBottom:"8px"}}>✂️</div>
      <div style={{color:"#e6edf3",fontWeight:700,fontSize:"14px",marginBottom:"4px"}}>이미지를 드래그하거나 클릭해서 업로드</div>
      <div style={{color:"#484f58",fontSize:"12px"}}>JPG · PNG · WebP · GIF 지원</div>
    </div>}

    {img && <>
      {/* 컨트롤 바 */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"12px 16px",
        display:"flex",flexWrap:"wrap",gap:"14px",alignItems:"center"}}>

        <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
          <span style={{color:"#484f58",fontSize:"10px",fontWeight:700}}>원본 크기</span>
          <span style={{color:"#e6edf3",fontSize:"13px",fontWeight:700}}>{img.w} × {img.h}px</span>
        </div>

        <div style={{width:"1px",height:"32px",background:"#30363d"}}/>

        <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
          <span style={{color:"#484f58",fontSize:"10px",fontWeight:700}}>기준 높이 (px)</span>
          <input type="number" value={sliceH} min={1} max={img.h}
            onChange={e=>setSliceH(Math.max(1,parseInt(e.target.value)||1))}
            style={{width:"100px",padding:"5px 8px",background:"#0d1117",border:"1px solid #30363d",
              borderRadius:"6px",color:"#e6edf3",fontSize:"13px",outline:"none",
              fontFamily:"'Noto Sans KR',sans-serif"}}/>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
          <span style={{color:"#484f58",fontSize:"10px",fontWeight:700}}>분할 결과</span>
          <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
            {fullCount > 0 && <span style={{fontSize:"12px",fontWeight:700,padding:"2px 10px",
              borderRadius:"99px",background:"#f59e0b22",color:"#f59e0b"}}>
              {fullCount}장 × {sliceH}px
            </span>}
            {remSlice && <span style={{fontSize:"12px",fontWeight:700,padding:"2px 10px",
              borderRadius:"99px",background:"#10b98122",color:"#10b981"}}>
              나머지 1장 × {remSlice.h}px
            </span>}
            <span style={{fontSize:"11px",color:"#484f58"}}>총 {slices.length}장</span>
          </div>
        </div>

        <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center"}}>
          <button onClick={()=>setImg(null)}
            style={{padding:"6px 10px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
              borderRadius:"7px",cursor:"pointer",fontSize:"12px"}}>✕ 취소</button>
          <button onClick={downloadAll} disabled={downloading || slices.length===0}
            style={{padding:"7px 18px",background:downloading?"#21262d":"#1f6feb",
              color:downloading?"#484f58":"#fff",border:"none",borderRadius:"7px",
              cursor:downloading?"not-allowed":"pointer",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700}}>
            {downloading ? `⬇️ ${dlProgress}/${slices.length} 저장 중...` : `⬇️ 전체 다운로드 (${slices.length}장)`}
          </button>
        </div>
      </div>

      {/* 프리뷰 */}
      <div style={{display:"flex",gap:"16px",flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* 이미지 + 분할선 */}
        <div>
          <div style={{color:"#484f58",fontSize:"11px",marginBottom:"6px",fontWeight:600}}>
            미리보기 — 점선이 분할 위치
          </div>
          <div ref={canvasWrapRef} style={{position:"relative",display:"inline-block",
            lineHeight:0,border:"1px solid #30363d",borderRadius:"8px",overflow:"hidden"}}>
            <img src={img.src} style={{width:pw,height:ph,display:"block"}} draggable={false} alt=""/>
            {slices.map((s, i) => {
              if (i === 0) return null;
              const color = COLORS[i % COLORS.length];
              return <div key={i} style={{position:"absolute",left:0,right:0,
                top: Math.round(s.y * scale),
                borderTop:`2px dashed ${color}`,pointerEvents:"none"}}>
                <span style={{fontSize:"10px",fontWeight:700,padding:"1px 5px",
                  background:`${color}cc`,color:"#fff",borderRadius:"0 3px 3px 0",display:"inline-block"}}>
                  {img.name}-{i+1} · {s.h}px
                </span>
              </div>;
            })}
          </div>
        </div>

        {/* 조각 목록 */}
        <div style={{flex:1,minWidth:"180px"}}>
          <div style={{color:"#484f58",fontSize:"11px",marginBottom:"6px",fontWeight:600}}>조각 목록</div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {slices.map((s, i) => {
              const color = COLORS[i % COLORS.length];
              const isRem = s.h !== sliceH;
              return <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",
                background:"#161b22",border:"1px solid #30363d",borderRadius:"8px",padding:"7px 10px"}}>
                <span style={{width:"10px",height:"10px",borderRadius:"50%",
                  background:color,flexShrink:0,display:"inline-block"}}/>
                <span style={{fontSize:"12px",color:"#c9d1d9",fontWeight:700,minWidth:"80px"}}>
                  {img.name}-{i+1}
                </span>
                <span style={{fontSize:"12px",color:"#8b949e"}}>
                  {img.w} × {s.h}px
                </span>
                {isRem && <span style={{fontSize:"10px",padding:"1px 7px",borderRadius:"99px",
                  background:"#10b98122",color:"#10b981",marginLeft:"auto"}}>나머지</span>}
              </div>;
            })}
          </div>
        </div>
      </div>
    </>}
  </div>;
}

// ─── TAB: 이미지 크기조절 ────────────────────────────────────────────────
function ResizeTab() {
  const [img, setImg] = useState(null);
  const [mode, setMode] = useState("px");   // "px" | "percent"
  const [w, setW] = useState(0);
  const [h, setH] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      setImg({src:url, w:i.naturalWidth, h:i.naturalHeight, name:file.name, type:file.type});
      setW(i.naturalWidth); setH(i.naturalHeight); setResult(null);
    };
    i.src = url;
  };

  const ratio = img ? img.w / img.h : 1;

  const handleW = (val) => {
    const n = parseInt(val) || 0;
    setW(n);
    if (lockRatio && mode === "px") setH(Math.round(n / ratio));
  };
  const handleH = (val) => {
    const n = parseInt(val) || 0;
    setH(n);
    if (lockRatio && mode === "px") setW(Math.round(n * ratio));
  };
  const handlePct = (val) => {
    const p = parseFloat(val) || 0;
    setW(p); setH(p);
  };

  const doResize = () => {
    if (!img || w < 1 || h < 1) return;
    setProcessing(true);
    const tw = mode === "percent" ? Math.round(img.w * w / 100) : w;
    const th = mode === "percent" ? Math.round(img.h * h / 100) : h;
    const canvas = canvasRef.current;
    canvas.width = tw; canvas.height = th;
    const ctx = canvas.getContext("2d");
    const src = new Image(); src.src = img.src;
    src.onload = () => {
      ctx.drawImage(src, 0, 0, tw, th);
      canvas.toBlob(blob => {
        setResult({url: URL.createObjectURL(blob), w:tw, h:th, size:blob.size, blob});
        setProcessing(false);
      }, img.type || "image/png", 0.92);
    };
  };

  const doSave = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url; a.download = `resize_${img.name}`; a.click();
  };

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <canvas ref={canvasRef} style={{display:"none"}}/>

    {!img && <div onClick={()=>fileRef.current?.click()} onTouchEnd={e=>{e.preventDefault();fileRef.current?.click();}}
      onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadFile(e.dataTransfer.files[0]);}}
      style={{border:"2px dashed #30363d",borderRadius:"12px",padding:"32px",textAlign:"center",cursor:"pointer",background:"#0d1117"}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])}/>
      <div style={{fontSize:"28px",marginBottom:"8px"}}>↔️</div>
      <div style={{color:"#e6edf3",fontWeight:700,fontSize:"14px",marginBottom:"4px"}}>이미지를 드래그하거나 클릭해서 업로드</div>
      <div style={{color:"#484f58",fontSize:"12px"}}>JPG · PNG · WebP · GIF 지원</div>
    </div>}

    {img && <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {/* 옵션 패널 */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"14px 16px"}}>
        <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"12px"}}>↔️ 크기 설정</div>

        {/* 모드 선택 */}
        <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
          {[["px","픽셀 (px)"],["percent","퍼센트 (%)"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)}
              style={{padding:"6px 14px",background:mode===v?"#1f6feb":"#21262d",
                color:mode===v?"#fff":"#8b949e",border:`1px solid ${mode===v?"#1f6feb":"#30363d"}`,
                borderRadius:"7px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
          {mode === "px" ? <>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <span style={{color:"#484f58",fontSize:"10px"}}>너비 (px)</span>
              <input type="number" value={w} min={1} onChange={e=>handleW(e.target.value)}
                style={{width:"100px",padding:"7px 10px",background:"#0d1117",border:"1px solid #30363d",
                  borderRadius:"7px",color:"#e6edf3",fontSize:"14px",outline:"none",fontFamily:"'Noto Sans KR',sans-serif"}}/>
            </div>
            <div style={{color:"#484f58",fontSize:"18px",paddingTop:"14px"}}>×</div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <span style={{color:"#484f58",fontSize:"10px"}}>높이 (px)</span>
              <input type="number" value={h} min={1} onChange={e=>handleH(e.target.value)}
                style={{width:"100px",padding:"7px 10px",background:"#0d1117",border:"1px solid #30363d",
                  borderRadius:"7px",color:"#e6edf3",fontSize:"14px",outline:"none",fontFamily:"'Noto Sans KR',sans-serif"}}/>
            </div>
            <div style={{paddingTop:"14px"}}>
              <button onClick={()=>setLockRatio(!lockRatio)}
                style={{padding:"7px 12px",background:lockRatio?"#1f6feb22":"#21262d",
                  color:lockRatio?"#58a6ff":"#484f58",border:`1px solid ${lockRatio?"#1f6feb44":"#30363d"}`,
                  borderRadius:"7px",cursor:"pointer",fontSize:"13px"}}>
                {lockRatio?"🔒 비율 고정":"🔓 비율 해제"}
              </button>
            </div>
          </> : <>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              <span style={{color:"#484f58",fontSize:"10px"}}>비율 (%)</span>
              <input type="number" value={w} min={1} max={300} onChange={e=>handlePct(e.target.value)}
                style={{width:"100px",padding:"7px 10px",background:"#0d1117",border:"1px solid #30363d",
                  borderRadius:"7px",color:"#e6edf3",fontSize:"14px",outline:"none",fontFamily:"'Noto Sans KR',sans-serif"}}/>
            </div>
            <div style={{color:"#8b949e",fontSize:"13px",paddingTop:"14px"}}>
              → {Math.round(img.w*w/100)} × {Math.round(img.h*w/100)} px
            </div>
          </>}

          {/* 빠른 프리셋 */}
          <div style={{display:"flex",gap:"5px",flexWrap:"wrap",paddingTop:"14px"}}>
            {[[640,480],[800,600],[1280,720],[1920,1080]].map(([pw,ph])=>(
              <button key={pw} onClick={()=>{setMode("px");setW(pw);setH(lockRatio?Math.round(pw/ratio):ph);}}
                style={{padding:"4px 8px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
                  borderRadius:"5px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"10px"}}>
                {pw}×{ph}
              </button>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:"8px",marginTop:"14px",alignItems:"center"}}>
          <button onClick={doResize} disabled={processing||w<1||h<1}
            style={{padding:"8px 20px",background:processing?"#21262d":"#1f6feb",color:processing?"#484f58":"#fff",
              border:"none",borderRadius:"8px",cursor:processing?"not-allowed":"pointer",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700}}>
            {processing?"⏳ 처리중...":"↔️ 크기 조절"}
          </button>
          {result && <button onClick={doSave}
            style={{padding:"8px 16px",background:"#2ea043",color:"#fff",border:"none",
              borderRadius:"8px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700}}>
            ⬇️ 저장
          </button>}
          <button onClick={()=>{setImg(null);setResult(null);}}
            style={{padding:"8px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
              borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>✕ 초기화</button>
        </div>
      </div>

      {/* 비교 프리뷰 */}
      <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:"#484f58",fontSize:"11px",marginBottom:"6px",fontWeight:600}}>
            원본 ({img.w}×{img.h}px)
          </div>
          <img src={img.src} style={{maxWidth:"100%",maxHeight:"280px",borderRadius:"8px",
            border:"1px solid #30363d",objectFit:"contain"}} alt=""/>
        </div>
        {result && <div style={{flex:1,minWidth:0}}>
          <div style={{color:"#3fb950",fontSize:"11px",marginBottom:"6px",fontWeight:600}}>
            ✅ 결과 ({result.w}×{result.h}px · {fmtSize(result.size)})
          </div>
          <img src={result.url} style={{maxWidth:"100%",maxHeight:"280px",borderRadius:"8px",
            border:"1px solid #2ea04344",objectFit:"contain"}} alt=""/>
        </div>}
      </div>
    </div>}
  </div>;
}

// ─── TAB: 이미지 압축 ────────────────────────────────────────────────────
function ImgCompressTab() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);
  const [allSaved, setAllSaved] = useState(false);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const loadFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f => f.type.startsWith("image/")).slice(0, 20 - files.length);
    const entries = arr.map(f => ({
      file:f, name:f.name, type:f.type, origSize:f.size,
      url:URL.createObjectURL(f), result:null, status:"idle",
    }));
    setFiles(prev => [...prev, ...entries]);
  };

  const compressOne = async (idx, q) => {
    const f = files[idx];
    return new Promise(res => {
      const img = new Image(); img.src = f.url;
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const mime = (f.type === "image/png" || f.type === "image/gif") ? "image/png" : "image/jpeg";
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const saved = Math.round((1 - blob.size / f.origSize) * 100);
          setFiles(prev => prev.map((ff, i) => i === idx
            ? {...ff, result:{blob, url, size:blob.size, saved}, status:"done"}
            : ff));
          res();
        }, mime, q / 100);
      };
    });
  };

  const compressAll = async () => {
    setProcessing(true);
    for (let i = 0; i < files.length; i++) {
      setFiles(prev => prev.map((f, idx) => idx===i ? {...f, status:"processing"} : f));
      await compressOne(i, quality);
    }
    setProcessing(false);
  };

  const saveOne = (f) => {
    const blob = f.result?.blob || f.file;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `compressed_${f.name}`; a.click();
  };

  const saveAll = () => {
    files.forEach(f => saveOne(f));
    setAllSaved(true); setTimeout(()=>setAllSaved(false), 2000);
  };

  const totalOrig = files.reduce((s,f)=>s+f.origSize, 0);
  const totalComp = files.reduce((s,f)=>s+(f.result?.size||f.origSize), 0);
  const totalSaved = totalOrig > 0 ? Math.round((1-totalComp/totalOrig)*100) : 0;

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <canvas ref={canvasRef} style={{display:"none"}}/>

    {/* 업로드 */}
    <div onClick={()=>fileRef.current?.click()} onTouchEnd={e=>{e.preventDefault();fileRef.current?.click();}}
      onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadFiles(e.dataTransfer.files);}}
      style={{border:"2px dashed #30363d",borderRadius:"12px",padding:"24px",textAlign:"center",
        cursor:"pointer",background:"#0d1117"}}>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>loadFiles(e.target.files)}/>
      <div style={{fontSize:"26px",marginBottom:"6px"}}>🗜️</div>
      <div style={{color:"#e6edf3",fontWeight:700,fontSize:"14px",marginBottom:"3px"}}>이미지를 드래그하거나 클릭해서 업로드</div>
      <div style={{color:"#484f58",fontSize:"12px"}}>JPG · PNG · WebP · GIF · 최대 20개</div>
    </div>

    {/* 품질 슬라이더 + 액션 */}
    {files.length > 0 && <>
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"14px",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:"180px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
              <span style={{color:"#8b949e",fontSize:"12px",fontWeight:700}}>압축 품질</span>
              <span style={{color:quality>=80?"#3fb950":quality>=50?"#ffa657":"#ff7b72",fontSize:"14px",fontWeight:700}}>
                {quality}% {quality>=80?"(고품질)":quality>=50?"(균형)":"(고압축)"}
              </span>
            </div>
            <input type="range" min={10} max={100} value={quality} onChange={e=>setQuality(+e.target.value)}
              style={{width:"100%",accentColor:"#1f6feb"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:"3px"}}>
              <span style={{color:"#484f58",fontSize:"10px"}}>최대 압축</span>
              <span style={{color:"#484f58",fontSize:"10px"}}>최고 품질</span>
            </div>
          </div>
          <div style={{display:"flex",gap:"8px",flexShrink:0}}>
            <button onClick={compressAll} disabled={processing}
              style={{padding:"9px 18px",background:processing?"#21262d":"#1f6feb",color:processing?"#484f58":"#fff",
                border:"none",borderRadius:"8px",cursor:processing?"not-allowed":"pointer",
                fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700}}>
              {processing?"⏳ 압축중...":"🗜️ 일괄 압축"}
            </button>
            {files.some(f=>f.status==="done") && <>
              <button onClick={saveAll}
                style={{padding:"9px 14px",background:allSaved?"#2ea043":"#21262d",
                  color:allSaved?"#fff":"#8b949e",border:"1px solid #30363d",borderRadius:"8px",
                  cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:600,transition:"all .2s"}}>
                {allSaved?"✅ 저장됨!":"⬇️ 모두 저장"}
              </button>
            </>}
            <button onClick={()=>setFiles([])}
              style={{padding:"9px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
                borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>🗑️ 초기화</button>
          </div>
        </div>

        {/* 전체 통계 */}
        {files.some(f=>f.status==="done") && <div style={{display:"flex",gap:"16px",marginTop:"12px",paddingTop:"12px",borderTop:"1px solid #21262d"}}>
          {[
            ["원본 합계", fmtSize(totalOrig), "#8b949e"],
            ["압축 합계", fmtSize(totalComp), "#58a6ff"],
            ["절약", `${totalSaved}%`, totalSaved>0?"#3fb950":"#484f58"],
          ].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{color:c,fontSize:"16px",fontWeight:700}}>{v}</div>
              <div style={{color:"#484f58",fontSize:"10px",marginTop:"2px"}}>{l}</div>
            </div>
          ))}
        </div>}
      </div>

      {/* 파일 목록 */}
      <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
        {files.map((f, i) => (
          <div key={i} style={{background:"#161b22",border:"1px solid #21262d",borderRadius:"10px",
            padding:"10px 14px",display:"flex",alignItems:"center",gap:"12px"}}>
            <img src={f.url} alt="" style={{width:"40px",height:"40px",objectFit:"cover",
              borderRadius:"6px",flexShrink:0,border:"1px solid #30363d"}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#e6edf3",fontSize:"13px",fontWeight:600,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
              <div style={{display:"flex",gap:"8px",marginTop:"3px",flexWrap:"wrap"}}>
                <span style={{color:"#484f58",fontSize:"11px"}}>{fmtSize(f.origSize)}</span>
                {f.result && <>
                  <span style={{color:"#484f58",fontSize:"11px"}}>→</span>
                  <span style={{color:"#58a6ff",fontSize:"11px",fontWeight:600}}>{fmtSize(f.result.size)}</span>
                  <span style={{color:f.result.saved>0?"#3fb950":"#ffa657",fontSize:"11px",fontWeight:700}}>
                    {f.result.saved>0?`-${f.result.saved}%`:"변화없음"}
                  </span>
                </>}
              </div>
            </div>
            {/* 진행 상태 */}
            <div style={{flexShrink:0,display:"flex",gap:"6px",alignItems:"center"}}>
              {f.status==="processing"&&<span style={{color:"#ffa657",fontSize:"12px"}}>⏳</span>}
              {f.status==="done"&&<span style={{color:"#3fb950",fontSize:"12px"}}>✅</span>}
              {f.status==="done"&&<button onClick={()=>saveOne(f)}
                style={{padding:"5px 10px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
                  borderRadius:"6px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"11px"}}>
                ⬇️ 저장
              </button>}
              <button onClick={()=>setFiles(prev=>prev.filter((_,idx)=>idx!==i))}
                style={{padding:"5px 8px",background:"#21262d",color:"#484f58",border:"1px solid #30363d",
                  borderRadius:"6px",cursor:"pointer",fontSize:"11px"}}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </>}
  </div>;
}

// ─── TAB: 이모지 ─────────────────────────────────────────────────────────
const EMOJI_GROUPS = [
  { id:"face",    label:"😀 사람·표정", emojis:"😀😃😄😁😆😅🤣😂🙂😉😊😇🥰😍🤩😘😗☺️😚😙🥲😏😋😛😜🤪😝🤗🤭🫢🫣🤫🤔🫡🤤🤠🥳🥸😎🤓🧐🙃🫠🤐🤨😐😑😶🫥😶‍🌫️😒🙄😬😮‍💨🤥🫨😌😔😪😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵😵‍💫🤯🥱😕🫤😟🙁☹️😮😯😲😳🥺🥹😦😧😨😰😥😢😭😱😖😣😞😓😩😫😤😡😠🤬👿😈💀☠️💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾🙈🙉🙊" },
  { id:"hand",    label:"👋 손·몸", emojis:"👋🤚🖐️✋🖖🫱🫲🫳🫴🫷🫸👌🤌🤏✌️🤞🫰🤟🤘🤙👈👉👆🖕👇☝️🫵👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💅🤳💪🦾🦿🦵🦶👂🦻👃🧠🫀🫁🦷🦴👀👅👄🫦👣" },
  { id:"people",  label:"👶 사람·직업", emojis:"👶🧒👦👧🧑👱👨🧔👩👱‍♀️👱‍♂️🧓👴👵🧏👮🕵️💂🥷👷🫅🤴👸🤵👰🎅🤶🧑‍🎄🦸🦹🧙🧚🧛🧜🧝🧞🧟🧌🧑‍⚕️👨‍⚕️👩‍⚕️🧑‍🎓👨‍🎓👩‍🎓🧑‍🏫👨‍🏫👩‍🏫🧑‍⚖️👨‍⚖️👩‍⚖️🧑‍🌾👨‍🌾👩‍🌾🧑‍🍳👨‍🍳👩‍🍳🧑‍🔧👨‍🔧👩‍🔧🧑‍🏭👨‍🏭👩‍🏭🧑‍💼👨‍💼👩‍💼🧑‍🔬👨‍🔬👩‍🔬🧑‍💻👨‍💻👩‍💻🧑‍🎤👨‍🎤👩‍🎤🧑‍🎨👨‍🎨👩‍🎨🧑‍✈️👨‍✈️👩‍✈️🧑‍🚀👨‍🚀👩‍🚀🧑‍🚒👨‍🚒👩‍🚒" },
  { id:"animal",  label:"🐶 동물·자연", emojis:"🐵🐒🦍🦧🐶🐕🦮🐕‍🦺🐩🐺🦊🦝🐱🐈🐈‍⬛🦁🐯🐅🐆🐴🫎🫏🐎🦄🦓🦌🦬🐮🐂🐃🐄🐷🐖🐗🐽🐏🐑🐐🐪🐫🦙🦒🐘🦣🦏🦛🐭🐁🐀🐹🐰🐇🐿️🦫🦔🦇🐻🐻‍❄️🐨🐼🦥🦦🦨🦘🦡🐾🦃🐔🐓🐣🐤🐥🐦🐧🕊️🦅🦆🦢🦉🦤🪶🦩🦚🦜🪽🐦‍⬛🪿🐦‍🔥🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🦭🐟🐠🐡🦈🐙🐚🪸🪼🦀🦞🦐🦑🦪🐌🦋🐛🐜🐝🪲🐞🦗🪳🕷️🕸️🦂🦟🪰🪱🦠💐🌸💮🪷🏵️🌹🥀🌺🌻🌼🌷🪻🌱🪴🌲🌳🌴🌵🌾🌿☘️🍀🍁🍂🍃🍄🪨🪵🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜☀️🌝🌞🪐⭐🌟🌠🌌☁️⛅⛈️🌤️🌥️🌦️🌧️🌨️🌩️🌪️🌫️🌬️🌀🌈🌂☂️☔⛱️⚡❄️☃️⛄☄️🔥💧🌊" },
  { id:"food",    label:"🍎 음식·음료", emojis:"🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🫐🥝🍅🫒🥥🥑🍆🥔🥕🌽🌶️🫑🥒🥬🥦🧄🧅🥜🫘🌰🍞🥐🥖🫓🥨🥯🥞🧇🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🌮🌯🫔🥙🧆🥚🍳🥘🍲🫕🥣🥗🍿🧈🧂🥫🍝🍱🍘🍙🍚🍛🍜🍠🍢🍣🍤🍥🥮🍡🥟🥠🥡🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯🍼🥛☕🫖🍵🍶🍾🍷🍸🍹🍺🍻🥂🥃🫗🥤🧋🧃🧉🥢🍽️🍴🥄🔪🫙🏺" },
  { id:"travel",  label:"✈️ 여행·장소", emojis:"🌍🌎🌏🌐🗺️🗾🧭🏔️⛰️🌋🗻🏕️🏖️🏜️🏝️🏞️🏟️🏛️🏗️🧱🛖🏘️🏚️🏠🏡🏢🏣🏤🏥🏦🏨🏩🏪🏫🏬🏭🏯🏰💒🗼🗽⛪🕌🛕🕍⛩️🕋⛲⛺🌁🌃🏙️🌄🌅🌆🌇🌉♨️🎠🛝🎡🎢💈🎪🗿🚂🚃🚄🚅🚆🚇🚈🚉🚊🚝🚞🚋🚌🚍🚎🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🛻🚚🚛🚜🏎️🏍️🛵🚲🛴🛹🛼🚏🛣️🛤️⛽🛞🚨🚥🚦🛑🚧⚓🛟⛵🛶🚤🛳️⛴️🛥️🚢✈️🛩️🛫🛬🪂💺🚁🚟🚠🚡🛰️🚀🛸" },
  { id:"object",  label:"💎 사물·물체", emojis:"🎀🎗️👓🕶️🥽🥼🦺👔👕👖🧣🧤🧥🧦👗👘🥻🩱🩲🩳👙👚👛👜👝🛍️🎒🩴👞👟🥾🥿👠👡🩰👢👑👒🎩🎓🧢💄💍💎🔇🔈🔉🔊📢📣📯🔔🔕🎼🎵🎶🎙️🎚️🎛️🎤🎧📻🎷🪗🎸🎹🎺🎻🪕🥁🪘🪇🪈📱📲☎️📞📟📠🔋🪫🔌💻🖥️🖨️⌨️🖱️🖲️💽💾💿📀🎥🎞️📽️🎬📺📷📸📹📼📔📕📖📗📘📙📚📓📒📃📜📄📰🗞️📑🔖🏷️✉️📧📨📩📤📥📦📫📪📬📭📮🗳️✏️✒️🖋️🖊️🖌️🖍️📝💼📁📂🗂️📅📆🗒️🗓️📇📈📉📊📋📌📍📎🖇️📏📐✂️🗃️🗄️🗑️⌛⏳⌚⏰⏱️⏲️🕰️💰🪙💴💵💶💷💸💳🧾💹🧳🌡️🔍🔎🕯️💡🔦🔒🔓🔏🔐🔑🗝️🔨🪓⛏️⚒️🛠️🗡️⚔️💣🪃🏹🛡️🪚🔧🪛🔩⚙️🗜️⚖️🔗⛓️🪝🧰🧲🪜⚗️🧪🧫🔬🔭📡💉🩹🩼🩺🩻🚪🪞🪟🛏️🛋️🪑🚽🪠🚿🛁🪤🪒🧴🧷🧹🧺🧻🪣🧼🫧🪥🧽🧯🛒" },
  { id:"symbol",  label:"💯 상징·기호", emojis:"💌💘💝💖💗💓💞💕💟❣️💔❤️‍🔥❤️‍🩹❤️🩷🧡💛💚💙🩵💜🤎🖤🩶🤍💋💯💢💥💦💨🕳️💬🗨️🗯️💭💤🔴🟠🟡🟢🔵🟣🟤⚫⚪🟥🟧🟨🟩🟦🟪🟫⬛⬜🔶🔷🔸🔹🔺🔻💠🔘🔳🔲🏧🚮🚰♿🚹🚺🚻🚼🚾⚠️🚸⛔🚫🚳🚭🚯🚱🚷📵🔞☢️☣️⬆️↗️➡️↘️⬇️↙️⬅️↖️↕️↔️↩️↪️⤴️⤵️🔃🔄🔙🔚🔛🔜🔝🔀🔁🔂▶️⏩⏭️⏯️◀️⏪⏮️🔼⏫🔽⏬⏸️⏹️⏺️⏏️🎦🔅🔆📶🛜📳📴✅☑️✔️❌❎➰➿〽️✳️✴️❇️©️®️™️❓❔❕❗‼️⁉️#️⃣0️⃣1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣🔟🅰️🆎🅱️🆑🆒🆓🆔🆕🆖🅾️🆗🆘🆙🆚" },
  { id:"activity",label:"⚽ 활동·스포츠", emojis:"🎃🎄🎆🎇🧨✨🎈🎉🎊🎋🎍🎎🎏🎐🎑🧧🎁🎟️🎫🏮🪔🎖️🏆🏅🥇🥈🥉⚽⚾🥎🏀🏐🏈🏉🎾🥏🎳🏏🏑🏒🥍🏓🏸🥊🥋🥅⛳⛸️🎣🤿🎽🎿🛷🥌🎯🪀🪁🎱🔮🪄🎮🕹️🎰🎲🧩🪅🪩🪆♠️♥️♦️♣️♟️🃏🀄🎴🎭🖼️🎨" },
  { id:"flag",    label:"🚩 깃발", emojis:"🏁🚩🎌🏴🏳️🏳️‍🌈🏳️‍⚧️🏴‍☠️🇰🇷🇺🇸🇯🇵🇨🇳🇬🇧🇫🇷🇩🇪🇮🇹🇪🇸🇷🇺🇧🇷🇨🇦🇦🇺🇮🇳🇲🇽🇦🇷🇹🇷🇸🇦🇵🇭🇻🇳🇹🇭🇮🇩🇲🇾🇳🇬🇧🇩🇵🇰🇺🇦🇵🇱🇳🇱🇦🇿🇦🇫🇮🇷🇮🇶🇸🇾🇱🇧🇯🇴🇮🇱🇹🇼🇭🇰🇸🇬🇰🇵🇺🇳" },
];

function EmojiTab() {
  const [activeGroup, setActiveGroup] = useState("face");
  const [search, setSearch]           = useState("");
  const [copied, setCopied]           = useState("");
  const [recentList, setRecentList]   = useState([]);
  const [toastEmoji, setToastEmoji]   = useState("");

  // 모든 이모지 통합 (검색용)
  const allEmojis = EMOJI_GROUPS.flatMap(g =>
    [...g.emojis].filter(c => c.codePointAt(0) > 127)
  );

  const copyEmoji = (emoji) => {
    navigator.clipboard.writeText(emoji);
    setCopied(emoji); setTimeout(() => setCopied(""), 1200);
    setToastEmoji(emoji); setTimeout(() => setToastEmoji(""), 1200);
    setRecentList(prev => {
      const next = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 30);
      return next;
    });
  };

  // 현재 표시할 이모지 목록
  const displayEmojis = (() => {
    if (search.trim()) {
      // 검색: 모든 그룹에서 유니코드 포인트 문자만 필터 (단순 포함 검색)
      return allEmojis.filter(e => {
        try { return e.trim().length > 0; } catch { return false; }
      }).slice(0, 200);
    }
    if (activeGroup === "recent") return recentList;
    return [...(EMOJI_GROUPS.find(g => g.id === activeGroup)?.emojis || "")]
      .filter(c => c.codePointAt(0) > 127);
  })();

  return <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

    {/* 토스트 */}
    {toastEmoji && <div style={{
      position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",
      background:"#1f6feb",color:"#fff",padding:"10px 20px",borderRadius:"20px",
      fontSize:"20px",zIndex:9999,boxShadow:"0 4px 16px #00000066",
      animation:"fadeInOut .3s ease",pointerEvents:"none",
    }}>
      {toastEmoji} 복사됨!
    </div>}
    <style>{`@keyframes fadeInOut{0%{opacity:0;transform:translateX(-50%) translateY(-8px)}100%{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

    {/* 검색창 */}
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"15px",pointerEvents:"none"}}>🔍</span>
      <input
        value={search} onChange={e=>setSearch(e.target.value)}
        placeholder="이모지 검색..."
        style={{width:"100%",padding:"10px 14px 10px 36px",background:"#0d1117",
          border:"1px solid #30363d",borderRadius:"10px",color:"#e6edf3",
          fontSize:"14px",outline:"none",fontFamily:"'Noto Sans KR',sans-serif",boxSizing:"border-box"}}
        onFocus={e=>e.target.style.borderColor="#58a6ff"}
        onBlur={e=>e.target.style.borderColor="#30363d"}
      />
      {search && <button onClick={()=>setSearch("")} style={{
        position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",
        background:"none",border:"none",color:"#484f58",cursor:"pointer",fontSize:"16px",padding:"2px 6px",
      }}>✕</button>}
    </div>

    {/* 그룹 탭 */}
    {!search && <div style={{display:"flex",overflowX:"auto",gap:"4px",paddingBottom:"2px"}}>
      {recentList.length > 0 && <button onClick={()=>setActiveGroup("recent")}
        style={{padding:"7px 12px",border:"none",borderRadius:"8px",cursor:"pointer",
          background:activeGroup==="recent"?"#1f6feb22":"#161b22",
          color:activeGroup==="recent"?"#58a6ff":"#8b949e",
          fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,
          border:`1px solid ${activeGroup==="recent"?"#1f6feb44":"#30363d"}`,whiteSpace:"nowrap",flexShrink:0}}>
        🕐 최근
      </button>}
      {EMOJI_GROUPS.map(g=>(
        <button key={g.id} onClick={()=>setActiveGroup(g.id)}
          style={{padding:"7px 12px",border:"none",borderRadius:"8px",cursor:"pointer",
            background:activeGroup===g.id?"#1f6feb22":"#161b22",
            color:activeGroup===g.id?"#58a6ff":"#8b949e",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,
            border:`1px solid ${activeGroup===g.id?"#1f6feb44":"#30363d"}`,whiteSpace:"nowrap",flexShrink:0}}>
          {g.label}
        </button>
      ))}
    </div>}

    {/* 이모지 그리드 */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"14px"}}>
      {search && <div style={{color:"#484f58",fontSize:"11px",marginBottom:"10px",fontWeight:600}}>
        전체 이모지에서 검색 중
      </div>}
      {!search && activeGroup==="recent" && recentList.length===0 && (
        <div style={{color:"#484f58",fontSize:"13px",textAlign:"center",padding:"20px"}}>
          이모지를 클릭하면 최근 사용 목록에 추가됩니다.
        </div>
      )}
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
        {displayEmojis.map((emoji, i) => (
          <button key={i} onClick={()=>copyEmoji(emoji)}
            title="클릭해서 복사"
            style={{
              width:"40px",height:"40px",
              background:copied===emoji?"#1f6feb33":"transparent",
              border:`1px solid ${copied===emoji?"#1f6feb66":"transparent"}`,
              borderRadius:"8px",cursor:"pointer",fontSize:"22px",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .1s",lineHeight:1,padding:0,
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#21262d";e.currentTarget.style.borderColor="#30363d";}}
            onMouseLeave={e=>{e.currentTarget.style.background=copied===emoji?"#1f6feb33":"transparent";e.currentTarget.style.borderColor=copied===emoji?"#1f6feb66":"transparent";}}>
            {emoji}
          </button>
        ))}
      </div>
    </div>

    <div style={{color:"#484f58",fontSize:"11px",textAlign:"center"}}>
      이모지 클릭 시 클립보드에 자동 복사됩니다 · 클릭 후 붙여넣기(Ctrl+V)로 사용하세요
    </div>
  </div>;
}

// ─── TAB: 기사 리라이팅 ───────────────────────────────────────────────────
function ArticleRewriteTab() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState("idle"); // idle | scraping | rewriting | done | error
  const [scraped, setScraped] = useState(null);
  const [processedImages, setProcessedImages] = useState([]);
  const [rewrittenTitle, setRewrittenTitle] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  const reset = () => {
    setUrl(""); setStep("idle"); setScraped(null);
    setProcessedImages([]); setRewrittenTitle(""); setRewrittenText("");
    setErrorMsg("");
  };

  const processImage = (src) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i]   = Math.min(255, Math.max(0, (d[i]   - 128) * 1.08 + 133));
          d[i+1] = Math.min(255, Math.max(0, (d[i+1] - 128) * 1.08 + 133));
          d[i+2] = Math.min(255, Math.max(0, (d[i+2] - 128) * 1.08 + 133));
        }
        ctx.putImageData(imageData, 0, 0);
      } catch(e) {}
      canvas.toBlob(blob => {
        if (!blob) { resolve(null); return; }
        resolve({ blob, dataUrl: canvas.toDataURL("image/jpeg", 0.92) });
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => resolve(null);
    img.src = `/api/img-proxy?url=${encodeURIComponent(src)}`;
  });

  const run = async () => {
    if (!url.trim()) return;
    setStep("scraping"); setErrorMsg("");
    setScraped(null); setProcessedImages([]); setRewrittenTitle(""); setRewrittenText("");

    try {
      // 1. 스크래핑
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok || !scrapeData.success) throw new Error(scrapeData.error || "스크래핑 실패");
      const { title, text, images } = scrapeData.data;
      setScraped({ title, text, images });

      // 2. 이미지 처리 (대표 1장)
      setStep("rewriting");
      const imgResults = [];
      if (images && images.length > 0) {
        const result = await processImage(images[0]);
        if (result) imgResults.push({ original: images[0], processed: result.dataUrl, blob: result.blob });
      }
      setProcessedImages(imgResults);

      // 3. AI 리라이팅
      const rewritePrompt = `아래 기사의 제목과 본문을 리라이팅해줘.

원문 제목: ${title}
원문 본문:
${text.slice(0, 4000)}

리라이팅 규칙:
1. 기사 형식 유지 — 원문이 뉴스 기사면 리라이팅 결과도 뉴스 기사 형식으로 유지
2. 내용 요약·삭제 금지 — 원문에 포함된 모든 정보, 사실, 수치, 인용구를 빠짐없이 포함. 글의 길이와 정보량은 원문과 동일하게 유지
3. 표현만 바꿔쓰기 — 단어, 어휘, 문장 구조, 말투를 자연스럽게 바꿔서 원문과 다른 사람이 쓴 것처럼 만들 것. 문장을 그대로 옮기지 말 것
4. 뉴스 기사체 유지 — 문어체, 객관적 어투, 자연스러운 문장 흐름 유지. 블로그 말투 사용 금지
5. 제목 새로 작성 — 원문 제목을 그대로 쓰지 말 것. 본문 핵심 내용을 담되 단어·구조를 완전히 다르게 새로 작성. 원문 제목과 단어가 겹치지 않도록 할 것

반드시 순수 JSON만 출력 (마크다운 백틱 없이):
{"title":"리라이팅된 제목","content":"리라이팅된 본문"}`;

      const raw = await callClaudeStream(
        [{ role: "user", content: rewritePrompt }],
        "You are a professional Korean news writer. Output ONLY valid JSON, no markdown backticks.",
        3500,
        "claude-sonnet-4-5-20250929"
      );
      const parsed = safeParseJson(raw);
      setRewrittenTitle(parsed.title || title);
      setRewrittenText((parsed.content || raw).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
      setStep("done");

    } catch (err) {
      setErrorMsg(err.message || "처리 중 오류가 발생했습니다");
      setStep("error");
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(`${rewrittenTitle}\n\n${rewrittenText}`);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const isRunning = step === "scraping" || step === "rewriting";

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    {/* URL 입력 */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px"}}>
      <div style={{color:"#8b949e",fontSize:"12px",fontWeight:700,marginBottom:"10px"}}>🔗 기사 URL 입력</div>
      <div style={{display:"flex",gap:"8px"}}>
        <input value={url} onChange={e=>setUrl(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!isRunning&&run()}
          placeholder="https://news.example.com/article/..."
          disabled={isRunning}
          style={{flex:1,padding:"10px 14px",background:"#0d1117",border:"1px solid #30363d",
            borderRadius:"8px",color:"#e6edf3",fontSize:"13px",outline:"none",
            fontFamily:"'Noto Sans KR',sans-serif",opacity:isRunning?0.6:1}}
          onFocus={e=>e.target.style.borderColor="#58a6ff"}
          onBlur={e=>e.target.style.borderColor="#30363d"}/>
        <button onClick={run} disabled={isRunning||!url.trim()}
          style={{padding:"10px 20px",background:isRunning||!url.trim()?"#21262d":"linear-gradient(135deg,#1f6feb,#8957e5)",
            color:isRunning||!url.trim()?"#484f58":"#fff",border:"none",borderRadius:"8px",
            cursor:isRunning||!url.trim()?"not-allowed":"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700,whiteSpace:"nowrap"}}>
          {isRunning?"⏳ 처리중...":"🚀 시작"}
        </button>
        {step!=="idle"&&<button onClick={reset}
          style={{padding:"10px 14px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
            borderRadius:"8px",cursor:"pointer",fontSize:"13px"}}>🗑️</button>}
      </div>
    </div>

    {/* 진행 상태 */}
    {isRunning&&(
      <div style={{background:"#0d1e33",border:"1px solid #1f6feb44",borderRadius:"12px",padding:"16px"}}>
        {[
          {label:"기사 스크래핑", done:step!=="scraping", active:step==="scraping"},
          {label:"이미지 처리 (EXIF 제거 + 보정)", done:step==="done", active:step==="rewriting"&&!rewrittenText},
          {label:"AI 리라이팅", done:step==="done", active:step==="rewriting"&&!!scraped},
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:i<2?"8px":"0"}}>
            <span style={{fontSize:"14px"}}>{s.done?"✅":s.active?"⏳":"⬜"}</span>
            <span style={{color:s.done?"#3fb950":s.active?"#ffa657":"#484f58",fontSize:"13px",fontWeight:s.active?700:400}}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    )}

    {/* 에러 */}
    {step==="error"&&(
      <div style={{background:"#2d0b0b",border:"1px solid #f8514944",borderRadius:"12px",padding:"14px",color:"#f85149",fontSize:"13px"}}>
        ❌ {errorMsg}
      </div>
    )}

    {/* 결과 */}
    {step==="done"&&(
      <>
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
            <div style={{color:"#8b949e",fontSize:"12px",fontWeight:700}}>✍️ 리라이팅 결과</div>
            <button onClick={copyText}
              style={{padding:"6px 14px",background:copiedText?"#2ea043":"#21262d",
                color:copiedText?"#fff":"#8b949e",border:"1px solid #30363d",
                borderRadius:"8px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600}}>
              {copiedText?"✅ 복사됨!":"📋 전체 복사"}
            </button>
          </div>
          <div style={{marginBottom:"10px"}}>
            <div style={{color:"#484f58",fontSize:"11px",marginBottom:"4px"}}>제목</div>
            <input value={rewrittenTitle} onChange={e=>setRewrittenTitle(e.target.value)}
              style={{width:"100%",padding:"10px 12px",background:"#0d1117",border:"1px solid #30363d",
                borderRadius:"8px",color:"#e6edf3",fontSize:"14px",fontWeight:700,outline:"none",
                fontFamily:"'Noto Sans KR',sans-serif",boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor="#58a6ff"}
              onBlur={e=>e.target.style.borderColor="#30363d"}/>
          </div>
          <div>
            <div style={{color:"#484f58",fontSize:"11px",marginBottom:"4px"}}>본문 ({rewrittenText.length.toLocaleString()}자)</div>
            <textarea value={rewrittenText} onChange={e=>setRewrittenText(e.target.value)} rows={14}
              style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",background:"#0d1117",
                border:"1px solid #30363d",borderRadius:"8px",color:"#e6edf3",
                fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",lineHeight:"1.7",
                resize:"vertical",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#58a6ff"}
              onBlur={e=>e.target.style.borderColor="#30363d"}/>
          </div>
        </div>

        {processedImages.length>0&&(
          <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
            <div style={{color:"#8b949e",fontSize:"12px",fontWeight:700,marginBottom:"10px"}}>
              🖼️ 대표 이미지 — EXIF 제거 + 자동보정 완료
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <img src={processedImages[0].processed} alt=""
                style={{width:"120px",height:"80px",objectFit:"cover",borderRadius:"8px",border:"1px solid #30363d"}}/>
              <button onClick={()=>{
                const a=document.createElement("a");
                a.href=processedImages[0].processed;
                a.download=`article_img_${Date.now()}.jpg`;
                a.click();
              }} style={{padding:"8px 16px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
                borderRadius:"8px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px"}}>
                ⬇️ 이미지 저장
              </button>
            </div>
          </div>
        )}

        {scraped&&(
          <div style={{background:"#161b22",border:"1px solid #21262d",borderRadius:"10px",padding:"12px"}}>
            <div style={{color:"#484f58",fontSize:"11px"}}>
              📄 원문: {scraped.title} · {scraped.text.length.toLocaleString()}자 · 이미지 {scraped.images.length}개
            </div>
          </div>
        )}
      </>
    )}
  </div>;
}

// ─── TAB: AI 영상 생성 ────────────────────────────────────────────────────
function VideoMakeAiTab() {
  const [replicateKey, setReplicateKey] = React.useState("");
  const [pixverseKey, setPixverseKey] = React.useState("");
  const [preferApi, setPreferApi] = React.useState("replicate");
  const [duration, setDuration] = React.useState("10");
  const [resolution, setResolution] = React.useState("720p");
  const [globalPrompt, setGlobalPrompt] = React.useState("");
  const [images, setImages] = React.useState([]);
  const [progresses, setProgresses] = React.useState([]);
  const [results, setResults] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const fileRef = React.useRef();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setReplicateKey(localStorage.getItem("vm_replicate_key") || "");
      setPixverseKey(localStorage.getItem("vm_pixverse_key") || "");
      setPreferApi(localStorage.getItem("vm_prefer_api") || "replicate");
    }
  }, []);

  const saveKey = (field, val) => {
    if (field === "replicate") { setReplicateKey(val); localStorage.setItem("vm_replicate_key", val); }
    else { setPixverseKey(val); localStorage.setItem("vm_pixverse_key", val); }
  };
  const savePrefer = (v) => { setPreferApi(v); localStorage.setItem("vm_prefer_api", v); };

  const showToast = (msg, type="ok") => {
    setToast({msg, type});
    setTimeout(() => setToast(null), 3500);
  };

  const addImages = (files) => {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setImages(prev => [...prev, { file, dataUrl: e.target.result, name: file.name, prompt: "" }]);
      reader.readAsDataURL(file);
    });
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const callReplicate = async (_token, dataUrl, prompt, dur, res, idx) => {
    updateProg(idx, 25, "Replicate 요청 중...");
    const r1 = await fetch("/api/video-proxy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "replicate_create", payload: { image: dataUrl, prompt, num_frames: parseInt(dur) * 16, fps: 16, resolution: res } }),
    });
    const pred = await r1.json();
    if (pred.error) throw new Error(pred.error);
    updateProg(idx, 35, "AI 영상 생성 중...");
    for (let i = 0; i < 120; i++) {
      await sleep(3000);
      updateProg(idx, Math.min(35 + i * 0.5, 90), `생성 중... (${(i+1)*3}초)`);
      const r2 = await fetch("/api/video-proxy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replicate_status", payload: { id: pred.id } }),
      });
      const st = await r2.json();
      if (st.status === "succeeded") { const o = st.output; return Array.isArray(o) ? o[0] : o; }
      if (st.status === "failed") throw new Error(st.error || "생성 실패");
    }
    throw new Error("타임아웃");
  };

  const callPixverse = async (_apiKey, dataUrl, prompt, dur, idx) => {
    updateProg(idx, 25, "PixVerse 이미지 업로드 중...");
    const [h, d] = dataUrl.split(",");
    const mimeType = h.match(/:(.*?);/)[1];
    const r1 = await fetch("/api/video-proxy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pixverse_upload", payload: { imageBase64: d, mimeType } }),
    });
    const upData = await r1.json();
    if (upData.error) throw new Error(upData.error);
    const imgId = upData.img_id;
    if (!imgId) throw new Error("PixVerse 이미지 ID 없음");
    updateProg(idx, 40, "PixVerse 생성 요청...");
    const r2 = await fetch("/api/video-proxy", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pixverse_create", payload: { img_id: imgId, prompt, duration: parseInt(dur) } }),
    });
    const genData = await r2.json();
    if (genData.error) throw new Error(genData.error);
    const videoId = genData.video_id;
    if (!videoId) throw new Error("PixVerse 영상 ID 없음");
    for (let i = 0; i < 100; i++) {
      await sleep(3000);
      updateProg(idx, Math.min(50 + i * 0.4, 90), `PixVerse 생성 중... (${(i+1)*3}초)`);
      const r3 = await fetch("/api/video-proxy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pixverse_status", payload: { video_id: videoId } }),
      });
      if (!r3.ok) continue;
      const sData = await r3.json();
      if (sData.status === 1) return sData.url;
      if (sData.status === -1) throw new Error("PixVerse 생성 실패");
    }
    throw new Error("PixVerse 타임아웃");
  };

  const dataURLtoBlob = (dataUrl) => {
    const [h, d] = dataUrl.split(","); const mime = h.match(/:(.*?);/)[1];
    const bin = atob(d); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const updateProg = (idx, pct, msg, err=false) => {
    setProgresses(prev => prev.map((p, i) => i === idx ? { ...p, pct, msg, err } : p));
  };

  const startGen = async () => {
    if (images.length === 0) { showToast("이미지를 먼저 업로드하세요", "err"); return; }
    setRunning(true);
    setResults([]);
    setProgresses(images.map(img => ({ name: img.name, pct: 0, msg: "대기 중...", err: false })));
    const newResults = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const prompt = img.prompt || globalPrompt || "cinematic product showcase, smooth camera movement, high quality";
      let url = null;
      updateProg(i, 10, "시작...");
      try {
        url = await callReplicate(null, img.dataUrl, prompt, duration, resolution, i);
      } catch(e) { updateProg(i, 40, `⚠️ Replicate 실패: ${e.message} → PixVerse 폴백...`); }
      if (!url) {
        try {
          url = await callPixverse(null, img.dataUrl, prompt, duration, i);
        } catch(e) { updateProg(i, 100, `❌ 실패: ${e.message}`, true); continue; }
      }
      if (url) { updateProg(i, 100, "✅ 완료"); newResults.push({ url, name: img.name.replace(/\.[^.]+$/, "") + "_ai.mp4" }); }
    }
    setResults(newResults);
    setRunning(false);
    showToast(`완료! ${newResults.length}개 생성됨`);
    if (newResults.length > 0) localStorage.setItem("vm_ai_results", JSON.stringify(newResults));
  };

  const S = {
    card: { background:"#0d1117", border:"1px solid #21262d", borderRadius:"12px", padding:"16px", marginBottom:"14px" },
    label: { fontSize:"11px", color:"#8b949e", fontWeight:600, marginBottom:"5px", display:"block" },
    input: { width:"100%", background:"#161b22", border:"1px solid #30363d", borderRadius:"8px", padding:"9px 12px", color:"#e6edf3", fontFamily:"'Noto Sans KR',sans-serif", fontSize:"13px", outline:"none", boxSizing:"border-box" },
    btn: (c="#1f6feb") => ({ padding:"10px 20px", border:"none", borderRadius:"8px", background:c, color:c==="#1f6feb"?"#fff":"#0d1117", fontFamily:"'Noto Sans KR',sans-serif", fontSize:"13px", fontWeight:700, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:"7px" }),
    grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" },
  };

  return <div>
    {toast && <div style={{ position:"fixed", bottom:"20px", right:"20px", background:"#161b22", border:`1px solid ${toast.type==="err"?"#f85149":"#3fb950"}`, borderRadius:"10px", padding:"12px 18px", fontSize:"13px", color:toast.type==="err"?"#f85149":"#3fb950", zIndex:9999 }}>{toast.msg}</div>}



    {/* 이미지 업로드 */}
    <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"12px"}}>📸 이미지 업로드 <span style={{color:"#484f58",fontWeight:400}}>(핵심 장면 3~4개 권장)</span></div>
      <div onClick={()=>fileRef.current.click()}
        style={{border:"2px dashed #30363d",borderRadius:"10px",padding:"28px",textAlign:"center",cursor:"pointer",background:"#161b22"}}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#58a6ff";}}
        onDragLeave={e=>{e.currentTarget.style.borderColor="#30363d";}}
        onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="#30363d";addImages(e.dataTransfer.files);}}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addImages(e.target.files)} />
        <div style={{fontSize:"32px",marginBottom:"8px"}}>📸</div>
        <div style={{fontSize:"13px",color:"#8b949e"}}>클릭하거나 드래그해서 업로드</div>
      </div>
      {images.length > 0 && <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"10px",marginTop:"12px"}}>
        {images.map((img,i)=><div key={i} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",overflow:"hidden",position:"relative"}}>
          <button onClick={()=>setImages(prev=>prev.filter((_,j)=>j!==i))} style={{position:"absolute",top:"5px",right:"5px",background:"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",width:"20px",height:"20px",color:"#fff",cursor:"pointer",fontSize:"11px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          <img src={img.dataUrl} alt={img.name} style={{width:"100%",height:"90px",objectFit:"cover",display:"block"}} />
          <input value={img.prompt} onChange={e=>setImages(prev=>prev.map((p,j)=>j===i?{...p,prompt:e.target.value}:p))}
            placeholder="개별 프롬프트 (선택)"
            style={{width:"100%",background:"transparent",border:"none",borderTop:"1px solid #30363d",padding:"6px 8px",color:"#8b949e",fontSize:"11px",outline:"none",boxSizing:"border-box"}} />
        </div>)}
      </div>}
    </div>

    {/* 생성 설정 */}
    <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"10px"}}>⚙️ 생성 설정</div>
      <div style={{...S.grid2, marginBottom:"10px"}}>
        <div><label style={S.label}>영상 길이</label>
          <select style={S.input} value={duration} onChange={e=>setDuration(e.target.value)}>
            <option value="5">5초</option><option value="10">10초</option>
          </select></div>
        <div><label style={S.label}>해상도</label>
          <select style={S.input} value={resolution} onChange={e=>setResolution(e.target.value)}>
            <option value="720p">720p (권장)</option><option value="480p">480p (빠름)</option>
          </select></div>
      </div>
      <label style={S.label}>공통 프롬프트 (선택 · 비우면 AI 자동 분석)</label>
      <textarea value={globalPrompt} onChange={e=>setGlobalPrompt(e.target.value)}
        placeholder="예: cinematic, slow motion, product showcase, smooth camera movement"
        style={{...S.input,resize:"vertical",minHeight:"60px",lineHeight:"1.6"}} rows={2} />
      <div style={{display:"flex",gap:"10px",marginTop:"12px",flexWrap:"wrap"}}>
        <button style={S.btn()} disabled={running} onClick={startGen}>
          {running ? <><span style={{width:"14px",height:"14px",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block"}}></span> 생성 중...</> : "🚀 AI 영상 생성 시작"}
        </button>
        <button style={S.btn("#21262d")} onClick={()=>{setImages([]);setProgresses([]);setResults([]);}}>🗑 초기화</button>
      </div>
    </div>

    {/* 진행 상황 */}
    {progresses.length > 0 && <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"12px"}}>⏳ 생성 진행</div>
      {progresses.map((p,i)=><div key={i} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"8px",padding:"12px",marginBottom:"8px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
          <span style={{fontSize:"12px",fontWeight:600,color:"#e6edf3"}}>{p.name}</span>
          <span style={{fontSize:"11px",color:p.err?"#f85149":p.pct===100?"#3fb950":"#8b949e"}}>{p.msg}</span>
        </div>
        <div style={{background:"#30363d",borderRadius:"4px",height:"4px"}}>
          <div style={{width:`${p.pct}%`,height:"100%",borderRadius:"4px",background:p.err?"#f85149":p.pct===100?"#3fb950":"linear-gradient(90deg,#1f6feb,#58a6ff)",transition:"width .4s"}} />
        </div>
      </div>)}
    </div>}

    {/* 결과 */}
    {results.length > 0 && <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#3fb950",marginBottom:"12px"}}>✅ 생성 완료 ({results.length}개)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"12px"}}>
        {results.map((v,i)=><div key={i} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",overflow:"hidden"}}>
          <video src={v.url} controls muted style={{width:"100%",display:"block",maxHeight:"180px",objectFit:"cover"}} />
          <div style={{padding:"8px"}}>
            <a href={v.url} download={v.name} target="_blank" rel="noreferrer"
              style={{display:"block",textAlign:"center",padding:"7px",background:"#21262d",color:"#58a6ff",borderRadius:"6px",textDecoration:"none",fontSize:"12px",fontWeight:600}}>⬇️ 다운로드</a>
          </div>
        </div>)}
      </div>
    </div>}

    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

// ─── TAB: 켄번스 효과 ─────────────────────────────────────────────────────
function VideoMakeKenTab() {
  const [images, setImages] = React.useState([]);
  const [settings, setSettings] = React.useState({});
  const [results, setResults] = React.useState([]);
  const [rendering, setRendering] = React.useState(false);
  const [progress, setProgress] = React.useState({ cur: 0, total: 0, msg: "" });
  const fileRef = React.useRef();
  const canvasRef = React.useRef();

  const EFFECTS = [
    {v:"zoom-in",l:"줌인 (확대)"},{v:"zoom-out",l:"줌아웃 (축소)"},
    {v:"pan-right",l:"패닝 → 오른쪽"},{v:"pan-left",l:"패닝 ← 왼쪽"},
    {v:"pan-up",l:"패닝 ↑ 위"},{v:"pan-down",l:"패닝 ↓ 아래"},
    {v:"zoom-in-pan",l:"줌인+패닝"},{v:"random",l:"🎲 랜덤"},
  ];
  const ALL_EFFECTS = ["zoom-in","zoom-out","pan-right","pan-left","pan-up","pan-down","zoom-in-pan"];

  const addImages = (files) => {
    Array.from(files).filter(f=>f.type.startsWith("image/")).forEach(file=>{
      const reader = new FileReader();
      reader.onload = e => {
        const id = Date.now() + Math.random();
        setImages(prev=>[...prev,{id,file,dataUrl:e.target.result,name:file.name}]);
        setSettings(prev=>({...prev,[id]:{effect:"zoom-in",duration:5,zoom:1.3}}));
      };
      reader.readAsDataURL(file);
    });
  };

  const setSetting = (id, key, val) => setSettings(prev=>({...prev,[id]:{...prev[id],[key]:val}}));

  const applyAll = (effect, dur) => {
    setSettings(prev=>{
      const next={...prev};
      Object.keys(next).forEach(id=>{
        if(effect) next[id]={...next[id],effect};
        if(dur) next[id]={...next[id],duration:parseInt(dur)};
      });
      return next;
    });
  };

  const renderClip = (dataUrl, effect, durationSec, zoom) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const W=1080, H=1920, fps=30, total=durationSec*fps;
      const canvas = canvasRef.current; canvas.width=W; canvas.height=H;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(fps);
      const rec = new MediaRecorder(stream,{mimeType:"video/webm;codecs=vp9",videoBitsPerSecond:4000000});
      const chunks=[]; rec.ondataavailable=e=>chunks.push(e.data);
      rec.onstop=()=>resolve(new Blob(chunks,{type:"video/webm"}));
      rec.start();
      let frame=0;
      const ia=img.width/img.height, ca=W/H;
      const baseW=ia>ca?H*zoom*ia:W*zoom, baseH=ia>ca?H*zoom:W*zoom/ia;
      const eff=effect==="random"?ALL_EFFECTS[Math.floor(Math.random()*ALL_EFFECTS.length)]:effect;
      const draw=()=>{
        if(frame>=total){rec.stop();return;}
        const t=frame/total; ctx.clearRect(0,0,W,H);
        let s=1,tx=0,ty=0;
        switch(eff){
          case"zoom-in":s=1+(zoom-1)*t;break;
          case"zoom-out":s=zoom-(zoom-1)*t;break;
          case"pan-right":tx=-(baseW-W)*t;break;
          case"pan-left":tx=-(baseW-W)*(1-t);break;
          case"pan-up":ty=-(baseH-H)*t;break;
          case"pan-down":ty=-(baseH-H)*(1-t);break;
          case"zoom-in-pan":s=1+(zoom-1)*t*.5;tx=-(baseW-W)*t*.3;break;
        }
        const dW=(ia>ca?H*ia:W)*s, dH=(ia>ca?H:W/ia)*s;
        ctx.drawImage(img,(W-dW)/2+tx,(H-dH)/2+ty,dW,dH);
        frame++; requestAnimationFrame(draw);
      };
      draw();
    };
    img.onerror=reject; img.src=dataUrl;
  });

  const startRender = async () => {
    if(images.length===0) return;
    setRendering(true); setResults([]);
    const newResults=[];
    for(let i=0;i<images.length;i++){
      const img=images[i]; const s=settings[img.id]||{effect:"zoom-in",duration:5,zoom:1.3};
      setProgress({cur:i+1,total:images.length,msg:`(${i+1}/${images.length}) ${img.name} 렌더링 중...`});
      try{
        const blob=await renderClip(img.dataUrl,s.effect,s.duration,s.zoom);
        newResults.push({url:URL.createObjectURL(blob),name:img.name.replace(/\.[^.]+$/,"")+"_ken.webm"});
      }catch(e){console.error(e);}
    }
    setResults(newResults); setRendering(false);
    setProgress({cur:newResults.length,total:images.length,msg:`✅ ${newResults.length}개 완료`});
    if(newResults.length>0) localStorage.setItem("vm_ken_results",JSON.stringify(newResults.map(r=>({name:r.name}))));
  };

  const S = {
    card:{background:"#0d1117",border:"1px solid #21262d",borderRadius:"12px",padding:"16px",marginBottom:"14px"},
    label:{fontSize:"11px",color:"#8b949e",fontWeight:600,marginBottom:"4px",display:"block"},
    select:{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:"6px",padding:"7px 10px",color:"#e6edf3",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",outline:"none"},
    btn:(c="#1f6feb")=>({padding:"10px 20px",border:"none",borderRadius:"8px",background:c,color:c==="#1f6feb"?"#fff":"#0d1117",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"7px"}),
  };

  return <div>
    <canvas ref={canvasRef} style={{display:"none"}} />

    {/* 업로드 */}
    <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"10px"}}>🖼️ 이미지 업로드</div>
      <div style={{background:"rgba(31,111,235,.08)",border:"1px solid rgba(31,111,235,.2)",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",color:"#8b949e",marginBottom:"10px",lineHeight:"1.6"}}>
        <strong style={{color:"#58a6ff"}}>켄번스 효과</strong>: 이미지에 줌인/아웃/패닝 등 카메라 움직임을 적용해 영상 생성 · <strong style={{color:"#3fb950"}}>완전 무료 · API 불필요</strong>
      </div>
      <div onClick={()=>fileRef.current.click()}
        style={{border:"2px dashed #30363d",borderRadius:"10px",padding:"28px",textAlign:"center",cursor:"pointer",background:"#161b22"}}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#58a6ff";}}
        onDragLeave={e=>{e.currentTarget.style.borderColor="#30363d";}}
        onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="#30363d";addImages(e.dataTransfer.files);}}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>addImages(e.target.files)} />
        <div style={{fontSize:"32px",marginBottom:"8px"}}>🖼️</div>
        <div style={{fontSize:"13px",color:"#8b949e"}}>클릭하거나 드래그해서 업로드</div>
      </div>
    </div>

    {/* 개별 설정 */}
    {images.length > 0 && <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"10px"}}>⚙️ 각 이미지별 설정</div>
      {/* 전체 일괄 적용 */}
      <div style={{display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap",background:"#161b22",padding:"10px 12px",borderRadius:"8px",border:"1px solid #30363d",alignItems:"flex-end"}}>
        <div style={{flex:1,minWidth:"120px"}}>
          <label style={S.label}>전체 효과 적용</label>
          <select style={S.select} defaultValue="" onChange={e=>e.target.value&&applyAll(e.target.value,"")}>
            <option value="">선택...</option>
            {EFFECTS.map(ef=><option key={ef.v} value={ef.v}>{ef.l}</option>)}
          </select>
        </div>
        <div style={{flex:1,minWidth:"100px"}}>
          <label style={S.label}>전체 길이 적용</label>
          <select style={S.select} defaultValue="" onChange={e=>e.target.value&&applyAll("",e.target.value)}>
            <option value="">선택...</option>
            {[3,5,8,10].map(d=><option key={d} value={d}>{d}초</option>)}
          </select>
        </div>
      </div>
      {/* 개별 카드 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:"10px"}}>
        {images.map(img=>{
          const s=settings[img.id]||{effect:"zoom-in",duration:5,zoom:1.3};
          return <div key={img.id} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",overflow:"hidden"}}>
            <img src={img.dataUrl} alt={img.name} style={{width:"100%",height:"100px",objectFit:"cover",display:"block"}} />
            <div style={{padding:"10px"}}>
              <div style={{fontSize:"11px",color:"#8b949e",marginBottom:"6px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{img.name}</div>
              <label style={S.label}>효과</label>
              <select style={{...S.select,marginBottom:"6px"}} value={s.effect} onChange={e=>setSetting(img.id,"effect",e.target.value)}>
                {EFFECTS.map(ef=><option key={ef.v} value={ef.v}>{ef.l}</option>)}
              </select>
              <label style={S.label}>길이</label>
              <select style={{...S.select,marginBottom:"6px"}} value={s.duration} onChange={e=>setSetting(img.id,"duration",parseInt(e.target.value))}>
                {[3,5,8,10].map(d=><option key={d} value={d}>{d}초</option>)}
              </select>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                <label style={{...S.label,margin:0}}>줌 강도</label>
                <span style={{fontSize:"11px",color:"#58a6ff",fontWeight:700}}>{s.zoom?.toFixed(1)}x</span>
              </div>
              <input type="range" min="1.1" max="2.0" step="0.1" value={s.zoom} style={{width:"100%",accentColor:"#1f6feb"}}
                onChange={e=>setSetting(img.id,"zoom",parseFloat(e.target.value))} />
              <button onClick={()=>setImages(prev=>prev.filter(p=>p.id!==img.id))}
                style={{width:"100%",marginTop:"6px",padding:"5px",border:"none",background:"#21262d",color:"#f85149",borderRadius:"5px",cursor:"pointer",fontSize:"11px"}}>✕ 제거</button>
            </div>
          </div>;
        })}
      </div>
      <div style={{marginTop:"14px",display:"flex",gap:"10px",flexWrap:"wrap"}}>
        <button style={S.btn()} disabled={rendering} onClick={startRender}>
          {rendering?<><span style={{width:"14px",height:"14px",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite",display:"inline-block"}}></span>렌더링 중...</>:"🎬 켄번스 영상 생성"}
        </button>
        <button style={S.btn("#21262d")} onClick={()=>{setImages([]);setResults([]);}}>🗑 초기화</button>
      </div>
    </div>}

    {/* 진행바 */}
    {(rendering||progress.msg) && <div style={S.card}>
      <div style={{fontSize:"12px",color:"#8b949e",marginBottom:"8px"}}>{progress.msg}</div>
      <div style={{background:"#30363d",borderRadius:"4px",height:"6px"}}>
        <div style={{width:`${progress.total?Math.round(progress.cur/progress.total*100):0}%`,height:"100%",borderRadius:"4px",background:"linear-gradient(90deg,#1f6feb,#3fb950)",transition:"width .4s"}} />
      </div>
    </div>}

    {/* 결과 */}
    {results.length > 0 && <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#3fb950",marginBottom:"12px"}}>✅ 렌더링 완료 ({results.length}개)</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"12px"}}>
        {results.map((v,i)=><div key={i} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",overflow:"hidden"}}>
          <video src={v.url} controls muted loop style={{width:"100%",display:"block",maxHeight:"180px",objectFit:"cover"}} />
          <div style={{padding:"8px"}}>
            <a href={v.url} download={v.name} style={{display:"block",textAlign:"center",padding:"7px",background:"#21262d",color:"#58a6ff",borderRadius:"6px",textDecoration:"none",fontSize:"12px",fontWeight:600}}>⬇️ 다운로드</a>
          </div>
        </div>)}
      </div>
    </div>}
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

// ─── TAB: 자막 + 음성 ─────────────────────────────────────────────────────
function VideoMakeSubTab() {
  const [videos, setVideos] = React.useState([]);
  const [position, setPosition] = React.useState("overlay-bottom");
  const [fontSize, setFontSize] = React.useState("24");
  const [fontColor, setFontColor] = React.useState("white");
  const [ttsRate, setTtsRate] = React.useState("1.0");
  const [voices, setVoices] = React.useState([]);
  const [voiceName, setVoiceName] = React.useState("");
  const [previewText, setPreviewText] = React.useState("");
  const [previewIdx, setPreviewIdx] = React.useState(null);
  const canvasRef = React.useRef();
  const fileRef = React.useRef();

  React.useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const ko = all.filter(v => v.lang.startsWith("ko"));
      const list = ko.length > 0 ? ko : all;
      setVoices(list);
      if (list.length > 0) setVoiceName(list[0].name);
    };
    window.speechSynthesis.onvoiceschanged = load;
    load();
  }, []);

  const addVideos = (files) => {
    Array.from(files).filter(f => f.type.startsWith("video/")).forEach(file => {
      setVideos(prev => [...prev, { id: Date.now()+Math.random(), file, url: URL.createObjectURL(file), name: file.name, subtitle: "" }]);
    });
  };

  const setSubtitle = (id, val) => setVideos(prev => prev.map(v => v.id === id ? {...v, subtitle: val} : v));
  const removeVideo = (id) => setVideos(prev => prev.filter(v => v.id !== id));

  const speak = (text) => {
    if (!text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find(v => v.name === voiceName);
    if (v) u.voice = v;
    u.rate = parseFloat(ttsRate);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const drawSubtitle = (ctx, text, W, H, videoH) => {
    const lines = text.split("\n").filter(l => l.trim());
    if (!lines.length) return;
    const fs = parseInt(fontSize);
    ctx.font = `bold ${fs}px 'Noto Sans KR',sans-serif`;
    ctx.textAlign = "center";
    if (position === "bar-bottom") {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, videoH, W, H - videoH);
      ctx.fillStyle = fontColor;
      lines.forEach((line, i) => ctx.fillText(line, W/2, videoH + 28 + i * (fs + 8) + fs/2));
    } else if (position === "overlay-bottom") {
      const bgH = lines.length * (fs + 12) + 20;
      const bgY = H - bgH - 36;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(16, bgY, W-32, bgH, 8); else ctx.rect(16, bgY, W-32, bgH);
      ctx.fill();
      ctx.fillStyle = fontColor;
      lines.forEach((line, i) => ctx.fillText(line, W/2, bgY + 16 + i * (fs + 8) + fs/2));
    } else {
      const bgH = lines.length * (fs + 12) + 20;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(16, 28, W-32, bgH, 8); else ctx.rect(16, 28, W-32, bgH);
      ctx.fill();
      ctx.fillStyle = fontColor;
      lines.forEach((line, i) => ctx.fillText(line, W/2, 44 + i * (fs + 8) + fs/2));
    }
  };

  const previewSubtitle = (v, idx) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const vid = document.createElement("video");
    vid.src = v.url;
    vid.onloadedmetadata = () => {
      const W = vid.videoWidth || 1080;
      const vH = vid.videoHeight || 1920;
      const H = position === "bar-bottom" ? vH + 120 : vH;
      canvas.width = W; canvas.height = H;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      vid.currentTime = 0.5;
      vid.onseeked = () => {
        ctx.drawImage(vid, 0, 0, W, vH);
        drawSubtitle(ctx, v.subtitle || "자막 미리보기", W, H, vH);
        setPreviewIdx(idx);
      };
    };
    vid.load();
  };

  const POS_OPTIONS = [
    { val:"overlay-bottom", icon:"📺", label:"영상 위 하단", desc:"반투명 배경 자막" },
    { val:"overlay-top", icon:"🔝", label:"영상 위 상단", desc:"상단 오버레이" },
    { val:"bar-bottom", icon:"⬛", label:"하단 검은 띠", desc:"별도 검은 영역" },
  ];

  const S = {
    card:{background:"#0d1117",border:"1px solid #21262d",borderRadius:"12px",padding:"16px",marginBottom:"14px"},
    label:{fontSize:"11px",color:"#8b949e",fontWeight:600,marginBottom:"4px",display:"block"},
    input:{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:"8px",padding:"8px 12px",color:"#e6edf3",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",outline:"none",boxSizing:"border-box"},
    btn:(c="#1f6feb")=>({padding:"9px 18px",border:"none",borderRadius:"7px",background:c,color:c==="#1f6feb"?"#fff":"#c9d1d9",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"6px"}),
    grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},
  };

  return <div>
    <canvas ref={canvasRef} style={{display:"none"}} />

    {/* 자막 위치 */}
    <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"12px"}}>📍 자막 위치 선택</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}}>
        {POS_OPTIONS.map(opt=><div key={opt.val} onClick={()=>setPosition(opt.val)}
          style={{border:`2px solid ${position===opt.val?"#1f6feb":"#30363d"}`,borderRadius:"10px",padding:"12px 8px",textAlign:"center",cursor:"pointer",background:position===opt.val?"rgba(31,111,235,.1)":"#161b22",transition:"all .15s"}}>
          <div style={{fontSize:"24px",marginBottom:"5px"}}>{opt.icon}</div>
          <div style={{fontSize:"12px",fontWeight:700,color:position===opt.val?"#58a6ff":"#e6edf3"}}>{opt.label}</div>
          <div style={{fontSize:"10px",color:"#484f58",marginTop:"2px"}}>{opt.desc}</div>
        </div>)}
      </div>
      <div style={S.grid2}>
        <div><label style={S.label}>폰트 크기</label>
          <select style={S.input} value={fontSize} onChange={e=>setFontSize(e.target.value)}>
            {[["18","작게"],["24","보통"],["32","크게"],["40","매우 크게"]].map(([v,l])=><option key={v} value={v}>{l} ({v}px)</option>)}
          </select></div>
        <div><label style={S.label}>자막 색상</label>
          <select style={S.input} value={fontColor} onChange={e=>setFontColor(e.target.value)}>
            <option value="white">흰색</option>
            <option value="yellow">노란색</option>
            <option value="#00ffcc">민트</option>
            <option value="#ff6584">핑크</option>
          </select></div>
      </div>
    </div>

    {/* TTS */}
    <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"10px"}}>🔊 음성(TTS) 설정 <span style={{fontSize:"11px",color:"#3fb950",fontWeight:400}}>완전 무료</span></div>
      <div style={S.grid2}>
        <div><label style={S.label}>음성 선택</label>
          <select style={S.input} value={voiceName} onChange={e=>setVoiceName(e.target.value)}>
            {voices.map(v=><option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select></div>
        <div><label style={S.label}>속도</label>
          <select style={S.input} value={ttsRate} onChange={e=>setTtsRate(e.target.value)}>
            {[["0.8","느리게"],["1.0","보통"],["1.2","빠르게"],["1.5","매우 빠르게"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select></div>
      </div>
      <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
        <input style={{...S.input,flex:1}} value={previewText} onChange={e=>setPreviewText(e.target.value)} placeholder="미리듣기 텍스트 입력" />
        <button style={S.btn("#21262d")} onClick={()=>speak(previewText||"안녕하세요 밴드폰입니다")}>▶ 미리듣기</button>
      </div>
    </div>

    {/* 영상 업로드 */}
    <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#58a6ff",marginBottom:"10px"}}>🎥 영상 업로드 & 자막 입력</div>
      <div onClick={()=>fileRef.current.click()}
        style={{border:"2px dashed #30363d",borderRadius:"10px",padding:"24px",textAlign:"center",cursor:"pointer",background:"#161b22",marginBottom:"12px"}}
        onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor="#58a6ff";}}
        onDragLeave={e=>{e.currentTarget.style.borderColor="#30363d";}}
        onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor="#30363d";addVideos(e.dataTransfer.files);}}>
        <input ref={fileRef} type="file" accept="video/*" multiple style={{display:"none"}} onChange={e=>addVideos(e.target.files)} />
        <div style={{fontSize:"28px",marginBottom:"6px"}}>🎥</div>
        <div style={{fontSize:"13px",color:"#8b949e"}}>영상 파일 업로드 (MP4, WebM 등)</div>
      </div>
      {videos.map((v,idx)=><div key={v.id} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
        <div style={{display:"flex",gap:"12px",alignItems:"flex-start"}}>
          <video src={v.url} muted style={{width:"80px",height:"56px",objectFit:"cover",borderRadius:"6px",background:"#000",flexShrink:0}} />
          <div style={{flex:1}}>
            <div style={{fontSize:"12px",fontWeight:600,color:"#e6edf3",marginBottom:"6px"}}>{v.name}</div>
            <textarea value={v.subtitle} onChange={e=>setSubtitle(v.id,e.target.value)}
              placeholder="자막 텍스트 입력 (줄바꿈으로 여러 줄 가능)"
              style={{...S.input,resize:"vertical",minHeight:"52px",lineHeight:"1.5",fontSize:"12px"}} rows={2} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"5px",flexShrink:0}}>
            <button style={S.btn("#21262d")} onClick={()=>previewSubtitle(v,idx)}>👁 미리보기</button>
            <button style={S.btn("#21262d")} onClick={()=>speak(v.subtitle)}>🔊 음성재생</button>
            <button style={{...S.btn("#21262d"),color:"#f85149"}} onClick={()=>removeVideo(v.id)}>✕</button>
          </div>
        </div>
      </div>)}
    </div>

    {/* 자막 미리보기 결과 */}
    {previewIdx !== null && <div style={S.card}>
      <div style={{fontSize:"13px",fontWeight:700,color:"#3fb950",marginBottom:"10px"}}>👁 자막 미리보기 (프레임)</div>
      <canvas ref={canvasRef} style={{width:"100%",maxWidth:"360px",display:"block",borderRadius:"8px",border:"1px solid #30363d"}} />
      <div style={{marginTop:"10px",fontSize:"12px",color:"#484f58"}}>
        💡 실제 영상+자막 합성은 CapCut, Premiere 등 영상편집 툴을 사용하거나, 위 켄번스/AI 생성 영상에 직접 자막을 넣으세요.<br/>
        아래 버튼으로 자막 프레임 이미지를 저장할 수 있어요.
      </div>
      <button style={{...S.btn("#21262d"),marginTop:"10px"}} onClick={()=>{
        canvasRef.current.toBlob(blob=>{
          const url=URL.createObjectURL(blob);
          const a=document.createElement("a"); a.href=url; a.download="subtitle_preview.png"; a.click();
        });
      }}>⬇️ 프레임 이미지 저장</button>
    </div>}
  </div>;
}

const TOOL_MAP={keyword:KeywordTab,autowrite:AutoWriteTab,analyze:AnalyzeTab,rewrite:ArticleRewriteTab,ocr:OcrTab,convert:ConvertTab,missing:MissingTab,restore:RestoreTab,video:VideoTab,videogif:VideoGifTab,exif:ExifTab,crop:CropTab,resize:ResizeTab,imgcompress:ImgCompressTab,emoji:EmojiTab,"videomake-ai":VideoMakeAiTab,"videomake-ken":VideoMakeKenTab,"videomake-sub":VideoMakeSubTab};


// ─── 블로그 글쓰기 공통 프롬프트 빌더 ───────────────────────────────────────
async function fetchBlogBodies(keyword) {
  try {
    const r = await fetch(`/api/blog-content?keyword=${encodeURIComponent(keyword)}`);
    const d = await r.json();
    if (d.success && d.bodies && d.bodies.length > 0) return d.bodies;
  } catch(e) {}
  return [];
}

// 이 키워드로 이미 상위에 노출 중인 글 제목 — 제목 중복 회피용
async function fetchTopTitles(keyword) {
  try {
    const r = await fetch(`/api/blog-titles?keyword=${encodeURIComponent(keyword)}`);
    const d = await r.json();
    return (d.titles || []).filter(Boolean);
  } catch(e) { return []; }
}

// 광고 노출 깊이(plAvgDepth)로 상업성 키워드를 판정
// 통합검색에서 광고가 먼저 뜨는 단어 = 제목에 쓰면 안 되는 단어
async function fetchCommercialWords(mainKw) {
  const found = new Set();
  try {
    const r = await fetch(`/api/keyword-stats?keywords=${encodeURIComponent(mainKw)}`);
    const d = await r.json();
    (d.keywordList || []).forEach(item => {
      if (isCommercialStat(item) && item.relKeyword) found.add(String(item.relKeyword).trim());
    });
  } catch(e) {}
  COMMERCIAL_SEED.forEach(w => found.add(w));
  return Array.from(found).slice(0, 30);
}

// 내 블로그 최근 제목에서 이미 과다 사용된 단어
// 누락확인 탭에서 조회한 적 있는 블로그 ID가 있으면 실제 글 제목을 쓰고,
// 없으면 이 도구로 생성했던 제목들로 대체한다.
async function fetchAvoidWords() {
  const bid = lsGet(LS_BLOGID, "");
  if (bid) {
    try {
      const r = await fetch(`/api/blog-posts?blogId=${encodeURIComponent(bid)}&page=1&size=30`);
      const d = await r.json();
      const titles = (d.posts || []).map(p => p.title).filter(Boolean);
      if (titles.length >= 10) return repeatedTitleWords(titles, 4);
    } catch(e) {}
  }
  return repeatedTitleWords(lsGet(LS_TITLES, []), 3);
}

// ─── 제목 패턴 로테이션 ────────────────────────────────────────────────────
const TITLE_PATTERNS = [
  { id: "number",     label: "숫자형",   guide: `"3가지", "5단계"처럼 글 구성 자체를 가리키는 숫자를 제목에 쓸 것. 가격·통계·기간 같은 사실 수치는 제목에 절대 쓰지 말 것` },
  { id: "question",   label: "질문형",   guide: `"~해도 될까?", "~하면 어떻게 될까?"처럼 독자가 실제로 검색창에 칠 법한 의문문으로 쓸 것` },
  { id: "experience", label: "경험담형", guide: `"직접 써봤습니다", "3개월 쓰고 남는 것"처럼 실사용자의 1인칭 경험을 드러낼 것` },
  { id: "compare",    label: "비교형",   guide: `"A vs B", "싼 것과 비싼 것의 차이"처럼 두 대상을 맞세우는 구도로 쓸 것` },
  { id: "howto",      label: "방법형",   guide: `"~하는 법", "~할 때 확인할 것"처럼 절차·해결 과정을 알려주는 형태로 쓸 것` },
  { id: "caution",    label: "주의형",   guide: `"~전에 알아야 할 것", "놓치기 쉬운 부분"처럼 실수·함정을 짚어주는 형태로 쓸 것` },
];

const LS_PATTERNS = "bp_title_patterns";   // 최근 사용한 제목 패턴 id (최신순)
const LS_TITLES   = "bp_recent_titles";    // 이 도구로 생성한 최근 제목
const LS_BLOGID   = "bp_blog_id";          // 누락확인 탭에서 마지막으로 조회한 블로그 ID

function lsGet(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}
function lsSet(key, val) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

// 최근 2회에 쓴 패턴은 제외하고, 누적 사용이 가장 적은 패턴을 고름
function pickTitlePattern() {
  const recent = lsGet(LS_PATTERNS, []);
  const blocked = new Set(recent.slice(0, 2));
  const count = {};
  TITLE_PATTERNS.forEach(p => { count[p.id] = 0; });
  recent.forEach(id => { if (count[id] !== undefined) count[id] += 1; });
  const pool = TITLE_PATTERNS.filter(p => !blocked.has(p.id));
  const candidates = pool.length > 0 ? pool : TITLE_PATTERNS;
  let best = candidates[0];
  candidates.forEach(p => { if (count[p.id] < count[best.id]) best = p; });
  return best;
}
function recordTitleUse(patternId, title) {
  const recent = lsGet(LS_PATTERNS, []);
  lsSet(LS_PATTERNS, [patternId].concat(recent).slice(0, 20));
  if (title) {
    const titles = lsGet(LS_TITLES, []);
    lsSet(LS_TITLES, [title].concat(titles).slice(0, 60));
  }
}

// ─── 제목 어휘 분석 ────────────────────────────────────────────────────────
const TITLE_STOPWORDS = new Set([
  "그리고","하지만","그래서","이제","정말","진짜","오늘","이번","다음","최근",
  "우리","제가","저는","해서","해도","하는","하고","있는","없는","같은","위한","대한",
]);

// 제목에서 의미 있는 2글자 이상 토큰만 추출
function titleTokens(str) {
  return String(str || "")
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !TITLE_STOPWORDS.has(t));
}

// 두 제목 사이의 토큰 중복 개수
function tokenOverlap(a, b) {
  const setB = new Set(titleTokens(b));
  return titleTokens(a).filter(t => setB.has(t)).length;
}

// 최근 제목들에서 과다 사용된 단어 (기본 3회 이상)
function repeatedTitleWords(titles, minCount = 3) {
  const count = {};
  (titles || []).forEach(t => {
    new Set(titleTokens(t)).forEach(tok => { count[tok] = (count[tok] || 0) + 1; });
  });
  return Object.keys(count)
    .filter(k => count[k] >= minCount)
    .sort((a, b) => count[b] - count[a])
    .slice(0, 12);
}

// ─── 상업성 키워드 ────────────────────────────────────────────────────────
// 통합검색에서 광고가 먼저 노출되는 성격의 단어들 (기본 시드)
const COMMERCIAL_SEED = [
  "병원","법률","변호사","보험","맛집","술집","웨딩","안경","안마","대출","코인",
  "운전연수","주차대행","문신","다이어트","탈모","왁싱","누수","이사","견적","시공",
  "설치","분양","임플란트","교정","클리닉","시술","최저가","할인","특가","이벤트","무료",
];

// 네이버 광고 API 응답으로 상업성 판정
// plAvgDepth = 통합검색에 노출되는 평균 광고 개수 → 이게 높을수록 상업성 키워드
function isCommercialStat(item) {
  if (!item) return false;
  const depth = Number(item.plAvgDepth);
  if (!isNaN(depth) && depth >= 8) return true;
  return item.compIdx === "높음";
}

// ─── 글쓰기 프롬프트 빌더 ──────────────────────────────────────────────────
function buildWritePrompt({
  kw, yearMonth, today, category, smartBlockType, blogStrategy, bodies, mainKeyword,
  topTitles, commercialWords, avoidWords, pattern,
}) {
  const mainKw = mainKeyword || kw;
  const ctx = category
    ? `카테고리: ${category}`
    : `스마트블록: ${smartBlockType||"블로그"} / 전략: ${blogStrategy||""}`;

  // 참고자료(상위 노출 블로그 본문)가 있으면 사실 근거로 제공
  const refBlock = (bodies && bodies.length > 0)
    ? `\n[참고자료 — 이 키워드 상위 노출 글 본문]\n${bodies.slice(0,3).map((b,i)=>`(${i+1})\n${String(b).slice(0,1800)}`).join("\n\n")}\n\n※ 참고자료는 "사실 확인용"으로만 사용. 문장·표현을 베끼지 말 것.\n※ 참고자료에도 없는 수치·날짜·가격은 절대 만들어내지 말 것.\n`
    : "";

  // 이미 상위를 점유한 제목들 — 제목 중복 회피용
  const titleBlock = (topTitles && topTitles.length > 0)
    ? `\n[이미 상위에 노출 중인 글 제목 — 이것과 겹치지 않게 쓸 것]\n${topTitles.slice(0,15).map((t,i)=>`${i+1}. ${t}`).join("\n")}\n`
    : "";

  const pat = pattern || TITLE_PATTERNS[0];

  const commercialBlock = (commercialWords && commercialWords.length > 0)
    ? `\n[제목에 쓰면 안 되는 상업성 단어]\n${commercialWords.join(", ")}\n※ 이 단어들은 통합검색에서 광고가 먼저 뜨는 상업성 키워드입니다. 제목에 넣으면 저품질로 분류될 확률이 올라갑니다. 본문에서 꼭 필요하면 최소한으로만 쓰고, 제목에는 절대 쓰지 마세요.\n`
    : "";

  const avoidBlock = (avoidWords && avoidWords.length > 0)
    ? `\n[최근 내 블로그 제목에 이미 많이 쓴 단어 — 이번 제목에는 쓰지 말 것]\n${avoidWords.join(", ")}\n※ 같은 단어가 제목마다 반복되면 블로그 전체 점수가 떨어집니다.\n`
    : "";

  return `오늘 날짜: ${today || yearMonth} / 키워드: "${mainKw}" / 주제: "${kw}" / ${ctx}
${refBlock}${titleBlock}${commercialBlock}${avoidBlock}
네이버 블로그 홈판 노출 + AI 브리핑(AEO) 인용 최적화 글을 작성해줘:

[주제 원칙 — 글의 범위를 정하는 기준. 사실 원칙 다음으로 우선한다]
S1. 이 글이 다루는 것은 "${kw}" 하나뿐이다. 제목·소제목·본문 전부 이 주제의 하위 내용이어야 한다.
S2. 소제목을 정하기 전에 스스로 확인할 것 — "이 소제목은 주제를 더 깊게 파는가, 옆으로 새는가?"
    옆으로 새는 소제목은 버릴 것. 주제를 넓히지 말고 깊게 팔 것.
S3. 주제에 없는 축으로 확장 금지. 주제가 "설정 방법"이면 제품 비교·가격 비교·기종 호환성 목록·
    업체 추천 같은 다른 축으로 넘어가지 말 것. 그런 내용은 따로 쓸 글의 소재이지 이 글의 소제목이 아니다.
    글이 짧아질까 봐 다른 축을 끌어오지 말고, 같은 주제 안에서 단계·상황·예외를 더 자세히 쓸 것.
S4. 참고자료는 사실 확인용이다. 참고자료의 소제목 구성이나 목차를 따라가지 말 것.
    다른 글이 다섯 가지를 다뤘다고 해서 이 글도 그럴 이유는 없다.
S5. 주제에 "직접 써보고", "후기", "정리", "비교" 같은 표현이 있으면 그 관점을 글 전체에서 유지할 것.
    주제가 경험담이면 끝까지 경험담으로 쓸 것.

[사실 원칙 — 다른 모든 규칙보다 우선]
A. 확실하지 않은 정보를 사실처럼 단정하지 말 것. 애매하면 아예 쓰지 않는 쪽을 택할 것.
B. 아래 항목은 확실히 아는 경우가 아니면 절대 지어내지 말 것:
   - 가격, 요금, 할인액, 지원금 액수
   - 통계, 퍼센트, 판매량, 순위, 평점, 후기 개수
   - 출시일, 시행일, 마감일, "N월부터 달라집니다" 같은 시점 정보
   - 제품 모델명, 스펙, 세부 기능, 옵션 구성
   - 법령·제도·정책·약관의 구체적 내용과 조건
   - 기업·기관·인물의 발표 내용, 공식 입장, 인용문
   - 논문·조사·연구 결과 및 그 출처
C. B의 정보가 글에 꼭 필요할 때 — 기본은 (a)다:
   (a) 문장 구조는 구체적으로 유지하고 확신 없는 값만 [확인필요: 항목명]으로 비워둘 것 (한 글에 최대 3개)
       (O) "기본 요금은 [확인필요: 월 요금]원이고, 약정 조건에 따라 달라집니다"
       (O) "신청 마감은 [확인필요: 마감일]까지이며, 이후에는 접수되지 않습니다"
   (b) 항목 자체가 글의 곁가지라 비워둘 가치도 없을 때만 정성적 표현으로 대체
       ("가격대가 부담되는 편입니다")
   ※ 값을 모른다고 문장 전체를 뭉뚱그리지 말 것. 뭉개진 문장은 AI 브리핑이 인용하지 못하고,
     나중에 작성자가 사실을 채워 넣을 수도 없어서 글의 가치가 사라진다.
D. 시점 표현: 오늘은 ${today || yearMonth}이지만, 최근 정보는 정확히 모를 수 있음.
   "${yearMonth} 기준 ~입니다"라고 단정하는 문장은 정말 확실할 때만 쓸 것.
   불확실하면 "지금은 달라졌을 수 있으니 확인해보시는 게 좋습니다" 식으로 열어둘 것.
E. 경험담은 자유롭게 써도 되지만, 검증 가능한 수치가 아니라 과정·판단·체감 중심으로 쓸 것.
   (X) "3개월 써보니 배터리가 27% 감소했습니다"
   (O) "3개월쯤 쓰니 하루를 못 버티는 날이 눈에 띄게 늘었습니다"
F. 의견은 의견인 게 드러나게 쓸 것 — "개인적으로는", "제 기준에서는", "제가 겪어본 범위에서는".
G. 구체적이지만 틀린 글보다, 덜 구체적이어도 맞는 글이 낫다.

[브랜드·상표 원칙]
H. 특정 브랜드·제품·서비스명이 등장하면, 그 대상에 관해 정확한 내용만 쓸 것.
I. 공식 표기를 그대로 사용할 것 — 임의 축약, 오탈자, 존재하지 않는 모델명·세대 표기 금지.
   모델명·세대·스펙이 확실하지 않으면 아예 언급하지 말고 카테고리 수준으로 쓸 것 (예: "최근 폴더블 모델").
J. 브랜드에 사실이 아닌 기능·가격·정책·혜택을 갖다 붙이지 말 것.
   A사의 기능을 B사 것처럼 쓰거나, 제조사·통신사·유통점의 역할과 책임을 섞지 말 것.
K. 브랜드 간 비교는 확인 가능한 일반적 차이 또는 개인적 체감으로 한정.
   근거 없는 우열 단정, 비방, 허위 비교는 금지.
L. 확실한 부분과 불확실한 부분이 섞이면, 확실한 것만 쓰고 나머지는 [확인필요: 항목명]으로 남길 것.

[제목 원칙]
T1. 이번 글의 제목 패턴은 "${pat.label}"으로 고정한다. ${pat.guide}
    다른 패턴으로 쓰지 말 것.
T2. 길이는 공백 포함 15~32자. 이 범위를 벗어나면 실패다.
T3. 메인 키워드 "${mainKw}"를 제목 안에 그대로(띄어쓰기 포함 형태 그대로) 넣을 것.
T4. 위 [이미 상위에 노출 중인 글 제목] 중 어느 하나와도 2글자 이상 단어가 3개 넘게 겹치면 안 된다.
    겹치는 조합을 피해 다른 각도에서 접근할 것. 같은 소재라도 다루는 측면을 바꾸면 된다.
T5. 상업성 단어와 최근 반복 단어를 제목에 쓰지 말 것 (위 목록 참고).
T6. 제목에 사실 원칙 B에 해당하는 수치(가격·기간·퍼센트)를 넣지 말 것.
T7. 제목은 주제 "${kw}"의 핵심 행위나 관점을 담을 것. 주제가 "설정 방법"인데
    제목이 제품 비교나 추천처럼 읽히면 안 된다.

[구조 원칙]
1. 본문 1,500~2,000자 (한글+공백)
2. 소제목 ▶ 형식 3~4개 (마크다운/HTML 금지)
   - 모든 소제목은 "${kw}"의 하위 항목이어야 한다. 하나라도 옆길로 새면 실패다
   - 이 중 최소 1개는 독자가 검색창에 칠 법한 질문형 소제목으로 쓸 것
     (예: "▶ 개통 전에 유심을 먼저 사도 될까?")
3. 각 문장 끝 줄바꿈(\\n)만 사용, HTML 태그(<br> 등) 절대 금지
4. 해시태그는 본문에 쓰지 말 것 — JSON의 tags 배열에만 담을 것 (본문 끝에는 붙이지 않는다)
5. 도입부 구조 (홈판 미리보기 + AI 인용 최적화):
   - 첫 문장: 이 글의 결론 또는 핵심 정의를 한 문장으로 단정해서 제시
     (인사말·계절 묘사·자기소개 절대 금지)
   - 둘째 문장: 그 결론이 성립하는 조건이나 예외를 한 줄로 덧붙임
   - 셋째 문장: 작성자의 직접 경험 근거 1줄 (예: "직접 3곳을 비교해봤습니다")

[AEO 원칙 — AI 브리핑 인용을 위한 조건]
AEO1. 도입부 3문장 안에 "X는 ~입니다" 형태의 정의·결론 문장을 최소 1개 넣을 것.
      AI가 글에서 가장 먼저 떼어가는 문장이 여기다.
AEO2. 각 소제목 아래 첫 문장은 그 소제목 질문에 대한 답을 바로 제시할 것.
      배경 설명부터 시작하지 말 것 — 답 먼저, 설명은 그 다음.
AEO3. 정보를 설명하는 문단은 자기완결형으로 쓸 것. 앞 문단을 읽지 않아도 그 문단만 떼어내서
      읽었을 때 뜻이 통해야 한다. "이것", "그건", "위에서 말한" 같은 앞뒤 의존 표현 금지.
      ※ 단, 경험을 서술하는 문단에는 이 규칙을 적용하지 않는다. 경험은 흐름이 있어야 읽히므로
        자연스럽게 이어 쓸 것. 다만 그 문단만 읽어도 무슨 상황인지는 알 수 있어야 한다.
AEO4. "자주 묻는 질문" 블록은 여기서 쓰지 말 것 — 다음 단계에서 따로 붙인다.
      대신 본문이 그 블록으로 자연스럽게 이어지도록 마무리할 것.
AEO5. 조건·절차·기준처럼 항목이 나뉘는 내용은 줄바꿈으로 한 줄씩 끊어서 쓸 것.
      한 문단에 여러 조건을 뭉쳐 넣지 말 것.
AEO6. 사실 원칙 C를 지키되, 인용 가치가 있는 문장 구조는 반드시 유지할 것.
      값을 모르면 [확인필요:]로 비워두고 문장은 구체적으로 쓴다.

[경험 원칙 — 이 글을 AI가 쓴 글과 구분 짓는 부분]
E1. 경험을 소제목 끝에 한 덩어리로 몰아넣지 말 것. 설명하는 도중에 섞어 넣을 것.
    (X) 절차 설명 → 절차 설명 → 마지막에 "저는 ~한 적이 있습니다"
    (O) 절차를 설명하다가 "이 단계에서 저는 ~해서 ~했습니다"로 바로 이어지는 구조
E2. 같은 형태의 문장으로 경험을 반복하지 말 것.
    "저는 ~한 적이 있습니다. 그 뒤로는 ~합니다"를 소제목마다 반복하면 그게 더 기계적으로 읽힌다.
    문장 형태를 매번 바꿀 것.
E3. 경험 대목에는 장면 하나가 들어 있어야 한다 — 언제, 어디서, 무엇을 하려다, 어떻게 됐는지.
    "불편했습니다" 같은 평가만 쓰지 말고 그 상황을 보여줄 것.
E4. 최소 두 군데는 '왜 그렇게 했는지'를 쓸 것. 판단의 이유와 비교해본 선택지가 드러나야 한다.
    정보는 검색하면 나오지만 판단 근거는 겪어본 사람만 쓸 수 있다.
E5. 경험과 설명의 비중은 대략 3:7. 경험이 부록처럼 붙는 게 아니라 설명의 근거로 쓰여야 한다.

[내용 원칙 — C-Rank / DIA]
8. 메인 키워드 최대 6회, 첫 줄 자기소개 금지, 광고성 표현 금지
9. 경험에서 나온 구체적 사례 포함 — 위 [경험 원칙]을 따를 것
   (지어낸 수치·날짜·모델명으로 구체성을 만들지 말 것. 구체성은 '과정 묘사'로 낼 것)
10. 창작자 고유의 시선과 인사이트 포함 — AI가 쉽게 만들 수 없는 개인 관점
11. 수치·통계·업계 기준은 확실히 아는 경우에만 넣을 것. 확실하지 않으면 [확인필요:]로 처리하고,
    판단 기준·비교 관점·체크리스트로 신뢰도를 보강할 것
12. 단순 정보 나열이 아닌 독자에게 실질적으로 도움되는 내용 중심
13. 문체: -니다/-요 혼용, 정보성+경험담
14. 시의성은 '변할 수 있다'는 전제로 다룰 것

[마무리]
15. 본문 마지막에 "▶ 정리" 소제목을 따로 두고 마무리할 것 (앞 소제목 안에 뭉쳐 넣지 말 것):
    - 핵심 내용 요약 2~3줄 (각 줄이 독립적으로 읽히게)
    - 요약으로 끝낼 것. 그 뒤에 아무 말도 덧붙이지 말 것.
    ※ 댓글·공감·구독을 유도하는 문장은 절대 쓰지 말 것.
      "댓글로 경험 공유해주세요", "도움이 되셨다면", "궁금한 점은 댓글로",
      "다음 글에서 만나요" 같은 맺음말 전부 금지.
      저품질 신호로 잡히고, AI 브리핑이 인용할 문단 사이에 끼면 문맥이 끊긴다.

[금지사항]
- 확인되지 않은 가격·수치·날짜·스펙을 사실처럼 쓰는 것 (가장 중요)
- 존재하지 않는 기관·조사·논문·뉴스를 출처로 인용하는 것
- 실제로 없는 후기·사례·인물을 만들어내 인용하는 것
- 뻔한 일반 정보만 나열하는 글 (누구나 아는 내용만 반복)
- 맥락 없이 키워드만 끼워 넣는 표현
- AI가 기계적으로 생성한 느낌의 틀에 박힌 문장 패턴
- 도입부를 인사말, 날씨·계절 묘사, 자기소개로 시작하는 것
- 소제목 없이 긴 문단이 연속되는 구조 (각 소제목 간격 400자 이내 유지)
- 앞 문단에 의존하는 지시대명사로 문단을 시작하는 것
- 댓글·공감·구독 유도 문장, 인사성 맺음말 (한 문장도 쓰지 말 것)

순수 JSON만 (마크다운 없이):
{"title":"제목(${pat.label}, 15~32자, "${mainKw}" 포함)","main_keyword":"${mainKw}","content":"본문(해시태그·자주묻는질문 제외)","tags":["태그1","태그2","태그3","태그4","태그5"],"uncertain":["글에서 확인이 필요한 항목이 있으면 나열, 없으면 빈 배열"]}`;
}

// ─── [확인필요:] 항목 자동 해결 ────────────────────────────────────────────
// 글 생성 직후 웹 검색으로 실제 값을 채운다.
// 검색으로 확인되면 값을 넣고, 확인이 안 되면 알려진 대략 범위 + 확인 안내 문구로 대체한다.
// 어느 쪽도 안 되면 [확인필요:]를 그대로 남겨 작성자가 채우게 한다.

function extractPlaceholders(text) {
  const out = [];
  const re = /\[확인필요:\s*([^\]]+)\]/g;
  let m;
  while ((m = re.exec(String(text || ""))) !== null) {
    const label = m[1].trim();
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

async function resolveUncertainValues({ placeholders, title, mainKw, text }) {
  const prompt = `아래 블로그 글에 확인이 필요한 항목이 남아 있습니다. 웹에서 검색해서 실제 값을 찾아주세요.

글 제목: ${title || ""}
메인 키워드: ${mainKw || ""}
오늘 날짜: ${new Date().toLocaleDateString("ko-KR")}

확인이 필요한 항목:
${placeholders.map((x, i) => `${i + 1}. ${x}`).join("\n")}

글의 맥락 (어떤 상황에서 쓰인 값인지 파악용):
${String(text || "").slice(0, 2000)}

각 항목을 이 순서로 처리하세요:
1) 웹 검색으로 확실히 확인되면 → found: true, value에 값, source에 URL
2) 확인은 안 되지만 인터넷에 일반적으로 알려진 범위가 있으면 → found: false, approx에 범위
   - 반드시 범위나 근사 표현으로 쓸 것 ("대략 5,000~8,000", "보통 하루 1GB 안팎")
   - 하나의 값으로 단정하지 말 것
3) 근거가 전혀 없으면 → found: false, approx는 빈 문자열
   - 이 경우 아무 값도 지어내지 말 것. 빈 값이 틀린 값보다 낫다

지켜야 할 것:
- 검색하지 않고 기억이나 통념으로 value를 채우지 말 것
- 공식 출처(사업자 공식 홈페이지, 정부·기관 사이트, 통신사 요금제 페이지)를 우선할 것
- value와 approx는 본문에 그대로 들어갈 짧은 형태로 (숫자·날짜 위주, 단위와 조사는 본문에 이미 있음)
- checkAt에는 독자가 직접 확인하기 좋은 곳을 적을 것 (예: "각 통신사 로밍 요금제 페이지")
- note에는 조건이나 기준 시점을 한 줄로 (예: "요금제별로 다름", "2026년 8월 기준")

순수 JSON만 출력:
{"items":[{"label":"항목명(위 목록과 똑같이)","found":true,"value":"찾은 값","source":"https://...","sourceName":"출처 사이트명","note":"조건·기준 시점","checkAt":"확인할 곳"},{"label":"...","found":false,"approx":"대략 범위 또는 빈 문자열","checkAt":"확인할 곳","reason":"찾지 못한 이유"}]}`;

  const raw = await callClaudeSearch(
    [{ role: "user", content: prompt }],
    `You verify factual placeholders in Korean blog drafts using web search.

Search before answering every item. Never fill value from memory or from what seems typical — if the search does not confirm it, set found to false.
When the search fails but a commonly published range exists, put a hedged range in approx. Never state a single figure there.
When there is no basis at all, leave approx empty. An empty value is better than a wrong one.
Prefer official primary sources. Output ONLY valid JSON.`,
    4000, "claude-sonnet-4-5-20250929", Math.min(placeholders.length * 2 + 2, 10)
  );

  return (safeParseJson(raw)?.items || []).filter(x => x && x.label);
}

// 찾은 값을 본문에 반영하고, 대략치를 쓴 경우 확인 안내 문장을 덧붙인다
function applyResolvedValues(text, items) {
  let out = String(text || "");
  const approxUsed = [];
  const unresolved = [];
  const sources = [];

  (items || []).forEach(it => {
    const esc = String(it.label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("\\[확인필요:\\s*" + esc + "\\s*\\]", "g");

    if (it.found && it.value) {
      out = out.replace(re, String(it.value));
      if (it.source) sources.push({ name: it.sourceName || it.source, url: it.source });
    } else if (it.approx) {
      out = out.replace(re, String(it.approx));
      approxUsed.push(it);
    } else {
      unresolved.push(it.label);
    }
  });

  // 대략치가 들어갔으면 마지막에 확인 안내를 한 번만 붙인다
  if (approxUsed.length > 0) {
    const where = approxUsed.map(x => x.checkAt).filter(Boolean)[0] || "공식 홈페이지";
    out = out.trimEnd() +
      `\n\n위에 적은 수치는 시점과 조건에 따라 달라질 수 있는 값이라 대략적인 기준으로만 봐주세요. 정확한 내용은 ${where}에서 직접 확인하시는 게 가장 정확합니다.`;
  }

  return { text: out, approxUsed, unresolved, sources };
}

// ─── 생성된 제목 검증 ──────────────────────────────────────────────────────
// 통과하지 못하면 사유를 돌려주고, 호출부에서 1회 재생성한다.
function validateTitle(title, { mainKw, topTitles, commercialWords, avoidWords }) {
  const t = String(title || "").trim();
  const reasons = [];

  if (!t) return { ok: false, reasons: ["제목이 비어 있음"] };
  if (t.length < 15 || t.length > 32) reasons.push(`길이 ${t.length}자 (15~32자 필요)`);

  const flat = s => String(s || "").replace(/\s+/g, "");
  if (mainKw && !flat(t).includes(flat(mainKw))) reasons.push(`메인 키워드 "${mainKw}" 미포함`);

  const dup = (topTitles || []).find(o => tokenOverlap(t, o) > 3);
  if (dup) reasons.push(`상위 노출 글과 단어 과다 중복 → "${String(dup).slice(0,20)}…"`);

  const hitCommercial = (commercialWords || []).filter(w => t.includes(w));
  if (hitCommercial.length > 0) reasons.push(`상업성 단어 포함: ${hitCommercial.join(", ")}`);

  const hitAvoid = (avoidWords || []).filter(w => t.includes(w));
  if (hitAvoid.length > 0) reasons.push(`최근 반복 단어 포함: ${hitAvoid.join(", ")}`);

  return { ok: reasons.length === 0, reasons };
}

function PasswordGate({children}){
  // 인증 상태는 서버가 굽는 httpOnly 쿠키가 진실이다.
  // 브라우저 저장소 값으로는 통과할 수 없다.
  const [auth,setAuth]=useState(null);   // null = 확인 중
  const [pw,setPw]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try{
        const r=await fetch("/api/auth-status");
        const d=await r.json();
        if(alive) setAuth(!!d.ok);
      }catch(e){ if(alive) setAuth(false); }
    })();
    return ()=>{ alive=false; };
  },[]);

  // API가 401을 돌려주면(세션 만료 등) 즉시 잠금 화면으로 되돌린다
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const orig=window.fetch;
    window.fetch=async(...args)=>{
      const res=await orig(...args);
      try{
        const url=typeof args[0]==="string"?args[0]:args[0]?.url||"";
        if(res.status===401&&url.startsWith("/api/")) setAuth(false);
      }catch(e){}
      return res;
    };
    return ()=>{ window.fetch=orig; };
  },[]);

  const submit=async()=>{
    if(!pw.trim()) return;
    setLoading(true); setErr("");
    try{
      const r=await fetch("/api/verify-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});
      const d=await r.json();
      if(d.ok){ setPw(""); setAuth(true); }
      else{ setErr(d.error||"비밀번호가 틀렸습니다."); }
    }catch(e){ setErr("오류가 발생했습니다. 다시 시도해주세요."); }
    setLoading(false);
  };

  if(auth===null) return(
    <div style={{minHeight:"100vh",background:"#0d1117",display:"flex",alignItems:"center",justifyContent:"center",color:"#484f58",fontSize:"13px"}}>
      확인 중...
    </div>
  );

  if(auth) return children;

  return(
    <div style={{minHeight:"100vh",background:"#0d1117",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"16px",padding:"48px 40px",width:"100%",maxWidth:"380px",textAlign:"center"}}>
        <div style={{fontSize:"32px",marginBottom:"16px"}}>🔒</div>
        <div style={{fontSize:"20px",fontWeight:700,color:"#e6edf3",marginBottom:"8px"}}>비밀번호를 입력해주세요</div>
        <div style={{fontSize:"14px",color:"#8b949e",marginBottom:"32px"}}>접근 권한이 필요합니다.</div>
        <input
          type="password"
          value={pw}
          onChange={e=>setPw(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          placeholder="비밀번호"
          style={{width:"100%",padding:"12px 16px",background:"#0d1117",border:"1px solid #30363d",borderRadius:"8px",color:"#e6edf3",fontSize:"15px",outline:"none",boxSizing:"border-box",marginBottom:"12px"}}
          autoFocus
        />
        {err&&<div style={{color:"#f85149",fontSize:"13px",marginBottom:"12px"}}>{err}</div>}
        <button
          onClick={submit}
          disabled={loading}
          style={{width:"100%",padding:"12px",background:"#238636",border:"none",borderRadius:"8px",color:"#fff",fontSize:"15px",fontWeight:700,cursor:"pointer",opacity:loading?0.7:1}}
        >{loading?"확인 중...":"입력"}</button>
      </div>
    </div>
  );
}

export default function BlogTools(){
  const [active,setActive]=useState("keyword");
  const [isMobile]=useState(()=>typeof window!=="undefined"&&window.matchMedia("(pointer:coarse)").matches);
  const [writeMenuOpen,setWriteMenuOpen]=useState(false);
  const [imgMenuOpen,setImgMenuOpen]=useState(false);
  const [videoMenuOpen,setVideoMenuOpen]=useState(false);
  const [dropdownTop, setDropdownTop] = useState(96);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const writeBtnRef = useRef(null);
  const writeMenuRef = useRef(null);
  const [writeDropdownTop,setWriteDropdownTop]=useState(0);
  const [writeDropdownLeft,setWriteDropdownLeft]=useState(0);
  const imgBtnRef = useRef(null);
  const imgMenuRef = useRef(null);
  const videoBtnRef = useRef(null);
  const videoMenuRef = useRef(null);
  const [videoDropdownTop,setVideoDropdownTop]=useState(0);
  const [videoDropdownLeft,setVideoDropdownLeft]=useState(0);
  const [kwResult,setKwResult]=useState(null);
  const [pendingKeywordSearch,setPendingKeywordSearch]=useState("");
  const [pendingAnalyzeText,setPendingAnalyzeText]=useState("");
  const [pendingAnalyzePost,setPendingAnalyzePost]=useState(null); // {title,main_keyword,content,tags}
  // AnalyzeTab 상태 (탭 이동해도 유지)
  const [analyzeText,setAnalyzeText]=useState("");
  const [analyzeAiResult,setAnalyzeAiResult]=useState(null);
  const [analyzeLastText,setAnalyzeLastText]=useState("");
  const [analyzeThreshold,setAnalyzeThreshold]=useState(5);
  const [analyzeReplacements,setAnalyzeReplacements]=useState({});
  const [analyzeWorkingText,setAnalyzeWorkingText]=useState("");
  const [analyzeActiveSection,setAnalyzeActiveSection]=useState("morpheme");
  const [analyzePostMeta,setAnalyzePostMeta]=useState(null); // 부모로 올려서 안전하게 공유
  // 키워드탭 글쓰기: 자동 생성 후 분석탭으로 이동
  const goAutoWrite=async(kw, smartBlockType, smartBlockReason, blogStrategy, mainKeyword)=>{
    setAnalyzePostMeta(null);
    setAnalyzeText("");
    setAnalyzeAiResult(null);
    setAnalyzeLastText("");
    setAnalyzeWorkingText("");
    setAnalyzeReplacements({});
    setPendingAnalyzeText("__loading__");
    setActive("analyze");
    try{
      const now = new Date();
      const yearMonth = `${now.getFullYear()}년 ${now.getMonth()+1}월`;
      const todayStr  = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일`;
      const mainKw = mainKeyword || kw;

      // 상위 노출 글 본문 / 상위 제목 / 상업성 단어 / 최근 반복 단어를 병렬로 확보
      // (12초 안에 안 오는 항목은 비워둔 채 그냥 진행)
      const withTimeout = (p, ms, fallback) =>
        Promise.race([p, new Promise(r => setTimeout(() => r(fallback), ms))]);

      const [bodies, topTitles, commercialWords, avoidWordsRaw] = await Promise.all([
        withTimeout(fetchBlogBodies(mainKw), 12000, []),
        withTimeout(fetchTopTitles(mainKw), 8000, []),
        withTimeout(fetchCommercialWords(mainKw), 8000, []),
        withTimeout(fetchAvoidWords(), 8000, []),
      ]);

      // 메인 키워드는 제목에 반드시 들어가야 하므로 금지 목록에서 제외
      const flat = s => String(s||"").replace(/\s+/g,"");
      const avoidWords = avoidWordsRaw.filter(w => !flat(mainKw).includes(flat(w)));
      const banWords   = commercialWords.filter(w => !flat(mainKw).includes(flat(w)));

      const pattern = pickTitlePattern();

      const prompt = buildWritePrompt({
        kw, yearMonth, today: todayStr, smartBlockType, blogStrategy,
        bodies, mainKeyword: mainKw,
        topTitles, commercialWords: banWords, avoidWords, pattern,
      });

      const sysPrompt = `You are a professional Korean Naver blog writer optimizing for Naver homepage exposure and AI briefing citation (AEO).

Today is ${todayStr}. You cannot search the web, and your knowledge of recent events may be outdated or wrong.

FACTUAL DISCIPLINE — this overrides every stylistic instruction in the user message:
- Never assert a specific fact you are not confident is true. Do not invent prices, fees, subsidy amounts, statistics, percentages, sales figures, ratings, release dates, effective dates, model names, specs, laws, policies, terms, official statements, quotes, studies, or institutions.
- When you are unsure of a specific figure, DO NOT vague the whole sentence away. Keep the sentence concrete and specific, and leave only the unknown value as a [확인필요: ...] placeholder for the author to fill in (max 3 per post). Falling back to qualitative phrasing is a last resort, reserved for details too peripheral to be worth a placeholder.
- Do NOT claim anything is "current as of ${yearMonth}" unless you genuinely know it. Prefer hedged or timeless phrasing over confident but unverified recency.
- Opinions, judgments, preferences and narrative experience are encouraged — but write them as opinions, not as verified facts. Make experience concrete through process and reasoning, not through fabricated measurements.
- A shorter, less specific post that is true is better than a specific post that is false. If reference material is provided, restrict factual claims to what it supports (without copying its wording).

BRAND ACCURACY:
- When a specific brand, product line or service is named, everything you write about it must be accurate. Use official naming exactly as it is written; never invent model names, generation numbers, product tiers or spec details.
- If you are not certain which model, generation or specification applies, stay at category level instead of guessing.
- Never attribute one brand's feature, price, policy or benefit to another, never confuse the roles of manufacturer, carrier and retailer, and never make an unverified superiority claim or a disparaging comparison about a real brand.

TOPIC DISCIPLINE — second only to factual discipline:
- The 주제 given in the user message defines the entire scope of the post. Every subheading must be a subdivision of it.
- Go deeper, never wider. If the topic feels too narrow to fill the length, add steps, edge cases, failure modes and situational detail within the topic — do not import an adjacent axis (product comparison, pricing, device compatibility, vendor recommendations) to pad it out.
- Reference material is for verifying facts only. Never mirror its outline or section structure.

LIVED EXPERIENCE — do not let the AEO rules flatten this:
- Weave first-person experience into the explanation rather than appending it as a closing anecdote to each section.
- Vary the sentence shape every time. Repeating one narrative template across sections reads more machine-made than no anecdote at all.
- Show a scene: when, where, what was attempted, what happened. Evaluative summaries ("it was inconvenient") are not experience.
- Twice or more, explain the reasoning behind a choice and what alternative was weighed. Anyone can look up the facts; only someone who did it can explain the judgment.
- The self-contained-paragraph rule below applies to explanatory paragraphs, not narrative ones. Narrative may flow.

CITATION READINESS (AEO) — apply this within the limits of factual discipline above:
- Lead with the answer. The opening lines and the first sentence under every subheading must state the conclusion before any background.
- Write self-contained paragraphs. Each paragraph must make sense when lifted out of the post on its own; avoid pronouns and back-references that depend on earlier paragraphs.
- Preserve quotable sentence structure. A sentence with a [확인필요:] placeholder is still quotable; a sentence that hedges away its own subject is not.
- Do not write the closing Q&A block or hashtags in this step; they are generated separately afterward.
- Never write engagement bait: no requests for comments, likes, subscriptions, and no sign-off pleasantries. End on the summary.

Output ONLY valid JSON, no markdown.`;

      const raw = await callClaudeStream(
        [{ role: "user", content: prompt }],
        sysPrompt,
        3500, "claude-sonnet-4-5-20250929"
      );
      const parsed = safeParseJson(raw);
      const cleanContent = (str="") =>
        str.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n");

      // 모델이 규칙을 어기고 해시태그나 FAQ를 본문에 넣는 경우가 있어 먼저 잘라낸다
      // (코드에서 따로 붙이므로 그대로 두면 중복된다)
      const stripAppendix = (t="") => t
        .replace(/\n+▶\s*자주\s*묻는\s*질문[\s\S]*$/g, "")
        .replace(/(?:\n+#[^\n]*)+\s*$/g, "")
        .trimEnd();

      let bodyText = stripAppendix(cleanContent(parsed.content||""));

      // ── [확인필요:] 항목을 웹 검색으로 자동 해결 ──
      let factItems = [];
      let factSummary = null;
      const placeholders = extractPlaceholders(bodyText);
      if (placeholders.length > 0) {
        try {
          factItems = await resolveUncertainValues({
            placeholders, title: parsed.title, mainKw, text: bodyText,
          });
          const applied = applyResolvedValues(bodyText, factItems);
          bodyText = applied.text;
          factSummary = {
            resolved: factItems.filter(x => x.found && x.value).length,
            approx: applied.approxUsed.length,
            unresolved: applied.unresolved,
            sources: applied.sources,
          };
        } catch(e) { /* 조사 실패해도 본문은 살린다 — [확인필요:]가 그대로 남는다 */ }
      }

      let finalTitle = parsed.title || "";
      const check = validateTitle(finalTitle, { mainKw, topTitles, commercialWords: banWords, avoidWords });

      // ── 제목이 기준에 안 맞으면 제목만 1회 재생성 ──
      let titleNotice = "";
      if (!check.ok) {
        try {
          const retitlePrompt = `아래 블로그 글에 붙일 제목을 다시 지어줘. 이전 제목이 기준에 맞지 않았다.

이전 제목: ${finalTitle}
탈락 사유: ${check.reasons.join(" / ")}

메인 키워드: "${mainKw}"
제목 패턴: ${pattern.label} — ${pattern.guide}

지켜야 할 조건:
- 공백 포함 15~32자
- "${mainKw}"를 그대로 포함
- 아래 제목들과 2글자 이상 단어가 3개 넘게 겹치면 안 됨
${(topTitles||[]).slice(0,10).map((t,i)=>`  ${i+1}. ${t}`).join("\n") || "  (없음)"}
- 아래 단어는 제목에 쓰지 말 것: ${[...banWords, ...avoidWords].join(", ") || "(없음)"}
- 가격·기간·퍼센트 같은 수치는 제목에 쓰지 말 것

글 앞부분:
${cleanContent(parsed.content||"").slice(0, 700)}

순수 JSON만: {"title":"새 제목"}`;

          const retitleRaw = await callClaude(
            [{ role: "user", content: retitlePrompt }],
            "You write Korean blog titles. Output ONLY valid JSON.",
            300, "claude-haiku-4-5-20251001"
          );
          const retitled = safeParseJson(retitleRaw)?.title || "";
          const recheck = validateTitle(retitled, { mainKw, topTitles, commercialWords: banWords, avoidWords });
          if (retitled && (recheck.ok || recheck.reasons.length < check.reasons.length)) {
            finalTitle = retitled;
            if (!recheck.ok) titleNotice = recheck.reasons.join(" · ");
          } else {
            titleNotice = check.reasons.join(" · ");
          }
        } catch(e) {
          titleNotice = check.reasons.join(" · ");
        }
      }

      recordTitleUse(pattern.id, finalTitle);

      // ── 2단계: 자주 묻는 질문 3개 (AEO 인용률이 가장 높은 블록) ──
      // 본문 생성과 한 번에 처리하면 함수 실행 시간이 한계를 넘어 통째로 날아간다.
      let faq = [];
      try {
        const faqPrompt = `아래 블로그 글을 읽고, 독자가 네이버 검색창에 실제로 칠 법한 질문 3개와 답변을 만들어줘.

제목: ${finalTitle}
메인 키워드: ${mainKw}

본문:
${bodyText.slice(0, 2500)}

규칙:
- 질문은 완성된 문장으로 (예: "유심을 먼저 사도 개통되나요?")
- 답변은 2~3문장. 첫 문장에서 바로 결론을 말할 것
- 답변만 따로 떼어 읽어도 뜻이 통해야 함 ("위에서 말한", "이것" 같은 표현 금지)
- 본문에 없는 가격·날짜·수치를 새로 지어내지 말 것. 본문에 [확인필요:]가 있으면 그대로 유지
- 3개는 서로 다른 것을 물을 것

순수 JSON만: {"faq":[{"q":"질문","a":"답변"},{"q":"질문","a":"답변"},{"q":"질문","a":"답변"}]}`;

        const faqRaw = await callClaude(
          [{ role: "user", content: faqPrompt }],
          "You write Korean blog FAQ blocks. Output ONLY valid JSON.",
          1200, "claude-haiku-4-5-20251001"
        );
        faq = (safeParseJson(faqRaw)?.faq || []).filter(x => x && x.q && x.a).slice(0, 3);
      } catch(e) { /* FAQ 실패해도 본문은 살린다 */ }

      // ── 본문 + FAQ + 해시태그 조립 ──
      const tags = parsed.tags || [];
      const faqBlock = faq.length > 0
        ? "\n\n▶ 자주 묻는 질문\n\n" + faq.map(f => `Q. ${f.q}\nA. ${f.a}`).join("\n\n")
        : "";
      const tagBlock = tags.length > 0
        ? "\n\n" + tags.map(t => "#" + String(t).replace(/^#/, "")).join(" ")
        : "";
      const fullContent = (bodyText + faqBlock + tagBlock).replace(/\n{3,}/g, "\n\n");

      const meta = {
        title: finalTitle,
        main_keyword: mainKw || parsed.main_keyword || kw,
        content: fullContent,
        tags,
        faq,
        titlePattern: pattern.label,
        titleNotice,
        factSummary,
        factItems,
        _source: "keyword",
      };
      setAnalyzePostMeta(meta);
      setAnalyzeText(meta.content);
      setPendingAnalyzeText("");
    }catch(err){
      setPendingAnalyzeText("");
      setAnalyzeAiResult({error:true, message:err.message||"글 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."});
      setActive("analyze");
    }
  };
  const tab = ALL_TABS.find(t=>t.id===active) || IMAGE_SUBTABS.find(t=>t.id===active);
  const isWriteSub = WRITE_SUBTABS.some(t=>t.id===active);
  const isImageSub = IMAGE_SUBTABS.some(t=>t.id===active);
  const isVideoSub = VIDEO_SUBTABS.some(t=>t.id===active);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(()=>{
    const handler=(e)=>{
      if(imgMenuRef.current && !imgMenuRef.current.contains(e.target)) setImgMenuOpen(false);
      if(writeMenuRef.current && !writeMenuRef.current.contains(e.target)) setWriteMenuOpen(false);
      if(videoMenuRef.current && !videoMenuRef.current.contains(e.target)) setVideoMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return ()=>{
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  },[]);

  // 이미지 서브탭 선택
  const selectImageSub=(id)=>{ setActive(id); setImgMenuOpen(false); };

  // 동영상 서브탭 선택
  const selectVideoSub=(id)=>{ setActive(id); setVideoMenuOpen(false); };

  // 글쓰기 드롭다운 위치 계산
  const openWriteMenu=()=>{
    if(writeBtnRef.current){
      const rect=writeBtnRef.current.getBoundingClientRect();
      setWriteDropdownTop(rect.bottom);
      setWriteDropdownLeft(rect.left);
    }
    setWriteMenuOpen(true);
  };
  const selectWriteSub=(id)=>{setActive(id);setWriteMenuOpen(false);};

  // 이미지 드롭다운 위치 계산
  const openImgMenu=()=>{
    if(imgBtnRef.current){
      const rect=imgBtnRef.current.getBoundingClientRect();
      setDropdownTop(rect.bottom);
      setDropdownLeft(rect.left);
    }
    setImgMenuOpen(true);
  };

  // 동영상 드롭다운 위치 계산
  const openVideoMenu=()=>{
    if(videoBtnRef.current){
      const rect=videoBtnRef.current.getBoundingClientRect();
      setVideoDropdownTop(rect.bottom);
      setVideoDropdownLeft(rect.left);
    }
    setVideoMenuOpen(true);
  };

  // 공통 props (모든 탭에 전달 — 필요한 탭만 사용)
  const sharedProps={
    goAutoWrite,
    setActive, kwResult, setKwResult,
    pendingKeywordSearch, setPendingKeywordSearch,
    pendingAnalyzeText, setPendingAnalyzeText,
    pendingAnalyzePost, setPendingAnalyzePost,
    analyzeText, setAnalyzeText,
    analyzeAiResult, setAnalyzeAiResult,
    analyzeLastText, setAnalyzeLastText,
    analyzeThreshold, setAnalyzeThreshold,
    analyzeReplacements, setAnalyzeReplacements,
    analyzeWorkingText, setAnalyzeWorkingText,
    analyzeActiveSection, setAnalyzeActiveSection,
    analyzePostMeta, setAnalyzePostMeta,
  };

  return <PasswordGate><div style={{minHeight:"100vh",background:"#010409",fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",color:"#e6edf3",maxWidth:"1000px",marginLeft:"auto",marginRight:"auto",overflowX:"hidden"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap');
      html,body,#__next,#root{margin:0!important;padding:0!important;box-sizing:border-box;background:#010409}
      *{box-sizing:border-box}
      ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#0d1117} ::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}
      textarea::placeholder,input::placeholder{color:#484f58!important}
      input[type=range]{height:6px}
    `}</style>

    {/* 헤더 */}
    <div style={{borderBottom:"1px solid #21262d",background:"#0d1117"}}>
      <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{width:"34px",height:"34px",background:"linear-gradient(135deg,#1f6feb,#58a6ff)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px"}}>✍️</div>
        <div style={{fontSize:"16px",fontWeight:700,color:"#fff"}}>마케팅 올인원 도구</div>
      </div>
    </div>

    {/* 탭 네비게이션 — overflow:visible 필수 (드롭다운이 잘리지 않도록) */}
    <div style={{borderBottom:"1px solid #21262d",background:"#0d1117",position:"relative",zIndex:300}}>
      <div style={{display:"flex",overflowX:"auto",gap:"2px",
        /* 스크롤은 하되 드롭다운은 잘리지 않아야 함 — 스크롤 컨테이너 overflow:visible 불가하므로
           드롭다운은 position:fixed 로 뷰포트 기준 렌더 */ }}>
        {TABS.map(t=>{
          if(!t.isGroup){
            const isAct=active===t.id;
            return <button key={t.id} onClick={()=>{setActive(t.id);setImgMenuOpen(false);setWriteMenuOpen(false);}} style={{
              padding:"11px 16px",border:"none",background:"none",
              borderBottom:`2px solid ${isAct?"#1f6feb":"transparent"}`,
              color:isAct?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:600,flexShrink:0,
            }}>{t.icon} {t.label}</button>
          }
          // ── 글쓰기 드롭다운 ──
          if(t.id==="write"){
            const isAct=isWriteSub;
            return (
              <div key={t.id} ref={writeMenuRef}
                onMouseEnter={openWriteMenu} onMouseLeave={()=>setWriteMenuOpen(false)}
                style={{position:"relative",display:"inline-flex",alignItems:"stretch",flexShrink:0}}>
                <button ref={writeBtnRef}
                  onClick={()=>writeMenuOpen?setWriteMenuOpen(false):openWriteMenu()}
                  onTouchStart={e=>{e.preventDefault();setWriteMenuOpen(false);if(!isWriteSub)setActive("keyword");}}
                  style={{padding:"11px 16px",border:"none",background:"none",
                    borderBottom:`2px solid ${isAct?"#1f6feb":"transparent"}`,
                    color:isAct?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
                    fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:600,
                    display:"flex",alignItems:"center",gap:"5px"}}>
                  {t.icon} {t.label}
                  <span style={{fontSize:"9px",opacity:.7,display:"inline-block",
                    transform:writeMenuOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}>▼</span>
                </button>
                {writeMenuOpen&&!isMobile&&(
                  <div style={{position:"fixed",top:`${writeDropdownTop}px`,left:`${writeDropdownLeft}px`,
                    background:"#161b22",border:"1px solid #444c56",borderRadius:"0 0 12px 12px",
                    minWidth:"180px",boxShadow:"0 16px 48px rgba(0,0,0,.9)",zIndex:99999,overflow:"hidden"}}>
                    <div style={{padding:"8px 16px 7px",borderBottom:"1px solid #30363d",
                      color:"#58a6ff",fontSize:"11px",fontWeight:700,background:"#0d1117"}}>
                      ✍️ 글쓰기 도구
                    </div>
                    {WRITE_SUBTABS.filter(sub=>!sub.hidden).map(sub=>{
                      const isSel=active===sub.id;
                      return <button key={sub.id}
                        onClick={()=>selectWriteSub(sub.id)}
                        onTouchStart={e=>{e.preventDefault();selectWriteSub(sub.id);}}
                        style={{width:"100%",padding:"11px 18px",border:"none",
                          background:isSel?"#1f6feb22":"transparent",
                          color:isSel?"#58a6ff":"#c9d1d9",cursor:"pointer",textAlign:"left",
                          fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:isSel?700:400,
                          display:"flex",alignItems:"center",gap:"10px",
                          borderLeft:`3px solid ${isSel?"#1f6feb":"transparent"}`,transition:"background .1s"}}
                        onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background="#21262d";}}
                        onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
                        <span style={{fontSize:"17px"}}>{sub.icon}</span>
                        <span>{sub.label}</span>
                        {isSel&&<span style={{marginLeft:"auto",color:"#1f6feb"}}>✓</span>}
                      </button>
                    })}
                  </div>
                )}
              </div>
            );
          }
          // ── 이미지 편집 드롭다운 ──
          const isAct=isImageSub;
          return (
            <div key={t.id}
              ref={imgMenuRef}
              onMouseEnter={openImgMenu}
              onMouseLeave={()=>setImgMenuOpen(false)}
              style={{position:"relative",display:"inline-flex",alignItems:"stretch",flexShrink:0}}>
              <button
                ref={imgBtnRef}
                onClick={()=>imgMenuOpen?setImgMenuOpen(false):openImgMenu()}
                onTouchStart={e=>{e.preventDefault();setImgMenuOpen(false);if(!isImageSub)setActive("ocr");}}
                style={{
                  padding:"11px 16px",border:"none",background:"none",
                  borderBottom:`2px solid ${isAct?"#1f6feb":"transparent"}`,
                  color:isAct?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
                  fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:600,
                  display:"flex",alignItems:"center",gap:"5px",
                }}>
                {t.icon} {t.label}
                <span style={{fontSize:"9px",opacity:.7,display:"inline-block",
                  transform:imgMenuOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}>▼</span>
              </button>
              {imgMenuOpen&&!isMobile&&(
                <div style={{
                  position:"fixed",
                  top:`${dropdownTop}px`,
                  left:`${dropdownLeft}px`,
                  background:"#161b22",
                  border:"1px solid #444c56",
                  borderRadius:"0 0 12px 12px",
                  minWidth:"190px",
                  boxShadow:"0 16px 48px rgba(0,0,0,.9)",
                  zIndex:99999,
                  overflow:"hidden",
                }}>
                  <div style={{padding:"8px 16px 7px",borderBottom:"1px solid #30363d",
                    color:"#58a6ff",fontSize:"11px",fontWeight:700,background:"#0d1117"}}>
                    🖼️ 이미지 편집 도구
                  </div>
                  {IMAGE_SUBTABS.map(sub=>{
                    const isSel=active===sub.id;
                    return <button key={sub.id}
                      onClick={()=>selectImageSub(sub.id)}
                      onTouchStart={e=>{e.preventDefault();selectImageSub(sub.id);}}
                      style={{
                        width:"100%",padding:"11px 18px",border:"none",
                        background:isSel?"#1f6feb22":"transparent",
                        color:isSel?"#58a6ff":"#c9d1d9",
                        cursor:"pointer",textAlign:"left",
                        fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",
                        fontWeight:isSel?700:400,
                        display:"flex",alignItems:"center",gap:"10px",
                        borderLeft:`3px solid ${isSel?"#1f6feb":"transparent"}`,
                        transition:"background .1s",
                      }}
                      onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background="#21262d";}}
                      onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
                      <span style={{fontSize:"17px"}}>{sub.icon}</span>
                      <span>{sub.label}</span>
                      {isSel&&<span style={{marginLeft:"auto",color:"#1f6feb"}}>✓</span>}
                    </button>
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── 동영상 편집 드롭다운 ── */}
        <div
          ref={videoMenuRef}
          onMouseEnter={openVideoMenu}
          onMouseLeave={()=>setVideoMenuOpen(false)}
          style={{position:"relative",display:"inline-flex",alignItems:"stretch",flexShrink:0}}>
          <button
            ref={videoBtnRef}
            onClick={()=>videoMenuOpen?setVideoMenuOpen(false):openVideoMenu()}
            onTouchStart={e=>{e.preventDefault();setVideoMenuOpen(false);if(!isVideoSub)setActive("video");}}
            style={{
              padding:"11px 16px",border:"none",background:"none",
              borderBottom:`2px solid ${isVideoSub?"#1f6feb":"transparent"}`,
              color:isVideoSub?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:600,
              display:"flex",alignItems:"center",gap:"5px",
            }}>
            🎬 동영상 편집
            <span style={{fontSize:"9px",opacity:.7,display:"inline-block",
              transform:videoMenuOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .2s"}}>▼</span>
          </button>
          {videoMenuOpen&&!isMobile&&(
            <div style={{
              position:"fixed",top:`${videoDropdownTop}px`,left:`${videoDropdownLeft}px`,
              background:"#161b22",border:"1px solid #444c56",borderRadius:"0 0 12px 12px",
              minWidth:"190px",boxShadow:"0 16px 48px rgba(0,0,0,.9)",zIndex:99999,overflow:"hidden",
            }}>
              <div style={{padding:"8px 16px 7px",borderBottom:"1px solid #30363d",
                color:"#58a6ff",fontSize:"11px",fontWeight:700,background:"#0d1117"}}>
                🎬 동영상 편집 도구
              </div>
              {VIDEO_SUBTABS.map(sub=>{
                const isSel=active===sub.id;
                return <button key={sub.id}
                  onClick={()=>selectVideoSub(sub.id)}
                  onTouchStart={e=>{e.preventDefault();selectVideoSub(sub.id);}}
                  style={{
                    width:"100%",padding:"11px 18px",border:"none",
                    background:isSel?"#1f6feb22":"transparent",
                    color:isSel?"#58a6ff":"#c9d1d9",cursor:"pointer",textAlign:"left",
                    fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:isSel?700:400,
                    display:"flex",alignItems:"center",gap:"10px",
                    borderLeft:`3px solid ${isSel?"#1f6feb":"transparent"}`,transition:"background .1s",
                  }}
                  onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background="#21262d";}}
                  onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
                  <span style={{fontSize:"17px"}}>{sub.icon}</span>
                  <span>{sub.label}</span>
                  {isSel&&<span style={{marginLeft:"auto",color:"#1f6feb"}}>✓</span>}
                </button>
              })}
            </div>
          )}
        </div>

      </div>
    </div>

    {/* 동영상 서브탭 활성 시 상단 서브 네비바 */}
    {isVideoSub&&(
      <div style={{background:"#0d1117",borderBottom:"1px solid #21262d",padding:"0",display:"flex",gap:"2px",overflowX:"auto"}}>
        {VIDEO_SUBTABS.map(sub=>(
          <button key={sub.id} onClick={()=>setActive(sub.id)} style={{
            padding:"8px 13px",border:"none",background:"none",
            borderBottom:`2px solid ${active===sub.id?"#58a6ff":"transparent"}`,
            color:active===sub.id?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,
          }}>{sub.icon} {sub.label}</button>
        ))}
      </div>
    )}

    {/* 글쓰기 서브탭 활성 시 상단 서브 네비바 */}
    {isWriteSub && (
      <div style={{background:"#0d1117",borderBottom:"1px solid #21262d"}}>
        <div style={{display:"flex",gap:"2px",overflowX:"auto"}}>
        {WRITE_SUBTABS.filter(sub=>!sub.hidden).map(sub=>(
          <button key={sub.id} onClick={()=>setActive(sub.id)} style={{
            padding:"8px 13px",border:"none",background:"none",
            borderBottom:`2px solid ${active===sub.id?"#58a6ff":"transparent"}`,
            color:active===sub.id?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,
          }}>{sub.icon} {sub.label}</button>
        ))}
        </div>
      </div>
    )}

    {/* 이미지 서브탭 활성 시 상단 서브 네비바 */}
    {isImageSub && (
      <div style={{background:"#0d1117",borderBottom:"1px solid #21262d",padding:"0",display:"flex",gap:"2px",overflowX:"auto"}}>
        {IMAGE_SUBTABS.map(sub=>(
          <button key={sub.id} onClick={()=>setActive(sub.id)} style={{
            padding:"8px 13px",border:"none",background:"none",
            borderBottom:`2px solid ${active===sub.id?"#58a6ff":"transparent"}`,
            color:active===sub.id?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,
          }}>{sub.icon} {sub.label}</button>
        ))}
      </div>
    )}

    {/* 탭 콘텐츠 — ALL_TABS 전체 마운트, display:none으로 상태 보존 */}
    <div style={{padding:"12px 8px"}}>
      {ALL_TABS.map(t=>{
        const TabComp=TOOL_MAP[t.id];
        if(!TabComp) return null;
        const isActive=active===t.id;
        const meta=WRITE_SUBTABS.find(s=>s.id===t.id)||IMAGE_SUBTABS.find(s=>s.id===t.id)||t;
        return <div key={t.id} style={{display:isActive?"block":"none"}}>
          <h2 style={{margin:"0 0 16px",fontSize:"15px",fontWeight:700,color:"#e6edf3",display:isActive?"block":"none"}}>{meta.icon} {meta.label}</h2>
          <TabComp {...sharedProps}/>
        </div>
      })}
    </div>
  </div></PasswordGate>
}
