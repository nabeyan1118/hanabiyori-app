# check-flow 鬼札期待差分の取り込み

実施日: 2026-11-06。ブランチ: `feature/card-art-adopted`。

## 変更点と assert

`verification/card-art/check-flow.cjs` に、鬼札仕様案・改訂版（2026-11-03、レビュー反映済み）の位置別3文を独立した期待値として固定した。アプリの ONI_NOTES は期待値に使わない。

正規化の前に次を検証する。

- CARDS[43] の id が43、表示名が「柳に雷（鬼札）」である。
- readings は3記事で構成され、記事の外に内容がない。
- id 43 の記事だけ oni-note が1段落あり、通常の読み段落に続く。その他の記事は添え文0件・通常段落1件である。
- 添え文の全文が、空模様／現在地／一手の位置に対応する仕様原文と完全一致する。
- id 43 の記事に表示される札名も「柳に雷（鬼札）」である。

上記検証を全記事で終えた後、id 43 の記事にある検証済み添え文と札名の span のみを正規化し、残る innerHTML 全体を比較元と完全一致で比較する。id 43 が3枚目の場合は actionText の冒頭にも札名が出るため、所定の冒頭表現を assert して、その札名だけを正規化する。包括的な文字列置換・部分一致への緩和・日付や記事の除外は行わない。

既存の自然抽選・保存再読込・48通りの固定抽選に適用。48通りでは id 43 が各位置に1回ずつ、非出現が45回となる。固定抽選では保存データ全体、weather/action/ボタンの innerHTML・textContent の完全一致も追加した。自然抽選の保存時刻も完全一致で検査できるよう、双方の VM に実行開始時の共通時計を渡す。アプリ本体は変更していない。

## 実行結果

比較元を git show で取得し、本体を実行した。

```bash
export TMPDIR=~/workspace/hanabiyori/work/codex-tmp
git show feature/phase1-a-foundation:hanabiyori-app/index.html > "$TMPDIR/checkflow-baseline.html"
node hanabiyori-app/verification/card-art/check-flow.cjs "$TMPDIR/checkflow-baseline.html"
```

結果: **pass: true**。48枚の画像・月・ランク、三枚抽選、読み比較、保存再読込、前日振り返り、音設定、反転時間の検査が成功。`verification/card-art/flow-results.json` に結果を記録した。

一時コピーでアプリの入力文字列だけを改変した負例7件は、すべて AssertionError で失敗した（リポジトリの index.html は変更していない）。

1. 添え文の「雷」を「雨」に1文字変更。
2. 添え文を次の位置の文に変更。
3. 添え文を削除。
4. id 43 以外の札に添え文を付与。
5. 添え文を2段落に重複。
6. 表示名を「柳に雷（鬼）」に変更。
7. 通常の読み本文に「改変」を追加（正規化対象外の退行も拒否）。

`git diff --check` も成功。本検証は Node VM と DOM stub による静的動作検証であり、実ブラウザの描画は検証していない。

今回の書き込みはスクリプト、再生成した flow-results.json、本レポートのみ。作業開始前から存在したデザイン実装の変更には手を加えていない。コミット・push は実施していない。
