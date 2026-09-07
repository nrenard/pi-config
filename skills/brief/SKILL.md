---
name: brief
description: Discover requirements and produce a focused brief through one-question-at-a-time discovery. Saves the brief to docs/briefs/, ready to be turned into implementation plans via /plan.
---

# BRIEF Task

## Objective

Guide the user from a rough idea to a focused brief through conversational discovery — one question at a time, multiple choice preferred. Output is a brief saved to `docs/briefs/`, ready to be turned into implementation plans via `/plan`.

**Key principles:**

- **Discovery first.** Ask questions one at a time, prefer multiple choice, explore 2-3 approaches with trade-offs before settling on a direction.
- **Brief, not design.** Capture requirements, direction, and scope — not architecture, data models, or component design. That's `/plan`'s job.
- **Lightweight exploration.** Launch at most 1 subagent to understand what exists in the relevant domain. Skip if the topic is greenfield or purely conceptual.

## Instructions

### Step 1: Gather Input

If arguments are provided when the skill is invoked, they may contain:

- A single file path (read it directly)
- Multiple file paths separated by spaces or commas (read all)
- Free-text describing an idea or topic
- A mix of file paths and free text (read files, use text as context)

Read all referenced documents and extract the core idea, constraints, and goals.

If no arguments are provided, ask:

> "What would you like to brainstorm? Share an idea, a problem to solve, a feature concept, or a path to a document."

### Step 2: Discovery Conversation

Run this phase yourself, following these rules strictly:

**Understanding the idea:**

- Ask questions **one at a time**
- **Multiple choice preferred** — easier for the user and surfaces concerns they might not think of
- Only one question per message — if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria
- Ask 3-10 questions, adapting based on answers. Stop early if the picture is clear; ask more if ambiguous.

**Codebase-specific question prompts** — use these as inspiration, not a checklist. Pick the ones relevant to the topic:

- Does this introduce a new domain concept, or extend an existing one?
- Is this environment-specific or should it work everywhere?
- Does it need any external integrations (third-party API, webhook, SDK, etc.)?
- Is this a time-bound feature (start/end dates, activation window)?
- What's the scope: backend-only, frontend-only, or full-stack?
- Does it involve new database models or extensions to existing ones?
- Does it affect authentication or user identity?
- Should it work for anonymous users, authenticated users, or both?
- Does it involve sending communications (email, SMS, push)?
- Is there a referral, sharing, or viral component?

**General discovery questions** — adapt to the topic:

- Who is the primary user? What problem does this solve for them?
- What does success look like? How would you measure it?
- What's explicitly out of scope?
- Are there existing features this is similar to?
- What's the urgency/timeline? MVP vs. polished?

After each answer, briefly acknowledge and transition to the next question naturally.

**Exploring approaches:**

Once the requirements are understood, propose **2-3 different approaches** with trade-offs before settling on a direction. Present options conversationally with your recommendation and reasoning. Lead with your recommended option and explain why. Ask the user to pick their preferred approach.

### Step 3: Light Codebase Exploration

Once the topic area and approach are clear, launch **1 subagent** to understand what exists in the relevant domain. The purpose is to inform the brief with real codebase context, not to design architecture.

**Skip this step** if the topic is greenfield or purely conceptual.

**Pick the most relevant focus area:**

**Data & Backend** (if the feature involves new models, actions, or APIs):

- Database schema — relevant models, enums, relations
- Server-side actions — existing patterns for the feature domain
- API routes — related endpoints
- Background jobs / queues — existing scheduled or async work

**Frontend & Components** (if the feature involves UI):

- Page and routing structure — where the feature would live
- Feature-specific components — existing UI patterns
- Shared interaction patterns (CTAs, forms, modals) — if relevant

**Infrastructure & Utilities** (if the feature involves auth, email, rate limiting, experiments, or campaigns):

- Server/shared/web utilities — existing helpers
- Campaign or experiment systems — if relevant
- Email or notification templates — if relevant

Instruct the subagent to return findings as:

| What   | Where               | Relevance                         |
| ------ | ------------------- | --------------------------------- |
| {name} | `path/file.ts:line` | {why it matters for this feature} |

### Step 4: Write Brief

Save the brief to `docs/briefs/{feature-slug}-brief.md`.

Use this structure:

```markdown
# {Feature Name} — Brief

**Date:** {YYYY-MM-DD}
**Slug:** {feature-slug}

---

## Goal

{What this feature achieves and why it matters — 2-3 sentences}

## User Stories

- As a {user}, I want {action} so that {benefit}
- ...

## Requirements

- {Functional requirement 1}
- {Functional requirement 2}
- ...

## Constraints

- {Technical or business constraint}
- ...

## Scope

**In scope:**

- ...

**Out of scope:**

- ...

## Approaches Considered

### Option A: {Name} (Recommended)

{2-3 sentences on approach and why it's recommended}

### Option B: {Name}

{2-3 sentences on approach and trade-offs}

### Option C: {Name} (if applicable)

{2-3 sentences on approach and trade-offs}

**Selected:** Option {X} — {one-line rationale}

## Recommended Direction

{High-level approach recommendation based on discovery conversation, selected approach, and codebase context — 3-5 sentences. NOT architecture, just direction.}

## Relevant Codebase Context

| What | Where          | Relevance |
| ---- | -------------- | --------- |
| ...  | `path/file.ts` | ...       |

## Open Questions

- {Anything unresolved}

---

> Next step: Run `/plan docs/briefs/{feature-slug}-brief.md` to generate implementation plans.
```

After writing the brief, suggest the next step:

> "Brief saved to `docs/briefs/{feature-slug}-brief.md`. Ready to create implementation plans? Run `/plan docs/briefs/{feature-slug}-brief.md`."

## TODO Composition

Create todos at task start:

1. `brief-gather-input` — "Read input and extract initial idea"
2. `brief-discovery` — "Discovery conversation with user (one question at a time)"
3. `brief-approaches` — "Propose and evaluate 2-3 approaches"
4. `brief-explore` — "Light codebase exploration"
5. `brief-write` — "Write brief to docs/briefs/"

Update status: Mark `in_progress` when starting each, `completed` when done.
