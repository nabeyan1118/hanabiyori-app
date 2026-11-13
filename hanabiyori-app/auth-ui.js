import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const panel = document.getElementById('accountPanel');
const toggle = document.getElementById('accountToggle');
let client;
let session = null;
let revision = 0;
let busy = false;
let knownEmail = null;
const memoryKey = 'hanabiyori.member_email';
function rememberedEmail() {
  try { return localStorage.getItem(memoryKey); } catch { return null; }
}

function birthElement(birthDate) {
  const day = Date.parse(birthDate + 'T00:00:00Z');
  const days = (day - Date.UTC(2000, 0, 1)) / 86400000;
  const index = ((54 + days) % 60 + 60) % 60;
  return ['木', '火', '土', '金', '水'][Math.floor((index % 10) / 2)];
}
function cacheBirthElement(birthDate) {
  try {
    const element = birthDate ? birthElement(birthDate) : null;
    if (element) localStorage.setItem('hanabiyori.nichishu_el', element);
    else localStorage.removeItem('hanabiyori.nichishu_el');
  } catch {}
}

panel.innerHTML = `
  <h2 tabindex="-1">ログイン・登録</h2>
  <p id="accountStatus" role="status" aria-live="polite">ログインの準備をしています。</p>
  <form id="loginForm" hidden>
    <label>メールアドレス<input name="email" type="email" autocomplete="email" required></label>
    <p class="auth-note">リンクのメールは、認証サービス「Supabase Auth」の名前で届きます。迷惑メールフォルダに振り分けられることがあるので、届かないときはそちらも確認してください。</p>
    <button type="submit">メールアドレスで進む</button>
  </form>
  <div id="knownArea" hidden>
    <h3>顔見知り状態</h3>
    <label>生年月日<input id="knownBirthDate" type="date" readonly></label>
    <p id="knownBirthTime"></p>
    <h3>過去の巡り</h3>
    <ul id="knownReadings"></ul>
    <div class="account-actions">
      <button id="verifyMember" type="button">本人確認して編集する</button>
      <button id="forgetMember" type="button">この端末の記憶を消す</button>
    </div>
  </div>
  <div id="memberArea" hidden>
    <h3>命式プロフィール</h3>
    <p>保存した記録は、この画面で確認・書き出し・削除できます。出生時間が不明な場合は簡易鑑定になります。</p>
    <form id="profileForm">
      <label>生年月日（必須）<input name="birth_date" type="date" required></label>
      <label>出生時間<input name="birth_time" type="time" step="1"></label>
      <label class="account-check"><input name="birth_time_unknown" type="checkbox" checked>出生時間は不明</label>
      <label class="account-check"><input name="save_consent" type="checkbox">記録の保存に同意する</label>
      <button id="saveProfile" type="submit" disabled>プロフィールを保存</button>
    </form>
    <div class="account-actions">
      <button id="exportData" type="button">自分のデータを書き出す</button>
      <button id="deleteData" type="button">プロフィール・巡り手帳を削除</button>
      <button id="logout" type="button">ログアウト</button>
    </div>
    <p>この削除はプロフィールと巡り手帳が対象です。会員退会・課金解約の操作は含みません。</p>
  </div>`;
const status = panel.querySelector('#accountStatus');
const login = panel.querySelector('#loginForm');
const knownArea = panel.querySelector('#knownArea');
const memberArea = panel.querySelector('#memberArea');
const profile = panel.querySelector('#profileForm');
const fields = profile.elements;
const save = panel.querySelector('#saveProfile');
const say = (message) => { status.textContent = message; };
function updateControls() {
  fields.birth_time.disabled = busy || fields.birth_time_unknown.checked;
  fields.birth_time.required = !fields.birth_time_unknown.checked;
  save.disabled = busy || !fields.save_consent.checked;
  panel.querySelectorAll('.account-actions button').forEach((button) => { button.disabled = busy; });
}
function resetProfile() {
  profile.reset();
  updateControls();
}
toggle.addEventListener('click', () => {
  panel.hidden = !panel.hidden;
  toggle.setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) panel.querySelector('h2').focus();
});
profile.addEventListener('change', updateControls);

async function showSession(next) {
  const current = ++revision;
  session = next;
  document.body.dataset.authState = session ? 'in' : 'out';
  knownEmail = null;
  delete document.body.dataset.memberState;
  knownArea.hidden = true;
  cacheBirthElement(null);
  resetProfile();
  login.hidden = !!session;
  memberArea.hidden = true;
  toggle.textContent = session ? 'マイページ' : 'ログイン・登録';
  if (!session) {
    const email = rememberedEmail();
    if (email) {
      try {
        const result = await lookup(email);
        if (current !== revision || session) return;
        if (result.found) { showKnown(email, result); return; }
        try { localStorage.removeItem(memoryKey); } catch {}
      } catch {
        if (current === revision) say('時間をおいて試してください。');
        return;
      }
    }
    say('登録済みの方は、登録したメールアドレスを入れてください。そのままログインできます。はじめての方も、同じ欄からそのまま登録できます。パスワードは不要です。'); return; }
  say('プロフィールを読み込んでいます。');
  const { data, error } = await client.from('profiles_meishiki')
    .select('birth_date,birth_time,birth_time_unknown,save_consent')
    .eq('member_id', session.user.id).maybeSingle();
  if (current !== revision) return;
  if (error) { say('プロフィールを読み込めませんでした。マイページを開き直すか、ページを再読み込みしてください。'); return; }
  cacheBirthElement(data?.birth_date);
  if (data) {
    fields.birth_date.value = data.birth_date || '';
    fields.birth_time.value = data.birth_time || '';
    fields.birth_time_unknown.checked = data.birth_time_unknown;
    fields.save_consent.checked = data.save_consent;
  }
  memberArea.hidden = false;
  updateControls();
  say('ログインしています。ご自身の記録を管理できます。');
}
async function perform(action) {
  if (busy) return;
  busy = true;
  updateControls();
  try { await action(); }
  catch (error) { say(error.message === 'Lookup failed' ? '時間をおいて試してください。' : '操作を完了できませんでした。時間をおいて、もう一度お試しください。'); }
  finally { busy = false; updateControls(); }
}
async function publicFunction(name, body) {
  const response = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), cache: 'no-store',
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}
async function lookup(email) {
  try { return await publicFunction('member-lookup', { email }); }
  catch { say('時間をおいて試してください。'); throw new Error('Lookup failed'); }
}
async function sendMagicLink(email) {
  const redirect = new URL(location.href);
  redirect.hash = '';
  redirect.searchParams.delete('code');
  const { error } = await client.auth.signInWithOtp({ email,
    options: { emailRedirectTo: redirect.href } });
  if (error) throw error;
  say('メールを確認してください。「Supabase Auth」から届いたリンクでログインできます。');
}
function showKnown(email, result) {
  if (session) return;
  knownEmail = email.trim().toLowerCase();
  try { localStorage.setItem(memoryKey, knownEmail); } catch {}
  document.body.dataset.memberState = 'known';
  cacheBirthElement(result.birthDate);
  login.hidden = true;
  memberArea.hidden = true;
  knownArea.hidden = false;
  toggle.textContent = 'マイページ';
  panel.querySelector('#knownBirthDate').value = result.birthDate || '';
  panel.querySelector('#knownBirthTime').textContent = result.birthDate
    ? (result.birthTimeUnknown ? '出生時間は不明' : '') : '生年月日は未登録です。';
  const entries = window.__hbImportPastReadings?.(result.pastReadings) || [];
  const list = panel.querySelector('#knownReadings');
  list.replaceChildren();
  for (const entry of entries) {
    const item = document.createElement('li');
    item.textContent = `${entry.date}：${entry.names.join('・')}`;
    list.append(item);
  }
  if (!entries.length) {
    const item = document.createElement('li');
    item.textContent = '過去の巡りはまだありません。';
    list.append(item);
  }
  say('顔見知り状態です。そのまま占いを始められます。');
  panel.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
}
panel.querySelector('#verifyMember').addEventListener('click', () => perform(async () => {
  if (!session && knownEmail) await sendMagicLink(knownEmail);
}));
panel.querySelector('#forgetMember').addEventListener('click', () => {
  if (session || busy) return;
  ++revision;
  try { localStorage.removeItem(memoryKey); } catch {}
  knownEmail = null;
  delete document.body.dataset.memberState;
  knownArea.hidden = true;
  login.hidden = false;
  login.reset();
  cacheBirthElement(null);
  toggle.textContent = 'ログイン・登録';
  say('この端末の記憶を消しました。');
});
// Keep the existing anonymous measurement hook and its timing intact.
const measureReading = window.__hbRecordReading;
window.__hbRecordReading = () => {
  try { Promise.resolve(measureReading?.()).catch(() => {}); } catch {}
  const email = session?.user?.email || knownEmail;
  if (!email) return;
  try {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const draw = JSON.parse(localStorage.getItem('hanabiyori.free.v2'))?.days?.[date];
    if (draw) publicFunction('record-reading', { email, date, cards: draw.ids, variant: draw.variant }).catch(() => {});
  } catch {}
};
login.addEventListener('submit', (event) => {
  event.preventDefault();
  perform(async () => {
    const button = login.querySelector('button');
    button.disabled = true;
    try {
      const email = login.elements.email.value.trim().toLowerCase();
      const current = revision;
      const result = await lookup(email);
      if (current !== revision || session) return;
      if (result.found) { showKnown(email, result); return; }
      await sendMagicLink(email);
    } finally { button.disabled = false; }
  });
});
profile.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!session || !fields.save_consent.checked || !profile.reportValidity()) return;
  perform(async () => {
    const userId = session.user.id;
    const values = {
      birth_date: fields.birth_date.value,
      birth_time: fields.birth_time_unknown.checked ? null : fields.birth_time.value,
      birth_time_unknown: fields.birth_time_unknown.checked,
      save_consent: true,
      updated_at: new Date().toISOString(),
    };
    // The schema grants UPDATE only on input columns, excluding member_id.
    // Seed with ON CONFLICT DO NOTHING, then update only the permitted columns.
    const { error: insertError } = await client.from('profiles_meishiki')
      .upsert({ member_id: userId, ...values }, { onConflict: 'member_id', ignoreDuplicates: true });
    if (insertError) throw insertError;
    const { error } = await client.from('profiles_meishiki').update(values).eq('member_id', userId);
    if (error) throw error;
    if (session?.user.id === userId) {
      cacheBirthElement(values.birth_date);
      say('プロフィールを保存しました。');
    }
  });
});
async function callFunction(name, options = {}) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw new Error('Login required');
  const response = await fetch(`/.netlify/functions/${name}`, {
    ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}
panel.querySelector('#exportData').addEventListener('click', () => perform(async () => {
  const data = await callFunction('export-my-data');
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `hanabiyori-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  panel.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say('データを書き出しました。ダウンロードしたファイルは大切に保管してください。');
}));
panel.querySelector('#deleteData').addEventListener('click', () => {
  if (!window.confirm('保存した命式プロフィールと巡り手帳を削除します。元に戻せません。削除しますか？（会員退会・課金解約は行いません）')) return;
  perform(async () => {
    await callFunction('delete-my-data', { method: 'POST', body: JSON.stringify({ confirm: true }) });
    resetProfile();
    cacheBirthElement(null);
    say('命式プロフィールと巡り手帳を削除しました。');
  });
});
panel.querySelector('#logout').addEventListener('click', () => perform(async () => {
  const { error } = await client.auth.signOut();
  if (error) throw error;
  await showSession(null);
}));

try {
  // Dynamic import keeps CDN failures isolated from the free reading and gives a useful message.
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  client.auth.onAuthStateChange((_event, next) => {
    // Query outside the auth callback to avoid awaiting another Supabase call while its lock is held.
    setTimeout(() => { showSession(next).catch(() => say('ログイン情報を読み込めませんでした。ページを再読み込みしてください。')); }, 0);
  });
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  await showSession(data.session);
} catch {
  say('ログインの準備ができませんでした。時間をおいてページを再読み込みしてください。無料の三枚読みはそのままお楽しみいただけます。');
}
