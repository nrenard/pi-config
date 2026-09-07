---
name: plan
description: Transform any document (PRD, spec, proposal, ticket, free text) into detailed, executable implementation plans with deep codebase context. Saves output to docs/plans/{feature-slug}/main.md.
---

# PLAN Task

## Objective

Transform input documents into detailed, executable implementation plans grounded in the actual codebase. Every feature produces a human-readable `main.md` (Technical Design Document with mermaid diagrams) plus optional detailed sub-plan files for execution. Output is always saved to `docs/plans/{feature-slug}/main.md`.
Use agent teams as much as possible to reduce main context usage.

**Critical constraints:**

- **Code snippets for contracts, not implementations.** Include short snippets for things the executing agent can't reliably infer from pattern references alone. Use pattern references (e.g., "Follow the pattern in `src/actions/actionCreateUserActionReferral.ts`") for everything else. The executing agent will read referenced files and write idiomatic code at implementation time.
  - **Always snippet:** Type/interface definitions, Prisma schema additions, enum values, config object shapes, function signatures for cross-task contracts
  - **Snippet when non-obvious:** Integration wiring (e.g., how to register a background job), validation rules with specific thresholds, data transformations with specific field mappings
  - **Never snippet:** Full function bodies, component JSX/markup, import statements, boilerplate that follows an existing pattern
- **800-line budget per sub-plan.** If a sub-plan exceeds 800 lines, split it further. Plans that are too long degrade execution quality.
- **Plans describe WHAT and WHY, not HOW at the code level.** Focus on business rules, technical decisions, file paths, dependencies, and verification — not implementation details.

## Instructions

### Step 1: Gather Input

If arguments are provided when the skill is invoked, they may contain:

- A single file path (read it directly)
- Multiple file paths separated by spaces or commas (read all)
- Free-text instructions referencing files by name (search for and read them)
- A mix of file paths and instructions (read files, then apply instructions as constraints)

Read all referenced documents and extract requirements. If no arguments are provided, ask:

> "Path to input document? (PRD, spec, proposal, ticket, or any markdown file)"

Read the document(s) and extract:

- **Goal** — What the feature/change achieves
- **Constraints** — Technical or business limitations
- **User stories** — Who benefits and how
- **Technical requirements** — APIs, models, integrations, UI components
- **Out of scope** — What is explicitly excluded

After extracting requirements, **always ask 5-6 clarifying questions** before proceeding. Use the question-asking tool available in your environment (e.g., `AskUserQuestion`) if one exists; otherwise ask conversationally, one at a time or batched. Good questions cover:

- Ambiguous business rules or edge cases
- Scope boundaries (what's in vs. out)
- User experience expectations
- Integration points with existing features
- Performance or scale expectations
- Rollout strategy (feature flags, phased launch, etc.)

This discovery phase is critical — it's the cheapest place to catch misunderstandings before they become wasted implementation effort. Do not skip or reduce the number of questions.

### Step 2: Deep Codebase Exploration

Launch parallel subagents to explore the codebase in parallel (use your environment's subagent tooling, e.g., pi-subagents). Split exploration by domain:

**Agent 1 — Data & Backend:**

- Database schema — relevant models, enums, relations (e.g., `prisma/schema.prisma`)
- Server-side actions/mutations — existing patterns for the feature domain
- API routes — related endpoints
- Data fetching layer — queries and operations
- Background jobs/queues — existing scheduled or async work
- Validation schemas — Zod or equivalent patterns

**Agent 2 — Frontend & Components:**

- Page components — routing structure and where the feature would live
- Feature-specific components — existing UI patterns
- Reusable UI primitives — shared component library
- Hooks — client-side logic
- CTA/action patterns — if relevant

**Agent 3 — Infrastructure & Utilities:**

- Utilities (server/shared/web) — reusable functions
- Authentication — auth patterns
- Rate limiting — throttling patterns
- Email/notification templates — if relevant
- Experiments/feature flags — if relevant
- Environment variables — existing `.env.example` or references

> Adjust these domains and paths to the actual layout of the codebase you're working in. Skip domains that don't apply.

Instruct each explore agent to return findings in this format:

| What   | Where               | Key Details         |
| ------ | ------------------- | ------------------- |
| {name} | `path/file.ts:line` | {brief description} |

This allows direct inclusion in plans without reformatting.

Collect all agent results into a single structured context table.

### Step 3: Complexity Analysis

Based on the extracted requirements and codebase context, assess complexity using these criteria:

- **Domain boundary split:** Separate backend (schema + queries + API) from frontend (components + pages)
- **Dependency chain split:** If feature A must exist before feature B can work, they're separate plans
- **Reusability split:** If a sub-feature (e.g., phone verification) is reusable beyond this feature, it should be its own plan
- **File count heuristic:** 8+ files suggests multi-plan, but domain boundaries take precedence

When splitting, ensure each sub-plan is independently committable and verifiable. Each sub-plan must stay under the **800-line budget** — if a sub-plan would exceed this, split it further.

Summary:

- **Single plan** — Feature has a single concern and can be implemented in one pass
- **Multi-plan** — Feature spans multiple domains, has dependency chains, or contains reusable sub-features

Present the breakdown to the user (using the question tool if available, otherwise conversationally):

> "Based on my analysis, this feature [is simple enough for a single plan / should be split into N sub-plans]:
>
> 1. {sub-plan-1-title} — {brief scope}
> 2. {sub-plan-2-title} — {brief scope}
>    ...
>
> Should I proceed with this breakdown, or would you prefer a different split?"

Wait for user confirmation before generating plans.

### Step 4: Generate Plans

Launch parallel subagents to write the plans — one per sub-plan for multi-plan features (write single plans directly). Each agent MUST receive:

- The full structured context table from Step 2
- The user's original requirements and constraints
- For dependent plans: the expected outputs (file paths, types, function signatures) of upstream plans

Each plan MUST follow this structure:

```markdown
# {Plan Title}

> **For Claude:** Execute this plan task-by-task, in order. Prefer an executing-plans skill if your environment provides one.

**Goal:** {One-sentence summary of what this plan achieves}

**Architecture:** {2-3 sentence overview of the technical approach}

**Tech Stack:** {Relevant technologies from the project stack}

**Depends on:** {List of prerequisite plans and what this plan expects from them, e.g. "Plan 1 — assumes `PhoneVerification` model and `actionVerifyPhone` exist"}

_(Include "Depends on" only for sub-plans in multi-plan features)_

---

## Existing Codebase Context (read this first)

| What | Where               | Key Details |
| ---- | ------------------- | ----------- |
| ...  | `path/file.ts:line` | ...         |

---

## Task N: {Task Title}

**Files:**

- Modify: `path/to/file.ts:line-range` (description)
- Create: `path/to/new-file.ts` (description)

**Pattern reference:** Follow the pattern in `path/to/existing-example.ts`

**Business rules:**

- {Rule 1: e.g., "Codes expire after 10 minutes, max 3 attempts"}
- {Rule 2: e.g., "Only verified users can submit referrals"}

**Technical decisions:**

- {Decision 1: e.g., "Use Redis for code storage with TTL, not database"}
- {Decision 2: e.g., "Rate limit to 5 requests/min per authenticated user"}

**Accepts:** {Input description — e.g., "phone number + country code"}

**Returns:** {Output description — e.g., "{ errors?, verified: boolean }"}

**Commit message:** `type(scope): description`
```

**What belongs in a plan task:**

- File paths (create/modify) with line references for existing files
- Pattern references to existing files the executing agent should follow
- Business rules and validation requirements
- Technical decisions (storage, caching, auth, rate limiting)
- Input/output contracts (what a function accepts and returns)
- Edge cases and error scenarios
- Dependencies between tasks
- Short code snippets for contracts and shapes (see snippet guidelines above)

**What does NOT belong in a plan task:**

- Full function bodies or complete implementation code
- Component JSX/markup or UI layout code
- Import statements
- Boilerplate that mirrors an existing pattern (use a pattern reference instead)
- `// ... existing code ...` markers or pseudocode

---

## Environment Variables

| Variable   | Purpose     | Where to Add |
| ---------- | ----------- | ------------ |
| `VAR_NAME` | Description | `.env`       |

_(Include this section only if new env vars are needed)_

---

## Security & Rate Limiting Checklist

- [ ] Input validation on all user-facing endpoints
- [ ] Rate limiting on sensitive operations
- [ ] Auth checks on protected routes
- [ ] No PII in logs or error messages

_(Include this section only if the feature involves user input, APIs, or sensitive data)_

---

## Testing Notes

- [ ] {Utility/function that should have unit tests}
- [ ] {Edge case that should be tested}

_(Include this section only if the plan introduces testable pure functions or complex logic)_

---

## Verification

1. {How to verify the feature works end-to-end}
2. {Key test scenarios}
3. {Commands to run: the repo's actual typecheck, lint, and test commands}
```

### Step 4.5: Cross-Plan Consistency Review (multi-plan only)

After all plans are generated, review interfaces between dependent plans:

- Verify that types/interfaces referenced across plans have matching shapes
- Verify import paths are consistent (e.g., Plan 3 imports from paths Plan 2 creates)
- Verify function signatures match between where they're defined and where they're consumed
- Flag any conflicting assumptions and resolve them before writing output

### Step 4.6: Generate main.md (always required)

Every feature — whether single-plan or multi-plan — gets a `main.md` file. This file is a **human-readable Technical Design Document (TDD)** that explains the feature at the architecture level. It does NOT contain file paths, code snippets, or line-range references — those belong exclusively in sub-plan files.

`main.md` MUST follow this template:

```markdown
# {Feature Name}

> **For Claude:** Execute this plan task-by-task, in order. Prefer an executing-plans skill if your environment provides one.

## Feature Summary

{1-2 paragraphs: What problem does this solve? Who benefits? Business context.}

## Architecture Overview

{2-3 paragraph technical approach summary}

### System Architecture

{mermaid diagram showing high-level system components and their relationships}

### Data Flow

{mermaid diagram showing how data flows through the system — user actions, server processing, database writes, API responses}

## Implementation Phases

### Phase {N}: {Phase Name}

**Scope**: {What this phase accomplishes in 1-2 sentences}

**Key Components**:

- {Component 1 — what it does}
- {Component 2 — what it does}

{optional mermaid diagram if the phase has a non-trivial workflow}

_(Repeat for each phase/sub-plan)_

## Key Technical Decisions

1. **{Decision Title}** — {Rationale in 1-2 sentences}
2. **{Decision Title}** — {Rationale in 1-2 sentences}
...

## Environment Variables

| Variable   | Purpose     | Where to Add |
| ---------- | ----------- | ------------ |
| `VAR_NAME` | Description | `.env`       |

_(Include only if new env vars are needed)_

## End-to-End Verification

1. {High-level verification step}
2. {High-level verification step}
...

## Implementation Plans

- [Plan 1: {Title}](./plan-1-{slug}.md)
- [Plan 2: {Title}](./plan-2-{slug}.md)
...

_(For single-plan features, omit this section — implementation details are inline in main.md)_
```

**What belongs in main.md:**

- Feature summary with business context
- Architecture overview with mermaid diagrams
- Phase-level scope summaries (not task-level details)
- Key technical decisions with rationale
- Environment variables
- High-level verification steps
- Links to sub-plan files

**What does NOT belong in main.md:**

- Specific file paths or line references
- Code snippets or type definitions
- Pattern references to existing files
- Task-by-task breakdowns
- Codebase context tables

#### Mermaid Diagram Guidelines

Include at least 1-2 mermaid diagrams in every `main.md`. Use whichever diagram type best fits the content:

- **Flowchart (`graph TD`)**: User journeys, decision flows, conditional logic, process workflows
- **Sequence (`sequenceDiagram`)**: API call chains, component interactions, request/response flows
- **Graph (`graph LR`)**: Dependency relationships between plans, modules, or services
- **Block diagram**: System architecture, layer separation, data flow between systems

**Syntax rules** (critical for rendering):

- No spaces in node IDs — use camelCase or underscores: `UserService`, `user_service`
- Wrap edge labels containing special characters in quotes: `A -->|"O(1) lookup"| B`
- Use double quotes for node labels with special characters: `A["Process (main)"]`
- Avoid reserved keywords as node IDs: use `endNode[End]` not `end[End]`
- Do NOT use explicit colors or styling — let the theme handle it

### Step 5: Write Output

**Always** create a directory at `docs/plans/{feature-slug}/` with `main.md` inside it:

**If multi-plan:**

- `docs/plans/{feature-slug}/main.md` — TDD overview (see Step 4.6 template)
- `docs/plans/{feature-slug}/plan-{N}-{slug}.md` — One detailed execution plan per sub-plan (see Step 4 template)

**If single plan:**

- `docs/plans/{feature-slug}/main.md` — TDD overview + inline implementation details (the main.md template sections, followed by the sub-plan task structure from Step 4 appended below the "Implementation Plans" section)

Use a descriptive slug derived from the feature name (e.g., `march-madness-referrals`, `phone-verification-flow`). If the feature is time-bound, prefix with date: `{YYYY-MM-DD}-{feature-slug}`.

### Step 6: Summary

Confirm completion:

- List all files saved with their paths
- Highlight key architectural decisions made
- Note any assumptions or open questions
- Suggest: "Ready to implement? Run the plan with your environment's executing-plans skill, or execute the plan task-by-task."

## TODO Composition

Create todos at task start:

1. `plan-gather-input` — "Read and extract requirements from input document"
2. `plan-explore-codebase` — "Deep codebase exploration with parallel agents"
3. `plan-complexity-analysis` — "Assess complexity and confirm breakdown with user"
4. `plan-generate` — "Generate implementation plan(s)"
5. `plan-write-output` — "Save plan(s) to docs/plans/"
6. `plan-summary` — "Confirm files saved and highlight key decisions"

Update status: Mark `in_progress` when starting each, `completed` when done.
