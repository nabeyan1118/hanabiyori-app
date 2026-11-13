const { createServiceClient, json } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false }, { Allow: 'POST' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { ok: false }); }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const { date, cards, variant } = body || {};
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date
    || !Array.isArray(cards) || cards.length !== 3 || new Set(cards).size !== 3
    || cards.some(id => !Number.isInteger(id) || id < 0 || id > 47)
    || !Number.isInteger(variant) || variant < 0 || variant > 2) return json(400, { ok: false });
  try {
    const client = createServiceClient();
    const { data: member, error: memberError } = await client.from('members').select('id').eq('email', email).maybeSingle();
    if (memberError) throw memberError;
    if (member) {
      // cards is JSONB; retain the local draw's variant without inventing a DB column.
      const { error } = await client.from('notebook_entries').upsert({ member_id: member.id,
        entry_date: date, kind: 'free_reading', cards: { ids: cards, variant } },
      { onConflict: 'member_id,entry_date,kind' });
      if (error) throw error;
    }
    return json(200, { ok: true });
  } catch {
    return json(500, { ok: false });
  }
};
