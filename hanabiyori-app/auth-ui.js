import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const panel = document.getElementById('accountPanel');
const toggle = document.getElementById('accountToggle');
let client;
let session = null;
let revision = 0;
let busy = false;

panel.innerHTML = `
  <h2 tabindex="-1">ログイン／マイページ</h2>
  <p id="accountStatus" role="status" aria-live="polite">ログインの準備をしています。</p>
  <form id="loginForm" hidden>
    <label>メールアドレス<input name="email" type="email" autocomplete="email" required></label>
    <button type="submit">ログイン用リンクを送る</button>
  </form>
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
  resetProfile();
  login.hidden = !!session;
  memberArea.hidden = true;
  toggle.textContent = session ? 'マイページ' : 'ログイン／マイページ';
  if (!session) { say('メールのリンクから、ゆっくりログインできます。'); return; }
  say('プロフィールを読み込んでいます。');
  const { data, error } = await client.from('profiles_meishiki')
    .select('birth_date,birth_time,birth_time_unknown,save_consent')
    .eq('member_id', session.user.id).maybeSingle();
  if (current !== revision) return;
  if (error) { say('プロフィールを読み込めませんでした。マイページを開き直すか、ページを再読み込みしてください。'); return; }
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
  catch { say('操作を完了できませんでした。時間をおいて、もう一度お試しください。'); }
  finally { busy = false; updateControls(); }
}
login.addEventListener('submit', (event) => {
  event.preventDefault();
  perform(async () => {
    const button = login.querySelector('button');
    button.disabled = true;
    try {
      const redirect = new URL(location.href);
      redirect.hash = '';
      redirect.searchParams.delete('code');
      const { error } = await client.auth.signInWithOtp({ email: login.elements.email.value.trim(),
        options: { emailRedirectTo: redirect.href } });
      if (error) throw error;
      say('メールを確認してください。届いたリンクからログインできます。お好きなタイミングでお進みください。');
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
    if (session?.user.id === userId) say('プロフィールを保存しました。');
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
