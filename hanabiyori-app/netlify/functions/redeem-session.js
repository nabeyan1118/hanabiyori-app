// ============================================================
// 決済完了後、success.htmlから呼ばれる。
// 注文IDから、Webhookが発行したトークンを引き当てる。
// Webhookの処理が数秒遅れることがあるため、見つからない場合は
// pending:true を返し、クライアント側で少し待って再試行させる。
// ============================================================
const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const orderId = event.queryStringParameters && event.queryStringParameters.order_id;
  if (!orderId) {
    return { statusCode: 400, body: JSON.stringify({ error: "order_id is required" }) };
  }

  const orders = getStore("orders");
  const record = await orders.get(orderId, { type: "json" });

  if (!record || record.status !== "paid") {
    return { statusCode: 200, body: JSON.stringify({ pending: true }) };
  }

  return { statusCode: 200, body: JSON.stringify({ pending: false, token: record.token }) };
};
