// ============================================================
// 有料八枚読みの本体(使い捨てトークン方式)
// 1. 鑑定権(トークン)を検証(未使用のみ通過)
// 2. 8枚を独立抽選(重複なし)
// 3. 役判定
// 4. AI(現在はOpenAIのみ)へ相談内容＋8枚を送って鑑定文を生成
// 5. 結果をトークンに紐づけて保存(再表示・二重利用防止のため)
// ============================================================
const { getStore } = require("@netlify/blobs");
const { drawUniqueCards, detectYaku } = require("./cards-data");

const CONCERN_MAX_LENGTH = 400;
const OPENAI_TIMEOUT_MS = 20000;

const CATEGORY_LABELS = ["仕事", "お金", "恋愛", "人間関係", "これからの流れ", "その他"];

const ROLE_LABELS = [
  "現在の状況",
  "表面に見えている課題",
  "まだ気づいていない背景",
  "自分自身の状態",
  "相手・周囲の状態",
  "環境から受ける影響",
  "流れを変える鍵",
  "このまま進んだ場合の結末",
];

async function generateReading(provider, payload) {
  if (provider === "openai") {
    return callOpenAI(payload);
  }
  throw new Error(`未対応のprovider: ${provider}`);
}

async function callOpenAI(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が未設定です");
  }

  const systemPrompt = `あなたは「花札日和」という占いサービスの鑑定士です。以下のルールを必ず守って鑑定文を作成してください。

- 日本語で、柔らかく落ち着いた和風の語り口で書く
- 相談内容に具体的に触れる。一般論だけで終わらせない
- 8枚の意味を単純に並べるのではなく、全体を一つの物語としてつなぐ
- 断定的に未来を決めつけない。「〜かもしれない」「〜という時期」のような表現を使う
- 不安を煽らない。読んだ人の気持ちが少し軽くなるように書く
- 依存を促さない(「また占ってほしい」「これがないとダメ」のような誘導はしない)
- 医療・法律・投資・生死に関わる重大な判断を、この占いだけで決めさせるような書き方をしない
- あくまで「娯楽として、考えを整理するための占い」という立場を保つ
- 毎回ほぼ同じ言い回しにならないよう、表現に変化をつける。ただし出力の長さと構成は安定させる

必ず次のJSON形式のみで出力してください。前後に説明文やコードブロック記号を付けないこと。

{
  "cards": [ { "role": "役割名", "interpretation": "その札の解釈(80〜120字程度)" }, ... 8個 ],
  "overall": "相談内容を踏まえた総合鑑定(200〜300字程度)",
  "nextAction": "今すぐできる一手(60〜100字程度)",
  "caution": "気をつけること(60〜100字程度)",
  "yakuMessage": "成立した役がある場合の特別メッセージ。無ければ空文字"
}`;

  const userContent = JSON.stringify({
    category: payload.category,
    concern: payload.concern,
    cards: payload.cards.map((c, i) => ({
      role: ROLE_LABELS[i],
      month: c.month,
      name: c.name,
      motif: c.motif,
      type: c.type,
      meaning: c.short,
    })),
    yaku: payload.yaku,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.9,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) {
    throw new Error("OpenAIの応答が空です");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    throw new Error("OpenAIの応答がJSONとして解釈できません");
  }

  if (!Array.isArray(parsed.cards) || parsed.cards.length !== 8 || !parsed.overall || !parsed.nextAction) {
    throw new Error("OpenAIの応答形式が不正です");
  }

  return parsed;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POSTのみ対応" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "リクエストが不正です" }) };
  }

  const token = (body.token || "").trim();
  const category = CATEGORY_LABELS.includes(body.category) ? body.category : "その他";
  const concern = (body.concern || "").trim();

  if (!token) {
    return { statusCode: 400, body: JSON.stringify({ error: "token is required" }) };
  }
  if (!concern) {
    return { statusCode: 400, body: JSON.stringify({ error: "相談内容は必須です" }) };
  }
  if (concern.length > CONCERN_MAX_LENGTH) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `相談内容は${CONCERN_MAX_LENGTH}文字以内でお願いします` }),
    };
  }

  const entitlements = getStore("entitlements");
  const record = await entitlements.get(token, { type: "json" });

  if (!record) {
    return { statusCode: 403, body: JSON.stringify({ error: "鑑定権が見つかりません" }) };
  }
  if (record.status === "used") {
    // 二重利用防止：既に使用済みなら、以前の結果をそのまま返す(再生成しない)
    return { statusCode: 200, body: JSON.stringify({ cards: record.cards, yaku: record.yaku, result: record.result }) };
  }
  if (record.status === "processing") {
    return { statusCode: 409, body: JSON.stringify({ error: "処理中です。少し待ってから再試行してください" }) };
  }

  // 連打・多重実行防止：処理中フラグを立ててから進む
  await entitlements.setJSON(token, { ...record, status: "processing" });

  const cards = drawUniqueCards(8);
  const yaku = detectYaku(cards);

  let result;
  try {
    result = await generateReading(process.env.AI_PROVIDER || "openai", { category, concern, cards, yaku });
  } catch (err) {
    // 失敗時は処理中フラグを戻し、購入者が鑑定権を失わないようにする
    await entitlements.setJSON(token, { ...record, status: "unused" });
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "鑑定の生成に失敗しました。少し時間をおいて、もう一度お試しください。" }),
    };
  }

  await entitlements.setJSON(token, {
    ...record,
    status: "used",
    usedAt: new Date().toISOString(),
    category,
    concern,
    cards,
    yaku,
    result,
  });

  return { statusCode: 200, body: JSON.stringify({ cards, yaku, result }) };
};
