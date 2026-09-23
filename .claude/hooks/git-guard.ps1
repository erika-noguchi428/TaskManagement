# .claude/hooks/git-guard.ps1
try {
    $raw = [Console]::In.ReadToEnd()
    $data = $raw | ConvertFrom-Json -ErrorAction Stop
    $cmd = $data.tool_input.command
} catch {
    exit 0
}
if (-not $cmd) { exit 0 }
if ($cmd -notmatch '\bgit\b|\bgh\b') { exit 0 }

$branchPattern = '^(feature|fix|docs|chore|refactor|test)/[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$'

# 1) master/main への push を、現在のブランチによらずブロック
if ($cmd -match '\bgit\s+push\b' -and $cmd -match '(^|[\s:+])(origin[\s/]+)?(master|main)(\s|$|:)') {
    Write-Error "[git-guard] master/main への直接pushはブロックされています。PR経由でマージしてください。"
    exit 2
}

# 2) 保護ルール・Rulesetの削除/変更コマンドをブロック
if ($cmd -match 'rulesets?.*(-X\s+DELETE|delete)' -or $cmd -match 'branches/[^/]+/protection.*-X\s+DELETE' -or $cmd -match '\bgh\s+pr\s+merge\b.*--admin') {
    Write-Error "[git-guard] ブランチ保護/Rulesetの変更・バイパスはブロックされています。"
    exit 2
}

# 3) 新しいブランチを作る際、命名規則に従っているか検証
if ($cmd -match '\bgit\s+(switch\s+(-c|--create)|checkout\s+(-b|-B)|branch)\s+([^\s]+)') {
    $newBranch = $Matches[4]
    if ($newBranch -and $newBranch -notmatch $branchPattern) {
        Write-Error "[git-guard] ブランチ名 '$newBranch' が命名規則(<種別>/<Issue番号>-<説明>)に従っていません。"
        exit 2
    }
}

# 4) commit/push/merge等は、現在のブランチが規則通りの場合のみ許可
if ($cmd -match '\bgit\s+(commit|push|merge|cherry-pick|revert|am)\b') {
    $branch = (git branch --show-current 2>$null)
    if (-not $branch -or $branch -notmatch $branchPattern) {
        Write-Error "[git-guard] 現在のブランチ '$branch' はルールに従ったfeatureブランチではありません(commit/push/mergeはブロック)。先にIssueとブランチを作成してください。"
        exit 2
    }
}

exit 0
