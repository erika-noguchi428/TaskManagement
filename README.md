# TaskManagement

Trello風のシンプルなタスク管理アプリ。タスクを「未着手・作業中・完了」の3列で管理し、ドラッグ&ドロップで進捗を更新できる。個人利用・学習目的のプロジェクトで、React(フロントエンド)+ Java/Spring Boot(バックエンド)+ PostgreSQL(DB)のクライアント・サーバー構成で実装している。

## 主な機能

- タスク(カード)の作成・編集・削除(タイトル・説明文・優先度・期限)
- ドラッグ&ドロップによる列間移動・同一列内の並び替え
- 列ごとの優先度順・期限順への一括並び替え
- 優先度の色分け、期限切れ・期限間近の強調表示
- PostgreSQLへの永続化(ブラウザを閉じてもデータが残る)

列(未着手/作業中/完了)は3つ固定で、ログイン・複数ユーザー・担当者・通知機能は対象外。

> **実装状況**: 現時点で実装済みなのは、タスクの検索・並び替えAPI(`GET /api/tasks`、`GET /api/tasks/{id}`)と、その結果を表示するボード画面。作成・編集・削除・ドラッグ&ドロップは今後実装する。

## 技術スタック

| 区分 | 技術 |
|---|---|
| フロントエンド | React 19 / Vite 8 / Tailwind CSS 4 / Axios / Vitest + React Testing Library |
| バックエンド | Java 25 / Spring Boot 4.1 / Gradle 9.7 / Spring Data JPA / Flyway |
| データベース | PostgreSQL 17(Docker Compose) |

各バージョンの詳細と選定理由は [技術スタック](./docs/技術スタック.md) を参照。

## システム構成

```
ブラウザ ── React (Vite) :5173 ──REST API(JSON)──> Spring Boot :8080 ──JPA──> PostgreSQL :5432
```

- フロントエンド・バックエンド・DBを分離した構成
- Spring BootはCORSで `http://localhost:5173` を許可している
- ポートは固定(後述)

## ディレクトリ構成

```
TaskManagement/
├── backend/      Spring Boot(Gradle)。controller / service / repository / entity / dto など
├── frontend/     React + Vite。components / api / utils
├── docs/         要件定義書・設計書
├── prototype/    初期のVanilla JS版プロトタイプ(旧構成)
├── docker-compose.yml   ローカル用PostgreSQL
└── CLAUDE.md     開発ルール(Claude Code向け)
```

## セットアップ・起動方法

### 前提

- Docker / Docker Compose
- JDK(Gradle toolchainがJava 25を使用する)
- Node.js(動作確認: 24.x)

### 1. データベース

```bash
docker compose up -d
```

PostgreSQL 17が `localhost:5432` で起動する(DB名・ユーザー・パスワードはいずれも `taskmanagement`)。テーブルはバックエンド起動時にFlywayが自動作成する。

### 2. バックエンド(ポート8080)

```bash
cd backend
./gradlew bootRun
```

テストデータを投入する場合は `seed` プロファイルを指定する。

```bash
./gradlew bootRun --args='--spring.profiles.active=seed'
```

### 3. フロントエンド(ポート5173)

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

### ポート固定について

バックエンドは `8080`、フロントエンドは `5173` 固定。CORS設定とAPIのベースURL(`frontend/.env.development`)がこのポート番号に依存するため、別ポートでの起動はしない。ポートが使用中の場合は占有プロセスを停止して起動し直す(手順は [.claude/skills/dev-servers/SKILL.md](./.claude/skills/dev-servers/SKILL.md) を参照)。

## API

| メソッド | パス | 内容 |
|---|---|---|
| GET | `/api/tasks` | タスク一覧。クエリ: `status` / `priority` / `keyword` / `sort`(いずれも任意) |
| GET | `/api/tasks/{id}` | タスク1件の取得 |

## テスト・ビルド

```bash
# バックエンド
cd backend && ./gradlew test

# フロントエンド
cd frontend && npm test        # Vitest
cd frontend && npm run lint    # Oxlint
cd frontend && npm run build   # 本番ビルド
```

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [要件定義書](./docs/要件定義書.md) | 目的・ユースケース・非機能要件・スコープ |
| [機能要件書](./docs/機能要件書.md) | 機能要件の詳細 |
| [画面設計書](./docs/画面設計書.md) | 画面構成・画面遷移 |
| [基本設計書](./docs/基本設計書.md) | 画面遷移・データ設計(ER図・テーブル定義) |
| [データベース設計書](./docs/データベース設計書.md) | データ項目・テーブル定義 |
| [技術スタック](./docs/技術スタック.md) | 使用技術・バージョン・選定理由 |

## 開発ルール

開発はIssue駆動で行う。Issueを作成し、`<種別>/<Issue番号>-<説明>` 形式のブランチで作業してPRを作成する。`master` への直接コミット・pushは行わない。詳細は [CLAUDE.md](./CLAUDE.md) を参照。
