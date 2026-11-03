"use strict";
/* ---------- Données ---------- */
const RAY=[["fl","Fruits et légumes"],["bo","Boulangerie"],["fr","Crèmerie et frais"],["bp","Boucherie et volaille"],["po","Poissonnerie"],["su","Surgelés"],["ep","Épicerie"],["ec","Épices et condiments"],["bs","Boissons"]];
const RAYL=Object.fromEntries(RAY);
const HCAT=[["cm","Cuisine et ménage"],["sb","Salle de bain"],["li","Linge"],["dv","Divers"]];
const HOME=[["papier_wc","Papier toilette (12 rouleaux)","sb",4.49,30],["essuie_tout","Essuie-tout (4 rouleaux)","cm",2.79,30],["liquide_vaisselle","Liquide vaisselle","cm",1.29,30],["tablettes_lv","Tablettes lave-vaisselle (40)","cm",4.99,40],["eponges","Éponges (lot)","cm",1.29,30],["sacs_poubelle","Sacs poubelle 30 L","cm",1.99,30],["multi_surfaces","Nettoyant multi-surfaces","cm",1.49,60],["gel_wc","Gel WC","cm",1.29,45],["papier_cuisson","Papier cuisson","cm",1.49,90],["aluminium","Papier aluminium","cm",1.49,90],["lessive","Lessive liquide (2 L)","li",5.99,45],["adoucissant","Adoucissant","li",2.49,60],["gel_douche","Gel douche","sb",1.49,30],["shampooing","Shampooing","sb",1.59,45],["dentifrice","Dentifrice","sb",1.19,30],["brosses_dents","Brosses à dents (lot)","sb",1.99,90],["deodorant","Déodorant","sb",1.69,30],["savon_mains","Savon pour les mains","sb",1.19,45],["cotons","Cotons et coton-tiges","sb",1.29,60],["rasoirs","Rasoirs jetables","sb",2.49,60],["protections","Protections hygiéniques","sb",2.49,30],["mouchoirs","Mouchoirs","dv",1.79,30],["piles","Piles AA (lot)","dv",2.99,180]];
const RHYTHM=[[7,"chaque semaine"],[14,"toutes les 2 semaines"],[21,"toutes les 3 semaines"],[30,"chaque mois"],[45,"toutes les 6 semaines"],[60,"tous les 2 mois"],[90,"tous les 3 mois"],[180,"tous les 6 mois"]];
const ZONES=[["Frigo",["fr","bp","po"]],["Congélateur",["su"]],["Fruits et légumes",["fl"]],["Placards",["ep","ec","bo","bs"]]];
const CATS={plat:["Beef","Chicken","Lamb","Pork","Seafood","Vegetarian","Vegan","Pasta","Miscellaneous"],entree:["Side","Starter"],dessert:["Dessert"],petitdej:["Breakfast"]};
const TYPE_OF=k=>Object.keys(CATS).find(t=>CATS[t].includes(k))||"plat";
const TYPE_LBL={plat:"Plats",entree:"Entrées et accompagnements",dessert:"Desserts",petitdej:"Petit-déjeuner"};
const PT_LBL={volaille:"Volaille",boeuf:"Bœuf",agneau:"Agneau",porc:"Porc",poisson:"Poisson",oeuf:"Œufs",vege:"Végétarien"};
const DIET_LBL={omni:"",vege:"Végétarien",vegan:"Vegan"};
const NUTS=new Set(["amande","noix","cajou","pistache","pecan","pignon","cacahuete","beurre_cacahuete"]);
const GLUTEN=new Set(["farine","pates","macaroni","lasagne","vermicelle","nouilles","semoule","boulgour","chapelure","pain","baguette","pita","tortilla","pains_burger","pate_feuilletee","pate_brisee","pate_filo","biere","biscuit","avoine","sauce_soja"]);
const SWAP={lait:"boisson_avoine",beurre:"margarine",creme:"creme_soja",creme_liquide:"creme_soja",yaourt:"yaourt_soja",fromage_frais:"yaourt_soja",parmesan:"fromage_vegetal",emmental:"fromage_vegetal",mozzarella:"fromage_vegetal",feta:"fromage_vegetal",chevre:"fromage_vegetal",brie:"fromage_vegetal",ricotta:"yaourt_soja",mascarpone:"creme_soja",miel:"sirop_erable",creme_dessert:"creme_soja",lait_concentre:"creme_soja"};
const DAYS=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const MEALS=[["m","Midi"],["s","Soir"]];
let CAT={},REC=[],RBY={},loaded=false;

/* ---------- État ---------- */
const KEY="popote-v2";
function defaults(){return{v:2,updated:0,
  profile:{sex:"",age:"",height:"",weight:"",activity:"1.375",goal:"maintien"},
  settings:{budget:45,persons:1,midi:true,soir:true,diet:"omni",noPork:false,noFish:false,allergies:[],pantry:null,maxTime:0,homeBudget:20},
  prices:{},plan:null,locks:{},done:{},checked:{},extras:[],stock:{},history:[],fav:[],backup:0,home:[],homeLog:[],ocr:{}}}
let S=defaults(),touched=false,tab="semaine";
let F={q:"",type:"plat",pt:"",diet:"",time:0,sort:"prix",fav:false,have:false,limit:24};
function merge(d){const b=defaults();const o=Object.assign(b,d);o.profile=Object.assign(b.profile,d.profile||{});o.settings=Object.assign(defaults().settings,d.settings||{});return o}
function loadLocal(){try{const raw=localStorage.getItem(KEY);if(raw){S=merge(JSON.parse(raw));touched=true}}catch(e){}}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

function commit(){touched=true;S.updated=Date.now();saveLocal();renderAll()}

/* ---------- Outils ---------- */
const eur=n=>(Math.round(n*100)/100).toLocaleString("fr-FR",{style:"currency",currency:"EUR"});
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const img=id=>"img/"+id+".jpg";
function packG(c){return c.unit==="g"?c.pack:c.unit==="ml"?c.pack*c.dens:c.pack*(c.pg||100)}
const price=id=>(S.prices[id]!=null&&S.prices[id]!==""?+S.prices[id]:CAT[id].price);
let PAN=null;
function pantrySet(){if(PAN)return PAN;PAN=pantryCalc();return PAN}
function pantryCalc(){if(!S.settings.pantry)return new Set(Object.values(CAT).filter(c=>c.fl.includes("B")).map(c=>c.id));return new Set(S.settings.pantry)}
function stockG(id){const s=S.stock[id];return s?+s.q||0:0}
function mondayOf(d){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(0,0,0,0);return x}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dayDate(i){const m=S.plan?new Date(S.plan.week+"T00:00:00"):mondayOf(new Date());m.setDate(m.getDate()+i);return m}
const shortDate=d=>d.toLocaleDateString("fr-FR",{day:"numeric",month:"long"});
function mins(m){if(!m)return"–";if(m<60)return m+" min";const h=Math.floor(m/60),r=m%60;return h+" h"+(r?" "+String(r).padStart(2,"0"):"")}

/* quantités lisibles */
const FRAC={0.25:"¼",0.5:"½",0.75:"¾"};
function niceCount(x){const r=Math.round(x*4)/4;const w=Math.floor(r),f=r-w;return((w||"")+(FRAC[f]||""))||"¼"}
function fmtG(c,g){
  if(c.unit==="cubes")return niceCount(g/(c.pg||10))+" cube"+(g/(c.pg||10)>1.1?"s":"");
  if(c.ray==="ec"&&g<25){const ml=g/(c.dens||1);if(ml<1.2)return"1 pincée";if(ml<=10)return niceCount(ml/5)+" c. à café";return niceCount(ml/15)+" c. à soupe"}
  if(c.pg&&!["g","ml"].includes(c.unit)&&c.unit!=="botte"&&c.unit!=="pot"&&c.unit!=="paquet"){const n=g/c.pg;return niceCount(n)+(n>1.1?" pièces":" pièce")+" ("+Math.max(5,Math.round(g/5)*5)+" g)"}
  if(c.pg&&["oeuf","oignon","oignon_rouge","citron","citron_vert","orange","pomme","avocat","tomate","carotte","courgette","aubergine","poivron","poivron_vert","banane","echalote","pdt","patate_douce","concombre","mangue","poulet_blanc","saucisse","pita","tortilla","pains_burger","baguette"].includes(c.id)){const n=g/c.pg;if(n>=.5&&n<=30)return niceCount(n)+" ("+Math.max(5,Math.round(g/5)*5)+" g)"}
  if(c.unit==="ml"){const ml=g/(c.dens||1);if(ml<=45)return niceCount(ml/15)+" c. à soupe";if(ml>=1000)return(Math.round(ml/100)/10).toLocaleString("fr-FR")+" L";return Math.round(ml/5)*5+" ml"}
  if(g>=1000)return(Math.round(g/100)/10).toLocaleString("fr-FR")+" kg";
  return Math.max(5,Math.round(g/5)*5)+" g";
}
function fmtStock(c,g){if(c.unit==="ml"){const ml=g/(c.dens||1);return ml>=1000?(Math.round(ml/100)/10).toLocaleString("fr-FR")+" L":Math.round(ml)+" ml"}if(c.pg&&!["g","ml"].includes(c.unit))return niceCount(g/c.pg)+" "+c.unit;return g>=1000?(Math.round(g/100)/10).toLocaleString("fr-FR")+" kg":Math.round(g)+" g"}
function packLabel(c){if(c.unit==="g")return c.pack>=1000?(c.pack/1000).toLocaleString("fr-FR")+" kg":c.pack+" g";if(c.unit==="ml")return c.pack>=1000?(c.pack/1000).toLocaleString("fr-FR")+" L":c.pack>=100?(c.pack/10)+" cl":c.pack+" ml";return c.pack+" "+c.unit}

/* ---------- Profil et objectifs ---------- */
function targets(){
  const p=S.profile;const w=+p.weight,h=+p.height,a=+p.age;
  if(!(w>30&&h>120&&a>12)||!p.sex)return null;
  const bmr=10*w+6.25*h-5*a+(p.sex==="h"?5:-161);
  const tdee=bmr*(+p.activity||1.375);
  let kcal=tdee,pk=1.2;
  if(p.goal==="perte"){kcal=Math.max(p.sex==="h"?1500:1200,tdee-450);pk=1.7}
  if(p.goal==="masse"){kcal=tdee+350;pk=1.9}
  const bmi=w/((h/100)**2);
  return{bmr:Math.round(bmr),tdee:Math.round(tdee),kcal:Math.round(kcal),prot:Math.round(w*pk),meal:Math.round(kcal*.35),mealProt:Math.round(w*pk*.35),bmi};
}

/* ---------- Recettes : régime, variantes, nutrition ---------- */
function variantOf(rec){
  const s=S.settings,al=new Set(s.allergies);
  let ings=rec.n,swapped=[];
  if(s.diet==="vegan"&&rec.g!=="vegan"){
    if(rec.g!=="vege")return null;
    const out=[];
    for(const it of ings){const c=CAT[it[0]];if(/[DEH]/.test(c.fl)){const to=SWAP[c.id];if(!to||c.fl.includes("E"))return null;out.push([to,it[1],it[2]]);swapped.push([c.fr,CAT[to].fr])}else out.push(it)}
    ings=out;
  }
  if(s.diet==="vege"&&rec.g==="omni")return null;
  for(const [id] of ings){const c=CAT[id];
    if(s.noPork&&c.fl.includes("P"))return null;
    if(s.noFish&&c.fl.includes("F"))return null;
    if(al.has("lactose")&&c.fl.includes("D"))return null;
    if(al.has("oeuf")&&c.fl.includes("E"))return null;
    if(al.has("noix")&&NUTS.has(id))return null;
    if(al.has("gluten")&&GLUTEN.has(id))return null;}
  return{ings,swapped};
}
let MEMO=new Map();
function clearMemo(){MEMO=new Map();PAN=null}
function info(rec){
  let m=MEMO.get(rec.i);if(m!==undefined)return m;
  const v=variantOf(rec);
  if(!v){MEMO.set(rec.i,null);return null}
  const pan=pantrySet();let kcal=0,prot=0,carb=0,fat=0,cost=0,haveN=0,needN=0;
  const per=v.ings.map(([id,g,meas])=>{
    const c=CAT[id];let gp=g/rec.s;let gn=gp;
    if((id==="huile"||id==="huile_olive"||id==="saindoux")&&g>100)gn=Math.max(60,g*(g>300?.06:.25))/rec.s;
    kcal+=c.kcal*gn/100;prot+=c.prot*gn/100;carb+=c.carb*gn/100;fat+=c.fat*gn/100;
    if(!pan.has(id)){cost+=price(id)*gp/packG(c);needN++;if(stockG(id)>=gp*.5)haveN++}
    return[id,gp,meas];
  });
  m={rec,per,swapped:v.swapped,kcal:Math.round(kcal),prot:Math.round(prot),carb:Math.round(carb),fat:Math.round(fat),cost,cover:needN?haveN/needN:1,type:TYPE_OF(rec.k),total:rec.p+rec.c};
  MEMO.set(rec.i,m);return m;
}
function factor(inf){const T=targets();if(!T||inf.type!=="plat")return 1;return clamp(Math.round(T.meal/Math.max(150,inf.kcal)*4)/4,.75,1.75)}
function slotPortions(inf){return factor(inf)+(Math.max(1,S.settings.persons)-1)}
const LEG=new Set(["pois_chiche","haricot_rouge","haricot_noir","haricot_blanc","lentille","tofu","oeuf","thon","sardine","feve","petit_pois","mais"]);
function substance(m){let g=0;for(const[id,gp]of m.per){const c=CAT[id];if(["fl","bp","po","su"].includes(c.ray)||LEG.has(id)||c.fl.includes("M")&&c.ray!=="ec")g+=gp}return g}
function eligiblePlats(){const out=[];for(const r of REC){const m=info(r);if(m&&m.sub===undefined)m.sub=substance(m);if(m&&((m.type==="plat"&&m.prot>=8&&m.kcal>=250&&m.sub>=120)||(m.type==="entree"&&m.prot>=14&&m.kcal>=300&&m.sub>=150))&&(!S.settings.maxTime||m.total<=S.settings.maxTime))out.push(m)}return out}

/* ---------- Besoins, stock, coût ---------- */
function addNeed(need,inf,portions){for(const[id,gp]of inf.per)need[id]=(need[id]||0)+gp*portions}
function itemCost(id,q){const c=CAT[id];const st=stockG(id),miss=q-st;if(q<=0||(miss<=0.5&&st>0))return 0;return Math.max(1,Math.ceil(miss/packG(c)-0.03))*price(id)}
function shopCost(need){const pan=pantrySet();let t=0;for(const id in need)if(!pan.has(id))t+=itemCost(id,need[id]);return t}
function slotList(){const o=[];for(let d=0;d<7;d++){if(S.settings.midi)o.push(d+"m");if(S.settings.soir)o.push(d+"s")}return o}
function planNeed(onlyTodo){const need={};if(!S.plan)return need;for(const k of slotList()){if(onlyTodo&&S.done[k])continue;const r=RBY[S.plan.slots[k]];const m=r&&info(r);if(m)addNeed(need,m,slotPortions(m))}return need}
function shopping(){
  const need=planNeed(true),pan=pantrySet(),items=[],fromStock=[];
  for(const id in need){if(pan.has(id))continue;const c=CAT[id],q=need[id],st=stockG(id),miss=q-st;
    if(miss<=0.5&&st>0){fromStock.push({id,q});continue}
    const packs=Math.max(1,Math.ceil(miss/packG(c)-0.03));items.push({id,q,miss,packs,cost:packs*price(id),left:packs*packG(c)-miss})}
  const extras=(S.extras||[]).reduce((a,e)=>a+(+e.price||0),0);
  const home=homeDue(),homeTotal=home.reduce((a,h)=>a+(+h.price||0),0);
  return{items,fromStock,total:items.reduce((a,i)=>a+i.cost,0)+extras,extras,home,homeTotal};
}
/* ---------- Placard maison ---------- */
const DAY=864e5;
function hLeft(h){return h.last?Math.round(h.every-(Date.now()-h.last)/DAY):null}
function hDue(h){if(h.low)return true;const l=hLeft(h);return l!==null&&l<=7}
function homeDue(){return(S.home||[]).filter(hDue)}
function monthSpent(){const d=new Date();const m0=new Date(d.getFullYear(),d.getMonth(),1).getTime();return(S.homeLog||[]).filter(x=>x.date>=m0).reduce((a,x)=>a+x.amount,0)}
function hBuy(list,amount){const now=Date.now();let t=0;for(const h of list){h.last=now;h.low=false;t+=+h.price||0}if(isFinite(amount))t=amount;if(t>0)S.homeLog.push({date:now,amount:Math.round(t*100)/100});S.homeLog=S.homeLog.filter(x=>x.date>now-400*DAY)}
function hNew(pid,name,cat,price,every){return{id:"h"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),pid,name,cat,price,every,last:0,low:false}}
function weekStats(){
  let kcal=0,prot=0,n=0;const T=targets();
  if(S.plan)for(const k of slotList()){const r=RBY[S.plan.slots[k]];const m=r&&info(r);if(m){const f=factor(m);kcal+=m.kcal*f;prot+=m.prot*f;n++}}
  const days=n?n/((S.settings.midi?1:0)+(S.settings.soir?1:0)||1):0;
  return{n,kcal:n?kcal/n:0,prot:n?prot/n:0,T};
}

/* ---------- Générateur de semaine ---------- */
function famKey(t){return t.toLowerCase().normalize("NFD").replace(/[^a-z ]/g,"").split(" ").filter(w=>w.length>2).slice(0,2).join(" ")}
function ptOf(m){return m.rec.y||"vege"}
function generate(keepLocked){
  const slots=slotList(),cands=eligiblePlats(),budget=+S.settings.budget||45;
  if(!slots.length){toast("Choisis au moins un repas (midi ou soir) dans ton profil.");return false}
  if(cands.length<4){toast("Trop peu de recettes correspondent à tes choix. Assouplis le régime ou les allergies.");return false}
  const T=targets()||{meal:650,mealProt:25},old=S.plan?S.plan.slots:{};
  const soon=new Set(Object.keys(S.stock).filter(id=>S.stock[id].soon&&stockG(id)>0));
  let best=null,bestScore=Infinity;
  for(let it=0;it<45;it++){
    const w=1+it/15;
    const assign={},need={},uses={};
    for(const k of slots)if(keepLocked&&S.locks[k]&&old[k]&&RBY[old[k]]&&info(RBY[old[k]])){const m=info(RBY[old[k]]);assign[k]=old[k];addNeed(need,m,slotPortions(m));uses[old[k]]=(uses[old[k]]||0)+1}
    let prevPt=null,prevId=null,nut=0;
    const order=slots.slice();
    for(const k of order){
      if(assign[k]){const m=info(RBY[assign[k]]);prevPt=ptOf(m);prevId=assign[k];continue}
      const sameDay=new Set(slots.filter(o=>o!==k&&o[0]===k[0]).map(o=>assign[o]));
      let pick=null,ps=Infinity;
      const pool=[];for(let j=0;j<120;j++)pool.push(cands[Math.floor(Math.random()*cands.length)]);
      for(const m of pool){
        const id=m.rec.i,u=uses[id]||0;if(u>=2||id===prevId||sameDay.has(id))continue;
        const p=slotPortions(m);let inc=0;const pan=pantrySet();
        for(const[iid,gp]of m.per){if(pan.has(iid))continue;const before=need[iid]||0;inc+=itemCost(iid,before+gp*p)-itemCost(iid,before)}
        let sc=inc*w+u*1.6*p+(ptOf(m)===prevPt?1.4:0)+Math.random()*2.2*p;
        if(T){const f=factor(m);sc+=Math.abs(m.kcal*f-T.meal)/T.meal*3+Math.max(0,T.mealProt-m.prot*f)*.06}
        for(const[iid]of m.per)if(soon.has(iid))sc-=2.5;
        const fam=famKey(m.rec.t);if(Object.values(assign).some(o=>famKey(RBY[o].t)===fam))sc+=6;
        if(sc<ps){ps=sc;pick=m}
      }
      if(!pick)pick=cands[Math.floor(Math.random()*cands.length)];
      assign[k]=pick.rec.i;addNeed(need,pick,slotPortions(pick));uses[pick.rec.i]=(uses[pick.rec.i]||0)+1;prevPt=ptOf(pick);prevId=pick.rec.i;
      if(T){const f=factor(pick);nut+=Math.abs(pick.kcal*f-T.meal)/T.meal}
    }
    const cost=shopCost(need)+(S.extras||[]).reduce((a,e)=>a+(+e.price||0),0);
    const distinct=Object.keys(uses).length,types=new Set(Object.values(assign).map(id=>ptOf(info(RBY[id])))).size;
    const score=Math.max(0,cost-budget)*25+cost*.25-Math.min(distinct,9)*.5-types*.8+nut*2;
    if(score<bestScore){bestScore=score;best=assign}
  }
  S.plan={week:iso(mondayOf(new Date())),slots:best};
  if(!keepLocked)S.locks={};
  S.done={};S.checked={};
  return true;
}
function swapSlot(k){
  const cur=S.plan.slots[k],cands=eligiblePlats().filter(m=>m.rec.i!==cur);if(!cands.length)return;
  const need={};for(const o of slotList()){if(o===k)continue;const r=RBY[S.plan.slots[o]];const m=r&&info(r);if(m)addNeed(need,m,slotPortions(m))}
  const base=shopCost(need),T=targets()||{meal:650,mealProt:25},used=new Set(Object.values(S.plan.slots));
  const pool=[];for(let j=0;j<60;j++)pool.push(cands[Math.floor(Math.random()*cands.length)]);
  let best=null,bs=Infinity;
  for(const m of pool){const n2=Object.assign({},need);addNeed(n2,m,slotPortions(m));let sc=shopCost(n2)-base+(used.has(m.rec.i)?2:0)+Math.random()*2;if(T)sc+=Math.abs(m.kcal*factor(m)-T.meal)/T.meal*3;if(sc<bs){bs=sc;best=m}}
  S.plan.slots[k]=best.rec.i;delete S.done[k];commit();toast("Nouveau plat : "+best.rec.t);
}
function cookSlot(k){
  const r=RBY[S.plan.slots[k]];const m=r&&info(r);if(!m)return;
  if(S.done[k]){delete S.done[k];for(const[id,gp]of m.per){if(!S.stock[id])S.stock[id]={q:0};S.stock[id].q=stockG(id)+gp*slotPortions(m)}commit();toast("Repas remis à faire, ingrédients rendus au frigo.");return}
  S.done[k]=1;const pan=pantrySet();
  for(const[id,gp]of m.per){if(pan.has(id)||!S.stock[id])continue;const q=stockG(id)-gp*slotPortions(m);if(q<=1)delete S.stock[id];else S.stock[id].q=q}
  commit();toast("Bon appétit ! Ingrédients retirés du frigo.");
}

/* ---------- Rendu ---------- */
function renderAll(){if(!loaded)return;clearMemo();renderWeek();renderShop();renderRecipes();renderFrigo();renderMaison();renderProfil()}
function budgetState(t,b){return t>b?"over":t>b*.9?"warn":"ok"}
function mealHTML(k){
  const id=S.plan&&S.plan.slots[k];const r=id&&RBY[id];const m=r&&info(r);const lbl=k[1]==="m"?"Midi":"Soir";
  if(!m)return`<div class="meal empty"><span class="lbl">${lbl}</span><div class="row"><button class="btn sm" data-act="pick" data-k="${k}">Choisir un plat</button><button class="btn sm" data-act="swap" data-k="${k}">Me proposer un plat</button></div></div>`;
  const f=factor(m),lock=!!S.locks[k],done=!!S.done[k];
  return`<div class="meal${done?" done":""}">
    <img src="${img(r.i)}" alt="" loading="lazy" width="84" height="84">
    <div><span class="lbl">${lbl}${done?" · cuisiné":""}</span><br><button class="t" data-act="open" data-id="${r.i}">${esc(r.t)}</button>
    <div class="small muted num">${mins(m.total)} · ${eur(m.cost*f)} · ${Math.round(m.kcal*f)} kcal · ${Math.round(m.prot*f)} g prot.${f!==1?` · portion ×${String(f).replace(".",",")}`:""}</div></div>
    <div class="acts">
      <button class="btn" data-act="swap" data-k="${k}">Changer</button>
      <button class="btn" data-act="pick" data-k="${k}">Choisir</button>
      <button class="btn" data-act="lock" data-k="${k}" aria-pressed="${lock}">${lock?"Gardé":"Garder"}</button>
      <button class="btn" data-act="cook" data-k="${k}" aria-pressed="${done}">${done?"Cuisiné ✓":"C'est cuisiné"}</button>
      <button class="btn" data-act="clear" data-k="${k}" aria-label="Vider ce repas">Vider</button>
    </div></div>`;
}
function renderWeek(){
  const el=document.getElementById("v-semaine");const sh=shopping(),b=+S.settings.budget||0,st=budgetState(sh.total,b),W=weekStats(),T=W.T;
  const hasPlan=S.plan&&Object.keys(S.plan.slots||{}).length;
  const kst=T&&W.n?(Math.abs(W.kcal-T.meal)/T.meal<.15?"ok":"warn"):"";
  let html=`<div class="row" style="justify-content:space-between;align-items:flex-end">
    <div><h2>Ma semaine</h2><p class="hand muted">${S.plan?"du "+shortDate(dayDate(0))+" au "+shortDate(dayDate(6)):"à remplir"}</p></div>
    <div class="row">${hasPlan?`<button class="btn" data-act="regen">Régénérer (garde les plats gardés)</button>`:""}<button class="btn primary" data-act="gen">${hasPlan?"Nouvelle semaine":"Composer ma semaine"}</button></div></div>
  <div class="tape-strip">
    <div class="stat ${hasPlan?st:""}"><span class="small muted">Courses à faire</span><b class="num">${eur(sh.total)}</b><span class="small muted">sur ${eur(b)} de budget</span><div class="bar ${st}"><i style="width:${clamp(b?sh.total/b*100:0,0,100)}%"></i></div></div>
    <div class="stat ${kst}"><span class="small muted">Calories par repas</span><b class="num">${W.n?Math.round(W.kcal):"–"}</b><span class="small muted">${T?"objectif "+T.meal+" kcal":"renseigne ton profil pour un objectif"}</span></div>
    <div class="stat ${T&&W.n?(W.prot>=T.mealProt*.9?"ok":"warn"):""}"><span class="small muted">Protéines par repas</span><b class="num">${W.n?Math.round(W.prot)+" g":"–"}</b><span class="small muted">${T?"objectif "+T.mealProt+" g":"objectif selon ton poids"}</span></div>
    <div class="stat"><span class="small muted">Déjà dans ton frigo</span><b class="num">${sh.fromStock.length}</b><span class="small muted">ingrédients utilisés cette semaine</span></div>
  </div>`;
  if(!hasPlan){html+=`<div class="page empty-state"><p class="hand" style="font-size:1.8rem">Une page blanche…</p><p class="muted" style="max-width:52ch">Popote choisit ${slotList().length} repas parmi ${eligiblePlats().length} recettes adaptées à ton régime, en restant dans ton budget et en partageant les ingrédients pour éviter le gaspillage.</p><button class="btn primary" data-act="gen">Composer ma semaine</button>${targets()?"":`<button class="btn ghost" data-tab-go="profil">Renseigner d'abord mon profil</button>`}</div>`}
  else{html+=`<div class="days">`+DAYS.map((d,i)=>{const ks=MEALS.filter(([s])=>S.settings[s==="m"?"midi":"soir"]).map(([s])=>i+s);if(!ks.length)return"";return`<div class="day"><div><h3>${d}</h3><span class="hand">${shortDate(dayDate(i))}</span></div><div class="meals">${ks.map(mealHTML).join("")}</div></div>`}).join("")+`</div>`}
  el.innerHTML=html;
}
function renderShop(){
  const el=document.getElementById("v-courses");const sh=shopping(),b=+S.settings.budget||0;
  const by={};for(const it of sh.items)(by[CAT[it.id].ray]=by[CAT[it.id].ray]||[]).push(it);
  let list="";
  for(const[r,l]of RAY){const items=by[r];if(!items)continue;items.sort((a,b)=>CAT[a.id].fr.localeCompare(CAT[b.id].fr));
    list+=`<h4>${l}</h4>`+items.map(it=>{const c=CAT[it.id],on=!!S.checked[it.id];return`<label class="li${on?" on":""}"><input type="checkbox" data-check="${it.id}" ${on?"checked":""}><span><span class="nm">${it.packs>1?it.packs+" × ":""}${esc(c.fr)}</span> <span class="small muted">(${packLabel(c)})</span><br><span class="small muted">il te faut ${fmtStock(c,it.miss)}${stockG(it.id)>0?", tu en as déjà "+fmtStock(c,stockG(it.id)):""} · reste ${fmtStock(c,Math.max(0,it.left))}</span></span><span class="num">${eur(it.cost)}</span></label>`}).join("")}
  const hl=sh.home.map(h=>{const k="h:"+h.id,on=!!S.checked[k];return`<label class="li${on?" on":""}"><input type="checkbox" data-check="${k}" ${on?"checked":""}><span><span class="nm">${esc(h.name)}</span><br><span class="small muted">${h.low?"presque fini":"rachat habituel"}</span></span><span class="num">${eur(+h.price||0)}</span></label>`}).join("");
  const ex=(S.extras||[]).map((e,i)=>`<div class="li"><span></span><span>${esc(e.name)}</span><span class="row num">${eur(+e.price||0)} <button class="btn ghost sm" data-act="delextra" data-i="${i}" aria-label="Retirer ${esc(e.name)}">Retirer</button></span></div>`).join("");
  const hist=(S.history||[]).slice(-8);const mx=Math.max(b,...hist.map(h=>h.total),1);
  el.innerHTML=`<div class="row" style="justify-content:space-between;align-items:flex-end"><div><h2>Ma liste de courses</h2><p class="hand muted">rangée dans l'ordre des rayons Lidl</p></div>
    <div class="row"><button class="btn" data-act="copy">Copier la liste</button><label class="btn" for="scanFile" style="cursor:pointer">Scanner mon ticket</label><input id="scanFile" type="file" accept="image/*" class="sr"><button class="btn primary" data-act="bought">J'ai fait mes courses</button></div></div>
  ${!S.plan&&!sh.home.length?`<div class="page empty-state"><p class="muted">Compose d'abord ta semaine, la liste se remplit toute seule.</p><button class="btn primary" data-tab-go="semaine">Aller à ma semaine</button></div>`:`
  <div class="ticket">
    <p class="hand" style="text-align:center;font-size:1.6rem">Lidl · semaine du ${shortDate(dayDate(0))}</p>
    ${list||(S.plan?`<p class="note green" style="margin-top:10px">Tout est déjà dans ton frigo et tes placards.</p>`:"")}
    ${hl?`<h4>Droguerie et hygiène</h4>${hl}`:""}
    <h4>En plus</h4>${ex||`<p class="small muted">Café, goûter… ajoute ce qui n'est pas dans les recettes.</p>`}
    <form class="row" id="extraForm" style="margin-top:8px"><label class="sr" for="exName">Article</label><input id="exName" placeholder="Café moulu" style="flex:2;min-width:140px"><label class="sr" for="exPrice">Prix</label><input id="exPrice" type="number" step="0.01" min="0" placeholder="2,49" style="width:100px"><button class="btn sm">Ajouter</button></form>
    <div class="total"><span>Total alimentation</span><span class="num">${eur(sh.total)}</span></div>
    <p class="small ${sh.total>b?"":"muted"}" style="${sh.total>b?"color:var(--bad)":""}">${sh.total>b?"Dépassement de "+eur(sh.total-b)+". Change un plat ou regénère la semaine.":"Il te reste "+eur(b-sh.total)+" sur ton budget."}</p>
    ${hl?`<div class="row" style="justify-content:space-between;margin-top:10px"><span>Total maison <span class="small muted">(budget à part)</span></span><b class="num">${eur(sh.homeTotal)}</b></div>`:""}
    ${sh.fromStock.length?`<h4>Déjà chez toi</h4><p class="small muted">${sh.fromStock.map(x=>esc(CAT[x.id].fr)).join(", ")}</p>`:""}
    <p class="small muted" style="margin-top:12px">Les prix sont des estimations Lidl. Corrige-les dans Profil avec ton ticket.</p>
  </div>`}
  ${hist.length?`<div class="page"><h3>Mes derniers tickets</h3><div style="display:grid;gap:8px;margin-top:8px">${hist.map(h=>`<div class="row" style="gap:12px"><span class="small num" style="width:92px">${new Date(h.date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</span><div class="bar ${h.total>b?"over":""}" style="flex:1;margin:0"><i style="width:${h.total/mx*100}%"></i></div><span class="num small" style="width:80px;text-align:right">${eur(h.total)}</span></div>`).join("")}</div></div>`:""}`;
}
function recFiltered(){
  const q=F.q.trim().toLowerCase();let out=[];
  for(const r of REC){const m=info(r);if(!m)continue;
    if(F.type&&m.type!==F.type)continue;
    if(F.pt&&(r.y||"vege")!==F.pt&&!(F.pt==="vege"&&r.g!=="omni"))continue;
    if(F.diet&&!(F.diet==="vegan"?(r.g==="vegan"||m.swapped.length):r.g!=="omni"))continue;
    if(F.time&&m.total>F.time)continue;
    if(F.fav&&!S.fav.includes(r.i))continue;
    if(F.have&&m.cover<.5)continue;
    if(q&&!(r.t.toLowerCase().includes(q)||r.en.toLowerCase().includes(q)||m.per.some(([id])=>CAT[id].fr.toLowerCase().includes(q))))continue;
    out.push(m)}
  const so={prix:(a,b)=>a.cost-b.cost,temps:(a,b)=>a.total-b.total,prot:(a,b)=>b.prot-a.prot,kcal:(a,b)=>a.kcal-b.kcal,frigo:(a,b)=>b.cover-a.cover}[F.sort];
  if(F.have)out.sort((a,b)=>b.cover-a.cover||a.cost-b.cost);else if(so)out.sort(so);
  return out;
}
function cardHTML(m){const r=m.rec;return`<button class="rcard" data-act="open" data-id="${r.i}"><div class="photo"><img src="${img(r.i)}" alt="" loading="lazy" width="350" height="263"></div><h3>${esc(r.t)}</h3><div class="meta"><span class="tag num">${mins(m.total)}</span><span class="tag num">${eur(m.cost)} / part</span><span class="tag num">${m.kcal} kcal</span>${r.g!=="omni"?`<span class="tag veg">${DIET_LBL[r.g]}</span>`:""}${m.swapped.length?`<span class="tag veg">Variante vegan</span>`:""}${F.have?`<span class="tag ${m.cover>=.75?"veg":""}">${Math.round(m.cover*100)} % au frigo</span>`:""}</div></button>`}
function chipRow(name,opts,cur){return`<div class="chips" role="group" aria-label="${name}">`+opts.map(([v,l])=>`<button class="chip" data-f="${name}" data-v="${v}" aria-pressed="${String(cur)===String(v)}">${l}</button>`).join("")+`</div>`}
function renderRecipes(){
  const el=document.getElementById("v-recettes");const all=recFiltered();const shown=all.slice(0,F.limit);
  const focus=document.activeElement&&document.activeElement.id==="rq";
  el.innerHTML=`<div><h2>Recettes</h2><p class="hand muted">${REC.length} fiches avec photo, traduites de TheMealDB</p></div>
  <div class="filters page">
    <label class="f"><span>Rechercher un plat ou un ingrédient</span><input id="rq" class="search" type="search" placeholder="poulet, lentilles, gratin…" value="${esc(F.q)}"></label>
    ${chipRow("type",[["plat","Plats"],["entree","Entrées et accompagnements"],["dessert","Desserts"],["petitdej","Petit-déjeuner"],["","Tout"]],F.type)}
    ${chipRow("pt",[["","Toutes protéines"],["volaille","Volaille"],["boeuf","Bœuf"],["porc","Porc"],["agneau","Agneau"],["poisson","Poisson"],["vege","Sans viande"]],F.pt)}
    <div class="row">
      ${chipRow("diet",[["","Tous régimes"],["vege","Végétarien"],["vegan","Vegan"]],F.diet)}
      ${chipRow("time",[["0","Tous temps"],["30","30 min max"],["45","45 min max"],["60","1 h max"]],F.time)}
    </div>
    <div class="row">
      <label class="f" style="flex-direction:row"><span class="sr">Trier par</span><select id="rsort" aria-label="Trier par">${[["prix","Les moins chers"],["temps","Les plus rapides"],["prot","Les plus protéinés"],["kcal","Les plus légers"]].map(([v,l])=>`<option value="${v}" ${F.sort===v?"selected":""}>${l}</option>`).join("")}</select></label>
      <button class="chip" data-f="have" aria-pressed="${F.have}">Avec ce que j'ai</button>
      <button class="chip" data-f="fav" aria-pressed="${F.fav}">Mes favoris</button>
    </div>
    ${S.settings.diet!=="omni"||S.settings.allergies.length||S.settings.noPork||S.settings.noFish?`<p class="small muted">Filtré selon ton régime et tes allergies (Profil).</p>`:""}
  </div>
  <p class="small muted num" aria-live="polite">${all.length} recette${all.length>1?"s":""}</p>
  ${shown.length?`<div class="cards">${shown.map(cardHTML).join("")}</div>`:`<div class="page empty-state"><p class="muted">Aucune recette avec ces filtres. Essaie d'en retirer un.</p></div>`}
  ${all.length>F.limit?`<div class="row" style="justify-content:center"><button class="btn" data-act="more">Voir ${Math.min(24,all.length-F.limit)} recettes de plus</button></div>`:""}`;
  if(focus){const i=document.getElementById("rq");i.focus();i.setSelectionRange(i.value.length,i.value.length)}
}
function renderFrigo(){
  const el=document.getElementById("v-frigo");const pan=pantrySet();
  const ids=Object.keys(S.stock).filter(id=>CAT[id]);
  let zones="";
  for(const[z,rs]of ZONES){const l=ids.filter(id=>rs.includes(CAT[id].ray)).sort((a,b)=>CAT[a].fr.localeCompare(CAT[b].fr));if(!l.length)continue;
    zones+=`<div class="page"><h3>${z}</h3><div class="stock">${l.map(id=>{const c=CAT[id],s=S.stock[id];const unit=c.unit==="ml"?"ml":(c.pg&&!["g","ml"].includes(c.unit))?c.unit:"g";const val=unit==="ml"?Math.round(s.q/(c.dens||1)):unit==="g"?Math.round(s.q):Math.round(s.q/c.pg*4)/4;
      return`<div class="sitem"><span>${esc(c.fr)}${s.soon?` <span class="tag warn">à finir vite</span>`:""}</span><label class="sr" for="st_${id}">Quantité de ${esc(c.fr)} en ${unit}</label><span class="row" style="gap:4px;flex-wrap:nowrap"><input id="st_${id}" type="number" min="0" step="any" value="${val}" data-stock="${id}" data-unit="${unit}"><span class="small muted">${unit}</span></span><span class="row" style="gap:2px"><button class="btn sm" data-act="soon" data-id="${id}" aria-pressed="${!!s.soon}">À finir</button><button class="btn ghost sm" data-act="delstock" data-id="${id}" aria-label="Retirer ${esc(c.fr)}">Retirer</button></span></div>`}).join("")}</div></div>`}
  const opts=Object.values(CAT).filter(c=>!c.fl.includes("X")).sort((a,b)=>a.fr.localeCompare(b.fr)).map(c=>`<option value="${esc(c.fr)}"></option>`).join("");
  el.innerHTML=`<div><h2>Mon frigo et mes placards</h2><p class="hand muted">ce que tu as déjà, Popote le cuisine en premier</p></div>
  <form class="page" id="stockForm"><h3>Ajouter un produit</h3><div class="row" style="margin-top:8px"><label class="sr" for="stName">Produit</label><input id="stName" list="catList" placeholder="Carottes, riz, œufs…" style="flex:2;min-width:180px" autocomplete="off"><datalist id="catList">${opts}</datalist><label class="sr" for="stQty">Quantité</label><input id="stQty" type="number" min="0" step="any" placeholder="Qté" style="width:90px"><span class="small muted" id="stUnit">un paquet si vide</span><button class="btn primary">Ajouter</button></div>
  <p class="small muted" style="margin-top:8px">Quand tu valides tes courses, les produits achetés arrivent ici. Quand tu marques un plat « cuisiné », ses ingrédients sont retirés.</p></form>
  ${zones||`<div class="page empty-state"><p class="hand" style="font-size:1.6rem">Frigo vide</p><p class="muted">Ajoute ce que tu as déjà : tes menus l'utiliseront et ta liste de courses sera plus courte.</p></div>`}
  <div class="page"><h3>Placard de base</h3><p class="small muted" style="margin:4px 0 10px">Ces produits sont considérés comme toujours chez toi : ils ne comptent ni dans la liste ni dans le budget.</p>
  <div class="chips">${Object.values(CAT).filter(c=>c.fl.includes("B")||(S.settings.pantry||[]).includes(c.id)).map(c=>`<button class="chip" data-act="pantry" data-id="${c.id}" aria-pressed="${pan.has(c.id)}">${esc(c.fr)}</button>`).join("")}</div></div>`;
}
function renderMaison(){
  const el=document.getElementById("v-maison");const H=S.home||[];const hb=+S.settings.homeBudget||0,sp=monthSpent(),due=homeDue(),st=budgetState(sp,hb);
  const monthly=H.reduce((a,h)=>a+(+h.price||0)*30/(h.every||30),0);
  const rh=cur=>RHYTHM.map(([v,lb])=>`<option value="${v}" ${+cur===v?"selected":""}>${lb}</option>`).join("");
  const row=h=>{const l=hLeft(h);
    const stt=h.low?`<span class="tag warn">presque fini · sur ta liste</span>`:l===null?`<span class="small muted">date du dernier achat inconnue</span>`:l<=7?`<span class="tag warn">à racheter ${l<=0?"maintenant":"d'ici "+l+" j"} · sur ta liste</span>`:`<span class="small muted">encore environ ${l} jours</span>`;
    return`<div class="hitem"><div><b>${esc(h.name)}</b><br>${stt}</div><span class="num">${eur(+h.price||0)}</span>
    <div class="ctl"><label class="sr" for="hp_${h.id}">Prix de ${esc(h.name)} en euros</label><input id="hp_${h.id}" type="number" min="0" step="0.01" value="${(+h.price||0).toFixed(2)}" data-hprice="${h.id}" inputmode="decimal">
    <label class="sr" for="he_${h.id}">Rythme de rachat de ${esc(h.name)}</label><select id="he_${h.id}" data-hevery="${h.id}">${rh(h.every)}</select>
    <button class="btn sm" data-act="hlow" data-id="${h.id}" aria-pressed="${!!h.low}">Presque fini</button><button class="btn sm" data-act="hbuy" data-id="${h.id}">Acheté</button><button class="btn ghost sm" data-act="hdel" data-id="${h.id}" aria-label="Retirer ${esc(h.name)}">Retirer</button></div></div>`};
  let groups="";for(const[c,lb]of HCAT){const l=H.filter(h=>h.cat===c).sort((a,b)=>a.name.localeCompare(b.name));if(l.length)groups+=`<div class="page"><h3>${lb}</h3>${l.map(row).join("")}</div>`}
  const have=new Set(H.map(h=>h.pid));const sugg=HOME.filter(x=>!have.has(x[0]));
  el.innerHTML=`<div><h2>Mon placard maison</h2><p class="hand muted">ménage, hygiène, linge : ce qu'il faut racheter, au bon moment</p></div>
  <div class="tape-strip">
    <div class="stat ${hb&&sp?st:""}"><span class="small muted">Dépensé ce mois-ci</span><b class="num">${eur(sp)}</b><span class="small muted">sur ${eur(hb)} de budget maison</span><div class="bar ${st}"><i style="width:${clamp(hb?sp/hb*100:0,0,100)}%"></i></div></div>
    <div class="stat ${due.length?"warn":""}"><span class="small muted">À racheter cette semaine</span><b class="num">${due.length}</b><span class="small muted">${due.length?eur(due.reduce((a,h)=>a+(+h.price||0),0))+", déjà sur ta liste":"rien pour l'instant"}</span></div>
    <div class="stat"><span class="small muted">Coût moyen par mois</span><b class="num">${eur(monthly)}</b><span class="small muted">selon tes rythmes de rachat</span></div>
  </div>
  <form class="page" id="homeForm"><h3>Ajouter un produit</h3><div class="row" style="margin-top:8px">
    <label class="sr" for="hName">Produit</label><input id="hName" list="homeList" placeholder="Lessive, dentifrice…" style="flex:2;min-width:180px" autocomplete="off"><datalist id="homeList">${HOME.map(x=>`<option value="${esc(x[1])}"></option>`).join("")}</datalist>
    <label class="sr" for="hPrice">Prix en euros</label><input id="hPrice" type="number" min="0" step="0.01" placeholder="Prix" style="width:90px" inputmode="decimal">
    <label class="sr" for="hEvery">Rythme de rachat</label><select id="hEvery" style="width:auto">${rh(30)}</select>
    <button class="btn primary">Ajouter</button></div>
    <p class="small muted" style="margin-top:8px">Touche « Acheté » ou valide tes courses : Popote note la date et remet le produit sur ta liste quand il faut le racheter. « Presque fini » l'ajoute tout de suite.</p></form>
  ${groups||`<div class="page empty-state"><p class="hand" style="font-size:1.6rem">Placard vide</p><p class="muted">Ajoute ce que tu rachètes régulièrement, ou pars des essentiels ci-dessous.</p></div>`}
  ${sugg.length?`<div class="page"><h3>Essentiels à ajouter</h3><p class="small muted" style="margin:4px 0 10px">Prix moyens estimés, modifiables ensuite.</p><div class="chips">${sugg.map(x=>`<button class="chip" data-act="hadd" data-id="${x[0]}">${esc(x[1])} · ${eur(x[3])}</button>`).join("")}</div></div>`:""}
  <div class="page"><h3>Budget maison</h3><label class="f" style="max-width:260px;margin-top:8px"><span>Budget par mois (€)</span><input id="sHomeBudget" type="number" min="0" step="1" value="${hb}" inputmode="numeric"></label><p class="small muted" style="margin-top:6px">Séparé du budget alimentation de la semaine.</p></div>`;
}
function renderProfil(){
  const el=document.getElementById("v-profil");const p=S.profile,s=S.settings,T=targets();
  const sel=(id,opts,cur)=>`<select id="${id}">${opts.map(([v,l])=>`<option value="${v}" ${String(cur)===String(v)?"selected":""}>${l}</option>`).join("")}</select>`;
  const al=new Set(s.allergies);
  el.innerHTML=`<div><h2>Mon profil</h2><p class="hand muted">pour des portions et des menus à ta mesure</p></div>
  <div class="page"><h3>Moi</h3><div class="grid-f" style="margin-top:10px">
    <label class="f"><span>Sexe</span>${sel("pSex",[["","Choisir"],["f","Femme"],["h","Homme"]],p.sex)}</label>
    <label class="f"><span>Âge</span><input id="pAge" type="number" min="13" max="100" value="${esc(p.age)}" inputmode="numeric"></label>
    <label class="f"><span>Taille (cm)</span><input id="pHeight" type="number" min="120" max="230" value="${esc(p.height)}" inputmode="numeric"></label>
    <label class="f"><span>Poids (kg)</span><input id="pWeight" type="number" min="30" max="250" step="0.1" value="${esc(p.weight)}" inputmode="decimal"></label>
    <label class="f"><span>Activité</span>${sel("pAct",[["1.2","Sédentaire"],["1.375","Légère (1 à 3 séances)"],["1.55","Modérée (3 à 5 séances)"],["1.725","Intense (6 à 7 séances)"],["1.9","Très intense"]],p.activity)}</label>
    <label class="f"><span>Objectif</span>${sel("pGoal",[["perte","Perte de poids"],["maintien","Maintien"],["masse","Prise de masse"]],p.goal)}</label>
  </div>
  ${T?`<hr class="dash"><div class="tape-strip"><div class="stat"><span class="small muted">Objectif par jour</span><b class="num">${T.kcal} kcal</b><span class="small muted">dépense estimée ${T.tdee} kcal</span></div><div class="stat"><span class="small muted">Protéines par jour</span><b class="num">${T.prot} g</b></div><div class="stat"><span class="small muted">Par repas (midi ou soir)</span><b class="num">${T.meal} kcal</b><span class="small muted">${T.mealProt} g de protéines</span></div></div>
  <p class="small muted" style="margin-top:10px">Calcul Mifflin-St Jeor, à titre indicatif : ce n'est pas un avis médical. Les portions de tes plats sont ajustées pour approcher ton objectif.</p>`:`<p class="small muted" style="margin-top:10px">Renseigne ces champs pour calculer ton objectif calorique et adapter les portions.</p>`}
  </div>
  <div class="page"><h3>Mon alimentation</h3>
    <div style="margin-top:10px;display:grid;gap:12px">
    <div><p style="font-weight:700;margin-bottom:6px">Régime</p>${chipRow("diet_s",[["omni","Je mange de tout"],["vege","Végétarien"],["vegan","Vegan"]],s.diet)}</div>
    <div><p style="font-weight:700;margin-bottom:6px">J'évite</p><div class="chips"><button class="chip" data-set="noPork" aria-pressed="${s.noPork}">Porc</button><button class="chip" data-set="noFish" aria-pressed="${s.noFish}">Poisson et fruits de mer</button>${[["lactose","Lactose"],["oeuf","Œufs"],["gluten","Gluten"],["noix","Fruits à coque"]].map(([v,l])=>`<button class="chip" data-allergy="${v}" aria-pressed="${al.has(v)}">${l}</button>`).join("")}</div></div>
    <p class="small muted">${eligiblePlats().length} plats correspondent à tes choix.${s.diet==="vegan"?" Les plats végétariens avec lait, beurre, crème ou fromage sont proposés en variante vegan.":""}</p>
    </div></div>
  <div class="page"><h3>Ma semaine type</h3><div class="grid-f" style="margin-top:10px">
    <label class="f"><span>Budget courses par semaine (€)</span><input id="sBudget" type="number" min="5" step="1" value="${s.budget}" inputmode="numeric"></label>
    <label class="f"><span>Personnes à table</span><input id="sPersons" type="number" min="1" max="8" step="1" value="${s.persons}" inputmode="numeric"></label>
    <label class="f"><span>Temps de cuisine max</span>${sel("sTime",[["0","Peu importe"],["30","30 min"],["45","45 min"],["60","1 h"],["90","1 h 30"]],s.maxTime)}</label>
  </div>
  <div class="chips" style="margin-top:12px"><button class="chip" data-set="midi" aria-pressed="${s.midi}">Repas du midi</button><button class="chip" data-set="soir" aria-pressed="${s.soir}">Repas du soir</button></div></div>
  <details class="page"><summary style="cursor:pointer;font-family:var(--f-display);font-weight:600;font-size:1.15rem">Mes prix Lidl</summary>
    <p class="small muted" style="margin:8px 0">Corrige un prix avec ton ticket : budget et menus se recalculent.</p>
    <label class="f"><span class="sr">Chercher un produit</span><input id="priceQ" type="search" placeholder="Chercher un produit"></label>
    <div class="scroll"><table class="prices" id="priceTable"></table></div>
  </details>
  <div class="page" id="backup"><h3>Ma sauvegarde</h3>
    <p class="small muted" style="margin:6px 0 10px">Tes données ne quittent jamais ce téléphone : pas de compte, pas de serveur. Exporte une sauvegarde pour changer d'appareil ou en cas de nettoyage du navigateur.${S.backup?` Dernière sauvegarde le ${new Date(S.backup).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}.`:" Aucune sauvegarde pour l'instant."}</p>
    <label class="f" style="max-width:340px"><span>Mot de passe (facultatif)</span><input id="bkPass" type="password" autocomplete="new-password" placeholder="Laisse vide pour ne pas chiffrer"></label>
    <p class="small muted" style="margin:6px 0 10px">Avec un mot de passe, le fichier est chiffré : sans lui, personne ne peut le lire. Il n'existe aucun moyen de le retrouver si tu l'oublies.</p>
    <div class="row"><button class="btn primary" data-act="export">Exporter ma sauvegarde</button><label class="btn" for="bkFile" style="cursor:pointer">Importer une sauvegarde</label><input id="bkFile" type="file" accept=".json,application/json" class="sr"></div>
    <div id="bkImport" style="margin-top:12px" hidden></div></div>
  <div class="page"><h3>Remettre à zéro</h3><p class="small muted" style="margin:6px 0 10px">Efface profil, menus, frigo, placard maison et tickets sur cet appareil.</p><div class="row" id="resetRow"><button class="btn" data-act="reset">Tout effacer</button></div></div>
  <p class="credit">Recettes et photos : <a href="https://www.themealdb.com/" target="_blank" rel="noopener">TheMealDB</a>, traduites et adaptées. Valeurs nutritionnelles moyennes de type table CIQUAL, prix Lidl estimés.</p>`;
  renderPrices("");
}
function renderPrices(q){
  const t=document.getElementById("priceTable");if(!t)return;q=q.toLowerCase();
  const list=Object.values(CAT).filter(c=>!c.fl.includes("X")&&(!q||c.fr.toLowerCase().includes(q))).sort((a,b)=>a.fr.localeCompare(b.fr)).slice(0,q?60:30);
  t.innerHTML=`<tr><th>Produit</th><th>Format</th><th>Prix</th></tr>`+list.map(c=>`<tr><td>${esc(c.fr)}</td><td class="small muted">${packLabel(c)}</td><td><label class="sr" for="pr_${c.id}">Prix de ${esc(c.fr)}</label><input id="pr_${c.id}" type="number" min="0" step="0.01" value="${price(c.id).toFixed(2)}" data-price="${c.id}"></td></tr>`).join("")+(q?"":`<tr><td colspan="3" class="small muted">Cherche un produit pour voir les ${Object.keys(CAT).length} prix.</td></tr>`);
}

/* ---------- Fiche recette ---------- */
let curRec=null,curPortions=1;
function openModal(html){document.getElementById("sheet").innerHTML=`<button class="btn sm x" data-act="close">Fermer</button>`+html;document.getElementById("modal").hidden=false;document.body.style.overflow="hidden";document.querySelector("#sheet .x").focus()}
function closeModal(){document.getElementById("modal").hidden=true;document.body.style.overflow="";curRec=null}
function showRecipe(id,portions){
  const r=RBY[id];if(!r)return;let m=info(r);let outside=false;
  if(!m){outside=true;const save=S.settings;S.settings=Object.assign({},save,{diet:"omni",noPork:false,noFish:false,allergies:[]});MEMO.delete(r.i);m=info(r);MEMO.delete(r.i);S.settings=save}
  if(curRec!==id)curPortions=portions||Math.max(1,S.settings.persons);curRec=id;
  const fav=S.fav.includes(id);const p=curPortions;
  const ings=m.per.map(([iid,gp,meas])=>{const c=CAT[iid];const pan=pantrySet().has(iid);const have=!pan&&stockG(iid)>=gp*p*.9;return`<li><span class="q">${fmtG(c,gp*p)}</span><span>${esc(c.fr)}${pan?` <span class="have">· placard</span>`:have?` <span class="have">· au frigo</span>`:""}</span></li>`}).join("");
  const steps=r.f;
  const marmiton="https://www.marmiton.org/recettes/recherche.aspx?aqt="+encodeURIComponent(r.t.replace(/\(.*?\)/g,"").trim());
  openModal(`<div class="rhead"><div class="photo"><img src="${img(id)}" alt="${esc(r.t)}" width="350" height="263"></div>
    <div><p class="hand" style="color:var(--accent)">${esc(TYPE_LBL[m.type])}${r.a?" · cuisine "+esc(areaFr(r.a)):""}</p><h2 class="rtitle">${esc(r.t)}</h2><p class="small muted">${esc(r.en)}</p>
    <div class="timings"><div><small title="Préparation">Prépa</small><b>${mins(r.p)}</b></div><div><small>Cuisson</small><b>${mins(r.c)}</b></div><div><small>Repos</small><b>${r.w?mins(r.w):"–"}</b></div><div><small>Difficulté</small><b>${r.d[0].toUpperCase()+r.d.slice(1)}</b></div></div>
    <div class="macros num"><span><b>${eur(m.cost)}</b> / part</span><span><b>${m.kcal}</b> kcal</span><span><b>${m.prot} g</b> protéines</span><span><b>${m.carb} g</b> glucides</span><span><b>${m.fat} g</b> lipides</span></div>
    <p class="small muted" style="margin-top:4px">Valeurs pour une part. Recette d'origine prévue pour ${r.s} part${r.s>1?"s":""} (estimation).</p>
    <div class="row" style="margin-top:12px"><span class="stepper" role="group" aria-label="Nombre de parts"><button data-act="pminus" aria-label="Une part de moins">−</button><span class="num" aria-live="polite">${p} part${p>1?"s":""}</span><button data-act="pplus" aria-label="Une part de plus">+</button></span>
    <button class="btn" data-act="fav" data-id="${id}" aria-pressed="${fav}">${fav?"Dans mes favoris":"Ajouter aux favoris"}</button>
    ${outside?"":`<button class="btn primary" data-act="addweek" data-id="${id}">Mettre dans ma semaine</button>`}</div></div></div>
  ${outside?`<p class="note" style="margin-top:16px">Cette recette ne correspond pas à ton régime ou à tes allergies.</p>`:""}
  ${m.swapped.length?`<p class="note green" style="margin-top:16px">Variante vegan : ${m.swapped.map(([a,b])=>esc(a)+" → "+esc(b)).join(", ")}. La photo montre le plat d'origine.</p>`:""}
  <div class="rbody"><div><h3>Ingrédients</h3><ul class="ings">${ings}</ul></div>
  <div><h3>Préparation</h3><div id="stepsBox">${steps?stepsHTML(steps):`<ol class="steps" lang="en">${r.st.map(s=>`<li><span>${esc(s)}</span></li>`).join("")}</ol>`}</div></div></div>
  <p class="credit">Recette et photo : <a href="https://www.themealdb.com/meal/${id}" target="_blank" rel="noopener">TheMealDB</a>${r.src?` · <a href="${esc(r.src)}" target="_blank" rel="noopener">source d'origine</a>`:""}${r.yt?` · <a href="${esc(r.yt)}" target="_blank" rel="noopener">vidéo</a>`:""} · <a href="${marmiton}" target="_blank" rel="noopener">Voir des recettes proches sur Marmiton</a>. Temps et difficulté estimés à partir des étapes.</p>`);
}
function stepsHTML(a){return`<ol class="steps">${a.map(s=>`<li><span>${esc(s)}</span></li>`).join("")}</ol>`}
const AREA={French:"française",Italian:"italienne",Spanish:"espagnole",British:"britannique",American:"américaine",Chinese:"chinoise",Thai:"thaïe",Vietnamese:"vietnamienne",Turkish:"turque",Jamaican:"jamaïcaine",Polish:"polonaise",Indian:"indienne",Canadian:"canadienne",Algerian:"algérienne",Japanese:"japonaise",Mexican:"mexicaine",Greek:"grecque",Moroccan:"marocaine",Tunisian:"tunisienne",Egyptian:"égyptienne",Irish:"irlandaise",Dutch:"néerlandaise",Norwegian:"norvégienne",Portuguese:"portugaise",Croatian:"croate",Russian:"russe",Ukrainian:"ukrainienne",Malaysian:"malaise",Filipino:"philippine",Syrian:"syrienne",Kenyan:"kényane",Uruguayan:"uruguayenne",Venezuelan:"vénézuélienne",Argentinian:"argentine",Belgian:"belge",Danish:"danoise",Cambodian:"cambodgienne",Albanian:"albanaise",Bulgarian:"bulgare",Australian:"australienne",Chilean:"chilienne",Brazilian:"brésilienne",Slovakian:"slovaque",Lebanese:"libanaise",Saudi:"saoudienne"};
const AREA2={France:"française",Italy:"italienne",India:"indienne",Norway:"norvégienne","United States":"américaine",Venezuela:"vénézuélienne",Argentina:"argentine",Netherlands:"néerlandaise","Saudi Arabian":"saoudienne"};
function areaFr(a){return AREA[a]||AREA2[a]||a}
function pickFor(k,q){
  const qq=(q||"").toLowerCase();const list=eligiblePlats().filter(m=>!qq||m.rec.t.toLowerCase().includes(qq)||m.per.some(([id])=>CAT[id].fr.toLowerCase().includes(qq))).sort((a,b)=>a.cost-b.cost).slice(0,40);
  const d=+k[0];
  openModal(`<h2 class="rtitle">Choisir un plat</h2><p class="hand muted">${DAYS[d]} ${k[1]==="m"?"midi":"soir"}</p>
  <label class="f" style="margin:12px 0"><span class="sr">Chercher</span><input id="pickQ" type="search" placeholder="Chercher un plat ou un ingrédient" value="${esc(q||"")}" data-k="${k}"></label>
  <div style="display:grid;gap:8px" id="pickList">${list.map(m=>`<button class="meal" style="text-align:left;font:inherit;color:var(--ink);cursor:pointer;width:100%" data-act="place" data-id="${m.rec.i}" data-k="${k}"><img src="${img(m.rec.i)}" alt="" loading="lazy" width="84" height="84"><span><span class="t" style="display:block">${esc(m.rec.t)}</span><span class="small muted num">${mins(m.total)} · ${eur(m.cost)} / part · ${m.kcal} kcal · ${m.prot} g prot.</span></span></button>`).join("")||`<p class="muted">Aucun plat trouvé.</p>`}</div>`);
  const i=document.getElementById("pickQ");if(q){i.focus();i.setSelectionRange(i.value.length,i.value.length)}
}
function addToWeek(id){
  if(!S.plan)S.plan={week:iso(mondayOf(new Date())),slots:{}};
  const free=slotList().find(k=>!S.plan.slots[k]);
  if(free){S.plan.slots[free]=id;S.locks[free]=true;commit();closeModal();toast("Ajouté "+DAYS[+free[0]].toLowerCase()+" "+(free[1]==="m"?"midi":"soir")+" et gardé.");return}
  openModal(`<h2 class="rtitle">Où le mettre ?</h2><p class="muted" style="margin-bottom:12px">Ta semaine est pleine : choisis le repas à remplacer.</p><div style="display:grid;gap:8px">${slotList().map(k=>{const r=RBY[S.plan.slots[k]];return`<button class="btn" style="justify-content:flex-start" data-act="place" data-id="${id}" data-k="${k}">${DAYS[+k[0]]} ${k[1]==="m"?"midi":"soir"} · <span class="muted">${esc(r?r.t:"vide")}</span></button>`}).join("")}</div>`);
}


/* ---------- Sauvegarde : export et import ---------- */
const B64=u=>{let s="";const b=new Uint8Array(u);for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode.apply(null,b.subarray(i,i+8192));return btoa(s)};
const UB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function deriveKey(pass,salt,iter){
  const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pass),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt,iterations:iter},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
let LASTFILE=null,PENDING=null;
async function buildBackup(){
  const pass=(document.getElementById("bkPass")||{}).value||"";
  const date=new Date();const out={app:"popote",kind:"sauvegarde",v:1,date:date.toISOString()};
  const json=JSON.stringify(S);
  if(pass){
    if(!(window.crypto&&crypto.subtle))throw new Error("crypto");
    const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iter=310000;
    const key=await deriveKey(pass,salt,iter);
    const ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(json));
    out.enc={alg:"AES-GCM",kdf:"PBKDF2-SHA256",iter,salt:B64(salt),iv:B64(iv),ct:B64(ct)};
  }else out.data=S;
  const name="popote-sauvegarde-"+iso(date)+(pass?"-chiffree":"")+".json";
  return new File([JSON.stringify(out)],name,{type:"application/json"});
}
async function exportBackup(){
  let f;try{f=await buildBackup()}catch(e){toast("Chiffrement indisponible sur ce navigateur.");return}
  LASTFILE=f;
  const url=URL.createObjectURL(f);const a=document.createElement("a");a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  S.backup=Date.now();commit();
  const z=document.getElementById("bkImport");
  if(z){z.hidden=false;z.innerHTML=`<p class="note green">Fichier « ${esc(f.name)} » créé. Range-le dans tes fichiers ou envoie-le sur ton nouvel appareil.</p>${navigator.canShare&&navigator.canShare({files:[f]})?`<div class="row" style="margin-top:8px"><button class="btn" data-act="shareBk">Envoyer ou enregistrer ailleurs</button></div>`:""}`}
}
async function shareBackup(){if(!LASTFILE)return;try{await navigator.share({files:[LASTFILE],title:"Sauvegarde Popote"})}catch(e){}}
function readBackup(file){
  const z=document.getElementById("bkImport");z.hidden=false;
  if(file.size>20e6){z.innerHTML=`<p class="note">Ce fichier est trop gros pour être une sauvegarde Popote.</p>`;return}
  const fr=new FileReader();
  fr.onload=()=>{
    let o=null;try{o=JSON.parse(fr.result)}catch(e){}
    if(!o||o.app!=="popote"||o.kind!=="sauvegarde"||!(o.data||o.enc)){z.innerHTML=`<p class="note">Ce fichier n'est pas une sauvegarde Popote.</p>`;return}
    PENDING=o;
    if(o.enc){z.innerHTML=`<p class="small" style="margin-bottom:6px">Cette sauvegarde est chiffrée.</p><div class="row"><label class="sr" for="bkUnlock">Mot de passe de la sauvegarde</label><input id="bkUnlock" type="password" autocomplete="current-password" placeholder="Mot de passe" style="max-width:220px"><button class="btn primary" data-act="unlock">Déchiffrer</button><button class="btn ghost" data-act="restore0">Annuler</button></div><p class="small" id="bkErr" style="color:var(--bad);margin-top:6px" role="alert"></p>`;document.getElementById("bkUnlock").focus()}
    else previewBackup(o.data,o.date);
  };
  fr.onerror=()=>{z.innerHTML=`<p class="note">Impossible de lire ce fichier.</p>`};
  fr.readAsText(file);
}
async function unlockBackup(){
  const o=PENDING;if(!o||!o.enc)return;const pass=document.getElementById("bkUnlock").value;const err=document.getElementById("bkErr");
  if(!pass){err.textContent="Entre le mot de passe.";return}
  try{
    const key=await deriveKey(pass,UB64(o.enc.salt),o.enc.iter||310000);
    const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:UB64(o.enc.iv)},key,UB64(o.enc.ct));
    previewBackup(JSON.parse(new TextDecoder().decode(pt)),o.date);
  }catch(e){err.textContent="Mot de passe incorrect, ou fichier abîmé."}
}
function previewBackup(d,date){
  const z=document.getElementById("bkImport");
  if(!d||typeof d!=="object"||d.v!==2){z.innerHTML=`<p class="note">Cette sauvegarde vient d'une version de Popote que je ne sais pas lire.</p>`;PENDING=null;return}
  PENDING={data:d};
  const n=k=>Array.isArray(d[k])?d[k].length:Object.keys(d[k]||{}).length;
  z.innerHTML=`<div class="note"><p><b>Sauvegarde du ${new Date(date||d.updated||Date.now()).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</b></p>
  <p class="small" style="margin:4px 0 8px">${n("stock")} produits au frigo, ${n("history")} tickets, ${n("fav")} favoris${d.plan?", un menu de semaine":""}${d.profile&&d.profile.weight?", ton profil":""}.</p>
  <p class="small" style="margin-bottom:8px">Elle remplacera tout ce qui est sur cet appareil.</p>
  <div class="row"><button class="btn primary" data-act="restore">Remplacer mes données</button><button class="btn ghost" data-act="restore0">Annuler</button></div></div>`;
}
function restoreBackup(){
  if(!PENDING||!PENDING.data)return;
  S=merge(JSON.parse(JSON.stringify(PENDING.data)));PENDING=null;commit();toast("Sauvegarde restaurée.");
}

/* ---------- Actions ---------- */
/* ---------- Scan de ticket (lecture sur l'appareil, rien n'est envoyé) ---------- */
const norm=t=>String(t).toLowerCase().replace(/œ/g,"oe").replace(/æ/g,"ae").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const TSKIP=/sous.?total|carte|\bcb\b|espece|rendu|tva|montant|merci|siret|ticket|caisse|avoir|points|www|articles?\b|paiement|transaction|contact/i;
function parseTicket(txt){
  const rows=[];let total=null;
  for(let line of txt.split(/\n/)){line=line.replace(/\s+/g," ").trim();if(line.length<3)continue;
    const mq=line.match(/^(\d{1,2})\s*[xX×*]\s*(\d+[.,]\d{2})/);if(mq){if(rows.length)rows[rows.length-1].qty=+mq[1];continue}
    const m=line.match(/^(.*?[A-Za-zÀ-ÿ]{2}.*?)\s+(-?\d{1,3}[.,]\d{2})\s*(?:€|EUR)?\s*[A-D1-4]?\s*$/);if(!m)continue;
    const label=m[1].trim(),val=parseFloat(m[2].replace(",","."));
    if(/total|a payer|à payer/i.test(label)){total=val;continue}
    if(TSKIP.test(label))continue;
    if(val<0&&rows.length){rows[rows.length-1].price=Math.max(0,Math.round((rows[rows.length-1].price+val)*100)/100);continue}
    if(val>0)rows.push({label,price:val,qty:1})}
  return{rows,total};
}
function scanOptions(){const o=new Map();for(const c of Object.values(CAT))if(!c.fl.includes("X"))o.set(c.fr,"c:"+c.id);const pids=new Set();for(const h of S.home){o.set("Maison · "+h.name,"h:"+h.id);pids.add(h.pid)}for(const x of HOME)if(!pids.has(x[0]))o.set("Maison · "+x[1],"p:"+x[0]);o.set("Ignorer cette ligne","x");return o}
function guessScan(label,opts){
  const n=norm(label);if(S.ocr[n]){for(const[k,v]of opts)if(v===S.ocr[n])return k}
  const toks=n.split(" ").filter(w=>w.length>2&&!/^\d+$/.test(w));if(!toks.length)return"";
  let best="",bs=0;
  for(const[k,v]of opts){if(v==="x")continue;const nt=norm(k.replace(/^Maison · /,"")).split(" ").filter(w=>w.length>2);let sc=0;
    for(const t of toks)for(const w of nt){if(w===t)sc+=2;else if(t.length>=4&&w.length>=4&&(w.startsWith(t.slice(0,4))||t.startsWith(w.slice(0,4))))sc+=1}
    sc=sc/Math.max(2,nt.length);if(sc>bs){bs=sc;best=k}}
  return bs>=1?best:"";
}
let TESS=null,SCAN=null;
function loadTess(){return TESS||(TESS=new Promise((ok,ko)=>{const el=document.createElement("script");el.src="vendor/tesseract/tesseract.min.js";el.onload=()=>ok(window.Tesseract);el.onerror=()=>{TESS=null;ko(new Error("chargement"))};document.head.appendChild(el)}))}
async function prepImage(file){
  const bmp=await createImageBitmap(file);const k=Math.min(1,2200/Math.max(bmp.width,bmp.height));
  const cv=document.createElement("canvas");cv.width=Math.round(bmp.width*k);cv.height=Math.round(bmp.height*k);
  const ctx=cv.getContext("2d");ctx.drawImage(bmp,0,0,cv.width,cv.height);
  const d=ctx.getImageData(0,0,cv.width,cv.height),px=d.data;
  for(let i=0;i<px.length;i+=4){let g=.299*px[i]+.587*px[i+1]+.114*px[i+2];g=clamp((g-140)*1.6+140,0,255);px[i]=px[i+1]=px[i+2]=g}
  ctx.putImageData(d,0,0);return cv;
}
async function scanTicket(file){
  openModal(`<h2 class="rtitle">Lecture du ticket</h2><p class="muted" id="scanMsg" aria-live="polite">Préparation de la photo…</p><div class="bar"><i id="scanBar" style="width:2%"></i></div><p class="small muted" style="margin-top:10px">Tout se fait sur ton téléphone : la photo n'est envoyée nulle part.</p>`);
  const msg=t=>{const e=document.getElementById("scanMsg");if(e)e.textContent=t},bar=v=>{const e=document.getElementById("scanBar");if(e)e.style.width=Math.round(v*100)+"%"};
  try{
    const T=await loadTess();const cv=await prepImage(file);msg("Chargement du lecteur (la première fois peut prendre quelques secondes)…");
    const base=new URL("vendor/tesseract/",location.href).href;
    const w=await T.createWorker("fra",1,{workerPath:base+"worker.min.js",corePath:base,langPath:base+"lang",workerBlobURL:false,gzip:true,
      logger:m=>{if(m.status==="recognizing text"){msg("Lecture du ticket…");bar(.1+.9*m.progress)}}});
    await w.setParameters({tessedit_pageseg_mode:"6",preserve_interword_spaces:"1"});
    const{data}=await w.recognize(cv);await w.terminate();
    showScan(parseTicket(data.text||""));
  }catch(e){msg("Impossible de lire ce ticket. Réessaie avec une photo bien à plat, nette et éclairée.")}
}
function showScan(res){
  const opts=scanOptions();SCAN={rows:res.rows,opts};
  const sum=res.rows.reduce((a,r)=>a+r.price,0);
  if(!res.rows.length){openModal(`<h2 class="rtitle">Ticket illisible</h2><p class="muted">Aucune ligne de prix n'a été reconnue. Reprends la photo bien à plat, de près, sans reflet, ticket entier dans le cadre.</p>`);return}
  openModal(`<h2 class="rtitle">Vérifie ton ticket</h2><p class="muted">${res.rows.length} lignes lues. Associe chaque ligne à un produit : Popote retiendra tes choix pour les prochains tickets.</p>
  <form id="scanForm" style="display:grid;gap:4px;margin-top:12px"><datalist id="scanList">${[...opts.keys()].map(k=>`<option value="${esc(k)}"></option>`).join("")}</datalist>
  ${res.rows.map((r,i)=>`<div class="scanrow"><div class="row" style="justify-content:space-between;gap:8px"><span class="small" style="font-family:ui-monospace,Menlo,monospace">${esc(r.label)}</span><b class="num">${eur(r.price)}</b></div>
    <div class="row" style="gap:6px;flex-wrap:nowrap"><label class="sr" for="sr_${i}">Produit pour ${esc(r.label)}</label><input id="sr_${i}" list="scanList" data-srow="${i}" value="${esc(guessScan(r.label,opts))}" placeholder="Produit, ou laisse vide" style="flex:1;min-width:0" autocomplete="off">
    <label class="sr" for="sq_${i}">Nombre</label><input id="sq_${i}" type="number" min="1" step="1" value="${r.qty}" style="width:64px" inputmode="numeric"></div></div>`).join("")}
  <label class="f" style="margin-top:10px"><span>Total payé (€)</span><input id="scanTotal" type="number" min="0" step="0.01" value="${(res.total||sum).toFixed(2)}" inputmode="decimal"></label>
  <label class="row" style="gap:8px"><input type="checkbox" id="scanPrices" checked style="width:22px;height:22px;min-height:0"> <span>Mettre à jour mes prix avec ce ticket</span></label>
  <p class="small muted">Les produits reconnus vont dans ton frigo ou ton placard maison. Les lignes laissées vides comptent seulement dans la dépense.</p>
  <div class="row" style="margin-top:6px"><button class="btn primary">Valider le ticket</button><button type="button" class="btn ghost" data-act="close">Annuler</button></div></form>`);
}
function applyScan(){
  if(!SCAN)return;const upd=document.getElementById("scanPrices").checked;let food=0,home=0,n=0;const hs=[];
  SCAN.rows.forEach((r,i)=>{const txt=document.getElementById("sr_"+i).value.trim();let v=SCAN.opts.get(txt)||"";const q=Math.max(1,parseInt(document.getElementById("sq_"+i).value)||1);
    if(v.startsWith("p:")){const x=HOME.find(x=>x[0]===v.slice(2));const h=hNew(x[0],x[1],x[2],x[3],x[4]);S.home.push(h);SCAN.opts.set(txt,"h:"+h.id);v="h:"+h.id}
    if(v)S.ocr[norm(r.label)]=v;
    if(v.startsWith("c:")){const id=v.slice(2),c=CAT[id];S.stock[id]={q:stockG(id)+q*packG(c),soon:false};if(upd)S.prices[id]=Math.round(r.price/q*100)/100;food+=r.price;n++}
    else if(v.startsWith("h:")){const h=S.home.find(h=>h.id===v.slice(2));if(h){if(upd)h.price=Math.round(r.price/q*100)/100;hs.push(h);home+=r.price;n++}}
    else if(v!=="x")food+=r.price});
  if(hs.length)hBuy(hs,home);
  const tot=parseFloat(document.getElementById("scanTotal").value);const f=isFinite(tot)?Math.max(0,tot-home):food;
  if(f>0){S.history.push({date:Date.now(),total:Math.round(f*100)/100});S.history=S.history.slice(-26)}
  S.checked={};SCAN=null;commit();closeModal();toast(n+" produit"+(n>1?"s":"")+" rangé"+(n>1?"s":"")+", ticket enregistré.");
}
let toastT=null;
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2800)}
function setTab(t){tab=t;document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===t));document.querySelectorAll("section.view").forEach(v=>v.hidden=v.id!=="v-"+t);window.scrollTo({top:0});try{localStorage.setItem("popote-tab",t)}catch(e){}}
function copyList(){
  const sh=shopping();const by={};for(const it of sh.items)(by[CAT[it.id].ray]=by[CAT[it.id].ray]||[]).push(it);
  let txt="Courses Lidl, semaine du "+shortDate(dayDate(0))+"\n";
  for(const[r,l]of RAY){if(!by[r])continue;txt+="\n"+l.toUpperCase()+"\n"+by[r].map(it=>"- "+(it.packs>1?it.packs+" × ":"")+CAT[it.id].fr+" ("+packLabel(CAT[it.id])+")").join("\n")+"\n"}
  if(S.extras.length)txt+="\nEN PLUS\n"+S.extras.map(e=>"- "+e.name).join("\n")+"\n";
  if(sh.home.length)txt+="\nDROGUERIE ET HYGIÈNE\n"+sh.home.map(h=>"- "+h.name).join("\n")+"\n";
  txt+="\nTotal alimentation : "+eur(sh.total)+(sh.home.length?"\nTotal maison : "+eur(sh.homeTotal):"");
  try{navigator.clipboard.writeText(txt).then(()=>toast("Liste copiée."),()=>fallbackCopy(txt))}catch(e){fallbackCopy(txt)}
}
function fallbackCopy(txt){openModal(`<h2 class="rtitle">Ma liste</h2><p class="small muted">Sélectionne le texte puis copie-le.</p><label class="sr" for="copyArea">Liste</label><textarea id="copyArea" rows="16" style="width:100%;margin-top:10px">${esc(txt)}</textarea>`);const t=document.getElementById("copyArea");t.focus();t.select()}
function bought(){
  const sh=shopping();if(!sh.items.length&&!sh.extras&&!sh.home.length){toast("Rien à acheter cette semaine.");return}
  openModal(`<h2 class="rtitle">Courses faites ?</h2><p class="muted">Les produits de la liste seront ajoutés à ton frigo et le ticket enregistré.</p>
  <form id="boughtForm" style="display:grid;gap:12px;margin-top:14px"><label class="f"><span>Montant alimentation sur le ticket (€)</span><input id="bTotal" type="number" min="0" step="0.01" value="${sh.total.toFixed(2)}" inputmode="decimal"></label>
  ${sh.home.length?`<label class="f"><span>Montant maison et hygiène (€)</span><input id="bHome" type="number" min="0" step="0.01" value="${sh.homeTotal.toFixed(2)}" inputmode="decimal"></label>`:""}
  <label class="row" style="gap:8px"><input type="checkbox" id="bOnly" style="width:22px;height:22px;min-height:0" ${Object.keys(S.checked).length?"checked":""}> <span>Ajouter seulement les articles cochés</span></label>
  <div class="row"><button class="btn primary">Enregistrer</button><button type="button" class="btn ghost" data-act="close">Annuler</button></div></form>`);
}
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-tab]");if(t&&t.closest("nav")){setTab(t.dataset.tab);return}
  const g=e.target.closest("[data-tab-go]");if(g){closeModal();setTab(g.dataset.tabGo);return}
  if(e.target.id==="modal"){closeModal();return}
  const f=e.target.closest("[data-f]");
  if(f){const n=f.dataset.f;if(n==="have"||n==="fav")F[n]=!F[n];else if(n==="diet_s"){S.settings.diet=f.dataset.v;commit();return}else{F[n]=n==="time"?+f.dataset.v:f.dataset.v}F.limit=24;renderRecipes();return}
  const st=e.target.closest("[data-set]");if(st){S.settings[st.dataset.set]=!S.settings[st.dataset.set];commit();return}
  const al=e.target.closest("[data-allergy]");if(al){const a=new Set(S.settings.allergies);a.has(al.dataset.allergy)?a.delete(al.dataset.allergy):a.add(al.dataset.allergy);S.settings.allergies=[...a];commit();return}
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act,k=b.dataset.k,id=b.dataset.id;
  if(a==="close")closeModal();
  else if(a==="gen"||a==="regen"){b.disabled=true;b.textContent="Je compose ta semaine…";setTimeout(()=>{if(generate(a==="regen")){commit();toast(a==="regen"?"Semaine regénérée, plats gardés conservés.":"Semaine composée.")}else renderWeek()},30)}
  else if(a==="swap")swapSlot(k);
  else if(a==="pick")pickFor(k);
  else if(a==="place"){if(!S.plan)S.plan={week:iso(mondayOf(new Date())),slots:{}};S.plan.slots[k]=id;S.locks[k]=true;delete S.done[k];commit();closeModal();toast("Plat placé et gardé.")}
  else if(a==="lock"){S.locks[k]=!S.locks[k];commit()}
  else if(a==="cook")cookSlot(k);
  else if(a==="clear"){delete S.plan.slots[k];delete S.locks[k];delete S.done[k];commit()}
  else if(a==="open"){showRecipe(id)}
  else if(a==="pplus"){curPortions=Math.min(20,curPortions+1);showRecipe(curRec,curPortions)}
  else if(a==="pminus"){curPortions=Math.max(1,curPortions-1);showRecipe(curRec,curPortions)}
  else if(a==="fav"){const s=new Set(S.fav);s.has(id)?s.delete(id):s.add(id);S.fav=[...s];commit();showRecipe(id,curPortions)}
  else if(a==="addweek")addToWeek(id);
  else if(a==="more"){F.limit+=24;renderRecipes()}
  else if(a==="copy")copyList();
  else if(a==="bought")bought();
  else if(a==="delextra"){S.extras.splice(+b.dataset.i,1);commit()}
  else if(a==="soon"){S.stock[id].soon=!S.stock[id].soon;commit()}
  else if(a==="delstock"){delete S.stock[id];commit()}
  else if(a==="pantry"){const s=new Set(pantrySet());s.has(id)?s.delete(id):s.add(id);S.settings.pantry=[...s];commit()}
  else if(a==="reset"){document.getElementById("resetRow").innerHTML=`<span class="small" style="color:var(--bad)">Tout sera effacé.</span><button class="btn" data-act="reset2" style="border-color:var(--bad);color:var(--bad)">Oui, tout effacer</button><button class="btn ghost" data-act="reset0">Annuler</button>`}
  else if(a==="reset0")renderProfil();
  else if(a==="hadd"){const x=HOME.find(x=>x[0]===id);if(x){S.home.push(hNew(x[0],x[1],x[2],x[3],x[4]));commit();toast(x[1]+" ajouté au placard maison.")}}
  else if(a==="hlow"){const h=S.home.find(h=>h.id===id);if(h){h.low=!h.low;commit();if(h.low)toast("Ajouté à ta liste de courses.")}}
  else if(a==="hbuy"){const h=S.home.find(h=>h.id===id);if(h){hBuy([h]);delete S.checked["h:"+id];commit();toast("Noté : prochain rachat dans "+h.every+" jours.")}}
  else if(a==="hdel"){S.home=S.home.filter(h=>h.id!==id);delete S.checked["h:"+id];commit()}
  else if(a==="export")exportBackup();
  else if(a==="shareBk")shareBackup();
  else if(a==="unlock")unlockBackup();
  else if(a==="restore")restoreBackup();
  else if(a==="restore0"){PENDING=null;const z=document.getElementById("bkImport");z.hidden=true;z.innerHTML="";document.getElementById("bkFile").value=""}
  else if(a==="reset2"){S=defaults();commit();toast("Tout est effacé.")}
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="bkFile"){if(t.files&&t.files[0])readBackup(t.files[0]);return}
  if(t.id==="scanFile"){if(t.files&&t.files[0])scanTicket(t.files[0]);t.value="";return}
  if(t.dataset.check){if(t.checked)S.checked[t.dataset.check]=1;else delete S.checked[t.dataset.check];commit();return}
  if(t.dataset.hprice){const h=S.home.find(h=>h.id===t.dataset.hprice);const v=parseFloat(t.value);if(h&&isFinite(v)&&v>=0){h.price=v;commit()}return}
  if(t.dataset.hevery){const h=S.home.find(h=>h.id===t.dataset.hevery);if(h){h.every=+t.value||30;commit()}return}
  if(t.dataset.price){const v=parseFloat(t.value);if(isFinite(v)&&v>=0){S.prices[t.dataset.price]=v;commit()}return}
  if(t.dataset.stock){const c=CAT[t.dataset.stock];const v=parseFloat(t.value);if(!isFinite(v)||v<=0){delete S.stock[c.id]}else{const u=t.dataset.unit;S.stock[c.id].q=u==="ml"?v*(c.dens||1):u==="g"?v:v*c.pg}commit();return}
  const map={pSex:["profile","sex"],pAge:["profile","age"],pHeight:["profile","height"],pWeight:["profile","weight"],pAct:["profile","activity"],pGoal:["profile","goal"],sBudget:["settings","budget"],sPersons:["settings","persons"],sTime:["settings","maxTime"],sHomeBudget:["settings","homeBudget"]};
  if(map[t.id]){const[o,k]=map[t.id];let v=t.value;if(o==="settings")v=Math.max(t.id==="sPersons"?1:0,+v||0);S[o][k]=v;commit()}
  if(t.id==="rsort"){F.sort=t.value;renderRecipes()}
});
let qT=null;
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.id==="rq"){clearTimeout(qT);qT=setTimeout(()=>{F.q=t.value;F.limit=24;renderRecipes()},220)}
  if(t.id==="priceQ")renderPrices(t.value);
  if(t.id==="pickQ"){clearTimeout(qT);qT=setTimeout(()=>pickFor(t.dataset.k,t.value),250)}
  if(t.id==="stName"){const c=Object.values(CAT).find(c=>c.fr===t.value);document.getElementById("stUnit").textContent=c?(c.unit==="ml"?"ml":(c.pg&&!["g","ml"].includes(c.unit))?c.unit:"g")+" · vide = "+packLabel(c):"un paquet si vide"}
});
document.addEventListener("submit",e=>{
  e.preventDefault();const f=e.target;
  if(f.id==="extraForm"){const n=document.getElementById("exName").value.trim(),p=parseFloat(document.getElementById("exPrice").value);if(!n){toast("Écris le nom de l'article.");return}S.extras.push({name:n,price:isFinite(p)?p:0});commit()}
  if(f.id==="scanForm"){applyScan();return}
  if(f.id==="homeForm"){const name=document.getElementById("hName").value.trim();if(!name){toast("Écris le nom du produit.");return}
    const x=HOME.find(x=>x[1].toLowerCase()===name.toLowerCase());const pv=parseFloat(document.getElementById("hPrice").value);const ev=+document.getElementById("hEvery").value||30;
    S.home.push(hNew(x?x[0]:"",x?x[1]:name,x?x[2]:"dv",isFinite(pv)?pv:x?x[3]:0,ev));commit();toast(name+" ajouté au placard maison.");setTimeout(()=>{const i=document.getElementById("hName");if(i)i.focus()},0)}
  if(f.id==="stockForm"){const name=document.getElementById("stName").value.trim();const c=Object.values(CAT).find(c=>c.fr.toLowerCase()===name.toLowerCase());if(!c){toast("Choisis un produit dans la liste proposée.");return}
    const v=parseFloat(document.getElementById("stQty").value);const u=c.unit==="ml"?"ml":(c.pg&&!["g","ml"].includes(c.unit))?"pc":"g";
    const g=isFinite(v)&&v>0?(u==="ml"?v*(c.dens||1):u==="g"?v:v*c.pg):packG(c);
    S.stock[c.id]={q:stockG(c.id)+g,soon:S.stock[c.id]&&S.stock[c.id].soon};commit();toast(c.fr+" ajouté au frigo.");setTimeout(()=>{const i=document.getElementById("stName");if(i)i.focus()},0)}
  if(f.id==="boughtForm"){const sh=shopping();const only=document.getElementById("bOnly").checked;const tot=parseFloat(document.getElementById("bTotal").value);
    for(const it of sh.items){if(only&&!S.checked[it.id])continue;const c=CAT[it.id];S.stock[it.id]={q:stockG(it.id)+it.packs*packG(c),soon:false}}
    const hs=sh.home.filter(h=>!only||S.checked["h:"+h.id]);if(hs.length){const hv=parseFloat((document.getElementById("bHome")||{}).value);hBuy(hs,hv)}
    if(sh.items.length||sh.extras)S.history.push({date:Date.now(),total:isFinite(tot)?tot:sh.total});S.history=S.history.slice(-26);S.checked={};S.extras=[];commit();closeModal();toast("Ticket enregistré, frigo rempli.")}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!document.getElementById("modal").hidden)closeModal()});

/* ---------- Démarrage ---------- */
loadLocal();
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
if("serviceWorker" in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
try{const t=localStorage.getItem("popote-tab");if(t&&document.getElementById("v-"+t))setTab(t)}catch(e){}
document.getElementById("v-semaine").innerHTML=`<div class="page"><p class="hand" style="font-size:1.5rem">J'ouvre le carnet…</p><div class="skel" style="margin-top:12px"></div></div>`;
fetch("recipes.json").then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(d=>{
  for(const a of d.cat){const[id,fr,ray,pack,unit,pr,kcal,prot,carb,fat,pg,dens,fl]=a;CAT[id]={id,fr,ray,pack,unit,price:pr,kcal,prot,carb,fat,pg,dens,fl}}
  REC=d.rec;for(const r of REC)RBY[r.i]=r;loaded=true;renderAll();
}).catch(()=>{document.getElementById("v-semaine").innerHTML=`<div class="page empty-state"><p>Les recettes n'ont pas pu se charger. Recharge la page.</p></div>`});
