# 盲文点字学习训练器（braille-trainer）

纯前端盲文点字学习与练习工具：从课程挑选字符组，完成**点阵识别 / 文字选点 / 听写**练习，提交即见对错与用时；错题自动进入错题本，可按错误原因筛选并重答；练习次数、正确率与最近变化按课程展示。数据全部保存在本机浏览器 IndexedDB，刷新或离开后再回来数据仍在。

## 快速启动（首选）

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20111>

停止与清理：

```bash
docker compose down        # 停止
docker compose down -v     # 停止并清理（本项目数据在浏览器 IndexedDB，不在容器卷内）
```

## 本地开发方式

```bash
cd frontend
npm install
npm run dev        # http://localhost:20111
npm run build      # 类型检查 + 生产构建
npm run test:smoke # 数据层冒烟测试（种子、判题、会话落库、错题筛选/消化、进度统计）
```

数据层冒烟测试使用 `fake-indexeddb` 在 Node 中直接跑真实的 IndexedDB CRUD 代码。

## 练习闭环说明

1. **选课**：练习模式页选择一门课程（学习卡片页可一键带课跳入），选题型：点阵识别、文字选点、听写练习、混合。
2. **作答**：随机抽取本课最多 10 个字符出题；文字选点直接点击 1–6 号点，点阵识别/听写从候选字符中点选。
3. **即时反馈**：每题提交立即显示对错、错误原因（选错字符 / 漏点 / 多点）与本题用时，并展示正确点位。
4. **结算落库**：整组结束显示得分、正确率与平均用时；练习会话（PracticeSession）与逐题答题记录（AnswerRecord）一次性写入本机 IndexedDB。
5. **错题本**：答错的条目自动收录，可按错误原因筛选；支持单条"重答此题"或整组"重新练习"，复习答对后错题自动标记为已掌握并从列表移除。
6. **学习进度**：按课程展示练习次数、答题数、正确率、平均用时、掌握度与相比上一次的得分变化；顶部为最近练习正确率趋势。没有记录时显示空状态并引导去练习。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite |
| UI | Material UI 依赖保留 + 项目自定义 CSS 组件（BrailleCell 等） |
| 状态管理 | Zustand（按实体独立 store） |
| 本地存储 | IndexedDB（原生封装，首次打开由种子数据播种） |
| 图表 | 纯 CSS 正确率趋势（ChartPanel） |
| 部署 | Docker Compose + Nginx（多阶段构建，SPA try_files） |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async 数据访问；database.ts 封装 IndexedDB，bootstrap.ts 负责播种/导出
├── services/             # practiceService（开练/提交/落库）、mistakeService（错题筛选/消化）
├── stores/               # Zustand 独立 store（4 个实体 + 跨页练习发起器）
├── types/                # 数据模型类型定义（枚举类型从 constants 再导出）
├── constants/            # 枚举、日志模板、错误码/错误消息、状态文案
├── constructors/         # 默认对象 / 表单对象 / 响应对象构造器
├── components/common/    # BrailleCell、LessonProgress、PracticePanel、ResultBadge、ChartPanel、EmptyState 等
├── components/practice/  # PracticeRunner 练习运行器（练习页与错题复习共用）
├── hooks/                # useIndexedDbStore、useBraillePattern、usePracticeSession
├── pages/                # LearnPage / PracticePage / MistakesPage / ProgressPage
├── router/               # 路由表 + hash 路由 hook
├── utils/                # formatters、logger、errors、practice（出题/判题）、practiceStats（统计）
└── mocks/                # brailleTable 标准盲文表 + seedData 首次播种数据
```

分层约定：**数据存取**（api/database → api/*）、**业务规则**（services、utils/practice）、**状态管理**（stores、hooks）、**页面展示**（pages、components）各自独立；页面不直接打开 IndexedDB，store 不直接拼点位判题。

## 环境变量说明

| 变量 | 默认值 | 说明 |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | `braille-trainer` | Compose 项目名与容器名前缀 |
| `FRONTEND_PORT` | `20111` | 宿主机映射端口（容器内固定 80） |

## Docker 部署说明

- 根目录 `docker-compose.yml`：不写 `version:`，顶层 `name: braille-trainer`，只编排 `frontend` 一个服务。
- 容器名：`${COMPOSE_PROJECT_NAME:-braille-trainer}-frontend`；端口映射 `${FRONTEND_PORT:-20111}:80`。
- 多阶段构建：node:20-alpine 执行 `npm run build`，nginx:1.27-alpine 托管 `dist`。
- `frontend/nginx.conf` 配置 `try_files $uri $uri/ /index.html;`，刷新任意子路由不 404；使用 hash 路由（`#/practice`），任意目录名（含中文）均可正常启动。
- 常见问题：
  - 端口占用：修改根目录 `.env` 的 `FRONTEND_PORT` 后 `docker compose up -d`。
  - 练习数据保存在**浏览器** IndexedDB（库名 `braille-trainer`），清空浏览器站点数据即重置；容器重建不影响数据。

## 核心数据模型

| 模型 | 关键字段 | 贯穿位置 |
|---|---|---|
| BrailleSymbol | id, cell_pattern（"1,2,4" 点位串）, letter, pinyin, category, difficulty, audio_hint_key | mocks/brailleTable、api/BrailleSymbol、stores、constructors、LearnPage、PracticeRunner、MistakesPage |
| Lesson | id, title, symbol_ids, stage, estimated_minutes, unlock_rule | mocks/seedData、api/Lesson、stores、constructors、PracticePage、LearnPage、ProgressPage |
| PracticeSession | id, lesson_id（0=错题复习）, mode, started_at, finished_at, score, mistake_count, total_count | api/PracticeSession、services/practiceService、stores、constructors、usePracticeSession、ProgressPage |
| AnswerRecord | id, session_id, symbol_id, user_answer, correct, latency_ms, mistake_reason, resolved | api/AnswerRecord、services/mistakeService、stores、constructors、MistakesPage、ProgressPage |

## 枚举/常量出现位置清单

### PracticeMode（CELL_TO_TEXT / TEXT_TO_CELL / LISTENING / MIXED）

- 常量与文案：`constants/PracticeMode.ts`（含 `PRACTICE_MODE_OPTIONS` 筛选器选项）
- 类型：`types/PracticeMode.ts`（从 constants 再导出）
- 构造器：`constructors/PracticeSessionConstructor.ts`（会话表单默认题型）
- 日志模板：`constants/logTemplates.ts`（练习会话创建/结束模板含 `{mode}`）
- 错误消息：`constants/errorMessages.ts`（SESSION_INVALID 等提交错误）
- 状态文案：`constants/statusText.ts`（STATUS_TEXT.PracticeMode）
- 业务逻辑：`utils/practice.ts`（MIXED 摊派具体题型）、`services/practiceService.ts`
- store / hook：`stores/PracticeLauncherStore.ts`、`hooks/usePracticeSession.ts`
- 筛选器：`pages/PracticePage.tsx`、`pages/MistakesPage.tsx`（复习题型选择）
- 展示组件：`components/practice/PracticeRunner.tsx`、`pages/ProgressPage.tsx`（StatusBadge kind="PracticeMode"）

### SymbolCategory（LETTER / NUMBER / PUNCTUATION / CONTRACTION）

- 常量与文案：`constants/SymbolCategory.ts`（含 `SYMBOL_CATEGORY_OPTIONS`）
- 类型：`types/SymbolCategory.ts`，并被 `types/BrailleSymbol.ts` 引用为字段类型
- 种子数据：`mocks/brailleTable.ts`（46 个字符按分类播种）、`mocks/seedData.ts`
- 构造器：`constructors/BrailleSymbolConstructor.ts`（默认 LETTER）
- 日志模板：`constants/logTemplates.ts`（字符创建模板含 `{category}`）
- 状态文案：`constants/statusText.ts`（STATUS_TEXT.SymbolCategory）
- 格式化：`utils/formatters.ts`（formatCategory）、`utils/practice.ts`（同分类优先出干扰项）
- 筛选/展示：`pages/LearnPage.tsx`（卡片分类徽标）、`components/common/StatusBadge.tsx`（kind="SymbolCategory"）

### MasteryLevel（NEW / LEARNING / FAMILIAR / MASTERED）

- 常量与文案：`constants/MasteryLevel.ts`（含由正确率推导的 `masteryOf` 与筛选选项）
- 类型：`types/MasteryLevel.ts`
- 状态文案：`constants/statusText.ts`（STATUS_TEXT.MasteryLevel）
- 统计：`utils/practiceStats.ts`（buildLessonStats 按课程正确率推导掌握度）
- 展示：`pages/LearnPage.tsx`（单字符掌握度）、`pages/ProgressPage.tsx`（课程掌握度徽标）
- 组件：`components/common/StatusBadge.tsx`（kind="MasteryLevel"）

### MistakeReason（WRONG_PICK / DOT_MISSED / DOT_EXTRA / SKIPPED）

- 常量与文案：`constants/MistakeReason.ts`
- 类型：被 `types/AnswerRecord.ts` 引用为 mistake_reason 字段类型
- 判题：`utils/practice.ts`（gradeChoice → WRONG_PICK；gradeDots → DOT_MISSED/DOT_EXTRA）
- 错题本：`services/mistakeService.ts`（按原因筛选）、`pages/MistakesPage.tsx`（筛选器与计数）
- 即时反馈：`components/common/ResultBadge.tsx`、`components/practice/PracticeRunner.tsx`

## 为什么该项目会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、判题逻辑、筛选器和展示组件被刻意拆散到多层多目录：

- 给 PracticeSession 增加一个字段，要同步 `types`、`constructors`、`api`、`services/practiceService`、日志模板 `constants/logTemplates.ts`、结算 UI 与进度统计。
- 给错题增加一种错误原因，要同步 `constants/MistakeReason`、状态文案、`gradeDots/gradeChoice` 判题、错题本筛选器、ResultBadge 展示与 README 清单。
- 改一个点位串的解析格式，要同步 `utils/formatters` 的 parsePattern、`useBraillePattern` hook、BrailleCell 渲染、判题与种子盲文表。
- service（ServiceError）与 store（StoreError）分别包装异常，错误码/消息集中在 constants，无法只改一处就生效。

## License

MIT
