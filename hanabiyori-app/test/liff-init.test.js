const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
test('LIFF initialization in simulated browser contexts', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  {
    const page = html;
    const code = page.match(/<script>\s*(window\.hbLineAuth = [\s\S]*?)<\/script>/)[1];
    for (const inside of [false, true]) {
      let calls = 0;
      const liff = { init: async ({ liffId }) => assert.equal(liffId, '2012718957-z5i5pyPU'), isInClient: () => inside, getIDToken: () => 'token' };
      const window = { liff };
      vm.runInNewContext(code, { window, liff, fetch: async (_url, options) => { assert.equal(_url, 'https://lbokynfmrdipdjekzibj.supabase.co/functions/v1/line-auth'); calls++; assert.equal(JSON.parse(options.body).action, 'status'); return { ok: true, json: async () => ({ linked: true }) }; } });
      const result = await window.hbLineAuth;
      assert.equal(calls, inside ? 1 : 0);
      assert.equal(result?.linked, inside ? true : undefined);
    }
  }
});
