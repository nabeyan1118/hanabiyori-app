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

function allowedOrigin(origin) {
  return origin === 'https://hanabiyori-app.pages.dev' ||
    (typeof origin === 'string' && /^https:\/\/[a-z0-9-]+\.hanabiyori-app\.pages\.dev$/.test(origin));
}

function withCors(handler) {
  return async (event) => {
    const origin = Object.entries(event.headers || {}).find(([name]) => name.toLowerCase() === 'origin')?.[1];
    if (!allowedOrigin(origin)) return handler(event);
    const headers = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { ...headers,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' };
    const response = await handler(event);
    const existingHeaders = { ...response.headers };
    const varyKey = Object.keys(existingHeaders).find((name) => name.toLowerCase() === 'vary');
    const vary = varyKey ? existingHeaders[varyKey] : '';
    if (varyKey) delete existingHeaders[varyKey];
    return { ...response, headers: { ...existingHeaders, ...headers,
      Vary: vary ? `${vary}, Origin` : 'Origin' } };
  };
}

module.exports = { createServiceClient, requireUserId, json, allowedOrigin, withCors };
