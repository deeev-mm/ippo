# ippo 詳細仕様書

最終更新: 2026-08-04 ／ 対象バージョン: フェーズ1（コア機能）完了時点

---

## 1. 背景・目的

ippoは、親子で使う「おうちのタスク・ごほうび管理アプリ」。無料枠でもコールドスタートなく高速に動作させるため、エッジ実行を前提としたアーキテクチャで設計している。

UIはプレーンCSS（CSS Modules、Tailwind不使用）で、子ども・親どちらにも見やすい配色・タイポグラフィを新規に構築している。

## 2. アーキテクチャ

```
Next.js (UI, App Router) ── Cookieセッション ──▶ Hono on Cloudflare Workers
                                                        │
                                                        ▼
                                                  D1 (SQLite互換)
```

- モノレポ構成（pnpm workspace）：`apps/api`（Hono/Workers）、`apps/web`（Next.js）、`packages/shared`（共有型定義）
- **シングルテナント**：1デプロイ = 1家族。複数家族を1つのデプロイで管理するテナント概念は持たない（`users`テーブルはフラットな1家族分のみを保持する設計）。
- 認証はセッションCookie方式（`ippo_session`、httpOnly, 30日）。

## 3. ドメインモデル

```
User (parent | child)
  └─ Task（親が作成、childに割り当て）
       ├─ TaskRecurrence（毎週/毎月の繰り返し条件）
       ├─ TaskSubmission（子の完了申請 → 親が承認/却下）
       └─ TaskComment（親子間コメント）
  └─ RewardBalance（子ごとのポイント残高）
       └─ RewardBalanceHistory（増減履歴）
  └─ RewardRequest（子によるごほうび交換申請 → 親が承認/却下）
       └─ RewardRequestHistory
  └─ BadgeAssignment（条件達成で自動付与、子が受け取り確定）

TaskCategory（タスクの分類。バッジ条件のカテゴリ限定にも使用）
Reward（ごほうびカタログ：アイコン・必要ポイント）
Badge（バッジマスタ：アイコン・付与条件JSON）
```

### 3.1 テーブル定義（`apps/api/src/db/schema.ts` / Drizzle）

| テーブル | 主なカラム | 備考 |
|---|---|---|
| `users` | id(uuid), name(unique), password_hash, avatar, theme, role(parent\|child) | メール・電話番号なし。nameでログイン |
| `sessions` | id, user_id, token_hash(unique), expires_at | Cookie値のSHA-256ハッシュのみ保存 |
| `login_attempts` | scope, identifier, failed_count, locked_until | 5回失敗で15分ロック |
| `task_categories` | id, name, slug(unique) | |
| `tasks` | id, title, description, due_date, recurrence, parent_id, child_id, task_category_id, reward_amount | recurrenceは daily\|weekly\|monthly\|weekdays\|weekends |
| `task_recurrences` | id, task_id, recurrence_type, day_of_week(0-6), day_of_month(1-31) | weekly/monthlyのみ使用 |
| `task_submissions` | id, task_id, user_id, status(submitted\|approved\|rejected), submitted_at | |
| `task_comments` | id, task_id, user_id, content | |
| `badges` | id, name, icon, condition(JSON), is_active | condition例: `{"task_approve":{"gte":5,"category":"study"}}` |
| `badge_assignments` | id, user_id, badge_id, status(pending\|granted), assigned_at, received_at | 条件達成で自動的にpending付与、子が`/receive`で確定 |
| `rewards` | id, name, icon, need_reward | |
| `reward_balances` | user_id(PK), balance | |
| `reward_balance_histories` | id, user_id, change_type, amount, related_id, changed_at | |
| `reward_requests` | id, user_id, reward_id, status, requested_at | |
| `reward_request_histories` | id, reward_request_id, status, changed_by, changed_at | |

全テーブルの主キーはUUID文字列（`crypto.randomUUID()`）。D1のオートインクリメントに依存しない。

## 4. 認証・セッション設計

- ログイン: `POST /auth/login` に `{ name, password }`。成功時、ランダム32byteトークンを発行し `sessions.token_hash`（SHA-256）に保存、Cookieには生トークンをhttpOnlyで返す。
- パスワードは PBKDF2-SHA256（100,000 iteration, salt16byte）でハッシュ化。`apps/api/src/lib/crypto.ts`。
- ブルートフォース対策: `login_attempts` テーブルで name単位に失敗回数を記録、5回失敗で15分ロック（`apps/api/src/lib/rate-limit.ts`）。
- CORS: 許可オリジン外からの更新系リクエスト（GET/HEAD/OPTIONS以外）は実行前に403で拒否（CSRF対策）。`apps/api/src/lib/cors.ts`。
- 認可: `requireAuth` でCookie検証、`requireParent` でroleが`parent`であることを追加検証するミドルウェアチェーン。

## 5. APIエンドポイント一覧

ベースURL: ローカルでは `http://localhost:8787`（`NEXT_PUBLIC_API_BASE_URL` で指定）。

| メソッド | パス | 認可 | 概要 |
|---|---|---|---|
| POST | `/auth/login` | - | ログイン |
| POST | `/auth/logout` | 認証済 | ログアウト |
| GET | `/auth/me` | 認証済 | セッションユーザー取得 |
| GET/POST | `/children` | parent | 子アカウント一覧・作成 |
| PUT/DELETE | `/children/:id` | parent | 子アカウント更新・削除 |
| GET | `/task-categories` | 認証済 | カテゴリ一覧 |
| POST/PUT/DELETE | `/task-categories(/:id)` | parent | カテゴリCRUD |
| GET | `/tasks` | 認証済 | タスク一覧（`status`, `exclude_past_approved`, `page` クエリ対応、5件/ページ）。child は自分のタスクのみ |
| GET | `/tasks/today` | 認証済 | 今日期限の自分のタスク（子用） |
| GET | `/tasks/weekday` | 認証済 | 今週の完了数・獲得ポイント（子用） |
| GET | `/calendar-tasks` | 認証済 | カレンダー表示用の全件（role絞り込みあり） |
| POST/PUT/DELETE | `/tasks(/:id)` | parent | タスクCRUD（繰り返し設定含む） |
| POST | `/tasks/:id/submit` | child（本人） | 完了申請 |
| PATCH | `/task-submissions/:taskId/approve` | parent | 承認（繰り返しタスクの次回生成・ポイント加算・バッジ判定を実行） |
| PUT | `/task-submissions/:taskId/reject` | parent | 却下（再申請可） |
| GET/POST | `/tasks/:taskId/comments` | 認証済 | コメント一覧・投稿 |
| GET | `/rewards` | 認証済 | ごほうびカタログ |
| POST/PUT/DELETE | `/rewards(/:id)` | parent | ごほうびCRUD |
| GET/POST | `/reward-requests` | 認証済 | 申請一覧・新規申請（child） |
| POST | `/reward-requests/:id/approve` `/reject` | parent | 申請承認（ポイント減算）／却下 |
| GET | `/reward-balance` | 認証済 | 自分の残高（child） |
| GET | `/reward-balances` | parent | 全子どもの残高一覧 |
| GET | `/badges` | 認証済 | バッジ一覧 |
| POST/PUT/PATCH/DELETE | `/badges(/:id)` | parent | バッジCRUD |
| GET | `/badge-assignments` | 認証済 | 自分の獲得バッジ一覧 |
| POST | `/badge-assignments/:id/receive` | 認証済（本人） | pending中のバッジを受け取り確定（status→granted） |

## 6. 主要ビジネスロジック

### 6.1 タスクの繰り返し（`apps/api/src/lib/recurrence.ts`）

タスク承認時、`recurrence` が設定されていれば次回タスクを複製生成する。

- `daily`：翌日
- `weekdays`：翌営業日（土日をスキップ）
- `weekends`：次の土曜日（今日が土曜なら翌日＝日曜）
- `weekly`：`task_recurrences.day_of_week`（0-6）のうち直近の該当曜日
- `monthly`：`task_recurrences.day_of_month`（1-31）のうち直近の該当日

### 6.2 バッジ自動付与（`apps/api/src/lib/badges.ts`）

タスク承認のたびに全アクティブバッジをチェックし、条件を満たせば`badge_assignments`に`pending`で追加（重複付与はしない）。

- `condition.task_approve.gte`：承認済みタスク数がN以上（`category`指定時はそのカテゴリのみでカウント）
- `condition.badge_own_count.gte`：所持バッジ数がN以上

子は`/badge-assignments/:id/receive`で`pending`→`granted`に確定させ、初めて「獲得」として表示される。

### 6.3 ごほうび交換

`RewardRequest`作成時にポイント残高を検証（不足時422）。親の承認時に`reward_balances.balance`を減算し、`reward_balance_histories`に履歴を残す。承認・却下ともに`reward_request_histories`に記録。

## 7. 画面一覧

| ルート | ロール | 状態 |
|---|---|---|
| `/login` | - | 実装済 |
| `/parent/dashboard` | parent | 実装済 |
| `/parent/tasks`, `/tasks/new`, `/tasks/:id`, `/tasks/:id/edit` | parent | 実装済 |
| `/parent/calendar` | parent | 実装済 |
| `/parent/rewards` | parent | 実装済 |
| `/parent/master`（こども/カテゴリ/ごほうび/バッジ管理） | parent | 実装済 |
| `/child/dashboard` | child | 実装済 |
| `/child/tasks`, `/tasks/:id` | child | 実装済 |
| `/child/calendar` | child | 実装済 |
| `/child/rewards` | child | 実装済 |
| `/child/badges` | child | 実装済 |
| `/parent/report`, `/child/report` | 両方 | **未実装（フェーズ2）** |
| `/parent/history/tasks`, `/rewards`, `/badges` | parent | **未実装（フェーズ2）** |

## 8. フェーズ2（今後の予定）：レポート・履歴機能

フェーズ1では未着手のレポート・履歴画面を、フェーズ2として実装する。

必要な集計APIエンドポイント（データモデル自体は`task_submissions` / `reward_balance_histories` / `badge_assignments` に既に存在するため追加のスキーマ変更は不要）：

- `GET /reports/progress`：子ども別・期間別のタスク完了数／ポイント推移
- `GET /reward-balance-histories`：ポイント増減履歴
- `GET /badge-assignments/history`：バッジ付与履歴（日時ソート）

フロントはサンプルデータを廃止し、上記APIから取得した実データで再構築する。

## 9. デプロイ・CORS・環境変数

UI（Pages）とAPI（Workers）を分けるとブラウザで**CORSエラー**が出やすい。

| 変数 | どこ | 用途 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | apps/web | フロントが叩くAPIのURL |
| `CORS_ALLOWED_ORIGINS` | apps/api（wrangler.toml `[vars]`） | 許可するUI Origin（カンマ区切り） |
| `APP_BASE_URL` | apps/api | Cookieの`Secure`/`SameSite`判定に使用（`localhost`を含む場合はローカル扱い） |
| `SESSION_COOKIE_NAME` | apps/api | セッションCookie名（既定 `ippo_session`） |

実装時の要点:

- Workersが `Access-Control-Allow-Origin` 等を返す（Cookie利用時は `*` 不可）
- `OPTIONS` プリフライトを許可
- ローカルと本番の Origin を許可リストに入れる
- 本番デプロイ前に `apps/api/wrangler.toml` の `database_id`（プレースホルダ）を `wrangler d1 create ippo` で発行した実IDに差し替える

## 10. ローカル起動

```bash
pnpm install
pnpm setup:local   # D1マイグレーション + デモアカウントseed
pnpm dev           # api:8787 / web:3000
```

デモアカウント: `parent` / `taro` / `hanako`（パスワードは全て `demo1234`）。
