const path = require("path");
const jiti = require("jiti")(__filename, { interopDefault: true });

const modulePath = path.join(__dirname, "..", "index.ts");
const mod = jiti(modulePath);

const {
  TOOLS_BY_NICKNAME,
  NICKNAME_OPTIONS,
  stripHeavyTools,
  normalizeNickname,
  computeEnable,
  computeDisable,
  describeEnableResult,
  describeDisableResult,
} = mod;

describe("lazy-tools heavy tool map", () => {
  test("maps each nickname to its actual heavy tools", () => {
    expect(TOOLS_BY_NICKNAME).toEqual({
      fork: ["fork"],
      browser: ["agent_browser"],
      goals: ["create_goal", "get_goal", "update_goal"],
      subagent: ["subagent"],
    });
  });

  test("exposes every nickname as an option in a stable order", () => {
    expect(NICKNAME_OPTIONS).toEqual(["fork", "browser", "goals", "subagent"]);
  });
});

describe("stripHeavyTools", () => {
  test("removes every heavy tool wherever it appears", () => {
    const active = ["read", "fork", "bash", "get_goal", "create_goal", "agent_browser", "update_goal"];
    expect(stripHeavyTools(active)).toEqual(["read", "bash"]);
  });

  test("preserves non-heavy tools in original order", () => {
    const active = ["bash", "edit", "write", "read"];
    expect(stripHeavyTools(active)).toEqual(["bash", "edit", "write", "read"]);
  });

  test("strips subagent like the other heavy tools", () => {
    const active = ["bash", "subagent", "read"];
    expect(stripHeavyTools(active)).toEqual(["bash", "read"]);
  });

  test("does not add tools that were never active", () => {
    expect(stripHeavyTools(["bash", "read"])).toEqual(["bash", "read"]);
  });

  test("is idempotent and handles empty input", () => {
    const lean = stripHeavyTools(["bash", "read"]);
    expect(stripHeavyTools(lean)).toEqual(lean);
    expect(stripHeavyTools([])).toEqual([]);
  });
});

describe("normalizeNickname", () => {
  test("trims whitespace and lowercases", () => {
    expect(normalizeNickname("  Fork ")).toBe("fork");
    expect(normalizeNickname("GOALS")).toBe("goals");
  });
});

describe("computeEnable", () => {
  const registeredAll = new Set([
    "fork",
    "agent_browser",
    "create_goal",
    "get_goal",
    "update_goal",
    "subagent",
    "enable_tool",
  ]);

  test("unknown nickname returns the real option list, never a dead end", () => {
    const result = computeEnable(["read"], "bogus", registeredAll);
    expect(result.status).toBe("unknown");
    if (result.status === "unknown") {
      expect(result.options).toEqual(["fork", "browser", "goals", "subagent"]);
      expect(result.active).toEqual(["read"]);
    }
  });

  test("empty nickname is treated as unknown", () => {
    const result = computeEnable(["read"], "  ", registeredAll);
    expect(result.status).toBe("unknown");
  });

  test("fork adds only fork, appending after existing tools", () => {
    const result = computeEnable(["read", "bash"], "fork", registeredAll);
    expect(result.status).toBe("enabled");
    if (result.status === "enabled") {
      expect(result.added).toEqual(["fork"]);
      expect(result.active).toEqual(["read", "bash", "fork"]);
      expect(result.unavailable).toEqual([]);
    }
  });

  test("goals restores all three goal tools at once", () => {
    const result = computeEnable(["bash"], "goals", registeredAll);
    expect(result.status).toBe("enabled");
    if (result.status === "enabled") {
      expect(result.added).toEqual(["create_goal", "get_goal", "update_goal"]);
      expect(result.active).toEqual(["bash", "create_goal", "get_goal", "update_goal"]);
    }
  });

  test("subagent adds only subagent, appending after existing tools", () => {
    const result = computeEnable(["read", "bash"], "subagent", registeredAll);
    expect(result.status).toBe("enabled");
    if (result.status === "enabled") {
      expect(result.added).toEqual(["subagent"]);
      expect(result.active).toEqual(["read", "bash", "subagent"]);
      expect(result.unavailable).toEqual([]);
    }
  });

  test("subagent enable is case-insensitive like the other nicknames", () => {
    const result = computeEnable(["read"], "  SubAgent ", registeredAll);
    expect(result.status).toBe("enabled");
    if (result.status === "enabled") {
      expect(result.added).toEqual(["subagent"]);
    }
  });

  test("nickname matching is case-insensitive and trims whitespace", () => {
    const result = computeEnable(["bash"], "  Browser ", registeredAll);
    expect(result.status).toBe("enabled");
    if (result.status === "enabled") {
      expect(result.added).toEqual(["agent_browser"]);
    }
  });

  test("enabling an already-active tool is a no-op, reported as enabled with empty added", () => {
    const result = computeEnable(["read", "fork"], "fork", registeredAll);
    expect(result.status).toBe("enabled");
    if (result.status === "enabled") {
      expect(result.added).toEqual([]);
      expect(result.active).toEqual(["read", "fork"]);
    }
  });

  test("no duplicates when goals partially active", () => {
    const result = computeEnable(["get_goal", "bash"], "goals", registeredAll);
    expect(result.status).toBe("enabled");
    if (result.status === "enabled") {
      expect(result.added).toEqual(["create_goal", "update_goal"]);
      expect(result.active).toEqual(["get_goal", "bash", "create_goal", "update_goal"]);
    }
  });

  test("known nickname whose tools are not registered is unavailable, without throwing", () => {
    const result = computeEnable(["bash"], "browser", new Set(["bash"]));
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.requested).toEqual(["agent_browser"]);
      expect(result.active).toEqual(["bash"]);
    }
  });
});

describe("computeDisable", () => {
  test("removes a specific nickname's tools from the active set", () => {
    const result = computeDisable(["read", "create_goal", "bash", "get_goal", "update_goal"], "goals");
    expect(result.status).toBe("disabled");
    if (result.status === "disabled") {
      expect(result.removed).toEqual(["create_goal", "get_goal", "update_goal"]);
      expect(result.active).toEqual(["read", "bash"]);
    }
  });

  test("unknown nickname returns the real option list", () => {
    const result = computeDisable(["read"], "bogus");
    expect(result.status).toBe("unknown");
    if (result.status === "unknown") {
      expect(result.options).toEqual(["fork", "browser", "goals", "subagent"]);
    }
  });

  test("removes subagent's tool when active", () => {
    const result = computeDisable(["read", "subagent", "bash"], "subagent");
    expect(result.status).toBe("disabled");
    if (result.status === "disabled") {
      expect(result.removed).toEqual(["subagent"]);
      expect(result.active).toEqual(["read", "bash"]);
    }
  });

  test("disable with nothing to remove reports empty removed, active unchanged", () => {
    const result = computeDisable(["read", "bash"], "fork");
    expect(result.status).toBe("disabled");
    if (result.status === "disabled") {
      expect(result.removed).toEqual([]);
      expect(result.active).toEqual(["read", "bash"]);
    }
  });
});

describe("result messages", () => {
  test("unknown enable message lists every nickname option", () => {
    const result = computeEnable(["read"], "bogus", new Set());
    const msg = describeEnableResult(result);
    expect(msg).toContain("fork");
    expect(msg).toContain("browser");
    expect(msg).toContain("goals");
    expect(msg).toContain("subagent");
  });

  test("enabled enable message names the added tools", () => {
    const result = computeEnable(["bash"], "goals", new Set(["create_goal", "get_goal", "update_goal"]));
    const msg = describeEnableResult(result);
    expect(msg).toContain("create_goal");
    expect(msg).toContain("get_goal");
    expect(msg).toContain("update_goal");
  });

  test("disable message names removed tools", () => {
    const result = computeDisable(["fork", "bash"], "fork");
    const msg = describeDisableResult(result);
    expect(msg).toContain("fork");
  });
});

describe("module surface", () => {
  test("default export is a factory function (extension entry)", () => {
    expect(typeof mod.default).toBe("function");
  });
});
