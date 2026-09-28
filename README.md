# 盲文点字学习训练器（braille-trainer）

纯前端盲文点字学习与练习工具：从课程中挑选字符完成「看点阵选文字 / 看文字选点位 / 听读音选文字」练习，提交即时判分计时，错题自动进入错题本并可按错误原因筛选重练，所有作答与练习结果保存在本机 IndexedDB，刷新或离开后再回来数据仍在。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20111>

停止与重置：

```bash
docker compose down          # 停止
docker compose down -v       # 停止并清理（本项目数据在浏览器 IndexedDB，卷仅用于镜像层）
```

## 本地开发方式

```bash
cd frontend
npm install
npm run dev      # http://localhost:20111
npm run build    # 类型检查 + 生产构建
npm run smoke    # 练习闭环数据层冒烟测试（fake-indexeddb）
```

`frontend/scripts/smoke.mjs` 会在内存 IndexedDB 中走完整闭环：灌种子 → 开课 → 逐题判分计时 → 会话与答题记录落库 → 错题筛选/重练自动关闭 → 按课程统计正确率。

## 练习闭环

1. **学习卡片 `/learn`**：按课程、难度（简单/中等/困难）、类别（字母/数字/标点/缩略）切换，查看 6 点盲文点阵、读音与掌握等级，可播放读音。
2. **练习模式 `/practice`**：选择课程与模式（看点阵选文字、看文字选点位、听写、混合），随机出题；提交后**立即显示对错、错误原因和本题用时**；全部答完展示得分、正确率、总用时与逐题明细。
3. **错题本 `/mistakes`**：答错条目自动收录，可按**错误原因（字符认错 / 漏点 / 多点 / 点位不符）**筛选、按字符搜索、勾选标记掌握，或对当前筛选结果一键「重新作答」；重练答对后自动移出错题本。
4. **学习进度 `/progress`**：按课程展示练习次数、答题数、正确率、平均每题用时、待巩固错题数，以及最近一次会话相对上一次的正确率变化（▲/▼ 百分点）和最近 12 次会话趋势图；**没有任何练习记录时显示空状态**。

数据全部保存在浏览器本机 IndexedDB（首次打开自动灌入 44 个盲文字符与 6 门课程种子；会话与答题记录从空开始，由学习者产生）。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Material UI（依赖保留）+ Zustand |
| 数据 | IndexedDB（自封装，无第三方 API）+ localStorage 种子标记 |
| 语音 | 浏览器内置 Web Speech API（听写模拟，可静默降级） |
| 测试 | fake-indexeddb + jsdom + esbuild 冒烟脚本 |
| 部署 | Docker Compose + Nginx（多阶段构建，SPA try_files） |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async 数据访问；db.ts 为 IndexedDB 封装，bootstrap.ts 负责首次灌种子
├── stores/               # Zustand 独立 store：4 个实体 store + 练习运行态 store + 错题重练跨页通道
├── types/                # 数据模型类型；枚举类型从 constants 再导出
├── constants/            # PracticeMode/SymbolCategory/MasteryLevel/MistakeReason/DifficultyLevel、日志模板、错误码、错误文案
├── constructors/         # 默认对象 / 表单对象 / 响应对象 / 会话与答题记录提交构造器
├── services/             # gradingService（出题+判分）、mistakeService（错题归集）、progressService（进度统计）
├── components/common/    # BrailleCell / LessonProgress / PracticePanel / ResultBadge / ChartPanel / EmptyState 等
├── components/practice/  # PracticeSetup / PracticeQuestionCard / PracticeSummary
├── hooks/                # useBraillePattern / usePracticeSession / useIndexedDbStore
├── pages/                # LearnPage / PracticePage / MistakesPage / ProgressPage
├── router/               # routes 配置 + hash 路由
├── utils/                # formatters / logger / errors / brailleDots / speech / collection
├── mocks/                # 盲文字符与课程种子
└── scripts/              # 数据闭环与页面挂载冒烟脚本
```

分层约定：**数据存取（api/）→ 业务规则（services/）→ 状态管理（stores/）→ 页面展示（pages/components/）**。页面不直接读写 IndexedDB，判分与统计规则不散落在组件里。

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名与容器名前缀，默认 `braille-trainer`
- `FRONTEND_PORT`：宿主机映射端口，默认 `20111`（容器内固定 80）

## Docker 部署说明

- 根 `docker-compose.yml` 不写 `version`，顶层 `name: braille-trainer`。
- 容器名：`${COMPOSE_PROJECT_NAME:-braille-trainer}-frontend`，端口映射 `${FRONTEND_PORT:-20111}:80`。
- 纯前端无后端卷；学习者数据保存在各自浏览器的 IndexedDB 中，清除站点数据即重置。
- 常见问题：端口占用时改 `.env` 的 `FRONTEND_PORT`；目录名为中文不影响启动（构建上下文与卷均使用相对路径/匿名卷）。

## 枚举/常量出现位置清单

- **PracticeMode**（CELL_TO_TEXT / TEXT_TO_CELL / LISTENING / MIXED）
  `constants/PracticeMode.ts`（含中文文案与 PromptMode）、`types/PracticeMode.ts`（再导出）、
  `types/PracticeSession.ts`、`constructors/PracticeSessionConstructor.ts`、
  `constants/logTemplates.ts`（START/FINISH 模板）、`constants/statusText.ts`、
  `utils/formatters.ts`（formatPracticeMode）、`services/gradingService.ts`（MIXED 展开与出题）、
  `stores/PracticeRunnerStore.ts`、`components/practice/PracticeSetup.tsx`（模式筛选 chip）、
  `components/practice/PracticeQuestionCard.tsx`（题干展示）、错题重练通道与练习页。
- **SymbolCategory**（LETTER / NUMBER / PUNCTUATION / CONTRACTION）
  `constants/SymbolCategory.ts`、`types/SymbolCategory.ts`、`types/BrailleSymbol.ts`、
  `mocks/seedData.ts`（种子分类）、`utils/formatters.ts`（formatSymbolCategory）、
  `constants/statusText.ts`、`pages/LearnPage.tsx`（类别筛选与卡片展示）。
- **MasteryLevel**（NEW / LEARNING / FAMILIAR / MASTERED）
  `constants/MasteryLevel.ts`、`types/MasteryLevel.ts`、`constants/statusText.ts`、
  `utils/formatters.ts`（formatMasteryLevel）、`services/progressService.ts`（依据答题历史分级）、
  `pages/LearnPage.tsx`（卡片状态徽标与色调）。
- **MistakeReason**（WRONG_CHAR / MISSED_DOT / EXTRA_DOT / PATTERN_MISMATCH，错题闭环新增）
  `constants/MistakeReason.ts`、`types/AnswerRecord.ts`、
  `services/gradingService.ts`（点位差异归因）、`services/mistakeService.ts`（筛选与汇总）、
  `utils/formatters.ts`、`components/practice/PracticeQuestionCard.tsx`、
  `components/practice/PracticeSummary.tsx`、`pages/MistakesPage.tsx`（原因筛选 tab 与标签）。

新增一个枚举值通常需要同步：常量+文案、类型、构造器、日志模板、判分/统计 service、筛选 chip、详情/徽标展示与格式化函数。

## 为什么该项目会牵一发动全身

实体字段、枚举、日志模板、错误码/错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录，且判分（gradingService）、错题归集（mistakeService）、进度统计（progressService）复用同一批 AnswerRecord：

- 修改一次作答字段（如 `mistake_reason`）要同步类型、构造器、判分服务、错题筛选、练习反馈与错题本标签；
- 修改一个练习模式要同步常量、出题逻辑、题干组件、结果汇总、日志模板与路由入口；
- AnswerRecord 由练习页写入、错题本与进度页共同消费，写入结构变化会同时影响错题筛选和正确率统计。

## License

MIT
