import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handler } from './core.js';

Deno.serve(async (request: Request) => {
  const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } });
  const headers = Object.fromEntries(request.headers.entries());
  headers['x-nf-client-connection-ip'] = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const queryStringParameters = Object.fromEntries(new URL(request.url).searchParams.entries());
  const deps = { client, webhookSecret: Deno.env.get('PAYJP_WEBHOOK_SECRET') };
  const result = await handler({ httpMethod: request.method, headers, queryStringParameters, body: await request.text() }, deps);
  return new Response(result.body, { status: result.statusCode, headers: { ...result.headers } });
});
