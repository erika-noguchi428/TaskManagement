# 開発ルール(Claude Code厳守)

## Issue駆動・ブランチ運用フロー

作業を始める前に、必ず以下の順序を守ること。例外は認めない(緊急対応・小さな修正でも同様)。

1. **Issueを作成する**(`gh issue create`)。タイトルは日本語で簡潔に、本文には目的・完了条件を書く。
2. **`master` から最新化した上でブランチを作成する**。
   ```
   git switch master
   git pull origin master
   git switch -c <種別>/<Issue番号>-<英語の短い説明>
   ```
   - 種別: `feature` / `fix` / `docs` / `chore` / `refactor` / `test`
   - 例: `feature/12-add-task-api`, `fix/15-title-validation`
   - ブランチ名は英数字・ハイフンのみ、Issue番号を必ず含める
3. 作業・コミットは**すべてこのブランチ上で**行う。`master`/`main` へのコミット・pushは一切行わない。
4. 作業が終わったらブランチをpushし、PRを作成する(`gh pr create`)。
   - 本文に `Closes #<Issue番号>` を必ず含める
   - `.github/PULL_REQUEST_TEMPLATE.md` の見出しに沿って書く
5. **PRのマージはユーザーから明示的な指示があった場合のみ**行う(`gh pr merge --squash --delete-branch`)。指示なしに自分の判断でマージしない。

## 禁止事項

- `master`/`main` への直接コミット・直接push(force pushはいかなる状況でも不可)
- ユーザーの指示なしにPRをマージすること
- GitHubのブランチ保護ルール(Rulesets)を無効化・変更・バイパスすること(`gh api` 経由での削除・変更、`gh pr merge --admin` 等も含む)
- Issueを作らずに作業を始めること

## `master` 上で作業を頼まれた場合

ユーザーから `master` ブランチにいる状態で作業を依頼された場合は、勝手にそのまま進めず、まず上記の手順1〜2(Issue作成・ブランチ作成)を行ってから着手すること。

## ローカル開発サーバーのポート固定ルール

バックエンド(Spring Boot)・フロントエンド(Vite)のローカル開発サーバーは、必ず以下の固定ポートで起動すること。`docs/技術スタック.md` に定義されたCORS設定(`http://localhost:5173` → `http://localhost:8080`)やAPIベースURLの前提がこのポート番号に依存しているため、**別のポートで一時的に起動して済ませることは禁止**(動作しない、または動いているように見えて実際は繋がっていない状態を生むため)。

- バックエンド: `8080`固定
- フロントエンド: `5173`固定(`frontend/vite.config.js` の `strictPort: true` により、5173が使用中の場合はVite自体がエラーで停止し、別ポートへの自動フォールバックはしない)

起動しようとしたポートが既に使用中だった場合は、そのポートを占有しているプロセスを特定して停止したうえで、指定ポートで起動し直すこと。具体的な手順は `.claude/skills/dev-servers/SKILL.md` のスキルに従う。

## 技術的な補助

上記ルールは `.claude/hooks/git-guard.ps1`(PreToolUseフック)と `.claude/settings.json` の permissions.deny でも機械的にブロックされる。ブロックされた場合はルールを回避しようとせず、正しい手順(Issue作成・ブランチ切り替え)をやり直すこと。
