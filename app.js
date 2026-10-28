(function(){
const EXERCISES=[
  {id:"pushup",name:"วิดพื้น",unit:"ครั้ง",rate:1,emoji:"💪"},
  {id:"squat",name:"สควอท",unit:"ครั้ง",rate:1,emoji:"🦵"},
  {id:"plank",name:"แพลงก์",unit:"วินาที",rate:.5,emoji:"🧱"},
  {id:"run",name:"วิ่ง",unit:"นาที",rate:3,emoji:"🏃"},
  {id:"walk",name:"เดิน",unit:"ก้าว",rate:.01,emoji:"🚶"},
  {id:"bike",name:"ปั่นจักรยาน",unit:"นาที",rate:2.5,emoji:"🚴"},
  {id:"yoga",name:"โยคะ",unit:"นาที",rate:2,emoji:"🧘"},
  {id:"rope",name:"กระโดดเชือก",unit:"นาที",rate:4,emoji:"🪢"}
];
const QUESTS=[
  {id:"q1",text:"วิดพื้น 20 ครั้ง",xp:30},
  {id:"q2",text:"สควอท 30 ครั้ง",xp:30},
  {id:"q3",text:"แพลงก์รวม 60 วินาที",xp:30},
  {id:"q4",text:"เดินให้ได้ 6,000 ก้าว",xp:30},
  {id:"q5",text:"ดื่มน้ำ 8 แก้ว",xp:20}
];
const BONUS=50;
const RANKS=[[1,"มือใหม่"],[3,"นักสู้"],[5,"สายฟิต"],[8,"นักกีฬา"],[12,"ยอดนักสู้"],[16,"ตำนาน"]];
const BADGES=[
  {id:"first",ico:"🌱",name:"ก้าวแรก",desc:"บันทึกการออกกำลังกายครั้งแรก",test:s=>s.log.length>=1},
  {id:"ten",ico:"🔟",name:"ขยันสิบครั้ง",desc:"บันทึกครบ 10 ครั้ง",test:s=>s.log.length>=10},
  {id:"allq",ico:"🎯",name:"ภารกิจครบ",desc:"ทำภารกิจครบทุกข้อในวันเดียว",test:s=>!!s.perfectDays},
  {id:"s3",ico:"🔥",name:"ไฟติด",desc:"ออกกำลังกาย 3 วันติดกัน",test:s=>s.bestStreak>=3},
  {id:"s7",ico:"☄️",name:"หนึ่งสัปดาห์เต็ม",desc:"ออกกำลังกาย 7 วันติดกัน",test:s=>s.bestStreak>=7},
  {id:"l5",ico:"⭐",name:"เลเวล 5",desc:"ไปถึงเลเวล 5",test:s=>levelOf(s.xp).level>=5},
  {id:"l10",ico:"🌟",name:"เลเวล 10",desc:"ไปถึงเลเวล 10",test:s=>levelOf(s.xp).level>=10},
  {id:"k1",ico:"💎",name:"พัน XP",desc:"สะสมครบ 1,000 XP",test:s=>s.xp>=1000},
  {id:"run",ico:"🏅",name:"นักวิ่ง",desc:"วิ่งสะสมครบ 60 นาที",test:s=>sumType(s,"run")>=60},
  {id:"zen",ico:"🪷",name:"ใจนิ่ง",desc:"โยคะสะสมครบ 60 นาที",test:s=>sumType(s,"yoga")>=60}
];

const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const dayShift=(key,n)=>{const [y,m,d]=key.split("-").map(Number);const t=new Date(y,m-1,d+n);return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")};
const need=l=>100+(l-1)*50;
function levelOf(xp){let l=1,left=xp;while(left>=need(l)){left-=need(l);l++}return{level:l,into:left,need:need(l)}}
function rankOf(l){let r=RANKS[0][1];for(const [min,n] of RANKS) if(l>=min) r=n;return r}
function sumType(s,t){return s.log.filter(e=>e.type===t).reduce((a,e)=>a+e.amount,0)}
const fmt=n=>Math.round(n).toLocaleString("th-TH");

let state={name:"",xp:0,log:[],quests:{date:today(),done:[]},activeDays:[],bestStreak:0,perfectDays:0,badges:[]};
let sel=EXERCISES[0];

/* ---------- storage: localStorage ---------- */
function loadLocal(){try{const raw=localStorage.getItem("flu-state");if(raw) return JSON.parse(raw)}catch(e){}return null}
function persist(){
  try{localStorage.setItem("flu-state",JSON.stringify(state))}catch(e){}
}
function merge(s){if(!s) return;state=Object.assign(state,s);if(!state.activeDays)state.activeDays=[];if(!state.badges)state.badges=[]}
merge(loadLocal());


/* ---------- logic ---------- */
function rollQuests(){if(state.quests.date!==today()) state.quests={date:today(),done:[]}}
function markActive(){const t=today();if(!state.activeDays.includes(t)){state.activeDays.push(t);state.activeDays=state.activeDays.slice(-400)}state.bestStreak=Math.max(state.bestStreak,streak())}
function streak(){const set=new Set(state.activeDays);let k=today();if(!set.has(k)) k=dayShift(k,-1);let n=0;while(set.has(k)){n++;k=dayShift(k,-1)}return n}
function gain(xp,label){
  const before=levelOf(state.xp).level;
  state.xp=Math.max(0,state.xp+xp);
  const after=levelOf(state.xp).level;
  if(xp>0) toast("+"+fmt(xp)+" XP · "+label);
  return after>before?after:0;
}
function checkBadges(){
  const fresh=[];
  for(const b of BADGES){if(!state.badges.includes(b.id)&&b.test(state)){state.badges.push(b.id);fresh.push(b)}}
  return fresh;
}
function afterChange(leveled){
  const fresh=checkBadges();persist();render(true);
  if(leveled) showLevelUp(leveled);
  else if(fresh.length) showBadge(fresh[0]);
}

function toggleQuest(q){
  rollQuests();
  const done=state.quests.done;const i=done.indexOf(q.id);let lv=0;
  const wasAll=done.length===QUESTS.length;
  if(i>=0){done.splice(i,1);state.xp=Math.max(0,state.xp-q.xp-(wasAll?BONUS:0));if(wasAll)state.perfectDays=Math.max(0,state.perfectDays-1)}
  else{
    done.push(q.id);markActive();lv=gain(q.xp,q.text);
    if(done.length===QUESTS.length){state.perfectDays++;lv=gain(BONUS,"โบนัสภารกิจครบ")||lv}
  }
  afterChange(lv);
}
function addLog(){
  const amt=Number(document.getElementById("amount").value);
  if(!(amt>0)) return;
  const xp=Math.max(1,Math.round(amt*sel.rate));
  state.log.unshift({type:sel.id,amount:amt,xp,at:Date.now(),date:today()});
  state.log=state.log.slice(0,500);
  markActive();
  const lv=gain(xp,sel.name);
  document.getElementById("amount").value="";updatePreview();
  afterChange(lv);
}

/* ---------- render ---------- */
const $=id=>document.getElementById(id);
function render(animate){
  rollQuests();
  const L=levelOf(state.xp);
  $("lvNum").textContent=L.level;
  $("rank").textContent=rankOf(L.level);
  $("name").textContent=state.name||"นักสู้";
  $("xpLine").textContent=fmt(L.into)+" / "+fmt(L.need)+" XP ถึงเลเวล "+(L.level+1);
  const C=326.7;$("ringFill").style.strokeDashoffset=C*(1-L.into/L.need);
  $("sXp").textContent=fmt(state.xp);
  $("sStreak").textContent=streak();
  $("sCount").textContent=fmt(state.log.length);

  const ul=$("quests");ul.innerHTML="";
  for(const q of QUESTS){
    const done=state.quests.done.includes(q.id);
    const li=document.createElement("li");
    const b=document.createElement("button");b.className="quest";b.setAttribute("aria-pressed",done);
    b.innerHTML='<span class="box">'+(done?"✓":"")+'</span><span class="txt"><b></b></span><span class="xp">+'+q.xp+' XP</span>';
    b.querySelector("b").textContent=q.text;
    b.onclick=()=>toggleQuest(q);li.appendChild(b);ul.appendChild(li);
  }
  const left=QUESTS.length-state.quests.done.length;
  const bn=$("bonus");bn.className="bonus"+(left?"":" done");
  bn.textContent=left?"เหลืออีก "+left+" ภารกิจ ก่อนรับโบนัส +"+BONUS+" XP":"ภารกิจครบแล้ววันนี้ รับโบนัส +"+BONUS+" XP เรียบร้อย";

  // chart
  const ch=$("chart");ch.innerHTML="";
  const days=[];for(let i=6;i>=0;i--) days.push(dayShift(today(),-i));
  const totals=days.map(d=>state.log.filter(e=>e.date===d).reduce((a,e)=>a+e.xp,0));
  const max=Math.max(50,...totals);
  const dn=["อา","จ","อ","พ","พฤ","ศ","ส"];
  days.forEach((d,i)=>{
    const [y,m,dd]=d.split("-").map(Number);const wd=new Date(y,m-1,dd).getDay();
    const el=document.createElement("div");el.className="bar"+(i===6?" today":"");
    el.innerHTML='<i style="height:'+(totals[i]/max*100)+'%"></i><span>'+dn[wd]+'</span><small>'+(totals[i]?fmt(totals[i]):"")+'</small>';
    el.setAttribute("aria-label",d+" "+totals[i]+" XP");ch.appendChild(el);
  });
  // log
  const lg=$("log");lg.innerHTML="";
  if(!state.log.length){lg.innerHTML='<li class="empty">ยังไม่มีบันทึก ลองบันทึกท่าแรกในแท็บ “วันนี้”</li>'}
  for(const e of state.log.slice(0,30)){
    const ex=EXERCISES.find(x=>x.id===e.type)||{name:e.type,unit:"",emoji:"•"};
    const li=document.createElement("li");
    const t=new Date(e.at);
    li.innerHTML='<span></span><span>+'+fmt(e.xp)+' XP</span>';
    li.firstChild.textContent=ex.emoji+" "+ex.name+" "+fmt(e.amount)+" "+ex.unit;
    const w=document.createElement("span");w.className="when";
    w.textContent=t.toLocaleDateString("th-TH",{day:"numeric",month:"short"})+" "+t.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
    li.firstChild.appendChild(w);lg.appendChild(li);
  }
  // badges
  const bg=$("badges");bg.innerHTML="";
  for(const b of BADGES){
    const got=state.badges.includes(b.id);
    const d=document.createElement("div");d.className="badge"+(got?"":" locked");
    d.innerHTML='<span class="ico">'+b.ico+'</span><b></b><small></small>';
    d.querySelector("b").textContent=b.name;d.querySelector("small").textContent=b.desc;
    bg.appendChild(d);
  }
  $("badgeCount").textContent="ปลดล็อกแล้ว "+state.badges.length+" จาก "+BADGES.length;
}

function renderChips(){
  const c=$("chips");c.innerHTML="";
  for(const ex of EXERCISES){
    const b=document.createElement("button");b.className="chip";b.setAttribute("aria-pressed",ex===sel);
    b.textContent=ex.emoji+" "+ex.name;
    b.onclick=()=>{sel=ex;renderChips();$("unit").textContent="("+ex.unit+")";updatePreview();$("amount").focus()};
    c.appendChild(b);
  }
}
function updatePreview(){
  const amt=Number($("amount").value);
  $("addBtn").disabled=!(amt>0);
  $("preview").innerHTML=amt>0?"จะได้ <b>+"+fmt(Math.max(1,Math.round(amt*sel.rate)))+" XP</b> จาก"+sel.name+" "+fmt(amt)+" "+sel.unit:"เลือกท่าแล้วกรอกจำนวนเพื่อดู XP ที่จะได้";
}

/* ---------- UI helpers ---------- */
let tt;function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("show"),1800)}
function modal(html,onReady){const m=$("modal");m.innerHTML='<div class="card" role="dialog" aria-modal="true">'+html+'</div>';m.hidden=false;m.onclick=e=>{if(e.target===m)close()};if(onReady)onReady(m);const f=m.querySelector("input,button");if(f)f.focus()}
function close(){$("modal").hidden=true}
function showLevelUp(l){
  modal('<div class="big pop">'+l+'</div><h3>เลเวลอัป!</h3><p>ตอนนี้คุณคือ “'+rankOf(l)+'” ไปต่อให้สุด</p><button class="btn volt" id="ok">ไปต่อ</button>',m=>m.querySelector("#ok").onclick=close);
}
function showBadge(b){
  modal('<div class="big pop" style="font-size:72px">'+b.ico+'</div><h3>ปลดล็อก: '+b.name+'</h3><p>'+b.desc+'</p><button class="btn" id="ok">เยี่ยม</button>',m=>m.querySelector("#ok").onclick=close);
}
function askName(first){
  modal('<h3>'+(first?"ยินดีต้อนรับสู่ Fitness Level Up":"แก้ชื่อ")+'</h3><p>'+(first?"ทำภารกิจ บันทึกการออกกำลังกาย แล้วเก็บ XP เพื่อเลเวลอัป":"ชื่อนี้แสดงบนหน้าโปรไฟล์ของคุณ")+'</p><input id="nm" maxlength="24" placeholder="ชื่อเล่นของคุณ"><button class="btn" id="ok">'+(first?"เริ่มเลย":"บันทึกชื่อ")+'</button>',m=>{
    const i=m.querySelector("#nm");i.value=state.name||"";
    const go=()=>{state.name=i.value.trim()||"นักสู้";persist();render();close()};
    m.querySelector("#ok").onclick=go;i.onkeydown=e=>{if(e.key==="Enter")go()};
  });
}

/* ---------- tabs ---------- */
const TABS=["today","history","badges"];
function showTab(t){
  if(!TABS.includes(t)) t="today";
  TABS.forEach(x=>{$("tab-"+x).hidden=x!==t});
  document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===t));
  window.scrollTo(0,0);
}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));

/* ---------- wire ---------- */
$("amount").oninput=updatePreview;
$("amount").onkeydown=e=>{if(e.key==="Enter")addLog()};
$("addBtn").onclick=addLog;
$("editName").onclick=()=>askName(false);
$("resetBtn").onclick=()=>{
  modal('<h3>เริ่มใหม่ทั้งหมด?</h3><p>XP เลเวล ประวัติ และความสำเร็จทั้งหมดจะถูกลบ และกู้คืนไม่ได้</p><div style="display:flex;gap:10px;justify-content:center"><button class="btn ghost" id="no">ยกเลิก</button><button class="btn" id="yes">ลบและเริ่มใหม่</button></div>',m=>{
    m.querySelector("#no").onclick=close;
    m.querySelector("#yes").onclick=()=>{const n=state.name;state={name:n,xp:0,log:[],quests:{date:today(),done:[]},activeDays:[],bestStreak:0,perfectDays:0,badges:[]};persist();render();close();showTab("today");toast("เริ่มใหม่แล้ว")};
  });
};
document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});

renderChips();render();showTab((location.hash||"").slice(1));
if(!state.name) setTimeout(()=>{if(!state.name) askName(true)},500);
})();
