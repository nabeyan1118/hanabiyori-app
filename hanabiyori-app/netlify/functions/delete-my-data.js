const { createServiceClient, requireUserId, json } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  try {
    const client = createServiceClient();
    const memberId = await requireUserId(client, event);
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid JSON' }); }
    if (body?.confirm !== true) return json(400, { error: 'Explicit confirmation required' });
    // No transaction RPC exists in the applied schema. Retrying safely completes a partial deletion.
    for (const table of ['profiles_meishiki', 'notebook_entries']) {
      const { error } = await client.from(table).delete().eq('member_id', memberId);
      if (error) throw error;
    }
    return json(200, { deleted: true });
  } catch (error) {
    return json(error.statusCode === 401 ? 401 : 500, { error: error.statusCode === 401 ? 'Unauthorized' : 'Deletion incomplete; please retry' });
  }
};
