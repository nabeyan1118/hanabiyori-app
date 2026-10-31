const { createClient } = require('@supabase/supabase-js');

function createServiceClient() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server configuration unavailable');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function requireUserId(client, event) {
  const authorization = Object.entries(event.headers || {})
    .find(([name]) => name.toLowerCase() === 'authorization')?.[1];
  const match = typeof authorization === 'string' && /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  const { data, error } = await client.auth.getUser(match[1]);
  if (error || !data?.user?.id) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  return data.user.id;
}

function json(statusCode, value, extraHeaders = {}) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', ...extraHeaders }, body: JSON.stringify(value) };
}

module.exports = { createServiceClient, requireUserId, json };
