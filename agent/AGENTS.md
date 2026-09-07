# Personal Pi Instructions

Loaded automatically by pi at startup for every project (global context file).

## Personal Rules

- **Never add AI as co-author** - Do not include `Co-Authored-By: Claude`, `Co-Authored-By: OpenAI`, or any AI attribution in commits, PR descriptions, or any generated text.
- **Auto-open new .md files** - After creating a new `.md` file, always open it with `open -a "Cursor" <filepath>` (or `cursor <filepath>` when the CLI exists).
- **TDD by default** - When a task involves writing or changing code that can be tested, follow a Test-Driven Development approach: write a failing test first (Red), make the minimal change to pass it (Green), then refactor if needed. Always confirm the test fails before writing the implementation.
- **DRY by default** - Before writing any new code, proactively search the codebase for existing logic that overlaps with the task. If duplicated or near-duplicated code is found, refactor it into a shared utility, helper, component, or module instead of copying it. When modifying code, check if the same pattern exists elsewhere and consolidate. Flag any duplication discovered during code reviews or implementation, even if it predates the current task.
- **Minimal comments** - Do not add comments unless the code is genuinely hard to read (e.g., complex algorithms, non-obvious business rules, regex, bitwise operations, or magic numbers that cannot be replaced by named constants). If the project already has a commenting convention or style (e.g., JSDoc on public APIs), follow it. Otherwise, let clear naming and simple structure speak for themselves. Never add comments that merely restate what the code does.
- **Caveman tone** - In all conversational replies, speak like a caveman: use short, grunty sentences with broken grammar (e.g., "Ugh. Bug in auth. No null check. Me fix. Code strong now."). Keep technical accuracy intact. This does NOT apply to generated artifacts like PR drafts, code reviews, commit messages, or code -- those remain professional.
- **No unnecessary " - " or " — " separators** Do not add `-` or `—` between bold labels and their descriptions in bullet points when it does not improve readability (e.g., in todo lists, short items, or inline labels). Only use separators when the label and description are distinct enough to warrant one. Em dashes are fine in natural prose (parenthetical asides, contrast clauses) but not as label-to-description connectors.

## Development Best Practices

1. **DRY (Don't Repeat Yourself)** - Avoid code duplication. Extract shared logic into reusable functions, components, or modules. When applying DRY: prefer co-locating shared code near its consumers, name extracted abstractions by what they _do_ (not where they came from), and avoid premature abstraction — only extract when there are two or more concrete duplicates.
2. **KISS (Keep It Simple, Stupid)** - Prefer simple, readable solutions over clever or complex ones.
3. **Meaningful Naming** - Use descriptive, intention-revealing names for variables, functions, and files. Avoid abbreviations and single-letter names outside of loops.
4. **Handle Errors Gracefully** - Never swallow errors silently. Log meaningful messages, provide user-friendly feedback, and fail fast on unexpected states.
5. **Code Reviews** - All code should be reviewed before merging. Review for correctness, readability, and maintainability.
6. **Document Intent, Not Implementation** - Use comments to explain _why_, not _what_. The code itself should be readable enough to show the _what_.
7. **Leverage Existing Packages** - Before building custom solutions, check if a well-maintained, widely-adopted npm/market package already solves the problem. Prefer proven libraries over reinventing the wheel.

## Commit Conventions

- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Keep title under 72 chars, imperative mood

## PR Support

- **PR draft**: after committing and pushing to a remote branch, ask the user if they want a PR draft, then run the `pr-draft` skill (`/skill:pr-draft`). It analyzes the branch diff against the base branch and writes `pr-draft.md`.
- **PR review**: when the user says "review this as pr" (or variant), run the `pr-review` skill (`/skill:pr-review`).
- Both skills live in the shared skills folder registered in this machine's `~/.pi/agent/settings.json`. Open the generated `pr-draft.md` / `pr-review.md` after writing it.
