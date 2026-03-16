import React, { useState, useRef, useCallback, useEffect } from "react";

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
async function callClaude(messages,system,maxTokens=2000,model="claude-haiku-4-5-20251001"){
  // 키워드분석/짧은작업: haiku (저렴), 글작성: sonnet (고품질)
  const body={model,max_tokens:maxTokens,messages};
  if(system) body.system=system;

  const res=await fetch("/api/claude",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });

  const data=await res.json();

  if(!res.ok){
    const msg=data?.message||data?.error||`HTTP ${res.status}`;
    throw new Error(msg);
  }
  if(data.error){
    throw new Error(data.message||data.error);
  }

  return data.content?.[0]?.text||"";
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
];

// 글쓰기 서브탭
const WRITE_SUBTABS=[
  {id:"keyword",   icon:"🔍", label:"키워드 글쓰기"},
  {id:"autowrite", icon:"🤖", label:"카테고리 글쓰기"},
  {id:"analyze",   icon:"📊", label:"글분석"},
  {id:"rewrite",   icon:"🔗", label:"기사 리라이팅"},
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
      const arr=JSON.parse(raw.slice(s,e+1));
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


// ─── 단락별 이미지 생성 컴포넌트 (Imagen 3) ──────────────────────────────────
function ImageGenSection({postMeta,postContent,genImages,setGenImages,imgLoading,setImgLoading,imgError,setImgError,imgSections,setImgSections}){

  const startGenerate=async()=>{
    setImgLoading(true);
    setGenImages([]);
    setImgSections([]);
    setImgError("");

    try{
      // ── Step 1: Claude가 본문을 4개 단락으로 분석 후 각각 다른 영문 이미지 프롬프트 생성 ──
      const analysisReq=`You are a blog image consultant. Analyze the following Korean blog post and identify 4 distinct sections that would benefit from an accompanying image. For each section, create a vivid, photorealistic English prompt for Imagen 3.

Blog Title: ${postMeta.title||""}
Main Keyword: ${postMeta.main_keyword||""}
Tags: ${(postMeta.tags||[]).join(", ")}

Blog Content:
${postContent.slice(0,3000)}

Rules:
- Each section must cover a DIFFERENT aspect/topic of the post
- Prompts must be visually distinct from each other
- No text in images, no people, no faces
- Photorealistic, high quality, bright and clean
- Each prompt under 180 characters
- Korean section title for display

Return ONLY valid JSON, no markdown:
{"sections":[
  {"sectionTitle":"단락 제목 (Korean)","sectionDesc":"어떤 내용인지 한 줄 (Korean)","prompt":"English image generation prompt for Imagen 3"},
  {"sectionTitle":"...","sectionDesc":"...","prompt":"..."},
  {"sectionTitle":"...","sectionDesc":"...","prompt":"..."},
  {"sectionTitle":"...","sectionDesc":"...","prompt":"..."}
]}`;

      const raw=await callClaude([{role:"user",content:analysisReq}],
        "You are an expert at analyzing blog posts and writing Imagen 3 prompts. Output ONLY valid JSON.",1200,"claude-haiku-4-5-20251001");

      if(!raw||raw.trim()==="") throw new Error("섹션 분석 응답이 비어있습니다.");
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      if(s===-1||e===-1) throw new Error("섹션 분석 JSON 형식 오류: "+raw.slice(0,100));
      const parsed=JSON.parse(raw.slice(s,e+1));
      const sections=(parsed.sections||[]).slice(0,4);
      if(sections.length===0) throw new Error("섹션 분석 실패");

      setImgSections(sections);

      // 초기 상태: 4개 슬롯 loading
      const initial=sections.map(sec=>({...sec,status:"loading",base64:null,mimeType:null,error:null}));
      setGenImages(initial);

      // ── Step 2: 4개 이미지 순차 생성 ──
      for(let i=0;i<sections.length;i++){
        const sec=sections[i];
        try{
          const r=await fetch("/api/imagen",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({prompt:sec.prompt}),
          });
          const rawText=await r.text();
          if(!rawText||rawText.trim()==="") throw new Error("이미지 API 응답이 비어있습니다.");
          let data;
          try{ data=JSON.parse(rawText); }
          catch(pe){ throw new Error("이미지 API JSON 오류: "+rawText.slice(0,100)); }
          if(data.error) throw new Error(data.error);

          setGenImages(prev=>prev.map((item,idx)=>
            idx===i ? {...item, status:"done", base64:data.base64, mimeType:data.mimeType} : item
          ));
        }catch(e2){
          setGenImages(prev=>prev.map((item,idx)=>
            idx===i ? {...item, status:"error", error:e2.message} : item
          ));
        }
      }

    }catch(e){
      setImgError(e.message);
    }
    setImgLoading(false);
  };

  const doneCount=genImages.filter(g=>g.status==="done").length;
  const isGenerating=imgLoading||genImages.some(g=>g.status==="loading");

  return <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",overflow:"hidden"}}>
    <style>{"@keyframes imgSpin{to{transform:rotate(360deg)}} @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}"}</style>

    {/* 헤더 */}
    <div style={{padding:"14px 18px",background:"linear-gradient(135deg,#0d1117,#161b22)",borderBottom:"1px solid #30363d",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px"}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"18px"}}>🎨</span>
          <span style={{color:"#e6edf3",fontSize:"14px",fontWeight:700}}>단락별 블로그 이미지 생성</span>
          <span style={{fontSize:"10px",background:"linear-gradient(135deg,#1f6feb22,#388bfd22)",color:"#58a6ff",border:"1px solid #1f6feb55",borderRadius:"10px",padding:"2px 8px",fontWeight:700}}>Imagen 3</span>
        </div>
        <div style={{color:"#484f58",fontSize:"11px",marginTop:"3px"}}>
          본문 내용을 4개 단락으로 분석하여 각 단락에 어울리는 이미지를 생성합니다
        </div>
      </div>
      <button onClick={startGenerate} disabled={isGenerating}
        style={{
          padding:"9px 20px",
          background:isGenerating?"#21262d":"linear-gradient(135deg,#1f6feb,#388bfd)",
          color:isGenerating?"#484f58":"#fff",
          border:"none",borderRadius:"8px",cursor:isGenerating?"not-allowed":"pointer",
          fontSize:"12px",fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif",
          whiteSpace:"nowrap",boxShadow:isGenerating?"none":"0 3px 12px #1f6feb55",
          transition:"all .2s",display:"flex",alignItems:"center",gap:"6px",
        }}>
        {isGenerating
          ? <><span style={{display:"inline-block",width:"12px",height:"12px",border:"2px solid #484f58",borderTopColor:"#8b949e",borderRadius:"50%",animation:"imgSpin .8s linear infinite"}}/>
              {doneCount>0?`이미지 생성 중 (${doneCount}/4)`:"분석 중..."}</>
          : genImages.length>0 ? "🔄 다시 생성" : "✨ 이미지 4장 생성"
        }
      </button>
    </div>

    {/* 에러 */}
    {imgError&&<div style={{margin:"12px 16px",background:"#2d1117",border:"1px solid #da363344",borderRadius:"8px",padding:"10px 14px",color:"#ff7b72",fontSize:"12px"}}>⚠️ {imgError}</div>}

    {/* 초기 안내 (생성 전) */}
    {!isGenerating&&genImages.length===0&&!imgError&&<div style={{padding:"28px 20px",textAlign:"center"}}>
      <div style={{fontSize:"36px",marginBottom:"10px"}}>🖼️</div>
      <div style={{color:"#8b949e",fontSize:"13px",fontWeight:600,marginBottom:"6px"}}>글 내용을 분석해서 4개 단락에 맞는 이미지를 자동 생성합니다</div>
      <div style={{color:"#484f58",fontSize:"11px",lineHeight:"1.7"}}>
        · 각 단락마다 내용이 다른 이미지 1장씩 총 4장<br/>
        · Claude가 단락 분석 → Imagen 3가 이미지 생성<br/>
        · 생성된 이미지를 클릭하면 다운로드
      </div>
    </div>}

    {/* 4개 이미지 그리드 */}
    {genImages.length>0&&<div style={{padding:"14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
      {genImages.map((item,i)=>(
        <div key={i} style={{borderRadius:"10px",overflow:"hidden",border:`1px solid ${item.status==="error"?"#da363344":"#30363d"}`,background:"#0d1117"}}>
          {/* 이미지 영역 */}
          {item.status==="loading"&&<div style={{aspectRatio:"4/3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"10px",background:"linear-gradient(135deg,#0d1117,#161b22)"}}>
            <div style={{width:"28px",height:"28px",border:"3px solid #1f6feb44",borderTopColor:"#1f6feb",borderRadius:"50%",animation:"imgSpin .8s linear infinite"}}/>
            <span style={{color:"#484f58",fontSize:"11px",animation:"shimmer 1.5s ease infinite"}}>생성 중...</span>
          </div>}

          {item.status==="done"&&item.base64&&<div style={{position:"relative",cursor:"pointer",overflow:"hidden"}}
            onClick={()=>{const a=document.createElement("a");a.href=`data:${item.mimeType};base64,${item.base64}`;a.download=`section-${i+1}.png`;a.click();}}>
            <img src={`data:${item.mimeType};base64,${item.base64}`} alt={item.sectionTitle}
              style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",display:"block",transition:"transform .3s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.04)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}/>
            <div style={{position:"absolute",top:"8px",right:"8px",background:"#000a",borderRadius:"5px",padding:"3px 7px",fontSize:"10px",color:"#fff",fontWeight:700}}>⬇️ 저장</div>
          </div>}

          {item.status==="error"&&<div style={{aspectRatio:"4/3",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"6px",padding:"12px"}}>
            <span style={{fontSize:"24px"}}>❌</span>
            <span style={{color:"#ff7b72",fontSize:"11px",textAlign:"center"}}>{item.error||"생성 실패"}</span>
          </div>}

          {/* 단락 정보 */}
          <div style={{padding:"8px 10px",borderTop:"1px solid #21262d"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}>
              <span style={{background:"#1f6feb",color:"#fff",borderRadius:"4px",padding:"1px 6px",fontSize:"10px",fontWeight:700,flexShrink:0}}>{i+1}</span>
              <span style={{color:"#c9d1d9",fontSize:"12px",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.sectionTitle||`단락 ${i+1}`}</span>
            </div>
            {item.sectionDesc&&<div style={{color:"#484f58",fontSize:"11px",lineHeight:"1.5",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{item.sectionDesc}</div>}
          </div>
        </div>
      ))}
    </div>}

    {/* 완료 메시지 */}
    {doneCount===4&&!isGenerating&&<div style={{padding:"8px 16px 12px",textAlign:"center",color:"#484f58",fontSize:"11px",borderTop:"1px solid #21262d"}}>
      ✅ 4장 생성 완료 · 이미지를 클릭하면 다운로드됩니다
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
  const [genImages,setGenImages]=useState([]); // [{sectionTitle, prompt, base64, mimeType, status, error}]
  const [imgLoading,setImgLoading]=useState(false);
  const [imgError,setImgError]=useState("");
  const [imgSections,setImgSections]=useState([]); // Claude가 분석한 4개 섹션
  const aiResult=analyzeAiResult; const setAiResult=setAnalyzeAiResult;
  const lastText=analyzeLastText; const setLastText=setAnalyzeLastText;
  const threshold=analyzeThreshold; const setThreshold=setAnalyzeThreshold;
  const replacements=analyzeReplacements; const setReplacements=setAnalyzeReplacements;
  const workingText=analyzeWorkingText; const setWorkingText=setAnalyzeWorkingText;

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
        "You are a Korean blog SEO and quality analysis expert. Output ONLY valid JSON.", 4000);
      const si=raw.indexOf("{"), ei=raw.lastIndexOf("}");
      const parsed=JSON.parse(si!==-1&&ei!==-1?raw.slice(si,ei+1):raw);
      parsed.morpheme.words=parsed.morpheme.words.sort((a,b)=>b.count-a.count);
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
      const si=raw.indexOf("{"),ei=raw.lastIndexOf("}");
      const parsed=JSON.parse(si!==-1&&ei!==-1?raw.slice(si,ei+1):raw);
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
  const buildFullText=()=>{
    const title=postMeta?.title||"";
    const kw=postMeta?.main_keyword||"";
    const body=workingText||text;
    const tags=(postMeta?.tags||[]).map(t=>"#"+t).join(" ");
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
        <span style={{color:"#e6edf3",fontWeight:600,lineHeight:"1.5"}}>{postMeta.title||"(없음)"}</span>
        <span style={{color:"#484f58"}}>본문내용</span>
        <span style={{color:"#8b949e"}}>{(workingText||text).length.toLocaleString()}자</span>
        {postMeta.tags?.length>0&&<><span style={{color:"#484f58"}}>해시태그</span>
        <span style={{color:"#58a6ff",lineHeight:"1.8"}}>{postMeta.tags.map(t=>"#"+t).join(" ")}</span></>}
      </div>
    </div>}

    {/* ── Imagen 3 단락별 이미지 생성 ── */}
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
  return data.keywordList || [];
}

function KeywordTab({goWrite, goAutoWrite, kwResult, setKwResult, isMobile}){
  const [inputVal,setInputVal]=useState(kwResult?._inputVal||"");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const result = kwResult; // 단일 객체: naver + AI 모두 포함
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
      let naverOk = false;
      try{
        naverMain = await fetchNaverKeywordStats([kw]);
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

      // ④ AI 분석 (트렌드 + 인기글 기반 롱테일)
      // ④ AI 분석 (트렌드 + 인기글 기반 롱테일)
      const titlesAppend = blogTitles.length > 0
        ? ["", "", "실제 네이버 블로그 인기글 제목 (참고용):"].concat(blogTitles.slice(0,15).map((t,i)=>(i+1)+". "+t)).join("\n")
        : "";
      const msgContent = [
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
        '    "이 키워드로 블로그 글을 쓸 때 활용할 수 있는 구체적인 글 주제 10개.",',
        '    "형식: 실제 블로거가 쓸 법한 완성된 제목 형태로.",',
        '    "예: 천안맛집 → \'천안 성정동 점심 혼밥하기 좋은 국밥집 솔직 후기\' 처럼.",',
        '    "키워드를 자연스럽게 포함하되 독자 클릭을 유도하는 제목으로."',
        '  ]',
        '}' + titlesAppend
      ].join("\n");
      const raw = await callClaude([{role:"user",content:msgContent}],"Respond ONLY with valid JSON.");
      const cleaned = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const aiResult = JSON.parse(cleaned);
      const relStats = [];

      // 경쟁 강도 계산 (판다랭크 방식: 포화도 = 월발행량 ÷ 월검색량 × 100%)
      // monthlyBlogPostsReal = 네이버 Search API 실측 월 발행량 (가장 신뢰)
      // AI 추정값은 사용하지 않음 — 실측값만 신뢰
      const monthlyBlogPosts = monthlyBlogPostsReal ?? null;

      // 포화도(%) = 월발행량 / 월검색량 × 100
      const saturation = (monthlyBlogPosts !== null && totalMonthly && totalMonthly > 0)
        ? Math.round((monthlyBlogPosts / totalMonthly) * 100)
        : null;

      // 경쟁 강도 5단계
      const compLevel = saturation === null ? "알 수 없음"
        : saturation < 50   ? "매우쉬움"
        : saturation < 150  ? "쉬움"
        : saturation < 500  ? "보통"
        : saturation < 1500 ? "어려움"
        : "매우어려움";

      const dailyVisitReq = totalMonthly
        ? Math.max(30, Math.round((totalMonthly / 30) * 0.05 / 10) * 10)
        : null;

      const compComment = compLevel === "알 수 없음" ? null
        : compLevel === "매우쉬움" ? "초보 블로거도 쉽게 상위노출 가능한 키워드예요!"
        : compLevel === "쉬움"     ? "발행글이 적어 노출 기회가 많아요. 도전해보세요!"
        : compLevel === "보통"     ? "품질 좋은 글이라면 충분히 노출 가능해요."
        : compLevel === "어려움"   ? "전문성 있는 글과 어느 정도 블로그 지수가 필요해요."
        : "상위권 블로거에게 추천하는 고경쟁 키워드예요.";

      // UI 게이지용 0~100 스코어 (로그 스케일: 포화도 1~3000%를 0~100으로)
      const compScore = saturation === null ? 50
        : Math.min(Math.round((Math.log10(Math.max(saturation, 1)) / Math.log10(3000)) * 100), 100);

      // ratio는 하위 호환성 유지 (포화도를 배수로 표현)
      const ratio = saturation !== null ? saturation / 100 : null;

      // 연관검색어: naverMain에서 메인 키워드 제외한 나머지 (월검색량 내림차순)
      const relKeywords = naverMain
        .filter(i=>i.relKeyword?.toLowerCase()!==kw.toLowerCase())
        .map(i=>({
          keyword: i.relKeyword,
          total: (Number(i.monthlyPcQcCnt)||0)+(Number(i.monthlyMobileQcCnt)||0),
          pc: Number(i.monthlyPcQcCnt)||0,
          mob: Number(i.monthlyMobileQcCnt)||0,
        }))
        .sort((a,b)=>b.total-a.total)
        .slice(0,8);

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
            <div>
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
                  <span style={{color:"#c9d1d9",fontSize:"12px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rk.keyword}</span>
                  <span style={{color:"#58a6ff",fontSize:"12px",fontWeight:600,textAlign:"right"}}>{fmtNum(rk.total)}</span>
                  <span style={{color:"#d2a8ff",fontSize:"12px",textAlign:"right"}}>{fmtNum(rk.mob)}</span>
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

          {/* 수치: 월발행량 + 포화도 (월검색량은 위에 표시됨) */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
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
        </div>

        {/* 추천 글 주제 */}
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"14px",...(!isMobile&&{gridColumn:"1/3"})}}>
          <SectionTitle>✍️ 추천 글 주제 <span style={{color:"#484f58",fontWeight:400,fontSize:"11px"}}>· AI 추출</span></SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
            {result.longtailKeywords?.map((kw,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",background:"#0d1117",
                borderRadius:"8px",padding:"8px 10px",border:"1px solid #21262d"}}>
                <span style={{color:"#484f58",fontSize:"11px",minWidth:"16px",flexShrink:0}}>{i+1}</span>
                <span style={{flex:1,color:"#c9d1d9",fontSize:"12px",lineHeight:"1.4"}}>{kw}</span>
                <button onClick={()=>goAutoWrite&&goAutoWrite(kw,result?.smartBlockType,result?.smartBlockReason,result?.blogStrategy,result?.keyword)}
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

  // ── 방법1: 서버 API 통해 RSS fetch (CORS 우회) ──
  const fetchByBlogId=async()=>{
    const id=blogId.trim();
    if(!id){alert("블로그 아이디를 입력해주세요.");return;}
    setLoadingFeed(true);setFeedError("");setPosts(null);setAnalysis({});setExpanded(null);
    try{
      const res=await fetch(`/api/blog-rss?blogId=${encodeURIComponent(id)}`);
      if(!res.ok){const err=await res.json().catch(()=>({error:`오류 (${res.status})`}));throw new Error(err.error||`오류 (${res.status})`);}
      const xml=await res.text();
      if(!xml.includes("<item")) throw new Error("게시글을 찾을 수 없어요. 블로그 아이디를 다시 확인해주세요.");
      const doc=new DOMParser().parseFromString(xml,"application/xml");
      const items=[...doc.querySelectorAll("item")];
      if(!items.length) throw new Error("최근 게시글이 없습니다.");
      const list=items.slice(0,10).map(it=>{
        const title=it.querySelector("title")?.textContent?.trim()||"(제목 없음)";
        const link=(it.querySelector("link")?.textContent||it.querySelector("guid")?.textContent||"").trim();
        const pub=it.querySelector("pubDate")?.textContent||"";
        const desc=(it.querySelector("description")?.textContent||"").replace(/<[^>]+>/g,"").trim().slice(0,300);
        const postNo=link.match(/\/(\d+)$/)?.[1]||Math.random().toString().slice(2,10);
        let date="";
        try{if(pub){const d=new Date(pub);date=`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;}}catch(e){}
        return{title,link,postNo,date,description:desc,source:"rss"};
      });
      setPosts({all:list,current:list.slice(0,PER_PAGE),total:list.length,page:1,blogId:id});
      setPage(1);
    }catch(e){setFeedError(e.message||"오류가 발생했습니다.");}
    setLoadingFeed(false);
  };

  // ── 방법2: URL+제목+본문 직접 입력 → 즉시 분석 ──
  const analyzeManual=()=>{
    const url=singleUrl.trim();
    const title=singleTitle.trim();
    if(!url){alert("URL을 입력해주세요.");return;}
    if(!title){alert("제목을 입력해주세요.");return;}
    const m=url.match(/blog\.naver\.com\/([^/\s?#]+)\/(\d+)/);
    if(!m){alert("올바른 네이버 블로그 URL을 입력해주세요.\n예: https://blog.naver.com/아이디/포스트번호");return;}
    const postNo=m[2];
    const post={title,link:url,postNo,date:"",description:singleBody.slice(0,300),bodyText:singleBody,source:"manual"};
    setPosts({all:[post],current:[post],total:1,page:1,blogId:m[1]});
    setPage(1);setAnalysis({});setExpanded(null);
    setTimeout(()=>runAnalyze(post,0),80);
  };

  const goPage=(pg)=>{
    if(!posts)return;
    setPosts(p=>({...p,current:p.all.slice((pg-1)*PER_PAGE,pg*PER_PAGE),page:pg}));
    setPage(pg);setExpanded(null);
  };

  // ── 네이버 블로그탭 순위 조회 ──
  const getNaverRank=async(kw,blogId,postNo)=>{
    try{
      const params=new URLSearchParams({keyword:kw});
      if(blogId) params.append("blogId",blogId);
      if(postNo) params.append("postNo",postNo);
      const res=await fetch(`/api/naver-rank?${params.toString()}`);
      if(!res.ok) return null;
      const data=await res.json();
      if(data.error) return null;
      return data.myRank??null;
    }catch(e){return null;}
  };

  // ── 본문 크롤링 ──
  const fetchPostBody=async(post)=>{
    if(post.bodyText) return post.bodyText;
    if(!post.link) return post.description||"";
    try{
      const m=post.link.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
      if(!m) return post.description||"";
      const url=`https://blog.naver.com/PostView.naver?blogId=${m[1]}&logNo=${m[2]}&redirect=Dlog&widgetTypeCall=true`;
      const res=await fetch(`/api/blog-content?url=${encodeURIComponent(url)}`);
      if(!res.ok) return post.description||"";
      const data=await res.json();
      if(data.bodies?.length>0) return data.bodies[0];
    }catch(e){}
    return post.description||"";
  };

  // ── AI 분석 ──
  const runAnalyze=async(post,idx)=>{
    if(analysis[post.postNo])return;
    setAnalyzing(idx);
    try{
      const body=await fetchPostBody(post);

      // ── Step 1: AI로 키워드 + SEO점수만 추출 (missingStatus는 AI 추측 제거) ──
      const prompt=`아래 네이버 블로그 포스트를 분석해줘. 반드시 순수 JSON만 출력. 마크다운 없이.

제목: ${post.title}
본문: ${body.slice(0,2000)||"(없음)"}

{
  "keywords":["이 글 실제 내용 기반 키워드1","키워드2","키워드3"],
  "seoScore":0~100
}

판단 기준:
- keywords: 제목/본문 핵심 검색어 추출 (무관한 키워드 금지)
- seoScore: 제목 품질, 본문 충실도, 키워드 자연스러운 배치 종합`;

      const raw=await callClaude([{role:"user",content:prompt}],"Korean blog SEO expert. Output ONLY valid JSON.",600);
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      const ai=JSON.parse(raw.slice(s,e+1));
      const kws=ai.keywords||[];

      // ── Step 2: 글 제목으로 네이버 검색 → 실제 누락 여부 확인 ──
      const urlMatch=post.link?.match(/blog\.naver\.com\/([^/?#]+)\/(\d+)/);
      const extractedBlogId=urlMatch?.[1]||posts?.blogId||"";
      const extractedPostNo=urlMatch?.[2]||post.postNo||"";

      // 제목 전체를 검색어로 넣어서 내 글이 결과에 있는지 확인
      const titleRank=await getNaverRank(post.title, extractedBlogId, extractedPostNo);

      // 실제 검색 결과 기반 누락 판별 — 내 글이 결과에 있으면 노출, 없으면 누락
      let missingStatus;
      if(titleRank!==null && titleRank!==undefined){
        missingStatus="노출";
      } else {
        missingStatus="누락";
      }

      const kwData=kws.map((kw,i)=>({rank:i+1,keyword:kw,realRank:null,rankLoading:true}));
      setAnalysis(prev=>({...prev,[post.postNo]:{
        ...ai, missingStatus,
        titleRank,
        topKeywords:kwData
      }}));

      const rankResults=await Promise.all(kws.map(kw=>getNaverRank(kw,extractedBlogId,extractedPostNo)));
      setAnalysis(prev=>({...prev,[post.postNo]:{
        ...ai, missingStatus, titleRank,
        topKeywords:kws.map((kw,i)=>({rank:i+1,keyword:kw,realRank:rankResults[i],rankLoading:false}))
      }}));
    }catch(e){
      setAnalysis(prev=>({...prev,[post.postNo]:{error:true}}));
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

  const RC={"낮음":"#3fb950","보통":"#ffa657","높음":"#ff7b72","매우높음":"#f85149"};
  const RB={"낮음":"#0d2019","보통":"#2d1e0a","높음":"#2d1117","매우높음":"#2d0b0b"};
  const SC={"노출":"#3fb950","누락":"#f85149"};
  const rankColor=r=>r===null?"#484f58":r<=3?"#3fb950":r<=10?"#58a6ff":r<=20?"#ffa657":"#ff7b72";
  const totalPages=posts?Math.ceil(posts.all.length/PER_PAGE):0;

  return <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>

    {/* ── 모드 탭 ── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:"#0d1117",borderRadius:"10px",border:"1px solid #21262d",overflow:"hidden"}}>
      {[["blogId","📋 방법1 · 블로그 ID로 최근글"],["url","🔗 방법2 · URL 직접 입력"]].map(([id,lbl])=>(
        <button key={id} onClick={()=>{setMode(id);setPosts(null);setAnalysis({});setExpanded(null);setFeedError("");}} style={{
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
        {["RSS 피드 연결 중...","최근 게시글 10개 파싱 중...","목록 구성 중..."].map((m,i)=>(
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
        💡 최근 게시글 <strong style={{color:"#8b949e"}}>10개</strong>를 자동으로 불러와 누락여부 · 상위노출 키워드를 분석합니다.
      </div>
    </div>}

    {/* ── 방법2: URL + 제목 + 본문 직접 입력 ── */}
    {mode==="url"&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px",display:"flex",flexDirection:"column",gap:"12px"}}>
      <div>
        <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:700,marginBottom:"4px"}}>게시글 정보 입력</div>
        <div style={{color:"#484f58",fontSize:"11px",marginBottom:"12px"}}>최신 10개 외 과거 글도 확인 가능 · 제목+본문을 직접 붙여넣으면 정확한 분석이 됩니다</div>

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

    {/* ── 게시글 목록 ── */}
    {posts&&<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
        <div style={{color:"#c9d1d9",fontSize:"13px",fontWeight:600}}>
          총 <span style={{color:"#58a6ff"}}>{posts.total}개</span>
          {posts.blogId&&<span style={{color:"#8b949e",marginLeft:"6px"}}>· @{posts.blogId}</span>}
          {totalPages>1&&<span style={{color:"#484f58",fontSize:"12px",marginLeft:"6px"}}>{page}/{totalPages}p</span>}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:"6px"}}>
          {posts.current.some(p=>!analysis[p.postNo])&&analyzing===-1&&
            <button onClick={analyzeAll} style={{padding:"6px 14px",background:"#1f6feb",color:"#fff",border:"none",
              borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif"}}>
              ⚡ 전체 분석
            </button>}
          <button onClick={()=>{setPosts(null);setAnalysis({});setExpanded(null);}}
            style={{padding:"6px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
              borderRadius:"6px",cursor:"pointer",fontSize:"12px",fontFamily:"'Noto Sans KR',sans-serif"}}>
            🗑️ 초기화
          </button>
        </div>
      </div>

      {posts.current.map((post,idx)=>{
        const a=analysis[post.postNo];
        const isAn=analyzing===idx;
        const isEx=expanded===post.postNo;
        const risk=a?.missingRisk;
        return <div key={post.postNo} style={{background:"#161b22",border:`1px solid ${risk?RC[risk]+"55":"#30363d"}`,borderRadius:"12px",overflow:"hidden",transition:"border .2s"}}>
          <div style={{padding:"13px 16px",display:"flex",alignItems:"flex-start",gap:"10px"}}>
            <div style={{color:"#484f58",fontSize:"11px",fontWeight:700,minWidth:"20px",paddingTop:"3px",flexShrink:0,textAlign:"right"}}>
              {(page-1)*PER_PAGE+idx+1}
            </div>
            <div style={{flex:1,minWidth:0}}>
              {/* 제목 */}
              <div style={{marginBottom:"5px",display:"flex",gap:"8px",alignItems:"flex-start"}}>
                {post.link
                  ?<a href={post.link} target="_blank" rel="noreferrer"
                      style={{color:"#e6edf3",fontSize:"14px",fontWeight:600,textDecoration:"none",lineHeight:"1.5",flex:1,wordBreak:"break-word"}}
                      onMouseEnter={e=>e.target.style.color="#58a6ff"} onMouseLeave={e=>e.target.style.color="#e6edf3"}>
                      {post.title}
                    </a>
                  :<span style={{color:"#e6edf3",fontSize:"14px",fontWeight:600,flex:1}}>{post.title}</span>}
                {post.date&&<span style={{color:"#484f58",fontSize:"11px",flexShrink:0,paddingTop:"2px"}}>{post.date}</span>}
              </div>
              {/* 설명 */}
              {post.description&&!a&&<div style={{color:"#484f58",fontSize:"12px",marginBottom:"5px",lineHeight:"1.5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.description}</div>}
              {/* 뱃지 */}
              {a&&!a.error&&<div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginBottom:"5px"}}>
                {/* 노출 / 누락 */}
                <span style={{
                  background:a.missingStatus==="노출"?"#2ea04322":"#f8514922",
                  color:a.missingStatus==="노출"?"#3fb950":"#f85149",
                  border:`1px solid ${a.missingStatus==="노출"?"#2ea04344":"#f8514944"}`,
                  borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700
                }}>
                  {a.missingStatus==="노출"?"✅ 노출":"🚨 누락"}
                </span>
                <span style={{background:"#21262d",color:a.seoScore>=70?"#3fb950":a.seoScore>=40?"#ffa657":"#ff7b72",border:"1px solid #30363d",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700}}>SEO {a.seoScore}</span>
                {a.topKeywords?.[0]&&<span style={{background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700}}>
                  🔑 {a.topKeywords[0].keyword} {a.topKeywords[0].rankLoading?"조회중…":a.topKeywords[0].realRank!==null?`${a.topKeywords[0].realRank}위`:"100위↓"}
                </span>}
              </div>}
              {/* 분석 중 */}
              {isAn&&<div style={{display:"flex",flexDirection:"column",gap:"3px",marginTop:"4px"}}>
                {["🤖 AI 키워드 분석 중...","🔍 제목으로 네이버 실제 검색 중...","📊 키워드 블로그탭 순위 조회 중..."].map((msg,i)=>(
                  <div key={i} style={{color:"#8b949e",fontSize:"11px",animation:`pulse 1.6s ease ${i*0.4}s infinite`}}>{msg}</div>
                ))}
              </div>}
              {a?.error&&<div style={{color:"#ff7b72",fontSize:"12px",marginTop:"3px"}}>⚠️ 분석 실패. 재시도 버튼을 눌러주세요.</div>}
            </div>
            {/* 버튼 */}
            <div style={{display:"flex",flexDirection:"column",gap:"5px",flexShrink:0}}>
              {!a&&!isAn&&<button onClick={()=>runAnalyze(post,idx)}
                style={{padding:"6px 12px",background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",
                  borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:600,
                  fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>🔍 분석</button>}
              {a?.error&&<button onClick={()=>{setAnalysis(p=>{const n={...p};delete n[post.postNo];return n;});runAnalyze(post,idx);}}
                style={{padding:"6px 12px",background:"#da363322",color:"#ff7b72",border:"1px solid #da363344",
                  borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:600,
                  fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>🔄 재시도</button>}
              {a&&!a.error&&<button onClick={()=>setExpanded(isEx?null:post.postNo)}
                style={{padding:"6px 12px",background:isEx?"#21262d":"#1f6feb22",color:isEx?"#8b949e":"#58a6ff",
                  border:`1px solid ${isEx?"#30363d":"#1f6feb44"}`,borderRadius:"7px",cursor:"pointer",
                  fontSize:"11px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>
                {isEx?"▲ 닫기":"▼ 상세"}</button>}
            </div>
          </div>

          {/* 상세 패널 */}
          {isEx&&a&&!a.error&&<div style={{borderTop:"1px solid #21262d",padding:"14px 16px",background:"#0d1117",display:"flex",flexDirection:"column",gap:"12px"}}>

            {/* 제목 검색 누락 여부 */}
            <div style={{background:a.missingStatus==="노출"?"#0d2019":"#2d0b0b",border:`1px solid ${a.missingStatus==="노출"?"#2ea04333":"#f8514933"}`,borderRadius:"10px",padding:"12px 14px"}}>
              <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"8px"}}>
                🔍 제목 검색 누락 여부 <span style={{color:"#484f58",fontWeight:400}}>· 제목 그대로 네이버 검색한 실제 결과</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{fontSize:"28px"}}>{a.missingStatus==="노출"?"✅":"🚨"}</div>
                <div>
                  <div style={{color:a.missingStatus==="노출"?"#3fb950":"#f85149",fontSize:"15px",fontWeight:700}}>
                    {a.missingStatus==="노출"?"노출 — 내 글이 검색 결과에 있음":"누락 — 내 글이 검색 결과에 없음"}
                  </div>
                  <div style={{color:"#8b949e",fontSize:"12px",marginTop:"2px"}}>
                    검색어: "{post.title}"
                  </div>
                </div>
                <a href={`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(post.title)}`}
                  target="_blank" rel="noreferrer"
                  style={{marginLeft:"auto",padding:"6px 12px",background:"#21262d",color:"#8b949e",
                    border:"1px solid #30363d",borderRadius:"7px",fontSize:"11px",
                    textDecoration:"none",whiteSpace:"nowrap",flexShrink:0}}
                  onMouseEnter={e=>e.target.style.color="#58a6ff"}
                  onMouseLeave={e=>e.target.style.color="#8b949e"}>
                  네이버에서 직접 확인 ↗
                </a>
              </div>
            </div>

            {/* 상위노출 키워드 + 실제 순위 */}
            {a.topKeywords?.length>0&&<div>
              <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"8px"}}>
                🏆 상위 노출 키워드 <span style={{color:"#484f58",fontWeight:400}}>· 네이버 블로그탭 실제 순위</span>
              </div>
              {a.topKeywords.map((kw,i)=>{
                const rc=rankColor(kw.realRank);
                const isOut=kw.realRank===null&&!kw.rankLoading;
                const isLoading=kw.rankLoading;
                return <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",
                  background:"#161b22",border:`1px solid ${isOut||isLoading?"#21262d":rc+"44"}`,borderRadius:"9px",marginBottom:"6px"}}>
                  <div style={{width:"24px",height:"24px",background:"#21262d",border:"1px solid #30363d",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{color:"#8b949e",fontSize:"11px",fontWeight:700}}>{kw.rank}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <a href={`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(kw.keyword)}`}
                      target="_blank" rel="noreferrer"
                      style={{color:"#e6edf3",fontSize:"13px",fontWeight:700,textDecoration:"none",display:"block"}}
                      onMouseEnter={e=>e.target.style.color="#58a6ff"} onMouseLeave={e=>e.target.style.color="#e6edf3"}>
                      {kw.keyword} ↗
                    </a>
                  </div>
                  <div style={{background:isLoading?"#21262d":isOut?"#21262d":rc+"22",color:isLoading?"#8b949e":isOut?"#484f58":rc,
                    border:`1px solid ${isLoading?"#30363d":isOut?"#30363d":rc+"55"}`,
                    borderRadius:"8px",padding:"5px 12px",fontSize:"15px",fontWeight:800,minWidth:"52px",textAlign:"center",flexShrink:0}}>
                    {isLoading?"⏳":isOut?"100위↓":`${kw.realRank}위`}
                  </div>
                </div>;
              })}
              <div style={{fontSize:"11px",color:"#484f58",marginTop:"2px"}}>🔍 네이버 검색 Open API 기준 (상위 100위) · 실시간 반영</div>
            </div>}

          </div>}
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
function RestoreTab(){
  const [origUrl,setOrigUrl]=useState(null);
  const [resultUrl,setResultUrl]=useState(null);
  const [processing,setProcessing]=useState(false);
  const [progress,setProgress]=useState(0);
  const [errMsg,setErrMsg]=useState("");
  const [dragOver,setDragOver]=useState(false);
  const [sliderX,setSliderX]=useState(50);
  const [dragging,setDragging]=useState(false);
  const [origInfo,setOrigInfo]=useState(null);
  const [resultInfo,setResultInfo]=useState(null);
  const [scale,setScale]=useState("2");
  const fileRef=useRef(null);
  const sliderRef=useRef(null);

  const loadFile=useCallback((file)=>{
    if(!file||!file.type.startsWith("image/")) return;
    const url=URL.createObjectURL(file);
    setOrigUrl(url); setResultUrl(null); setResultInfo(null); setErrMsg(""); setProgress(0);
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
    const img=new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>res(img);
    img.onerror=rej;
    img.src=src;
    if(img.complete&&img.naturalWidth>0) res(img);
  });

  const runProcess=async()=>{
    if(!origUrl) return;
    setProcessing(true); setResultUrl(null); setErrMsg(""); setProgress(5);
    try{
      await new Promise(r=>setTimeout(r,20));
      const img=await loadImg(origUrl);
      const sc=Number(scale);
      const dw=img.naturalWidth*sc, dh=img.naturalHeight*sc;
      setProgress(15);

      const cvs=document.createElement("canvas");
      cvs.width=dw; cvs.height=dh;
      const ctx=cvs.getContext("2d",{willReadFrequently:true});
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality="high";
      ctx.drawImage(img,0,0,dw,dh);
      setProgress(30);

      // 1) 자동 밝기·대비·채도
      {
        const id=ctx.getImageData(0,0,dw,dh);
        const d=id.data;
        let sum=0;
        for(let i=0;i<d.length;i+=4) sum+=(d[i]+d[i+1]+d[i+2])/3;
        const avg=sum/(d.length/4);
        const autoBr=avg<100?20:avg<160?10:avg>200?-10:0;
        const br=(autoBr/100)*255;
        const ctRaw=0.15;
        const ctF=(259*(ctRaw*100+255))/(255*(259-ctRaw*100));
        const sat=1.15;
        for(let i=0;i<d.length;i+=4){
          let r=d[i],g=d[i+1],b=d[i+2];
          r+=br; g+=br; b+=br;
          r=ctF*(r-128)+128; g=ctF*(g-128)+128; b=ctF*(b-128)+128;
          const L=0.299*r+0.587*g+0.114*b;
          r=L+(r-L)*sat; g=L+(g-L)*sat; b=L+(b-L)*sat;
          d[i]=r<0?0:r>255?255:r;
          d[i+1]=g<0?0:g>255?255:g;
          d[i+2]=b<0?0:b>255?255:b;
        }
        ctx.putImageData(id,0,0);
      }
      setProgress(50);

      // 2) 노이즈 제거 2회
      for(let p=0;p<2;p++){
        const id=ctx.getImageData(0,0,dw,dh);
        const s=new Uint8ClampedArray(id.data), d=id.data;
        for(let y=1;y<dh-1;y++){
          for(let x=1;x<dw-1;x++){
            const i=(y*dw+x)*4;
            for(let c=0;c<3;c++){
              d[i+c]=(s[i+c]+s[((y-1)*dw+x)*4+c]+s[((y+1)*dw+x)*4+c]+s[(y*dw+x-1)*4+c]+s[(y*dw+x+1)*4+c]+1)/5|0;
            }
          }
        }
        ctx.putImageData(id,0,0);
      }
      setProgress(70);

      // 3) 선명도 (언샤프 마스킹)
      {
        const sharp=ctx.getImageData(0,0,dw,dh);
        const tmp=document.createElement("canvas");
        tmp.width=dw; tmp.height=dh;
        const tc=tmp.getContext("2d");
        tc.filter="blur(1px)";
        tc.drawImage(cvs,0,0);
        const blurred=tc.getImageData(0,0,dw,dh);
        const sd=sharp.data, bd=blurred.data;
        for(let i=0;i<sd.length;i+=4){
          for(let c=0;c<3;c++){
            const v=sd[i+c]+(sd[i+c]-bd[i+c])*1.4;
            sd[i+c]=v<0?0:v>255?255:v;
          }
        }
        ctx.putImageData(sharp,0,0);
      }
      setProgress(90);

      const blob=await new Promise(res=>cvs.toBlob(res,"image/jpeg",0.95));
      setResultUrl(URL.createObjectURL(blob));
      setResultInfo({w:dw,h:dh,bytes:blob.size});
      setProgress(100);
    }catch(e){
      setErrMsg("처리 오류: "+e.message);
    }
    setProcessing(false);
  };

  const onMove=useCallback(e=>{
    if(!dragging||!sliderRef.current) return;
    const rect=sliderRef.current.getBoundingClientRect();
    const cx=e.touches?e.touches[0].clientX:e.clientX;
    setSliderX(Math.max(2,Math.min(98,((cx-rect.left)/rect.width)*100)));
  },[dragging]);

  useEffect(()=>{
    const up=()=>setDragging(false);
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",up);
    window.addEventListener("touchmove",onMove,{passive:true});
    window.addEventListener("touchend",up);
    return()=>{
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",up);
      window.removeEventListener("touchmove",onMove);
      window.removeEventListener("touchend",up);
    };
  },[onMove]);

  const fmtSz=n=>n>1048576?(n/1048576).toFixed(1)+"MB":(n/1024).toFixed(0)+"KB";
  const fmtPx=(w,h)=>`${w}x${h}px`;

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

    {!origUrl&&<>
      <div onClick={()=>fileRef.current?.click()} onTouchEnd={e=>{e.preventDefault();fileRef.current?.click();}}
        onDrop={e=>{e.preventDefault();setDragOver(false);loadFile(e.dataTransfer.files[0]);}}
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        style={{border:`2px dashed ${dragOver?"#58a6ff":"#30363d"}`,borderRadius:"14px",
          padding:"56px 20px",textAlign:"center",cursor:"pointer",
          background:dragOver?"#1f6feb11":"#0d1117",transition:"all .2s"}}>
        <div style={{fontSize:"56px",marginBottom:"14px"}}>✨</div>
        <div style={{color:"#c9d1d9",fontSize:"17px",fontWeight:700,marginBottom:"8px"}}>
          이미지 드래그 · 클릭 · Ctrl+V
        </div>
        <div style={{color:"#484f58",fontSize:"13px"}}>업로드하면 자동으로 복원·향상됩니다</div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={e=>loadFile(e.target.files[0])}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
        {[["🔍","업스케일 2X/4X"],["🎨","색상·대비 자동 보정"],["🧹","노이즈 자동 제거"],
          ["✨","선명도 자동 향상"],["↔️","Before/After 슬라이더"],["⬇️","고화질 JPEG 다운로드"]].map(([ic,lb])=>(
          <div key={lb} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",
            padding:"14px",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"22px"}}>{ic}</span>
            <span style={{color:"#8b949e",fontSize:"12px",fontWeight:600}}>{lb}</span>
          </div>
        ))}
      </div>
    </>}

    {origUrl&&<>
      {!resultUrl&&!processing&&<div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
        <span style={{color:"#8b949e",fontSize:"13px"}}>업스케일</span>
        {["1","2","4"].map(s=>(
          <button key={s} onClick={()=>setScale(s)}
            style={{padding:"8px 18px",borderRadius:"8px",
              border:`1px solid ${scale===s?"#58a6ff":"#30363d"}`,
              background:scale===s?"#1f6feb":"#21262d",
              color:scale===s?"#fff":"#8b949e",cursor:"pointer",
              fontWeight:700,fontSize:"14px",fontFamily:"'Noto Sans KR',sans-serif"}}>
            {s}X
          </button>
        ))}
        <button onClick={runProcess}
          style={{marginLeft:"auto",padding:"11px 30px",
            background:"linear-gradient(135deg,#1f6feb,#388bfd)",
            border:"none",borderRadius:"10px",color:"#fff",
            cursor:"pointer",fontSize:"14px",fontWeight:700,
            fontFamily:"'Noto Sans KR',sans-serif"}}>
          ✨ 자동 복원·향상 시작
        </button>
        <button onClick={()=>{setOrigUrl(null);setOrigInfo(null);}}
          style={{padding:"11px 14px",background:"none",border:"1px solid #30363d",
            borderRadius:"10px",color:"#484f58",cursor:"pointer",fontSize:"13px"}}>
          🗑️
        </button>
      </div>}

      {processing&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"20px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
          <span style={{color:"#8b949e",fontSize:"13px"}}>
            {progress<20?"📥 이미지 분석 중...":progress<50?"🎨 색상·대비 보정 중...":progress<70?"🧹 노이즈 제거 중...":progress<90?"✨ 선명도 향상 중...":"✅ 마무리 중..."}
          </span>
          <span style={{color:"#58a6ff",fontWeight:700}}>{progress}%</span>
        </div>
        <div style={{height:"6px",background:"#21262d",borderRadius:"3px",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${progress}%`,borderRadius:"3px",transition:"width .3s",
            background:"linear-gradient(90deg,#1f6feb,#58a6ff)"}}/>
        </div>
      </div>}

      {errMsg&&<div style={{background:"#2d1117",border:"1px solid #da363333",borderRadius:"8px",
        padding:"12px",color:"#ff7b72",fontSize:"13px"}}>⚠️ {errMsg}</div>}

      {resultUrl&&<>
        <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
          {origInfo&&<span style={{color:"#484f58",fontSize:"12px"}}>원본 {fmtPx(origInfo.w,origInfo.h)}</span>}
          {resultInfo&&<span style={{color:"#3fb950",fontSize:"12px",fontWeight:700}}>
            → 결과 {fmtPx(resultInfo.w,resultInfo.h)} · {fmtSz(resultInfo.bytes)}
          </span>}
          <a href={resultUrl} download="restored.jpg"
            style={{marginLeft:"auto",padding:"9px 22px",background:"#2ea043",
              borderRadius:"8px",color:"#fff",textDecoration:"none",
              fontSize:"13px",fontWeight:700,fontFamily:"'Noto Sans KR',sans-serif"}}>
            ⬇️ 다운로드
          </a>
          <button onClick={()=>{setResultUrl(null);setResultInfo(null);setProgress(0);}}
            style={{padding:"9px 14px",background:"none",border:"1px solid #30363d",
              borderRadius:"8px",color:"#8b949e",cursor:"pointer",fontSize:"12px",
              fontFamily:"'Noto Sans KR',sans-serif"}}>🔄 다시</button>
          <button onClick={()=>{setOrigUrl(null);setResultUrl(null);setOrigInfo(null);setResultInfo(null);}}
            style={{padding:"9px 14px",background:"none",border:"1px solid #30363d",
              borderRadius:"8px",color:"#484f58",cursor:"pointer",fontSize:"12px",
              fontFamily:"'Noto Sans KR',sans-serif"}}>🗑️ 새 이미지</button>
        </div>

        <div ref={sliderRef}
          onMouseDown={e=>{e.preventDefault();setDragging(true);}}
          onTouchStart={()=>setDragging(true)}
          style={{position:"relative",borderRadius:"14px",overflow:"hidden",
            border:"1px solid #30363d",cursor:"ew-resize",userSelect:"none",
            background:"#000",lineHeight:0,boxShadow:"0 4px 24px rgba(0,0,0,.4)"}}>
          <img src={resultUrl} style={{display:"block",width:"100%",maxHeight:"640px",objectFit:"contain"}}/>
          <div style={{position:"absolute",inset:0,overflow:"hidden",
            width:`${sliderX}%`,pointerEvents:"none"}}>
            <img src={origUrl} style={{display:"block",width:`${10000/sliderX}%`,
              maxHeight:"640px",objectFit:"contain"}}/>
          </div>
          <div style={{position:"absolute",top:0,bottom:0,left:`${sliderX}%`,
            transform:"translateX(-50%)",width:"3px",
            background:"#fff",boxShadow:"0 0 10px rgba(0,0,0,.8)",pointerEvents:"none"}}>
            <div style={{position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",width:"36px",height:"36px",borderRadius:"50%",
              background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,.6)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"16px",fontWeight:900,color:"#0d1117"}}>↔</div>
          </div>
          <div style={{position:"absolute",top:"12px",left:"14px",
            background:"rgba(0,0,0,.75)",color:"#fff",padding:"4px 12px",
            borderRadius:"20px",fontSize:"12px",fontWeight:700,pointerEvents:"none"}}>BEFORE</div>
          <div style={{position:"absolute",top:"12px",right:"14px",
            background:"rgba(31,111,235,.95)",color:"#fff",padding:"4px 12px",
            borderRadius:"20px",fontSize:"12px",fontWeight:700,pointerEvents:"none"}}>AFTER</div>
        </div>
        <div style={{textAlign:"center",color:"#484f58",fontSize:"11px"}}>
          슬라이더를 좌우로 드래그해서 원본과 결과를 비교하세요
        </div>
      </>}

      {!resultUrl&&!processing&&<div style={{borderRadius:"14px",overflow:"hidden",
        border:"1px solid #30363d",background:"#0d1117",lineHeight:0}}>
        <img src={origUrl} style={{display:"block",width:"100%",maxHeight:"640px",objectFit:"contain"}}/>
      </div>}
    </>}
  </div>;
}

// ─── TAB: 자동글쓰기 ─────────────────────────────────────────────────────
const NAVER_AUTO_CATEGORIES=[
  {group:"🍽️ 생활/음식",items:[
    {value:"요리·레시피",label:"요리·레시피"},{value:"맛집·카페",label:"맛집·카페"},
    {value:"다이어트·건강식",label:"다이어트·건강식"},{value:"카페·디저트",label:"카페·디저트"},
  ]},
  {group:"💄 패션/뷰티",items:[
    {value:"패션·코디",label:"패션·코디"},{value:"뷰티·메이크업",label:"뷰티·메이크업"},
    {value:"스킨케어·화장품",label:"스킨케어·화장품"},{value:"헤어·네일",label:"헤어·네일"},
  ]},
  {group:"🏠 인테리어/생활",items:[
    {value:"인테리어·DIY",label:"인테리어·DIY"},{value:"살림·생활꿀팁",label:"살림·생활꿀팁"},
    {value:"청소·정리정돈",label:"청소·정리정돈"},{value:"원예·식물",label:"원예·식물"},
  ]},
  {group:"✈️ 여행",items:[
    {value:"국내여행",label:"국내여행"},{value:"해외여행",label:"해외여행"},
    {value:"캠핑·아웃도어",label:"캠핑·아웃도어"},{value:"호텔·숙소",label:"호텔·숙소"},
  ]},
  {group:"💰 재테크/금융",items:[
    {value:"재테크·투자",label:"재테크·투자"},{value:"부동산",label:"부동산"},
    {value:"주식·ETF",label:"주식·ETF"},{value:"보험·연금",label:"보험·연금"},
  ]},
  {group:"💻 IT/디지털",items:[
    {value:"IT·가전",label:"IT·가전"},{value:"스마트폰·앱",label:"스마트폰·앱"},
    {value:"게임",label:"게임"},{value:"AI·기술트렌드",label:"AI·기술트렌드"},
  ]},
  {group:"🏋️ 건강/운동",items:[
    {value:"운동·피트니스",label:"운동·피트니스"},{value:"건강·의학정보",label:"건강·의학정보"},
    {value:"멘탈케어·심리",label:"멘탈케어·심리"},{value:"한방·영양제",label:"한방·영양제"},
  ]},
  {group:"👶 육아/교육",items:[
    {value:"육아·아이",label:"육아·아이"},{value:"교육·학습",label:"교육·학습"},
    {value:"임신·출산",label:"임신·출산"},{value:"유아교육·장난감",label:"유아교육·장난감"},
  ]},
  {group:"🚗 자동차",items:[
    {value:"자동차",label:"자동차"},{value:"중고차·신차",label:"중고차·신차"},
    {value:"전기차·하이브리드",label:"전기차·하이브리드"},
  ]},
  {group:"🐾 반려동물",items:[
    {value:"반려견",label:"반려견"},{value:"반려묘",label:"반려묘"},
    {value:"반려동물 건강",label:"반려동물 건강"},
  ]},
  {group:"🎬 엔터테인먼트",items:[
    {value:"영화·드라마",label:"영화·드라마"},{value:"음악·공연",label:"음악·공연"},
    {value:"책·독서",label:"책·독서"},{value:"웹툰·만화",label:"웹툰·만화"},
  ]},
];

function AutoWriteTab({setActive,setPendingAnalyzeText,setPendingAnalyzePost,setAnalyzePostMeta,setAnalyzeText,setAnalyzeAiResult,setAnalyzeLastText,setAnalyzeWorkingText,setAnalyzeReplacements}){
  const [selCat,setSelCat]=useState("");
  const [loadingKw,setLoadingKw]=useState(false);
  const [keywords,setKeywords]=useState([]);
  const [writingIdx,setWritingIdx]=useState(null);
  const [postKw,setPostKw]=useState("");
  const [err,setErr]=useState("");

  const year=new Date().getFullYear();

  // ── 추천 글 주제 생성 ──
  const genKeywords=async()=>{
    if(!selCat) return;
    setLoadingKw(true); setKeywords([]); setPostKw(""); setErr("");
    try{
      const prompt=`카테고리: "${selCat}"

이 카테고리에서 ${year}년 현재 네이버 블로그로 쓰기 좋은 글 주제 10개를 추천해줘.

조건:
- 실제 블로거가 쓸 법한 완성된 제목 형태로 작성
- 구체적인 경험, 후기, 정보, 비교 등 독자가 클릭하고 싶은 제목
- ${year}년 최신 트렌드와 시의성 반영
- 검색량 대비 경쟁이 낮아 상위노출 가능성이 높은 주제
- 예시: '서울 성수동 분위기 좋은 브런치 카페 혼자 가기 좋은 곳 추천' 처럼 구체적으로

반드시 순수 JSON만 출력. 마크다운 없이.
{"keywords":[{"rank":1,"keyword":"추천 글 주제 제목","reason":"선정 이유 한 줄"},...]}`

      const raw=await callClaude([{role:"user",content:prompt}],
        "You are a Naver blog SEO expert. Output ONLY valid JSON, no markdown.",1500,"claude-haiku-4-5-20251001");
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      const parsed=JSON.parse(s!==-1&&e!==-1?raw.slice(s,e+1):raw);
      setKeywords(parsed.keywords||[]);
    }catch(ex){setErr("추천 글 주제 생성 오류: "+ex.message);}
    setLoadingKw(false);
  };

  // ── 블로그 글 생성 ──
  const genPost=async(kw,idx)=>{
    setWritingIdx(idx); setPostKw(kw); setErr("");
    try{
      // 상위 3개 본문 크롤링 시도
      const bodies = await fetchBlogBodies(kw);
      const prompt = buildWritePrompt({ kw, year, category: selCat, bodies });
      const raw=await callClaude([{role:"user",content:prompt}],
        "You are a professional Korean Naver blog writer optimizing for homepage exposure. Output ONLY valid JSON, no markdown.",8000,"claude-sonnet-4-6");
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      const parsed=JSON.parse(s!==-1&&e!==-1?raw.slice(s,e+1):raw);
      const content=parsed.content||"";
      const mainKw=parsed.main_keyword||"";
      parsed.actual_chars=content.length;
      const esc=mainKw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      parsed.actual_kw_count=(content.match(new RegExp(esc,"g"))||[]).length;
      if(setActive && setAnalyzePostMeta){
        const meta = {
          title: parsed.title||"",
          main_keyword: parsed.main_keyword||postKw,
          content: content,
          tags: parsed.tags||[],
          _source: "category",
        };
        setAnalyzeAiResult(null);
        setAnalyzeLastText("");
        setAnalyzeWorkingText("");
        setAnalyzeReplacements({});
        setAnalyzePostMeta(meta);
        setAnalyzeText(content);
        setActive("analyze");
      }
    }catch(ex){setErr("글 작성 오류: "+ex.message);}
    setWritingIdx(null);
  };



  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

    {/* ── STEP 1: 카테고리 ── */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px 20px"}}>
      <div style={{display:"inline-block",background:"#1f6feb",color:"#fff",fontSize:"10px",fontWeight:700,borderRadius:"4px",padding:"2px 7px",marginBottom:"8px",letterSpacing:"0.05em"}}>STEP 1</div>
      <div style={{color:"#e6edf3",fontSize:"14px",fontWeight:700,marginBottom:"12px"}}>카테고리 선택</div>
      <select value={selCat} onChange={e=>{setSelCat(e.target.value);setKeywords([]);setPostKw("");setErr("");}}
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
        {loadingKw?"⏳ 추천 글 주제 분석 중...":"✍️ 추천 글 주제 10개 추출"}
      </button>
    </div>

    {/* 에러 */}
    {err&&<div style={{background:"#2d1117",border:"1px solid #da363344",borderRadius:"10px",padding:"12px 16px",color:"#ff7b72",fontSize:"13px"}}>⚠️ {err}</div>}

    {/* ── STEP 2: 롱테일 키워드 목록 ── */}
    {keywords.length>0&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"18px 20px"}}>
      <div style={{display:"inline-block",background:"#1f6feb",color:"#fff",fontSize:"10px",fontWeight:700,borderRadius:"4px",padding:"2px 7px",marginBottom:"8px",letterSpacing:"0.05em"}}>STEP 2</div>
      <div style={{color:"#e6edf3",fontSize:"14px",fontWeight:700,marginBottom:"4px"}}>추천 글 주제 선택</div>
      <div style={{color:"#484f58",fontSize:"12px",marginBottom:"14px"}}>오른쪽 <span style={{color:"#58a6ff",fontWeight:700}}>✍️ 자동글쓰기</span> 버튼을 클릭하면 글이 생성되고, <span style={{color:"#3fb950",fontWeight:700}}>글분석</span> 탭으로 자동 이동하여 바로 분석·수정할 수 있습니다.</div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {keywords.map((kw,idx)=>(
          <div key={idx} style={{
            display:"flex",alignItems:"center",gap:"12px",
            background:postKw===kw.keyword?"#0d2019":"#0d1117",
            border:`1px solid ${postKw===kw.keyword?"#2ea04366":"#21262d"}`,
            borderRadius:"10px",padding:"12px 14px",transition:"all .2s",
          }}>
            {/* 순위 */}
            <span style={{minWidth:"26px",height:"26px",borderRadius:"50%",background:"#1f6feb22",
              color:"#58a6ff",border:"1px solid #1f6feb44",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:"11px",fontWeight:700,flexShrink:0}}>
              {kw.rank}
            </span>
            {/* 키워드 + 이유 */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#e6edf3",fontWeight:600,fontSize:"14px",marginBottom:"2px"}}>{kw.keyword}</div>
              <div style={{color:"#484f58",fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{kw.reason}</div>
            </div>
            {/* 자동글쓰기 버튼 */}
            <button onClick={()=>genPost(kw.keyword,idx)} disabled={writingIdx!==null}
              style={{padding:"7px 14px",borderRadius:"7px",border:"none",
                background:writingIdx===idx?"#30363d":writingIdx!==null?"#21262d":"#2ea043",
                color:writingIdx!==null?"#484f58":"#fff",
                fontSize:"12px",fontWeight:700,cursor:writingIdx!==null?"not-allowed":"pointer",
                flexShrink:0,fontFamily:"'Noto Sans KR',sans-serif",transition:"background .2s",minWidth:"90px"}}>
              {writingIdx===idx?"⏳ 글분석으로 이동중...":"✍️ 자동글쓰기"}
            </button>
          </div>
        ))}
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
  const [img, setImg] = useState(null);       // {src, w, h, name, type}
  const [crop, setCrop] = useState({x:0,y:0,w:0,h:0});
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [done, setDone] = useState(null);     // 크롭 결과 blob URL
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const PREVIEW_MAX = 520;

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => {
      setImg({src:url, w:i.naturalWidth, h:i.naturalHeight, name:file.name, type:file.type});
      setCrop({x:0, y:0, w:i.naturalWidth, h:i.naturalHeight});
      setDone(null);
    };
    i.src = url;
  };

  const scale = img ? Math.min(1, PREVIEW_MAX / Math.max(img.w, img.h)) : 1;
  const pw = img ? Math.round(img.w * scale) : 0;
  const ph = img ? Math.round(img.h * scale) : 0;

  // 마우스로 크롭 영역 드래그
  const onMouseDown = (e) => {
    const rect = previewRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / scale;
    const sy = (e.clientY - rect.top) / scale;
    setDragStart({sx, sy});
    setDragging(true);
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart) return;
    const rect = previewRef.current.getBoundingClientRect();
    const ex = Math.min(img.w, Math.max(0, (e.clientX - rect.left) / scale));
    const ey = Math.min(img.h, Math.max(0, (e.clientY - rect.top) / scale));
    setCrop({
      x: Math.round(Math.min(dragStart.sx, ex)),
      y: Math.round(Math.min(dragStart.sy, ey)),
      w: Math.round(Math.abs(ex - dragStart.sx)),
      h: Math.round(Math.abs(ey - dragStart.sy)),
    });
  };
  const onMouseUp = () => setDragging(false);

  const doCrop = () => {
    if (!img || crop.w < 1 || crop.h < 1) return;
    const canvas = canvasRef.current;
    canvas.width = crop.w; canvas.height = crop.h;
    const ctx = canvas.getContext("2d");
    const src = new Image(); src.src = img.src;
    src.onload = () => {
      ctx.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      canvas.toBlob(blob => {
        setDone(URL.createObjectURL(blob));
      }, img.type || "image/png", 0.95);
    };
  };

  const doSave = () => {
    if (!done) return;
    const a = document.createElement("a");
    a.href = done; a.download = `crop_${img.name}`; a.click();
  };

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <canvas ref={canvasRef} style={{display:"none"}}/>

    {/* 업로드 */}
    {!img && <div onClick={()=>fileRef.current?.click()} onTouchEnd={e=>{e.preventDefault();fileRef.current?.click();}}
      onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadFile(e.dataTransfer.files[0]);}}
      style={{border:"2px dashed #30363d",borderRadius:"12px",padding:"32px",textAlign:"center",
        cursor:"pointer",background:"#0d1117"}}>
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])}/>
      <div style={{fontSize:"28px",marginBottom:"8px"}}>✂️</div>
      <div style={{color:"#e6edf3",fontWeight:700,fontSize:"14px",marginBottom:"4px"}}>이미지를 드래그하거나 클릭해서 업로드</div>
      <div style={{color:"#484f58",fontSize:"12px"}}>JPG · PNG · WebP · GIF 지원</div>
    </div>}

    {img && <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {/* 수치 입력 */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"12px 16px"}}>
        <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"10px"}}>✂️ 자르기 영역 설정 (px) — 이미지 위에서 드래그도 가능</div>
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
          {[["X 위치",crop.x,"x"],["Y 위치",crop.y,"y"],["너비",crop.w,"w"],["높이",crop.h,"h"]].map(([label,val,key])=>(
            <div key={key} style={{display:"flex",flexDirection:"column",gap:"3px"}}>
              <span style={{color:"#484f58",fontSize:"10px"}}>{label}</span>
              <input type="number" value={val} min={0}
                max={key==="x"||key==="w"?img.w:img.h}
                onChange={e=>setCrop(p=>({...p,[key]:Math.max(0,parseInt(e.target.value)||0)}))}
                style={{width:"80px",padding:"5px 8px",background:"#0d1117",border:"1px solid #30363d",
                  borderRadius:"6px",color:"#e6edf3",fontSize:"13px",outline:"none",
                  fontFamily:"'Noto Sans KR',sans-serif"}}/>
            </div>
          ))}
          <div style={{display:"flex",gap:"6px",marginLeft:"auto",alignItems:"flex-end",paddingTop:"13px"}}>
            <button onClick={()=>setCrop({x:0,y:0,w:img.w,h:img.h})}
              style={{padding:"6px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
                borderRadius:"7px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px"}}>
              전체 선택
            </button>
            <button onClick={doCrop} disabled={crop.w<1||crop.h<1}
              style={{padding:"6px 16px",background:crop.w>0&&crop.h>0?"#1f6feb":"#21262d",
                color:crop.w>0&&crop.h>0?"#fff":"#484f58",border:"none",borderRadius:"7px",
                cursor:crop.w>0?"pointer":"not-allowed",fontFamily:"'Noto Sans KR',sans-serif",
                fontSize:"12px",fontWeight:700}}>
              ✂️ 자르기 실행
            </button>
            {done && <button onClick={doSave}
              style={{padding:"6px 14px",background:"#2ea043",color:"#fff",border:"none",
                borderRadius:"7px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:700}}>
              ⬇️ 저장
            </button>}
            <button onClick={()=>{setImg(null);setDone(null);}}
              style={{padding:"6px 10px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
                borderRadius:"7px",cursor:"pointer",fontSize:"12px"}}>✕</button>
          </div>
        </div>
      </div>

      <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
        {/* 원본 프리뷰 */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:"#484f58",fontSize:"11px",marginBottom:"6px",fontWeight:600}}>
            원본 ({img.w}×{img.h}px) — 드래그로 영역 선택
          </div>
          <div ref={previewRef} style={{position:"relative",display:"inline-block",
            cursor:"crosshair",userSelect:"none",lineHeight:0,
            border:"1px solid #30363d",borderRadius:"8px",overflow:"hidden"}}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            <img src={img.src} style={{width:pw,height:ph,display:"block"}} draggable={false} alt=""/>
            {/* 크롭 오버레이 */}
            <div style={{position:"absolute",left:crop.x*scale,top:crop.y*scale,
              width:crop.w*scale,height:crop.h*scale,
              border:"2px solid #58a6ff",boxShadow:"0 0 0 9999px rgba(0,0,0,0.45)",
              pointerEvents:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{color:"#484f58",fontSize:"10px",marginTop:"4px"}}>
            선택: {crop.x},{crop.y} → {crop.w}×{crop.h}px
          </div>
        </div>

        {/* 결과 프리뷰 */}
        {done && <div style={{flex:1,minWidth:0}}>
          <div style={{color:"#3fb950",fontSize:"11px",marginBottom:"6px",fontWeight:600}}>
            ✅ 잘라내기 결과 ({crop.w}×{crop.h}px)
          </div>
          <div style={{border:"1px solid #2ea04344",borderRadius:"8px",overflow:"hidden",lineHeight:0,display:"inline-block"}}>
            <img src={done} style={{maxWidth:"100%",maxHeight:"320px",display:"block"}} alt="crop result"/>
          </div>
        </div>}
      </div>
    </div>}
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

      const raw = await callClaude(
        [{ role: "user", content: rewritePrompt }],
        "You are a professional Korean news writer. Output ONLY valid JSON, no markdown backticks.",
        4000,
        "claude-sonnet-4-6"
      );
      const s = raw.indexOf("{"); const e = raw.lastIndexOf("}");
      const parsed = JSON.parse(s !== -1 && e !== -1 ? raw.slice(s, e+1) : raw);
      setRewrittenTitle(parsed.title || title);
      setRewrittenText(parsed.content || raw);
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

const TOOL_MAP={keyword:KeywordTab,autowrite:AutoWriteTab,analyze:AnalyzeTab,rewrite:ArticleRewriteTab,ocr:OcrTab,convert:ConvertTab,missing:MissingTab,restore:RestoreTab,video:VideoTab,videogif:VideoGifTab,exif:ExifTab,crop:CropTab,resize:ResizeTab,imgcompress:ImgCompressTab,emoji:EmojiTab};


// ─── 블로그 글쓰기 공통 프롬프트 빌더 ───────────────────────────────────────
async function fetchBlogBodies(keyword) {
  try {
    const r = await fetch(`/api/blog-content?keyword=${encodeURIComponent(keyword)}`);
    const d = await r.json();
    if (d.success && d.bodies && d.bodies.length > 0) return d.bodies;
  } catch(e) {}
  return [];
}

function buildWritePrompt({ kw, year, category, smartBlockType, blogStrategy, bodies, mainKeyword }) {
  const hasBodies = bodies && bodies.length > 0;

  const styleSection = hasBodies
    ? `
[상위 노출 블로그 본문 분석 - 아래 ${bodies.length}개 글의 어휘 스타일·문체·구조를 분석해서 그 스타일로 작성할 것]
${bodies.map((b,i) => `--- 상위글 ${i+1} ---\n${b}`).join("\n\n")}

어휘 스타일 적용 규칙:
- 위 상위글들에서 자주 쓰인 어미·표현·문체를 파악해서 그대로 따를 것
- 단, 내용(사실/정보)은 절대 그대로 쓰지 말고 완전히 다르게 재구성할 것
- 위 글들의 구조(소제목 배치, 단락 길이, 정보 밀도)를 참고해서 비슷하게 구성할 것`
    : `
어휘 스타일 규칙 (상위글 분석 불가 → 최적화 추측 적용):
- 정보성 85% + 주관적 생각·감정 15% 비율로 작성
- 문체: -니다 체와 -요 체를 자연스럽게 혼용 (딱딱하지 않게)
- 예시: "~할 수 있습니다. 저도 처음엔 몰랐는데, 써보니까 정말 달랐어요."
- 독자가 공감할 수 있는 경험담·감정 표현을 15% 비율로 자연스럽게 녹일 것
- 단순 나열이 아닌 스토리텔링 흐름으로 정보 전달`;

  const mainKw = mainKeyword || kw;
  const contextSection = category
    ? `카테고리: "${category}"
분야: ${category} 전문 블로거 관점으로 작성`
    : `스마트블록 유형: ${smartBlockType||"블로그"}
블로그 전략: ${blogStrategy||""}`;

  return `메인 키워드 (반드시 이 단어가 글의 중심): "${mainKw}"
롱테일 주제 (이 내용을 글의 방향으로 활용): "${kw}"
${contextSection}
작성 기준 연도: ${year}년

위 롱테일 키워드를 주제로 네이버 블로그 홈판 최적화 글을 작성해줘.
${styleSection}

작성 규칙:
0. 최우선 목표: 네이버 홈판(스마트블록)에 노출될 수 있는 글 구조와 품질 유지
1. ${year}년 최신 정보 기준으로 작성
2. 메인 키워드는 반드시 위에 명시된 "{mainKw}" 사용. 롱테일 주제에서 새로 추출하지 말 것
3. 롱테일 키워드 내용이 글의 주요 목표
4. 한글+공백 포함 최소 1,800자 ~ 2,500자 (필수 준수)
5. 1,800자 미만이면 SEO에 맞춰 내용 보강 후 재작성
6. 메인 키워드는 글 전체에서 최대 8회까지만 사용. 이 규칙은 절대 어길 수 없음. 8회 초과 시 즉시 재작성
7. 메인 키워드 외 모든 단어는 최대 7회 이하로 사용. 특정 단어가 7회를 넘으면 동의어·유사어로 반드시 교체
8. 키워드 밀도: 전체 본문의 1~2% 이내 유지. 같은 단어가 한 문단에 2회 이상 나오면 즉시 다른 표현으로 바꿀 것
8. 네이버 SEO에 맞는 제목 1개 (메인 키워드 포함, 특수문자 없음, 예: "기기변경 번호이동 조건별 차이점과 혜택 완전 정리")
9. 글 첫 줄에 "안녕하세요", 블로거 이름, 자기소개 절대 금지. 바로 본론 시작

10. [소제목 형식] 네이버 블로그에 바로 붙여넣기 가능한 텍스트 형식으로 작성
    - 소제목은 반드시 아래 형식 사용: ▶ 소제목 텍스트
    - ##, **, <h2> 같은 마크다운·HTML 태그 절대 사용 금지
    - 소제목 앞뒤로 빈 줄 1개씩 추가

11. [표 형식] 표가 필요한 경우 아래 텍스트 표 형식만 사용. 글 전체에서 최대 2개까지만 허용. 표가 어울리지 않으면 0개도 가능.
    텍스트 표 형식 예시 (항목이 3개인 경우):
    ━━━━━━━━━━━━━━━━━━━━━━
    항목 | 내용1 | 내용2
    ───────────────────────
    행1  | 값1   | 값2
    행2  | 값1   | 값2
    ━━━━━━━━━━━━━━━━━━━━━━
    - | 마크다운 표 절대 사용 금지

12. 해시태그 5개 (본문 맨 끝에 한 줄로: #태그1 #태그2 #태그3 #태그4 #태그5)
13. 문장 단위로 줄바꿈 필수: 각 문장이 끝나면 반드시 \\n을 삽입해 한 줄에 한 문장씩 작성할 것

반드시 순수 JSON만 출력. 마크다운 없이.
{"title":"제목","main_keyword":"메인키워드","content":"본문전체(▶소제목,텍스트표,해시태그 포함)","tags":["태그1","태그2","태그3","태그4","태그5"]}`;
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
      const year = new Date().getFullYear();
      const bodies = await fetchBlogBodies(kw);
      const prompt = buildWritePrompt({ kw, year, smartBlockType, blogStrategy, bodies, mainKeyword: mainKeyword||kw });
      const res = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:8000,
          system:"You are a professional Korean Naver blog writer optimizing for homepage exposure. Output ONLY valid JSON, no markdown.",
          messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      const raw = data.content?.[0]?.text||"";
      const s=raw.indexOf("{"); const e=raw.lastIndexOf("}");
      const parsed = JSON.parse(s!==-1&&e!==-1?raw.slice(s,e+1):raw);
      const meta = {
        title: parsed.title||"",
        main_keyword: mainKeyword||parsed.main_keyword||kw,
        content: parsed.content||"",
        tags: parsed.tags||[],
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

  return <div style={{minHeight:"100vh",background:"#010409",fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",color:"#e6edf3",maxWidth:"1000px",marginLeft:"auto",marginRight:"auto",overflowX:"hidden"}}>
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
                    {WRITE_SUBTABS.map(sub=>{
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
        {WRITE_SUBTABS.map(sub=>(
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
  </div>
}
