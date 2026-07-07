# ippo（いっぽ）

**毎日、いっぽずつ。** 親子で使う、おうちのタスク・ごほうび管理アプリです。

親がタスクを作成し、子が完了申請 → 親が承認するとポイントが貯まり、ためたポイントでごほうびと交換できます。がんばりに応じてバッジも獲得できます。

無料枠でもコールドスタートなく高速に動くよう、エッジ実行を前提とした構成にしています。

詳細仕様（正） [docs/SPEC.md](./docs/SPEC.md)

---

## 技術スタック

```
Next.js (UI)
    │  Cookieセッション
    ▼
Hono on Cloudflare Workers
    └── D1 (SQLite互換) … users / tasks / rewards / badges / …
```

| 層       | 技術                       |
| -------- | -------------------------- |
| Frontend | Next.js（App Router）      |
| Backend  | Hono × Cloudflare Workers  |
| Database | Cloudflare D1              |
| ORM      | Drizzle                    |
| Deploy   | Cloudflare Pages + Workers |

シングルテナント（1デプロイ = 1家族）。複数家族を1つのデプロイで管理するテナント概念は持ちません。

アイコンは絵文字を使わず、すべて`lucide-react`のSVGアイコンで統一しています。ホーム画面へのインストール（PWA）にも対応済みです。

## アカウント・ロール

| ロール | できること                                                       |
| ------ | ------------------------------------------------------------------ |
| 親     | 子アカウント発行、タスク・カテゴリ・ごほうび・バッジの作成/編集、申請の承認・却下 |
| 子     | 自分のタスクの完了申請、ごほうび申請、バッジの受け取り               |

ログインは「なまえ」＋「パスワード」（メール不要）。

## デモログイン（ローカルseed）

| 用途 | name | password |
| --- | --- | --- |
| 親 | `parent` | `demo1234` |
| 子（太郎） | `taro` | `demo1234` |
| 子（花子） | `hanako` | `demo1234` |

## ローカル起動

Node.js 20+ / pnpm 推奨。

```bash
pnpm install

# D1 マイグレーション + デモアカウントのシード
pnpm setup:local

# API (http://localhost:8787) と Web (http://localhost:3000) を同時起動
pnpm dev
```

## デプロイ

- **API**：`apps/api` を Cloudflare Workers にデプロイ（`wrangler.toml` の `database_id` を実際のD1データベースIDに差し替えてから `pnpm --filter @ippo/api deploy`）
- **Web**：`apps/web` を Cloudflare Pages にデプロイ（Next.js フレームワークプリセットを使用）

CORS・環境変数の詳細は [docs/SPEC.md](./docs/SPEC.md) を参照してください。

## ライセンス

プライベート用途。
