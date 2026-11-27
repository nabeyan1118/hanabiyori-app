import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handler } from './core.js';

Deno.serve(async (request: Request) => {
  const client = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } });
  const headers = Object.fromEntries(request.headers.entries());
  headers['x-nf-client-connection-ip'] = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const queryStringParameters = Object.fromEntries(new URL(request.url).searchParams.entries());
  const apiKey = Deno.env.get('PAYJP_SECRET_KEY');
  const payjp = { createCheckoutSession: async (body: unknown) => {
    const response = await fetch('https://api.pay.jp/v1/checkout/sessions', { method: 'POST',
      headers: { Authorization: `Basic ${btoa((apiKey || '') + ':')}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    return response.ok ? { data, error: null } : { data: null, error: data };
  } };
  const deps = { client, payjp, payjpConfigured: !!apiKey, siteUrl: Deno.env.get('SITE_URL') || 'https://hanabiyori-biyori.netlify.app' };
  const result = await handler({ httpMethod: request.method, headers, queryStringParameters, body: await request.text() }, deps);
  return new Response(result.body, { status: result.statusCode, headers: { ...result.headers } });
});
