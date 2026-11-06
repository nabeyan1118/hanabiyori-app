# フェーズ1 A工程（基盤）実装ブリーフ

作業場所: このリポジトリのクローン（~/workspace/hanabiyori/app-dev）。アプリ本体は `hanabiyori-app/` 配下。
ブランチ: `feature/phase1-a-foundation` を切って作業し、そこへコミットする。push はしない。

## 先に読むもの（正本）
- ~/workspace/hanabiyori/花札日和_最新版仕様書_正本.txt（特に §3 会員価値、§7 同意と保存、§9 技術、§10 安全と削除）
- ~/workspace/hanabiyori/フェーズ1実装計画_2026-10-28.md の A 節
- ~/workspace/hanabiyori/phase0/基盤詳細設計メモ_2026-10-28.md
- ~/workspace/hanabiyori/phase1-prep/schema_v1_案.sql（v1.1、Supabase へ適用済み。これがDBの実態）
- ~/workspace/hanabiyori/phase1-prep/Supabase初期構築手順_案_2026-10-28.md のステップ5（E2EとRLS負側テストの観点）

## 前提（確定済み、変えない）
- 認証は Supabase Auth のマジックリンク（メールOTP）。パスワード併用は将来の選択肢として残すだけで今回は実装しない。
- DB は適用済みスキーマのまま。テーブル変更はしない。
- クライアント接続情報（公開値）は ~/workspace/hanabiyori/phase1-prep/.public-client-config.json にある。SUPABASE_URL と SUPABASE_ANON_KEY は公開前提の値なのでクライアント設定ファイルへ転記してよい。
- service_role キーは絶対にコード・リポジトリ・レポートへ書かない。サーバー側は環境変数 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を参照するだけ。
- 既存の無料三枚読み（index.html の既存挙動・演出・音）は壊さない。既存コードの改変は最小限にし、追加機能は分離ファイルへ寄せる。
- 旧有料系の関数（create-checkout.js / redeem-session.js / verify-entitlement.js / generate-reading.js / payjp-webhook.js）には今回触らない（別工程で廃止予定）。

## 実装するもの
1. `hanabiyori-app/supabase-config.js`: URL と anon キーの公開設定。
2. `hanabiyori-app/auth-ui.js`（新規）+ index.html への最小の導線追加:
   - ヘッダーに「ログイン／マイページ」導線。未ログイン時はメールアドレス入力→マジックリンク送信（signInWithOtp、戻り先は現在のページ）。送信後は「メールを確認してください」の穏やかな案内文（不安を煽らない）。
   - Supabase JS クライアントは CDN の ESM 版（@supabase/supabase-js@2）を使う。ビルド工程は導入しない。
   - ログイン後のマイページ（セクション切替でよい、別ページでも可）:
     - 命式プロフィール: 生年月日（必須）、出生時間（任意）＋「出生時間は不明」チェック。不明ONなら時間入力は無効化し、保存時は birth_time=null / birth_time_unknown=true。不明OFFなら birth_time 必須（DBのCHECK制約と一致させる）。保存には「記録の保存に同意する」チェック（save_consent）が必須で、ONでなければ保存ボタン不可。保存は profiles_meishiki へ本人の行を upsert（RLSで本人行のみ許可されている）。保存済みデータがあれば読み込んで初期表示する。
     - 自分のデータの書き出し: 後述の export-my-data 関数を呼び、返ってきた JSON をファイルとしてダウンロードさせる。
     - データの削除: profiles_meishiki と notebook_entries の自分のデータを消す操作。実行前に確認を取る。delete-my-data 関数経由。※会員退会（認証ユーザー削除と課金解約）は別工程なので今回は対象外。
     - ログアウト。
   - スマホ前提の見た目、横スクロールなし。日本語UI。
3. Netlify Functions（新規2本、`hanabiyori-app/netlify/functions/`）:
   - 共通ヘルパー `_supabase.js`: 環境変数から service role クライアントを作る関数と、リクエストの Authorization: Bearer <JWT> を検証してユーザーIDを返す関数（supabase.auth.getUser で検証）。
   - `export-my-data.js`: JWT を検証し、members / profiles_meishiki / contracts / notebook_entries / reading_runs から本人の行だけを集めて JSON で返す。
   - `delete-my-data.js`: JWT を検証し、profiles_meishiki / notebook_entries の本人の行を削除して結果を返す。確認はクライアント側で行う前提だが、誤爆防止に body で明示フラグ（{"confirm": true}）がなければ 400 を返す。
   - どちらの関数も他人のデータには一切触れないこと（member_id = 検証済みユーザーID で固定）。
4. `hanabiyori-app/package.json` に `@supabase/supabase-js` を dependencies へ追加（Functions 用）。

## 検証（実施して結果をレポートへ）
- 追加・変更した全 JS に `node --check` を通す。
- index.html の既存三枚読みまわりの JS が従来どおり構文的に無事か確認する。
- ローカルで完結する範囲の簡易確認（静的確認でよい）。実 Supabase への E2E は CEO 側で別途行うので、ここでは実施しなくてよい。

## レポート
- `PHASE1A_REPORT.md` をリポジトリ直下（app-dev 直下、hanabiyori-app の外でよい）に書く: 変更ファイル一覧、各ファイルの役割、検証結果、未実施・申し送り、デプロイ時に Netlify へ設定が必要な環境変数名の一覧（値ではなく名前のみ）。

## 禁止事項
- 秘密情報（service_role、PAY.JP の鍵など）をいかなるファイルにも書かない。
- PAY.JP・課金まわりには触らない。
- 仕様書の固定判断を変えない。迷ったら実装せず、レポートの申し送りに書く。
