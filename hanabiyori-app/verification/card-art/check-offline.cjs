// Offline browser check: HOME/TMPDIR must point inside the workspace.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=require('/opt/hatch/skills/spaces/ts-runtime/dist/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
const expected={0:[1,'光'],1:[1,'短冊'],4:[2,'種'],5:[2,'短冊'],8:[3,'光'],9:[3,'短冊'],12:[4,'種'],13:[4,'短冊'],16:[5,'種'],17:[5,'短冊'],20:[6,'種'],21:[6,'短冊'],24:[7,'種'],25:[7,'短冊'],28:[8,'光'],29:[8,'種'],32:[9,'種'],33:[9,'短冊'],36:[10,'種'],37:[10,'短冊'],40:[11,'光'],41:[11,'種'],42:[11,'短冊'],44:[12,'光']};
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const vm=require('vm');
const cards=vm.runInNewContext(html.match(/const CARDS=([\s\S]*?);/)[1]);
for(const [id,[month,rank]] of Object.entries(expected)){assert.equal(cards[id].month,month);assert.equal(cards[id].rank,rank)}
const policy='/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
(async()=>{
 const browser=await chromium.launch({executablePath:'/opt/meta-chromium/chrome',args:['--no-sandbox',`--hatch-webgl-allowed-domains-file=${policy}`,`--hatch-webgl-allowed-domains-sha256=${crypto.createHash('sha256').update(fs.readFileSync(policy)).digest('hex')}`]});
 try{
 const context=await browser.newContext({viewport:{width:1280,height:1000}});
 const errors=[],requests=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://offline.test')return route.abort();
  requests.push(url.pathname);
  const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
  if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
  const type={'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
  await route.fulfill({body:fs.readFileSync(file),contentType:type});
 });
 const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://offline.test/');
 // No saved draw: the button runs the actual staged three-card reveal.
 assert.equal(await page.locator('.card.revealed').count(),0);
 await page.locator('#drawBtn').click();
 await page.waitForFunction(()=>document.querySelector('#result').classList.contains('show'));
 assert.equal(await page.locator('.card.revealed').count(),3);
 assert.equal(await page.locator('.reading').count(),3);
 assert.equal(await page.locator('#drawBtn').isDisabled(),true);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hanabiyori.free.v2')));
 const today=Object.keys(stored.days)[0], draw=stored.days[today];
 assert.equal(new Set(draw.ids).size,3);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#result').classList.contains('show'));
 assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem('hanabiyori.free.v2')).days[key].ids,today),draw.ids);
 assert.equal(await page.locator('.card.revealed').count(),3);
 // Exercise every id through the actual prepare/render entry points.
 for(let first=0;first<48;first+=3){
  await page.evaluate(({today,first})=>localStorage.setItem('hanabiyori.free.v2',JSON.stringify({sound:false,days:{[today]:{ids:[first,first+1,first+2],variant:0,created:Date.now()}}})),{today,first});
  await page.reload();await page.waitForFunction(()=>document.querySelector('#result').classList.contains('show'));
  for(let n=0;n<3;n++){
   const id=first+n,face=page.locator(`#card${n} .front`);
   if(expected[id]){
    const img=face.locator('img');assert.equal(await img.count(),1);assert.equal(await img.getAttribute('src'),`assets/cards/card-${String(id).padStart(2,'0')}.jpg`);
    await img.evaluate(i=>i.decode());assert.ok(await img.evaluate(i=>i.naturalWidth>0));
    assert.equal(await img.evaluate(i=>getComputedStyle(i).objectFit),'contain');
   }else{assert.equal(await face.locator('svg').count(),1);assert.equal(await face.locator('img').count(),0)}
  }
 }
 // Mixed image/SVG plus previous-day reflection and sound preference persistence.
 await page.evaluate(today=>{
 const d=new Date();d.setDate(d.getDate()-1);const yesterday=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 localStorage.setItem('hanabiyori.free.v2',JSON.stringify({sound:false,days:{[today]:{ids:[0,2,44],variant:1,created:Date.now()},[yesterday]:{ids:[24,28,32],variant:0,created:Date.now()}}}));
 },today);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#result').classList.contains('show'));
 assert.equal(await page.locator('#reflection.show').count(),1);
 await page.locator('.reflection-actions button').first().click();
 assert.equal(await page.locator('#reflection.show').count(),0);
 await page.locator('#soundBtn').click();
 assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'true');
 await page.reload();await page.waitForFunction(()=>document.querySelector('#result').classList.contains('show'));
 assert.equal(await page.locator('#reflection.show').count(),0);
 assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'true');
 await page.locator('#drawStage').screenshot({path:path.join(__dirname,'mixed-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 await page.locator('#drawStage').screenshot({path:path.join(__dirname,'mixed-mobile.png')});
 assert.equal(await page.locator('#card0 .card-inner').evaluate(e=>getComputedStyle(e).transitionDuration),'0.72s');
 assert.equal(errors.length,0,errors.join('\n'));
 const result={pass:true,initialDraw:draw.ids,checkedIds:48,adoptedImages:24,kasuSvg:24,reload:true,previousDayReflection:true,soundPreference:true,transition:'0.72s',pageErrors:errors,externalRequests:'all intercepted and aborted; no network',uniqueCardRequests:[...new Set(requests.filter(p=>p.startsWith('/assets/cards/')))].length};
 fs.writeFileSync(path.join(__dirname,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
