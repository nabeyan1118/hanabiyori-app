const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const load = Module._load;
Module._load = function (name) { if (name === '@supabase/supabase-js') return {}; return load.apply(this, arguments); };
const { withCors } = require('../netlify/functions/_supabase');
Module._load = load;
let calls = 0;
const handler = withCors(async () => { calls++; return { statusCode: 405, headers: { Allow: 'POST' }, body: '' }; });
test('allowed origin preserves response headers', async () => {
  const r = await handler({ httpMethod: 'POST', headers: { Origin: 'https://hanabiyori-app.pages.dev' } });
  assert.equal(r.headers['Access-Control-Allow-Origin'], 'https://hanabiyori-app.pages.dev'); assert.equal(r.headers.Vary, 'Origin'); assert.equal(r.headers.Allow, 'POST');
});
test('preview preflight returns 204 without handler', async () => {
  const before = calls; const r = await handler({ httpMethod: 'OPTIONS', headers: { origin: 'https://abc.hanabiyori-app.pages.dev' } });
  assert.equal(r.statusCode, 204); assert.equal(calls, before); assert.equal(r.headers['Access-Control-Allow-Methods'], 'POST, GET, OPTIONS'); assert.equal(r.headers['Access-Control-Allow-Headers'], 'Content-Type, Authorization');
});
test('disallowed origin has no CORS headers', async () => {
  const r = await handler({ httpMethod: 'POST', headers: { origin: 'https://evil.example' } }); assert.equal(r.headers['Access-Control-Allow-Origin'], undefined);
});
test('disallowed OPTIONS reaches handler', async () => {
  const before = calls; const r = await handler({ httpMethod: 'OPTIONS', headers: { origin: 'https://evil.example' } }); assert.equal(calls, before + 1); assert.equal(r.statusCode, 405); assert.equal(r.headers['Access-Control-Allow-Origin'], undefined);
});
