# GitHub Projects Automation — Setup Guide

## Overview

Automates Status transitions on the **@DylanFriday's Autoapply_kanban** project
board (`team-thirteen13` org) based on issue, branch, and PR events.

**Files:**
- `.github/workflows/project-automation.yml` — workflow
- `.github/scripts/project-helpers.sh` — GraphQL helper functions
- `CONTRIBUTING.md` — branch naming convention

---

## Setup

### 1. Create a Fine-Grained PAT

1. Go to https://github.com/settings/tokens?type=beta
2. **Generate new token**
   - Name: `autoapply-project-automation`
   - Expiration: 90 days
   - Repository access: `team-thirteen13/AutoApply` only
   - Permissions:
     - Repository: `Issues` (Read/Write), `Pull requests` (Read)
     - Organization: `Projects` (Read/Write)
3. Copy the token

> **Why not GITHUB_TOKEN?** It cannot access organization-level Projects v2.

### 2. Add Repository Secret

Go to https://github.com/team-thirteen13/AutoApply/settings/secrets/actions

| Name | Value |
|---|---|
| `PROJECT_AUTOMATION_TOKEN` | (paste the PAT) |

### 3. Retrieve Project IDs

```bash
gh auth login  # ensure project scope

# Get Project ID
gh api graphql -f query='
{
  organization(login: "team-thirteen13") {
    projectsV2(first: 10) {
      nodes { id title number }
    }
  }
}'
```

Find **@DylanFriday's Autoapply_kanban** (number 1).

```bash
# Get Status field ID and option IDs (replace PROJECT_ID)
gh api graphql -f query='
{
  node(id: "PROJECT_ID") {
    ... on ProjectV2 {
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id name
            options { id name }
          }
        }
      }
    }
  }
}'
```

### 4. Add Repository Variables

Go to https://github.com/team-thirteen13/AutoApply/settings/variables/actions

| Variable | Value |
|---|---|
| `PROJECT_ID` | `PVT_kwDOEgh-3s4BdHa7` |
| `PROJECT_STATUS_FIELD_ID` | `PVTSSF_lADOEgh-3s4BdHa7zhXrSbY` |
| `PROJECT_OPTION_BACKLOG` | `f75ad846` |
| `PROJECT_OPTION_TODO` | `61e4505c` |
| `PROJECT_OPTION_IN_PROGRESS` | `47fc9ee4` |
| `PROJECT_OPTION_IN_REVIEW` | `df73e18b` |
| `PROJECT_OPTION_DONE` | `98236657` |

---

## Event → Status Mapping

| Event | Condition | Status |
|---|---|---|
| Issue created | — | Backlog |
| Issue assigned | 1 assignee, currently Backlog | To Do |
| Issue assigned | 2+ assignees | Warning comment, no change |
| Issue unassigned | 0 assignees, currently To Do | Backlog |
| Issue reopened | Has draft PR | In Progress |
| Issue reopened | Has ready PR | In Review |
| Issue reopened | Has assignee, no PR | To Do |
| Issue reopened | No PR, no assignee | Backlog |
| Issue closed | — | Done |
| Branch pushed | Matches `type/NNN-desc` pattern | In Progress (if Backlog/To Do) |
| PR opened (draft) | Linked issue found | In Progress |
| PR opened (ready) | Linked issue found | In Review |
| PR ready for review | Linked issue found | In Review |
| PR converted to draft | Linked issue found | In Progress |
| PR merged | Linked issue found | Done |
| PR closed (not merged) | — | No change |

**Status precedence:** Done > In Review > In Progress > To Do > Backlog

---

## Troubleshooting

**"PROJECT_AUTOMATION_TOKEN not configured"** — Add the secret (step 2).

**"Status is X — no change (prevents regression)"** — Correct behavior; status only moves forward.

**No status change on branch push** — Branch must match `^(feature|feat|fix|chore|test|docs|refactor)/(\d+)-`.
