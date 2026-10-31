const { createServiceClient, requireUserId, json } = require('./_supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' }, { Allow: 'GET' });
  try {
    const client = createServiceClient();
    const memberId = await requireUserId(client, event);
    const result = {};
    // Page through every table: Supabase's default row limit must not truncate exports.
    for (const table of ['members', 'profiles_meishiki', 'contracts', 'notebook_entries', 'reading_runs']) {
      const ownerColumn = table === 'members' ? 'id' : 'member_id';
      const orderColumn = table === 'profiles_meishiki' ? 'member_id' : 'id';
      result[table] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await client.from(table).select('*').eq(ownerColumn, memberId)
          .order(orderColumn).range(offset, offset + 499);
        if (error) throw error;
        result[table].push(...data);
        if (data.length < 500) break;
      }
    }
    return json(200, result);
  } catch (error) {
    return json(error.statusCode === 401 ? 401 : 500, { error: error.statusCode === 401 ? 'Unauthorized' : 'Export failed' });
  }
};
