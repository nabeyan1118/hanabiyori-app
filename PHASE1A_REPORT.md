# フェーズ1 A工程 実装レポート

ブランチ: `feature/phase1-a-foundation`。push は実施しない。

## 変更ファイルと役割

- `hanabiyori-app/supabase-config.js`: 指定の公開設定ファイルから URL / anon キーを転記。
- `hanabiyori-app/auth-ui.js`: CDN ESM の Supabase JS v2、マジックリンク、セッション表示、プロフィール読込・保存、同意必須、時間不明時の null 保存、JSON ダウンロード、確認付き削除、ログアウト。認証依存の失敗は無料三枚読みから分離。
- `hanabiyori-app/auth-ui.css`: 日本語フォームのスマホ向け配置、折返し、入力幅、フォーカス表示。
- `hanabiyori-app/index.html`: ヘッダー導線、開閉セクション、追加 CSS / module の参照のみ。
- `hanabiyori-app/netlify/functions/_supabase.js`: 環境変数によるサーバークライアント生成、Bearer JWT を auth.getUser で検証、no-store JSON 応答。
- `hanabiyori-app/netlify/functions/export-my-data.js`: GET、本人の5テーブルをページングして書き出す。members は id、残りは member_id で検証済み ID に固定。
- `hanabiyori-app/netlify/functions/delete-my-data.js`: POST、厳密な confirm=true、本人のプロフィール・巡り手帳のみ削除。
- `hanabiyori-app/package.json`: Functions 用 Supabase SDK 依存追加。ビルド工程の追加なし。
- `PHASE1A_REPORT.md`: 本レポート。

## スキーマとの整合

プロフィールの UPDATE 列権限には member_id が含まれないため、一般的な merge upsert は権限エラーになる可能性がある。指定どおり本人行を upsert しつつ、ignoreDuplicates（ON CONFLICT DO NOTHING）で新規行を用意し、入力5列だけを本人条件付き UPDATE する構成とした。cache / calc_version は送らない。DB の変更はしていない。

## 検証結果

- 追加した全 JS に `node --check` 成功（ブラウザ ESM は `node --input-type=module --check` を標準入力に適用）。
- index.html の既存インライン JS を抽出し、変更前と完全一致を確認、`node --check` 成功。
- ローカルモック検証成功: JWT 欠落・不正時の401、非対応メソッド405、JSON不正・確認欠落・文字列trueの400、他人のIDをリクエストに入れても検証済みIDのみ使用、削除対象2テーブル限定、5テーブル書き出し、500行を超える際の次ページ取得。
- `git diff --check` 成功。
- 検証用ファイルは全てリポジトリ内 `.lane-tmp` に作成し、コミット対象外。
- 当初の検証スクリプト内 subprocess 実行は環境の EPERM となったため、git の読み出しをシェル側へ移して再実行し成功。

## 未実施・申し送り

- 実 Supabase E2E、実メール送信、実 RLS 負側テスト、デプロイ、ブラウザ実機表示・音・ダウンロード検証は未実施。CEO 側で手順書ステップ5・6に従い確認する。特に既存プロフィール更新（列権限付き2段階 upsert）を確認する。
- ローカルモックはサーバーの所有者条件を検証するもので、実DBのRLS検証を代替しない。
- CDN / SDK の実取得、依存インストールは未実施。Netlify が package.json の dependencies をインストールする前提。
- マジックリンクの戻り先は現在ページ（認証用 hash / code は除外）。使用するURLが Supabase Redirect URLs に許可されていることを確認。ローカルURLは別途許可が必要。
- 2テーブル削除は既存スキーマにトランザクション RPC がないため逐次実行。途中失敗時は再試行案内。再試行は削除済み行があっても可能。書き出しも複数クエリであり同時更新中の一貫したスナップショット保証はない。
- 認証ユーザー削除・会員退会・課金解約は今回対象外。members / contracts / reading_runs は削除しない。旧有料Functions・無料三枚読みの処理・DBスキーマは変更なし。

## Netlify 環境変数（名前のみ）

今回の Functions に必須:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

初期構築手順の接続情報設定一覧には `SUPABASE_ANON_KEY` もある。今回のブラウザは公開設定ファイルを使うため、この環境変数を実行時に参照しない。
