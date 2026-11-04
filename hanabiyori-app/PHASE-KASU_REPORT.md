# カス札23枚の切り出し・組み込みレポート

実施日: 2026-11-04  
ブランチ: feature/card-art-adopted

## 作業内容

指定されたシート4点（実測1536×1024px）と単体5点（実測1024×1536px）を使用。シートA・Bは各6枚、Cは位置3〜6、Dは位置1〜2のみ採用し、萩26・27と桐45・46・47は単体の修正版から作成した。旧版の萩・桐および空白は不使用。

`tools/crop-card-art.py` と同じ判定（R>175、G>145、B>90、R>G×1.03、G>B×1.08）でクリーム色を検出し、検出範囲の外側1pxを含む矩形で切り出した。シートの探索領域は列が[0,590)、[590,947)、[947,1536)、行が[0,512)、[512,1024)。単体は画像全体を探索した。切り出し座標はmanifestのbox（右端・下端は含まない）に記録。

PillowのLANCZOSで縦横比を保って幅260pxへ縮小。既存切り出し処理と同じJPEG設定（quality=85、optimize=True、progressive=True、subsampling=0）で保存した。素材の比率差は補正していない。原寸コピーや既存画像への変更はない。

CARD_ARTの対象23行のみnullから画像パスへ置換し、48 IDすべて画像を採用。crop-manifest.jsonには既存24件を保持して23件を追記（計47件）。以前採用されたid43は従来どおりmanifest未登録のため、48画像とmanifest件数は異なる。

## 出力実測

全23ファイルをJPEGとして再読み込み・デコードし、寸法・ファイルサイズを確認。

| ID | ファイル | 素材／位置 | 寸法(px) | サイズ(bytes) |
| --- | --- | --- | --- | --- |
| 2 | `card-02.jpg` | kasu-A.png / 1 | 260×409 | 62,486 |
| 3 | `card-03.jpg` | kasu-A.png / 2 | 260×412 | 63,909 |
| 6 | `card-06.jpg` | kasu-A.png / 3 | 260×408 | 53,086 |
| 7 | `card-07.jpg` | kasu-A.png / 4 | 260×409 | 54,066 |
| 10 | `card-10.jpg` | kasu-A.png / 5 | 260×412 | 52,758 |
| 11 | `card-11.jpg` | kasu-A.png / 6 | 260×408 | 52,224 |
| 14 | `card-14.jpg` | kasu-B.png / 1 | 260×410 | 57,187 |
| 15 | `card-15.jpg` | kasu-B.png / 2 | 260×409 | 55,658 |
| 18 | `card-18.jpg` | kasu-B.png / 3 | 260×405 | 59,882 |
| 19 | `card-19.jpg` | kasu-B.png / 4 | 260×409 | 60,156 |
| 22 | `card-22.jpg` | kasu-B.png / 5 | 260×409 | 56,506 |
| 23 | `card-23.jpg` | kasu-B.png / 6 | 260×405 | 58,050 |
| 26 | `card-26.jpg` | kasu-fix-26.png / 1 | 260×403 | 58,236 |
| 27 | `card-27.jpg` | kasu-fix-27.png / 1 | 260×403 | 57,478 |
| 30 | `card-30.jpg` | kasu-C.png / 3 | 260×411 | 54,907 |
| 31 | `card-31.jpg` | kasu-C.png / 4 | 260×409 | 54,696 |
| 34 | `card-34.jpg` | kasu-C.png / 5 | 260×408 | 60,502 |
| 35 | `card-35.jpg` | kasu-C.png / 6 | 260×410 | 61,625 |
| 38 | `card-38.jpg` | kasu-D.png / 1 | 260×373 | 50,746 |
| 39 | `card-39.jpg` | kasu-D.png / 2 | 260×399 | 51,740 |
| 45 | `card-45.jpg` | kasu-fix-45.png / 1 | 260×404 | 56,150 |
| 46 | `card-46.jpg` | kasu-fix-46.png / 1 | 260×405 | 57,796 |
| 47 | `card-47.jpg` | kasu-fix-47.png / 1 | 260×403 | 60,137 |

合計: 1,309,981 bytes。

## 検証結果

- `git show feature/phase1-a-foundation:hanabiyori-app/index.html` で比較元を指定TMPDIRへ取得。
- `check-flow.cjs` の期待値を48枚採用へ更新して実行し、`flow-results.json` を再生成。`pass: true`、`allIds: 48`、`adoptedIdMonthRankChecks: 48`、`kasuSvgByteForByte: 0`。
- 全48枚のID・月・ランク・画像パス・存在・描画文字列を検証。三枚引き、読み文と結果の比較元一致、保存済み結果復元、前日振り返り、音設定、transition宣言が通過。
- インラインJS全2本を抽出し、各 `node --check` が成功。
- HEADのHTMLへ対象23行の置換だけを適用した内容と作業後HTMLが完全一致。
- `git diff --check` 成功。
- ブラウザ実描画は未検証。動作検証は既存のNode vm＋DOMスタブ方式。切り出し画像は一覧で目視確認。

## diff要約

- `index.html`: CARD_ARTの23行のみ変更。
- `assets/cards/card-<ID>.jpg`: 新規23ファイル。
- `assets/cards/crop-manifest.json`: 対象23件追記。
- `verification/card-art/check-flow.cjs`: 対象23 IDの月・カスランク期待値と48件アサート追加、ブラウザ未検証理由を今回の方式に合わせて明記。
- `verification/card-art/flow-results.json`: 再生成。
- `PHASE-KASU_REPORT.md`: 本レポート追加。

コミット・ステージング・pushは実施していない。
