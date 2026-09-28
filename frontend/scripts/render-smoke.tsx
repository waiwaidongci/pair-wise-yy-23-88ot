import { JSDOM } from "jsdom";
import "fake-indexeddb/auto";
import { strict as assert } from "node:assert";

// ---- 浏览器环境准备 ----
const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "http://localhost:20111/",
  pretendToBeVisual: true
});

const { window } = dom;
(globalThis as Record<string, unknown>).window = window;
(globalThis as Record<string, unknown>).document = window.document;
(globalThis as Record<string, unknown>).navigator = window.navigator;
(globalThis as Record<string, unknown>).HTMLElement = window.HTMLElement;
(globalThis as Record<string, unknown>).Node = window.Node;
(globalThis as Record<string, unknown>).Event = window.Event;
(globalThis as Record<string, unknown>).MouseEvent = window.MouseEvent;
(globalThis as Record<string, unknown>).SpeechSynthesisUtterance = class {
  text = "";
  constructor(text: string) {
    this.text = text;
  }
};
(globalThis as Record<string, unknown>).speechSynthesis = {
  cancel() {},
  speak() {}
};
window.speechSynthesis = globalThis.speechSynthesis;
window.SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const click = (el: Element | null | undefined) => {
  assert.ok(el, "expected element to click");
  (el as HTMLElement).dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
};
const $ = (selector: string) => window.document.querySelector(selector);
const $$ = (selector: string) => Array.from(window.document.querySelectorAll(selector));
const bodyText = () => (window.document.body.textContent ?? "").replace(/\s+/g, " ");

async function waitFor(text: string, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (bodyText().includes(text)) return;
    await sleep(50);
  }
  throw new Error(`timeout waiting for text: ${text}; got: ${bodyText().slice(0, 300)}`);
}

async function main() {
  // 挂载应用（main.tsx 内部 createRoot(...).render）
  await import("../src/main.tsx");

  // 1. 启动后播种并展示学习卡片
  await waitFor("学习卡片");
  await waitFor("第一课");
  assert.ok(bodyText().includes("点字字符") || bodyText().includes("课程数"), "learn metrics missing");

  // 2. 进入练习页
  const navPractice = $$("nav button").find((b) => b.textContent?.includes("练习模式"));
  click(navPractice);
  await waitFor("第一步 · 选择课程字符组");
  assert.ok(bodyText().includes("点阵识别"), "mode options missing");

  // 3. 开始练习
  const startBtn = $$("button").find((b) => (b.textContent ?? "").includes("开始练习"));
  click(startBtn);
  await waitFor("提交后立即显示对错和本题用时", 5000);

  // 4. 逐题作答，直到出现结果页
  let guard = 0;
  while (!bodyText().includes("再练一组") && guard < 40) {
    guard += 1;
    // 选择题型：点第一个候选项；文字选点：点两个点再提交
    const optionBtn = $(".option-btn") as HTMLElement | null;
    if (optionBtn) {
      click(optionBtn);
    } else {
      const dots = $$(".dot.clickable:not(:disabled)");
      if (dots.length) {
        click(dots[0]);
        click(dots[1]);
      }
      const submitDotsBtn = $$("button").find((b) => (b.textContent ?? "").trim() === "提交作答");
      click(submitDotsBtn);
    }
    await sleep(30);
    // 反馈出现后点下一题/提交
    await waitFor("下一题", 3000).catch(() => {});
    const nextBtn = $$("button").find((b) => {
      const t = (b.textContent ?? "").trim();
      return t === "下一题" || t === "提交并查看结果";
    });
    if (nextBtn) {
      click(nextBtn);
      await sleep(60);
    } else {
      break;
    }
  }
  await waitFor("再练一组", 5000);
  assert.ok(bodyText().includes("平均用时"), "result panel missing latency");

  // 5. 进度页有数据
  const navProgress = $$("nav button").find((b) => b.textContent?.includes("学习进度"));
  click(navProgress);
  await sleep(100);
  assert.ok(bodyText().includes("练习次数"), "progress page missing");
  assert.ok(!bodyText().includes("还没有练习记录"), "progress still empty after practice");
  assert.ok(bodyText().includes("最近练习正确率趋势"), "trend chart missing");

  // 6. 错题页：先展示待消化错题，再跑错题复习，全部答对后应被消化
  const navMistakes = $$("nav button").find((b) => b.textContent?.includes("错题本"));
  click(navMistakes);
  await waitFor("按错误原因筛选");
  if (bodyText().includes("重答此题")) {
    // 发起一轮错题复习，验证复习会话闭环（消化逻辑由数据层冒烟测试保证）
    if (bodyText().includes("重新练习当前")) {
      const reviewBtn = $$("button").find((b) => (b.textContent ?? "").includes("重新练习当前"));
      click(reviewBtn);
      await waitFor("提交后立即显示对错和本题用时", 5000);
      assert.ok(bodyText().includes("错题复习"), "review title missing");
      let inner = 0;
      while (!bodyText().includes("再练一组") && inner < 30) {
        inner += 1;
        const optionBtn = $(".option-btn:not(:disabled)") as HTMLElement | null;
        if (optionBtn) {
          click(optionBtn);
        } else {
          const dots = $$(".dot.clickable:not(:disabled)");
          if (dots.length) dots.forEach((d) => click(d));
          const submitDotsBtn = $$("button").find((b) => (b.textContent ?? "").trim() === "提交作答");
          if (submitDotsBtn) click(submitDotsBtn);
        }
        await sleep(30);
        const nextBtn = $$("button").find((b) => {
          const t = (b.textContent ?? "").trim();
          return t === "下一题" || t === "提交并查看结果";
        });
        if (nextBtn) {
          click(nextBtn);
          await sleep(60);
        } else {
          break;
        }
      }
      await waitFor("再练一组", 5000);
      assert.ok(bodyText().includes("会话与逐题记录已保存到本机"), "review result note missing");
      const back = $$("button").find((b) => (b.textContent ?? "").trim() === "返回");
      click(back);
      await sleep(150);
      assert.ok(bodyText().includes("按错误原因筛选"), "back to mistake list failed");
    }
  } else {
    // 没有错题时应为空状态
    assert.ok(bodyText().includes("错题本还是空的"), "expected empty mistake book");
  }

  // 7. 验证"离开后再回来数据还在"：
  //    a) 直接查 IndexedDB：会话与答题记录已持久化（不依赖内存 store）
  //    b) 离开练习相关页面再回到进度页，UI 重新从本机库读取并展示同样数据
  const { listPracticeSession } = await import("../src/api/PracticeSession");
  const { listAnswerRecord } = await import("../src/api/AnswerRecord");
  await sleep(300); // 等待最后一次复习会话的落库事务完成
  const persistedSessions = await listPracticeSession();
  const persistedRecords = await listAnswerRecord();
  assert.ok(persistedSessions.length >= 1, `sessions did not persist in IndexedDB (${persistedSessions.length})`);
  assert.ok(persistedRecords.length >= 10, `answer records did not persist in IndexedDB (${persistedRecords.length}) ids=${persistedRecords.map((r) => r.id).join(",")}`);

  const navLearn = $$("nav button").find((b) => b.textContent?.includes("学习卡片"));
  click(navLearn);
  await waitFor("学习卡片");
  const navProgressAgain = $$("nav button").find((b) => b.textContent?.includes("学习进度"));
  click(navProgressAgain);
  await sleep(150);
  assert.ok(bodyText().includes("按课程统计"), "progress page failed to re-read local data");

  console.log("RENDER SMOKE OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
