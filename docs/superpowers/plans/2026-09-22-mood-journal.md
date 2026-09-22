# 情绪日记与自我关怀 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付可部署到 GitHub Pages 的情绪记录、可追溯洞察、关怀与回顾闭环，同时提供独立虚构示例。

**Architecture:** React 页面通过显式空间参数调用 IndexedDB 仓储，分析采用纯函数。关怀使用独立会话状态机，AI 仅展示固定材料。hash 路由、相对发布基础路径和静态音频支撑 Pages 发布。

**Tech Stack:** React、TypeScript、Vite、CSS、原生 IndexedDB、SVG；Vitest、fake-indexeddb、Testing Library、Playwright 用于必要验证。版本在执行时检查官方兼容要求后锁入 package-lock.json，不在计划阶段安装依赖。

**Spec:** `docs/superpowers/specs/2026-09-22-mood-journal-design.md`（已批准）。

## Global Constraints

- 第一版不调用模型，不发送个人日记，不提供账户、跨设备同步、社交功能或心理诊断。
- 两个空间分别保存数据；每次读写必须显式指定空间，不以界面标签作为唯一隔离措施。
- 日记文字：可选，最多 5000 字，以纯文本保存与显示。
- 只有同时满足以下条件才显示比较结论：同期至少 7 条日记；该标签至少 3 条日记；同期至少存在 1 条不含该标签的日记。
- 缺失日期留空，不插值，不跨缺失点画连续线。
- 导入上限 10 MB。
- 页面在 360px 手机到桌面宽度可用，正文不横向溢出，底部导航不遮挡表单操作。
- 音频须用户主动播放。
- 不将本地构建成功等同于部署成功。

## Review Focus

1. 记录跨午夜、月份、夏令时或用户切换时区时，已保存日期不能漂移，7 天范围不能变成 168 小时的误差窗口；任务 1、4 验证。
2. 双击保存、切换空间期间异步读写返回时，不生成重复记录或把旧空间结果显示为新空间数据；任务 2、3 验证。
3. IndexedDB 事务中途失败、格式正确但包含重复 ID 或孤立引用的备份，不能清空原数据；任务 2、7 验证。
4. 后台计时、刷新、暂停后恢复或连续点击结束时，不重复完成活动，也不把中断活动计为有效反馈；任务 5 验证。
5. 访问很久以前的示例、编辑或删除示例材料之后，AI 示例引用仍正确，个人数据不被自动重置；任务 6 验证。

## 执行前约定

本计划待用户审阅并选择执行方式；当前仅修改文档。执行时先阅读对应执行技能及工作树技能，检查 `git status --short`、当前分支和远端；按技能创建隔离工作区。不得覆盖用户新增文件。每项任务完成相关验证后提交限定路径，不使用 `git add .`。

项目是单一闭环，任务依赖较强，顺序为 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8。示例数据在任务 6 装配，之前以测试夹具验证，最终页面不遗留开发夹具。

## 文件与接口地图

```text
src/
  app/{App.tsx,router.ts,useWorkspace.ts,AppShell.tsx}
  domain/{types.ts,catalog.ts,dates.ts,validation.ts}
  storage/{database.ts,repository.ts,backup.ts}
  journal/{JournalPage.tsx,JournalForm.tsx,ReviewPage.tsx}
  insights/{analyze.ts,InsightsPage.tsx,TrendChart.tsx,EvidenceView.tsx}
  care/{recommend.ts,session.ts,CarePage.tsx,CareSession.tsx,AudioPlayer.tsx}
  demo/{story.ts,seed.ts,aiExample.ts,AiExamplePage.tsx}
  settings/{DataPage.tsx,PreferencesPage.tsx}
  ui/{RatingInput.tsx,ConfirmDialog.tsx,StatusMessage.tsx}
  styles/{tokens.css,global.css,pages.css}
  main.tsx
tests/{fixtures.ts,dates.test.ts,validation.test.ts,repository.test.ts,
  journal.test.tsx,analysis.test.ts,care.test.ts,example.test.ts,
  backup.test.ts,e2e/flows.spec.ts}
public/audio/{rain.wav,LICENSE.txt}
scripts/generate-rain.mjs
docs/{verification.md,assets.md}
.github/workflows/deploy.yml
```

测试夹具集中在 `tests/fixtures.ts`，禁止通过产品 UI 暴露测试专用控件。共用类型在任务 1 一次定义，之后任务使用相同字段。

## Task 1: 建立可验证的应用骨架与领域约束

**Files:** 创建 package.json、package-lock.json、index.html、vite.config.ts、tsconfig.json、vitest.config.ts、.gitignore、src/main.tsx、src/app/App.tsx、src/domain/*.ts、tests/fixtures.ts、tests/dates.test.ts、tests/validation.test.ts。

**Interfaces:** 输出以下类型与函数；所有时间戳为 ISO 字符串，日期为 YYYY-MM-DD，评分为 1–5 整数。

```ts
export type Space = 'personal' | 'demo';
export type Score = 1 | 2 | 3 | 4 | 5;
export type Emotion = '焦虑' | '烦躁' | '低落' | '疲惫' | '平静' | '开心' | '期待' | '满足';
export type EventTag = '工作任务' | '人际沟通' | '通勤' | '睡眠' | '运动' | '个人生活';
export type CareKind = 'breathing' | 'sound' | 'movement';
export interface Journal {
  id: string; occurredAt: string; localDate: string;
  feeling: Score; emotions: Emotion[]; intensity: Score;
  tags: EventTag[]; text: string; createdAt: string; updatedAt: string;
}
export interface CareRecord {
  id: string; kind: CareKind; startedAt: string; endedAt?: string;
  endDate?: string;
  status: 'running' | 'paused' | 'completed' | 'exited' | 'interrupted';
  before?: Score; after?: Score; journalId?: string;
}
export interface Snapshot { journals: Journal[]; care: CareRecord[] }
export interface Preferences {
  space?: Space; rangeDays: 7 | 30; reduceMotion: boolean; volume: number;
}
// dates.ts
export function localDateOf(date: Date): string;
export function dateWindow(endDate: string, days: 7 | 30): string[];
// validation.ts：失败抛出含中文可展示消息的 Error
export function validateJournal(value: unknown, now: Date): Journal;
export function validateCare(value: unknown, now: Date): CareRecord;
// tests/fixtures.ts：覆盖字段后仍返回合法对象
export function journal(overrides?: Partial<Journal>): Journal;
export function care(overrides?: Partial<CareRecord>): CareRecord;
```

- [ ] 检查本机 Node/npm 与官方 Vite/React 测试工具兼容要求，安装兼容版本并锁定。package.json 脚本设为 `dev: vite`、`build: tsc --noEmit && vite build`、`test: vitest run`、`preview: vite preview`、`test:e2e: playwright test`。排除 node_modules、dist、测试输出，避免产品目录脚手架覆盖已有 docs。
- [ ] 先写日期和验证测试，再运行 `npm test -- tests/dates.test.ts tests/validation.test.ts`，确认因未实现行为失败，而非测试配置错误。

```ts
expect(dateWindow('2026-03-02', 7)).toEqual([
  '2026-02-24','2026-02-25','2026-02-26','2026-02-27',
  '2026-02-28','2026-03-01','2026-03-02'
]);
expect(() => validateJournal(journal({ feeling: 0 as Score }), new Date('2026-09-22T12:00:00Z'))).toThrow();
expect(() => validateJournal(journal({ text: '字'.repeat(5001) }), new Date('2026-09-22T12:00:00Z'))).toThrow();
```

- [ ] 实现目录和领域校验：未知枚举、重复标签、空情绪、非法日期、未来时间、分数越界拒绝；严格验证真实日历日期，已存 localDate 不根据当前时区重算。字数使用 `Array.from(text).length`。备份校验复用这些函数。

```ts
// 用日期分量生成日历序列，不把本地日期当作 ISO 时间戳解析。
const [year, month, day] = endDate.split('-').map(Number);
const anchor = new Date(Date.UTC(year, month - 1, day));
const dates = Array.from({ length: days }, (_, index) => {
  const value = new Date(anchor);
  value.setUTCDate(value.getUTCDate() - (days - 1 - index));
  return value.toISOString().slice(0, 10);
});
```

- [ ] 加入跨年、闰日、未来时间及 HTML 字符串保留为普通文字的测试；运行目标测试和 `npm run build`。分别以 Asia/Shanghai、America/New_York 时区运行日期测试，输出日历范围一致。
- [ ] 提交上述配置、domain 文件和测试，提交信息 `feat: establish journal domain and app foundation`。

## Task 2: 实现持久化、空间隔离与更新入口

**Files:** 创建 src/storage/database.ts、src/storage/repository.ts、src/app/useWorkspace.ts、tests/repository.test.ts。

**Interfaces:** 消费任务 1 类型；输出 `openRepository(basePath: string): Promise<Repository>`，数据库名为 `mood-journal:` 加规范化 basePath。Repository 定义如下。

```ts
export interface Repository {
  read(space: Space): Promise<Snapshot>;
  saveJournal(space: Space, entry: Journal): Promise<void>;
  deleteJournal(space: Space, id: string): Promise<void>;
  saveCare(space: Space, entry: CareRecord): Promise<void>;
  deleteCare(space: Space, id: string): Promise<void>;
  replace(space: Space, snapshot: Snapshot): Promise<void>;
  readPreferences(): Promise<Preferences>;
  savePreferences(value: Preferences): Promise<void>;
  close(): void;
}
// useWorkspace.ts
export function useWorkspace(repo: Repository, space: Space): {
  snapshot: Snapshot; loading: boolean; error: string | null;
  refresh(): Promise<void>;
};
```

- [ ] 使用 fake-indexeddb 写空间隔离、关闭重开持久化、删除关联日记及 replace 失败回滚测试，先运行 `npm test -- tests/repository.test.ts` 确认失败。

```ts
const repo = await openRepository('/journal/');
await repo.saveJournal('personal', journal({ id: 'same-id' }));
await repo.saveJournal('demo', journal({ id: 'same-id', feeling: 1 }));
expect((await repo.read('personal')).journals[0].feeling).toBe(3);
await repo.replace('demo', { journals: [], care: [] });
expect((await repo.read('personal')).journals).toHaveLength(1);
```

- [ ] 使用 `[space, id]` 作为对象存储复合键。replace 在同一个 readwrite 事务中清理指定空间并写入全部对象；仅在事务 oncomplete 时 resolve，abort/error 必须 reject。删除日记同时清除相同空间活动的 journalId，不删除活动。schema version 为 1，升级回调不得删除旧存储。

```ts
await new Promise<void>((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onabort = () => reject(transaction.error ?? new Error('保存未完成，请重试'));
  transaction.onerror = () => reject(transaction.error ?? new Error('保存失败，请重试'));
});
```

- [ ] 实现 useWorkspace 的请求序号：空间切换立即清空旧视图；较早的 read 返回时丢弃。修改成功后 refresh，失败返回页面并保留表单。写一个延迟 personal read、先返回 demo read 的 hook 测试，最终只能显示 demo。
- [ ] 验证事务中途强制 abort 后原快照仍存在；两个 basePath 的仓库不共享内容；升级/打开受阻显示可操作错误。运行任务 2 测试后提交 `feat: persist isolated journal workspaces`。

## Task 3: 完成记录、回顾及响应式应用外壳

**Files:** 创建 src/app/{router.ts,AppShell.tsx}、src/journal/*.tsx、src/ui/*.tsx、src/styles/*.css、tests/journal.test.tsx；修改 src/app/App.tsx、src/main.tsx。

**Interfaces:** 消费 Repository、Snapshot、Preferences；页面 props 为 `{ repo: Repository; space: Space; snapshot: Snapshot; refresh: () => Promise<void> }`。`navigate(path: string): void` 统一写 hash；`useRoute(): string` 订阅 hashchange。路由为 `/record`、`/review`、`/review/journal/:id`、`/review/care/:id`、`/insights`、`/care`、`/ai-example`、`/data`、`/preferences`，未知路由显示返回记录页入口。

- [ ] 用 Testing Library 写保存失败保留文字、重复提交、补记编辑和纯文本显示测试，先运行 `npm test -- tests/journal.test.tsx` 确认失败。夹具评分默认 3、发生日默认 2026-09-20，测试固定当前时间。

```tsx
render(<JournalForm onSave={async () => { throw new Error('保存失败'); }} />);
await user.type(screen.getByLabelText('一句话日记'), '今天有点累');
await user.click(screen.getByRole('radio', { name: '一般', exact: true }));
await user.click(screen.getByRole('checkbox', { name: '疲惫', exact: true }));
await user.click(screen.getByRole('radio', { name: '中等', exact: true }));
await user.click(screen.getByRole('button', { name: '保存记录' }));
expect(screen.getByLabelText('一句话日记')).toHaveValue('今天有点累');
expect(await screen.findByRole('alert')).toHaveTextContent('保存失败');
```

- [ ] 实现 `JournalForm({ initial?: Journal, onSave: (entry: Journal) => Promise<void> })`，一次编辑会话持有稳定 UUID；提交期间禁用保存并用 ref 防止重复调用。校验通过后等待写入，再展示成功入口；onSave 失败保留所有字段。beforeunload 及应用内导航共同保护未保存修改。

```tsx
const submitting = useRef(false);
async function save(entry: Journal) {
  if (submitting.current) return;
  submitting.current = true;
  try { await onSave(entry); setSaved(true); }
  catch (error) { setError(error instanceof Error ? error.message : '保存失败'); }
  finally { submitting.current = false; }
}
```

- [ ] 实现回顾日期分组、情绪/标签组合筛选、详情、确认删除，活动筛选不假装拥有日记的情绪标签。删除后 refresh 并返回列表；不存在的 ID 显示记录不存在。
- [ ] 建立暖白、深灰、蓝绿 CSS tokens；实现桌面导航、手机底部导航、首次选择、空间标识与切换。示例初始化入口接任务 6；当前个人空间完整可用。
- [ ] 为 Radio/Checkbox 添加 fieldset/legend、确认对话框焦点管理、状态播报；验证存储失败、双击保存仅调用一次、编辑后刷新可见、取消删除数据保留。运行目标测试和 build，提交 `feat: add journal and review experience`。

## Task 4: 实现可追溯的本地洞察

**Files:** 创建 src/insights/*.ts、src/insights/*.tsx、tests/analysis.test.ts；修改 App 路由装配。

**Interfaces:** `analyze(snapshot: Snapshot, endDate: string, days: 7 | 30): Analysis`，Analysis 结构如下；输入空间由调用者先过滤，函数不访问数据库。

```ts
export interface Analysis {
  trend: { date: string; mean: number | null; ids: string[] }[];
  events: { tag: EventTag; mean: number; overall: number;
    relation: 'higher' | 'lower' | 'close'; ids: string[]; otherIds: string[] }[];
  feedback: { kind: CareKind; count: number; meanDelta: number;
    improved: number; unchanged: number; declined: number; ids: string[] }[];
}
```

- [ ] 先写 6 条/7 条阈值、标签 2 条/3 条、没有对照记录、两标签不重复计总体、缺失日期、负向活动反馈测试，运行 `npm test -- tests/analysis.test.ts` 确认失败。

```ts
const entries = Array.from({ length: 7 }, (_, i) => journal({
  id: String(i), localDate: '2026-09-20', feeling: i < 3 ? 2 : 4,
  tags: i < 3 ? ['工作任务', '通勤'] : []
}));
const result = analyze({ journals: entries, care: [] }, '2026-09-22', 7);
expect(result.events[0].mean).toBe(2);
expect(result.events[0].overall).toBeCloseTo(22 / 7);
expect(result.trend.at(-1)?.mean).toBeNull();
expect(result.events[0].ids).toEqual(['0', '1', '2']);
```

- [ ] 使用 dateWindow 按 localDate 筛选；活动以 endDate 筛选且仅 completed、前后分数非空参与。计算保存原始均值，UI 一位小数；关系比较以同样一位小数结果为准，显示值一致则 close。

```ts
const paired = snapshot.care.filter(item => item.status === 'completed'
  && item.before !== undefined && item.after !== undefined
  && item.endDate !== undefined && dates.includes(item.endDate));
const delta = (item: CareRecord) => item.after! - item.before!;
```

- [ ] 实现 InsightsPage、TrendChart 和 EvidenceView：SVG 以 null 拆线段、日期按钮打开依据；同时提供数据列表。标签结论固定顺序，呈现样本数、比较基准及关联提示；空态不渲染伪造统计。
- [ ] 增加跨时区不改变已存日期、仅一个有效配对、相近均值舍入、边界第 7 天包含/第 8 天排除测试。浏览器检查依据链接和删除刷新联动，运行目标测试和 build，提交 `feat: explain mood patterns with traceable evidence`。

## Task 5: 实现关怀会话与反馈

**Files:** 创建 src/care/*、tests/care.test.ts、scripts/generate-rain.mjs、public/audio/rain.wav、public/audio/LICENSE.txt、docs/assets.md；修改 App 路由装配。

**Interfaces:** `recommend(emotions: Emotion[]): { kind: CareKind; reason: string } | null`；`Session` 与纯函数见下。CareSession 消费 Repository/Space 并保存 CareRecord，前后评分显式填写，不复制日记评分。

```ts
export interface Session {
  record: CareRecord; durationMs: number; elapsedMs: number; lastTick: number;
}
export type SessionEvent =
  | { type: 'tick' | 'pause' | 'resume' | 'finish' | 'exit' | 'interrupt'; now: number }
  | { type: 'feedback'; score: Score; now: number };
export function transition(session: Session, event: SessionEvent): Session;
```

- [ ] 先测试推荐优先级、无情绪返回 null、暂停时间不累加、完成幂等、中断不产生配对、负向评分可保存，运行 `npm test -- tests/care.test.ts` 确认失败。

```ts
expect(recommend(['疲惫', '焦虑'])?.kind).toBe('breathing');
expect(recommend([])).toBeNull();
const initial: Session = { record: care({ status: 'running', after: undefined }),
  durationMs: 60000, elapsedMs: 0, lastTick: 0 };
const paused = transition(initial, { type: 'pause', now: 1000 });
expect(transition(paused, { type: 'tick', now: 60000 }).elapsedMs).toBe(1000);
const stopped = transition(initial, { type: 'interrupt', now: 1000 });
expect(stopped.record.status).toBe('interrupted');
```

- [ ] 实现 reducer：running 根据时间差累计，pause 停计，resume 更新 lastTick；终态的重复 finish 不写第二条记录。会话启动即持久化稳定 ID；重开应用将持久化 running/paused 改为 interrupted，失败提示并允许重试。保存成功后才导航到结果。
- [ ] 实现 60 秒呼吸提示、3/5 分钟轻量活动和 1/3/5 分钟声音计时。页面不可见时暂停活动/音频并落库，恢复后由用户继续；结束或退出停止音频，取消回调。显式轻量活动“我已完成”可提前结束，其余按有效运行时长完成。
- [ ] 生成原创程序化雨声 WAV，避免外链与版权不明下载；脚本使用固定种子噪声、低通混合和短淡入淡出，16-bit 单声道 PCM，30 秒循环。LICENSE 说明程序化生成、无第三方录音；docs/assets.md 记录生成方式与文件。人工听检循环、音量及可用性，不把生成声音称为实地录音。

```js
let seed = 20260922, filtered = 0;
function sample() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  const white = seed / 4294967296 * 2 - 1;
  filtered = 0.97 * filtered + 0.03 * white;
  return Math.max(-1, Math.min(1, (filtered * 4 + white * 0.12) * 0.35));
}
```

- [ ] AudioPlayer 使用 `${import.meta.env.BASE_URL}audio/rain.wav`，捕获 play Promise 拒绝及 error 事件。支持音量偏好、重试、换活动；减少动态效果时以静态文字展示呼吸阶段。
- [ ] 验证暂停恢复、隐藏页面、刷新中断、连续结束、评分跳过和音频 404。运行目标测试和 build，提交 `feat: add care sessions and honest feedback`。

## Task 6: 装配两周故事与固定 AI 示例

**Files:** 创建 src/demo/*、tests/example.test.ts；修改 App 首次入口和空间初始化。

**Interfaces:** `story: readonly StoryDay[]` 保存相对天数；`seedDemo(now: Date): Snapshot` 映射到截至昨天两周；`aiExample: { observations: { text: string; storyIds: string[] }[]; interpretation: string; question: string }`；`StoryDay = { id: string; day: number; feeling: Score; emotions: Emotion[]; tags: EventTag[]; text: string }`。

- [ ] 写 AI 引用存在、seed 跨月日期、修改副本不改变原始故事、重置不触碰个人空间测试；运行 `npm test -- tests/example.test.ts` 确认失败。

```ts
const original = JSON.stringify(story);
const seeded = seedDemo(new Date('2026-09-22T12:00:00+08:00'));
expect(seeded.journals.map(item => item.localDate)).toContain('2026-09-21');
seeded.journals[0].text = '被修改的示例';
expect(JSON.stringify(story)).toBe(original);
for (const observation of aiExample.observations) {
  expect(observation.storyIds.every(id => story.some(day => day.id === id))).toBe(true);
}
```

- [ ] 编写 14 天固定故事：感受依次为 `[3,2,2,3,4,4,3,2,2,3,4,3,4,4]`；第 2/3/8/9 天记录工作任务，第 5/6/11/13 天记录运动，其余分配通勤、睡眠、人际、个人生活。每条文字与标签和评分相符，不宣称这些值来自真实用户。补充至少三次 completed 反馈：呼吸 2→3、声音 3→3、活动 3→2，展示改善/不变/下降。
- [ ] seedDemo 深拷贝故事，分配合法时间及唯一 ID，强度采用明确固定值；每条原始文字保持“第 N 天”源 ID 供 AI 材料引用。示例只在首次选择时初始化，主动重置须确认；超范围时提示重置而非自动改日期。
- [ ] 固定 AI 内容观察只引用故事中支持的事实，解释使用可能性措辞，给出一个反思问题。页面点击依据读取 story，不查用户编辑后的副本。

```tsx
<p role="note">AI 解读示例 · 预设内容，非实时生成</p>
<p>下面展示虚构日记的预设解读，不会分析或发送你的日记。</p>
```

- [ ] 个人空间 AI 入口文字固定“查看 AI 解读示例”；无假生成加载。测试删除全部示例副本后 AI 依据仍存在、长期未访问仅提示、个人记录保持。运行目标测试和 build，提交 `feat: add isolated demo story and labeled AI example`。

## Task 7: 备份、恢复与偏好

**Files:** 创建 src/storage/backup.ts、src/settings/*.tsx、tests/backup.test.ts；修改 App 路由装配。

**Interfaces:** `Backup = { version: 1; exportedAt: string; journals: Journal[]; care: CareRecord[] }`；`encodeBackup(snapshot: Snapshot, now: Date): string`；`decodeBackup(text: string, now: Date): Snapshot`。decode 拒绝超过 `10 * 1024 * 1024` UTF-8 字节的输入，UI 在 File.text 前先检查 File.size。

- [ ] 写 round-trip、未知版本、重复 ID、错误评分、5001 字文本、孤立引用、非完成却有 after 的非法活动和超限文件测试；运行 `npm test -- tests/backup.test.ts` 确认失败。

```ts
const snapshot: Snapshot = { journals: [journal()], care: [] };
const now = new Date('2026-09-22T12:00:00Z');
expect(decodeBackup(encodeBackup(snapshot, now), now)).toEqual(snapshot);
const duplicate = { version: 1, exportedAt: now.toISOString(),
  journals: [journal(), journal()], care: [] };
expect(() => decodeBackup(JSON.stringify(duplicate), now)).toThrow();
```

- [ ] 实现严格解析：检查顶层版本、数组、每个对象、ID 集合与 journalId；完成活动必须具备结束时间和结束日期，结束不能早于开始或晚于 now；before/after 可缺省。返回新构造对象，丢弃未识别字段，不使用不可信对象合并配置。
- [ ] DataPage 读取且只读取 personal。导出用户主动触发 Blob 下载并释放 object URL；导入展示两类数量、替换提示、取消/确认操作；确认前不写任何数据，确认调用 repo.replace('personal', snapshot)。事务失败保留旧数据及错误提示。

```ts
const preview = decodeBackup(await file.text(), new Date());
// preview 存组件状态；只有确认按钮执行：
await repo.replace('personal', preview);
await refresh();
```

- [ ] 实现清空二次确认、数据位置和非加密备份提示；PreferencesPage 保存减少动态效果、音量、范围。首次 reduceMotion 取系统偏好，用户可选择更少动画，但不能强制覆盖系统减少动态效果为更多动画。
- [ ] 验证取消导入/清空无修改，读取错误文件无修改，事务 abort 后旧数据仍存在，demo 不变。运行目标测试和 build，提交 `feat: add safe local backup and data controls`。

## Task 8: 完整验收与 Pages 发布

**Files:** 创建 playwright.config.ts、tests/e2e/flows.spec.ts、.github/workflows/deploy.yml、README.md、docs/verification.md；修改 vite.config.ts、package.json（若需预览测试脚本）。

**Interfaces:** 消费全部产品路由与持久化接口，不暴露测试 API。Vite base 从环境变量 `PAGES_BASE_PATH` 读取，默认 `/`；CI 根据真实仓库名生成项目路径，owner.github.io 仓库使用根路径。自定义域名如实际存在则使用根路径并记录配置。

- [ ] 编写 Playwright 用户闭环测试：首次进入个人空间→填写日记→刷新→洞察依据→关怀反馈→回顾；另一场景覆盖示例切换、AI 说明、导出和恢复。测试时钟推进计时，不在生产增加“跳过测试”按钮。

```ts
test('personal journal survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '开始我的记录' }).click();
  await page.getByRole('radio', { name: '一般', exact: true }).check();
  await page.getByRole('checkbox', { name: '疲惫', exact: true }).check();
  await page.getByRole('radio', { name: '中等', exact: true }).check();
  await page.getByLabel('一句话日记').fill('验收记录');
  await page.getByRole('button', { name: '保存记录' }).click();
  await expect(page.getByText('记录已保存', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: '回顾', exact: true }).click();
  await expect(page.getByText('验收记录', { exact: true })).toBeVisible();
});
```

- [ ] 运行 `npm test`、`npm run build`、`npm run test:e2e`，修复真实失败。浏览器检查 360px、768px、1440px、键盘导航和减少动态效果；保存截图及发现到 docs/verification.md，避免提交个人输入。确认无控制台错误、无 AI/遥测网络请求，图表文字列表可用。
- [ ] 核验子路径构建与预览，刷新 hash 详情以及音频路径。音频主动播放后请求成功；模拟 404 显示重试/换活动。不要只以资源存在推断可播放。

```ts
// vite.config.ts 的 base 配置
base: process.env.PAGES_BASE_PATH ?? '/'
```

- [ ] 写部署工作流：main push 和 workflow_dispatch 触发；checkout→设置兼容 Node→npm ci→npm test→npm run build→上传 dist→deploy Pages。采用执行时官方文档确认的 action 版本，最小权限 `contents: read`、`pages: write`、`id-token: write`，deployment environment 为 github-pages，并设 Pages 并发组避免竞争。不在构建中读取个人 IndexedDB，也不加入密钥。
- [ ] README 写明启动/测试/构建命令、四页能力、AI 预设边界、数据本地保存、导入覆盖行为和部署方法；docs/verification.md 分别记录本地测试、构建、浏览器、远端发布证据。
- [ ] 检查 `git remote -v` 和 GitHub CLI 登录状态以确定仓库。已有明确目标时按用户发布授权执行；没有目标仓库时完成全部本地工作和工作流后，只询问 GitHub 仓库归属与名称，不猜测或创建到任意账户。缺少登录时提示用户登录，不索取 token。
- [ ] 完成所选执行技能要求的整体验证/审查，修复影响范围内的问题并针对变更重测。提交 `feat: verify and prepare GitHub Pages release`，随后推送并观察 Actions 结果。
- [ ] 访问工作流返回的真实 Pages URL，验证首次入口、示例洞察、个人保存/刷新、hash 详情和音频。记录 workflow URL、commit、实际站点 URL 与验证日期。发布未完成时明确写“本地完成，发布待完成”，不得宣称上线。

## 计划自检与交付门槛

设计 1–3 节对应任务 3、6；第 4 节对应任务 1–3；第 5 节对应任务 4；第 6 节对应任务 5；第 7 节对应任务 6；第 8 节对应任务 2、7；第 9–11 节对应任务 8，相关异常测试同时归属各任务。

本计划只有文档，不包含已实现功能、测试通过或已部署的声明。实施开始前需用户审阅本计划并选择当前会话执行或子代理逐项执行。推荐当前会话执行：共享领域类型、空间隔离与页面数据刷新紧密关联，连续实现更容易保持一致，结束时再进行独立整体审查。
