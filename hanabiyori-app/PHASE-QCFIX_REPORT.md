# 品質確認レビュー 条件2点の修正

実施日: 2026-11-06。ブランチ: feature/card-art-adopted。
根拠: ../品質確認_レビュー結果_2026-11-06.md。
元画像: ../card-art-adopted-2026-11-03/key-visual.jpg（1024×1536）。

## UNIT A: 看板の切り抜き

index.html の .key-visual の object-position のみ、top から **50% 42%** に変更。高さ min(38vh,340px)、max-height、幅、object-fit:cover、余白等は変更していない。

Pillow で元画像を読み、中央看板の金枠を色条件（R>150、G>100、R>1.12G、G>1.3B）で走査し、画像の目視と照合。看板外枠の概略範囲は x=417..606、y=337..1090（下端の次の座標は1091）。中央の x=485..539 では上端 y=337 に金色が現れ、底辺は y=1090 まで、1091..1100 では検出されない。四文字の黒い題字はこの枠内にある。

レビュー対象の390×844では画像幅358px、高さ320.72px。cover の倍率は358/1024、元画像の可視高さは917.367px。CSSの位置計算は (1536−917.367)×0.42=259.826 なので、表示範囲は **y=259.826..1177.193**。看板の上下縁と四文字が範囲内に収まり、表示内の看板上端は約26.98px、下端は約290.59pxとなる。42%は指定目安40〜45%内で、上下に余白を確保できる値。

実際の採用済み key-visual.webp をこの範囲で切り抜き、358×321 の確認画像（/tmp/qcfix-cover.png）を作成し、四文字と上下の外枠が見えることを目視確認した。画像のボックス寸法とページ構造は不変なので、既存レビューの舞台上端664pxという配置を動かす変更はない。ただし今回のブラウザー実測値ではない。

## UNIT B: 金雲の切り出し

assets/kin-un.webp の中身のみ差し替え。元画像の切り出し矩形は **(left,top,right,bottom)=(608,936,672,1011)**、右端・下端は含まない（x=608..671、y=936..1010）。64×75px、RGBA WebP、2,098 bytes。

看板の右下にある金雲の帯から、丸い張り出しが二段に見え、深緑との境界にくびれがある部分を選定。金の地模様と雲形の輪郭が読め、隣接する赤・桃色の花、実、看板の枠を切り出し範囲に含めない。上部の旧範囲に混入していた赤い蕾も含まない。

加工は既存 /tmp/implement-design.py の方法を踏襲。各画素のフェード係数は min(x/(幅×.16),(幅−1−x)/(幅×.16),y/10,(高さ−1−y)/10,1)。金色マスクは clamp((R−.6G−.4B−15)/60)×clamp((R−65)/75)（clampは0〜1）。アルファは round(255×max(0,フェード係数)×金色マスク)。Pillow の WebP quality=90、method=6 で保存した。

既存CSSの配置、背景サイズ、opacity:.28 は変更していない。透過後の素材を舞台に近い深緑へopacity .28で合成した確認画像（/tmp/qcfix-cloud.png）でも、金雲の張り出しとくびれを目視確認した。

## 検証

次のコマンドを実行（HOMEは変更せず、シェルコマンドには指定TMPDIRを設定）。

```sh
TMPDIR=~/workspace/hanabiyori/work/codex-tmp git show feature/phase1-a-foundation:hanabiyori-app/index.html > /tmp/qcfix-baseline.html
TMPDIR=~/workspace/hanabiyori/work/codex-tmp node hanabiyori-app/verification/card-art/check-flow.cjs /tmp/qcfix-baseline.html
```

結果: **pass: true**。全48 ID、三枚読み、比較元との結果一致、保存済み抽選の再読み込み、前日の振り返り、音設定、鬼札の表示名・添え文の検証が成功。flow-results.json の内容は不変で差分なし。この検証はNode VMのDOMスタブであり、ブラウザー描画検証ではない。

Playwright と /opt/meta-chromium/chrome で390×844の再撮影を試行。環境既定のWebGLポリシーを指定した後も、Chromiumが `setsockopt: Operation not permitted` とSIGTRAPで起動できず、初回画面・認証画面の実ブラウザー再撮影は未確認。上記の画像処理による表示範囲・素材確認で代替したが、実画面のレビュー合格を再判定したものではない。確認画像と補助スクリプトは /tmp に置き、納品差分に含めていない。

最終差分は index.html の object-position 1行、assets/kin-un.webp、本レポートの3ファイルのみ。構造・機能変更なし。コミット・pushは実施していない。
