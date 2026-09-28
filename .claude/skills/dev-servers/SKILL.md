---
name: dev-servers
description: TaskManagementのバックエンド(Spring Boot, ポート8080固定)・フロントエンド(Vite, ポート5173固定)のローカル開発サーバーを起動・再起動・動作確認するときに使う。ポートが競合している場合は占有プロセスを停止してから指定ポートで起動する(別ポートへのフォールバックは行わない)。
---

# ローカル開発サーバーの起動(ポート固定)

バックエンドは`8080`、フロントエンドは`5173`に固定する。CORS設定・APIベースURLがこの2つのポート番号を前提にしているため、**どちらのサーバーも指定ポート以外では起動しないこと**。ポートが使用中の場合は、そのポートを解放してから指定ポートで起動し直す。「空いている別のポートで一時的に動かす」という対応はしない。

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
