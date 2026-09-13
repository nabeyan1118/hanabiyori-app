// ============================================================
// 鑑定権トークンの検証(使い捨て方式)
// トークンが存在し、未使用かどうかを確認する。
// 使用済みの場合は、以前生成した鑑定結果をそのまま返す(再表示のため)。
// ============================================================
const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const token = (event.queryStringParameters && event.queryStringParameters.token || "").trim();
  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: "token is required" }) };
  }

  const entitlements = getStore("entitlements");
  const record = await entitlements.get(token, { type: "json" });

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
};
