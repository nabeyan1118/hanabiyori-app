const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const original = Module._load;
let state;
const client = { from(table) {
  let filters = {};
  const query = {
    insert() { return Promise.resolve({}); },
    select() { return query; },
    eq(k, v) { filters[k] = v; return query; },
    is(k, v) { filters[k] = v; return query; },
    gte() { return Promise.resolve({ count: state.count || 1 }); },
    update(values) { query.values = values; return query; },
    maybeSingle() {
      if (table !== 'members') throw Error('unexpected table');
      if (query.values) { state.members[filters.id] = query.values.line_user_id; return Promise.resolve({ data: { id: filters.id } }); }
      if (filters.line_user_id) { const id = Object.keys(state.members).find(k => state.members[k] === filters.line_user_id); return Promise.resolve({ data: id ? { id } : null }); }
      return Promise.resolve({ data: Object.hasOwn(state.members, filters.id) ? { line_user_id: state.members[filters.id] } : null });
    },
  }; return query;
} };
const { readFileSync } = require('node:fs');
let handler;
const ready = import('data:text/javascript;base64,' + Buffer.from(readFileSync(require('node:path').join(__dirname, '../supabase/functions/line-auth/core.js'))).toString('base64')).then(m => { handler = m.handler; });
const deps = { client, requireUserId: async (_client, event) => { if (!event.headers?.authorization) throw Object.assign(Error(), { statusCode: 401 }); return 'me'; }, lineChannelId: 'test', now: Date.now, fetch: async () => ({ ok: state.valid !== false, json: async () => ({ sub: 'line', exp: state.exp ?? Math.floor(Date.now() / 1000) + 60 }) }) };
async function call(action = 'status', headers = {}) { await ready; return handler({ httpMethod: 'POST', headers, body: JSON.stringify({ action, idToken: 'token' }) }, deps); }
const cases = [
  ['invalid token', { valid: false }, 'status', {}, 401],
  ['expired token', { exp: 1 }, 'status', {}, 401],
  ['linked status', { members: { me: 'line' } }, 'status', {}, 200, { linked: true, memberId: 'me' }],
  ['unlinked status', {}, 'status', {}, 200, { linked: false }],
  ['invalid input', {}, 'bad', {}, 400],
  ['rate limit', { count: 11 }, 'status', {}, 429],
  ['invalid bearer', {}, 'link', {}, 401],
  ['member already linked', { members: { me: 'other' } }, 'link', { authorization: 'Bearer token' }, 409],
  ['line already linked', { members: { me: null, other: 'line' } }, 'link', { authorization: 'Bearer token' }, 409],
  ['link', { members: { me: null } }, 'link', { authorization: 'Bearer token' }, 200, { linked: true }],
  ['idempotent link', { members: { me: 'line' } }, 'link', { authorization: 'Bearer token' }, 200, { linked: true }],
];
for (const [name, setup, action, headers, expected, body] of cases) test(name, async () => {
  state = { members: {}, ...setup };
  const result = await call(action, headers);
  assert.equal(result.statusCode, expected);
  if (body) assert.deepEqual(JSON.parse(result.body), body);
  if (name === 'link') assert.equal(state.members.me, 'line');
});
