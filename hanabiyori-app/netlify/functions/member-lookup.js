const { createServiceClient, json } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Invalid email' });
  try {
    const client = createServiceClient();
    // Netlify supplies this header from the connection, rather than trusting X-Forwarded-For.
    const ip = Object.entries(event.headers || {}).find(([name]) => name.toLowerCase() === 'x-nf-client-connection-ip')?.[1] || 'unknown';
    const since = new Date(Date.now() - 3600000).toISOString();
    const { error: logError } = await client.from('member_lookup_log').insert({ email, ip });
    if (logError) throw logError;
    // Separate filters avoid interpolating user input into PostgREST's OR syntax.
    for (const [column, value] of [['email', email], ['ip', ip]]) {
      const { count, error } = await client.from('member_lookup_log').select('*', { count: 'exact', head: true })
        .eq(column, value).gte('at', since);
      if (error) throw error;
      if (count > 10) return json(429, { error: 'Please try again later' });
    }
    const { data: member, error: memberError } = await client.from('members').select('id').eq('email', email).maybeSingle();
    if (memberError) throw memberError;
    if (!member) return json(200, { found: false });
    const { data: profile, error: profileError } = await client.from('profiles_meishiki')
      .select('birth_date,birth_time_unknown').eq('member_id', member.id).maybeSingle();
    if (profileError) throw profileError;
    const { data: entries, error: entriesError } = await client.from('notebook_entries')
      .select('entry_date,cards').eq('member_id', member.id).order('entry_date', { ascending: false }).limit(14);
    if (entriesError) throw entriesError;
    return json(200, { found: true, birthDate: profile?.birth_date || null,
      birthTimeUnknown: profile?.birth_time_unknown ?? true,
      pastReadings: entries.map(({ entry_date, cards }) => ({ date: entry_date, cards })) });
  } catch {
    return json(500, { error: 'Please try again later' });
  }
};
