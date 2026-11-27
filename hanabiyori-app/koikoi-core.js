(function(root,factory){if(typeof module==='object'&&module.exports) module.exports=factory(require('./cards.js')); else root.KoiCore=factory(root.KoiCards);})(globalThis,function(CARDS){
'use strict';
const card=id=>CARDS[id], has=(ids,...xs)=>xs.every(x=>ids.includes(x));
function yaku(ids){
 const n=t=>ids.filter(i=>card(i).type===t).length, out=[], add=(name,points,cardIds)=>out.push({name,points,cardIds});
 const byType=t=>ids.filter(i=>card(i).type===t);
 const lights=ids.filter(i=>card(i).type==='光').length, rain=ids.includes(40), animals=n('種'), ribbons=n('短冊'), junk=n('カス');
 if(lights===5)add('五光',10,byType('光')); else if(lights===4)add(rain?'雨四光':'四光',rain?7:8,byType('光')); else if(lights===3&&!rain)add('三光',5,byType('光'));
 const inoshikacho=has(ids,20,24,36);
 if(inoshikacho)add('猪鹿蝶',5+Math.max(0,animals-5),byType('種'));
 if(has(ids,8,32))add('花見酒',5,[8,32]); if(has(ids,28,32))add('月見酒',5,[28,32]);
 const red=has(ids,1,5,9), blue=has(ids,21,33,37);
 if(red&&blue)add('赤青短',10+Math.max(0,ribbons-6),byType('短冊')); else if(red||blue)add(red?'赤短':'青短',5+Math.max(0,ribbons-5),byType('短冊'));
 if(!red&&!blue&&ribbons>=5)add('短冊',ribbons,byType('短冊')); if(!inoshikacho&&animals>=5)add('タネ',animals,byType('種')); if(junk>=10)add('カス',junk-5,byType('カス'));
 return out;
}
function score(ids,declarations=0,opponentDeclared=false){const roles=yaku(ids),base=roles.reduce((s,r)=>s+r.points,0), koi=2**declarations, seven=base>=7?2:1, payment=opponentDeclared?2:1;return {roles,base,koi,seven,payment,total:base*koi*seven*payment};}
function four(ids){return Array.from({length:12},(_,i)=>i+1).find(m=>ids.filter(id=>card(id).monthIndex===m).length===4)||null;}
function shuffle(rng=Math.random){const a=CARDS.map(c=>c.id);for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function deal(deck=shuffle()){if(deck.length!==48||new Set(deck).size!==48||deck.some(x=>!card(x)))throw Error('山札は異なる48枚が必要です');return {hands:[deck.slice(0,8),deck.slice(8,16)],field:deck.slice(16,24),deck:deck.slice(24),taken:[[],[]],declarations:[0,0],turn:0,phase:'play',pending:null,result:null};}
function initial(deck){const s=deal(deck);const p=four(s.hands[0]),c=four(s.hands[1]);if(p||c){const winner=p?0:1;s.phase='end';const m=p||c;s.result={winner,reason:'手四',roles:[{name:'手四',points:6,cardIds:s.hands[winner].filter(id=>card(id).monthIndex===m)}],base:6,koi:1,seven:1,payment:1,total:6};}else if(four(s.field)){s.phase='redeal';}return s;}
function matches(s,id){return s.field.filter(i=>card(i).monthIndex===card(id).monthIndex);}
function place(s,id,target,source){const ms=matches(s,id);if(ms.length===2&&!ms.includes(target))throw Error('場の同月札を選択してください');if(ms.length!==2&&target!=null&&!ms.includes(target))throw Error('場の札が不正です');if(ms.length){const take=ms.length===3?ms:[ms.length===1?ms[0]:target];s.field=s.field.filter(i=>!take.includes(i));s.taken[s.turn].push(id,...take);}else s.field.push(id);}
function play(s,id,target){if(s.phase!=='play'||!s.hands[s.turn].includes(id))throw Error('手札を選んでください');const ms=matches(s,id);if(ms.length===2&&!ms.includes(target))throw Error('場の同月札を選択してください');s.before=yaku(s.taken[s.turn]);s.hands[s.turn].splice(s.hands[s.turn].indexOf(id),1);place(s,id,target);if(s.deck.length){const drawn=s.deck.shift();s.pending=drawn;const dm=matches(s,drawn);if(dm.length===2){s.phase='drawChoice';return;}place(s,drawn,null);s.pending=null;}finishTurn(s);}
function chooseDraw(s,target){if(s.phase!=='drawChoice')throw Error('選択待ちではありません');place(s,s.pending,target);s.pending=null;finishTurn(s);}
function finishTurn(s){const now=yaku(s.taken[s.turn]);const before=s.before||[];if(now.some(r=>!before.some(b=>b.name===r.name))){s.phase='decision';return;}next(s);}
function next(s){if(!s.hands[0].length&&!s.hands[1].length){s.phase='end';s.result={winner:null,reason:'流れ',total:0};return;}s.turn=1-s.turn;s.phase='play';}
function decide(s,choice){if(s.phase!=='decision')throw Error('宣言できません');if(choice==='agari'){const winner=s.turn;s.result={winner,reason:'あがり',...score(s.taken[winner],s.declarations[winner],s.declarations[1-winner]>0)};s.phase='end';}else if(choice==='koi'){s.declarations[s.turn]++;next(s);}else throw Error('選択が不正です');}
function value(id){return {'光':8,'種':5,'短冊':3,'カス':1}[card(id).type];}
function cpuTarget(s,id){const ms=matches(s,id);return ms.sort((a,b)=>value(b)-value(a))[0];}
function cpuPlay(s){let best=null;for(const id of s.hands[1]){const ms=matches(s,id);const target=cpuTarget(s,id);let v=ms.length?(ms.length===3?ms.reduce((x,i)=>x+value(i),0):value(target))+value(id): -value(id)-s.taken[0].filter(i=>card(i).monthIndex===card(id).monthIndex).length*2;const own=s.taken[1];if(ms.length){const candidate=own.concat(id,ms.length===3?ms:[target]);v+=(yaku(candidate).reduce((a,r)=>a+r.points,0)-yaku(own).reduce((a,r)=>a+r.points,0))*3;v+=candidate.filter(i=>[20,24,36,1,5,9,21,33,37,8,28,32].includes(i)).length*.25;}if(!best||v>best.v)best={id,target,v};}return best;}
function cpuDecision(s){const base=score(s.taken[1]).base;return base<7&&s.deck.length>=12&&s.hands[1].length>=4&&s.declarations[1]===0?'koi':'agari';}
return {CARDS,yaku,score,four,shuffle,deal,initial,matches,play,chooseDraw,decide,cpuTarget,cpuPlay,cpuDecision};
});
