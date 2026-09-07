# pi-config

Shared pi harness configuration for macOS machines. Clone this repo on a new computer, run pi inside it, and paste the setup prompt — the agent replicates the global pi setup stored here.

## Quick Start (new machine)

```bash
git clone <repo-url> pi-config
cd pi-config
pi
```

Then tell pi:

> Use this repo to configure pi globally on this computer. Follow SETUP.md: compare the current machine's pi state against the target state described there, apply what's missing, fix what differs.

Done. Remaining manual steps (API auth) are reported by the agent at the end. See [SETUP.md](SETUP.md) for the full target-state spec the agent follows.

## What's in Here

- `agent/AGENTS.md` — global pi instructions (personal rules: TDD, DRY, commit conventions, PR flow, caveman tone...)
- `agent/settings.json` — default model/provider (`deepseek-v4-flash`), npm packages (pi-web-access, pi-subagents, pi-codex-goal, pi-hypa), skills dir, theme
- `agent/trust.example.json` — example auto-trust entry (adapt path per machine)
- `skills/` — shared skills: `brief`, `plan`, `pr-draft`, `pr-review`
- `extensions/lazy-tools/` — global extension that lazy-loads heavy tool groups (fork, browser, goals, subagent) with `/enable` and `/disable` commands

## Keeping Machines in Sync

This repo is a snapshot of the config on the machines. To update it:

1. Change config directly in the repo, commit, push.
2. On each other machine: `git pull`, then run pi with the setup prompt again — the agent only fixes what differs.

To capture a change made directly on a machine, copy the changed file into the repo, commit, push.

## Excluded on Purpose

`auth.json` and API keys (per-machine credentials), `models.json` (machine-local model providers), machine-local caches (`models-store.json`, `sessions/`), and `node_modules/` (reinstalled from `package.json` / the pi `packages` setting).
