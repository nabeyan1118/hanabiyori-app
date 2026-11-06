(() => {
  let clientPromise;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  async function getClient() {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('./supabase-config.js');
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    // Same module URL as auth-ui.js: the browser loads the library only once.
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  window.__hbRecordReading = async () => {
    try {
      const client = await (clientPromise ||= getClient());
      if (!client) return;
      let terminalId = localStorage.getItem('hanabiyori_terminal_id');
      if (!uuidPattern.test(terminalId || '')) {
        if (typeof crypto.randomUUID === 'function') {
          terminalId = crypto.randomUUID();
        } else {
          const bytes = crypto.getRandomValues(new Uint8Array(16));
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;
          const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
          terminalId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        }
        localStorage.setItem('hanabiyori_terminal_id', terminalId);
      }
      await client.from('reading_events').insert({ terminal_id: terminalId });
    } catch {
      // Measurement must never interrupt the reading or display an error.
    }
  };
})();
