# 再訪計測 実装報告（2026-11-06）

根拠: `../再訪計測_計画メモ_2026-11-06.md`。作業ブランチは `feature/card-art-adopted`。本番Supabaseの参照・適用、コミット、pushは行っていない。

## 設計とフック

- `measure.js` を既存インラインスクリプトの直前に通常のscriptとして読み込み、設定やCDNの応答を待たずに関数を登録する。
- 正確な呼出地点は `index.html` の `render(animate=true)` 内、結果表示用setTimeoutのコールバックで、`#result` の `show` 追加および既存の `save(stored)` の後、`scrollIntoView` の直前。`window.__hbRecordReading?.()` を1回追加した。
- 当日の保存済み結果を `render(false)` で再表示する場合も記録を試みる。同一端末・同一日の重複はDB制約で拒否され、クライアントはそのエラーを表示しない。送信済みフラグや再送抑制は設けない。
- `hanabiyori_terminal_id` のUUIDを再利用し、不正値・未保存なら暗号学的乱数で生成して保存する。randomUUIDがない場合はgetRandomValuesでUUID v4を作る。保存不能時は送信しない。
- 日付は呼出時点のUTC時刻に9時間を加えたISO日付で求め、端末のタイムゾーン設定に依存しない。端末時計のずれは補正しない。
- 公開設定を動的importし、URL/keyがなければ終了。既存auth-ui.jsと完全に同じCDN URLをimportするためライブラリ取得はモジュールキャッシュを共有する。計測専用クライアントはセッション保存・更新・URL解析を無効化し、ログイン情報に関連付けずanonで送信する。
- 設定読込、ストレージ、乱数、通信の例外をcatchし、ログ・画面通知を出さない。Supabaseが返すエラーも表示しない。送信はawaitせず読み体験を継続する。ブラウザ自身のネットワーク診断表示は制御対象外。
- index.htmlの変更はscriptタグとフックの2行のみ。文案・見た目・抽選・既存保存形式は変更していない。

## SQL案

`supabase/migrations/20261106_reading_events.sql` は未適用のレビュー用ファイル。UUID主キー、匿名端末UUID、JST日付、作成時刻だけを持ち、端末UUIDと日付の組にユニーク制約を置く。

RLSを有効にし、PUBLIC/anon/authenticatedの既定権限を明示的に剥奪したうえで、anon/authenticatedにはterminal_id/read_date列のINSERTだけを許可する。INSERTポリシーだけを作成し、SELECT/UPDATE/DELETEポリシーは作成しない。返却行を要求するselect()は付けない。UUID主キーなのでシーケンス権限は不要。集計用SELECTはservice_roleのみへ付与する（DB所有者・管理者およびRLSを迂回するservice_roleは管理上の例外）。IP・UA・メール・会員ID・札や鑑定内容の列は作らない。基盤側のアクセスログ設定は今回変更していない。

## 検証結果

- `node verification/card-art/check-flow.cjs /tmp/baseline-a-index.html`: **pass: true**。既存の指定比較元ファイルを使用し、新たなGitHub取得は不要だった。三枚読み、48札、結果比較、当日保存結果再表示、前日振り返り、音設定が通過。生成されたflow-results.jsonに差分なし。
- `node --check`: measure.jsとindex.htmlから抽出した既存インラインJavaScriptが通過。
- 外部接続なしのNode VMモック: JSTの15:00 UTC前後の日付境界、UUIDの保持、randomUUIDの代替生成、同日2回のINSERT、設定なし、ストレージ例外、通信例外を確認して通過。
- SQLは目視で列・ユニーク制約・権限・RLSポリシーを確認。DB上の実行検証は未実施。ブラウザ実機描画・実通信も未検証。
- `git diff --check` 通過。変更範囲はindex.htmlの2行、新規measure.js、新規SQL、本報告のみ。

## 適用手順案（今回実施しない）

1. プロジェクト管理者／DB管理担当がSQLと権限をレビューし、まず非本番SupabaseのSQL Editor等でファイル全文を実行する。新規テーブル用の一度限りのSQLであり再実行用ではない。
2. 非本番でanon/authenticatedのINSERT成功、同日重複拒否、SELECT/UPDATE/DELETE拒否、service_roleによる集計読取を確認する。
3. 別途承認された本番適用作業で、DB管理担当が対象プロジェクトを確認してSupabase DashboardのSQL Editorまたは管理されたmigration経路で同じSQLを実行する。その後、フロントエンド担当がコードを配備する。service_roleキーは管理側だけで保管する。
4. 管理側が週次集計する。端末ごとの最初のread_dateを初回日とし、対象コホートの端末数に対する、別のread_dateを持つ端末数の割合を再訪率とする。比較時は観測期間をそろえ、日数分布も確認する。計測開始前の履歴は含まれない。ストレージ消去・別ブラウザは別端末扱いとなり、送信失敗は欠測する。

## 独立レビュー必須条件への対応（2026-11-06追記）

`../../計測_レビュー結果_2026-11-06.md` の推奨案（1）を採用した。上記のクライアント日付算出およびterminal_id/read_date列へのINSERT許可の記述は、この追記で更新する。

- SQLのread_date既定値を `(now() at time zone 'Asia/Tokyo')::date` とし、日付をサーバー側のJST当日で決定する。
- anon/authenticatedの列単位INSERT許可をterminal_idのみに限定する。既存のINSERTポリシー、同一端末・同一日のユニーク制約、SELECT/UPDATE/DELETEの拒否は維持する。
- measure.jsは `{ terminal_id: terminalId }` のみを送信し、端末側の日付算出を除去した。例外のcatch、エラー非表示、呼出側で待たず読み体験を継続する性質は維持する。
- 今回はSQL・measure.js・本報告のみを修正し、作業開始時点のindex.htmlの既存2行差分には触れていない。本番・非本番ともDB接続やSQL適用は行っていない。

### 非本番での実測項目（次工程・未実施）

anon/authenticatedのそれぞれについて、返却行を要求せずに次を確認する。

1. terminal_idのみのINSERTが成功し、管理側の読取でread_dateがサーバー側のJST当日であること。
2. 同じterminal_idの同日2回目のINSERTがユニーク制約で拒否されること。
3. 任意日付の拒否：read_dateを指定したINSERTが列権限により失敗すること（過去・未来・当日を含む）。
4. SELECT・UPDATE・DELETEが拒否されること。
5. service_roleで集計用の読取が成功すること（キーは管理側のみで扱う）。

### 今回のファイル検証

- `node --check measure.js`：通過。
- `node verification/card-art/check-flow.cjs /tmp/baseline-a-index.html`：**pass: true**。既存の比較元を使用。
- `git diff --check`：通過。作業前後のファイル比較で今回の変更はSQL・measure.js・本報告の3ファイルのみ。index.htmlとflow-results.jsonの内容は作業開始時点から変更なし。
- DBの権限・日付制約の実測は未実施であり、上記の非本番確認を次工程で行う。
