export async function handler(event, { client }) {
  const token = (event.queryStringParameters && event.queryStringParameters.token || "").trim();
  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: "token is required" }) };
  }

  const { data: record, error } = await client.from("entitlements").select("*").eq("token", token).maybeSingle();
  if (error) throw error;

  if (!record) {
    return { statusCode: 200, body: JSON.stringify({ valid: false }) };
  }

  if (record.status === "used") {
    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        used: true,
        cards: record.cards || [],
        yaku: record.yaku || [],
        result: record.result || null,
      }),
    };
  }

  return { statusCode: 200, body: JSON.stringify({ valid: true, used: false }) };
}
