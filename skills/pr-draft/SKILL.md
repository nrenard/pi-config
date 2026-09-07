---
name: pr-draft
description: After committing and pushing code, ask the user if they want a PR draft generated. If yes, analyze the branch diff against the base branch and generate a pr-draft.md file with a full PR description.
---

## When to use me

Use this skill proactively whenever you have just committed and pushed code to a remote branch during a conversation. After the push succeeds, ask the user:

> "Want me to generate a PR draft?"

If the user confirms, proceed with the workflow below. If the user declines, do nothing.

## Workflow

1. **Determine base branch** — Check if `main`, `master`, or `develop` exists as the likely target. Prefer `develop` if it exists, otherwise `main`/`master`.

2. **Gather context** — Run:
   - `git log --oneline <base>..HEAD` to see all commits on this branch
   - `git diff <base>...HEAD --stat` for file change summary
   - `git diff <base>...HEAD` for the full diff (use this to understand what changed)

3. **Generate `pr-draft.md`** — Create the file in the repo root using this template:

```markdown
# PR Draft: <Brief Title>

## Summary

This PR addresses <TICKET-ID if available> by <concise description of what this PR does and why>.

<1-2 sentences of additional context: what was broken or missing, and how this change fixes or improves it.>

## Changes Made

For each logical change, write a line in this format:

**<type>(<scope>): <short description>** — <detailed explanation of what changed and why.>

## Steps to Test

1. <Step-by-step instructions to verify the changes locally.>
2. <Include specific pages to visit, actions to perform, and expected outcomes.>
3. <Include regression checks where relevant.>

## Screenshots (if applicable)

**Before:**

**After:**

## Review Process Checklist

- [ ] Review the ticket to understand the acceptance criteria.
- [ ] Verify that the pull request (PR) meets the definition of done and is ready for review.
- [ ] Check if unit tests are included and passing.
- [ ] Initially, go through the entire PR without making comments to grasp the scope of changes and avoid commenting without full context.
- [ ] Run the code locally, as it is a critical step that is almost always necessary.
- [ ] Test the code against the acceptance criteria. Is the component functioning as expected? Are there any obvious defects? If defects are found, mark the PR as "changes required" and communicate the issues to the submitter through PR comments or tasks.
- [ ] Review the code line by line and provide feedback on code that could be simplified, is duplicated or could be placed in a better location for sharing, etc.
- [ ] Comment on any unclear or undocumented code.
- [ ] Ensure that no new build warnings or errors are introduced.
- [ ] Verify that appropriate log levels (debug, info, warn, error) are set for logs.
- [ ] Remember that the person approving the PR shares equal responsibility for accepting the code into the develop branch. Rushing or bypassing this process is not acceptable.
- [ ] A standard feature code review should typically take several hours, at a minimum, if the process is correctly followed.
```

4. **Open the file** — Run `cursor pr-draft.md` to open it in Cursor.

5. **Share PR URL** — Detect the hosting platform from `git remote -v`. If GitHub, suggest using `gh pr create`. If Bitbucket, construct the URL manually (e.g. `https://bitbucket.org/<workspace>/<repo>/pull-requests/new?source=<branch>&dest=<base-branch>`) and display it for the user.

## Important notes

- Extract ticket IDs from branch names when possible (e.g. `feature-XDDD-3152` → `XDDD-3152`)
- Use conventional commit format for the PR title: `<type>(<scope>): <description>`
- Adapt the template sections to the actual changes; don't leave placeholder text
- If the diff is large, focus on summarizing the key logical changes rather than listing every file
