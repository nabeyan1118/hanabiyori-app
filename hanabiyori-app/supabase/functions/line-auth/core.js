export async function handler(event, { client, requireUserId, fetch, lineChannelId, now, authAdmin }) {
  const json = (statusCode, value, extraHeaders = {}) => ({ statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }, body: JSON.stringify(value) });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
  if (!body || !['status', 'link', 'enter'].includes(body.action) || typeof body.idToken !== 'string' || !body.idToken.trim()) return json(400, { error: 'Invalid input' });
  try {
    const userId = body.action === 'link' ? await requireUserId(client, event) : null;
    if (!lineChannelId) throw new Error('Configuration unavailable');
    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ id_token: body.idToken, client_id: lineChannelId }) });
    if (!response.ok) return json(401, { error: 'Invalid token' });
    const verified = await response.json();
    if (typeof verified.sub !== 'string' || !verified.sub || typeof verified.exp !== 'number' || verified.exp <= now() / 1000) return json(401, { error: 'Invalid token' });
    const ip = Object.entries(event.headers || {}).find(([name]) => name.toLowerCase() === 'x-nf-client-connection-ip')?.[1] || 'unknown';
    const since = new Date(now() - 3600000).toISOString();
    const { error: logError } = await client.from('line_auth_log').insert({ line_user_id: verified.sub, ip });
    if (logError) throw logError;
    for (const [column, value] of [['line_user_id', verified.sub], ['ip', ip]]) {
      const { count, error } = await client.from('line_auth_log').select('*', { count: 'exact', head: true }).eq(column, value).gte('at', since);
      if (error) throw error;
      if (count > 10) return json(429, { error: 'Please try again later' });
    }
    const { data: linked, error: lookupError } = await client.from('members').select('id').eq('line_user_id', verified.sub).maybeSingle();
    if (lookupError) throw lookupError;
    if (body.action === 'status') return json(200, linked ? { linked: true, memberId: linked.id } : { linked: false });
    if (body.action === 'enter') {
      const email = `${verified.sub}@line.hanafuda-biyori.local`;
      if (linked) {
        const linkedEmail = await authAdmin.getUserEmailById(linked.id);
        if (linkedEmail == null) throw new Error('User email unavailable');
        return json(200, { entered: true, created: false, tokenHash: await authAdmin.issueTokenHash(linkedEmail) });
      }
      let userId = await authAdmin.findUserIdByEmail(email);
      if (!userId) userId = (await authAdmin.createUser(email)).id;
      const { error: insertError } = await client.from('members').insert({ id: userId, line_user_id: verified.sub });
      if (insertError?.code === '23505') {
        const { data: current, error } = await client.from('members').select('id').eq('line_user_id', verified.sub).maybeSingle();
        if (error) throw error;
        if (!current) throw insertError;
        const currentEmail = await authAdmin.getUserEmailById(current.id);
        if (currentEmail == null) throw new Error('User email unavailable');
        return json(200, { entered: true, created: false, tokenHash: await authAdmin.issueTokenHash(currentEmail) });
      } else if (insertError) throw insertError;
      return json(200, { entered: true, created: true, tokenHash: await authAdmin.issueTokenHash(email) });
    }
    if (linked && linked.id !== userId) return json(409, { error: 'Already linked' });
    const { data: member, error: memberError } = await client.from('members').select('line_user_id').eq('id', userId).maybeSingle();
    if (memberError) throw memberError;
    if (!member) throw new Error('Member unavailable');
    if (member.line_user_id === verified.sub) return json(200, { linked: true });
    if (member.line_user_id !== null) return json(409, { error: 'Already linked' });
    const { data: updated, error: updateError } = await client.from('members').update({ line_user_id: verified.sub }).eq('id', userId).is('line_user_id', null).select('id').maybeSingle();
    if (updateError?.code === '23505') return json(409, { error: 'Already linked' });
    if (updateError) throw updateError;
    if (!updated) {
      const { data: current, error } = await client.from('members').select('line_user_id').eq('id', userId).maybeSingle();
      if (error) throw error;
      return current?.line_user_id === verified.sub ? json(200, { linked: true }) : json(409, { error: 'Already linked' });
    }
    return json(200, { linked: true });
  } catch (error) {
    if (error.statusCode === 401) return json(401, { error: 'Unauthorized' });
    return json(500, { error: 'Please try again later' });
  }
}
