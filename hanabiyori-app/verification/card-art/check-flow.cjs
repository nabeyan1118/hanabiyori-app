// Execute the unmodified app script against a small DOM stub; no browser/network.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const baseline=fs.readFileSync(process.argv[2],'utf8');
const script=h=>h.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(source,initial={}){
 const nodes=new Map(),timers=[];let stored=JSON.stringify(initial);
 const element=key=>{if(!nodes.has(key)){const classes=new Set();nodes.set(key,{innerHTML:'',textContent:'',disabled:false,dataset:{reflect:'yes'},attributes:{},listeners:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,f){this.listeners[k]=f},scrollIntoView(){}})}return nodes.get(key)};
 const context={document:{querySelector:element,querySelectorAll:()=>[element('reflection-button')]},window:{},navigator:{vibrate(){}},localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout(){},matchMedia:()=>({matches:true}),Date,Intl,Math};
 vm.runInNewContext(script(source),context);
 const flush=()=>{while(timers.length){timers.sort((a,b)=>a.ms-b.ms);timers.shift().fn()}};
 return{element,flush,get stored(){return JSON.parse(stored)},nodes};
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
for(const key of ['#readings','#weatherTitle','#weatherMessage','#actionTitle','#actionText','#drawBtn']){
 assert.equal(current.element(key).innerHTML,old.element(key).innerHTML);
 assert.equal(current.element(key).textContent,old.element(key).textContent);
}
const saved=boot(html,current.stored);saved.flush();assert.deepEqual(saved.stored.days[today].ids,current.stored.days[today].ids);assert.equal(saved.element('#drawBtn').disabled,true);
const expected=new Map([[0,[1,'光']],[1,[1,'短冊']],[4,[2,'種']],[5,[2,'短冊']],[8,[3,'光']],[9,[3,'短冊']],[12,[4,'種']],[13,[4,'短冊']],[16,[5,'種']],[17,[5,'短冊']],[20,[6,'種']],[21,[6,'短冊']],[24,[7,'種']],[25,[7,'短冊']],[28,[8,'光']],[29,[8,'種']],[32,[9,'種']],[33,[9,'短冊']],[36,[10,'種']],[37,[10,'短冊']],[40,[11,'光']],[41,[11,'種']],[42,[11,'短冊']],[43,[11,'カス']],[44,[12,'光']]]);
const cards=vm.runInNewContext(html.match(/const CARDS=([\s\S]*?);/)[1]);
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
 assert.equal(app.element('#readings').innerHTML,prior.element('#readings').innerHTML);
}
const d=new Date();d.setDate(d.getDate()-1);const yesterday=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const reflection=boot(html,{sound:false,days:{[yesterday]:{ids:[24,28,32],variant:0,created:1}}});
assert.equal(reflection.element('#reflection').classList.contains('show'),true);
reflection.element('reflection-button').listeners.click();assert.equal(reflection.stored.days[yesterday].reflection,'yes');assert.equal(reflection.element('#reflection').classList.contains('show'),false);
reflection.element('#soundBtn').listeners.click();assert.equal(reflection.stored.sound,true);
assert.ok(html.includes('transition:transform .72s'));
const result={pass:true,method:'Node vm with DOM stub; baseline comparison, not browser rendering',allIds:48,adoptedIdMonthRankChecks:expected.size,kasuSvgByteForByte:48-expected.size,threeCardDraw:true,resultMatchesBaseline:true,savedDrawReload:true,previousDayReflection:true,soundPreference:true,transitionDeclaration:'0.72s unchanged',browserRendering:'NOT VERIFIED: Chromium startup blocked by sandbox setsockopt EPERM'};
fs.writeFileSync(path.join(__dirname,'flow-results.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
