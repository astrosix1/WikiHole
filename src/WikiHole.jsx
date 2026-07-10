import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DOMPurify from 'dompurify';
import SEED_ARTICLES from './data/seeds.js';
import { generateQuizCardsLocally } from './utils/quizGenerator.js';

// Ensure window.storage is always defined (fallback for non-Claude-artifact environments)
if (!window.storage) {
  window.storage = {
    async set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} },
    async get(key) {
      try { const v = localStorage.getItem(key); return v !== null ? { value: v } : null; }
      catch (_) { return null; }
    },
    async list(prefix) {
      try { return { keys: Object.keys(localStorage).filter(k => k.startsWith(prefix)) }; }
      catch (_) { return { keys: [] }; }
    },
  };
}

const SEED_KEYS = Object.keys(SEED_ARTICLES);

// ── Category map for browsing ────────────────────────────────────────────────
const CATEGORIES = {
  "🔍 Mysteries": ["tunguska event","voynich manuscript","dyatlov pass incident","mary celeste","dancing plague of 1518","antikythera mechanism","fermi paradox","roanoke colony","cicada 3301","numbers station","black dahlia","taos hum","d. b. cooper"],
  "🦎 Cryptids": ["bigfoot","loch ness monster","chupacabra","jersey devil","flatwoods monster","dover demon","skunk ape","thunderbird","beast of gévaudan","owlman"],
  "🌊 Sea Creatures": ["kraken","megalodon","sea serpent","lusca","bunyip","oarfish","giant squid","goblin shark","barreleye","patagonian toothfish"],
  "👁 Paranormal": ["mothman","shadow people","men in black","spring heeled jack","black-eyed children","slender man"],
  "🧿 Mythology": ["kappa (folklore)","wendigo","skinwalker","el silbón","strigoi"],
};

const LOADING_MSGS = ["falling deeper…","following the thread…","chasing the rabbit…","going down the hole…"];

// ── Utils ────────────────────────────────────────────────────────────────────
async function withRetry(fn, retries=4, delay=1500) {
  for (let i=0; i<retries; i++) {
    try { return await fn(); }
    catch(e) { if(!e.message?.includes("429")||i===retries-1) throw e; await new Promise(r=>setTimeout(r,delay*(i+1))); }
  }
}
function extractJSON(text) {
  let s=text.replace(/```json\s*/gi,"").replace(/```\s*/g,"").trim();
  try{return JSON.parse(s);}catch(_){}
  const ai=s.indexOf("["),oi=s.indexOf("{");
  if(ai!==-1&&(oi===-1||ai<oi)){const e=s.lastIndexOf("]");if(e!==-1)try{return JSON.parse(s.slice(ai,e+1));}catch(_){}}
  if(oi!==-1){const e=s.lastIndexOf("}");if(e!==-1)try{return JSON.parse(s.slice(oi,e+1));}catch(_){}}
  throw new Error("Cannot parse JSON");
}
function timeAgo(ts) {
  const d=Date.now()-ts,m=60000,h=3600000,day=86400000;
  if(d<m)return"just now";if(d<h)return`${Math.floor(d/m)}m ago`;
  if(d<day)return`${Math.floor(d/h)}h ago`;if(d<day*7)return`${Math.floor(d/day)}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Security: XSS Prevention ──────────────────────────────────────────────────
function sanitizeText(text) {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// ── Storage ──────────────────────────────────────────────────────────────────
const ART="wikihole:";
async function saveArticle(t,a){try{await window.storage.set(ART+t.toLowerCase(),JSON.stringify(a));}catch(_){}}
async function loadArticle(t){try{const r=await window.storage.get(ART+t.toLowerCase());return r?JSON.parse(r.value):null;}catch(_){return null;}}
async function loadAllCachedTitles(){try{const r=await window.storage.list(ART);return(r?.keys||[]).map(k=>k.replace(ART,""));}catch(_){return[];}}
const SES="trail:session:";
async function saveSession(s){try{await window.storage.set(SES+s.id,JSON.stringify(s));}catch(_){}}
async function loadAllSessions(){
  try{const r=await window.storage.list(SES);if(!r?.keys?.length)return[];
  const items=await Promise.all(r.keys.map(async k=>{const v=await window.storage.get(k);return v?JSON.parse(v.value):null;}));
  return items.filter(Boolean).sort((a,b)=>b.updatedAt-a.updatedAt);}catch(_){return[];}
}
function makeSessionId(){return"s"+Date.now();}
const SRS_PFX="srs:card:";
function makeCardId(q){return encodeURIComponent(q.slice(0,50)).replace(/[^a-zA-Z0-9]/g,"").slice(0,24)+"_"+q.length;}
async function saveCard(c){try{await window.storage.set(SRS_PFX+c.id,JSON.stringify(c));}catch(_){}}
async function loadAllCards(){
  try{const r=await window.storage.list(SRS_PFX);if(!r?.keys?.length)return[];
  const items=await Promise.all(r.keys.map(async k=>{const v=await window.storage.get(k);return v?JSON.parse(v.value):null;}));
  return items.filter(Boolean);}catch(_){return[];}
}
function applyRating(card,rating){
  const now=Date.now();let{interval=1,streak=0,ease=2.5,totalReviews=0,correctReviews=0}=card;totalReviews++;
  if(rating==="again"){interval=1;streak=0;ease=Math.max(ease-0.2,1.3);}
  else if(rating==="hard"){interval=Math.max(Math.round(interval*1.2),interval+1);streak++;ease=Math.max(ease-0.15,1.3);correctReviews++;}
  else{interval=Math.max(Math.round(interval*ease),interval+2);streak++;ease=Math.min(ease+0.1,4);correctReviews++;}
  return{...card,interval,streak,ease,mastered:streak>=3,totalReviews,correctReviews,nextReview:now+interval*864e5,lastReviewed:now};
}
const isDue=c=>!c.nextReview||c.nextReview<=Date.now();
function nextReviewLabel(i){return i<=1?"tomorrow":i<7?`${i}d`:i<30?`${Math.round(i/7)}w`:`${Math.round(i/30)}mo`;}

// ── API ──────────────────────────────────────────────────────────────────────
async function fetchWikiArticle(topic) {
  return withRetry(async()=>{
    const encoded=encodeURIComponent(topic.replace(/ /g,'_'));
    const sumRes=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,{headers:{Accept:'application/json'}});
    if(!sumRes.ok)throw new Error(`Wikipedia ${sumRes.status}`);
    const sum=await sumRes.json();
    let links=[];
    try{
      // Wikipedia's REST "related pages" endpoint was decommissioned — use
      // the still-supported Action API's `links` module (in-article
      // wikilinks) instead, then batch-fetch short descriptions for a few
      // of them picked at random so the same article doesn't always offer
      // the same holes.
      const linksRes=await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=links&titles=${encoded}&plnamespace=0&pllimit=30`);
      if(linksRes.ok){
        const linksData=await linksRes.json();
        const page=Object.values(linksData.query?.pages||{})[0];
        const pool=(page?.links||[]).map(l=>l.title);
        const picked=[];
        while(picked.length<3&&pool.length)picked.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
        if(picked.length){
          const titlesParam=picked.map(encodeURIComponent).join('|');
          const exRes=await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&exchars=90&titles=${titlesParam}`);
          const exPages=exRes.ok?Object.values((await exRes.json()).query?.pages||{}):[];
          links=picked.map(title=>({title,description:exPages.find(p=>p.title===title)?.extract||''}));
        }
      }
    }catch(_){}
    return{title:sum.titles?.normalized||sum.title,description:sum.description||'',extract:sum.extract||'',imageUrl:sum.thumbnail?.source||null,wikiUrl:sum.content_urls?.desktop?.page||`https://en.wikipedia.org/wiki/${encoded}`,links};
  });
}
async function fetchQuizCards(articles) {
  // Try the server-side API first (requires ANTHROPIC_API_KEY set in Vercel).
  // On any failure, fall back to the local generator — no key needed.
  try {
    const res=await fetch('/api/quiz',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({articles})});
    if(res.ok){
      const d=await res.json();
      if(!d.error){
        const t=d.content?.filter(b=>b.type==='text').pop()?.text;
        if(t){const p=extractJSON(t);if(Array.isArray(p)&&p.length)return p;}
      }
    }
  } catch(_) {
    // API unreachable — fall through to local generator
  }

  // Local generation — works with no API key, no network required
  const cards=generateQuizCardsLocally(articles);
  if(!cards.length)throw new Error('Not enough article content to generate questions — try diving deeper first.');
  return cards;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({w="100%",h=14,mb=6,radius=4}){return <div style={{width:w,height:h,borderRadius:radius,background:"#ece8e2",marginBottom:mb,animation:"shimmer 1.4s ease infinite"}}/>;}
function ArticleSkeleton(){return(<div style={{marginTop:22}}><Skel w={140} h={11} mb={10}/><Skel w="80%" h={32} mb={8} radius={6}/><Skel w="55%" h={32} mb={20} radius={6}/><Skel h={14} mb={7}/><Skel h={14} mb={7}/><Skel w="90%" h={14} mb={7}/><Skel w="70%" h={14} mb={28}/><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>{[1,2,3].map(i=><Skel key={i} h={62} radius={12} mb={0}/>)}</div></div>);}

// ── App ──────────────────────────────────────────────────────────────────────
export default function WikiHole() {
  const [trail,setTrail]               = useState([]);
  const [currentIndex,setCurrentIndex] = useState(0);
  const [fetching,setFetching]         = useState(false);
  const [loading,setLoading]           = useState(true);
  const [loadingMsg,setLoadingMsg]     = useState("falling deeper…");
  const [error,setError]               = useState(null);
  const [lastFailedAction,setLastFailedAction] = useState(null); // {type:'start'|'dive'|'restore', topic|session} — powers the Retry button
  const [animKey,setAnimKey]           = useState(0);
  const [isOnline,setIsOnline]         = useState(navigator.onLine);
  const [cachedKeys,setCachedKeys]     = useState(new Set());
  const [prefetched,setPrefetched]     = useState({});
  const [imgError,setImgError]         = useState(false);
  const [sessions,setSessions]         = useState([]);
  const [currentSessionId,setCurrentSessionId] = useState(null);
  const [favoritedIds,setFavoritedIds] = useState(()=>{try{return new Set(JSON.parse(localStorage.getItem("wh_favorites")||"[]"));}catch{return new Set();}});
  const [trailSearch,setTrailSearch]   = useState("");
  const [allCards,setAllCards]         = useState([]);
  const [view,setView]                 = useState("article"); // article|trails|discover|quiz|review
  const [sessionQueue,setSessionQueue] = useState([]);
  const [sessionIndex,setSessionIndex] = useState(0);
  const [revealed,setRevealed]         = useState(false);
  const [selected,setSelected]         = useState(null);
  const [sessionCorrect,setSessionCorrect] = useState(0);
  const [sessionTotal,setSessionTotal]     = useState(0);
  const [finished,setFinished]             = useState(false);
  const [quizLoading,setQuizLoading]       = useState(false);
  const [quizError,setQuizError]           = useState(null);
  const [activeQuizSessionId,setActiveQuizSessionId] = useState(null);
  const [discoverSearch,setDiscoverSearch] = useState("");

  const memCache=useRef({});const prefetchPaused=useRef(false);const trailRef=useRef(null);

  useEffect(()=>{
    const on=()=>setIsOnline(true),off=()=>setIsOnline(false);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  useEffect(()=>{loadAllCachedTitles().then(t=>setCachedKeys(new Set(t)));}, []);
  useEffect(()=>{loadAllCards().then(setAllCards);}, []);
  useEffect(()=>{loadAllSessions().then(setSessions);}, []);

  const persistSession=useCallback(async(id,trailData,idx,quizCardIds)=>{
    if(!id)return;
    const s={id,name:trailData[0]?.title||"Untitled",trailTitles:trailData.map(a=>a.title),currentIndex:idx,quizCardIds:quizCardIds||[],startedAt:parseInt(id.slice(1)),updatedAt:Date.now()};
    await saveSession(s);setSessions(prev=>[s,...prev.filter(x=>x.id!==id)].sort((a,b)=>b.updatedAt-a.updatedAt));
  },[]);

  const getArticle=useCallback(async(topic)=>{
    const key=topic.toLowerCase();
    if(SEED_ARTICLES[key])return SEED_ARTICLES[key];
    if(memCache.current[key])return memCache.current[key];
    const stored=await loadArticle(topic);
    if(stored){memCache.current[key]=Promise.resolve(stored);return stored;}
    if(!navigator.onLine)throw new Error("offline");
    const p=fetchWikiArticle(topic).then(async a=>{await saveArticle(topic,a);setCachedKeys(prev=>new Set([...prev,key]));return a;}).catch(e=>{delete memCache.current[key];throw e;});
    memCache.current[key]=p;return p;
  },[]);

  const prefetchCount=useRef(0);
  const prefetchLinks=useCallback((article)=>{
    if(prefetchCount.current>=15)return;
    (article.links||[]).forEach(link=>{if(prefetchPaused.current)return;getArticle(link.title).then(()=>{prefetchCount.current++;setPrefetched(p=>({...p,[link.title.toLowerCase()]:true}));}).catch(()=>{});});
  },[getArticle]);

  const isFast=topic=>!!SEED_ARTICLES[topic.toLowerCase()]||cachedKeys.has(topic.toLowerCase())||!!prefetched[topic.toLowerCase()];

  const startWith=async(topic)=>{
    setError(null);setImgError(false);setView("article");
    setLoadingMsg(LOADING_MSGS[Math.floor(Math.random()*LOADING_MSGS.length)]);
    memCache.current={};setPrefetched({});const newId=makeSessionId();
    if(isFast(topic))setLoading(true);else setFetching(true);
    try{
      const a=await getArticle(topic);setTrail([a]);setCurrentIndex(0);setAnimKey(k=>k+1);
      setCurrentSessionId(newId);await persistSession(newId,[a],0,[]);prefetchLinks(a);setLastFailedAction(null);
    }catch(e){setError(e.message==="offline"?"You're offline.":`Error: ${e.message}`);setLastFailedAction({type:"start",topic});}
    finally{setLoading(false);setFetching(false);}
  };

  const diveInto=async(title)=>{
    if(!isFast(title)&&!isOnline){setError("Offline and not cached.");setLastFailedAction({type:"dive",topic:title});return;}
    setError(null);setImgError(false);setLoadingMsg(LOADING_MSGS[Math.floor(Math.random()*LOADING_MSGS.length)]);
    if(isFast(title))setLoading(true);else setFetching(true);
    try{
      const a=await getArticle(title);const newTrail=[...trail.slice(0,currentIndex+1),a];const newIdx=currentIndex+1;
      setTrail(newTrail);setCurrentIndex(newIdx);setAnimKey(k=>k+1);
      const es=sessions.find(s=>s.id===currentSessionId);
      await persistSession(currentSessionId,newTrail,newIdx,es?.quizCardIds||[]);prefetchLinks(a);setLastFailedAction(null);
      setTimeout(()=>{if(trailRef.current)trailRef.current.scrollLeft=trailRef.current.scrollWidth;window.scrollTo({top:0,behavior:"smooth"});},100);
    }catch(e){setError(`Error: ${e.message}`);setLastFailedAction({type:"dive",topic:title});}
    finally{setLoading(false);setFetching(false);}
  };

  const retryLastAction=()=>{
    if(!lastFailedAction)return;
    if(lastFailedAction.type==="start")startWith(lastFailedAction.topic);
    else if(lastFailedAction.type==="restore")restoreSession(lastFailedAction.session);
    else diveInto(lastFailedAction.topic);
  };

  const jumpTo=i=>{setCurrentIndex(i);setAnimKey(k=>k+1);setImgError(false);window.scrollTo({top:0,behavior:"smooth"});if(trail[i])prefetchLinks(trail[i]);const es=sessions.find(s=>s.id===currentSessionId);persistSession(currentSessionId,trail,i,es?.quizCardIds||[]);};
  const restoreSession=async session=>{
    setLoading(true);setError(null);setImgError(false);setView("article");setLoadingMsg("restoring your trail…");
    try{
      const arts=await Promise.all(session.trailTitles.map(t=>getArticle(t).catch(()=>null)));const valid=arts.filter(Boolean);
      if(!valid.length){
        setError(isOnline?"Couldn't restore this trail — none of its articles could be loaded.":"Couldn't restore this trail while offline — none of its articles are cached.");
        setLastFailedAction({type:"restore",session});return;
      }
      const idx=Math.min(session.currentIndex,valid.length-1);setTrail(valid);setCurrentIndex(idx);setAnimKey(k=>k+1);setCurrentSessionId(session.id);valid.forEach(a=>{memCache.current[a.title.toLowerCase()]=Promise.resolve(a);});prefetchLinks(valid[idx]);setLastFailedAction(null);
    }
    catch(e){setError(`Restore failed: ${e.message}`);setLastFailedAction({type:"restore",session});}finally{setLoading(false);}
  };

  const dueCards=allCards.filter(isDue),dueCount=dueCards.length;
  const getSessionMastery=sid=>{const c=allCards.filter(x=>x.sessionId===sid);return{total:c.length,mastered:c.filter(x=>x.mastered).length};};
  const startReview=()=>{prefetchPaused.current=true;setSessionQueue([...dueCards].sort(()=>Math.random()-0.5));setSessionIndex(0);setRevealed(false);setSelected(null);setSessionCorrect(0);setSessionTotal(0);setFinished(false);setQuizError(null);setActiveQuizSessionId(null);setView("review");};
  const startNewQuiz=async sessionId=>{
    prefetchPaused.current=true;setQuizLoading(true);setQuizError(null);setView("quiz");setActiveQuizSessionId(sessionId);
    const tgt=sessions.find(s=>s.id===sessionId);const titles=tgt?.trailTitles||trail.map(a=>a.title);
    try{
      const arts=(await Promise.all(titles.map(t=>getArticle(t).catch(()=>null)))).filter(Boolean);const rawQ=await fetchQuizCards(arts);const artMap=Object.fromEntries(arts.map(a=>[a.title,a.extract]));const newCards=[];
      for(const q of rawQ){const id=makeCardId(q.question);if(!allCards.find(c=>c.id===id)){const card={id,question:q.question,options:q.options,answer:q.answer,explanation:q.explanation,source:q.source,extract:artMap[q.source]||"",sessionId,interval:1,streak:0,ease:2.5,mastered:false,totalReviews:0,correctReviews:0,nextReview:Date.now(),createdAt:Date.now()};await saveCard(card);newCards.push(card);}}
      const updated=[...allCards,...newCards];setAllCards(updated);
      if(tgt){const us={...tgt,quizCardIds:[...(tgt.quizCardIds||[]),...newCards.map(c=>c.id)],updatedAt:Date.now()};await saveSession(us);setSessions(p=>p.map(s=>s.id===sessionId?us:s));}
      const queue=[...newCards,...allCards.filter(c=>c.sessionId===sessionId&&isDue(c))].sort(()=>Math.random()-0.5);
      if(!queue.length){setQuizError("No new questions — dive deeper first.");setQuizLoading(false);return;}
      setSessionQueue(queue);setSessionIndex(0);setRevealed(false);setSelected(null);setSessionCorrect(0);setSessionTotal(0);setFinished(false);
    }catch(e){setQuizError(`Quiz failed: ${e.message}`);}finally{setQuizLoading(false);}
  };
  const handleAnswer=letter=>{if(revealed)return;setSelected(letter);setRevealed(true);setSessionTotal(t=>t+1);if(letter===sessionQueue[sessionIndex].answer)setSessionCorrect(c=>c+1);};
  const handleRating=async rating=>{
    const card=sessionQueue[sessionIndex],updated=applyRating(card,rating);await saveCard(updated);setAllCards(p=>[...p.filter(c=>c.id!==updated.id),updated]);
    let q=sessionQueue;if(rating==="again"){q=[...sessionQueue,{...card,_retry:true}];setSessionQueue(q);}
    const ni=sessionIndex+1;if(ni>=q.length){setFinished(true);return;}setSessionIndex(ni);setRevealed(false);setSelected(null);window.scrollTo({top:0,behavior:"smooth"});
  };
  const goBack=()=>{prefetchPaused.current=false;setView("article");loadAllCards().then(setAllCards);};

  useEffect(()=>{startWith(SEED_KEYS[Math.floor(Math.random()*SEED_KEYS.length)]);}, []);

  // Left/right arrow keys step back and forth through the reading trail —
  // mirrors clicking a breadcrumb, just faster for keyboard users.
  useEffect(()=>{
    const onKey=e=>{
      if(view!=="article"||trail.length<2)return;
      const tag=document.activeElement?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA")return;
      if(e.key==="ArrowLeft"&&currentIndex>0)jumpTo(currentIndex-1);
      else if(e.key==="ArrowRight"&&currentIndex<trail.length-1)jumpTo(currentIndex+1);
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  }, [view,trail,currentIndex]);

  const current=trail[currentIndex];const depth=currentIndex;
  const isLinkOffline=t=>!!SEED_ARTICLES[t.toLowerCase()]||cachedKeys.has(t.toLowerCase())||!!prefetched[t.toLowerCase()];
  const sq=sessionQueue[sessionIndex],isCorrect=sq&&selected===sq.answer;
  const optStyle=letter=>{if(!revealed)return{bg:"#fff",border:"#e2ddd6",color:"#1c1810"};if(letter===sq.answer)return{bg:"#f0faf2",border:"#4a9a60",color:"#2a6a40"};if(letter===selected)return{bg:"#fff5f5",border:"#d05050",color:"#a03030"};return{bg:"#fafafa",border:"#ece8e2",color:"#bbb"};};
  const showSkeleton=fetching&&!current;

  // Discover filtering (memoized to avoid recomputing on every render)
  const filteredDiscover = useMemo(() => {
    const q = discoverSearch.trim().toLowerCase();
    if (!q) return null;
    return SEED_KEYS.filter(k => k.includes(q) || SEED_ARTICLES[k].title.toLowerCase().includes(q) || SEED_ARTICLES[k].description.toLowerCase().includes(q));
  }, [discoverSearch]);

  // Reading time estimate for current article
  const readingTime = useMemo(() => {
    if (!current?.extract) return null;
    const words = current.extract.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.round(words / 200));
    return `~${mins} min read`;
  }, [current?.extract]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lora:wght@400;500&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f5f2ec;}
        ::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pop{from{opacity:0;transform:scale(0.97);}to{opacity:1;transform:scale(1);}}
        @keyframes shimmer{0%,100%{opacity:0.5;}50%{opacity:1;}}
        .card-in{animation:fadeUp 0.4s ease both;}.pop-in{animation:pop 0.25s ease both;}
        .hole-btn{width:100%;background:#fff;border:1.5px solid #e2ddd6;border-radius:12px;padding:14px 16px;cursor:pointer;text-align:left;transition:all 0.18s;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);}
        .hole-btn:hover:not(:disabled){border-color:#b8832a;transform:translateX(4px);box-shadow:0 2px 8px rgba(184,131,42,0.12);}
        .hole-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .discover-btn{width:100%;background:#fff;border:1.5px solid #e2ddd6;border-radius:10px;padding:12px 14px;cursor:pointer;text-align:left;transition:all 0.15s;display:flex;align-items:center;gap:10px;box-shadow:0 1px 2px rgba(0,0,0,0.04);}
        .discover-btn:hover:not(:disabled){border-color:#b8832a;background:#fffdf8;}
        .discover-btn:disabled{opacity:0.45;cursor:not-allowed;}
        .session-card{width:100%;background:#fff;border:1.5px solid #e2ddd6;border-radius:14px;padding:18px;text-align:left;transition:all 0.2s;box-shadow:0 1px 4px rgba(0,0,0,0.04);}
        .session-card:hover{border-color:#b8832a;box-shadow:0 3px 12px rgba(184,131,42,0.1);transform:translateY(-1px);}
        .opt-btn{width:100%;border-radius:10px;padding:13px 15px;cursor:pointer;font-family:'Lora',Georgia,serif;font-size:15px;line-height:1.5;transition:all 0.15s;display:flex;align-items:flex-start;gap:10px;border-width:1.5px;border-style:solid;text-align:left;}
        .opt-btn:hover:not(:disabled){transform:translateX(3px);}.opt-btn:disabled{cursor:default;}
        .rating-btn{flex:1;padding:11px 8px;border-radius:10px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.04em;border:1.5px solid;transition:all 0.18s;text-align:center;}
        .new-btn{background:transparent;border:1.5px solid #b8832a;color:#b8832a;padding:6px 14px;border-radius:8px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.05em;transition:all 0.18s;}
        .new-btn:hover:not(:disabled){background:#b8832a;color:#fff;}.new-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .gold-btn{background:#b8832a;color:#fff;border:none;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.04em;transition:background 0.18s;display:flex;align-items:center;gap:5px;white-space:nowrap;}
        .gold-btn:hover:not(:disabled){background:#9a6e22;}.gold-btn:disabled{opacity:0.45;cursor:not-allowed;}
        .ghost-btn{background:transparent;border:1.5px solid #b8832a;color:#b8832a;padding:7px 14px;border-radius:8px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.04em;transition:all 0.18s;}
        .ghost-btn:hover:not(:disabled){background:#b8832a;color:#fff;}.ghost-btn:disabled{opacity:0.4;cursor:not-allowed;}
        .crumb{background:transparent;border:1px solid #ddd8d0;color:#999;padding:4px 12px;border-radius:20px;cursor:pointer;font-family:'DM Mono',monospace;font-size:11px;white-space:nowrap;flex-shrink:0;transition:all 0.18s;}
        .crumb:hover{border-color:#b8832a88;color:#b8832a;}.crumb.active{border-color:#b8832a;color:#b8832a;background:#b8832a14;}
        .wiki-link{display:inline-flex;align-items:center;gap:5px;font-family:'DM Mono',monospace;font-size:11px;color:#b8832a;text-decoration:none;border-bottom:1px solid #b8832a55;transition:all 0.15s;}
        .wiki-link:hover{color:#8a6020;}
        .search-input{width:100%;padding:10px 14px;border:1.5px solid #e2ddd6;border-radius:10px;font-family:'DM Mono',monospace;font-size:12px;background:#fff;color:#2c2820;outline:none;transition:border-color 0.18s;}
        .search-input:focus{border-color:#b8832a;}
        .search-input::placeholder{color:#bbb;}
      `}</style>

      <div style={{minHeight:"100vh",background:"#f5f2ec",maxWidth:660,margin:"0 auto",fontFamily:"'Lora',Georgia,serif",color:"#2c2820"}}>

        {!isOnline&&<div style={{background:"#fdf3e0",borderBottom:"1px solid #e8d8a0",padding:"8px 20px",display:"flex",alignItems:"center",gap:8}}><span>📵</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#a07820"}}>offline — {cachedKeys.size} cached</span></div>}

        {/* Header */}
        <header style={{position:"sticky",top:0,zIndex:20,background:"#f5f2ecf2",backdropFilter:"blur(12px)",borderBottom:"1px solid #e2ddd6",padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={goBack} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
              <span style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:22,color:"#b8832a"}}>wikihole</span>
            </button>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,background:"#eeeae2",border:"1px solid #e0dbd2",padding:"2px 9px",borderRadius:20,letterSpacing:"0.06em",
              color:view==="trails"||view==="discover"?"#888":view!=="article"?"#b8832a":fetching?"#b8832a":depth===0?"#ccc":"#b8832a"}}>
              {view==="trails"?"trails":view==="discover"?"discover":view==="quiz"||view==="review"?"study":fetching?"loading…":depth===0?"surface":`${depth} deep`}
            </span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:isOnline?"#4a9a60":"#cc8820"}}/>
            {(view==="article"||view==="trails"||view==="discover")&&(<>
              {dueCount>0&&<button className="gold-btn" onClick={startReview}>↩ {dueCount}</button>}
              <button className="ghost-btn" aria-label="Toggle Discover" onClick={()=>setView(v=>v==="discover"?"article":"discover")} style={{padding:"7px 10px"}}>🔭</button>
              <button className="ghost-btn" aria-label="Toggle Trails" onClick={()=>setView(v=>v==="trails"?"article":"trails")} style={{padding:"7px 10px"}}>🕳</button>
              {view==="article"&&<button className="new-btn" aria-label="Surprise me with a random article" disabled={fetching||loading||!isOnline} onClick={()=>startWith(SEED_KEYS[Math.floor(Math.random()*SEED_KEYS.length)])}>↺</button>}
            </>)}
            {(view==="quiz"||view==="review")&&<button className="new-btn" onClick={goBack}>← back</button>}
          </div>
        </header>

        {/* Breadcrumbs */}
        {view==="article"&&trail.length>1&&(
          <div ref={trailRef} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 20px",overflowX:"auto",scrollbarWidth:"none",borderBottom:"1px solid #e8e4dc"}}>
            {trail.map((a,i)=>(
              <button key={i} className={`crumb${i===currentIndex?" active":""}`} onClick={()=>jumpTo(i)}>
                {i>0&&<span style={{marginRight:4,opacity:0.35}}>›</span>}
                {a.title.length>22?a.title.slice(0,22)+"…":a.title}
              </button>
            ))}
          </div>
        )}

        <main style={{padding:"0 20px 60px"}}>

          {/* ── DISCOVER VIEW ── */}
          {view==="discover"&&(
            <div className="card-in">
              <div style={{marginTop:24,marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"#1c1810"}}>Discover</h2>
                  <button
                    className="ghost-btn"
                    style={{fontSize:11,padding:"5px 12px"}}
                    disabled={fetching||loading}
                    onClick={()=>startWith(SEED_ARTICLES[SEED_KEYS[Math.floor(Math.random()*SEED_KEYS.length)]].title)}
                    title="Jump to a random article"
                  >🎲 Surprise me</button>
                </div>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#aaa",marginBottom:16}}>{SEED_KEYS.length} articles · all instant load</p>

                {/* ── Custom topic input ── */}
                <div style={{marginBottom:16,padding:"14px 16px",background:"#faf8f4",border:"1.5px solid #e8dcc8",borderRadius:10}}>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em",marginBottom:8}}>✦ START WITH ANY TOPIC</p>
                  <form
                    onSubmit={e=>{
                      e.preventDefault();
                      const val=e.target.elements.customTopic.value.trim();
                      if(val){startWith(val);e.target.reset();}
                    }}
                    style={{display:"flex",gap:8}}
                  >
                    <input
                      name="customTopic"
                      className="search-input"
                      placeholder="type any Wikipedia topic…"
                      style={{flex:1,marginBottom:0}}
                      autoComplete="off"
                      maxLength={120}
                      disabled={fetching||loading}
                    />
                    <button
                      type="submit"
                      className="gold-btn"
                      style={{whiteSpace:"nowrap",padding:"0 16px"}}
                      disabled={fetching||loading}
                    >Go →</button>
                  </form>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",marginTop:6}}>e.g. "Black hole", "Napoleon", "Coral reefs"</p>
                </div>

                <input className="search-input" placeholder="search seed articles…" value={discoverSearch} onChange={e=>setDiscoverSearch(e.target.value)}/>
              </div>

              {filteredDiscover ? (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {filteredDiscover.length===0
                    ? <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#bbb",textAlign:"center",padding:"24px 0"}}>no results</p>
                    : filteredDiscover.map(key=>{
                        const a=SEED_ARTICLES[key];
                        return(
                          <button key={key} className="discover-btn" disabled={fetching||loading} onClick={()=>startWith(a.title)}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1c1810",marginBottom:2}}>{a.title}</p>
                              <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.description}</p>
                            </div>
                            <span style={{color:"#b8832a",fontSize:16,flexShrink:0}}>→</span>
                          </button>
                        );
                      })
                  }
                </div>
              ) : (
                Object.entries(CATEGORIES).map(([cat,keys])=>(
                  <div key={cat} style={{marginBottom:28}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#b8832a",letterSpacing:"0.1em",marginBottom:10}}>{cat}</p>
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {keys.map(key=>{
                        const a=SEED_ARTICLES[key];if(!a)return null;
                        return(
                          <button key={key} className="discover-btn" disabled={fetching||loading} onClick={()=>startWith(a.title)}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:"#1c1810",marginBottom:2}}>{a.title}</p>
                              <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#999",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.description}</p>
                            </div>
                            <span style={{color:"#b8832a",fontSize:16,flexShrink:0}}>→</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TRAILS VIEW ── */}
          {view==="trails"&&(
            <div className="card-in">
              <div style={{marginTop:24,marginBottom:12,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:"#1c1810"}}>Your Rabbit Holes</h2>
                <button className="gold-btn" disabled={!isOnline} onClick={()=>{setView("discover");}}>+ New</button>
              </div>
              {sessions.length>0&&(
                <input
                  className="search-input"
                  placeholder="search trails…"
                  value={trailSearch}
                  onChange={e=>setTrailSearch(e.target.value)}
                  style={{marginBottom:16}}
                />
              )}
              {sessions.length===0?(
                <div style={{textAlign:"center",padding:"48px 20px",color:"#bbb"}}><div style={{fontSize:36,marginBottom:12}}>🕳</div><p style={{fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:"0.08em"}}>no trails yet — start exploring</p></div>
              ):(()=>{
                const filtered=sessions.filter(s=>!trailSearch.trim()||s.name.toLowerCase().includes(trailSearch.toLowerCase())||s.trailTitles.some(t=>t.toLowerCase().includes(trailSearch.toLowerCase())));
                const favs=filtered.filter(s=>favoritedIds.has(s.id));
                const rest=filtered.filter(s=>!favoritedIds.has(s.id));
                const renderSession=s=>{
                  const m=getSessionMastery(s.id),pct=m.total?Math.round((m.mastered/m.total)*100):0,isCur=s.id===currentSessionId,isFav=favoritedIds.has(s.id);
                  const toggleFav=()=>{
                    setFavoritedIds(prev=>{
                      const next=new Set(prev);
                      if(next.has(s.id))next.delete(s.id);else next.add(s.id);
                      localStorage.setItem("wh_favorites",JSON.stringify([...next]));
                      return next;
                    });
                  };
                  return(
                    <div key={s.id} className="session-card" style={{borderColor:isCur?"#b8832a":isFav?"#c8a85a":"#e2ddd6",background:isCur?"#fffbf3":isFav?"#fffdf5":"#fff"}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:10}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                            <button onClick={toggleFav} style={{background:"none",border:"none",cursor:"pointer",padding:"0 2px",fontSize:15,lineHeight:1}} title={isFav?"Unfavorite":"Favorite"}>{isFav?"★":"☆"}</button>
                            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#1c1810",lineHeight:1.2}}>{s.name}</h3>
                            {isCur&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#b8832a",background:"#b8832a18",border:"1px solid #b8832a44",padding:"1px 6px",borderRadius:4,flexShrink:0}}>current</span>}
                          </div>
                          <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#aaa",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                            {s.trailTitles.map((t,i)=>(i>0?" › ":"")+(t.length>18?t.slice(0,18)+"…":t)).join("")}
                          </p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",marginBottom:3}}>{timeAgo(s.updatedAt)}</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a"}}>{s.trailTitles.length-1} deep</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:m.total?10:0}}>
                        {Array.from({length:Math.min(s.trailTitles.length,12)}).map((_,i)=>(
                          <div key={i} style={{width:4,height:4,borderRadius:"50%",background:i===s.currentIndex?"#b8832a":i<s.trailTitles.length?"#d8d0c4":"#eee"}}/>
                        ))}
                      </div>
                      {m.total>0&&(
                        <div style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#bbb",letterSpacing:"0.06em"}}>QUIZ MASTERY</span>
                            <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:pct===100?"#4a9a60":"#b8832a"}}>{m.mastered}/{m.total} {pct===100?"✓":`${pct}%`}</span>
                          </div>
                          <div style={{height:3,background:"#ece8e2",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?"#4a9a60":"#b8832a",borderRadius:2}}/></div>
                        </div>
                      )}
                      <div style={{display:"flex",gap:8}}>
                        <button className="gold-btn" style={{fontSize:10}} onClick={()=>restoreSession(s)}>Resume →</button>
                        <button className="ghost-btn" style={{fontSize:10}} onClick={()=>startNewQuiz(s.id)} title="Generate a quiz from this trail">✦ Quiz</button>
                      </div>
                    </div>
                  );
                };
                return(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {favs.length>0&&<>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em",marginBottom:-2}}>★ FAVORITES</p>
                      {favs.map(renderSession)}
                      {rest.length>0&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#ccc",letterSpacing:"0.08em",marginBottom:-2,marginTop:4}}>ALL TRAILS</p>}
                    </>}
                    {rest.map(renderSession)}
                    {filtered.length===0&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#bbb",textAlign:"center",padding:"24px 0"}}>no matching trails</p>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── ARTICLE VIEW ── */}
          {view==="article"&&(
            loading?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:18}}>
                <div style={{width:28,height:28,border:"2px solid #e0dbd2",borderTop:"2px solid #b8832a",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#aaa",letterSpacing:"0.1em"}}>{loadingMsg}</p>
              </div>
            ):error?(
              <div style={{margin:"36px 0",padding:"20px",background:"#fff5f5",border:"1px solid #f0c8c8",borderRadius:12,textAlign:"center"}}>
                <p style={{color:"#c05050",marginBottom:14,lineHeight:1.6}}>{error}</p>
                <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                  {lastFailedAction&&isOnline&&<button className="gold-btn" onClick={retryLastAction}>↺ retry</button>}
                  {isOnline&&<button className="new-btn" onClick={()=>setView("discover")}>browse topics</button>}
                </div>
              </div>
            ):showSkeleton?<ArticleSkeleton/>
            :current?(
              <div key={animKey} className="card-in">
                {current.imageUrl&&!imgError&&(
                  <div style={{margin:"22px 0 0",borderRadius:14,overflow:"hidden",height:210,background:"#e8e4dc",position:"relative",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
                    <img src={current.imageUrl} alt={current.title} loading="lazy" decoding="async" onError={()=>setImgError(true)} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 55%, rgba(245,242,236,0.65))"}}/>
                  </div>
                )}
                <div style={{marginTop:22}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    {current.description&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#b8832a",letterSpacing:"0.1em",textTransform:"uppercase"}}>{sanitizeText(current.description)}</p>}
                    {readingTime&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",flexShrink:0,marginLeft:8}}>{readingTime}</span>}
                  </div>
                  <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,5.5vw,36px)",fontWeight:700,lineHeight:1.15,letterSpacing:"-0.02em",color:"#1c1810",marginBottom:14}}>{sanitizeText(current.title)}</h1>
                  <p style={{fontSize:16,lineHeight:1.85,color:"#4a4438"}}>{sanitizeText(current.extract)}</p>
                  {current.wikiUrl&&(<div style={{marginTop:14}}><a href={current.wikiUrl} target="_blank" rel="noopener noreferrer" className="wiki-link"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Read full article on Wikipedia</a></div>)}
                  {(()=>{const m=getSessionMastery(currentSessionId);if(!m.total)return null;const pct=Math.round((m.mastered/m.total)*100);return(<div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,height:3,background:"#e8e4dc",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?"#4a9a60":"#b8832a",borderRadius:2,transition:"width 0.4s"}}/></div><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:pct===100?"#4a9a60":"#b8832a",whiteSpace:"nowrap"}}>{m.mastered}/{m.total} mastered</span></div>);})()}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,margin:"30px 0 14px"}}>
                  <div style={{flex:1,height:1,background:"#e2ddd6"}}/><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",letterSpacing:"0.14em"}}>🕳 RABBIT HOLES</span><div style={{flex:1,height:1,background:"#e2ddd6"}}/>
                </div>
                {(current.links||[]).length>0?(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {current.links.map((link,i)=>{const offline=isLinkOffline(link.title),unavail=!isOnline&&!offline;return(
                      <button key={i} className="hole-btn" disabled={fetching||loading||unavail} onClick={()=>diveInto(link.title)}>
                        <div><p style={{fontFamily:"'Playfair Display',serif",fontSize:15.5,fontWeight:700,color:unavail?"#bbb":"#1c1810",marginBottom:link.description?3:0}}>{sanitizeText(link.title)}</p>{link.description&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:unavail?"#ccc":"#999"}}>{sanitizeText(link.description)}</p>}</div>
                        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>{offline&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#4a9a60"}}>ready</span>}{!isOnline&&!offline&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#ccc"}}>offline</span>}<span style={{color:unavail?"#ddd":"#b8832a",fontSize:18}}>→</span></div>
                      </button>
                    );})}
                  </div>
                ):(
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#bbb",textAlign:"center",padding:"20px 0"}}>dead end — try a new hole</p>
                )}
                <div style={{marginTop:24,display:"flex",gap:8}}>
                  <button className="ghost-btn" style={{flex:1,justifyContent:"center",display:"flex"}} onClick={()=>startNewQuiz(currentSessionId)} title="Generate a quiz">✦ Quiz</button>
                  <button className="ghost-btn" style={{flex:1,justifyContent:"center",display:"flex"}} onClick={()=>setView("discover")}>🔭 Discover</button>
                </div>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#ccc",textAlign:"center",marginTop:28}}>{SEED_KEYS.length} instant articles · {allCards.length} cards</p>
                {depth>0&&<div style={{display:"flex",justifyContent:"center",gap:5,marginTop:12}}>{Array.from({length:Math.min(depth+1,10)}).map((_,i)=>(<div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===depth?"#b8832a":"#ddd8d0"}}/>))}</div>}
              </div>
            ):null
          )}

          {/* ── QUIZ / REVIEW ── */}
          {(view==="quiz"||view==="review")&&(
            quizLoading?(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,gap:18}}><div style={{width:28,height:28,border:"2px solid #e0dbd2",borderTop:"2px solid #b8832a",borderRadius:"50%",animation:"spin 0.9s linear infinite"}}/><p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#aaa",letterSpacing:"0.1em"}}>crafting your quiz…</p></div>)
            :quizError?(<div style={{margin:"36px 0",padding:"20px",background:"#fff5f5",border:"1px solid #f0c8c8",borderRadius:12,textAlign:"center"}}><p style={{color:"#c05050",marginBottom:14,lineHeight:1.6}}>{quizError}</p><div style={{display:"flex",gap:10,justifyContent:"center"}}><button className="gold-btn" onClick={()=>startNewQuiz(activeQuizSessionId||currentSessionId)}>Retry</button><button className="new-btn" onClick={goBack}>Back</button></div></div>)
            :finished?(
              <div className="pop-in" style={{marginTop:40,textAlign:"center"}}>
                <div style={{fontSize:52,marginBottom:14}}>{sessionCorrect===sessionTotal?"🏆":sessionCorrect/sessionTotal>=0.7?"🎉":sessionCorrect/sessionTotal>=0.4?"📚":"🕳️"}</div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,color:"#1c1810",marginBottom:6}}>{sessionCorrect} / {sessionTotal}</h2>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#999",letterSpacing:"0.06em",marginBottom:24}}>{sessionCorrect===sessionTotal?"perfect":sessionCorrect/sessionTotal>=0.7?"well done":"keep digging"}</p>
                {activeQuizSessionId&&(()=>{const m=getSessionMastery(activeQuizSessionId);if(!m.total)return null;const pct=Math.round((m.mastered/m.total)*100),s=sessions.find(x=>x.id===activeQuizSessionId);return(<div style={{textAlign:"left",marginBottom:24,padding:"16px",background:"#fffbf3",border:"1.5px solid #e8d8a0",borderRadius:12}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em",marginBottom:8}}>HOLE MASTERY · {s?.name}</p><div style={{height:5,background:"#ece8e2",borderRadius:3,marginBottom:8}}><div style={{height:"100%",width:`${pct}%`,background:pct===100?"#4a9a60":"#b8832a",borderRadius:3,transition:"width 0.5s"}}/></div><p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:pct===100?"#4a9a60":"#b8832a"}}>{m.mastered}/{m.total} mastered ({pct}%)</p></div>);})()}
                {dueCount>0&&<p style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#b8832a",marginBottom:20}}>{dueCount} card{dueCount!==1?"s":""} due</p>}
                <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                  {dueCount>0&&<button className="gold-btn" onClick={startReview}>↩ Review</button>}
                  <button className="ghost-btn" onClick={()=>setView("trails")}>🕳 Trails</button>
                  <button className="new-btn" onClick={goBack}>Back</button>
                </div>
              </div>
            ):sq?(
              <div className="pop-in" style={{marginTop:24}}>
                <div style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em"}}>{sessionIndex+1} / {sessionQueue.length}{sq._retry&&<span style={{color:"#cc8820",marginLeft:6}}>· again</span>}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#999"}}>{sessionCorrect} correct · {sq.streak||0}🔥</span>
                  </div>
                  <div style={{height:3,background:"#e8e4dc",borderRadius:2}}><div style={{height:"100%",background:"#b8832a",borderRadius:2,width:`${(sessionIndex/sessionQueue.length)*100}%`,transition:"width 0.3s"}}/></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb"}}>from: {sq.source}</span>
                  {sq.mastered&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#4a9a60",background:"#f0faf2",border:"1px solid #b0d8b8",padding:"1px 6px",borderRadius:4}}>mastered</span>}
                  {sq.streak>=2&&!sq.mastered&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#b8832a",background:"#fffbf3",border:"1px solid #e8d8a0",padding:"1px 6px",borderRadius:4}}>{sq.streak} in a row</span>}
                </div>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(17px,4vw,23px)",fontWeight:700,lineHeight:1.35,color:"#1c1810",marginBottom:20}}>{sq.question}</h2>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:18}}>
                  {(sq.options||[]).map((opt,i)=>{const letter=opt.charAt(0),s=optStyle(letter);return(
                    <button key={i} className="opt-btn" disabled={revealed} onClick={()=>handleAnswer(letter)} style={{background:s.bg,borderColor:s.border,color:s.color}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:s.border,flexShrink:0,marginTop:2,fontWeight:500}}>{letter}</span><span>{opt.slice(3)}</span>
                    </button>
                  );})}
                </div>
                {revealed&&(<div className="pop-in">
                  <div style={{padding:"13px 15px",borderRadius:10,marginBottom:14,background:isCorrect?"#f0faf2":"#fff5f5",border:`1.5px solid ${isCorrect?"#9acca8":"#e8b0b0"}`}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.08em",marginBottom:6,color:isCorrect?"#4a9a60":"#c05050"}}>{isCorrect?"✓ CORRECT":`✗ INCORRECT — answer: ${sq.answer}`}</p>
                    <p style={{fontSize:14,lineHeight:1.6,color:"#4a4438"}}>{sq.explanation}</p>
                  </div>
                  {!isCorrect&&sq.extract&&(<div style={{padding:"13px 15px",borderRadius:10,marginBottom:14,background:"#fffbf3",border:"1.5px solid #e8d8a0"}}><p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#b8832a",letterSpacing:"0.08em",marginBottom:8}}>📖 FROM THE ARTICLE</p><p style={{fontSize:14,lineHeight:1.7,color:"#5a4a28",fontStyle:"italic"}}>"{sq.extract}"</p></div>)}
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#bbb",marginBottom:10,textAlign:"center"}}>How well did you know this?</p>
                  <div style={{display:"flex",gap:8}}>
                    {isCorrect?(
                      <><button className="rating-btn" onClick={()=>handleRating("hard")} style={{background:"#fff",borderColor:"#e2ddd6",color:"#666"}}><div style={{fontWeight:500,marginBottom:2}}>Struggled</div><div style={{fontSize:9,color:"#bbb"}}>+{nextReviewLabel(Math.max(Math.round((sq.interval||1)*1.2),(sq.interval||1)+1))}</div></button>
                      <button className="rating-btn" onClick={()=>handleRating("easy")} style={{background:"#f0faf2",borderColor:"#9acca8",color:"#2a6a40"}}><div style={{fontWeight:500,marginBottom:2}}>Easy ✓</div><div style={{fontSize:9,color:"#7ab890"}}>+{nextReviewLabel(Math.max(Math.round((sq.interval||1)*(sq.ease||2.5)),(sq.interval||1)+2))}</div></button></>
                    ):(
                      <button className="rating-btn" onClick={()=>handleRating("again")} style={{background:"#fff5f5",borderColor:"#e8b0b0",color:"#c05050",flex:1}}><div style={{fontWeight:500,marginBottom:2}}>Review again</div><div style={{fontSize:9,color:"#d08080"}}>comes back tomorrow</div></button>
                    )}
                  </div>
                </div>)}
              </div>
            ):null
          )}
        </main>

        {/* ── License / attribution (Wikipedia CC BY-SA compliance) ── */}
        <footer style={{padding:"22px 20px 34px",borderTop:"1px solid #e2ddd6",textAlign:"center"}}>
          <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,lineHeight:1.7,color:"#b3ada3",letterSpacing:"0.02em"}}>
            Article text from <a href="https://en.wikipedia.org" target="_blank" rel="noopener noreferrer" style={{color:"#a8935e",textDecoration:"underline"}}>Wikipedia</a>, available under{" "}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" style={{color:"#a8935e",textDecoration:"underline"}}>CC&nbsp;BY-SA&nbsp;4.0</a>.
            <br/>WikiHole is not affiliated with or endorsed by the Wikimedia Foundation.
          </p>
        </footer>
      </div>
    </>
  );
}
