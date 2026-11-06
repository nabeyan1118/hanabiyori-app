// Execute the unmodified app script against a small DOM stub; no browser/network.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseline=fs.readFileSync(process.argv[2],'utf8');
// Share one clock instant so independent boots can compare creation timestamps exactly.
const runTime=Date.now();
class FlowDate extends Date{
 constructor(...args){super(...(args.length?args:[runTime]))}
 static now(){return runTime}
}
const script=h=>h.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(source,initial={}){
 const nodes=new Map(),timers=[];let stored=JSON.stringify(initial);
 const element=key=>{if(!nodes.has(key)){const classes=new Set();nodes.set(key,{innerHTML:'',textContent:'',disabled:false,dataset:{reflect:'yes'},attributes:{},listeners:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,f){this.listeners[k]=f},scrollIntoView(){}})}return nodes.get(key)};
 const context={document:{querySelector:element,querySelectorAll:()=>[element('reflection-button')]},window:{},navigator:{vibrate(){}},localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){},matchMedia:()=>({matches:true}),Date:FlowDate,Intl,Math};
 vm.runInNewContext(script(source),context);
 const flush=()=>{while(timers.length){timers.sort((a,b)=>a.ms-b.ms);timers.shift().fn()}};
 return{element,flush,get stored(){return JSON.parse(stored)},nodes};
}
// Independent verbatim expectations from 鬼札仕様案・改訂版 (2026-11-03).
const oniNotes=[
 '鬼札 ― 今日は雷の気配。思いがけない知らせが、空気を切り替えそうです。',
 '鬼札 ― 滞って見えるものも、ふいのきっかけで姿を変えていくかもしれません。',
 '鬼札 ― 予定にない一手を、今日は軽く拾ってみて。その一手が、流れを変えるきっかけになりそうです。'
];
const cards=vm.runInNewContext(html.match(/const CARDS=([\s\S]*?);/)[1]);
assert.equal(cards[43].id,43);
assert.equal(cards[43].name,'柳に雷（鬼札）','id 43 display name');
function compareReadings(app,prior,ids){
 const reading=app.element('#readings').innerHTML;
 const articles=reading.match(/<article\b[^>]*>[\s\S]*?<\/article>/g)||[];
 assert.equal(articles.length,3,'three reading articles');
 assert.equal(articles.join(''),reading,'no content outside reading articles');
 // Validate every article before removing only the exact expected additions.
 for(let i=0;i<3;i++){
  const paragraphs=articles[i].match(/<p\b[^>]*>[\s\S]*?<\/p>/g)||[];
  const notes=paragraphs.filter(p=>p.startsWith('<p class="oni-note">'));
  assert.equal(notes.length,ids[i]===43?1:0,`oni-note count at position ${i}`);
  assert.equal(paragraphs.length,ids[i]===43?2:1,`paragraph count at position ${i}`);
  if(ids[i]===43){
   assert.equal(notes[0],`<p class="oni-note">${oniNotes[i]}</p>`,`oni-note verbatim at position ${i}`);
   assert.equal(paragraphs[1],notes[0],'oni-note follows the reading paragraph');
   assert.equal((articles[i].match(/<span class="reading-card">([^<]*)<\/span>/)||[])[1],'柳に雷（鬼札）','rendered id 43 name');
  }
 }
 const normalized=articles.map((article,i)=>ids[i]===43
  ?article.replace(`<p class="oni-note">${oniNotes[i]}</p>`,'').replace('<span class="reading-card">柳に雷（鬼札）</span>','<span class="reading-card">柳のカス</span>')
  :article).join('');
 assert.equal(normalized,prior.element('#readings').innerHTML);
 assert.equal(app.element('#readings').textContent,prior.element('#readings').textContent);
}
function comparableText(app,key,ids){
 const value=app.element(key).textContent;
 if(key==='#actionText' && ids[2]===43){
  const prefix='「柳に雷（鬼札）」が示すのは、';
  assert.equal(value.slice(0,prefix.length),prefix,'action id 43 display name');
  return '「柳のカス」が示すのは、'+value.slice(prefix.length);
 }
 return value;
}
const current=boot(html),old=boot(baseline);
for(const app of [current,old]){
 assert.equal(app.element('#card0').classList.contains('revealed'),false);
 app.element('#drawBtn').listeners.click();app.flush();
 for(let i=0;i<3;i++)assert.equal(app.element('#card'+i).classList.contains('revealed'),true);
 assert.equal(app.element('#result').classList.contains('show'),true);assert.equal(app.element('#drawBtn').disabled,true);
}
const today=Object.keys(current.stored.days)[0];
assert.deepEqual(current.stored.days[today].ids,old.stored.days[today].ids);
compareReadings(current,old,current.stored.days[today].ids);
assert.deepEqual(current.stored,old.stored);
for(const key of ['#weatherTitle','#weatherMessage','#actionTitle','#actionText','#drawBtn']){
 assert.equal(current.element(key).innerHTML,old.element(key).innerHTML);
 assert.equal(comparableText(current,key,current.stored.days[today].ids),old.element(key).textContent);
}
const saved=boot(html,current.stored);saved.flush();
const savedPrior=boot(baseline,old.stored);savedPrior.flush();
compareReadings(saved,savedPrior,current.stored.days[today].ids);
assert.deepEqual(saved.stored,savedPrior.stored);assert.deepEqual(saved.stored.days[today].ids,current.stored.days[today].ids);assert.equal(saved.element('#drawBtn').disabled,true);
const expected=new Map([[0,[1,'光']],[1,[1,'短冊']],[4,[2,'種']],[5,[2,'短冊']],[8,[3,'光']],[9,[3,'短冊']],[12,[4,'種']],[13,[4,'短冊']],[16,[5,'種']],[17,[5,'短冊']],[20,[6,'種']],[21,[6,'短冊']],[24,[7,'種']],[25,[7,'短冊']],[28,[8,'光']],[29,[8,'種']],[32,[9,'種']],[33,[9,'短冊']],[36,[10,'種']],[37,[10,'短冊']],[40,[11,'光']],[41,[11,'種']],[42,[11,'短冊']],[43,[11,'カス']],[44,[12,'光']]]);
for(const id of [2,3,6,7,10,11,14,15,18,19,22,23,26,27,30,31,34,35,38,39,45,46,47]) expected.set(id,[Math.floor(id/4)+1,'カス']);
assert.equal(expected.size,48);
const map=vm.runInNewContext(html.match(/const CARD_ART=([\s\S]*?);/)[1]);
assert.equal(Object.keys(map).length,48);
for(let id=0;id<48;id++){
 const initial={sound:false,days:{[today]:{ids:[id,(id+1)%48,(id+2)%48],variant:1,created:1}}};
 const app=boot(html,initial),prior=boot(baseline,initial);app.flush();prior.flush();
 const face=app.element('#card0 .front').innerHTML;
 if(expected.has(id)){
 const [month,rank]=expected.get(id);assert.equal(cards[id].month,month);assert.equal(cards[id].rank,rank);
 const src=`assets/cards/card-${String(id).padStart(2,'0')}.jpg`;assert.equal(map[id],src);assert.ok(face.includes(`src="${src}"`));assert.ok(fs.existsSync(path.join(root,src)));
 }else{assert.equal(map[id],null);assert.equal(face,prior.element('#card0 .front').innerHTML)}
 compareReadings(app,prior,initial.days[today].ids);
 assert.deepEqual(app.stored,prior.stored);
 for(const key of ['#weatherTitle','#weatherMessage','#actionTitle','#actionText','#drawBtn']){
  assert.equal(app.element(key).innerHTML,prior.element(key).innerHTML);
  assert.equal(comparableText(app,key,initial.days[today].ids),prior.element(key).textContent);
 }
}
const d=new Date();d.setDate(d.getDate()-1);const yesterday=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const reflection=boot(html,{sound:false,days:{[yesterday]:{ids:[24,28,32],variant:0,created:1}}});
assert.equal(reflection.element('#reflection').classList.contains('show'),true);
reflection.element('reflection-button').listeners.click();assert.equal(reflection.stored.days[yesterday].reflection,'yes');assert.equal(reflection.element('#reflection').classList.contains('show'),false);
reflection.element('#soundBtn').listeners.click();assert.equal(reflection.stored.sound,true);
assert.ok(html.includes('transition:transform .72s'));
const result={pass:true,oniExpectations:'Independent verbatim notes; exact article, position, paragraph count and display name; only specified display name/note normalized',method:'Node vm with DOM stub; baseline comparison, not browser rendering',allIds:48,adoptedIdMonthRankChecks:expected.size,kasuSvgByteForByte:48-expected.size,threeCardDraw:true,resultMatchesBaseline:true,savedDrawReload:true,previousDayReflection:true,soundPreference:true,transitionDeclaration:'0.72s unchanged',browserRendering:'NOT VERIFIED: this check uses a Node DOM stub'};
fs.writeFileSync(path.join(__dirname,'flow-results.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
