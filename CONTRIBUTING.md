# Contributing to AutoApply

## Branch Naming Convention

Branch names must follow this pattern to enable project board automation:

```
<type>/<issue-number>-<short-description>
```

**Allowed types:**

| Type | Use for |
|---|---|
| `feat` | New feature |
| `feature` | New feature (alias) |
| `fix` | Bug fix |
| `chore` | Maintenance, tooling, config |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `refactor` | Code restructuring without behavior change |

**Examples:**

```
feat/21-supabase-auth
feature/21-supabase-auth
fix/34-login-error
chore/45-update-ci
test/12-add-rls-tests
docs/8-update-readme
refactor/15-extract-ai-service
```

**Rules:**

- Issue number is required for project board automation
- Branches without an issue number (e.g., `feat/phase-4-rls`) will not update the project board
- Use lowercase letters, numbers, and hyphens only
- Keep descriptions short (2-4 words)

## Pull Request Guidelines

- Reference the issue using closing keywords in the PR body:
  ```
  Closes #21
  Fixes #34
  Resolves #45
  ```
- Open PRs as **Draft** while work is in progress
- Mark as **Ready for review** when complete
- Keep PRs under ~300 changed lines
