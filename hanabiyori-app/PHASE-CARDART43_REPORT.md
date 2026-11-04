# id 43 画像差し替えレポート（コミット停止）

実施日: 2026-11-04
ブランチ: feature/card-art-adopted

## 作業内容

- 元絵: `/home/hatch/workspace/hanabiyori/card-art-adopted-2026-11-03/card_yanagi-rai.jpg`（実測1024×1536、RGB）。
- 切り出しなし。PILのLANCZOSで原画の縦横比を保って幅260pxに縮小し、JPEG品質92で `assets/cards/card-43.jpg` に保存。
- 出力実測: **260×390px、50,841バイト（約50.8KB／49.65KiB）**。JPEGとして再読み込み・デコード成功。既存の表示用札と同程度のサイズ。
- `index.html` のCARD_ART内の `43: null` だけを `43: 'assets/cards/card-43.jpg'` に差し替え。
- 表示名「柳のカス」および添え文「雨宿りして整える」は変更なし。crop-manifest.jsonも変更なし。

## 検証結果

- インラインJS（1本）を作業用TMPDIRへ抽出し、`node --check` 成功。
- HEADのindex.htmlに上記1行置換を適用した内容と、作業後ファイルが完全一致することを確認。三枚読み・フェーズ1A認証を含む他のコードに変更なし。
- 既存 `verification/card-art/check-flow.cjs` を使用。期待値にid 43（11月、カス）の画像採用をメモリ上で追加し、HEADのindex.htmlを比較元として実行。結果ファイルの書き込みを抑止し、検証スクリプトと既存成果物は変更していない。
- 48札の描画、id 43の画像パスと存在、三枚読み、読み文の比較、保存済み読みの復元、前日振り返り、音設定がすべて成功。
- ブラウザ実描画は未検証。既存check-offline.cjsは旧採用札の固定期待値に加えスクリーンショット等を書き込むため、今回は実行せず、上記の既存Node検証を使用。
- `git diff --check` 成功。

## 環境エラーと復旧

最初の検証で、Nodeからgitを子プロセス起動した際に次のエラーが発生（原文）:

```text
Error: spawnSync git EPERM
  errno: -1,
  code: 'EPERM',
  syscall: 'spawnSync git',
  path: 'git',
  spawnargs: [ 'show', 'HEAD:hanabiyori-app/index.html' ],
```

作業対象の前提不一致ではないため、再試行指示に従い、シェルからgitとnodeを直接起動する方法へ切り替えた。再検証はすべて成功。元絵・ブランチ・該当行に前提不一致なし。

## git差分と納品

- index.html: CARD_ARTのid 43の1行のみ変更（1行削除・1行追加）。
- assets/cards/card-43.jpg: 新規JPEG。
- PHASE-CARDART43_REPORT.md: 初回の未完了レポートを今回の結果で上書きし、新規追跡。
- 上記3ファイルだけをローカルコミット対象とする。pushは行わない。

## コミット時の停止（未完了事項）

`git add -- hanabiyori-app/index.html hanabiyori-app/assets/cards/card-43.jpg hanabiyori-app/PHASE-CARDART43_REPORT.md` が次のエラーで失敗（原文）:

```text
fatal: Unable to create '/home/hatch/workspace/hanabiyori/app-dev/.git/index.lock': Read-only file system
```

この環境では.gitが読み取り専用のため、ステージング・ローカルコミットは未実施。権限を変更・迂回せず停止した。画像・HTML・本レポートは作業ツリーに保存済み。pushは未実施。
