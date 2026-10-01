---
name: dev-servers
description: TaskManagementのバックエンド(Spring Boot)・フロントエンド(Vite)のローカル開発サーバーを起動・再起動・動作確認するときは必ずこのスキルを使う。「アプリを起動して」「サーバー立てて」「ボード画面をブラウザで確認して」のような依頼のほか、`bootRun`/`npm run dev`/`gradlew`などの起動コマンドが失敗・ハングしたときも、たいていポート競合が原因なのでこのスキルで解決する。バックエンドはポート8080、フロントエンドはポート5173に固定し、一時的に別ポートで動かすことは禁止。
---

# ローカル開発サーバーの起動(ポート固定)

バックエンドは`8080`、フロントエンドは`5173`で動かす。これは好みの問題ではなく、両者が通信できるための前提条件になっている。バックエンドのCORS設定(`backend/src/main/java/com/taskmanagement/backend/config/WebConfig.java`)は`http://localhost:5173`からのアクセスしか許可しておらず、フロントエンドのAPIベースURL(`frontend/.env.development`)も`http://localhost:8080`に固定されている。どちらか一方が「たまたま空いていた別のポート」で起動すると、エラーにはならずに単に通信できないだけの状態になり、原因が分かりにくい。そのため、対象ポートが使用中のときの正しい対応は「そのポートを解放する」ことであり、「起動ツールが提案する別ポートを受け入れる」ことではない。

## 1. 対象ポートが使用中か確認する

PowerShellの場合:
```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Get-Process -Id $_ }
```
(フロントエンドを確認する場合は `-LocalPort 5173` に置き換える)

Bash(git-bash)の場合:
```bash
netstat -ano | grep ':8080.*LISTENING'
```
右端の列がPID。

## 2. 使用中だった場合はそのプロセスを停止する

PowerShell:
```powershell
Stop-Process -Id <PID> -Force
```

Bash:
```bash
taskkill //PID <PID> //F
```

停止する前に、何のプロセスか(`Get-Process -Id <PID>` の`ProcessName`や`Path`)を軽く確認し、停止したことをユーザーに一言伝える。停止してよいかどうかを都度確認する必要はない(このルール自体がユーザーの明示的な標準指示)。ただし、明らかにこのプロジェクトの開発サーバーではない重要そうなプロセス(例: 見慣れないサービス名、他プロジェクトのDBサーバーなど)に見える場合は、停止前にユーザーに確認する。

## 3. 指定ポートで起動する

バックエンド(リポジトリルートから):
```bash
docker compose up -d
cd backend
./gradlew.bat bootRun --args='--spring.profiles.active=seed'
```
`application.properties`に`server.port`は設定されておらずSpring Bootの既定である8080で起動する。**万一ポート競合で起動に失敗したら、別ポートを試すのではなく手順1〜2に戻って8080を解放してから再実行する。**

フロントエンド:
```bash
cd frontend
npm run dev
```
`vite.config.js`で`server.port: 5173`と`strictPort: true`を設定済みのため、5173が使用中だとVite自体がエラー終了する(自動で別ポートに切り替わることはない)。エラーになった場合は手順1〜2でポートを解放してから再実行する。

## 4. 起動確認

```bash
curl -s -o /dev/null -w "backend: %{http_code}\n" http://localhost:8080/api/tasks
curl -s -o /dev/null -w "frontend: %{http_code}\n" http://localhost:5173/
```
両方とも`200`が返ることを確認する。

## 補足: 起動中に別ブランチへ切り替えない

これらのサーバーを起動したまま、同じ作業ディレクトリで(このスキルとは無関係の)別ブランチにチェックアウトすると、実行中のサーバーが参照しているソースファイルがディスク上から消え、特にVite側はその後404を返すようになる。サーバーを動かしたまま別の作業をブランチ切り替えを伴って行う必要がある場合は、`git worktree`で別の作業ディレクトリを用意し、サーバーを起動しているブランチ自体は切り替えないこと。
