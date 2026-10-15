---
name: suggest-commits
description: Generate 3-5 commit message options based on current changes
disable-model-invocation: true
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*)
---

Analyze the current git changes (staged and unstaged) and generate 3 to 5 commit message options.

Rules:

- Use Conventional Commits format: `type(scope): description`
- Allowed types: feat, fix, refactor, chore, docs, style, test, perf, ci, build, revert
- Scope is optional — use only when it adds clarity
- Description must be lowercase, concise, no period at the end
- Each option should emphasize a different aspect or granularity of the changes
- Output as a numbered list, nothing else
