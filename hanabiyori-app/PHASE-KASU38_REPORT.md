# 紅葉 id 38 差し替えレポート

実施日: 2026-11-04  
ブランチ: feature/card-art-adopted  
結果: **再生成された単体素材で差し替え完了。比率は合格。**

## 実測と処理

素材: `/home/hatch/workspace/hanabiyori/kasu-generated/kasu-fix-38.png`

| 項目 | 実測値 |
| --- | --- |
| 素材全体 | 1003×1568px、RGB、3,030,827 bytes |
| 切り出しbox | [14, 7, 990, 1558]（右端・下端を含まない） |
| 切り出し後 | 976×1551px |
| 切り出し後の横÷縦 | 0.6292714378（合格: 指定範囲0.62〜0.68） |
| 保存JPEG | 260×413px、50,347 bytes |
| 保存JPEGの横÷縦 | 0.6295399516（整数pxへの丸めを含む） |

既存単体素材と同じ縁検出条件（R>175、G>145、B>90、R>G×1.03、G>B×1.08）を画像全体に適用し、検出範囲の外側1pxを含めた。PillowのLANCZOSで幅260px、縦は元比率から四捨五入して413pxに縮小。JPEG設定はquality=85、optimize=True、progressive=True、subsampling=0。比率補正は行っていない。

manifestは既存形式に合わせ、id 38の素材名・box・出力寸法・出力比率・bytesを更新した。positionは単体の1。他の46エントリは変更なし。

## 検証結果

- 保存JPEGを再読み込み・デコードし、JPEG形式・260×413pxを確認。出力画像を目視確認。
- `feature/phase1-a-foundation:hanabiyori-app/index.html` を指定TMPDIRへ取得し、`verification/card-art/check-flow.cjs` の比較元として実行。**pass: true**。
- 48札のID・月・ランク・画像パスと存在、三枚引き、読み文・結果の比較元一致、保存結果復元、前日振り返り、音設定、transition宣言の検証が成功。
- 動作検証はNode vm＋DOMスタブ方式。ブラウザ実描画は未検証。
- 再生成された `flow-results.json` は既存内容と同一で差分なし。
- `git diff --check` 成功。manifestのid 38以外の一致、index.htmlのHEADとの一致、変更ファイル範囲を確認。

## diff要約

- `assets/cards/card-38.jpg`: 旧260×373px・50,746 bytesから、新260×413px・50,347 bytesへ差し替え。
- `assets/cards/crop-manifest.json`: id 38のエントリのみ更新。
- `PHASE-KASU38_REPORT.md`: 作業開始時に未追跡だった前回保留レポートを、今回の完了レポートに書き直し。
- `index.html`およびその他のファイルは変更なし。
- コミット・ステージング・pushは実施していない。
