// React 渲染冒烟测试：jsdom + fake-indexeddb 下挂载真实应用，模拟点击跑通一整组练习。
// CSS 使用 esbuild 的 empty loader 置空（Node 中无需真实样式）。
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const out = "node_modules/.cache/render-smoke.cjs";
mkdirSync(dirname(out), { recursive: true });
execFileSync(
  "npx",
  [
    "esbuild", "scripts/render-smoke.tsx",
    "--bundle",
    "--platform=node",
    "--format=cjs",
    "--external:jsdom",
    "--jsx=automatic",
    "--loader:.css=empty",
    `--outfile=${out}`
  ],
  { stdio: "inherit" }
);
execFileSync("node", [out], { stdio: "inherit" });
