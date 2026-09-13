// ============================================================
// Pay.jp Webhook受信
// 決済完了(checkout.session.completed)を検知し、
// 鑑定権トークンを1つ発行してNetlify Blobsに保存する。
// ============================================================
const { getStore } = require("@netlify/blobs");
const crypto = require("crypto");

exports.handler = async (event) => {
  const receivedToken = event.headers["x-payjp-webhook-token"];
  const expected = process.env.PAYJP_WEBHOOK_SECRET;

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
      const entitlements = getStore("entitlements");
      const orders = getStore("orders");

      await entitlements.setJSON(token, {
        status: "unused", // unused → used
        createdAt: new Date().toISOString(),
        orderId,
      });
      await orders.setJSON(orderId, { status: "paid", token });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
