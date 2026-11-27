export async function handler(event, { client, webhookSecret }) {
  const receivedToken = event.headers["x-payjp-webhook-token"];
  const expected = webhookSecret;

  if (!expected || receivedToken !== expected) {
    return { statusCode: 401, body: JSON.stringify({ error: "invalid webhook token" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "invalid body" };
  }

  if (payload.type === "checkout.session.completed") {
    const session = payload.data || {};
    const orderId = session.metadata && session.metadata.order_id;

    if (orderId) {
      const token = crypto.randomUUID();
      const { error: entitlementError } = await client.from("entitlements").upsert({ token, status: "unused", created_at: new Date().toISOString(), order_id: orderId });
      if (entitlementError) throw entitlementError;
      const { error: orderError } = await client.from("orders").upsert({ id: orderId, status: "paid", token });
      if (orderError) throw orderError;
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
