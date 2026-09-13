// ============================================================
// 花札 48枚データ(フロントエンドとFunctionsの両方から参照する単一ソース)
// 月ごとの意味(short/long/action)は元の12ヶ月データを踏襲し、
// 実際の花札の構成(光・種・短冊・カス)に合わせて1ヶ月4枚に展開したもの。
// ============================================================

const MONTHS = [
  {
    month: "一月", name: "松",
    short: "変わらぬ土台。今ある基盤を信じて動いていい時期。",
    long: "松は一年を通して緑を絶やさない、変わらないものの象徴。今のあなたの状況は、派手さはなくとも土台が固まっている。焦って作り変える必要はなく、今ある関係・仕組みをどう活かすかが焦点になる。",
    action: "今日は新しいことより、今ある手札の点検を。",
    cards: [
      { suffix: "hikari", motif: "松に鶴", type: "光" },
      { suffix: "tanzaku", motif: "松の赤短", type: "短冊", tanColor: "赤" },
      { suffix: "kasu-1", motif: "松のカス", type: "カス" },
      { suffix: "kasu-2", motif: "松のカス", type: "カス" },
    ],
  },
  {
    month: "二月", name: "梅",
    short: "寒さの中の先駆け。まだ結果は出ないが、動き出す価値はある。",
    long: "梅は雪の残る中で一番早く咲く花。周りがまだ動いていない今だからこそ、先に手をつけたことが後で効いてくる。結果はすぐに出なくても、種はもう蒔かれている。",
    action: "誰よりも先に、小さな一歩を踏み出す。",
    cards: [
      { suffix: "tane", motif: "梅に鶯", type: "種" },
      { suffix: "tanzaku", motif: "梅の赤短", type: "短冊", tanColor: "赤" },
      { suffix: "kasu-1", motif: "梅のカス", type: "カス" },
      { suffix: "kasu-2", motif: "梅のカス", type: "カス" },
    ],
  },
  {
    month: "三月", name: "桜",
    short: "短い盛り。今の勢いは長くは続かない、今のうちに動く。",
    long: "桜は満開の期間が短い。今、勢いや注目が集まっているなら、それは長続きしない前提で動くべき局面。判断を先延ばしにすると、機会そのものが散ってしまう。",
    action: "迷っている案件、今日中に一つ結論を出す。",
    cards: [
      { suffix: "hikari", motif: "桜に幕", type: "光" },
      { suffix: "tanzaku", motif: "桜の赤短", type: "短冊", tanColor: "赤" },
      { suffix: "kasu-1", motif: "桜のカス", type: "カス" },
      { suffix: "kasu-2", motif: "桜のカス", type: "カス" },
    ],
  },
  {
    month: "四月", name: "藤",
    short: "つながりの中で伸びる。一人で抱えず、誰かに預ける時期。",
    long: "藤は他の木に絡みつきながら高く伸びる植物。今のあなたに必要なのは、自力ですべて解決することではなく、誰かとの繋がりを頼ること。一人で背負っている何かを、少し手放していい。",
    action: "今日、誰か一人に「頼み事」を一つしてみる。",
    cards: [
      { suffix: "tane", motif: "藤にほととぎす", type: "種" },
      { suffix: "tanzaku", motif: "藤の短冊", type: "短冊", tanColor: "無地" },
      { suffix: "kasu-1", motif: "藤のカス", type: "カス" },
      { suffix: "kasu-2", motif: "藤のカス", type: "カス" },
    ],
  },
  {
    month: "五月", name: "菖蒲",
    short: "筋を通す力が問われる。曖昧にしていたことに白黒つける時。",
    long: "菖蒲は「勝負」や「尚武」に通じる札。今のあなたは、どこかで曖昧にしてきた判断に決着をつけるべき局面にいる。角が立つことを恐れず、筋を通した方が長期的には楽になる。",
    action: "先延ばしにしている「はい/いいえ」の返事を、今日出す。",
    cards: [
      { suffix: "tane", motif: "菖蒲に八橋", type: "種" },
      { suffix: "tanzaku", motif: "菖蒲の短冊", type: "短冊", tanColor: "無地" },
      { suffix: "kasu-1", motif: "菖蒲のカス", type: "カス" },
      { suffix: "kasu-2", motif: "菖蒲のカス", type: "カス" },
    ],
  },
  {
    month: "六月", name: "牡丹",
    short: "華やかさが力になる。今は控えめより、目立って良い時期。",
    long: "牡丹は「花の王」と呼ばれる存在感の象徴。今は謙遜して控えめにいる時期ではなく、自分の仕事や考えを堂々と外に出していい局面。遠慮が、むしろ機会を逃す原因になる。",
    action: "今日やったことを、誰かに一言でいいから見せる。",
    cards: [
      { suffix: "tane", motif: "牡丹に蝶", type: "種" },
      { suffix: "tanzaku", motif: "牡丹の青短", type: "短冊", tanColor: "青" },
      { suffix: "kasu-1", motif: "牡丹のカス", type: "カス" },
      { suffix: "kasu-2", motif: "牡丹のカス", type: "カス" },
    ],
  },
  {
    month: "七月", name: "萩",
    short: "地味な積み重ねが後で効く。派手さのない努力を続けて良い。",
    long: "萩は目立たないが、根を張って毎年花をつける植物。今の状況は評価されにくいかもしれないが、その積み重ねは無駄になっていない。焦らず淡々と続けることが最終的に一番強い。",
    action: "地味だが後回しにしていた作業を一つ片付ける。",
    cards: [
      { suffix: "tane", motif: "萩に猪", type: "種" },
      { suffix: "tanzaku", motif: "萩の短冊", type: "短冊", tanColor: "無地" },
      { suffix: "kasu-1", motif: "萩のカス", type: "カス" },
      { suffix: "kasu-2", motif: "萩のカス", type: "カス" },
    ],
  },
  {
    month: "八月", name: "芒",
    short: "視界が開ける。全体を見渡して、方向を決め直す時。",
    long: "芒(すすき)は秋の見晴らしの良さの象徴。今は細部にこだわるより、少し引いて全体を見渡すべき局面。今のやり方をこのまま続けるべきか、方向を変えるべきか、俯瞰する時間を取る価値がある。",
    action: "今日は5分だけ、今後3ヶ月の予定を紙に書き出す。",
    cards: [
      { suffix: "hikari", motif: "芒に月", type: "光" },
      { suffix: "tane", motif: "芒に雁", type: "種" },
      { suffix: "kasu-1", motif: "芒のカス", type: "カス" },
      { suffix: "kasu-2", motif: "芒のカス", type: "カス" },
    ],
  },
  {
    month: "九月", name: "菊",
    short: "長く続けてきたものが実を結び始める。評価を受け取っていい。",
    long: "菊は長寿と気品の象徴。これまで積み重ねてきたことが、少しずつ形になり始めている時期。謙遜しすぎず、来た評価や結果を素直に受け取ることが、次の意欲につながる。",
    action: "最近の小さな成果を一つ、自分で認めてあげる。",
    cards: [
      { suffix: "tane", motif: "菊に盃", type: "種" },
      { suffix: "tanzaku", motif: "菊の青短", type: "短冊", tanColor: "青" },
      { suffix: "kasu-1", motif: "菊のカス", type: "カス" },
      { suffix: "kasu-2", motif: "菊のカス", type: "カス" },
    ],
  },
  {
    month: "十月", name: "紅葉",
    short: "終わりが近い何かがある。惜しまず区切りをつけていい。",
    long: "紅葉は散る前に一番美しく色づく。今関わっている何か(仕事のやり方、関係、習慣)は、終わりに近づいているサインかもしれない。しがみつくより、綺麗に区切りをつけた方が次に進みやすい。",
    action: "やめどきを感じているものを、一つ紙に書き出す。",
    cards: [
      { suffix: "tane", motif: "紅葉に鹿", type: "種" },
      { suffix: "tanzaku", motif: "紅葉の青短", type: "短冊", tanColor: "青" },
      { suffix: "kasu-1", motif: "紅葉のカス", type: "カス" },
      { suffix: "kasu-2", motif: "紅葉のカス", type: "カス" },
    ],
  },
  {
    month: "十一月", name: "柳",
    short: "しなやかさが武器になる。強引に押すより、受け流していい。",
    long: "柳は強い風にも折れず、しなって受け流す。今の局面で正面からぶつかるのは得策ではない。相手や状況に合わせて形を変えながら、最終的な目的だけはブラさない柔軟さが求められる。",
    action: "一つだけ、自分のやり方に固執せず譲ってみる。",
    cards: [
      { suffix: "hikari", motif: "柳に小野道風", type: "光" },
      { suffix: "tane", motif: "柳に燕", type: "種" },
      { suffix: "tanzaku", motif: "柳の短冊", type: "短冊", tanColor: "無地" },
      { suffix: "kasu-1", motif: "柳のカス", type: "カス" },
    ],
  },
  {
    month: "十二月", name: "桐",
    short: "一区切りと、次への準備。今年の総括をする時期。",
    long: "桐は箪笥にもなる、次の世代へ受け継ぐ木。今は一つのサイクルの締めくくりであり、同時に次の準備を始める時期でもある。今年やったことを棚卸しし、来期に何を持ち越すか整理すると良い。",
    action: "今日、今年やり切ったことを3つ書き出す。",
    cards: [
      { suffix: "hikari", motif: "桐に鳳凰", type: "光" },
      { suffix: "kasu-1", motif: "桐のカス", type: "カス" },
      { suffix: "kasu-2", motif: "桐のカス", type: "カス" },
      { suffix: "kasu-3", motif: "桐のカス", type: "カス" },
    ],
  },
];

// monthIndex(1〜12)を付与しつつ48枚に展開
const CARDS = [];
MONTHS.forEach((m, mi) => {
  m.cards.forEach((c) => {
    CARDS.push({
      cardId: `${String(mi + 1).padStart(2, "0")}-${c.suffix}`,
      monthIndex: mi + 1,
      month: m.month,
      name: m.name,
      motif: c.motif,
      type: c.type, // 光 / 種 / 短冊 / カス
      tanColor: c.tanColor || null,
      short: m.short,
      long: m.long,
      action: m.action,
      imageKey: `${String(mi + 1).padStart(2, "0")}-${c.suffix}`, // 将来の画像差し替え用の識別子(仮)
    });
  });
});

// ============================================================
// 役の判定ルール(cardId or 属性ベース。あとから編集しやすいようデータ+関数で分離)
// ============================================================
const YAKU_RULES = [
  {
    name: "五光",
    desc: "最上級の吉兆。今の流れ全体が大きく開いていく暗示。",
    check(ids) {
      const hikariIds = ["01-hikari", "03-hikari", "08-hikari", "11-hikari", "12-hikari"];
      return hikariIds.every((id) => ids.has(id));
    },
  },
  {
    name: "四光",
    desc: "かなりの好調気配。ここぞという場面で強気に出ていい時期。",
    check(ids) {
      const hikariIds = ["01-hikari", "03-hikari", "08-hikari", "11-hikari", "12-hikari"];
      const count = hikariIds.filter((id) => ids.has(id)).length;
      return count === 4;
    },
  },
  {
    name: "猪鹿蝶",
    desc: "人・環境・自分自身、三つの力が噛み合うサイン。動くなら今。",
    check(ids) {
      return ids.has("07-tane") && ids.has("10-tane") && ids.has("06-tane");
    },
  },
  {
    name: "花見で一杯",
    desc: "根を詰めすぎている頃合い。労をねぎらい、一息つく価値がある。",
    check(ids) {
      return ids.has("03-hikari") && ids.has("09-tane");
    },
  },
  {
    name: "月見で一杯",
    desc: "急ぐ場面ではない。静かに現状を噛みしめていい時。",
    check(ids) {
      return ids.has("08-hikari") && ids.has("09-tane");
    },
  },
  {
    name: "赤短",
    desc: "言葉と見せ方に気を配ると、流れがもう一段良くなる暗示。",
    check(ids) {
      return ids.has("01-tanzaku") && ids.has("02-tanzaku") && ids.has("03-tanzaku");
    },
  },
  {
    name: "青短",
    desc: "落ち着きと品位がそのまま評価に繋がる時期。慎重さが武器になる。",
    check(ids) {
      return ids.has("06-tanzaku") && ids.has("09-tanzaku") && ids.has("10-tanzaku");
    },
  },
];

function detectYaku(cards) {
  const ids = new Set(cards.map((c) => c.cardId));
  return YAKU_RULES.filter((r) => r.check(ids)).map((r) => ({ name: r.name, desc: r.desc }));
}

function drawUniqueCards(n, excludeCardIds) {
  const pool = CARDS.filter((c) => !excludeCardIds || !excludeCardIds.includes(c.cardId));
  const arr = [...pool];
  const out = [];
  for (let i = 0; i < n && arr.length > 0; i++) {
    const idx = Math.floor(Math.random() * arr.length);
    out.push(arr.splice(idx, 1)[0]);
  }
  return out;
}

module.exports = { CARDS, YAKU_RULES, detectYaku, drawUniqueCards };
