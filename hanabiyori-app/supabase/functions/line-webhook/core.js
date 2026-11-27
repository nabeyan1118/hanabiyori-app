export async function handler(event, { client, authAdmin, channelSecret, verifySignature }) {
  const json = (statusCode, value, extraHeaders = {}) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
    body: JSON.stringify(value),
  });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });

  const signature = Object.entries(event.headers || {}).find(([name]) => name.toLowerCase() === 'x-line-signature')?.[1];
  let valid = false;
  if (channelSecret && typeof signature === 'string' && signature && typeof event.rawBody === 'string') {
    try { valid = await verifySignature(event.rawBody, signature, channelSecret); } catch { /* Invalid signature. */ }
  }
  if (!valid) return json(401, { error: 'Unauthorized' });

  let body;
  try { body = JSON.parse(event.rawBody); } catch { return json(400, { error: 'Invalid JSON' }); }
  const events = Array.isArray(body?.events) ? body.events : [];
  try {
    for (const item of events) {
      const lineUserId = item?.source?.userId;
      if (item?.type !== 'follow' || typeof lineUserId !== 'string' || !lineUserId.trim()) continue;
      const { data: linked, error: lookupError } = await client.from('members').select('id').eq('line_user_id', lineUserId).maybeSingle();
      if (lookupError) throw lookupError;
      if (linked) continue;
      const email = `${lineUserId}@line.hanafuda-biyori.local`;
      let userId = await authAdmin.findUserIdByEmail(email);
      if (!userId) userId = (await authAdmin.createUser(email)).id;
      const { error: insertError } = await client.from('members').insert({ id: userId, line_user_id: lineUserId });
      if (insertError?.code === '23505') {
        const { data: current, error } = await client.from('members').select('id').eq('line_user_id', lineUserId).maybeSingle();
        if (error) throw error;
        if (!current) throw insertError;
      } else if (insertError) throw insertError;
    }
    return json(200, { ok: true });
  } catch (error) {
    console.error('LINE webhook event processing failed', error);
    return json(500, { error: 'Please try again later' });
  }
}
