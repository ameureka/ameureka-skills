---
name: ameureka-spec-dev
description: |
  基于 Kiro Specs + FPF 的规范驱动功能开发完整流程。
  通过 7 阶段流程将用户需求转化为高质量、可追溯的功能实现：
  Discovery → Requirements → Design → Tasks → FPF Review → Implementation → Verification
  使用场景：
  (1) 需要规范驱动的功能开发
  (2) 用户说 "spec-driven"、"规范驱动"、"kiro specs"、"写需求文档"
  (3) 从需求矩阵（requirements/）批量生成 specs
  (4) 用户说 "从需求文档生成specs"、"requirements to specs"、"批量生成kiro specs"
---

# 规范驱动功能开发 (Spec-Driven Development)

## Quick Reference

**一句话说明**: 通过 7 阶段规范驱动流程，将用户需求转化为高质量、可追溯的功能实现

**核心流程**:
```
Discovery → Requirements → Design → Tasks → FPF Review → Implementation → Verification
   (1)         (2)          (3)      (4)       (5)           (6)            (7)
```

**关键文件（两种模式）**:
- 默认模式（5 文件）:
  - `00-discovery.md` - 需求发现
  - `01-requirements.md` - 需求规范 (EARS)
  - `02-design.md` - 技术设计 (Properties)
  - `03-tasks.md` - 任务清单（尾部含收口记录）
  - `04-fpf-review.md` - FPF 审查
- 矩阵模式（4 文件，01-04）: `00-discovery.md` 默认跳过，由上游需求文档替代 Discovery

**输出路径（两种模式）**:
- 默认模式: `.specs/{feature-name}/`
- 需求矩阵模式: `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/`（如 `requirements-specs/40-frontend/UI-001-dashboard-cleanup/`）

**质量标准**:
- R_eff 机械规则: R_eff = min(D1..D5)，禁止任何手工上调/下调；≥0.95 直接实施 / 0.90-0.94 小幅修正后实施 / 0.80-0.89 不可实施（修正后重审）/ <0.80 重新设计
- 收口记录状态判定五态词汇（固定拼写）: `PASS` / `PARTIAL→已修复→PASS` / `FAIL→已修复` / `spec-premise-stale` / `deferred-non-blocking`
- 需求覆盖率 100%；双向追溯完整

**语言约定**: 正文中文；EARS/FPF/模板结构关键字保英文（SHALL/WHEN/Q0-Q5/Validates）

**快速检查**:
- [ ] 所有需求使用 EARS 模式
- [ ] 所有正确性属性可测试
- [ ] FPF 审查 R_eff ≥ 0.90
- [ ] 每个任务追溯到需求

## Standard Workflow

### Phase 1: 需求发现 (00-discovery.md)

**目标**: 理解用户意图，收集背景信息，建立术语表（矩阵模式下本阶段默认跳过，需求文档即 Discovery）

**步骤**:
1. 与用户对话，理解功能目标
2. 分析现有代码库相关部分
3. 识别技术约束和依赖，记录项目验证 battery
4. 建立术语表 (Glossary)
5. 输出 `00-discovery.md`

**输出检查**:
- [ ] 功能目标清晰
- [ ] 技术约束已识别，验证 battery 已记录
- [ ] 术语表完整

详见 [operations/phase1-discovery.md](./operations/phase1-discovery.md)

---

### Phase 2: 需求规范 (01-requirements.md)

**目标**: 使用 EARS 模式编写精确、可测试的需求

**EARS 模式**:
| 类型 | 模式 | 示例 |
|------|------|------|
| 普遍型 | THE [system] SHALL [action] | THE I18nModule SHALL recognize 'zh' |
| 事件驱动型 | WHEN [trigger], THE [system] SHALL [action] | WHEN user selects Chinese, THE UI SHALL update |
| 条件型 | IF [condition], THEN THE [system] SHALL [action] | IF translation missing, THEN fallback to English |

**INCOSE 合规性**:
- 主动语态
- 单一思想
- 明确条件
- 定义术语
- 一致术语

**输出检查**:
- [ ] 所有需求使用 EARS 模式
- [ ] 符合 INCOSE 标准
- [ ] 每个需求可测试

详见 [operations/phase2-requirements.md](./operations/phase2-requirements.md)

---

### Phase 3: 技术设计 (02-design.md)

**目标**: 设计架构，定义可测试的正确性属性

**正确性属性格式**:
```
**Property N: [属性名称]**

*For any* [输入/条件], [系统] SHALL [行为/输出].

**Validates: Requirements X.Y, X.Z**
```

**Prework Analysis**:
对每个需求进行分析：
- Thoughts: 如何验证？
- Testable: yes/no - property/example

**输出检查**:
- [ ] 架构图清晰
- [ ] 每个属性可测试
- [ ] 属性覆盖所有需求

详见 [operations/phase3-design.md](./operations/phase3-design.md)

---

### Phase 4: 任务清单 (03-tasks.md)

**目标**: 将设计分解为可执行的任务，建立追溯矩阵

**任务格式**:
```markdown
### Task X.Y: [任务名称]

**Description**: [具体描述]

**Acceptance Criteria**:
- [ ] AC1
- [ ] AC2

**Validates**: Req X.Y, Property Z
```

**追溯矩阵**:
| Requirement | Design Property | Task | Test |
|-------------|-----------------|------|------|
| Req 1.1 | Property 1 | Task 1.1 | test_xxx |

**输出检查**:
- [ ] 任务粒度适中 (2-4小时)
- [ ] 追溯矩阵完整
- [ ] 无遗漏需求

详见 [operations/phase4-tasks.md](./operations/phase4-tasks.md)

---

### Phase 5: FPF 审查 (04-fpf-review.md)

**目标**: 使用第一性原理框架验证文档质量，确保 R_eff ≥ 0.90

**6 阶段审查**:

| 阶段 | 名称 | 目标 |
|------|------|------|
| Q0 | Init | 定义审查范围和维度 |
| Q1 | Hypothesize | 建立质量假设 |
| Q2 | Verify | 逐项验证 |
| Q3 | Validate | 交叉验证一致性 |
| Q4 | Audit | 识别风险和改进点 |
| Q5 | Decide | 计算 R_eff，决策 |

**R_eff 计算 (WLNK 原则)**:
```
R_eff = min(D1, D2, D3, D4, D5)

维度:
- D1: 需求完整性
- D2: 设计覆盖率
- D3: 任务追溯性
- D4: 术语一致性
- D5: 可测试性
```

**决策标准（机械规则，禁止任何手工上调/下调）**:
- R_eff ≥ 0.95: 直接实施
- R_eff 0.90-0.94: 小幅修正后实施
- R_eff 0.80-0.89: 不可实施（修正后重审）
- R_eff < 0.80: 重新设计
- 反通胀: 全维 1.00 触发复核而非默认接受

**审查者要求**: FPF 审查者必须 fresh-context（非作者自评）；可数断言（"共 N 处/N 个文件"）必须实际执行 `grep -c` 核数，不得目测。

**输出检查**:
- [ ] 6 阶段审查完成
- [ ] R_eff ≥ 0.90（机械 min，未手调）
- [ ] 改进项已修正

详见 [operations/phase5-fpf-review.md](./operations/phase5-fpf-review.md)

---

### Phase 6: 迭代实施

**目标**: 按任务清单实施，保持追溯性

**步骤**:
0. 前提复核（Step 6.0，批量实施必做）: 实施前对 01/02/03 中 file:line 锚点、key 名、数量断言 grep/Read 重验 against 当前 HEAD
1. 按优先级选择任务
2. 实施代码变更
3. 编写/更新测试
4. 验证 Acceptance Criteria
5. 标记任务完成
6. 重复直到所有任务完成
7. 写收口记录到 03-tasks.md 尾部（**无收口记录 = 未收口**）

**输出检查**:
- [ ] 所有任务完成
- [ ] 测试通过
- [ ] 代码已提交（核对 `git diff --cached --stat` vs 触碰文件清单）
- [ ] 收口记录已写入

详见 [operations/phase6-implementation.md](./operations/phase6-implementation.md)

---

### Phase 7: 验证回归

**目标**: 全面验证功能，确保无回归

**验证类型**:
1. **单元测试**: 属性测试覆盖
2. **集成测试**: 组件交互
3. **回归测试**: 现有功能不受影响（执行 Discovery 记录的项目验证 battery）
4. **对抗验证**: 独立验证者（非实施者）不读实施自报告，逐 AC 重新执行验证命令、独立重推事实，产出 per-spec verdict: `PASS`/`PARTIAL`/`FAIL` + issues[]
5. **手动验证**: 用户场景

**输出检查**:
- [ ] 所有测试通过
- [ ] 对抗验证 verdict 闭环（FAIL/PARTIAL 已修复→复验）
- [ ] 无回归问题
- [ ] 验收记录已归档

详见 [operations/phase7-verification.md](./operations/phase7-verification.md)

---

## Common Scenarios

### 场景 1: 新功能开发

**背景**: 从零开始开发新功能

**流程**: Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 (完整流程)

### 场景 2: 功能增强

**背景**: 在现有功能基础上增加能力

**流程**:
1. Phase 1 (聚焦增量)
2. Phase 2-4 (增量需求/设计/任务)
3. Phase 5 (审查增量部分)
4. Phase 6-7 (实施验证)

### 场景 3: Bug 修复

**背景**: 修复已知问题

**流程**:
1. Phase 1 (问题分析)
2. Phase 4 (直接任务)
3. Phase 6-7 (修复验证)

### 场景 4: 重构

**背景**: 改善代码结构，不改变行为

**流程**:
1. Phase 1 (识别重构范围)
2. Phase 3 (设计新结构)
3. Phase 4 (重构任务)
4. Phase 6-7 (实施验证，确保行为不变)

### 场景 5: 从需求矩阵批量生成 Specs

**背景**: 已通过 `/requirements-matrix-generator` 生成 `requirements/` 需求矩阵

**输入**: `requirements/` 中的单个需求文档（如 `UI-001-Dashboard模板残留清理.md`）

**流程**:
1. Phase 1 (`00-discovery.md` **默认跳过**——需求文档即 Discovery；仅当需求文档缺约束/术语时补 discovery-lite)
2. Phase 2-4 (生成 requirements → design → tasks，共 4 文件 01-04)
3. Phase 5 (FPF 审查)

**输出路径**: `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/`

**注意**: 每个需求文档独立生成一套 specs，按优先级顺序（P0 → P3）与依赖序排列；批量生成与波次实施见下方「批量模式（Batch Mode）」。

---

## 批量模式（Batch Mode）

> 适用: 一个批次内生成/实施多套 specs（典型: 需求矩阵下游）。详细操作见 [operations/phase6-implementation.md](./operations/phase6-implementation.md) 与 [operations/phase7-verification.md](./operations/phase7-verification.md)。

### 批量授权模式

默认: 各确认门照旧（交互式）。当用户给出明确常设授权（goal / "依次实施不要停止，自行做最优选择"类指令）时，逐 spec/逐阶段确认门由以下替代物满足:

- (a) 批次级一次性授权记录（记入 INDEX 或批次文档）
- (b) 每波全量回归门（tsc + 全量测试 + 生产 build）绿后才 commit
- (c) 每 spec 收口记录（五态状态判定 + 偏差清单 + 验证证据）
- (d) 批次终报（执行结果 + 落地结论）

映射确认降级为"输出映射表供事后审查"。**不可逆/对外动作（生产部署、删数据、对外发布）不在默认授权范围**，仍须逐次确认，除非授权明确覆盖。

### 批量生成

- 一轮生成多套 specs 时按依赖序排列（P0 → P3；被依赖的结构性 spec 先行）
- 全部 specs 对同一代码快照编写 → 早波落地会使晚波前提失效，必须靠实施期前提复核（Step 6.0）兜底

### 波次实施循环

每波固定循环: **实施 → 对抗验证 → 修复 → 全量回归 → commit → 前提复核**

- **实施**: 按依赖序执行本波 specs 的任务清单
- **对抗验证**: 独立验证者（新 subagent/新会话，**非实施者**）不读实施自报告，逐 AC 重新执行验证命令、独立重推事实（grep/build/curl/DB），产出 per-spec verdict: `PASS`/`PARTIAL`/`FAIL` + issues[]（file / description / suggestedFix）
- **修复**: FAIL/PARTIAL 进入修复→复验循环，闭环后才写收口记录
- **全量回归**: tsc + 全量测试 + 全量生产 build 集成门，全绿后才 commit
- **commit**: 核对 `git diff --cached --stat` vs 触碰文件清单
- **前提复核**: 下一波实施前，对 01/02/03 中每个 file:line 锚点、key 名、数量断言 grep/Read 重验 against 当前 HEAD；琐碎锚点漂移就地更新继续；结构性取代 → **禁止机械实施**，收口记录判 `spec-premise-stale` 并引用取代方设计决策

每个 spec 收口时写收口记录到 03-tasks.md 尾部；**无收口记录 = 未收口**，批量下漏写收口记录的 spec 视为未闭环。

### 共享资源冲突规划

- INDEX 维护热点表: 文件 → 触碰它的需求 ID 列表（静态可预判）
- 热点文件用**合并者模式**: 实施 agents 只申报结构化变更（set/delete + 值），单一 consolidator 统一应用+校验
- 并行 agent 按文件不相交分组，落在主工作树（worktree 隔离会搁浅改动）
- 每批一次**全量生产 build 集成门**（跨 spec 组合缺口只有全量 build 才撞得出来）
- 同名脚本/资源命名冲突要有归属裁决

### Workflow 编排（推荐执行载体，008 实证）

批量实施优先用 **Workflow 编排**而非逐个 Agent 手工调度——更可控、断点可续、验证与实施天然隔离。008 实证配方（4 波、12 spec 全终态）:

- **一波一个 Workflow**：每波用一个独立 Workflow 编排（008 = 4 波 = 4 个 Workflow）
- **波内结构固定三段**：串行 spec 实施（依赖序）→ **每件 3 镜头独立对抗验证（parallel）** → 修复。3 镜头 = 同一 spec 派 3 个独立验证 agent 从不同证据面（源码 grep / build-or-runtime / DB-or-CI 执行证据）各自重推，互不读对方与实施者的自报告
- **验证 parallel、实施 serial**：实施串行避免共享文件竞争；验证并行提速且天然多视角
- **Workflow > 逐 Agent** 的收益：断点续跑（会话中断后 resume）、验证/实施实例隔离由编排层保证（比手工记"谁验过谁"可靠）、每波回归门+commit 由编排层强制

> ⚠️ **Workflow resume 缓存陷阱（008 实锤）**：Workflow 的 resume 按调用序前缀失效——中途改了输入无法精准从断点续。断点续跑时用**结果内嵌手工续跑**（把已完成波的结果作为上下文喂给续跑），而非盲目 resume。

### 运行中的工作流绝不干预（硬纪律，008 实锤）

**`TaskList 空 ≠ 工作流死`。** 008 主线程误判某 Workflow 的 TaskList 空 = CODE-002 agent 已死，抢先提交"恢复" commit，与仍在跑的工作流竞速，**捕获了工作流的变异注入中间态 → 提交假绿**。

- 确认工作流**真结束**（收到完成通知 / 编排层显式终态）再动工作树，禁止凭 TaskList/进度快照推断死活
- 幸而对抗验证是独立 agent：工作流自己的验证 agent 独立抓获并 supersede 修复了主线程的假绿（`5ce67e71`）——**印证"验证者≠作者"铁律**，也印证不干预纪律的必要
- 若必须并发跑第二个 loop/workflow，各自 worktree 隔离，绝不共享工作树

### 撞限先盘磁盘（disk-recovery，008 黄金纪律）

agent 死于 commit 前（auth 瞬时掉线 / 会话或周配额硬上限 / 5h 限额），**常已写完文件只丢返回值**。任何中断恢复前，第一动作是**盘磁盘**（`git status` / `git diff` / 读目标文件），把已落盘的成果救回，而非重做。

- 008 实证零重做救回：UI-003 Task0 基线、CODE-002 守护测试、UI-008 llms.txt + 48 处日期——全从磁盘捞回
- 恢复顺序：盘磁盘 → 已落盘的直接接续（补 commit / 补收口）→ 仅真缺失的部分重做
- 我方缩小被扫窗口：**edit→即时 commit**（尤其并发场景，减少未提交编辑被破坏性 git 丢弃的暴露）

### solo 降级证伪（subagent 不可用时）

subagent 不可用（周配额毙 / 环境限制）时，主线程 solo 降级：**主线程兼任证伪者 + 亲跑变异门**，但必须诚实标注:

- 收口记录标注**「solo 降级」**，禁止把自我复核当作独立验证背书
- 亲跑而非跳过：solo 下仍要真跑变异矩阵、真取执行证据（不因降级而放低核销标准）
- 条件允许时补一个 fresh-context 探针 agent 做最小独立交叉（008 曾发单个 ALIVE 探针确认 auth 恢复后再 resume）

### deferred-non-blocking 上限（防退出后门）

blocked-env 子项（环境不允许当期完成，如 008 DEP-001 需 workflow-scope push 权限、UI-006 tool-loop 需真实 key）判 `deferred-non-blocking` + **写明触发器**，但:

- **数量设硬上限（≤4）**：deferred 是诚实降级，不是"提前退出后门"。超过上限说明范围判断或环境准备有系统性问题，须回查而非继续 defer
- 每个 deferred 必带**可观测触发器**（什么信号出现时重启该项）+ 登记去处（INDEX 开放项 / 决策台账），禁留模糊时间欠账（"以后再看"）

---

## Critical Rules

### ✅ ALWAYS

1. **ALWAYS 在 Phase 2 使用 EARS 模式编写需求**
   - 原因: 确保需求精确、可测试
   - 验证: 每个需求包含 SHALL 关键字

2. **ALWAYS 在 Phase 3 定义可测试的正确性属性**
   - 原因: 属性是验证的基础
   - 验证: 每个属性有对应的测试方法

3. **ALWAYS 在 Phase 5 执行 FPF 审查**
   - 原因: 确保文档质量，避免实施阶段返工
   - 验证: R_eff ≥ 0.90

4. **ALWAYS 确保每个任务追溯到需求**
   - 原因: 保证实施完整性
   - 验证: 追溯矩阵无空白

5. **ALWAYS 在实施前获得用户确认**
   - 原因: 确保理解一致，避免方向错误
   - 验证: 用户明确批准进入 Phase 6
   - 例外: 用户给出批次级常设授权时，确认门由「批量模式（Batch Mode）」的替代物满足

6. **ALWAYS 在批量实施中做前提复核（Step 6.0）**
   - 原因: specs 对同一快照编写，早波落地会使晚波锚点失效
   - 验证: 锚点/key/数量断言已 grep 重验 against 当前 HEAD；结构性取代判 `spec-premise-stale`

7. **ALWAYS 在实施闭环时写收口记录**
   - 原因: **无收口记录 = 未收口**，实施真相会失传
   - 验证: 03-tasks.md 尾部含五态状态判定 + 偏差清单 + 验证证据

8. **ALWAYS 用对抗验证核销实施**
   - 原因: 实施者自报 + 测试全绿仍会漏真实缺陷
   - 验证: 独立验证者（非实施者）逐 AC 重验，verdict 闭环

9. **ALWAYS 对引用的代码事实标注核对日期（runtime > canon）**
   - 原因: 文档断言会漂移于运行时真相，双向翻车都发生过
   - 验证: 每个 file:line 锚点/关键断言附验证方式 + 核对日期

10. **ALWAYS 确认工作流真结束再动工作树（运行中不干预）**
    - 原因: `TaskList 空 ≠ 工作流死`；抢先"恢复"会与运行中工作流竞速，捕获变异注入中间态提交假绿（008 CODE-002 实锤）
    - 验证: 凭完成通知/编排层显式终态判死活，禁凭进度快照推断

11. **ALWAYS 撞限先盘磁盘再恢复（disk-recovery）**
    - 原因: agent 死于 commit 前（auth 掉线/配额/限额）常已写完文件只丢返回值
    - 验证: 中断恢复第一动作 `git status`/`git diff`/读目标文件；已落盘的直接接续，仅真缺失部分重做（008 三例零重做救回）

### ❌ NEVER

1. **NEVER 跳过 FPF 审查直接实施**
   - 原因: 可能导致大量返工
   - 后果: 实施方向错误，浪费时间

2. **NEVER 使用模糊词汇**
   - 禁止: 可能、通常、大概、应该能
   - 替代: 必须、SHALL、具体数值

3. **NEVER 在 R_eff < 0.90 时开始实施**
   - 原因: 文档质量不足
   - 替代: 修正后重新审查

4. **NEVER 创建无追溯的任务**
   - 原因: 无法验证完整性
   - 替代: 每个任务必须关联需求

5. **NEVER 跳过用户确认直接实施**
   - 原因: 可能理解偏差
   - 替代: 等待用户明确批准；批次级常设授权场景按「批量模式（Batch Mode）」执行

6. **NEVER 手工调整 R_eff**
   - 原因: R_eff = min(D1..D5) 是机械规则，上调/下调两个方向都发生过实锤翻车
   - 替代: 分数不达门就修文档重审，不改分数

7. **NEVER 以"文件存在"核销自动化交付物**
   - 原因: CI workflow/cron/脚本可能从未执行过一次（"文件名+行数"核销全部落空）
   - 替代: 以执行证据核销（至少一次真实运行记录）

8. **NEVER pin 观察值做守门测试期望**
   - 原因: pin 观察值会把现存 bug 冻结成合同
   - 替代: 期望值派生自 SSOT/运行时规则源

9. **NEVER 在 solo 降级时把自我复核当独立验证背书**
   - 原因: 实施者验证自己的工作有系统性盲区，自我背书 = 假独立验证
   - 替代: 收口记录显式标注「solo 降级」，仍亲跑变异门/取执行证据；条件允许补 fresh-context 探针交叉

10. **NEVER 用 deferred-non-blocking 当提前退出后门**
    - 原因: deferred 是诚实降级，不是逃避实施；数量失控会把"没做完"粉饰成"已收口"
    - 替代: deferred 数量设硬上限（≤4），每个必带可观测触发器 + 登记去处；超限须回查根因

---

## Verification Checklist

### Phase 1-4 文档完成检查

- [ ] **00-discovery.md 存在且完整**（矩阵模式默认跳过本文件，由需求文档替代）
  - 功能目标明确
  - 术语表完整
  - 技术约束已识别（含项目验证 battery 记录）

- [ ] **01-requirements.md 存在且完整**
  - 所有需求使用 EARS 模式
  - 符合 INCOSE 标准
  - 每个需求有唯一 ID

- [ ] **02-design.md 存在且完整**
  - 架构图清晰
  - 正确性属性可测试
  - Prework Analysis 完成

- [ ] **03-tasks.md 存在且完整**
  - 任务粒度适中
  - 追溯矩阵完整
  - 无遗漏需求

### Phase 5 FPF 审查检查

- [ ] **Q0-Q5 六阶段完成**
  - 每个阶段有明确输出

- [ ] **R_eff 计算正确**
  - 使用 WLNK 原则 (取最小值)
  - R_eff ≥ 0.90

- [ ] **改进项已修正**
  - 所有 Audit 发现已处理
  - 文档已更新

### 实施前最终确认

- [ ] **用户已审阅所有文档**

- [ ] **用户已批准进入实施阶段**

- [ ] **实施环境已准备**
  - 分支已创建
  - 依赖已安装

---

## Reference Commands

### 初始化 Spec 目录

```bash
# 输出路径按模式二选一
SPEC_DIR=.specs/{feature-name}                              # 默认模式
SPEC_DIR=requirements-specs/{NN-layer}/{PREFIX-NNN-slug}    # 需求矩阵模式

mkdir -p "$SPEC_DIR"

# 从模板逐文件创建（注意重命名: *.template.md → *.md）
# 指向本 skill 自带的 templates/ 目录。按你的安装方式二选一：
#   · 从本仓库使用时：SKILL_DIR=skills/ameureka-spec-dev
#   · 已安装到 ~/.ai-config/skills/（或做了 symlink）时：SKILL_DIR=~/.ai-config/skills/ameureka-spec-dev
SKILL_DIR=skills/ameureka-spec-dev
cp "$SKILL_DIR/templates/00-discovery.template.md"    "$SPEC_DIR/00-discovery.md"   # 矩阵模式默认跳过此文件
cp "$SKILL_DIR/templates/01-requirements.template.md" "$SPEC_DIR/01-requirements.md"
cp "$SKILL_DIR/templates/02-design.template.md"       "$SPEC_DIR/02-design.md"
cp "$SKILL_DIR/templates/03-tasks.template.md"        "$SPEC_DIR/03-tasks.md"
cp "$SKILL_DIR/templates/04-fpf-review.template.md"   "$SPEC_DIR/04-fpf-review.md"
```

### 文档验证

```bash
# 检查 EARS 关键字
grep -c "SHALL" "$SPEC_DIR/01-requirements.md"

# 检查属性定义
grep -c "Property" "$SPEC_DIR/02-design.md"

# 检查任务追溯
grep -c "Validates:" "$SPEC_DIR/03-tasks.md"
```

### 功能验证

不硬编码 npm/pnpm 等命令: 使用项目声明的包管理器，执行 **Discovery 记录的项目验证 battery**（来源为项目已晋升的验证规则，本工作区见 `.claude/rules/testing.md` 等）。

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/{feature-name}

# 提交 spec 文档（$SPEC_DIR 见上方双模式定义：.specs/{feature-name}/ 或 requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/）
git add "$SPEC_DIR"
git commit -m "docs: add spec for {feature-name}"

# 提交实施代码
git add .
git commit -m "feat: implement {feature-name}"
```

---

## Related Skills

- `/requirements-matrix-generator` - 上游配套: 将审计/差距分析转化为技术分层需求矩阵，本 Skill 的矩阵模式消费其输出
- `/code-review` - 代码审查

---

## Additional Resources

> 以下为参考性链接，可能失效。

- [EARS 需求模式](https://www.iaria.org/conferences2015/filesICCGI15/EARS_Tutorial.pdf)
- [INCOSE 需求标准](https://www.incose.org/docs/default-source/working-groups/requirements-wg/rwg_products/incose_rwg_gtwr_summary_sheet_2017-1130.pdf)
- [Property-Based Testing](https://hypothesis.readthedocs.io/)
- [Kiro Specs 方法论](https://kiro.dev)

---

## Changelog

### v2.1 (2026-07-08) — 008 端到端实施验证

首次用本 skill **端到端生成 + 实施 12 套 specs**（008 docs 专项，12/12 全终态）后回填的实战教训。追加式，不重写 v2.0。

- 批量模式（Batch Mode）新增 5 个子章节:
  - **Workflow 编排（推荐执行载体）**: 一波一 Workflow、波内三段（串行实施 → 每件 3 镜头独立对抗验证 parallel → 修复）、Workflow>逐 Agent 的收益；补 Workflow resume 缓存陷阱（按调用序前缀失效→结果内嵌手工续跑）
  - **运行中的工作流绝不干预（硬纪律）**: `TaskList 空 ≠ 工作流死`；008 CODE-002 实锤——主线程误判抢先提交假绿，被工作流自身验证 agent 独立抓获 supersede 修复（`5ce67e71`），印证"验证者≠作者"
  - **撞限先盘磁盘（disk-recovery）**: agent 死于 commit 前常已写完文件只丢返回值（UI-003 Task0 / CODE-002 / UI-008 三例零重做救回）；edit→即时 commit 缩小被扫窗口
  - **solo 降级证伪**: subagent 不可用时主线程兼证伪者 + 亲跑变异门，收口标注降级，禁自我背书
  - **deferred-non-blocking 上限**: 数量硬上限（≤4）防退出后门；每个必带可观测触发器 + 登记去处（008 DEP-001 需 workflow-scope push、UI-006 需真 key 均判 deferred）
- Critical Rules 新增: ALWAYS 确认工作流真结束再动工作树 / ALWAYS 撞限先盘磁盘再恢复 / NEVER solo 时自我背书当独立验证 / NEVER 用 deferred 当提前退出后门
- Phase 7 补 008 实锤: 3 镜头并行对抗验证抓假绿、workflow-orchestrated 验证独立性
- Phase 6 补 008 实锤: disk-recovery 恢复顺序、生成期独立复核抓 10+ 需求勘误（CODE-001 domain-only 防打断 Claude Code、UI-004 ACC-18 文档对代码注释过期）

### v2.0 (2026-07-06)
- 蒸馏来源: 007/004/006/003/002/105 批次收口记录 + 记忆层，共挖掘 92 条 lessons
- Quick Reference 改双模式文件清单（默认 5 文件 / 矩阵 4 文件）与双模式输出路径；补收口记录五态词汇与 R_eff 机械规则一行；补语言约定
- 新增一级章节「批量模式（Batch Mode）」: 批量授权模式、批量生成依赖序、波次实施循环（实施→对抗验证→修复→全量回归→commit→前提复核）、共享资源冲突规划
- Critical Rules 新增: 前提复核（Step 6.0）、收口记录、对抗验证、runtime>canon 核对日期；NEVER 手工调整 R_eff / 以"文件存在"核销自动化交付物 / pin 观察值做守门期望；用户确认门加批量授权 carve-out
- Phase 5 决策标准修正: 0.80-0.89 一律「不可实施（修正后重审）」；补反通胀与 fresh-context 审查者要求
- Phase 6/7 摘要补前提复核、收口记录终步与对抗验证；场景 5 明确矩阵模式默认跳过 00-discovery
- Reference Commands 修复: 双模式路径、逐文件 cp 带重命名、`_skills/` 技能路径、验证 battery 去硬编码
- Related Skills: 移除 /version-bump、/changelog-update，新增 /requirements-matrix-generator（上游配套）；外部链接标注可能失效

### v1.0.0 (2024-12-31)
- 初始版本
- 7 阶段完整流程
- FPF 审查内嵌
- 完整模板文件
