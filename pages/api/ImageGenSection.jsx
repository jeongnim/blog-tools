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
  const [lang,setLang]=useState("en");
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
- Exactly 5 sections, each covering a DIFFERENT aspect of the post
- Each scene must be visually distinct from the others (different subject, setting, angle)
- Describe the SCENE ONLY: subject, setting, composition, mood, colors. Do NOT include style keywords, camera specs, aspect ratio, or "no text" instructions — those are appended later
- 25-50 words per scene, plain descriptive English
- No real brand names, no logos, no readable text, no recognizable real people or celebrity faces
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
        "You are an expert at analyzing blog posts and writing image generation prompts. Output ONLY valid JSON.",2500,"claude-haiku-4-5-20251001");

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
