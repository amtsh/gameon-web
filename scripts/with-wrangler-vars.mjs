import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function loadWranglerVars() {
  const wranglerPath = path.join(process.cwd(), "wrangler.jsonc");
  const raw = fs.readFileSync(wranglerPath, "utf8");
  const json = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/,\s*([}\]])/g, "$1");
  const config = JSON.parse(json);
  return config.vars ?? {};
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/with-wrangler-vars.mjs <command> [args...]");
  process.exit(1);
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: { ...process.env, ...loadWranglerVars() },
});

process.exit(result.status ?? 1);
