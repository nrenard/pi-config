# Pi Global Setup Playbook

> **Audience:** an agent (pi or any coding agent) running inside this repo on a fresh macOS machine.
> **Goal:** replicate the pi harness global configuration that lives in this repo onto the current machine.

## Setup Prompt

Start pi inside this repo, then say:

> Use this repo to configure pi globally on this computer. Follow SETUP.md: compare the current machine's pi state against the target state described there, apply what's missing, fix what differs.

## Repo Layout

```
agent/                     → files that belong in ~/.pi/agent/
skills/                    → skill packages (SKILL.md each)
extensions/lazy-tools/     → global pi extension (source + tests)
```

## Target State

| Source | Destination | Notes |
| ------ | ----------- | ----- |
| `agent/AGENTS.md` | `~/.pi/agent/AGENTS.md` | Global context file, loaded at startup in every project. Copy verbatim. |
| `agent/settings.json` | `~/.pi/agent/settings.json` | Copy, then rewrite the `skills` entry path to the current user's home: `<home>/.config/opencode/skills` (see Adaptations). |
| `agent/trust.example.json` | `~/.pi/agent/trust.json` | Only if the user wants auto-trust. Do NOT copy verbatim: replace the path with the current user's real project root, and only after asking the user which directory to trust. |
| `skills/brief/SKILL.md` | `<skills-dir>/brief/SKILL.md` | |
| `skills/plan/SKILL.md` | `<skills-dir>/plan/SKILL.md` | |
| `skills/pr-draft/SKILL.md` | `<skills-dir>/pr-draft/SKILL.md` | |
| `skills/pr-review/SKILL.md` | `<skills-dir>/pr-review/SKILL.md` | |
| `extensions/lazy-tools/` (whole dir) | `~/.pi/agent/extensions/lazy-tools/` | Copy, then run `npm install` inside. Pi auto-discovers `~/.pi/agent/extensions/*/index.ts`. |

Where `<skills-dir>` is the directory referenced by the `skills` array in `settings.json` — by default `~/.config/opencode/skills`. Create it if missing.

## Adaptations (machine-specific)

1. **`settings.json` → `skills` path.** The snapshot contains `/Users/nicolasrenard/.config/opencode/skills`. Rewrite the home prefix to the current user's home (`$HOME/.config/opencode/skills`). Keep everything else identical.
2. **`trust.example.json`.** Never copy the path inside verbatim. Ask the user which directory should be trusted and use that.
3. **Auth.** Never copy `auth.json` or API keys from any machine. The user must authenticate on this machine themselves:
   - `deepseek` (default provider/model `deepseek-v4-flash`): built into pi — user runs `/login deepseek` or exports `DEEPSEEK_API_KEY`.
4. **Packages.** The `packages` array in `settings.json` (`pi-web-access`, `pi-subagents`, `pi-codex-goal`, `@hypabolic/pi-hypa`) installs automatically into `~/.pi/agent/npm/` when pi runs. Verify they appear after first start; do not copy `node_modules` from anywhere.
5. **Optional parity.** This machine also keeps `fd` and `ripgrep` binaries in `~/.pi/agent/bin/`. Install with `brew install fd ripgrep` if the user wants identical behavior. Not required by pi core.

## Steps

1. Read the current machine's `~/.pi/` state: `~/.pi/agent/settings.json`, `~/.pi/agent/models.json`, `~/.pi/agent/AGENTS.md`, `~/.pi/agent/extensions/`, and the skills dir configured in settings.
2. Apply each row of the Target State table: copy missing files, overwrite differing files, rewrite the adaptations above.
3. `npm install` inside `~/.pi/agent/extensions/lazy-tools/`.
4. Verify (below), then tell the user what remains manual (auth).

## Verification

- [ ] `~/.pi/agent/AGENTS.md` and `settings.json` match the repo versions (after path adaptation).
- [ ] All four skill dirs exist under the configured skills dir and are picked up by pi (skill commands `/skill:brief` etc. work).
- [ ] Pi starts with no extension errors; `/reload` loads `lazy-tools` cleanly.
- [ ] After first run, `~/.pi/agent/npm/node_modules/` contains `pi-web-access`, `pi-subagents`, `pi-codex-goal`, `@hypabolic/pi-hypa`.
- [ ] `lazy-tools` tests pass: `npm test` inside the extension dir.
- [ ] Default model resolves: a fresh session uses `deepseek-v4-flash` (after the user authenticates).

## Exclusions (never copy these)

- `~/.pi/agent/auth.json` (credentials)
- `~/.pi/agent/models.json` (machine-local model providers; kept out of this repo on purpose)
- `~/.pi/agent/models-store.json`, `~/.pi/agent/sessions/`, `~/.pi/web-search-cache/` (machine-local caches)
- `node_modules/` anywhere (reinstall instead)
