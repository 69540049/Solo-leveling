(function () {
"use strict";

/* ================= Data ================= */
const EX = {
  pushup:  {name:"วิดพื้น",      unit:"ครั้ง",  rate:1,   stat:"STR", emoji:"💪", steps:[5,10]},
  squat:   {name:"สควอท",        unit:"ครั้ง",  rate:1,   stat:"STR", emoji:"🦵", steps:[10,20]},
  plank:   {name:"แพลงก์",       unit:"วินาที", rate:.5,  stat:"VIT", emoji:"🧱", steps:[15,30]},
  cardio:  {name:"วิ่ง/เดินเร็ว", unit:"นาที",   rate:4,   stat:"AGI", emoji:"🏃", steps:[5,10]},
  stretch: {name:"ยืดเหยียด",    unit:"นาที",   rate:2,   stat:"FOC", emoji:"🤸", steps:[2,5]},
  burpee:  {name:"เบอร์พี",       unit:"ครั้ง",  rate:2,   stat:"VIT", emoji:"🔥", steps:[5,10]},
  rope:    {name:"กระโดดเชือก",  unit:"นาที",   rate:5,   stat:"AGI", emoji:"🪢", steps:[2,5]},
  bike:    {name:"ปั่นจักรยาน",  unit:"นาที",   rate:3,   stat:"AGI", emoji:"🚴", steps:[5,10]},
  yoga:    {name:"โยคะ",         unit:"นาที",   rate:2.5, stat:"FOC", emoji:"🧘", steps:[5,10]}
};
const QUESTS = [
  {ex:"pushup", base:20}, {ex:"squat", base:30}, {ex:"plank", base:60},
  {ex:"cardio", base:15}, {ex:"stretch", base:5}
];
const STATS = [
  {k:"STR", lbl:"พลัง"}, {k:"AGI", lbl:"ความเร็ว"},
  {k:"VIT", lbl:"ความอึด"}, {k:"FOC", lbl:"สมาธิ"}
];
const RANKS = [
  {r:"E", min:1,  mult:1,   color:"#8C8AA8"},
  {r:"D", min:8,  mult:1.3, color:"#3FB37F"},
  {r:"C", min:16, mult:1.6, color:"#3D9BFF"},
  {r:"B", min:26, mult:2,   color:"#9B7BFF"},
  {r:"A", min:38, mult:2.5, color:"#FF5C7A"},
  {r:"S", min:52, mult:3,   color:"#FFB520"}
];
const BOSSES = [
  {name:"ปีศาจโซฟา",          ico:"🛋️", desc:"ดูดพลังทุกคนที่นั่งนานเกินไป"},
  {name:"ราชาแห่งข้ออ้าง",     ico:"👑", desc:"มีเหตุผลเสมอว่าทำไมวันนี้ไม่ต้องซ้อม"},
  {name:"หมาป่ากดเลื่อนปลุก",  ico:"⏰", desc:"ขโมยเวลาเช้าของคุณไปทีละ 5 นาที"},
  {name:"ก็อบลินขนมหวาน",      ico:"🍩", desc:"ซ่อนตัวอยู่ในตู้เย็นทุกคืน"},
  {name:"เงาแห่งความเหนื่อยล้า", ico:"🌑", desc:"แข็งแกร่งขึ้นทุกครั้งที่คุณนอนดึก"}
];
const TITLES = [
  {id:"awake",  name:"ผู้ตื่นรู้",       desc:"บันทึกการฝึกครั้งแรก",             test:s=>s.log.length>=1},
  {id:"daily",  name:"ผู้รับภารกิจ",     desc:"ทำภารกิจประจำวันสำเร็จครั้งแรก",    test:s=>s.doneDays.length>=1},
  {id:"s3",     name:"ไม่ยอมแพ้",        desc:"ทำภารกิจสำเร็จ 3 วันติดกัน",        test:s=>bestStreak(s)>=3},
  {id:"s7",     name:"เจ็ดวันไม่หยุด",   desc:"ทำภารกิจสำเร็จ 7 วันติดกัน",        test:s=>bestStreak(s)>=7},
  {id:"s30",    name:"วินัยเหล็ก",       desc:"ทำภารกิจสำเร็จ 30 วันติดกัน",       test:s=>bestStreak(s)>=30},
  {id:"boss1",  name:"ผู้พิชิตบอส",      desc:"ปราบบอสประจำสัปดาห์ได้ครั้งแรก",    test:s=>s.bossWins.length>=1},
  {id:"rankC",  name:"ฮันเตอร์แรงค์ C",  desc:"เลื่อนขึ้นแรงค์ C",                 test:s=>rankIdx(levelOf(s.xp).level)>=2},
  {id:"rankA",  name:"ฮันเตอร์แรงค์ A",  desc:"เลื่อนขึ้นแรงค์ A",                 test:s=>rankIdx(levelOf(s.xp).level)>=4},
  {id:"iron",   name:"มือเหล็ก",         desc:"วิดพื้นสะสม 1,000 ครั้ง",           test:s=>total(s,"pushup")>=1000},
  {id:"legs",   name:"ขาสายฟ้า",         desc:"สควอทสะสม 1,000 ครั้ง",             test:s=>total(s,"squat")>=1000},
  {id:"wind",   name:"ลมหายใจยาว",       desc:"คาร์ดิโอสะสม 300 นาที",             test:s=>total(s,"cardio")+total(s,"rope")+total(s,"bike")>=300},
  {id:"calm",   name:"จิตนิ่ง",          desc:"โยคะและยืดเหยียดสะสม 300 นาที",     test:s=>total(s,"yoga")+total(s,"stretch")>=300}
];
const PTS_PER_LEVEL = 3;
const STORE_KEY = "hunter-protocol-v1";

/* ================= Helpers ================= */
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,"0");
const keyOf = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const parse = k => { const [y,m,d] = k.split("-").map(Number); return new Date(y,m-1,d); };
const today = () => keyOf(new Date());
const shift = (k,n) => { const d = parse(k); d.setDate(d.getDate()+n); return keyOf(d); };
const weekOf = k => { const d = parse(k); d.setDate(d.getDate()-((d.getDay()+6)%7)); return keyOf(d); };
const fmt = n => Math.round(n).toLocaleString("th-TH");
const need = l => 100 + (l-1)*60;
function levelOf(xp){ let l=1, left=xp; while(left>=need(l)){ left-=need(l); l++; } return {level:l, into:left, need:need(l)}; }
function rankIdx(level){ let i=0; RANKS.forEach((r,j)=>{ if(level>=r.min) i=j; }); return i; }
function total(s,type){ return s.log.filter(e=>e.type===type).reduce((a,e)=>a+e.amount,0); }
function streakFrom(set, start){ let k=start, n=0; while(set.has(k)){ n++; k=shift(k,-1); } return n; }
function currentStreak(s){ const set=new Set(s.doneDays); const t=today(); return streakFrom(set, set.has(t)?t:shift(t,-1)); }
function bestStreak(s){ const set=new Set(s.doneDays); let best=0; s.doneDays.forEach(d=>{ if(!set.has(shift(d,1))) best=Math.max(best,streakFrom(set,d)); }); return best; }
function esc(t){ const d=document.createElement("div"); d.textContent=t; return d.innerHTML; }

/* ================= State ================= */
function fresh(name){
  return {name:name||"", xp:0, statXp:{STR:0,AGI:0,VIT:0,FOC:0}, alloc:{STR:0,AGI:0,VIT:0,FOC:0},
    bonusPts:0, log:[], daily:null, doneDays:[], bossWins:[], titles:[], equipped:"", lastFailNotice:""};
}
let S = fresh();
try { const raw = localStorage.getItem(STORE_KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch(e) {}
function save(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch(e) {} }

function statVal(k){ return 10 + Math.floor(S.statXp[k]/100) + S.alloc[k]; }
function freePoints(){
  const lv = levelOf(S.xp).level;
  const spent = STATS.reduce((a,s)=>a+S.alloc[s.k],0);
  return Math.max(0, (lv-1)*PTS_PER_LEVEL + S.bonusPts - spent);
}
function mult(){ return RANKS[rankIdx(levelOf(S.xp).level)].mult; }

/* New day: fix today's quest targets, report yesterday's failure */
function rollDay(){
  const t = today();
  if (S.daily && S.daily.date === t) return null;
  let failed = null;
  if (S.daily && !S.daily.claimed && S.log.length && S.lastFailNotice !== S.daily.date) {
    failed = S.daily.date; S.lastFailNotice = S.daily.date;
  }
  const m = mult(), targets = {};
  QUESTS.forEach(q => targets[q.ex] = Math.round(q.base*m));
  S.daily = {date:t, targets, claimed:false};
  save();
  return failed;
}
function progress(type){ return S.log.filter(e=>e.date===today() && e.type===type).reduce((a,e)=>a+e.amount,0); }
function questsDone(){ return QUESTS.every(q => progress(q.ex) >= S.daily.targets[q.ex]); }

/* Boss */
function bossNow(){
  const wk = weekOf(today());
  const idx = Math.floor(parse(wk).getTime()/(7*864e5));
  const b = BOSSES[((idx % BOSSES.length)+BOSSES.length) % BOSSES.length];
  const hp = Math.round(1200*mult()/100)*100;
  const dmg = S.log.filter(e=>weekOf(e.date)===wk).reduce((a,e)=>a+e.xp,0);
  return Object.assign({week:wk, hp, dmg, won:S.bossWins.some(w=>w.week===wk)}, b);
}

/* ================= Actions ================= */
let lastUndo = null;
function addXp(xp){
  const before = levelOf(S.xp).level;
  S.xp = Math.max(0, S.xp + xp);
  const after = levelOf(S.xp).level;
  return {levelUp: after>before ? after : 0, rankUp: rankIdx(after)>rankIdx(before) ? RANKS[rankIdx(after)].r : ""};
}
function logExercise(type, amount){
  if (!(amount>0)) return;
  const ex = EX[type];
  const xp = Math.max(1, Math.round(amount*ex.rate));
  const entry = {type, amount, xp, at:Date.now(), date:today()};
  const wasDone = questsDone();
  S.log.unshift(entry); S.log = S.log.slice(0, 1000);
  S.statXp[ex.stat] += xp;
  const res = addXp(xp);
  lastUndo = entry;
  finish(res, "+"+fmt(xp)+" XP · "+ex.name+" "+fmt(amount)+" "+ex.unit, true);
  if (!wasDone && questsDone() && !S.daily.claimed && !res.levelUp) {
    setTimeout(()=>sys("ภารกิจประจำวันสำเร็จ", "ไปที่แท็บ “ภารกิจ” เพื่อรับรางวัล", "📜"), 600);
  }
}
function undoLast(){
  if (!lastUndo) return;
  const i = S.log.indexOf(lastUndo);
  if (i < 0) return;
  S.log.splice(i,1);
  S.statXp[EX[lastUndo.type].stat] = Math.max(0, S.statXp[EX[lastUndo.type].stat]-lastUndo.xp);
  S.xp = Math.max(0, S.xp - lastUndo.xp);
  lastUndo = null;
  save(); render(); toast("ยกเลิกบันทึกล่าสุดแล้ว");
}
function claimDaily(){
  if (S.daily.claimed || !questsDone()) return;
  S.daily.claimed = true;
  if (!S.doneDays.includes(today())) S.doneDays.push(today());
  S.doneDays = S.doneDays.slice(-800);
  const xp = Math.round(150*mult());
  S.bonusPts += 1;
  const res = addXp(xp);
  finish(res, "+"+fmt(xp)+" XP และ +1 แต้มสถานะ");
  if (!res.levelUp) sys("ได้รับรางวัลภารกิจ", "+"+fmt(xp)+" XP และ +1 แต้มสถานะ สตรีคตอนนี้ "+currentStreak(S)+" วัน", "🎁");
}
function claimBoss(){
  const b = bossNow();
  if (b.won || b.dmg < b.hp) return;
  S.bossWins.unshift({week:b.week, name:b.name, ico:b.ico});
  const xp = Math.round(300*mult());
  S.bonusPts += 3;
  const res = addXp(xp);
  finish(res, "+"+fmt(xp)+" XP และ +3 แต้มสถานะ");
  if (!res.levelUp) sys("ปราบ"+b.name+"สำเร็จ", "+"+fmt(xp)+" XP และ +3 แต้มสถานะ", b.ico);
}
function allocate(k){
  if (freePoints() < 1) return;
  S.alloc[k]++; save(); render();
}
function finish(res, msg, undoable){
  const newTitles = [];
  TITLES.forEach(t => { if (!S.titles.includes(t.id) && t.test(S)) { S.titles.push(t.id); newTitles.push(t); } });
  if (!S.equipped && newTitles.length) S.equipped = newTitles[0].id;
  save(); render();
  toast(msg, undoable);
  if (res.rankUp) sys("เลื่อนแรงค์!", "ตอนนี้คุณคือฮันเตอร์แรงค์ "+res.rankUp+" ภารกิจจะยากขึ้นตั้งแต่พรุ่งนี้ รางวัลก็มากขึ้นด้วย", res.rankUp, true);
  else if (res.levelUp) sys("เลเวลอัป!", "ได้รับ +"+PTS_PER_LEVEL+" แต้มสถานะ ไปเพิ่มค่าสถานะได้ที่แท็บ “สถานะ”", res.levelUp, true);
  else if (newTitles.length) sys("ได้รับฉายาใหม่", "“"+newTitles[0].name+"” — "+newTitles[0].desc, "🏷️");
}

/* ================= Render ================= */
function render(){
  rollDay();
  const L = levelOf(S.xp), ri = rankIdx(L.level), R = RANKS[ri];

  // hero
  $("name").textContent = S.name || "ฮันเตอร์";
  $("lv").textContent = L.level;
  $("rankLetter").textContent = R.r;
  $("rankBox").style.setProperty("--rc", R.color);
  const eq = TITLES.find(t=>t.id===S.equipped);
  $("titleEq").textContent = eq ? "ฉายา: "+eq.name : "ยังไม่มีฉายา";
  $("xpFill").style.width = (L.into/L.need*100)+"%";
  const next = RANKS[ri+1];
  $("xpText").textContent = fmt(L.into)+" / "+fmt(L.need)+" XP" + (next ? " · แรงค์ "+next.r+" ที่เลเวล "+next.min : "");

  // stats
  const fp = freePoints();
  $("ptsBox").textContent = fp ? "แต้มว่าง "+fp : "";
  $("stats").innerHTML = STATS.map(s =>
    '<div class="stat"><span class="k">'+s.k+'</span><span class="grow"><span class="lbl">'+s.lbl+'</span><span class="v">'+statVal(s.k)+'</span></span>'+
    '<button class="plus" data-stat="'+s.k+'" aria-label="เพิ่ม'+s.lbl+'" '+(fp?'':'disabled')+'>+</button></div>').join("");
  $("stats").querySelectorAll(".plus").forEach(b => b.onclick = () => allocate(b.dataset.stat));
  $("power").textContent = STATS.reduce((a,s)=>a+statVal(s.k),0);
  $("streak").textContent = currentStreak(S);
  $("sessions").textContent = fmt(S.log.length);

  // chart
  const days = []; for (let i=6;i>=0;i--) days.push(shift(today(),-i));
  const tot = days.map(d => S.log.filter(e=>e.date===d).reduce((a,e)=>a+e.xp,0));
  const max = Math.max(50, ...tot), dn = ["อา","จ","อ","พ","พฤ","ศ","ส"];
  $("chart").innerHTML = days.map((d,i) =>
    '<div class="bar'+(i===6?' today':'')+'" aria-label="'+d+' '+tot[i]+' XP"><i style="height:'+(tot[i]/max*100)+'%"></i><span>'+dn[parse(d).getDay()]+'</span><small>'+(tot[i]?fmt(tot[i]):'')+'</small></div>').join("");

  // log
  $("log").innerHTML = S.log.length ? S.log.slice(0,15).map(e => {
    const ex = EX[e.type], t = new Date(e.at);
    return '<li><span>'+ex.emoji+' '+ex.name+' '+fmt(e.amount)+' '+ex.unit+'<span class="when">'+
      t.toLocaleDateString("th-TH",{day:"numeric",month:"short"})+' '+t.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})+
      '</span></span><span>+'+fmt(e.xp)+' XP</span></li>';
  }).join("") : '<li class="empty">ยังไม่มีบันทึก เริ่มจากภารกิจประจำวันในแท็บ “ภารกิจ”</li>';

  // quests
  const doneCount = QUESTS.filter(q => progress(q.ex) >= S.daily.targets[q.ex]).length;
  $("questNote").textContent = S.daily.claimed
    ? "รับรางวัลวันนี้แล้ว ภารกิจใหม่จะมาเมื่อขึ้นวันใหม่"
    : "สำเร็จ "+doneCount+" จาก "+QUESTS.length+" · ความยากตามแรงค์ "+R.r+" · ภารกิจรีเซ็ตทุกเที่ยงคืน";
  $("quests").innerHTML = QUESTS.map(q => {
    const ex = EX[q.ex], tgt = S.daily.targets[q.ex], p = progress(q.ex), ok = p >= tgt;
    return '<li class="quest'+(ok?' done':'')+'"><div class="q-top"><b>'+ex.emoji+' '+ex.name+' '+fmt(tgt)+' '+ex.unit+'</b><span>'+
      (ok ? '✓ สำเร็จ' : fmt(p)+' / '+fmt(tgt))+'</span></div><div class="qbar"><i style="width:'+Math.min(100,p/tgt*100)+'%"></i></div>'+
      '<div class="q-btns">'+ex.steps.map(st => '<button data-ex="'+q.ex+'" data-n="'+st+'">+'+st+' '+ex.unit+'</button>').join("")+
      '<button data-ex="'+q.ex+'" data-n="custom">กรอกเอง</button></div></li>';
  }).join("");
  $("quests").querySelectorAll("button").forEach(b => b.onclick = () => {
    if (b.dataset.n === "custom") askAmount(b.dataset.ex); else logExercise(b.dataset.ex, Number(b.dataset.n));
  });
  const cb = $("claimBtn");
  cb.disabled = S.daily.claimed || doneCount < QUESTS.length;
  cb.textContent = S.daily.claimed ? "รับรางวัลวันนี้แล้ว"
    : doneCount < QUESTS.length ? "ทำภารกิจให้ครบเพื่อรับรางวัล"
    : "รับรางวัล +"+fmt(Math.round(150*mult()))+" XP และ +1 แต้มสถานะ";

  // boss
  const b = bossNow(), left = Math.max(0, b.hp - b.dmg);
  const daysLeft = 7 - ((new Date().getDay()+6)%7);
  $("bossIco").textContent = b.ico;
  $("bossName").textContent = b.name;
  $("bossDesc").textContent = b.desc;
  document.querySelector(".boss").classList.toggle("dead", b.won);
  $("hpFill").style.width = (left/b.hp*100)+"%";
  $("hpText").textContent = b.won ? "ปราบสำเร็จแล้ว" : "HP "+fmt(left)+" / "+fmt(b.hp)+" · เหลือ "+daysLeft+" วัน";
  const bb = $("bossBtn");
  bb.disabled = b.won || left > 0;
  bb.textContent = b.won ? "รอบอสตัวใหม่วันจันทร์" : left > 0 ? "ฝึกต่อเพื่อลด HP บอส" : "เก็บรางวัล +"+fmt(Math.round(300*mult()))+" XP และ +3 แต้มสถานะ";
  $("bossLog").innerHTML = S.bossWins.length ? S.bossWins.slice(0,20).map(w =>
    '<li><span>'+w.ico+' '+esc(w.name)+'<span class="when">สัปดาห์ของ '+parse(w.week).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"})+'</span></span><span>ชนะ</span></li>').join("")
    : '<li class="empty">ยังไม่เคยปราบบอส ปราบตัวแรกในสัปดาห์นี้เลย</li>';

  // titles
  $("titleCount").textContent = "ปลดล็อกแล้ว "+S.titles.length+" จาก "+TITLES.length+" · แตะฉายาที่ได้แล้วเพื่อสวมใส่";
  $("titles").innerHTML = TITLES.map(t => {
    const got = S.titles.includes(t.id), on = S.equipped === t.id;
    return '<button class="tcard'+(got?'':' locked')+'" data-id="'+t.id+'" aria-pressed="'+on+'" '+(got?'':'disabled')+'>'+
      '<b>'+(got?t.name:'???')+'</b><small>'+t.desc+'</small>'+(on?'<span class="eq">กำลังใช้</span>':'')+'</button>';
  }).join("");
  $("titles").querySelectorAll(".tcard:not(.locked)").forEach(c => c.onclick = () => {
    S.equipped = S.equipped === c.dataset.id ? "" : c.dataset.id; save(); render();
  });
}

/* Free-log form */
let sel = "pushup";
function renderChips(){
  $("chips").innerHTML = Object.keys(EX).map(k =>
    '<button class="chip" data-k="'+k+'" aria-pressed="'+(k===sel)+'">'+EX[k].emoji+' '+EX[k].name+'</button>').join("");
  $("chips").querySelectorAll(".chip").forEach(c => c.onclick = () => {
    sel = c.dataset.k; renderChips(); $("unit").textContent = "("+EX[sel].unit+")"; updatePreview(); $("amount").focus();
  });
}
function updatePreview(){
  const n = Number($("amount").value), ex = EX[sel];
  $("addBtn").disabled = !(n>0);
  $("preview").innerHTML = n>0
    ? "จะได้ <b>+"+fmt(Math.max(1,Math.round(n*ex.rate)))+" XP</b> และเพิ่ม "+ex.stat+" · นับรวมในภารกิจถ้าเป็นท่าเดียวกัน"
    : "เลือกท่าแล้วกรอกจำนวนเพื่อดู XP ที่จะได้";
}
function addFromForm(){
  const n = Number($("amount").value);
  if (!(n>0)) return;
  logExercise(sel, n);
  $("amount").value = ""; updatePreview();
}

/* ================= UI ================= */
let toastT;
function toast(msg, undoable){
  $("toastMsg").textContent = msg;
  $("undoBtn").hidden = !undoable;
  $("toast").classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => $("toast").classList.remove("show"), undoable ? 4500 : 2000);
}
function modal(html, ready){
  const m = $("modal");
  m.innerHTML = '<div class="win" role="dialog" aria-modal="true">'+html+'</div>';
  m.hidden = false;
  m.onclick = e => { if (e.target === m) closeModal(); };
  if (ready) ready(m);
  const f = m.querySelector("input,button"); if (f) f.focus();
}
function closeModal(){ $("modal").hidden = true; }
function sys(title, text, big, popIt){
  modal('<header class="win-h">◆ แจ้งเตือนจากระบบ</header><div class="big'+(popIt?' pop':'')+'">'+esc(String(big))+'</div><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p><button class="btn" id="ok">รับทราบ</button>',
    m => m.querySelector("#ok").onclick = closeModal);
}
function askName(first){
  modal('<header class="win-h">◆ '+(first?"ลงทะเบียนฮันเตอร์":"แก้ชื่อ")+'</header><h3>'+(first?"คุณถูกเลือกให้เป็นฮันเตอร์":"ชื่อฮันเตอร์")+'</h3><p>'+
    (first?"ทำภารกิจประจำวัน ปราบบอสประจำสัปดาห์ แล้วไต่จากแรงค์ E ขึ้นไปถึง S":"ชื่อนี้แสดงบนหน้าต่างสถานะ")+
    '</p><input id="nm" maxlength="24" placeholder="ชื่อฮันเตอร์ของคุณ"><button class="btn" id="ok">'+(first?"ยอมรับและเริ่ม":"บันทึกชื่อ")+'</button>', m => {
    const i = m.querySelector("#nm"); i.value = S.name || "";
    const go = () => { S.name = i.value.trim() || "ฮันเตอร์"; save(); render(); closeModal(); };
    m.querySelector("#ok").onclick = go; i.onkeydown = e => { if (e.key === "Enter") go(); };
  });
}
function askAmount(type){
  const ex = EX[type];
  modal('<header class="win-h">◆ บันทึก'+ex.name+'</header><h3>'+ex.emoji+' '+ex.name+'</h3><p>กรอกจำนวน ('+ex.unit+')</p><input id="am" type="number" inputmode="numeric" min="1"><div class="btns"><button class="btn ghost" id="no">ยกเลิก</button><button class="btn" id="ok">บันทึก</button></div>', m => {
    const i = m.querySelector("#am");
    const go = () => { const n = Number(i.value); if (n>0) { closeModal(); logExercise(type, n); } };
    m.querySelector("#ok").onclick = go; m.querySelector("#no").onclick = closeModal;
    i.onkeydown = e => { if (e.key === "Enter") go(); };
  });
}

/* Tabs */
const TABS = ["status","quest","boss","titles"];
function showTab(t){
  if (!TABS.includes(t)) t = "status";
  TABS.forEach(x => $("tab-"+x).hidden = x !== t);
  document.querySelectorAll(".tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  window.scrollTo(0,0);
}
document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));

/* Wire */
$("amount").oninput = updatePreview;
$("amount").onkeydown = e => { if (e.key === "Enter") addFromForm(); };
$("addBtn").onclick = addFromForm;
$("claimBtn").onclick = claimDaily;
$("bossBtn").onclick = claimBoss;
$("editName").onclick = () => askName(false);
$("undoBtn").onclick = () => { $("toast").classList.remove("show"); undoLast(); };
$("resetBtn").onclick = () => modal('<header class="win-h">◆ ยืนยัน</header><h3>เริ่มใหม่ทั้งหมด?</h3><p>เลเวล ค่าสถานะ ประวัติ บอส และฉายาทั้งหมดจะถูกลบ และกู้คืนไม่ได้</p><div class="btns"><button class="btn ghost" id="no">ยกเลิก</button><button class="btn" id="yes">ลบและเริ่มใหม่</button></div>', m => {
  m.querySelector("#no").onclick = closeModal;
  m.querySelector("#yes").onclick = () => { S = fresh(S.name); save(); closeModal(); render(); showTab("status"); toast("เริ่มใหม่แล้ว"); };
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* Start */
const failed = rollDay();
renderChips(); render(); showTab((location.hash||"").slice(1));
if (!S.name) setTimeout(() => askName(true), 400);
else if (failed) sys("ภารกิจล้มเหลว", "ภารกิจประจำวันของ "+parse(failed).toLocaleDateString("th-TH",{day:"numeric",month:"short"})+" ไม่สำเร็จ สตรีคเริ่มนับใหม่ วันนี้เริ่มได้เลย", "⚠️");
setInterval(() => { if (S.daily && S.daily.date !== today()) render(); }, 60000);
})();
