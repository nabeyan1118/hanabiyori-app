// ============================================================
// Pay.jp Checkout Session を作成し、決済ページへリダイレクトする。
// サイト内の「購入する」リンクはこのFunctionを直接指す。
// ============================================================
const { createClient, createCheckoutSession } = require("@payjp/payjpv2");
const crypto = require("crypto");
const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  const apiKey = process.env.PAYJP_SECRET_KEY;
  const siteUrl = process.env.SITE_URL || "https://hanabiyori-biyori.netlify.app";

  if (!apiKey) {
    return { statusCode: 500, body: "PAYJP_SECRET_KEYが未設定です" };
  }

  const orderId = crypto.randomUUID();
  const client = createClient({ apiKey });

  try {
    const { data: session, error } = await createCheckoutSession({
      client,
      body: {
        line_items: [
          {
            price_data: {
              currency: "jpy",
              unit_amount: 980,
              product_data: { name: "花札日和 八枚読み" },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${siteUrl}/success.html?order_id=${orderId}`,
        cancel_url: `${siteUrl}/`,
        metadata: { order_id: orderId },
      },
    });

    if (error || !session || !session.url) {
      return { statusCode: 500, body: JSON.stringify({ error: "決済ページの生成に失敗しました" }) };
    }

    // 先に注文レコードを作成しておく(Webhookが届く前に成功ページが開かれても混乱しないように)
    const orders = getStore("orders");
    await orders.setJSON(orderId, { status: "pending" });

    return {
      statusCode: 303,
      headers: { Location: session.url },
      body: "",
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "決済ページの生成に失敗しました" }) };
  }
};
