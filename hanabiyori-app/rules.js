'use strict';
// ルール説明（常設）。文面は DESIGN-KOIKOI-MINIAPP.md のハナビ確認済み完成形。
(function () {
  const YAKU = [
    ['五光', '10点', [0, 8, 28, 40, 44], ''],
    ['四光', '8点', [0, 8, 28, 44], ''],
    ['雨四光', '7点', [0, 8, 28, 40], '柳の光を含む四光'],
    ['三光', '5点', [0, 8, 28], '柳の光は含まない'],
    ['猪鹿蝶', '5点', [20, 24, 36], '種が増えるごとに+1点'],
    ['花見酒', '5点', [8, 32], ''],
    ['月見酒', '5点', [28, 32], ''],
    ['赤短', '5点', [1, 5, 9], '短冊が増えるごとに+1点'],
    ['青短', '5点', [21, 33, 37], '短冊が増えるごとに+1点'],
    ['赤青短', '10点', [1, 5, 9, 21, 33, 37], '赤短と青短の両方。短冊が増えるごとに+1点'],
    ['短冊', '5点から', [1, 5, 9, 13, 17], '5枚で5点。1枚増えるごとに+1点'],
    ['種（タネ）', '5点から', [4, 12, 16, 24, 41], '5枚で5点。1枚増えるごとに+1点'],
    ['カス', '5点から', [2, 3, 6, 7, 10, 11, 14, 15, 18, 19], '10枚で5点。1枚増えるごとに+1点']
  ];
  const TURNING = [
    ['こいこいをかけるか', '今の点を確定するか、倍を狙うか。点が大きいほど確定の価値が上がり、山の残りが少ないほど次の役の見込みは下がります。その引き合いが、判断の芯です'],
    ['相手の取り札を読む', '取り札は、両方に見えています。相手が短冊や種を何枚集めているか、光の札を取ったかで、相手の役の近さが読めます'],
    ['あがって止める勇気', '小さい役でも、相手が大きい役の目前なら、早くあがって止めるのが勝ち方です。止めるのは弱気ではなく、読みです'],
    ['大きい役の競り合い', '光の札は少なく、花見酒と月見酒は同じ酒杯を取り合います。欲しい札を相手に取られた瞬間に、狙いを切り替えるのも分かれ目です']
  ];
  function cardImg(id) {
    const b = document.createElement('span');
    b.className = 'card';
      if (window.__mc) b.style.setProperty('--mc', window.__mc(id));
    const img = document.createElement('img');
    img.src = `../assets/cards/card-${String(id).padStart(2, '0')}.webp?v=20261128a`;
    img.alt = KoiCore.CARDS[id].motif;
    b.append(img);
    return b;
  }
  function cardRow(ids) {
    const row = document.createElement('div');
    row.className = 'cards';
    ids.forEach(id => row.append(cardImg(id)));
    return row;
  }
  function build() {
    const sec = document.getElementById('rules');
    sec.replaceChildren();
    const sheet = document.createElement('div');
    sheet.className = 'rules-sheet';
    const bar = document.createElement('div');
    bar.className = 'rules-bar';
    const title = document.createElement('span');
    title.textContent = 'ルール・役';
    const x = document.createElement('button');
    x.className = 'rules-x';
    x.textContent = '× 閉じる';
    x.onclick = () => { sec.hidden = true; };
    bar.append(title, x);
    sheet.append(bar);
    const h = t => { const e = document.createElement('h2'); e.textContent = t; return e; };
    const p = t => { const e = document.createElement('p'); e.textContent = t; return e; };
    sheet.append(h('遊び方'));
    sheet.append(p('花札こいこいは、同じ月の札を合わせて集め、役を作るゲームです。役ができたら勝負どころ。そこで終わるか、続けるかが腕の見せどころです'));
    sheet.append(h('進め方'));
    const ol = document.createElement('ol');
    ['手札から、場にある札と同じ月の札を出します',
     '山から1枚めくり、同じ月があればそれも取れます',
     '取った札は自分のもの。役の組み合わせがそろうと点になります',
     '同じ月の札がない時は、出した札は場にそのまま置かれます'].forEach(t => { const li = document.createElement('li'); li.textContent = t; ol.append(li); });
    sheet.append(ol);
    sheet.append(cardRow([2, 0, 30, 28]));
    sheet.append(h('役の一覧'));
    for (const [name, points, ids, note] of YAKU) {
      const row = document.createElement('div');
      row.className = 'yaku-row';
      const nm = document.createElement('div');
      nm.className = 'yaku-name';
      nm.textContent = `${name} ${points}`;
      if (note) { const sm = document.createElement('small'); sm.textContent = note; nm.append(sm); }
      row.append(nm, cardRow(ids));
      sheet.append(row);
    }
    sheet.append(h('こいこいと、あがり'));
    sheet.append(p('役ができたら、2つの選び方があります。「あがる」（ここで終わりにする）と、その時点の点数が確定します。「こいこい」と続けると、次に役ができた時に点数が倍になります。ただし、相手に先にあがられると、相手の点数を倍にして払います'));
    sheet.append(h('勝負の長さ'));
    sheet.append(p('始める前に、勝負の長さを選べます。一局勝負は1局だけ。半年勝負は6局、一年勝負は12局を続けて打ちます。局を重ねる勝負では、勝った局の点数が合計に積み上がっていきます。最後の局が終わった時に、合計の多い方の勝ちです'));
    sheet.append(h('勝負の分かれ目'));
    const ul = document.createElement('ul');
    for (const [t, body] of TURNING) { const li = document.createElement('li'); li.textContent = `${t}：${body}`; ul.append(li); }
    sheet.append(ul);
    sheet.append(h('うちのルール'));
    const ul2 = document.createElement('ul');
    ['手四：手札に同じ月が4枚あると、その場であがり（6点）',
     'くっつき：場に同じ月が4枚あると、配り直し',
     '役の素点が7点以上あると、点がもう1倍になります',
     '山が尽きて両方ともあがれなければ、流れ（引き分け）',
     'どの勝負でも、あなたが先手です'].forEach(t => { const li = document.createElement('li'); li.textContent = t; ul2.append(li); });
    sheet.append(ul2);
    const closeRow = document.createElement('p');
    closeRow.className = 'close-row';
    const btn = document.createElement('button');
    btn.id = 'rules-close';
    btn.textContent = '閉じる';
    btn.onclick = () => { sec.hidden = true; };
    closeRow.append(btn);
    sheet.append(closeRow);
      sec.append(sheet);
  }
  document.getElementById('rules').addEventListener('pointerdown', e => {
    if (e.target.id === 'rules') e.currentTarget.hidden = true;
  });
  document.getElementById('rules-btn').onclick = () => {
    const sec = document.getElementById('rules');
    if (sec.hidden && !sec.childNodes.length) build();
    sec.hidden = !sec.hidden;
    if (!sec.hidden) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
})();
