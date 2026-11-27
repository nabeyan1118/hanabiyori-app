import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handler } from './core.js';

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!secret) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  try {
    const decoded = atob(signature);
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', key, bytes, encoder.encode(rawBody));
  } catch {
    return false;
  }
}

Deno.serve(async (request: Request) => {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const client = createClient(url, serviceKey, { auth: { persistSession: false } });
  const rawBody = await request.text();
  const result = await handler({ httpMethod: request.method, headers: Object.fromEntries(request.headers.entries()), rawBody, body: rawBody }, {
    client,
    channelSecret: Deno.env.get('LINE_MESSAGING_CHANNEL_SECRET') || '',
    verifySignature,
    authAdmin: {
      findUserIdByEmail: async (email: string) => {
        const perPage = 1000;
        for (let page = 1; ; page++) {
          const { data, error } = await client.auth.admin.listUsers({ page, perPage });
          if (error) throw error;
          const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
          if (user) return user.id;
          if (data.users.length < perPage) return null;
        }
      },
      createUser: async (email: string) => {
        const { data, error } = await client.auth.admin.createUser({ email, email_confirm: true });
        if (error) throw error;
        if (!data.user) throw new Error('User unavailable');
        return { id: data.user.id };
      },
    },
  });
  return new Response(result.body, { status: result.statusCode, headers: result.headers });
});
