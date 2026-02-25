import { useState, useRef, useCallback, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────
const FORBIDDEN_WORDS = [
  "가격","가장","관리자","구매","야하","에미","요가","의사","이메일","이반",
  "저렴","전화","최대","추천","카드","할인","호로","환불","광고","클릭",
  "카지노","도박","슬롯","배팅","토토","먹튀","성인","야동","포르노","마약",
  "대출","사기","불법","비아그라","시알리스","낙태","음란","매춘","성매매",
  "무료","이벤트","당첨","선착순","한정","특가","프로모션","협찬","대가성",
  "블로그","체험단","서포터즈","기자단","공구","판매","구입","쇼핑","배송",
];
const OUTPUT_FORMATS = [
  { id:"jpeg", label:"JPEG", mime:"image/jpeg", ext:"jpg", hasQuality:true },
  { id:"png",  label:"PNG",  mime:"image/png",  ext:"png", hasQuality:false },
  { id:"webp", label:"WEBP", mime:"image/webp", ext:"webp", hasQuality:true },
];
const COMPETITION_COLOR = {"매우낮음":"#3fb950","낮음":"#79c0ff","보통":"#ffa657","높음":"#ff7b72","매우높음":"#f85149"};

// ─── Helpers ──────────────────────────────────────────────────────────────
function escapeRegex(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
function detectForbidden(text){
  return FORBIDDEN_WORDS.map(w=>({word:w,count:(text.match(new RegExp(escapeRegex(w),"g"))||[]).length}))
    .filter(({count})=>count>0).sort((a,b)=>b.count-a.count);
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
async function callClaude(messages,system,maxTokens=2000){
  // Claude API 키 없으면 빈 문자열 반환 (AI 기능 비활성)
  try {
    const body={model:"claude-sonnet-4-20250514",max_tokens:maxTokens,messages};
    if(system) body.system=system;
    const res=await fetch("/api/claude",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(body)
    });
    if(!res.ok) return "";
    const data=await res.json();
    return data.content?.[0]?.text||"";
  } catch(e) {
    return "";
  }
}

const TABS=[
  {id:"keyword",  icon:"🔍", label:"키워드 조회"},
  {id:"write",    icon:"✍️",  label:"글 작성"},
  {id:"analyze",  icon:"📊", label:"글 분석 · 금칙어"},
  {id:"missing",  icon:"📡", label:"누락 확인"},
  {id:"ocr",      icon:"🖼️", label:"이미지→텍스트"},
  {id:"convert",  icon:"🔄", label:"이미지 변환"},
  {id:"emoji",    icon:"😀", label:"이모지"},
];

// ─── Shared UI ────────────────────────────────────────────────────────────
function Textarea({value,onChange,placeholder,rows=9}){
  return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{width:"100%",boxSizing:"border-box",padding:"14px 16px",background:"#0d1117",
      border:"1px solid #30363d",borderRadius:"10px",color:"#e6edf3",
      fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",lineHeight:"1.7",resize:"vertical",outline:"none"}}
    onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>;
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

  return <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
    {!workingText&&<div style={{background:"#161b22",borderRadius:"10px",padding:"24px",border:"1px solid #30363d",color:"#484f58",fontSize:"14px",textAlign:"center"}}>글 입력 후 <strong style={{color:"#8b949e"}}>통합 분석 실행</strong>을 눌러주세요</div>}
    {workingText&&<>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
        {forbidden.length>0&&<button onClick={aiRecommendAll} disabled={aiLoading}
          style={{padding:"8px 16px",background:aiLoading?"#21262d":"linear-gradient(135deg,#1f6feb,#8957e5)",
            color:aiLoading?"#484f58":"#fff",border:"none",borderRadius:"8px",cursor:aiLoading?"not-allowed":"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700,display:"flex",alignItems:"center",gap:"6px",transition:"opacity .2s"}}>
          {aiLoading?"⏳ AI 추천 중...":"✨ AI 전체 추천"}
        </button>}
        {forbidden.length>0&&Object.values(replacements).some(v=>v?.trim())&&
          <button onClick={doReplaceAll}
            style={{padding:"8px 16px",background:"#2ea043",color:"#fff",border:"none",borderRadius:"8px",
              cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:700}}>
            ✅ 전체 바꾸기
          </button>}
        <button onClick={()=>navigator.clipboard.writeText(workingText)}
          style={{padding:"8px 14px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",
            borderRadius:"8px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px"}}>
          📋 결과 복사
        </button>
        {forbidden.length>0
          ?<span style={{color:"#ff7b72",fontSize:"13px",fontWeight:600,marginLeft:"auto"}}>금칙어 {forbidden.length}개 발견</span>
          :<span style={{color:"#3fb950",fontSize:"13px",fontWeight:600,marginLeft:"auto"}}>✅ 금칙어 없음</span>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
        <div>
          <div style={{fontSize:"12px",color:"#8b949e",marginBottom:"8px",fontWeight:600}}>📄 검사 결과 미리보기</div>
          <div style={{fontSize:"11px",color:"#8b949e",marginBottom:"8px",lineHeight:"1.7"}}>
            · 금칙어는 <span style={{color:"#ff7b72"}}>빨간색</span>으로 표시됩니다.<br/>
            · 글의 의도에 따라 실제 금칙어가 아닐 수 있습니다.
          </div>
          <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"14px",
            fontSize:"13px",lineHeight:"1.9",color:"#c9d1d9",maxHeight:"420px",overflowY:"auto",
            whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
            {Array.isArray(hp)
              ?hp.map((p,i)=><span key={i} style={p.h?{color:"#ff7b72",background:"#ff7b7222",borderRadius:"2px",padding:"0 2px"}:{}}>{p.text}</span>)
              :workingText}
          </div>
        </div>

        <div>
          <div style={{color:"#8b949e",fontSize:"12px",fontWeight:700,marginBottom:"8px"}}>📋 금칙어 위반 목록</div>
          {forbidden.length===0
            ?<div style={{background:"#0d2019",border:"1px solid #2ea043",borderRadius:"10px",padding:"16px",color:"#3fb950",fontSize:"14px",textAlign:"center"}}>✅ 금칙어 없음!</div>
            :<div style={{borderRadius:"10px",overflow:"hidden",border:"1px solid #21262d"}}>
              <div style={{display:"grid",gridTemplateColumns:"22px 76px 1fr 70px",gap:"6px",padding:"8px 10px",background:"#21262d",fontSize:"11px",color:"#8b949e",fontWeight:600,alignItems:"center"}}>
                <span>#</span><span>금칙어</span><span>변경 단어</span><span style={{textAlign:"right"}}>액션</span>
              </div>
              <div style={{maxHeight:"420px",overflowY:"auto"}}>
                {forbidden.map(({word,count},idx)=>{
                  const isPerLoading=perLoading[word]===true;
                  const suggRaw=perLoading[`${word}__suggestions`];
                  const suggList=suggRaw?suggRaw.split(",").map(s=>s.trim()).filter(Boolean):[];
                  return <div key={word} style={{borderBottom:idx<forbidden.length-1?"1px solid #21262d":"none",background:idx%2===0?"#161b22":"#0d1117"}}>
                    <div style={{display:"grid",gridTemplateColumns:"22px 76px 1fr 70px",gap:"6px",padding:"9px 10px",alignItems:"center"}}>
                      <span style={{color:"#484f58",fontSize:"11px"}}>{idx+1}</span>
                      <div>
                        <div style={{color:"#ff7b72",fontWeight:700,fontSize:"13px"}}>{word}</div>
                        <div style={{color:"#484f58",fontSize:"10px"}}>{count}회</div>
                      </div>
                      <input
                        value={replacements[word]||""}
                        onChange={e=>setReplacements(p=>({...p,[word]:e.target.value}))}
                        placeholder={isPerLoading?"AI 추천 중...":"직접 입력 또는 AI 추천 →"}
                        onKeyDown={e=>e.key==="Enter"&&doReplace(word)}
                        style={{padding:"6px 8px",background:"#0d1117",
                          border:`1px solid ${replacements[word]?.trim()?"#1f6feb66":"#30363d"}`,
                          borderRadius:"6px",color:"#e6edf3",fontSize:"12px",outline:"none",
                          fontFamily:"'Noto Sans KR',sans-serif",width:"100%",boxSizing:"border-box"}}
                        onFocus={e=>e.target.style.borderColor="#58a6ff"}
                        onBlur={e=>e.target.style.borderColor=replacements[word]?.trim()?"#1f6feb66":"#30363d"}/>
                      <div style={{display:"flex",gap:"4px",justifyContent:"flex-end"}}>
                        <button onClick={()=>aiRecommendOne(word)} disabled={isPerLoading}
                          title="AI가 문맥에 맞는 대체어 추천"
                          style={{padding:"5px 7px",background:isPerLoading?"#21262d":"#8957e522",
                            color:isPerLoading?"#484f58":"#d2a8ff",
                            border:`1px solid ${isPerLoading?"#30363d":"#8957e544"}`,
                            borderRadius:"6px",cursor:isPerLoading?"not-allowed":"pointer",fontSize:"13px"}}>
                          {isPerLoading?"⏳":"✨"}
                        </button>
                        <button onClick={()=>doReplace(word)}
                          style={{padding:"5px 8px",background:replacements[word]?.trim()?"#1f6feb":"#21262d",
                            color:replacements[word]?.trim()?"#fff":"#484f58",border:"none",
                            borderRadius:"6px",cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",
                            fontSize:"11px",fontWeight:600}}>
                          바꾸기
                        </button>
                      </div>
                    </div>
                    {suggList.length>0&&<div style={{padding:"0 10px 9px 114px",display:"flex",gap:"5px",flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{color:"#484f58",fontSize:"10px",flexShrink:0}}>추천:</span>
                      {suggList.map((s,i)=>(
                        <button key={i} onClick={()=>setReplacements(p=>({...p,[word]:s}))}
                          style={{padding:"2px 10px",
                            background:replacements[word]===s?"#1f6feb22":"#21262d",
                            color:replacements[word]===s?"#58a6ff":"#8b949e",
                            border:`1px solid ${replacements[word]===s?"#1f6feb55":"#30363d"}`,
                            borderRadius:"20px",cursor:"pointer",fontSize:"11px",
                            fontFamily:"'Noto Sans KR',sans-serif",transition:"all .1s"}}>
                          {s}
                        </button>
                      ))}
                    </div>}
                  </div>;
                })}
              </div>
            </div>}
        </div>
      </div>
    </>}
  </div>;
}

// ─── TAB 1: 글 분석 ──────────────────────────────────────────────────────
function AnalyzeTab(){
  const [text,setText]=useState("");
  const [activeSection,setActiveSection]=useState("stats");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [lastText,setLastText]=useState("");
  const [threshold,setThreshold]=useState(5);
  // forbidden replace state
  const [replacements,setReplacements]=useState({});
  const [workingText,setWorkingText]=useState("");

  const s=countChars(text);
  const grade=s.noSpace<1000?["#ff7b72","⚠️ 짧음 (1,000자 미만)","SEO 불리"]:
    s.noSpace<2000?["#ffa657","🟡 보통","2,000자 이상 권장"]:
    s.noSpace<5000?["#3fb950","✅ 적정","SEO 좋음"]:["#79c0ff","🏆 우수 콘텐츠","5,000자+"];

  const isDirty=text!==lastText&&lastText!=="";

  const runAnalysis=async()=>{
    if(!text.trim()) return;
    setAnalyzing(true); setAiResult(null);
    // also run forbidden check
    setWorkingText(text); setReplacements({});

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
- morpheme.words: 명사/동사/형용사 어근만, 조사·어미 제거, 2글자 이상, 빈도순 상위 40개
- morpheme.seo: high=SEO 핵심어(메인키워드급), mid=관련어, low=일반어
- lowQuality.items: 비속어, 욕설, 광고/홍보성 문구, 동일 단어 과도 반복(15회+), 스팸성 패턴, 어뷰징 의심 표현 등 실제로 발견된 것만
- lowQuality.score: 낮을수록 저품질 위험 적음 (0=완전 안전, 100=매우 위험)`;

    try{
      const raw=await callClaude([{role:"user",content:prompt}],
        "You are a Korean blog SEO and quality analysis expert. Output ONLY valid JSON.", 4000);
      const s=raw.indexOf("{"), e=raw.lastIndexOf("}");
      const parsed=JSON.parse(s!==-1&&e!==-1?raw.slice(s,e+1):raw);
      parsed.morpheme.words=parsed.morpheme.words.sort((a,b)=>b.count-a.count);
      setAiResult(parsed);
      setLastText(text);
      setActiveSection("morpheme");
    }catch(err){
      setAiResult({error:true});
    }
    setAnalyzing(false);
  };

  // forbidden helpers
  const forbidden=workingText?detectForbidden(workingText):[];
  const hp=workingText?highlightText(workingText,forbidden,replacements):null;
  const doReplace=(word)=>{const r=replacements[word];if(!r?.trim())return;setWorkingText(p=>p.split(word).join(r.trim()));setReplacements(p=>{const n={...p};delete n[word];return n;});};
  const doReplaceAll=()=>{let t=workingText;Object.entries(replacements).forEach(([w,r])=>{if(r?.trim())t=t.split(w).join(r.trim());});setWorkingText(t);setReplacements({});};

  const SECTIONS=[
    {id:"stats",  icon:"📝", label:"글자수"},
    {id:"morpheme",icon:"🔤",label:"형태소·SEO"},
    {id:"quality", icon:"🛡️",label:"저품질 감지"},
    {id:"forbidden",icon:"🚫",label:"금칙어"},
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

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>

    {/* 텍스트 입력 */}
    <div style={{position:"relative"}}>
      <Textarea value={text} onChange={t=>{setText(t);}} placeholder="분석할 블로그 글을 입력하세요..." rows={9}/>
      <div style={{position:"absolute",bottom:"10px",right:"14px",color:text.length>9000?"#ff7b72":"#484f58",fontSize:"12px"}}>{text.length.toLocaleString()} / 10,000자</div>
    </div>

    {/* 분석 버튼 */}
    <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
      <Btn onClick={runAnalysis} loading={analyzing}>🔍 통합 분석 실행</Btn>
      {isDirty&&<span style={{color:"#ffa657",fontSize:"12px"}}>⚠️ 텍스트가 변경됐습니다. 재분석 필요</span>}
      {aiResult&&!aiResult.error&&!isDirty&&<span style={{color:"#3fb950",fontSize:"12px"}}>✅ 분석 완료</span>}
    </div>

    {/* 로딩 */}
    {analyzing&&<div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
      {["텍스트 파싱 중...","형태소·SEO 분석 중...","저품질·비속어 감지 중...","금칙어 목록 대조 중..."].map((m,i)=>(
        <div key={i} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"8px",padding:"10px 14px",color:"#8b949e",fontSize:"13px",animation:`pulse 1.6s ease ${i*0.3}s infinite`}}>⏳ {m}</div>
      ))}
    </div>}

    {aiResult?.error&&<div style={{background:"#2d1117",border:"1px solid #da3633",borderRadius:"10px",padding:"14px",color:"#ff7b72"}}>⚠️ 분석 오류. 다시 시도해주세요.</div>}

    {/* 섹션 탭 */}
    {(text||aiResult)&&<div style={{display:"flex",gap:"4px",background:"#0d1117",borderRadius:"10px",padding:"4px",border:"1px solid #21262d"}}>
      {SECTIONS.map(sec=>(
        <button key={sec.id} onClick={()=>setActiveSection(sec.id)} style={{
          flex:1,padding:"9px 6px",borderRadius:"7px",border:"none",
          background:activeSection===sec.id?"#161b22":"none",
          color:activeSection===sec.id?"#e6edf3":"#8b949e",
          cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"12px",fontWeight:600,
          boxShadow:activeSection===sec.id?"0 1px 4px #00000066":"none",transition:"all .15s",
        }}>{sec.icon} {sec.label}</button>
      ))}
    </div>}

    {/* ── 섹션 1: 글자수 통계 ── */}
    {activeSection==="stats"&&<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
        <StatCard label="전체 글자수" value={s.total} accent="#58a6ff"/>
        <StatCard label="공백 제외" value={s.noSpace} accent="#3fb950"/>
        <StatCard label="바이트" value={s.bytes} accent="#d2a8ff"/>
        <StatCard label="단어 수" value={s.words} accent="#ffa657"/>
        <StatCard label="줄 수" value={s.lines} accent="#ff7b72"/>
        <StatCard label="문장 수" value={s.sentences} accent="#79c0ff"/>
      </div>
      {text&&<div style={{background:"#161b22",borderRadius:"10px",padding:"13px 16px",border:"1px solid #30363d",display:"flex",alignItems:"center",gap:"10px"}}>
        <span style={{fontSize:"20px"}}>{grade[1].split(" ")[0]}</span>
        <div>
          <div style={{color:grade[0],fontSize:"14px",fontWeight:700}}>{grade[1]}</div>
          <div style={{color:"#8b949e",fontSize:"12px"}}>{grade[2]}</div>
        </div>
        <span style={{color:"#484f58",fontSize:"12px",marginLeft:"auto"}}>권장 2,000자 / 이상적 5,000자+</span>
      </div>}
      {!aiResult&&text&&<div style={{background:"#1a2332",border:"1px solid #1f6feb44",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",color:"#8b949e"}}>
        💡 <strong style={{color:"#c9d1d9"}}>통합 분석 실행</strong>을 누르면 형태소·SEO·저품질·금칙어를 한번에 분석합니다.
      </div>}
    </div>}

    {/* ── 섹션 2: 형태소·SEO 분석 ── */}
    {activeSection==="morpheme"&&<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {!aiResult&&<div style={{background:"#161b22",borderRadius:"10px",padding:"24px",border:"1px solid #30363d",color:"#484f58",fontSize:"14px",textAlign:"center"}}>글 입력 후 <strong style={{color:"#8b949e"}}>통합 분석 실행</strong>을 눌러주세요</div>}
      {aiResult&&!aiResult.error&&<>
        {/* SEO 스코어 */}
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
          {/* 핵심 키워드 */}
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {aiResult.morpheme.mainKeywords?.map(kw=>(
              <span key={kw} style={{background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",borderRadius:"20px",padding:"3px 12px",fontSize:"12px",fontWeight:600}}>{kw}</span>
            ))}
          </div>
        </div>

        {/* 감정 분석 */}
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

        {/* 단어 빈도 */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
            <SectionTitle>🔤 형태소 단어 빈도 (검색엔진 관점)</SectionTitle>
            <div style={{display:"flex",alignItems:"center",gap:"5px",marginLeft:"auto"}}>
              <span style={{color:"#8b949e",fontSize:"12px"}}>기준</span>
              <input type="number" value={threshold} min={1} onChange={e=>setThreshold(Number(e.target.value))}
                style={{width:"46px",padding:"4px 6px",background:"#0d1117",border:"1px solid #30363d",borderRadius:"6px",color:"#e6edf3",fontSize:"13px",outline:"none",textAlign:"center"}}/>
              <span style={{color:"#8b949e",fontSize:"12px"}}>회↑</span>
            </div>
          </div>
          {/* 품사·SEO 범례 */}
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
                  <span style={{color:isHigh?"#3fb950":"#c9d1d9",fontSize:"14px",fontWeight:600,minWidth:"60px"}}>{word}</span>
                  <div style={{flex:1,height:"5px",background:"#21262d",borderRadius:"3px",overflow:"hidden"}}>
                    <div style={{width:`${(count/maxCount)*100}%`,height:"100%",background:isHigh?"#3fb950":tc,borderRadius:"3px"}}/>
                  </div>
                  <span style={{minWidth:"36px",textAlign:"right",color:"#8b949e",fontWeight:700,fontSize:"13px"}}>{count}회</span>
                </div>;
              })}
            </div>
            :<div style={{background:"#0d2019",border:"1px solid #2ea043",borderRadius:"10px",padding:"12px",color:"#3fb950",fontSize:"14px"}}>✅ {threshold}회 이상 반복 단어 없음</div>
          }
        </div>
      </>}
    </div>}

    {/* ── 섹션 3: 저품질·비속어 감지 ── */}
    {activeSection==="quality"&&<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {!aiResult&&<div style={{background:"#161b22",borderRadius:"10px",padding:"24px",border:"1px solid #30363d",color:"#484f58",fontSize:"14px",textAlign:"center"}}>글 입력 후 <strong style={{color:"#8b949e"}}>통합 분석 실행</strong>을 눌러주세요</div>}
      {aiResult&&!aiResult.error&&<>
        {/* 종합 판정 */}
        {(()=>{
          const v=aiResult.lowQuality.verdict||"양호";
          const [vc,vbg,vi]=verdictStyle[v]||verdictStyle["양호"];
          const sc=aiResult.lowQuality.score||0;
          return <div style={{background:vbg,border:`1px solid ${vc}44`,borderRadius:"12px",padding:"16px",display:"flex",alignItems:"center",gap:"14px"}}>
            <div style={{textAlign:"center",minWidth:"60px"}}>
              <div style={{fontSize:"28px"}}>{vi}</div>
              <div style={{color:vc,fontWeight:700,fontSize:"14px"}}>{v}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{color:"#c9d1d9",fontSize:"13px",marginBottom:"8px"}}>저품질 위험도 점수: <strong style={{color:vc}}>{sc}점</strong> <span style={{color:"#484f58",fontSize:"11px"}}>(낮을수록 안전)</span></div>
              <div style={{height:"8px",background:"#21262d",borderRadius:"4px",overflow:"hidden"}}>
                <div style={{width:`${sc}%`,height:"100%",background:sc<30?"#3fb950":sc<60?"#ffa657":"#f85149",borderRadius:"4px",transition:"width .5s"}}/>
              </div>
            </div>
          </div>;
        })()}

        {/* 감지된 항목 */}
        {aiResult.lowQuality.items?.length>0
          ?<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #30363d",display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{color:"#ff7b72",fontWeight:700,fontSize:"13px"}}>⚠️ 감지된 저품질 요소 {aiResult.lowQuality.items.length}개</span>
            </div>
            <div style={{display:"flex",flexDirection:"column"}}>
              {aiResult.lowQuality.items.map((item,i)=>{
                const sev=item.severity;
                const sc2=sev==="high"?"#f85149":sev==="mid"?"#ffa657":"#8b949e";
                const sevLabel=sev==="high"?"심각":sev==="mid"?"주의":"낮음";
                return <div key={i} style={{padding:"12px 16px",borderBottom:i<aiResult.lowQuality.items.length-1?"1px solid #21262d":"none",background:i%2===0?"#161b22":"#0d1117"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                    <span style={{background:sc2+"22",color:sc2,border:`1px solid ${sc2}44`,borderRadius:"4px",padding:"1px 8px",fontSize:"11px",fontWeight:700}}>{item.category}</span>
                    <span style={{background:"#21262d",color:sc2,border:`1px solid ${sc2}33`,borderRadius:"4px",padding:"1px 7px",fontSize:"10px"}}>{sevLabel}</span>
                    <span style={{color:"#ff7b72",fontWeight:600,fontSize:"13px",marginLeft:"4px"}}>"{item.text}"</span>
                    {item.count>1&&<span style={{color:"#484f58",fontSize:"11px"}}>({item.count}회)</span>}
                  </div>
                  <div style={{color:"#8b949e",fontSize:"12px",lineHeight:"1.6"}}>💡 {item.suggestion}</div>
                </div>;
              })}
            </div>
          </div>
          :<div style={{background:"#0d2019",border:"1px solid #2ea043",borderRadius:"10px",padding:"16px",color:"#3fb950",fontSize:"14px",textAlign:"center"}}>✅ 저품질 요소가 감지되지 않았습니다!</div>
        }

        {/* 개선 팁 */}
        {aiResult.lowQuality.tips?.length>0&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"14px 16px"}}>
          <div style={{color:"#8b949e",fontSize:"12px",fontWeight:700,marginBottom:"10px"}}>💡 개선 팁</div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {aiResult.lowQuality.tips.map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:"8px",fontSize:"13px",color:"#c9d1d9",lineHeight:"1.6"}}>
                <span style={{color:"#1f6feb",fontWeight:700,flexShrink:0}}>{i+1}.</span><span>{tip}</span>
              </div>
            ))}
          </div>
        </div>}
      </>}
    </div>}

    {/* ── 섹션 4: 금칙어 검사 ── */}
    {activeSection==="forbidden"&&<ForbiddenSection
      workingText={workingText} forbidden={forbidden} hp={hp}
      replacements={replacements} setReplacements={setReplacements}
      doReplace={doReplace} doReplaceAll={doReplaceAll}
    />}
  </div>;
}


// ─── TAB 3: 이미지→텍스트 OCR ────────────────────────────────────────────
function OcrTab(){
  const [images,setImages]=useState([]);
  const [dragOver,setDragOver]=useState(false);
  const [mode,setMode]=useState("simple");
  const fileInputRef=useRef(null);
  const addFiles=useCallback((files)=>{
    const valid=[...files].filter(f=>f.type.startsWith("image/"));
    if(!valid.length) return;
    setImages(prev=>[...prev,...valid.map(f=>({file:f,preview:URL.createObjectURL(f),result:"",loading:false,id:Date.now()+Math.random()}))]);
  },[]);
  useEffect(()=>{
    const onPaste=e=>{const files=[...e.clipboardData.items].filter(i=>i.type.startsWith("image/")).map(i=>i.getAsFile()).filter(Boolean);if(files.length) addFiles(files);};
    window.addEventListener("paste",onPaste); return()=>window.removeEventListener("paste",onPaste);
  },[addFiles]);
  const extractText=async(img)=>{
    setImages(prev=>prev.map(i=>i.id===img.id?{...i,loading:true,result:""}:i));
    try{
      const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(img.file);});
      const prompt=mode==="rich"?"이 이미지에서 텍스트를 추출해주세요. 표, 목록, 제목 등 서식 구조를 마크다운 형태로 유지해주세요.":"이 이미지에서 텍스트만 순수하게 추출해주세요. 서식 없이 텍스트만 출력하세요.";
      const result=await callClaude([{role:"user",content:[{type:"image",source:{type:"base64",media_type:img.file.type||"image/jpeg",data:base64}},{type:"text",text:prompt}]}]);
      setImages(prev=>prev.map(i=>i.id===img.id?{...i,loading:false,result}:i));
    }catch(e){setImages(prev=>prev.map(i=>i.id===img.id?{...i,loading:false,result:"⚠️ 오류. 다시 시도해주세요."}:i));}
  };
  const extractAll=()=>images.filter(i=>!i.result&&!i.loading).forEach(i=>extractText(i));
  const totalChars=images.reduce((s,i)=>s+(i.result?.length||0),0);
  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
      <span style={{color:"#8b949e",fontSize:"13px"}}>추출 방식:</span>
      {[["simple","📄 간단한 텍스트"],["rich","📋 서식 있는 텍스트"]].map(([v,l])=>(
        <button key={v} onClick={()=>setMode(v)} style={{padding:"7px 14px",borderRadius:"6px",border:`1px solid ${mode===v?"#58a6ff":"#30363d"}`,background:mode===v?"#1f6feb22":"#21262d",color:mode===v?"#58a6ff":"#8b949e",cursor:"pointer",fontSize:"13px",fontFamily:"'Noto Sans KR',sans-serif"}}>{l}</button>
      ))}
    </div>
    <div onClick={()=>fileInputRef.current?.click()} onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
      style={{border:`2px dashed ${dragOver?"#58a6ff":"#30363d"}`,borderRadius:"12px",padding:"36px 20px",textAlign:"center",cursor:"pointer",background:dragOver?"#1f6feb11":"#0d1117",transition:"all .2s"}}>
      <div style={{fontSize:"36px",marginBottom:"10px"}}>🖼️</div>
      <div style={{color:"#c9d1d9",fontSize:"15px",fontWeight:600,marginBottom:"6px"}}>이미지를 드래그하거나 클릭하여 업로드</div>
      <div style={{color:"#484f58",fontSize:"13px"}}>JPG, PNG, GIF, WEBP, BMP, AVIF · 여러 장 동시 가능</div>
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
              {img.loading?<div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {["텍스트 인식중...","이미지 분석중...","결과 생성중..."].map((msg,i)=><div key={i} style={{color:"#8b949e",fontSize:"13px",animation:`pulse 1.5s ease ${i*0.3}s infinite`}}>⏳ {msg}</div>)}
                <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
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
    <div onClick={()=>fileInputRef.current?.click()}
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
// Next.js API Route를 통해 네이버 광고 API 실제 데이터 조회 (서버사이드)
async function fetchNaverKeywordStats(keywords) {
  const res = await fetch(`/api/keyword-stats?keywords=${keywords.map(encodeURIComponent).join(",")}`);
  if (!res.ok) throw new Error(`API 오류 ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.keywordList || [];
}

function KeywordTab({goWrite}){
  const [inputVal,setInputVal]=useState("");
  const [keyword,setKeyword]=useState("");
  const [data,setData]=useState(null);       // AI 분석 결과
  const [kwStats,setKwStats]=useState(null); // 네이버 API 실제 수치
  const [loading,setLoading]=useState(false);
  const [apiStatus,setApiStatus]=useState(""); // "ok" | "fail" | ""
  const [error,setError]=useState("");

  const analyze=async()=>{
    const kw=inputVal.trim(); if(!kw) return;
    setLoading(true);setError("");setData(null);setKwStats(null);setKeyword(kw);setApiStatus("");
    try{
      // ① 네이버 광고 API 실제 검색량 (병렬로 먼저 시작)
      const naverPromise = fetchNaverKeywordStats([kw]).then(list=>{
        setKwStats(list);
        setApiStatus("ok");
        return list;
      }).catch(e=>{
        setApiStatus("fail");
        return [];
      });

      // ② 네이버 API 결과 기다리기
      await naverPromise;

      // ③ AI SEO 분석 (API 키 있을 때만)
      try {
        const raw = await callClaude([{role:"user",content:`"${kw}" 키워드 네이버 블로그 SEO 분석. 순수 JSON만 출력.
{
  "competitionLevel": "매우낮음|낮음|보통|높음|매우높음",
  "competitionScore": 0~100,
  "trend": "상승|하락|유지",
  "trendReason": "최근 검색 트렌드 이유를 구체적으로 한 줄 (예: 최신 모델 출시, 계절적 요인 등)",
  "peakSeason": "성수기 및 검색량이 높은 시기 설명",
  "difficultyComment": "상위노출을 위한 핵심 조언 한 줄",
  "relatedKeywords": ["연관키워드1","연관키워드2","연관키워드3","연관키워드4","연관키워드5","연관키워드6","연관키워드7","연관키워드8"],
  "longtailKeywords": [
    "검색량 높은 연관키워드를 포함한 문장형 키워드 (예: 아이폰16 스펙 디자인 한번에 몰아보기)",
    "비교/추천형 문장 (예: 유플러스 아이들나라 vs 올레TV 아이 있는 집 어디가 나을까)",
    "구체적 정보탐색 문장형 키워드",
    "후기/경험 기반 문장형 키워드",
    "가격/할인 관련 문장형 키워드",
    "초보자/입문자 대상 문장형 키워드",
    "최신/신규 정보 문장형 키워드"
  ]
}`}],"Respond ONLY with valid JSON. longtailKeywords must be complete sentences including the main keyword and related keywords, not just word combinations.");
        const cleaned = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
        const aiResult = JSON.parse(cleaned);

        // 연관 키워드 검색량 조회 (await해서 한번에 표시)
        let relStats = [];
        if(aiResult?.relatedKeywords?.length){
          try{
            relStats = await fetchNaverKeywordStats(aiResult.relatedKeywords.slice(0,8));
          }catch(e){}
        }
        setData({...aiResult, _relatedStats: relStats});
      } catch(aiErr) {
        // AI 실패해도 네이버 검색량은 표시
        setData({
          competitionLevel:"보통", competitionScore:50,
          trend:"유지", trendReason:"AI 분석 미연결 상태",
          peakSeason:"", difficultyComment:"AI API 키 연결 후 상세 분석 가능",
          relatedKeywords:[], longtailKeywords:[],
          smartBlocks:["VIEW","블로그"], titleSuggestions:[],
          contentTips:"AI API 키를 연결하면 상세 전략을 볼 수 있어요."
        });
      }
    }catch(e){
      setError("분석 오류: "+e.message);
    }
    setLoading(false);
  };

  // 네이버 API에서 특정 키워드 수치 찾기
  const getStat = (kw, field) => {
    const item = kwStats?.find(i=>i.relKeyword?.toLowerCase()===kw?.toLowerCase());
    return item?.[field] ?? null;
  };
  const getRelStat = (kw, field, relStats) => {
    const item = relStats?.find(i=>i.relKeyword?.toLowerCase()===kw?.toLowerCase());
    return item?.[field] ?? null;
  };

  // 메인 키워드 수치
  const pcMonthly  = getStat(keyword,"monthlyPcQcCnt");
  const mobMonthly = getStat(keyword,"monthlyMobileQcCnt");
  const totalMonthly = (pcMonthly!==null&&mobMonthly!==null) ? pcMonthly+mobMonthly : null;
  const compIdx    = getStat(keyword,"compIdx"); // "낮음"|"보통"|"높음"
  const compColor  = data?(COMPETITION_COLOR[data.competitionLevel]||"#ffa657"):"#ffa657";

  const fmtNum = n => n===null||n===undefined ? "-" : n<=10 ? "10 이하" : Number(n).toLocaleString();

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
    <div style={{display:"flex",gap:"10px"}}>
      <input value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}
        placeholder="키워드를 입력하세요 (예: 강남맛집, 다이어트식단...)"
        style={{flex:1,padding:"13px 18px",background:"#0d1117",border:"1px solid #30363d",borderRadius:"10px",
          color:"#e6edf3",fontFamily:"'Noto Sans KR',sans-serif",fontSize:"15px",outline:"none"}}
        onFocus={e=>e.target.style.borderColor="#58a6ff"} onBlur={e=>e.target.style.borderColor="#30363d"}/>
      <Btn onClick={analyze} loading={loading}>🔍 분석하기</Btn>
    </div>

    {error&&<div style={{background:"#2d1117",border:"1px solid #da3633",borderRadius:"10px",padding:"14px",color:"#ff7b72"}}>{error}</div>}

    {loading&&<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      {["📡 네이버 광고 API 검색량 조회 중...","🤖 AI SEO 전략 분석 중...","🔗 연관 키워드 수집 중...","✏️ 제목·콘텐츠 전략 생성 중..."].map((msg,i)=>(
        <div key={i} style={{background:"#161b22",borderRadius:"10px",padding:"12px 16px",border:"1px solid #30363d",
          color:"#8b949e",fontSize:"13px",animation:`pulse 1.5s ease ${i*0.3}s infinite`,display:"flex",gap:"8px",alignItems:"center"}}>
          {msg}
        </div>
      ))}
    </div>}

    {data&&!loading&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

      {/* ── 헤더 + 실제 검색량 ── */}
      <div style={{background:"linear-gradient(135deg,#1a2332,#0d1f35)",border:"1px solid #1f6feb44",borderRadius:"12px",padding:"18px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
          <div style={{fontSize:"20px",fontWeight:700,color:"#fff"}}>🔍 <span style={{color:"#58a6ff"}}>"{keyword}"</span></div>
          {apiStatus==="ok"
            ?<span style={{fontSize:"11px",color:"#3fb950",background:"#0d2019",border:"1px solid #2ea04333",borderRadius:"20px",padding:"2px 10px"}}>📡 네이버 실제 데이터</span>
            :apiStatus==="fail"
            ?<span style={{fontSize:"11px",color:"#ffa657",background:"#2d1e0a",border:"1px solid #ffa65733",borderRadius:"20px",padding:"2px 10px"}}>⚠️ 서버 미실행 · AI 추정</span>
            :<span style={{fontSize:"11px",color:"#484f58",background:"#21262d",borderRadius:"20px",padding:"2px 10px"}}>조회 중...</span>}
          <span style={{marginLeft:"auto",color:data.trend==="상승"?"#3fb950":data.trend==="하락"?"#ff7b72":"#8b949e",
            background:data.trend==="상승"?"#0d201966":data.trend==="하락"?"#2d111766":"#21262d",
            border:`1px solid ${data.trend==="상승"?"#2ea04344":data.trend==="하락"?"#da363344":"#30363d"}`,
            borderRadius:"20px",padding:"4px 12px",fontSize:"13px",fontWeight:600}}>
            {data.trend==="상승"?"📈 상승세":data.trend==="하락"?"📉 하락세":"➡️ 유지"}
          </span>
        </div>

        {/* 핵심 수치 카드 */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px"}}>
          {[
            ["월간 검색량 (합산)", totalMonthly!==null ? fmtNum(totalMonthly)+"회" : apiStatus==="fail" ? "조회 실패" : apiStatus==="ok" ? "데이터 없음" : "조회 중...", "#58a6ff"],
            ["PC 검색량",          pcMonthly!==null  ? fmtNum(pcMonthly)+"회"    : apiStatus==="ok" ? "없음" : "-",  "#79c0ff"],
            ["모바일 검색량",       mobMonthly!==null ? fmtNum(mobMonthly)+"회"   : apiStatus==="ok" ? "없음" : "-",  "#d2a8ff"],
            ["경쟁 강도",          compIdx||data.competitionLevel||"-",                            compColor],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:"#0d1117aa",borderRadius:"10px",padding:"12px 10px",border:"1px solid #30363d",textAlign:"center"}}>
              <div style={{color:c,fontSize:"16px",fontWeight:700,marginBottom:"4px"}}>{v}</div>
              <div style={{color:"#8b949e",fontSize:"10px"}}>{l}</div>
            </div>
          ))}
        </div>
        {totalMonthly!==null&&<div style={{marginTop:"10px",fontSize:"11px",color:"#484f58",textAlign:"right"}}>
          ※ 네이버 검색광고 API 기준 · 10 이하는 "10 이하"로 표시
        </div>}
      </div>

      {/* ── 트렌드 + 경쟁도 ── */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"14px"}}>
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
          <SectionTitle>📈 트렌드 분석 <span style={{color:"#484f58",fontWeight:400,fontSize:"11px"}}>· AI 추정</span></SectionTitle>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
            <span style={{fontSize:"32px"}}>{data.trend==="상승"?"📈":data.trend==="하락"?"📉":"➡️"}</span>
            <div>
              <div style={{color:data.trend==="상승"?"#3fb950":data.trend==="하락"?"#ff7b72":"#8b949e",fontSize:"16px",fontWeight:700}}>
                {data.trend==="상승"?"상승세":data.trend==="하락"?"하락세":"유지세"}
              </div>
              <div style={{color:"#8b949e",fontSize:"12px",marginTop:"3px",lineHeight:"1.6"}}>{data.trendReason||""}</div>
            </div>
          </div>
          {data.peakSeason&&<div style={{background:"#0d1117",borderRadius:"8px",padding:"9px 13px",border:"1px solid #ffa65733",fontSize:"12px",color:"#ffa657",lineHeight:"1.6",marginBottom:"8px"}}>
            🌟 <strong>성수기:</strong> {data.peakSeason}
          </div>}
          {data.difficultyComment&&<div style={{background:"#0d1117",borderRadius:"8px",padding:"9px 13px",border:"1px solid #1f6feb33",fontSize:"12px",color:"#8b949e",lineHeight:"1.6"}}>
            💡 {data.difficultyComment}
          </div>}
        </div>
        <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
          <SectionTitle>⚡ 경쟁 강도 <span style={{color:"#484f58",fontWeight:400,fontSize:"11px"}}>· AI 추정</span></SectionTitle>
          <div style={{position:"relative",marginBottom:"8px"}}>
            <div style={{height:"10px",background:"linear-gradient(90deg,#3fb950,#ffa657,#f85149)",borderRadius:"5px"}}/>
            <div style={{position:"absolute",top:"-4px",left:`calc(${data.competitionScore||50}% - 9px)`,width:"18px",height:"18px",background:"#fff",borderRadius:"50%",border:`3px solid ${compColor}`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"#484f58",marginBottom:"12px"}}><span>낮음</span><span>높음</span></div>
          <div style={{textAlign:"center"}}>
            <div style={{color:compColor,fontSize:"20px",fontWeight:700}}>{compIdx||data.competitionLevel}</div>
            <div style={{color:"#8b949e",fontSize:"11px",marginTop:"4px"}}>경쟁도 {data.competitionScore}/100</div>
          </div>
          <div style={{marginTop:"10px",fontSize:"11px",color:"#8b949e",background:"#0d1117",borderRadius:"6px",padding:"8px",lineHeight:"1.5"}}>
            {(data.competitionScore||50)<30?"✅ 신규 블로거도 가능":(data.competitionScore||50)<60?"🟡 중급 이상 적합":"⚠️ 고경쟁, 차별화 필요"}
          </div>
        </div>
      </div>



      {/* ── 연관 키워드 + 실제 검색량 ── */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
        <SectionTitle>🔗 연관 키워드 <span style={{color:"#484f58",fontWeight:400,fontSize:"11px"}}>· 네이버 실제 검색량</span></SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"6px"}}>
          {data.relatedKeywords?.map((kw)=>{
            const relStats = data._relatedStats;
            const rpc  = getRelStat(kw,"monthlyPcQcCnt",relStats);
            const rmob = getRelStat(kw,"monthlyMobileQcCnt",relStats);
            const rtotal = (rpc!==null&&rmob!==null) ? rpc+rmob : null;
            const rcomp = getRelStat(kw,"compIdx",relStats);
            const rcc = COMPETITION_COLOR[rcomp]||"#8b949e";
            return(
              <div key={kw} onClick={()=>setInputVal(kw)}
                style={{display:"flex",alignItems:"center",gap:"8px",background:"#0d1117",borderRadius:"8px",
                  padding:"9px 12px",border:"1px solid #21262d",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#1f6feb44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#21262d"}>
                <span style={{flex:1,color:"#c9d1d9",fontSize:"13px"}}>{kw}</span>
                {rtotal!==null
                  ?<span style={{color:"#58a6ff",fontSize:"11px",fontWeight:600,background:"#1f6feb22",borderRadius:"4px",padding:"2px 6px",whiteSpace:"nowrap"}}>{fmtNum(rtotal)}회</span>
                  :<span style={{color:"#484f58",fontSize:"11px"}}>-</span>}
                {rcomp&&<span style={{color:rcc,fontSize:"11px",fontWeight:600,background:rcc+"22",borderRadius:"4px",padding:"2px 6px"}}>{rcomp}</span>}
              </div>
            );
          })}
        </div>
        <div style={{marginTop:"8px",fontSize:"11px",color:"#484f58"}}>💡 클릭 시 해당 키워드로 재분석</div>
      </div>

      {/* ── 롱테일 키워드 ── */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
        <SectionTitle>🎯 롱테일 키워드 <span style={{color:"#484f58",fontWeight:400,fontSize:"11px"}}>· 클릭하면 글 작성 탭으로 이동</span></SectionTitle>
        <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
          {data.longtailKeywords?.map((kw,i)=>(
            <div key={kw} style={{display:"flex",alignItems:"center",gap:"10px",background:"#0d1117",borderRadius:"8px",padding:"9px 14px",border:"1px solid #21262d",
              cursor:"pointer",transition:"border .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#1f6feb44"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#21262d"}>
              <span style={{color:"#484f58",fontSize:"12px",minWidth:"20px"}}>{i+1}</span>
              <span style={{flex:1,color:"#c9d1d9",fontSize:"13px",lineHeight:"1.5"}}>{kw}</span>
              <button onClick={()=>goWrite&&goWrite(kw)}
                style={{background:"linear-gradient(135deg,#1f6feb,#388bfd)",border:"none",color:"#fff",
                  borderRadius:"6px",padding:"5px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer",
                  fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap",flexShrink:0}}>
                ✍️ 글쓰기
              </button>
            </div>
          ))}
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

  // ── 방법1: RSS 직접 fetch (네이버 RSS는 CORS 허용) ──
  const fetchByBlogId=async()=>{
    const id=blogId.trim();
    if(!id){alert("블로그 아이디를 입력해주세요.");return;}
    setLoadingFeed(true);setFeedError("");setPosts(null);setAnalysis({});setExpanded(null);
    try{
      const rssUrl=`https://rss.blog.naver.com/${id}`;
      const ctrl=new AbortController();
      const tid=setTimeout(()=>ctrl.abort(),12000);
      const res=await fetch(rssUrl,{signal:ctrl.signal});
      clearTimeout(tid);
      if(!res.ok) throw new Error(`RSS 응답 오류 (${res.status}). 아이디를 확인해주세요.`);
      const xml=await res.text();
      if(!xml.includes("<item")) throw new Error("게시글을 찾을 수 없어요. 블로그 아이디를 다시 확인해주세요.");
      const doc=new DOMParser().parseFromString(xml,"text/xml");
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
    }catch(e){
      if(e.name==="AbortError") setFeedError("요청 시간 초과. 다시 시도해주세요.");
      else setFeedError(e.message||"오류가 발생했습니다.");
    }
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
  const getNaverRank=async(kw,postNo)=>{
    // 외부 프록시 크롤링은 불안정하므로 null 반환 (직접 확인 링크 제공)
    return null;
  };

  // ── AI 분석 ──
  const runAnalyze=async(post,idx)=>{
    if(analysis[post.postNo])return;
    setAnalyzing(idx);
    try{
      const body=post.bodyText||post.description||"";
      const prompt=`아래 네이버 블로그 포스트를 분석해줘. 반드시 순수 JSON만 출력. 마크다운 없이.

제목: ${post.title}
본문: ${body.slice(0,1500)||"(없음)"}
URL: ${post.link||"없음"}

{
  "keywords":["이 글 실제 내용 기반 키워드1","키워드2","키워드3"],
  "missingRisk":"낮음|보통|높음|매우높음",
  "missingStatus":"정상노출|누락의심|누락가능성높음|누락",
  "missingReasons":["위험요인1","위험요인2"],
  "seoScore":0~100,
  "shortAdvice":"한 줄 개선 조언"
}

주의사항:
- keywords는 반드시 제목/본문 실제 내용에서 추출. 무관한 키워드 절대 금지
- missingRisk/missingStatus는 제목 길이, 본문 품질, 키워드 적절성 종합 판단`;

      const raw=await callClaude([{role:"user",content:prompt}],"Korean blog SEO expert. Analyze ONLY based on the given title and content. Output ONLY valid JSON.",1000);
      const s=raw.indexOf("{"),e=raw.lastIndexOf("}");
      const ai=JSON.parse(raw.slice(s,e+1));

      const kws=ai.keywords||[];
      const kwData=kws.map((kw,i)=>({rank:i+1,keyword:kw,realRank:null}));
      setAnalysis(prev=>({...prev,[post.postNo]:{...ai,topKeywords:kwData}}));
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
  const SC={"정상노출":"#3fb950","누락의심":"#ffa657","누락가능성높음":"#ff7b72","누락":"#f85149"};
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
                <span style={{background:RB[risk]||"#21262d",color:RC[risk]||"#8b949e",border:`1px solid ${RC[risk]||"#30363d"}44`,borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700}}>
                  {risk==="낮음"?"✅":risk==="보통"?"⚠️":"🚨"} 누락위험 {risk}
                </span>
                {a.missingStatus&&<span style={{background:(SC[a.missingStatus]||"#21262d")+"22",color:SC[a.missingStatus]||"#8b949e",border:`1px solid ${SC[a.missingStatus]||"#30363d"}44`,borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700}}>{a.missingStatus}</span>}
                <span style={{background:"#21262d",color:a.seoScore>=70?"#3fb950":a.seoScore>=40?"#ffa657":"#ff7b72",border:"1px solid #30363d",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700}}>SEO {a.seoScore}</span>
                {a.topKeywords?.[0]&&<span style={{background:"#1f6feb22",color:"#58a6ff",border:"1px solid #1f6feb44",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:700}}>
                  🔑 {a.topKeywords[0].keyword} {a.topKeywords[0].realRank!==null?`${a.topKeywords[0].realRank}위`:"30위↓"}
                </span>}
              </div>}
              {/* 분석 중 */}
              {isAn&&<div style={{display:"flex",flexDirection:"column",gap:"3px",marginTop:"4px"}}>
                {["🤖 AI 키워드 분석 중...","📊 블로그탭 실제 순위 조회 중..."].map((msg,i)=>(
                  <div key={i} style={{color:"#8b949e",fontSize:"11px",animation:`pulse 1.6s ease ${i*0.4}s infinite`}}>{msg}</div>
                ))}
              </div>}
              {a&&!a.error&&!isEx&&a.shortAdvice&&<div style={{color:"#8b949e",fontSize:"12px",lineHeight:"1.5",marginTop:"3px"}}>{a.shortAdvice}</div>}
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
            {/* 상위노출 키워드 + 실제 순위 */}
            {a.topKeywords?.length>0&&<div>
              <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"8px"}}>
                🏆 상위 노출 키워드 <span style={{color:"#484f58",fontWeight:400}}>· 네이버 블로그탭 실제 순위</span>
              </div>
              {a.topKeywords.map((kw,i)=>{
                const rc=rankColor(kw.realRank);
                const isOut=kw.realRank===null;
                return <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",
                  background:"#161b22",border:`1px solid ${isOut?"#21262d":rc+"44"}`,borderRadius:"9px",marginBottom:"6px"}}>
                  <div style={{width:"24px",height:"24px",background:"#21262d",border:"1px solid #30363d",borderRadius:"6px",
                    display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{color:"#8b949e",fontSize:"11px",fontWeight:700}}>{kw.rank}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <a href={`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(kw.keyword)}`}
                      target="_blank" rel="noreferrer"
                      style={{color:"#e6edf3",fontSize:"13px",fontWeight:700,textDecoration:"none",display:"block",marginBottom:"2px"}}
                      onMouseEnter={e=>e.target.style.color="#58a6ff"} onMouseLeave={e=>e.target.style.color="#e6edf3"}>
                      {kw.keyword} ↗
                    </a>
                  </div>
                  <div style={{background:isOut?"#21262d":rc+"22",color:isOut?"#484f58":rc,
                    border:`1px solid ${isOut?"#30363d":rc+"55"}`,borderRadius:"8px",
                    padding:"5px 12px",fontSize:"15px",fontWeight:800,minWidth:"52px",textAlign:"center",flexShrink:0}}>
                    {isOut?"30위↓":`${kw.realRank}위`}
                  </div>
                </div>;
              })}
              <div style={{fontSize:"11px",color:"#484f58",marginTop:"2px"}}>🔍 네이버 블로그탭 크롤링 기준 (상위 30위)</div>
            </div>}

            {/* 누락 위험요인 */}
            {a.missingReasons?.length>0&&<div>
              <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"6px"}}>⚠️ 누락 위험 요인</div>
              {a.missingReasons.map((r,i)=><div key={i} style={{color:"#c9d1d9",fontSize:"12px",lineHeight:"1.7",display:"flex",gap:"6px"}}>
                <span style={{color:"#ffa657",flexShrink:0}}>•</span>{r}
              </div>)}
            </div>}

            {a.shortAdvice&&<div style={{background:"#1a2332",border:"1px solid #1f6feb44",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",color:"#8b949e"}}>
              💡 {a.shortAdvice}
            </div>}

            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {[
                ["블로그탭 검색",`https://search.naver.com/search.naver?where=post&query=${encodeURIComponent(a.topKeywords?.[0]?.keyword||post.title)}`],
                ["통합검색",`https://search.naver.com/search.naver?query=${encodeURIComponent(a.topKeywords?.[0]?.keyword||post.title)}`],
                post.link?["포스트 보기",post.link]:null,
                ["서치어드바이저","https://searchadvisor.naver.com/"],
              ].filter(Boolean).map(([l,u])=>(
                <a key={l} href={u} target="_blank" rel="noreferrer"
                  style={{padding:"5px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"6px",fontSize:"11px",textDecoration:"none"}}
                  onMouseEnter={e=>{e.target.style.background="#1f6feb22";e.target.style.color="#58a6ff";e.target.style.borderColor="#1f6feb44";}}
                  onMouseLeave={e=>{e.target.style.background="#21262d";e.target.style.color="#8b949e";e.target.style.borderColor="#30363d";}}>
                  {l} ↗
                </a>
              ))}
            </div>
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

      <div style={{background:"#161b22",border:"1px solid #21262d",borderRadius:"8px",padding:"9px 13px",fontSize:"11px",color:"#484f58",lineHeight:"1.6"}}>
        ℹ️ 순위는 네이버 블로그탭 크롤링 기준이며 실시간과 차이가 있을 수 있습니다. 정확한 확인은 <a href="https://searchadvisor.naver.com/" target="_blank" rel="noreferrer" style={{color:"#58a6ff"}}>서치어드바이저</a>를 이용하세요.
      </div>
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

function EmojiTab(){
  const [activeCat,setActiveCat]=useState("face");
  const [search,setSearch]=useState("");
  const [copied,setCopied]=useState("");
  const [copiedList,setCopiedList]=useState([]);

  const copyEmoji=(emoji)=>{
    navigator.clipboard.writeText(emoji);
    setCopied(emoji);
    setCopiedList(prev=>[emoji,...prev.filter(e=>e!==emoji)].slice(0,20));
    setTimeout(()=>setCopied(""),1200);
  };

  const allEmojis=EMOJI_CATEGORIES.flatMap(c=>c.emojis.split(" ").filter(Boolean).map(e=>({emoji:e,cat:c.id})));

  const displayEmojis=search.trim()
    ? allEmojis.filter(({emoji})=>emoji.includes(search.trim()))
    : (EMOJI_CATEGORIES.find(c=>c.id===activeCat)?.emojis.split(" ").filter(Boolean)||[]).map(emoji=>({emoji,cat:activeCat}));

  const EmojiBtn=({emoji})=>(
    <button onClick={()=>copyEmoji(emoji)} title="클릭하여 복사"
      style={{width:"44px",height:"44px",fontSize:"24px",lineHeight:"44px",textAlign:"center",
        background:copied===emoji?"#1f6feb22":"none",
        border:`1px solid ${copied===emoji?"#58a6ff":"transparent"}`,
        borderRadius:"8px",cursor:"pointer",padding:0,transition:"background .1s",flexShrink:0}}
      onMouseEnter={e=>{e.currentTarget.style.background="#21262d";e.currentTarget.style.borderColor="#30363d";}}
      onMouseLeave={e=>{e.currentTarget.style.background=copied===emoji?"#1f6feb22":"none";e.currentTarget.style.borderColor=copied===emoji?"#58a6ff":"transparent";}}
    >{emoji}</button>
  );

  return <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
    {/* 검색 */}
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",fontSize:"16px",pointerEvents:"none"}}>🔍</span>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="이모지 검색 (예: 😀 를 직접 붙여넣기도 가능)"
        style={{width:"100%",boxSizing:"border-box",padding:"12px 16px 12px 42px",background:"#0d1117",
          border:"1px solid #30363d",borderRadius:"10px",color:"#e6edf3",
          fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",outline:"none"}}
        onFocus={e=>e.target.style.borderColor="#58a6ff"}
        onBlur={e=>e.target.style.borderColor="#30363d"}/>
      {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#8b949e",cursor:"pointer",fontSize:"20px",lineHeight:1}}>×</button>}
    </div>

    {/* 카테고리 탭 */}
    {!search&&<div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
      {EMOJI_CATEGORIES.map(cat=>(
        <button key={cat.id} onClick={()=>setActiveCat(cat.id)} style={{
          padding:"7px 12px",borderRadius:"20px",border:`1px solid ${activeCat===cat.id?"#58a6ff":"#30363d"}`,
          background:activeCat===cat.id?"#1f6feb22":"#21262d",
          color:activeCat===cat.id?"#58a6ff":"#8b949e",
          cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"
        }}>{cat.label}</button>
      ))}
    </div>}

    {/* 복사 알림 */}
    {copied&&<div style={{background:"#0d2019",border:"1px solid #2ea043",borderRadius:"8px",padding:"10px 16px",color:"#3fb950",fontSize:"18px",textAlign:"center",fontWeight:600}}>
      {copied} <span style={{fontSize:"13px"}}>복사됨!</span>
    </div>}

    {/* 최근 복사 */}
    {copiedList.length>0&&!search&&<div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"12px 16px"}}>
      <div style={{color:"#8b949e",fontSize:"11px",fontWeight:700,marginBottom:"8px"}}>🕐 최근 복사</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
        {copiedList.map((emoji,i)=><EmojiBtn key={i} emoji={emoji}/>)}
      </div>
    </div>}

    {/* 이모지 그리드 */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"16px"}}>
      {search&&<div style={{color:"#8b949e",fontSize:"12px",marginBottom:"10px"}}>검색 결과 {displayEmojis.length}개</div>}
      {displayEmojis.length===0
        ?<div style={{color:"#484f58",fontSize:"14px",textAlign:"center",padding:"30px"}}>검색 결과가 없습니다.</div>
        :<div style={{display:"flex",flexWrap:"wrap",gap:"3px"}}>
          {displayEmojis.map(({emoji},i)=><EmojiBtn key={i} emoji={emoji}/>)}
        </div>
      }
    </div>

    {/* 사용 팁 */}
    <div style={{background:"#1a2332",border:"1px solid #1f6feb44",borderRadius:"10px",padding:"12px 16px",fontSize:"12px",color:"#8b949e",lineHeight:"1.7"}}>
      💡 이모지 클릭 시 클립보드에 자동 복사됩니다.<br/>
      <strong style={{color:"#c9d1d9"}}>Windows:</strong> Win + . &emsp;
      <strong style={{color:"#c9d1d9"}}>Mac:</strong> Ctrl + Cmd + Space &emsp;
      <strong style={{color:"#c9d1d9"}}>모바일:</strong> 이모지 키보드로 전환
    </div>
  </div>;
}


// ─── TAB: 글 작성 ────────────────────────────────────────────────────────
function WriteTab({pendingWriteKw="",setPendingWriteKw,setActive}){
  const [kw1,setKw1]=useState("");
  const [kw2,setKw2]=useState("");
  const [goal,setGoal]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [activeVer,setActiveVer]=useState(0);
  const [copied,setCopied]=useState(-1);
  useEffect(()=>{
    if(pendingWriteKw){
      setKw1(pendingWriteKw);
      if(setPendingWriteKw) setPendingWriteKw("");
    }
  },[pendingWriteKw]);

  const generate=async()=>{
    if(!kw1.trim()||!goal.trim()) return;
    setLoading(true); setResult(null);
    const mainKw=kw2.trim()?`"${kw1.trim()}"과 "${kw2.trim()}"`:`"${kw1.trim()}"`;
    const prompt=`다음 조건으로 블로그 글 3가지 버전을 작성해줘.

1. ${mainKw}을 메인 키워드로 글을 작성 할거야.
2. 난 ${mainKw} 키워드에 가장 적합한 분야의 전문 블로거야. 해당 분야의 전문성을 살려서 글의 톤을 사실성, 일관성을 바탕으로 공감성을 높여서 작성해. 글의 톤은 10번의 내용을 참고해.
3. 블로그 글의 주요 목표는 ${goal.trim()}에 대한 정보를 전달하는 것.
4. Temperature 0.7, Top P 0.4 기준으로 글을 써줘.
5. 각 버전은 1800~2200자로 작성해줘.
6. 5번까지 조건으로 나온 글을 블로그 SEO에 맞춰 내용을 확장 후, 7번부터 진행해.
7. 메인 키워드는 최대 19회까지 중복 사용 가능해. 다른 단어는 메인키워드 보다 많이 중복되면 안되.
8. 모든 형태소(키워드)는 메인 키워드와 서브 키워드 보다 많이 사용하면 안되.
9. 글은 3가지 버전으로 작성해.
10. 3개의 글은 모두 다른 사람이 쓴 것처럼 글 문단의 순서와 관점 등을 모두 바꿔서 작성 해야만해. 버전2, 버전3은 친근한 말투로 작성하고 싶어.
     버전1) 니다- 체를 사용해서 100% 정보(객관성)에 기반해서 작성해. 각 문단마다 소제목을 붙여 문단을 정확하게 나눠서 작성하고 문단은 총 5~6개로 작성해.
     버전2) 주관적 20% + 정보성(객관성) 80% 정도를 섞어서 작성해. -니다 체와 -요 체 등의 다양한 어휘를 적절하게 섞고, 문단을 나누지는 않지만 4개정도로 나뉠 수 있도록 글을 쓰고 싶어.
     버전3) 감정과 경험을 기반으로 정보성 60% + 주관적인 생각 40% 정도로 작성해. -요 체 위주로만 사용해.
11. 버전2와 버전3은 문단의 소주제를 정하진 않지만, 4~5개정도의 문단을 나눠서 작성해줘.
12. 각 버전 별로 본문 내용과 일치율이 높고 검색도가 좋은 제목을 한개씩 추천해줘. 제목에는 메인 키워드를 반드시 써야하고, 간결한 제목이 좋아.

응답 형식: 아래 JSON 형식으로만 답해줘. 마크다운 코드블록 없이 순수 JSON만.
{
  "versions": [
    {"title":"버전1 추천 제목","label":"버전1 · 객관적 (니다체)","content":"버전1 본문 전체"},
    {"title":"버전2 추천 제목","label":"버전2 · 혼합 (니다+요체)","content":"버전2 본문 전체"},
    {"title":"버전3 추천 제목","label":"버전3 · 감성 (요체)","content":"버전3 본문 전체"}
  ]
}`;

    try{
      const raw=await callClaude([{role:"user",content:prompt}],
        "You are a professional Korean blogger and SEO expert who adapts your expertise to match any topic or keyword. Output ONLY valid JSON with no markdown fences.", 8000);
      // JSON 추출: 첫 { 부터 마지막 } 까지만 자름
      const start=raw.indexOf("{");
      const end=raw.lastIndexOf("}");
      const cleaned=start!==-1&&end!==-1?raw.slice(start,end+1):raw;
      const parsed=JSON.parse(cleaned);
      setResult(parsed); setActiveVer(0);
      // 글 생성 완료 후 3초 뒤 분석 탭으로 자동 이동
      // setTimeout(()=>setActive&&setActive("analyze"),3000);
    }catch(e){
      setResult({error:"글 생성 중 오류가 발생했습니다. 다시 시도해주세요."});
    }
    setLoading(false);
  };

  const doCopy=(idx)=>{
    const ver=result?.versions?.[idx];
    if(!ver) return;
    navigator.clipboard.writeText(ver.title+"\n\n"+ver.content);
    setCopied(idx); setTimeout(()=>setCopied(-1),1600);
  };

  const VC=["#58a6ff","#3fb950","#ffa657"];
  const VI=["📋","🔀","💬"];
  const VDESC=["100% 객관적 정보 · 소제목 있음 · 니다체","정보 80% + 주관 20% · 니다/요체 혼합","감성+경험 · 정보 60% + 주관 40% · 요체"];

  return <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
    {/* 입력 패널 */}
    <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"12px",padding:"20px",display:"flex",flexDirection:"column",gap:"14px"}}>
      <SectionTitle>📝 글 작성 조건 입력</SectionTitle>

      {/* 키워드 2개 나란히 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px"}}>
            <span style={{color:"#e6edf3",fontSize:"13px",fontWeight:600}}>메인 키워드 1</span>
            <span style={{background:"#da363322",color:"#ff7b72",border:"1px solid #da363355",borderRadius:"4px",padding:"1px 7px",fontSize:"11px",fontWeight:700}}>필수</span>
          </div>
          <input value={kw1} onChange={e=>setKw1(e.target.value)}
            placeholder="예: 올레TV"
            style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",background:"#0d1117",
              border:`1px solid ${kw1.trim()?"#58a6ff":"#30363d"}`,borderRadius:"8px",color:"#e6edf3",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#58a6ff"}
            onBlur={e=>e.target.style.borderColor=kw1.trim()?"#58a6ff":"#30363d"}/>
        </div>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px"}}>
            <span style={{color:"#e6edf3",fontSize:"13px",fontWeight:600}}>메인 키워드 2</span>
            <span style={{background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"4px",padding:"1px 7px",fontSize:"11px",fontWeight:700}}>선택</span>
          </div>
          <input value={kw2} onChange={e=>setKw2(e.target.value)}
            placeholder="예: 아이들나라 (없으면 비워두세요)"
            style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",background:"#0d1117",
              border:"1px solid #30363d",borderRadius:"8px",color:"#e6edf3",
              fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#58a6ff"}
            onBlur={e=>e.target.style.borderColor="#30363d"}/>
        </div>
      </div>

      {/* 글의 주요 목표 */}
      <div>
        <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px"}}>
          <span style={{color:"#e6edf3",fontSize:"13px",fontWeight:600}}>글의 주요 목표</span>
          <span style={{background:"#da363322",color:"#ff7b72",border:"1px solid #da363355",borderRadius:"4px",padding:"1px 7px",fontSize:"11px",fontWeight:700}}>필수</span>
        </div>
        <input value={goal} onChange={e=>setGoal(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&generate()}
          placeholder="예: 유플러스 아이들나라 vs 올레TV 중 아이 있는 집은 어디가 나을까?"
          style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",background:"#0d1117",
            border:`1px solid ${goal.trim()?"#58a6ff":"#30363d"}`,borderRadius:"8px",color:"#e6edf3",
            fontFamily:"'Noto Sans KR',sans-serif",fontSize:"14px",outline:"none"}}
          onFocus={e=>e.target.style.borderColor="#58a6ff"}
          onBlur={e=>e.target.style.borderColor=goal.trim()?"#58a6ff":"#30363d"}/>
      </div>

      {/* 조건 미리보기 뱃지 */}
      {kw1.trim()&&<div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
        {[
          ["키워드",kw2.trim()?`${kw1.trim()} + ${kw2.trim()}`:kw1.trim(),"#58a6ff"],
          ["분량","2800~3500자","#3fb950"],
          ["버전","3가지 (객관·혼합·감성)","#ffa657"],
          ["키워드 최대","19회","#d2a8ff"],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:c+"15",border:`1px solid ${c}44`,borderRadius:"20px",padding:"4px 12px",fontSize:"12px"}}>
            <span style={{color:"#8b949e"}}>{l}: </span><span style={{color:c,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>}

      <div style={{background:"#1a2332",border:"1px solid #1f6feb44",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",color:"#8b949e",lineHeight:"1.7"}}>
        💡 키워드 1 + 주요 목표 입력 후 버튼 클릭 → <strong style={{color:"#c9d1d9"}}>3가지 스타일의 SEO 블로그 글</strong>이 자동 생성됩니다.<br/>
        ⏱️ 글 3개 생성에 <strong style={{color:"#ffa657"}}>약 40초~1분</strong> 소요됩니다.
      </div>

      <Btn onClick={generate} loading={loading} disabled={!kw1.trim()||!goal.trim()}>
        ✍️ 블로그 글 자동 생성 (3가지 버전)
      </Btn>
    </div>

    {/* 로딩 */}
    {loading&&<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
      {[
        "키워드 분석 및 SEO 전략 수립 중...",
        "버전1 · 객관적 (니다체) 작성 중...",
        "버전2 · 혼합체 작성 중...",
        "버전3 · 감성 (요체) 작성 중...",
        "키워드 빈도 최적화 및 제목 생성 중...",
      ].map((msg,i)=>(
        <div key={i} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",
          padding:"12px 16px",color:"#8b949e",fontSize:"13px",
          animation:`pulse 1.8s ease ${i*0.35}s infinite`,display:"flex",alignItems:"center",gap:"10px"}}>
          <span>⏳</span><span>{msg}</span>
        </div>
      ))}
    </div>}

    {/* 오류 */}
    {result?.error&&<div style={{background:"#2d1117",border:"1px solid #da3633",borderRadius:"10px",padding:"14px 16px",color:"#ff7b72",fontSize:"14px"}}>{result.error}</div>}

    {/* 결과 */}
    {result?.versions&&!loading&&(<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

      {/* 버전 선택 탭 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
        {result.versions.map((ver,i)=>(
          <button key={i} onClick={()=>setActiveVer(i)} style={{
            padding:"14px 10px",borderRadius:"10px",border:`2px solid ${activeVer===i?VC[i]:"#30363d"}`,
            background:activeVer===i?VC[i]+"18":"#161b22",cursor:"pointer",
            fontFamily:"'Noto Sans KR',sans-serif",textAlign:"center",transition:"all .15s",
          }}>
            <div style={{fontSize:"20px",marginBottom:"5px"}}>{VI[i]}</div>
            <div style={{color:activeVer===i?VC[i]:"#c9d1d9",fontSize:"12px",fontWeight:700,marginBottom:"3px"}}>{ver.label}</div>
            <div style={{color:"#484f58",fontSize:"10px",lineHeight:"1.4"}}>{VDESC[i]}</div>
          </button>
        ))}
      </div>

      {/* 선택된 버전 본문 */}
      {result.versions.map((ver,i)=>activeVer===i&&(
        <div key={i} style={{background:"#161b22",border:`1px solid ${VC[i]}55`,borderRadius:"12px",overflow:"hidden"}}>
          {/* 제목 헤더 */}
          <div style={{background:VC[i]+"11",borderBottom:`1px solid ${VC[i]}33`,padding:"14px 18px"}}>
            <div style={{color:"#8b949e",fontSize:"11px",marginBottom:"5px",fontWeight:600}}>✏️ 추천 제목</div>
            <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
              <div style={{color:VC[i],fontSize:"16px",fontWeight:700,lineHeight:"1.4",flex:1}}>{ver.title}</div>
              <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                <button onClick={()=>navigator.clipboard.writeText(ver.title)}
                  style={{padding:"6px 12px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>제목만 복사</button>
                <button onClick={()=>doCopy(i)}
                  style={{padding:"6px 14px",background:VC[i],color:"#fff",border:"none",borderRadius:"6px",cursor:"pointer",fontSize:"11px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif",whiteSpace:"nowrap"}}>
                  {copied===i?"✅ 복사됨!":"📋 전체 복사"}
                </button>
              </div>
            </div>
          </div>

          {/* 본문 */}
          <div style={{padding:"18px 20px",position:"relative"}}>
            <div style={{position:"absolute",top:"12px",right:"16px",color:"#484f58",fontSize:"11px",background:"#0d1117",padding:"2px 8px",borderRadius:"4px",border:"1px solid #21262d"}}>
              {ver.content?.length?.toLocaleString()}자
            </div>
            <div style={{color:"#c9d1d9",fontSize:"14px",lineHeight:"2.1",whiteSpace:"pre-wrap",
              maxHeight:"560px",overflowY:"auto",paddingRight:"6px",wordBreak:"break-word",marginTop:"8px"}}>
              {ver.content}
            </div>
          </div>

          {/* 하단 액션 */}
          <div style={{borderTop:`1px solid ${VC[i]}22`,padding:"12px 18px",display:"flex",gap:"8px",background:"#0d111788",alignItems:"center"}}>
            <span style={{color:"#484f58",fontSize:"11px",flex:1}}>※ 복사 후 네이버 블로그에 붙여넣기 하세요</span>
            <button onClick={()=>{
              const blob=new Blob([ver.title+"\n\n"+ver.content],{type:"text/plain"});
              const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
              a.download=`블로그_${ver.label.replace(/ /g,"_")}.txt`; a.click();
            }} style={{padding:"7px 14px",background:"#21262d",color:"#8b949e",border:"1px solid #30363d",borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontFamily:"'Noto Sans KR',sans-serif"}}>
              ⬇️ TXT 다운로드
            </button>
            <button onClick={()=>doCopy(i)}
              style={{padding:"7px 16px",background:copied===i?"#2ea043":VC[i],color:"#fff",border:"none",borderRadius:"7px",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'Noto Sans KR',sans-serif",transition:"background .2s"}}>
              {copied===i?"✅ 복사됨!":"📋 제목+본문 복사"}
            </button>
          </div>
        </div>
      ))}

      {/* 3버전 목록 */}
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:"10px",padding:"14px 16px"}}>
        <SectionTitle>📊 3가지 버전 한눈에 보기</SectionTitle>
        <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
          {result.versions.map((ver,i)=>(
            <div key={i} onClick={()=>setActiveVer(i)}
              style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",background:"#0d1117",
                borderRadius:"8px",border:`1px solid ${activeVer===i?VC[i]+"66":"#21262d"}`,cursor:"pointer",transition:"border .15s"}}>
              <span style={{fontSize:"18px"}}>{VI[i]}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:VC[i],fontSize:"12px",fontWeight:700}}>{ver.label}</div>
                <div style={{color:"#8b949e",fontSize:"12px",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ver.title}</div>
              </div>
              <span style={{color:"#484f58",fontSize:"11px",flexShrink:0}}>{ver.content?.length?.toLocaleString()}자</span>
              <button onClick={e=>{e.stopPropagation();doCopy(i);}}
                style={{padding:"4px 10px",background:VC[i]+"18",color:VC[i],border:`1px solid ${VC[i]}44`,borderRadius:"5px",cursor:"pointer",fontSize:"11px",fontFamily:"'Noto Sans KR',sans-serif",flexShrink:0}}>
                {copied===i?"✅":"복사"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>)}
  </div>;
}

const TOOL_MAP={keyword:KeywordTab,write:WriteTab,analyze:AnalyzeTab,ocr:OcrTab,convert:ConvertTab,emoji:EmojiTab,missing:MissingTab};

export default function BlogTools(){
  const [active,setActive]=useState("keyword");
  const [pendingWriteKw,setPendingWriteKw]=useState("");
  const goWrite=(kw)=>{setPendingWriteKw(kw);setActive("write");};
  const ActiveTool=TOOL_MAP[active];
  const tab=TABS.find(t=>t.id===active);
  return <div style={{minHeight:"100vh",background:"#010409",fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",color:"#e6edf3"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap');
      *{box-sizing:border-box}
      ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#0d1117} ::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}
      textarea::placeholder,input::placeholder{color:#484f58!important}
      input[type=range]{height:6px}
    `}</style>
    <div style={{borderBottom:"1px solid #21262d",padding:"16px 24px",background:"#0d1117",display:"flex",alignItems:"center",gap:"12px"}}>
      <div style={{width:"34px",height:"34px",background:"linear-gradient(135deg,#1f6feb,#58a6ff)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px"}}>✍️</div>
      <div>
        <div style={{fontSize:"16px",fontWeight:700,color:"#fff"}}>블로그 올인원 도구</div>
        <div style={{color:"#8b949e",fontSize:"11px"}}>7가지 블로그 도구 통합</div>
      </div>
    </div>
    <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid #21262d",background:"#0d1117",padding:"0 10px",gap:"2px"}}>
      {TABS.map(t=><button key={t.id} onClick={()=>setActive(t.id)} style={{
        padding:"11px 16px",border:"none",background:"none",
        borderBottom:`2px solid ${active===t.id?"#1f6feb":"transparent"}`,
        color:active===t.id?"#58a6ff":"#8b949e",cursor:"pointer",whiteSpace:"nowrap",
        fontFamily:"'Noto Sans KR',sans-serif",fontSize:"13px",fontWeight:600,
      }}>{t.icon} {t.label}</button>)}
    </div>
    <div style={{padding:"22px 24px",maxWidth:"960px",margin:"0 auto"}}>
      <h2 style={{margin:"0 0 16px",fontSize:"15px",fontWeight:700,color:"#e6edf3"}}>{tab?.icon} {tab?.label}</h2>
      <ActiveTool goWrite={goWrite} pendingWriteKw={pendingWriteKw} setPendingWriteKw={setPendingWriteKw} setActive={setActive}/>
    </div>
  </div>;
}
