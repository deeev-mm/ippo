-- ippo demo seed data
-- password for all demo accounts: demo1234

INSERT INTO users (id, name, password_hash, avatar, theme, role, created_at, updated_at) VALUES
  ('seed-user-parent', 'parent', '__DEMO_PASSWORD_HASH__', '🧑', 'blue', 'parent', datetime('now'), datetime('now')),
  ('seed-user-taro', 'taro', '__DEMO_PASSWORD_HASH__', '👦', 'blue', 'child', datetime('now'), datetime('now')),
  ('seed-user-hanako', 'hanako', '__DEMO_PASSWORD_HASH__', '👧', 'pink', 'child', datetime('now'), datetime('now'));

INSERT INTO task_categories (id, name, slug, created_at, updated_at) VALUES
  ('seed-cat-study', 'べんきょう', 'study', datetime('now'), datetime('now')),
  ('seed-cat-chores', 'おてつだい', 'chores', datetime('now'), datetime('now'));

INSERT INTO rewards (id, name, icon, need_reward, created_at, updated_at) VALUES
  ('seed-reward-snack', 'おかし', '🍪', 30, datetime('now'), datetime('now')),
  ('seed-reward-game', 'ゲーム30分', '🎮', 100, datetime('now'), datetime('now'));

INSERT INTO badges (id, name, icon, condition, is_active, created_at, updated_at) VALUES
  ('seed-badge-first', 'はじめての完了', '🏅', '{"task_approve":{"gte":1}}', 1, datetime('now'), datetime('now')),
  ('seed-badge-five', 'がんばり5回', '⭐', '{"task_approve":{"gte":5}}', 1, datetime('now'), datetime('now'));

INSERT INTO tasks (id, title, description, due_date, recurrence, parent_id, child_id, task_category_id, reward_amount, created_at, updated_at) VALUES
  ('seed-task-1', '宿題をする', '算数のプリントをやろう', date('now'), 'daily', 'seed-user-parent', 'seed-user-taro', 'seed-cat-study', 10, datetime('now'), datetime('now')),
  ('seed-task-2', 'お皿を洗う', NULL, date('now'), NULL, 'seed-user-parent', 'seed-user-hanako', 'seed-cat-chores', 5, datetime('now'), datetime('now'));
