---
name: pr-review
description: Perform a full pull-request-style code review of the current branch and write a pr-review.md report. TRIGGER when the user says "review this as pr", "review this as a pr", "review-pr", "review pr", "review this pr", or "code review". Accepts an optional task/issue description to check the implementation against.
---

## When to use me

Use this skill when the user asks to review the current branch as a pull request, e.g. they say "review this as pr", "review pr", "code review", or "review-pr". The user may append an optional task/issue description (e.g. "review this as pr: Add user authentication to login page") which you should evaluate the implementation against.

## Workflow

1. **Detect the base branch** — Check if `main` or `develop` exists. Prefer `main`.

2. **Gather context** — Run:
   - `git diff <base>...HEAD` to get all changes on the current branch
   - `git log --oneline <base>..HEAD` to see all commits on this branch

3. **Analyze** — Read and analyze each changed file for issues. If a task description was provided, evaluate whether the implementation actually solves the intended problem.

4. **Generate `pr-review.md`** — Create the file in the repo root using this template:

```markdown
# Code Review: <Branch Name>

**Base Branch**: `<base>`
**Commits Reviewed**: <count>
**Files Changed**: <count>

---

## Task/Feature Analysis

> _Only include this section if a task description was provided_

**Task**: <task description>

- [ ] Implementation solves the intended problem
- [ ] No missing requirements
- [ ] No over-engineering

**Assessment**: <brief analysis of feature completeness>

---

## Summary

<Overall assessment of the changes - 2-3 sentences>

---

## Critical Issues

> Bugs, security vulnerabilities, data loss risks

- **[File:Line]** - Description of critical issue

_(None found)_ if no critical issues

---

## Code Quality

> DRY, KISS, readability, naming, error handling

- **[File:Line]** - Description of quality concern

_(No issues)_ if code quality is good

---

## Performance Concerns

> Inefficient algorithms, unnecessary re-renders, memory leaks

- **[File:Line]** - Description of performance concern

_(No concerns)_ if performance looks good

---

## Best Practice Violations

> Framework conventions, project patterns, documentation

- **[File:Line]** - Description of violation

_(None found)_ if best practices are followed

---

## Suggestions & Improvements

> Nice-to-have improvements, not blocking

- **[File:Line]** - Suggestion description

---

## Files Reviewed

| File         | Status                 | Issues        |
| ------------ | ---------------------- | ------------- |
| path/to/file | OK / Issues / Critical | Brief summary |

---

**Review completed**: <timestamp>
```

5. **Open the file** — Run `cursor pr-review.md` to open it in Cursor.

## Review priorities

1. Security vulnerabilities (injection, XSS, auth issues)
2. Logic bugs and edge cases
3. Error handling gaps
4. Performance bottlenecks
5. Code maintainability (DRY, KISS)
6. Consistency with project patterns

## Important notes

- Adapt the template sections to the actual changes; don't leave placeholder text.
- Omit the Task/Feature Analysis section entirely if no task description was provided.
- Fill in `_(None found)_` / `_(No issues)_` / `_(No concerns)_` where a section has nothing to report rather than leaving it blank.
