// 数据层冒烟测试：用 esbuild 即时打包 scripts/smoke.ts 后用 Node 运行。
// 不依赖 Jest/Vitest，避免给纯前端应用引入额外测试框架。
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const out = "node_modules/.cache/smoke.mjs";
mkdirSync(dirname(out), { recursive: true });
execFileSync(
  "npx",
  ["esbuild", "scripts/smoke.ts", "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { stdio: "inherit" }
);
execFileSync("node", [out], { stdio: "inherit" });
