// React 挂载冒烟：jsdom + fake-indexeddb，依次切换四个路由并触发一组真实练习
import { JSDOM } from "jsdom";
import "fake-indexeddb/auto";

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost:20111/#/learn",
  pretendToBeVisual: true
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

// jsdom 没有语音合成
dom.window.speechSynthesis = {
  cancel() {},
  speak() {}
};
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};

globalThis.localStorage = dom.window.localStorage;
dom.window.indexedDB = globalThis.indexedDB;
dom.window.IDBKeyRange = globalThis.IDBKeyRange;

import { createRoot } from "react-dom/client";
import React from "react";
import App from "../src/App.tsx";
async function main() {
const flush = () => new Promise((resolve) => setTimeout(resolve, 30));
const waitFor = async (predicate, timeout = 3000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return true;
    await flush();
  }
  return false;
};
function assert(condition, message) {
  if (!condition) {
    console.error("✗", message);
    process.exit(1);
  }
  console.log("✓", message);
}

createRoot(document.getElementById("root")).render(React.createElement(App));
await waitFor(() => document.querySelectorAll(".symbol-card").length === 5);

// /learn
assert(document.querySelector("h1")?.textContent === "学习卡片", "学习页渲染标题");
const cards = document.querySelectorAll(".symbol-card");
assert(cards.length === 5, "默认课程《元音初识》展示 5 张字符卡");

// /progress 空状态
window.location.hash = "#/progress";
window.dispatchEvent(new Event("hashchange"));
await waitFor(() => document.querySelector("h1")?.textContent === "学习进度");
assert(document.querySelector("h1")?.textContent === "学习进度", "进度页渲染");
assert(document.querySelector(".empty")?.textContent.includes("还没有练习记录"), "无记录时显示空状态");

// /mistakes 空状态
window.location.hash = "#/mistakes";
window.dispatchEvent(new Event("hashchange"));
await waitFor(() => document.querySelector("h1")?.textContent === "错题本");
assert(document.querySelector("h1")?.textContent === "错题本", "错题本渲染");
assert(document.querySelector(".empty")?.textContent.includes("还没有错题"), "错题本空状态");

// /practice 配置 -> 开始
window.location.hash = "#/practice";
window.dispatchEvent(new Event("hashchange"));
await waitFor(() => [...document.querySelectorAll("button")].some((b) => b.textContent.includes("开始练习")));
const startButton = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("开始练习"));
assert(Boolean(startButton), "练习设置页有开始按钮");
startButton.click();
await flush();

// 答完 5 题：直接点选项/提交
for (let i = 0; i < 5; i += 1) {
  await flush();
  const options = document.querySelectorAll(".option-btn");
  const submitDots = document.querySelector(".text-to-cell .btn.primary");
  if (options.length) {
    options[0].click(); // 不一定是对的，但能完成提交闭环
  } else if (submitDots) {
    document.querySelectorAll(".braille-dot.interactive").forEach((dot, idx) => {
      if (idx % 2 === 0) dot.click();
    });
    submitDots.click();
  }
  await flush();
  const nextButton = [...document.querySelectorAll("button")].find((b) =>
    b.textContent.includes("下一题") || b.textContent.includes("查看结果")
  );
  assert(Boolean(nextButton), `第 ${i + 1} 题提交后出现即时反馈与推进按钮`);
  assert(document.querySelector(".result-badge") !== null, `第 ${i + 1} 题显示对错徽标`);
  nextButton.click();
  await flush();
}

await waitFor(() => document.querySelector("h2")?.textContent.includes("本次练习结果"));
assert(document.querySelector("h2")?.textContent.includes("本次练习结果"), "结果页展示");
assert(document.querySelectorAll(".review-row").length === 5, "结果页列出 5 条答题明细");

// 错题本此时应有记录
window.location.hash = "#/mistakes";
window.dispatchEvent(new Event("hashchange"));
await waitFor(() => document.querySelector(".mistake-row") || document.querySelector(".empty"));
const hasMistakeUi = document.querySelector(".mistake-row") || document.querySelector(".empty");
assert(Boolean(hasMistakeUi), "错题本可展示（有错题或空状态）");

// 进度页不再空
window.location.hash = "#/progress";
window.dispatchEvent(new Event("hashchange"));
await waitFor(() => document.querySelector(".chart-panel"));
assert(document.querySelector(".chart-panel") !== null, "有记录后进度页展示趋势图与课程统计");

console.log("\nReact 挂载冒烟通过 ✅");
process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
