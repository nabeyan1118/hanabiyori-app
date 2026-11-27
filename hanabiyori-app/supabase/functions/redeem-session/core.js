export async function handler(event, { client }) {
  const orderId = event.queryStringParameters && event.queryStringParameters.order_id;
  if (!orderId) {
    return { statusCode: 400, body: JSON.stringify({ error: "order_id is required" }) };
  }

  const { data: record, error } = await client.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;

  if (!record || record.status !== "paid") {
    return { statusCode: 200, body: JSON.stringify({ pending: true }) };
  }

  return { statusCode: 200, body: JSON.stringify({ pending: false, token: record.token }) };
}
