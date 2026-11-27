export async function handler(event, { client, payjp, siteUrl = "https://hanabiyori-biyori.netlify.app", payjpConfigured }) {

  if (!payjpConfigured) {
    return { statusCode: 500, body: "PAYJP_SECRET_KEYが未設定です" };
  }

  const orderId = crypto.randomUUID();

  try {
    const { data: session, error } = await payjp.createCheckoutSession({
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
    });

    if (error || !session || !session.url) {
      return { statusCode: 500, body: JSON.stringify({ error: "決済ページの生成に失敗しました" }) };
    }

    // 先に注文レコードを作成しておく(Webhookが届く前に成功ページが開かれても混乱しないように)
    const { error: storageError } = await client.from("orders").insert({ id: orderId, status: "pending" });
    if (storageError) throw storageError;

    return {
      statusCode: 303,
      headers: { Location: session.url },
      body: "",
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "決済ページの生成に失敗しました" }) };
  }
};
