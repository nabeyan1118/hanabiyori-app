import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handler } from './core.js';

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  const allowed = origin === 'https://hanabiyori-app.pages.dev' ||
    (origin !== null && /^https:\/\/[a-z0-9-]+\.hanabiyori-app\.pages\.dev$/.test(origin));
  const cors: Record<string, string> = allowed ? { 'Access-Control-Allow-Origin': origin!, Vary: 'Origin' } : {};
  if (allowed && request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }
  const url = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const headers = Object.fromEntries(request.headers.entries());
  headers['x-nf-client-connection-ip'] = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const result = await handler({ httpMethod: request.method, headers, body: await request.text() }, {
    client, fetch, lineChannelId: Deno.env.get('LINE_CHANNEL_ID'), now: Date.now,
    requireUserId: async (_client: unknown, event: { headers: Record<string, string> }) => {
      const match = /^Bearer\s+(\S+)$/i.exec(event.headers.authorization || '');
      if (!match) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
      const { data, error } = await authClient.auth.getUser(match[1]);
      if (error || !data?.user?.id) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
      return data.user.id;
    },
  });
  return new Response(result.body, { status: result.statusCode, headers: { ...result.headers, ...cors } });
});
