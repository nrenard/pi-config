import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export const TOOLS_BY_NICKNAME = {
  fork: ["fork"],
  browser: ["agent_browser"],
  goals: ["create_goal", "get_goal", "update_goal"],
  subagent: ["subagent"],
} as const;

export type Nickname = keyof typeof TOOLS_BY_NICKNAME;

export const NICKNAME_OPTIONS = Object.keys(TOOLS_BY_NICKNAME) as Nickname[];

const HEAVY_TOOLS = new Set<string>(Object.values(TOOLS_BY_NICKNAME).flat());

const GROUP_OPTIONS_TEXT = NICKNAME_OPTIONS.join(", ");

export function stripHeavyTools(active: readonly string[]): string[] {
  return active.filter((name) => !HEAVY_TOOLS.has(name));
}

export function normalizeNickname(raw: string): string {
  return raw.trim().toLowerCase();
}

export type EnableResult =
  | { status: "enabled"; active: string[]; added: string[]; unavailable: string[] }
  | { status: "unavailable"; active: string[]; requested: string[] }
  | { status: "unknown"; active: string[]; options: Nickname[] };

export function computeEnable(
  active: readonly string[],
  nicknameInput: string,
  registered: ReadonlySet<string>,
): EnableResult {
  const current = [...active];
  const nickname = normalizeNickname(nicknameInput);
  if (!(nickname in TOOLS_BY_NICKNAME)) {
    return { status: "unknown", active: current, options: [...NICKNAME_OPTIONS] };
  }
  const requested = TOOLS_BY_NICKNAME[nickname as Nickname];
  const available = requested.filter((tool) => registered.has(tool));
  const unavailable = requested.filter((tool) => !registered.has(tool));
  if (available.length === 0) {
    return { status: "unavailable", active: current, requested: [...requested] };
  }
  const added = available.filter((tool) => !active.includes(tool));
  const nextActive = added.length ? [...current, ...added] : current;
  return { status: "enabled", active: nextActive, added, unavailable };
}

export type DisableResult =
  | { status: "disabled"; active: string[]; removed: string[] }
  | { status: "unknown"; active: string[]; options: Nickname[] };

export function computeDisable(
  active: readonly string[],
  nicknameInput: string,
): DisableResult {
  const nickname = normalizeNickname(nicknameInput);
  if (!(nickname in TOOLS_BY_NICKNAME)) {
    return { status: "unknown", active: [...active], options: [...NICKNAME_OPTIONS] };
  }
  const removable = TOOLS_BY_NICKNAME[nickname as Nickname];
  const removed = active.filter((tool) => removable.includes(tool));
  return { status: "disabled", active: active.filter((tool) => !removable.includes(tool)), removed };
}

export function describeEnableResult(result: EnableResult): string {
  switch (result.status) {
    case "unknown":
      return `Unknown tool group. Available groups: ${result.options.join(", ")}.`;
    case "unavailable":
      return `Group ${result.requested.join(", ")} is not available in this pi setup; nothing enabled.`;
    case "enabled": {
      if (result.added.length === 0 && result.unavailable.length === 0) {
        return "Requested tools are already active; nothing to enable.";
      }
      const parts: string[] = [];
      if (result.added.length) parts.push(`enabled: ${result.added.join(", ")}`);
      if (result.unavailable.length) parts.push(`not registered: ${result.unavailable.join(", ")}`);
      return parts.join("; ");
    }
  }
}

export function describeDisableResult(result: DisableResult): string {
  switch (result.status) {
    case "unknown":
      return `Unknown tool group. Available groups: ${result.options.join(", ")}.`;
    case "disabled":
      return result.removed.length
        ? `disabled: ${result.removed.join(", ")}`
        : "Requested tools are not active; nothing to disable.";
  }
}

function buildEnableSchema() {
  return Type.Object({
    nickname: Type.Union([
      ...NICKNAME_OPTIONS.map((nick) => Type.Literal(nick)),
      Type.String({ description: `Tool group to enable. One of: ${GROUP_OPTIONS_TEXT}` }),
    ]),
  });
}

export default function lazyTools(pi: ExtensionAPI): void {
  const applyEnable = (nickname: string) => {
    const registered = new Set(pi.getAllTools().map((t) => t.name));
    const result = computeEnable(pi.getActiveTools(), nickname, registered);
    if (result.status === "enabled" && result.added.length) {
      pi.setActiveTools(result.active);
    }
    return result;
  };

  pi.registerTool({
    name: "enable_tool",
    label: "Enable Tool",
    description: `Re-enable a lazy-loaded tool group for this session (${GROUP_OPTIONS_TEXT})`,
    parameters: buildEnableSchema(),
    async execute(_toolCallId, params: { nickname: string }) {
      const result = applyEnable(params.nickname);
      return {
        content: [{ type: "text", text: describeEnableResult(result) }],
        details: { result },
      };
    },
  });

  pi.on("session_start", (_event, ctx) => {
    const active = pi.getActiveTools();
    const lean = stripHeavyTools(active);
    if (lean.length < active.length) {
      pi.setActiveTools(lean);
      if (ctx.mode === "rpc") {
        ctx.ui.notify(`lazy-tools: stripped ${active.length - lean.length} heavy tool(s) at session start`, "info");
      }
    }
  });

  pi.registerCommand("enable", {
    description: `Enable a lazy-loaded tool group for this session: /enable <${GROUP_OPTIONS_TEXT.replaceAll(", ", "|")}>`,
    handler: async (args, ctx) => {
      const nickname = args ?? "";
      if (!ctx.hasUI) return;
      const result = applyEnable(nickname);
      if (result.status === "enabled" && result.added.length) {
        ctx.ui.setStatus("lazy-tools", `active: ${pi.getActiveTools().join(", ")}`);
      }
      ctx.ui.notify(describeEnableResult(result), "info");
    },
  });

  pi.registerCommand("disable", {
    description: `Disable lazy-loaded tool groups: /disable all | /disable <${GROUP_OPTIONS_TEXT.replaceAll(", ", "|")}>`,
    handler: async (args, ctx) => {
      if (!ctx.hasUI) return;
      const raw = (args ?? "").trim();
      const current = pi.getActiveTools();
      if (raw === "all") {
        const lean = stripHeavyTools(current);
        if (lean.length < current.length) pi.setActiveTools(lean);
        ctx.ui.notify(`disabled all lazy-loaded tools; active: ${lean.length ? lean.join(", ") : "(none)"}`, "info");
        return;
      }
      const result = computeDisable(current, raw);
      if (result.status === "disabled" && result.removed.length) {
        pi.setActiveTools(result.active);
      }
      ctx.ui.notify(describeDisableResult(result), "info");
    },
  });
}
