'use strict';
// チュートリアル（固定の山札で、必ず役の判断点に届く1局）。
// 文章を読まなくても進める形：次に押せる所だけが光り、それ以外は押せない。
// 手札を選ぶと、取れる場の札が光り、それを押して取る。
// 山札は机のシミュレーションで検証済み：
//   1手目 桜のカス(10)→桜に幕(8)、山から芒のカス(30)→芒に月(28)
//   2手目 松のカス(2)→松に鶴(0) で三光がそろい、判断点に届く。
(function () {
  const TUT_DECK = [10, 2, 6, 18, 22, 34, 38, 46, 4, 12, 16, 20, 24, 36, 44, 41, 8, 28, 0, 13, 17, 25, 33, 45, 30, 47, 1, 3, 5, 7, 9, 11, 14, 15, 19, 21, 23, 26, 27, 29, 31, 32, 35, 37, 39, 40, 42, 43];
  let active = false, stage = '', choice = null, prevPhase = '', pending = null, freePlayNoted = false;

  const guide = () => document.getElementById('guide');
  function showGuide(html) {
    const g = guide();
    g.hidden = false;
    document.body.style.paddingBottom = '190px';
    g.replaceChildren();
    const exit = document.createElement('button');
    exit.className = 'guide-exit';
    exit.textContent = 'やめる';
    exit.onclick = stopTutorial;
    const body = document.createElement('div');
    body.textContent = html;
    g.append(exit, body);
  }
  function hideGuide() { guide().hidden = true; document.body.style.paddingBottom = ''; }
  function stopTutorial() {
    active = false;
    pending = null;
    window.__tutDeck = undefined;
    hideGuide();
  }
  function idOf(btn) {
    const img = btn.querySelector('img');
    const m = img && img.src.match(/card-(\d+)\.webp/);
    return m ? parseInt(m[1], 10) : null;
  }
  function btnFor(container, id) {
    return [...document.querySelectorAll(`${container} .card`)].find(b => idOf(b) === id) || null;
  }
  function scrollToTarget() {
    const t = document.querySelector('.guide-target');
    if (t) t.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function scriptedTarget() {
    const taken = s.taken[0];
    if (s.turn !== 0 || s.phase !== 'play' || choice !== null) return null;
    if (!taken.includes(8)) return 10;
    if (taken.includes(28) && !taken.includes(0)) return 2;
    return null;
  }
  function markHand(targetId) {
    document.querySelectorAll('#hand .card').forEach(btn => {
      if (!btn.querySelector('img')) return;
      const isTarget = idOf(btn) === targetId;
      btn.classList.toggle('guide-target', isTarget);
      btn.classList.toggle('guide-off', !isTarget);
      if (!isTarget) btn.disabled = true;
    });
  }
  function glowMatchesInHand() {
    document.querySelectorAll('#hand .card').forEach(btn => {
      const img = btn.querySelector('img');
      if (!img) return;
      const id = parseInt(img.src.match(/card-(\d+)\.webp/)[1], 10);
      if (C.matches(s, id).length) btn.classList.add('guide-target');
    });
  }
  function reflection() {
    if (choice === 'agari') return 'この局の分かれ目は、三光がそろったところでした。あそこで「あがり」を選んだので、5点がそのまま残りました';
    const w = s.result ? s.result.winner : null;
    if (w === 0) return 'この局の分かれ目は、三光がそろったところでした。「こいこい」を選んで続け、最後はあなたの勝ち。続けた判断が実った局です';
    if (w === 1) return 'この局の分かれ目は、三光がそろったところでした。「こいこい」で続けた間に、相手にあがられました。あそこで止めるのも勝ち方でした';
    return 'この局の分かれ目は、三光がそろったところでした。結果は引き分け。止めるか続けるかで、局の流れが変わります';
  }

  // 手札タップの受け口：取る場の札が1枚なら、まずその札を光らせてから取らせる
  window.__tutSelect = function (id) {
    if (!active || s.turn !== 0 || s.phase !== 'play') return false;
    const target = scriptedTarget();
    if (target !== null && id !== target) return true; // 案内の札以外は受けない
    const ms = C.matches(s, id);
    if (ms.length === 1) {
      pending = { hand: id, field: ms[0] };
      render();
      return true;
    }
    return false; // 0枚（場に置く）・2枚（選ぶ）は通常の流れ
  };

  window.TutHook = function () {
    if (!active) return;
    if (stage === 'end' && s.phase === 'play' && s.taken[0].length === 0 && s.taken[1].length === 0) { stopTutorial(); return; }
    if (prevPhase === 'decision' && s.phase !== 'decision' && choice === null) {
      choice = (s.phase === 'end') ? 'agari' : 'koi';
    }
    prevPhase = s.phase;
    document.querySelectorAll('.guide-target,.guide-off').forEach(el => el.classList.remove('guide-target', 'guide-off'));

    if (s.phase === 'end') {
      stage = 'end';
      pending = null;
      showGuide(reflection());
      const again = document.querySelector('#result .again');
      if (again) again.classList.add('guide-target');
      return;
    }
    if (s.phase === 'decision' && s.turn === 0) {
      stage = 'decision';
      pending = null;
      showGuide('役ができました。ここが勝負どころです。今あがると、この点数が確定します。こいこいと続けると、次に役ができた時に点数が倍になりますが、相手に先にあがられると倍にして払います。どうしますか？');
      document.querySelectorAll('#actions button').forEach(b => b.classList.add('guide-target'));
      scrollToTarget();
      return;
    }
    if (choice === 'koi' && !freePlayNoted) {
      freePlayNoted = true;
      showGuide('こいこいを選びました。このまま最後まで遊んでみましょう。案内はここまでです');
      return;
    }
    if (choice === 'koi') { hideGuide(); if (s.turn === 0 && s.phase === 'play' && !pending) glowMatchesInHand(); }
    if (s.turn === 1) { if (choice !== 'koi') showGuide('相手の番です'); pending = null; return; }
    if (s.turn === 0 && s.phase === 'drawChoice') {
      showGuide('山から引いた札と合わせる、場の光っている札を押してください');
      document.querySelectorAll('#field .valid').forEach(b => b.classList.add('guide-target'));
      scrollToTarget();
      return;
    }
    if (s.turn === 0 && s.phase === 'play') {
      if (pending) {
        showGuide('取れる場の札が光っています。押してください');
        setTimeout(scrollToTarget, 60);
        const hb = btnFor('#hand', pending.hand);
        if (hb) hb.classList.add('guide-target');
        document.querySelectorAll('#hand .card').forEach(b => { if (b !== hb) b.disabled = true; });
        const fb = btnFor('#field', pending.field);
        if (fb) {
          fb.disabled = false;
          fb.classList.add('guide-target');
          fb.onclick = () => {
            const pp = pending;
            pending = null;
            C.play(s, pp.hand, pp.field);
            after();
          };
        }
        return;
      }
      const target = scriptedTarget();
      if (target !== null) {
        const taken = s.taken[0];
        if (!taken.includes(8)) {
          stage = 'play1';
          showGuide('まずは触って覚えましょう。場の札と同じ月の札が、手札にあります。光っている札を押してみてください');
        } else {
          stage = 'play2';
          showGuide('山から引いた札も、場の「芒に月」と合いました。光の札が2枚そろっています。次は松のカスを出して、「松に鶴」を合わせてみましょう');
        }
        markHand(target);
        scrollToTarget();
        return;
      }
      if (choice === null && s.turn === 0) glowMatchesInHand();
    }
  };

  document.getElementById('tut-btn').onclick = () => {
    active = true; stage = ''; choice = null; prevPhase = ''; pending = null; freePlayNoted = false;
    window.__tutDeck = TUT_DECK;
    start(TUT_DECK);
  };
})();
