#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# GitHub Projects v2 helper functions
# ─────────────────────────────────────────────────────────────
# Source this file in workflow steps that need project operations.
# All functions accept a token parameter for PROJECT_AUTOMATION_TOKEN.
# ─────────────────────────────────────────────────────────────

# Add an issue to the project if not already present.
# Usage: add_to_project <project_id> <issue_node_id> <token>
# Prints the project item ID to stdout.
add_to_project() {
  local project_id="$1" issue_node_id="$2" token="$3"

  local item_id
  item_id=$(GH_TOKEN="$token" gh api graphql -f query='
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100) {
            nodes { id content { ... on Issue { id } } }
          }
        }
      }
    }
  ' -f projectId="$project_id" --jq '
    .data.node.items.nodes[]
    | select(.content.id == "'"$issue_node_id"'")
    | .id
  ' 2>/dev/null || echo "")

  if [ -z "$item_id" ]; then
    item_id=$(GH_TOKEN="$token" gh api graphql -f query='
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {
          projectId: $projectId, contentId: $contentId
        }) { item { id } }
      }
    ' -f projectId="$project_id" -f contentId="$issue_node_id" \
      --jq '.data.addProjectV2ItemById.item.id')
  fi

  echo "$item_id"
}

# Get the current Status option ID of a project item.
# Usage: get_status <project_id> <item_id> <token>
# Prints the option ID (e.g. "f75ad846") or empty string.
get_status() {
  local project_id="$1" item_id="$2" token="$3"

  GH_TOKEN="$token" gh api graphql -f query='
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100) {
            nodes {
              id
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    field { ... on ProjectV2SingleSelectField { name } }
                    optionId
                  }
                }
              }
            }
          }
        }
      }
    }
  ' -f projectId="$project_id" --jq '
    [.data.node.items.nodes[]
     | select(.id == "'"$item_id"'")]
    | if length > 0 then
        [. [0].fieldValues.nodes[]
         | select(.field.name == "Status")]
        | if length > 0 then .[0].optionId else "" end
      else "" end
  ' 2>/dev/null || echo ""
}

# Set the Status field of a project item.
# Usage: set_status <project_id> <field_id> <item_id> <option_id> <token>
set_status() {
  local project_id="$1" field_id="$2" item_id="$3" option_id="$4" token="$5"

  GH_TOKEN="$token" gh api graphql -f query='
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: { singleSelectOptionId: $value }
      }) {
        projectV2Item { id }
      }
    }
  ' -f projectId="$project_id" -f itemId="$item_id" \
    -f fieldId="$field_id" -f value="$option_id" > /dev/null
}

# Check if a comment with the given marker already exists.
# Usage: has_comment <repo> <issue_number> <marker> <token>
# Returns 0 (true) if found, 1 (false) if not.
has_comment() {
  local repo="$1" issue_number="$2" marker="$3" token="$4"

  local found
  found=$(GH_TOKEN="$token" gh api "repos/$repo/issues/$issue_number/comments" \
    --paginate --jq ".[] | select(.body | startswith(\"$marker\")) | .id" 2>/dev/null | head -1)
  [ -n "$found" ]
}

# Post a comment on an issue.
# Usage: post_comment <repo> <issue_number> <body> <token>
post_comment() {
  local repo="$1" issue_number="$2" body="$3" token="$4"

  GH_TOKEN="$token" gh api "repos/$repo/issues/$issue_number/comments" \
    -f body="$body" > /dev/null
}
