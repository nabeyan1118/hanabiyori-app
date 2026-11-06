# 公開順序③ 改訂版デザイン・鬼札 実装報告

対象ブランチ: feature/card-art-adopted。デザイン正本の補記（2026-11-06）およびレビュー済み鬼札仕様を参照。コミット・push は未実施。

## UNIT A — 看板

採用 key-visual.jpg を1024×1536のまま WebP 化。実サイズ **198,402 bytes（198.402 KB / 約193.75 KiB）**、200KB以下を達成。幅100%、object-fit: cover、object-position: top、代替テキストと寸法を設定。画像高は min(38vh, 340px)、55vhを上限とし、舞台の頭が入る余地を確保。h1「今日は、どんな日和だろう。」を画像下の一文として残した。ヘッダーは紋＋英字サブに簡略化。

## UNIT B — 面・トークン

--kinari: #f8e2be、--sumi: #142018 を追加。認証パネル全体・入力欄・ボタン、読み物カード、reflection を生成り＋墨文字に統一。認証リンク・placeholderも墨色。stage / weather、action-box、ヘッダー／フッターの闇色、既存の金・深緑を維持。auth-ui.js の変更は不要。

## UNIT C — 金雲

元画像の金雲（座標 x=322..524、y=34..83）を切り出し、端のフェードと金色画素のアルファマスクを適用。**assets/kin-un.webp: 5,866 bytes（5.866 KB）**、202×49、透過つき。新規素材は1点のみ。stage-head の背景上部1か所だけに opacity .28 で配置。描画範囲は見出し部分で、札領域には重ねない。CSS による金雲の図形再現・常時アニメーションは追加していない。

## UNIT D — 月色

表示日付 state.today から日付を作り、正本の12色表で --month-accent を設定。.date のボーダーと日付文字のみに適用。抽選用の日付シードは変更していない。

## UNIT E — スマホ

音・アカウント・again・reflection 選択・認証ボタンを最小44pxに設定。brand-sub、footer、once、slot-label、その他の小さい補助文字を11px以上に調整。slot-label は狭幅で折返し可能にした。既存のミュート、カード反転、reduced-motion の指定を維持。

ブラウザーによる実描画検証は未完了。Playwright の標準 Chromium は未配置、配置済み /opt/meta-chromium/chrome は環境側の「Hatch WebGL domain policy is required for browser startup」で起動できなかった。横スクロール・初回表示での舞台位置・実フォント適用後の寸法は、実ブラウザーでの最終確認が必要。CSSの宣言だけを根拠に実描画合格とはしていない。

## UNIT F — 鬼札

CARDS id 43 の表示名を「柳に雷（鬼札）」へ、サーバー11月 kasu-1 の motif を「柳に雷」へ変更。id 43 のある読み物カードにだけ、空模様・現在地・一手それぞれのレビュー済み添え文を原文どおり1段落追加。分類・desc・点数・抽選・役判定・保存形式は変更していない。既存 actionText 等が参照する表示名にも名称変更が自然に反映される。

## 補記5点との対応

| 確定事項 | 実装 |
| --- | --- |
| 1. 生成りの適用範囲 | UNIT B: 認証・読み物・reflection。指定の闇色面は維持 |
| 2. 色値 | UNIT B: 指定2トークン、既存の金・深緑を維持 |
| 3. 12か月色と適用先 | UNIT D: 表示日付の月、dateのみ |
| 4. 金雲の素材・配置・濃度 | UNIT C: 元画像から1点、上部1か所、.28 |
| 5. 看板 | UNIT A: 全幅・上寄せ・55vh以内・h1・alt・200KB以下・ヘッダー簡略化 |

## 検証結果と期待差分

指定された tools/check-flow.cjs はこの作業ツリーに存在しない。既存の同等スクリプトは verification/card-art/check-flow.cjs。比較元は git show feature/phase1-a-foundation:hanabiyori-app/index.html で取得し /tmp/hanabiyori-baseline.html に保存した。

既存スクリプトを変更せず実行した結果、全48札ループの ids=[41,42,43] の読み文完全一致検査で停止した。期待差分は UNIT F の「柳のカス」→「柳に雷（鬼札）」と一手の添え文だけ。続く [42,43,44]、[43,44,45] も現在地・空模様の同様の差分がある。実行時の自然抽選は最初の比較を通過しており、停止したのは保存済み札を模擬した全48札ループ。自然抽選日にid 43がある場合も同じ期待差分として扱う必要がある。

既存検証の一時コピー /tmp/tools/check-flow.cjs では、比較の前に全48パターンについて以下を追加検証し、比較値の表示名と添え文だけを正規化した。

- id 43 の有無と添え文数（0または1）が一致する。
- id 43 の位置の article に、その位置の原文添え文がある。
- 正規化後の読み文は比較元と完全一致する。
- 全48パターンで保存データが比較元と一致する。
- weather と action の文面は表示名の変更以外一致する。

実行: `node /tmp/tools/check-flow.cjs /tmp/hanabiyori-baseline.html` → **pass: true**。三枚抽選、48札の月／ランク／画像対応、保存後の再表示、前日のreflection、音設定、反転 .72s の既存検査も通過。一時コピーと出力 /tmp/tools/flow-results.json はリポジトリ外。

既存 verification/card-art/flow-results.json は変更していない。A〜E に起因するフローの読み文差分はなし。UNIT F の表示名・添え文は要件どおりのため、未変更の厳密比較で pass: true にすることとは両立しない。比較元や本体の表示を偽装して既存検証を通す対応は行っていない。

`git diff --check` は合格。画像の寸法・アルファ・実サイズをPillowで確認。鬼札添え文は正本の3文との完全一致を別途確認。

## diff 範囲・未達

変更は index.html、auth-ui.css、netlify/functions/cards-data.js、新規 assets/key-visual.webp、assets/kin-un.webp、本レポートの6ファイルのみ。auth-ui.js は変更なし。日付シード・重複なし抽選・localStorage形式・役判定に変更なし。

未達は、未変更の既存検証の完全一致（UNIT F の意図した差分によるもの）と、環境制約によるブラウザー実描画確認。期待差分を明示した拡張比較は pass: true。画像容量目標に未達なし。
