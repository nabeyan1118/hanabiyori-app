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
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const headers = Object.fromEntries(request.headers.entries());
  headers['x-nf-client-connection-ip'] = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const result = await handler({ httpMethod: request.method, headers, body: await request.text() }, {
    client,
  });
  return new Response(result.body, { status: result.statusCode, headers: { ...result.headers, ...cors } });
});
