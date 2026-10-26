---
name: quality-review
description: TaskManagementの品質チェック(レビュー)を行うときに必ず使うスキル。「品質チェックして」「レビューして」「標準から外れていないか確認して」「lintを通して」「ドキュメントと実装がずれていないか見て」といった依頼や、PR前のセルフレビューで使う。React/Spring Bootの標準からの逸脱、lint・静的解析、要件定義書・設計書と実装の整合を、決まった観点で漏れなく点検する。
---

# 品質チェック(レビューポイント)

初回の品質チェック(Issue #33 / PR #34)で実施した観点をチェックリスト化したもの。レビューでは、観点ごとに「問題あり / なし」を判定し、指摘は **ファイル:行** つきで報告する。修正してよいか指示がない場合、lint違反とドキュメントのずれ以外は**指摘のみ**にとどめ、修正は別Issueで判断を仰ぐ。

## 1. 静的解析(機械的に確認できるもの。最初に実行する)

```bash
cd frontend && npm run lint && npm test && npm run build
cd backend && ./gradlew check        # テスト + Checkstyle + SpotBugs
```

- フロント: Oxlint(`frontend/.oxlintrc.json`)。`correctness` 全体、`react/rules-of-hooks`、`react/exhaustive-deps`、`jsx-a11y`、`react/only-export-components` を有効化済み。警告・エラーは0件にする。
- バック: Checkstyle(`backend/config/checkstyle/checkstyle.xml`)と SpotBugs(`backend/config/spotbugs/exclude.xml` で誤検知のみ除外)。
- ルールを緩める・除外するときは、理由をコメントに残す(例: `prefer-tag-over-role` は `<dialog>` 化で挙動が変わるため無効)。違反を黙って握りつぶさない。

## 2. Spring Boot(バックエンド)の標準からの逸脱

- 入力検証は Bean Validation(`@Valid` / `@NotBlank` / `@Size`)で行っているか。`spring-boot-starter-validation` を入れているのに手書き検証だけになっていないか。
- 例外処理: `@RestControllerAdvice` に `MethodArgumentNotValidException`・汎用 `Exception` のハンドラがあるか。エラー形式はフィールド別に返せるか(`ProblemDetail` も検討)。DB上の不正値で500にならないか。
- 排他制御・並び順: `sort_order` の採番や再採番が同時リクエストで壊れないか(`@Version`・ロック・一意制約)。
- トランザクション: 書き込みは `@Transactional`、読み取りは `@Transactional(readOnly = true)`。
- 検索: `LIKE` の `%` `_` をエスケープしているか。`NULLS LAST` の指定漏れがないか。
- API設計: 部分更新・状態変更に `PUT` を使っていないか(`PATCH` が標準的)。ステータスコード(201+Location / 204 / 400 / 404)が妥当か。
- 設定: 接続情報・CORSオリジンのハードコード、`TRUNCATE` を含むシードの扱い、`open-in-view=false`、`ddl-auto=validate`。
- DI はコンストラクタインジェクション、DTO(record)でエンティティを直接返さない(現状は守れている。維持する)。

## 3. React(フロントエンド)の標準からの逸脱

- Hooks: `useEffect` の依存配列、effect内の同期的な `setState`(派生値はレンダー中に計算する)、非同期処理のキャンセル(`isCurrent` / `AbortController`)。
- state: `setTasks` は関数形式で更新しているか(連続操作でクロージャの古い値を使っていないか)。state の数が多すぎないか、重複したハンドラがないか。
- 副作用・通信: axios の timeout、エラーメッセージ取得処理の重複、再取得中の画面全体の「読み込み中」への置き換え(ちらつき)。
- D&D: `onDragLeave` の子要素移動によるちらつき、`dataTransfer` の MIME 型(`text/plain` だと無関係なドラッグを拾う)、キーボード代替の有無。
- アクセシビリティ: モーダルのフォーカス管理(初期フォーカス・トラップ・復帰)、`label` の有無、`role="alert"` / `aria-invalid` / `aria-describedby`、`button` の入れ子、色だけに頼った強調(期限切れなど)。
- 重複実装: 同じ役割のコンポーネント・文言が複数箇所にないか(削除確認ダイアログが2か所で重複し、文言も不統一だった)。
- 不要ファイル: Vite テンプレートの残骸(`App.css`、`assets/`、`public/icons.svg`)や、コミット対象外であるべき生成物(`*.log`)。
- テスト漏れ: コンポーネント・ユーティリティにテストがあるか。

## 4. ドキュメントと実装の整合(実装を正としてドキュメントを直す)

対象: `docs/` 配下(要件定義書・機能要件書・画面設計書・基本設計書・データベース設計書・技術スタック)と `README.md`。

- 画面操作: ボタン名・文言・モーダルのモード(新規/詳細/編集)・自動保存の挙動・Esc/背景クリックの扱いが一致しているか。
- ユースケース(UC-xx)の事後条件が実装と一致しているか(例: 列ソートは表示のみで `sort_order` は保存しない)。
- 追加された機能(フィルタバー等)が要件・画面設計に載っているか。「今後決定」「実装フェーズで定義」の記述が残っていないか。
- API: エンドポイント・メソッド・フィールド名(camelCase)・ステータスコード・エラー形式が README と一致しているか。
- 技術スタック: ライブラリ・バージョン・採用方針(例: D&Dは dnd-kit ではなくHTML5標準API)・lintツールが実態と一致しているか。
- データ: ER図とテーブル定義の型が一致しているか(`id` は bigint / BIGSERIAL)。
- ドキュメント内の矛盾(例: 永続化の記述がlocalStorage時代のまま)、関連ドキュメント表の漏れ、参照先の誤り。
- **仕様を先に書き換えた場合**(実装より先にドキュメントを更新した場合)は、その旨と未実装の差分を必ず報告し、実装の修正Issueを提案する。

## 5. 進め方・報告の作法

1. CLAUDE.md の手順に従い、Issue作成 → ブランチ作成 → 作業 → PR作成。**1回の品質チェックは1つのIssue・1つのPRにまとめる**(指摘の修正を別Issueに分ける場合を除く)。マージはユーザーの指示があるまでしない。
2. ファイル削除などが権限で拒否された場合は回避せず、未対応として報告する。
3. 報告は「導入したlint」「ドキュメントの是正」「実装上の指摘(修正していないもの)」「残課題」に分けて簡潔に書く。
4. 開発サーバーを確認する場合は `dev-servers` スキルに従い、ポート(8080 / 5173)を固定する。
