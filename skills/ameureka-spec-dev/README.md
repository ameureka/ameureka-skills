# ameureka-spec-dev

规范驱动开发 skill：把模糊需求变成可机械核销、双向可追溯的规范文档（EARS 需求 → 正确性属性 → 任务 → 测试），并用 FPF 审查与独立对抗验证把守实施前后两道门。

## 触发场景

SKILL.md frontmatter 的 `description` 中列出的四类使用场景（原样列出）：

- `spec-driven`、`规范驱动`、`kiro specs`、`写需求文档`（场景 2）
- `从需求文档生成specs`、`requirements to specs`、`批量生成kiro specs`（场景 4）
- 需要规范驱动的功能开发（场景 1）
- 从需求矩阵（`requirements/`）批量生成 specs（场景 3）

> 注：SKILL.md frontmatter 只有 `name` + `description`，没有独立的关键词字段；上述文字出自 `description` 的使用场景列举。

典型使用场景（SKILL.md「Common Scenarios」列出的 5 个）：

| 场景 | SKILL.md 原文流程 | 相对完整流程的差异 |
| --- | --- | --- |
| 场景 1 新功能 | Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 | 完整流程 |
| 场景 2 功能增强 | Phase 1（聚焦增量）→ Phase 2-4（增量需求/设计/任务）→ Phase 5（审查增量部分）→ Phase 6-7 | Phase 5 只审增量 |
| 场景 3 Bug 修复 | Phase 1（问题分析）→ Phase 4（直接任务）→ Phase 6-7（修复验证） | **跳过 Phase 2 / 3 / 5** |
| 场景 4 重构 | Phase 1（识别重构范围）→ Phase 3（设计新结构）→ Phase 4（重构任务）→ Phase 6-7（实施验证，确保行为不变） | **跳过 Phase 2 / 5** |
| 场景 5 从需求矩阵批量生成 Specs | 消费 `/requirements-matrix-generator` 产出的 `requirements/` 需求矩阵：Phase 1（`00-discovery.md` **默认跳过**，需求文档即 Discovery；仅当缺约束/术语时补 discovery-lite）→ Phase 2-4（生成 01-04 共 4 文件）→ Phase 5（FPF 审查） | 4 文件模式，输出路径不同 |

## 解决什么问题

把模糊的用户需求变成一套可机械核销、双向可追溯的规范文档（EARS 需求 → 正确性属性 → 任务 → 测试），再用 FPF 审查（R_eff ≥ 0.90）和独立对抗验证把守实施前后两道门，避免「文档写了但没验证」「测试全绿但功能是假的」「实施真相失传」这三类返工。它特别针对批量/长跑场景补了硬纪律：前提复核、收口记录、验证者≠作者、撞限先盘磁盘。

## 工作流程

1. **Phase 1 需求发现**：Step 1.1 理解用户意图 → 1.2 分析现有代码库（引用旧文档/审计的代码事实断言必须 runtime 抽查并标注核对日期，runtime > canon）→ 1.3 识别技术约束 → 1.4 建立术语表 → 1.5 记录项目权威验证 battery（命令 + 来源规则文件 + 触发条件；矩阵模式下登记到批次文档或 INDEX 供全批共享）→ 1.6 编写 `00-discovery.md`（矩阵模式默认跳过，需求文档即 discovery）。
2. **Phase 2 需求规范**：Step 2.1 从 Discovery（矩阵模式下为上游需求文档 + INDEX 约束）提取需求点 → 2.2 分类和编号（`Requirement [模块号].[序号]`）→ 2.3 用 EARS 模式编写（普遍型 `THE…SHALL` / 事件驱动型 `WHEN…SHALL` / 条件型 `IF…THEN…SHALL`（含异常处理与 unwanted behavior）/ 可选特性型 `WHERE…SHALL` / 复合型；符合 INCOSE 五项标准；数值锚定运行时源、标识符不变性、历史事故固化为 WHEN 型条款、被未拍板决策阻塞的需求写成条件组）→ 2.4 添加验收标准（含验证方法 + 预期结果）→ 2.5 编写 `01-requirements.md`。
3. **Phase 3 技术设计**：Step 3.1 架构设计（Mermaid 架构图；外部依赖方案二选一时先做限时 spike ≤ 半天拿探针证据）→ 3.2 组件和接口设计 → 3.3 数据模型设计 → 3.4 外部状态写语义检查（核清谁/何时/写什么，而非只核名字一致）→ 3.5 消费路径盘点（列出规则源全部读取点并逐条标注处置）→ 3.6 Prework Analysis（逐需求 Thoughts + `Testable: yes - property` / `yes - example` / `no - manual review`）→ 3.7 定义正确性属性（`*For any* … SHALL …` + `Validates: Requirements X.Y` + Oracle 声明：oracle 类型 + 验证环境）→ 3.8 错误处理设计 → 3.9 测试策略设计 → 3.10 编写 `02-design.md`（含代码锚点基线声明日期、File Changes Summary）。
4. **Phase 4 任务清单**：Step 4.1 分析设计文档（列需修改/创建文件与全部属性）→ 4.2 分组和排序（按依赖与优先级）→ 4.3 编写任务详情（Description / Files to modify / Acceptance Criteria / Evidence Gate `local|external` / Validates / Dependencies / Estimated effort `S-M-L-XL`；AC 判据写成仓库级不变量并带 oracle 声明，门命令先对基线试跑并确认验证工具存在于仓库；浏览器/人工证据类 AC 在批量时改为集中证据采集轮；不可执行 AC 走 waiver 协议二选一）→ 4.4 构建追溯矩阵（Requirement | Design Property | Task | Test）→ 4.5 估算工作量（XL 必须再拆）→ 4.6 编写 `03-tasks.md`（尾部预留「收口记录」节）。
5. **Phase 5 FPF 审查**（审查者必须 fresh-context，非作者自评）：Step 5.1 Q0 Init（定义范围与 D1–D5 五维、固定评分带宽、记录证据基线 = runtime 核对日期）→ 5.2 Q1 Hypothesize（H1–H5 质量假设：内容/检查方法/预期分数/风险点）→ 5.3 Q2 Verify（逐维度打分 = 通过项/总检查项；可数断言必须实际 `grep -c` 核数；外部状态写语义检查规则 B；D5 结构性上限如实计分，禁为凑 R_eff 手工上修）→ 5.4 Q3 Validate（跨文档交叉验证；需求文档与 runtime 漂移时写 `P-CAL-1` / `P-CAL-2` 校准前提）→ 5.5 Q4 Audit（汇总问题、定 Critical/High/Medium/Low、给改进建议）→ 5.6 Q5 Decide（`R_eff = min(D1..D5)`，机械规则禁手工调整；全维 1.00 触发反通胀复核；按固定带宽 A/B/C/D 决策）→ 5.7 编写 `04-fpf-review.md`（含审查边界声明：证据基线日期、已核对锚点范围、未验证面清单、四类不承保风险）。
6. **Phase 6 迭代实施**：Step 6.0 前提复核（强制门，置于一切实施动作之前：对 `01`/`02`/`03` 中所有 `file:line` 锚点、key 名、数量断言 `grep`/`Read` 重验 against 当前 HEAD；漂移分类为 (a) 琐碎锚点漂移就地更新 / (b) 结构性取代 → 禁止机械实施，判 `spec-premise-stale` 并引用取代方设计决策）→ 6.1 准备环境（建分支、装依赖、确认项目验证 battery 可运行，包管理器按项目声明取 `<pm>`）→ 6.2 选择任务（状态 `[ ]` / `[~]` / `[x]` / `[!]`）→ 6.3 实施任务 → 6.4 验证任务（跑 Discovery 记录的 battery 子集）→ 6.5 提交代码（逐文件核对 `git diff --cached --stat` 与触碰文件清单；commit message 含 `[Task X.Y]` 与 `Validates: Req X.Y, Property Z`）→ 6.6 更新任务状态（外部门未闭合只标「✅ 本地完成 / 外部门待验」）→ 6.7 重复直到所有任务完成（批量时每波：全量回归门绿后才 commit，下一波前重跑 Step 6.0）。
7. **Phase 7 验证回归**：Step 7.0 验证环境预检（生产 build、build 后重启、DB 在迁移头、worktree 补 `node_modules`、勿并发跑两个全量测试、记保真度注记）→ 7.1 执行项目验证 battery → 7.2 按属性声明的 oracle 类型逐条验证正确性属性 → 7.3 回归对比（CI 基线或独立 git worktree，禁止原地 `checkout main`）→ 7.4 集成门（批量必做：全量生产 build，失败须归属 owning spec）→ 7.5 自动化交付物与 flag 门控功能核销（要执行证据，穿透 mock 到真实接线点）→ 7.6 变异守门（注入违规 → 门转红 → 还原 → 门转绿，归档红/绿输出）→ 7.7 手动验证（生产 build）→ 7.8 对抗验证（独立验证者不读实施自报告，逐 AC 重推，产出 `PASS` / `PARTIAL` / `FAIL` + `issues[file,description,suggestedFix]`，修复 → 复验闭环；批量可用 3 镜头并行）→ 7.9 生成验证报告 → 7.10 部署收口（仅当部署在范围内：证据层级 DB truth > 容器池 + 公网健康端点 > smoke > wrapper 退出码，三面一致性 Git synced / payload synced / Runtime deployed）→ 7.11 验收记录归档 → 7.12 合并代码并清分支 → 7.13 终步：把收口记录写回 `03-tasks.md` 尾部（日期、五态状态判定、实施摘要、偏差清单、发现的范围外问题、验证证据、验证环境保真度注记）。
8. **批量模式（Batch Mode，可选路径）**：一轮生成多套 specs 按依赖序排列（P0 → P3，被依赖的结构性 spec 先行）→ 用户给出批次级常设授权时，逐 spec 确认门由四项替代物满足：(a) 批次级一次性授权记录 (b) 每波全量回归门 (c) 每 spec 收口记录 (d) 批次终报（不可逆/对外动作仍须逐次确认）→ 波次循环：实施 → 对抗验证 → 修复 → 全量回归 → commit → 前提复核；优先用 Workflow 编排（一波一 Workflow，波内三段：串行实施 → 每件 3 镜头独立对抗验证 parallel → 修复）；并行 agent 按文件不相交分组并落在主工作树，热点文件用合并者模式（consolidator 统一应用结构化变更）；每个 spec 收口时写收口记录到 `03-tasks.md` 尾部。

## 输入 / 产出

**输入**

- 用户的功能描述或需求陈述（Phase 1）
- 现有代码库访问权限、项目文档（Phase 1）
- 项目已晋升的验证规则 / CI workflow / `package.json` scripts —— 用于登记「项目验证 battery」（Phase 1 Step 1.5）
- 用户确认的术语表（Phase 2 输入）
- `00-discovery.md`（Phase 2/3/4/5/6 输入；矩阵模式下由 upstream 需求文档替代）
- `01-requirements.md`（Phase 3/4/5/6 输入）
- `02-design.md`（Phase 4/5/6/7 输入，含正确性属性与 oracle 声明）
- `03-tasks.md`（Phase 5/6/7 输入）
- `04-fpf-review.md`（Phase 6 输入）
- 矩阵模式专用：`requirements/` 需求矩阵中的单个需求文档（如 `UI-001-Dashboard模板残留清理.md`）+ INDEX 的项目约束与决策台账
- 已完成的代码实现与测试代码（Phase 7 输入）
- 批量模式额外：用户明确的常设授权（goal / 「依次实施不要停止，自行做最优选择」类指令）
- 编排能力：fresh-context 审查者（新会话/新 subagent）与独立验证者实例；批量推荐 Workflow 编排

**产出**

- `.specs/{feature-name}/00-discovery.md`（默认模式；矩阵模式默认跳过，改出精简 discovery-lite）
- `.specs/{feature-name}/01-requirements.md`（EARS 需求规范）
- `.specs/{feature-name}/02-design.md`（技术设计 + Correctness Properties + Oracle 声明）
- `.specs/{feature-name}/03-tasks.md`（任务清单 + 追溯矩阵 + 尾部收口记录）
- `.specs/{feature-name}/04-fpf-review.md`（FPF Q0–Q5 审查 + R_eff）
- `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/01-requirements.md`（需求矩阵模式路径，如 `requirements-specs/40-frontend/UI-001-dashboard-cleanup/`）
- `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/02-design.md`
- `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/03-tasks.md`
- `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/04-fpf-review.md`
- 实现代码 + 测试代码（`src/__tests__/[feature]/[feature].test.ts`、`[feature].property.test.ts`、`[feature].integration.test.ts`）
- 更新的 `03-tasks.md`（任务状态 + 偏差/勘误/范围外发现留痕 + 尾部收口记录）
- 对抗验证 verdict（per-spec `PASS` / `PARTIAL` / `FAIL` + `issues[]`）
- 验证报告：`Verification Report: [功能名称]`（含自动化/battery、属性 oracle、回归、集成门、交付物证据、对抗验证、手动验证各节）
- 验收记录归档（验证报告附录，或 `03-tasks.md` 收口记录的「验证证据」字段）
- Pull Request 与合并到主分支（PR 模板含 Validation 与 Related 段）
- 批量模式额外：INDEX 维护的共享文件热点表、批次级一次性授权记录、批次终报

## 目录结构

```
skills/ameureka-spec-dev/
├── README.md                            # 本说明文档（目录内实际存在）
├── SKILL.md                             # 主入口：frontmatter（name/description + 4 类使用场景）、Quick Reference、
│                                        #   7 阶段 Standard Workflow、5 个常见场景（新功能/增强/Bug 修复/重构/
│                                        #   需求矩阵批量生成）、批量模式（Batch Mode）、11 条 ALWAYS + 10 条 NEVER
│                                        #   Critical Rules、Verification Checklist、Reference Commands、
│                                        #   Related Skills、外部资源链接、Changelog（v1.0.0 / v2.0 / v2.1）
├── operations/
│   ├── phase1-discovery.md              # Phase 1：Step 1.1-1.6（理解意图、代码库分析、技术约束、术语表、
│   │                                    #   项目验证 battery、编写 00-discovery.md），含 runtime>canon 警示、
│   │                                    #   双模式输出路径、时间估算表
│   ├── phase2-requirements.md           # Phase 2：EARS 五种模式详解、INCOSE 五项合规标准（含 ✅/❌ 正反例）、
│   │                                    #   三条附加编写规范（运行时值锚定 + 标识符不变性、历史事故教训编码进
│   │                                    #   EARS、条件组需求）、Step 2.1-2.5、禁止词汇表
│   ├── phase3-design.md                 # Phase 3：五类正确性属性（存在性/完整性/一致性/保持性/回退性）、
│   │                                    #   Oracle 声明与选择规则、Prework Analysis、Step 3.1-3.10（含外部依赖
│   │                                    #   限时 spike、外部状态写语义、消费路径盘点、代码锚点基线约定）
│   ├── phase4-tasks.md                  # Phase 4：任务分解四原则、标准任务格式（含 Evidence Gate）、四类任务
│   │                                    #   示例、AC 质量四规则（仓库级不变量判据、门命令基线试跑、集中证据
│   │                                    #   采集轮、不可执行 AC 的 waiver 协议）、任务状态双态、追溯矩阵、
│   │                                    #   Step 4.1-4.6
│   ├── phase5-fpf-review.md             # Phase 5：FPF 6 阶段 Q0-Q5 详解、审查边界声明（四类不承保风险）、
│   │                                    #   强制检查规则 A/B/C（grep -c 核数、外部状态写语义、D5 结构性上限
│   │                                    #   如实计分）、P-CAL 校准前提、四种决策 A/B/C/D、Step 5.1-5.7
│   ├── phase6-implementation.md         # Phase 6：五条实施原则（含 runtime > canon）、Step 6.0 前提复核（漂移
│   │                                    #   两分类）到 6.7、提交纪律（staged 清单逐文件核对）、批量/并行实施
│   │                                    #   （文件不相交分组、合并者模式、结构化偏差申报、design-errata 出口、
│   │                                    #   等价实施偏差台账、波次回归门、Workflow 编排、disk-recovery）、
│   │                                    #   四类常见问题处理
│   └── phase7-verification.md           # Phase 7：Step 7.0-7.13（环境预检、battery、属性 oracle 验证、回归
│                                        #   对比、集成门、交付物核销、变异守门、手动验证、对抗验证、验证报告、
│                                        #   部署收口三面一致性、验收归档、合并、写收口记录）、验证失败三分诊、
│                                        #   验证报告模板
└── templates/
    ├── 00-discovery.template.md         # Discovery 文档骨架（模板版本 2.0）：功能目标/成功标准、现有实现分析、
    │                                    #   技术约束（含项目验证 battery 表）、术语表、开放问题、风险识别、
    │                                    #   参考资料、下一步、审批状态；含矩阵模式默认跳过说明
    ├── 01-requirements.template.md      # 需求文档骨架（2.0）：Document Info 含「阻塞决策」行、Introduction、
    │                                    #   Glossary、Requirement 1-6（含异常处理与质量标准）+ EARS AC 与验证
    │                                    #   方法/预期结果、EARS 模式参考表、需求汇总、依赖 mermaid 图、非功能
    │                                    #   需求、Notes、审批状态
    ├── 02-design.template.md            # 设计文档骨架（2.0）：Overview/Key Design Decisions、硬约束遵循表、
    │                                    #   Architecture 与 Data Flow（Mermaid）、Components and Interfaces、
    │                                    #   Data Models、Correctness Properties（Prework Analysis + Property
    │                                    #   1-6 带 Oracle）、Error Handling、Testing Strategy、File Changes
    │                                    #   Summary、审批状态；头部含代码锚点基线日期
    ├── 03-tasks.template.md             # 任务清单骨架（2.0）：Overview/工作量统计、Group 1-5 共 8 个示例任务、
    │                                    #   Traceability Matrix、Implementation Order（Mermaid + 推荐执行
    │                                    #   顺序）、Progress Tracking（含 Commit/验证证据列）、Risk Items、
    │                                    #   Notes、审批状态、尾部「收口记录」字段骨架（五态状态判定）
    └── 04-fpf-review.template.md        # FPF 审查骨架（2.0）：Overview、审查边界声明（证据基线日期/已核对锚点
                                         #   范围/未验证面清单/四类不承保风险）、Q0 评分标准表、Q1 H1-H5 假设、
                                         #   Q2 D1-D5 逐维度检查表与维度分数、Q3 交叉验证矩阵、Q4 问题汇总与
                                         #   改进建议、Q5 R_eff 计算与 A/B/C/D 决策、Action Items、修正后复查、
                                         #   审批状态
```

## 注意事项

- `R_eff = min(D1..D5)` 是机械规则，禁止任何手工上调/下调（上调凑分和无理由下折两个方向都实锤翻车过）；分数不达门就修文档重审，不改分数。
- 决策带宽固定且动作名不可改写：≥0.95 直接实施 / 0.90–0.94 小幅修正后实施（不得写作「直接实施」）/ 0.80–0.89 不可实施（修正后重审，旧文案「及格/可接受」作废）/ <0.80 重新设计；全维 1.00 触发反通胀复核而非默认接受。
- **需求覆盖率 100%，双向追溯完整**（SKILL.md「质量标准」三项之一，另两项为 R_eff 机械规则与收口记录五态词汇）。
- **场景 2/3/4 不走完整 Phase 1–7**：Bug 修复（场景 3）跳过 Phase 2/3/5，重构（场景 4）跳过 Phase 2/5，功能增强（场景 2）的 Phase 5 只审增量部分。不要在这些短路径上强加 FPF 门。
- FPF 审查者必须 fresh-context（新会话/新 subagent，非作者自评）；依据：004 批次 23 套自报全过，独立复审发现 4 套实际未达门。
- 可数断言（「共 N 处 / N 个文件」）必须实际执行 `grep -c` 核数，不得目测；行号锚点核对 ≠ 数量核对，两者都要做。
- FPF 只承保「文档内部一致性 + 已核对锚点」，不承保四类风险，**四类一律移交 Phase 6/7 运行时门**：① 代码快照时效（对策：Step 6.0 前提复核）② 跨 spec 组合效应（对策：Step 7.4 全量生产 build 集成门）③ 验证环境保真度（对策：Step 7.0 环境预检）④ 外部状态写语义（对策：Q2 规则 B 检查类别）。别把第 4 类误当成运行时门——它是 FPF 自己在 Q2 加的检查项。
- 无收口记录 = 未收口；批量实施时每个 spec 都要写（含早波）—— 某批次 10/21 有收口记录的全程可追溯，11 个没写的（含两个 P0）实施真相失传。
- 收口记录状态判定只有五个固定拼写：`PASS` / `PARTIAL→已修复→PASS` / `FAIL→已修复` / `spec-premise-stale` / `deferred-non-blocking`。
- Step 6.0 前提复核是实施前的强制门；结构性取代（目标已被更早设计决策删除或重构）禁止机械实施，判 `spec-premise-stale` 并引用取代方设计决策。
- 发布 ≠ 完成：外部证据门未闭合时任务最多标「✅ 本地完成」，保持「外部门待验」，禁止把「已合并」写成「已上线/已生效」。
- 提交前必须逐文件核对 `git diff --cached --stat` 与触碰文件清单（不是看总数）—— 实锤事故：一次只暂存了测试文件，8 个 src 改动从未入库。
- NEVER 以「文件存在」核销自动化交付物（CI workflow/cron/脚本）：必须有至少一次真实运行记录；workflow 文件存在但从没执行过是典型死目录事故。
- NEVER pin 观察值做守门测试期望 —— 会把现存 bug 冻结成合同（P0 定价 bug 被测试全绿守护）；期望值必须派生自 SSOT/运行时规则源；新守门必须做变异守门（见过红才算覆盖）。**行为反转类改动必须翻转旧 pinned 守门**——旧断言编码旧行为，新行为落地后它们会成批变红，或更糟，继续绿着守护错误。
- 禁止使用模糊词汇：可能、通常、大概、应该能、等等、适当的、用户友好、快速、高效（Phase 2 有完整禁止词汇表及替代方案）。
- runtime > canon：引用旧审计/旧设计文档/记忆文件的代码事实断言必须先 runtime 抽查并标注验证方式与核对日期；双向翻车都发生过（把「设计过但从未实现」当 bug 立项，也把文档写的「未接线」当真）。
- **design-errata 出口**：凡 02-design 指定的用户可见内容/数字/产品事实断言，落笔前先对 runtime 重验；若设计文档本身含事实性错误，**不盲从实施错误**，就地勘误 + code-as-truth 裁决，收口记录留痕三要素（原断言 / 代码证据 / 裁决结果）。
- 每个 Correctness Property 与 AC 必须声明 oracle 类型（源码 grep / HTTP 抓取 / 浏览器 DOM（Playwright）/ DB truth / 执行证据）+ 验证环境；判据写成仓库级不变量（如「全仓 grep 归零」），文件清单只是工作项不是验证边界。
- CSR-bailout 内容不能用 `curl` 验证（抓不到 client 渲染后的 DOM → 假阴性），必须用源码 grep 或真浏览器；门命令必须先对基线试跑确认工具存在与红绿方向。
- 对抗验证：独立验证者（新 subagent/新会话，非实施者）不读实施自报告，逐 AC 重新执行验证命令、独立重推事实；FAIL/PARTIAL 附 `issues[]`（file / description / suggestedFix）并走修复 → 复验循环，闭环后才写收口记录。
- 运行中的工作流绝不干预：TaskList 空 ≠ 工作流死；008 主线程误判抢先提交「恢复」commit，捕获变异注入中间态提交假绿（被工作流自身验证 agent supersede 修复 `5ce67e71`）。
- 撞限先盘磁盘（disk-recovery）：agent 死于 commit 前常已写完文件只丢返回值，恢复第一动作是 `git status` / `git diff` / 读目标文件，已落盘的直接接续，仅真缺失部分重做；日常用 edit → 即时 commit 缩小被扫窗口。
- Workflow resume 按调用序前缀失效，中途改输入无法精准断点续；用「结果内嵌手工续跑」而非盲目 resume。
- `deferred-non-blocking` 数量硬上限 ≤ 4，是诚实降级不是提前退出后门；每个必带可观测触发器 + 登记去处，禁留「以后再看」的模糊时间欠账；超限须回查根因。
- **tripwire 冻结收口**：当期无法验证或休眠的开放项，须写明数据触发条件并**落一个测量探针**（否则触发条件永远不会响），再判 `deferred-non-blocking` 并登记去处。
- solo 降级（subagent 不可用）时禁止把自我复核当独立验证背书：收口记录必须标注「solo 降级」，仍要亲跑变异门取执行证据。
- 并行 agent 按文件不相交分组并落在主工作树（worktree 隔离会搁浅改动）；热点文件禁止多 agent 并发编辑，走合并者模式（consolidator，只申报 set/delete + 值，由单一 consolidator 统一应用校验）；同名脚本/资源命名冲突要有**归属裁决**（指定唯一 owner spec，其余为 consumer-only）；**每个实施 agent 必须结构化申报 deviations，没有偏差也要显式申报空列表，禁止默默偏离**。
- waiver 协议：不可执行 AC 二选一处理（显式 deferred 或等价证据包，命名须含「equivalent evidence / not X」）；需用户明确批准；文档状态词只能写 waiver，禁升级为 completed，且必须附自动失效条件。
- 回归对比禁止在同一工作区 `git checkout main` 跑测试（污染工作区、改变验证环境），用 CI 基线对照或独立 git worktree。
- 批次授权下的 carve-out：不可逆/对外动作（生产部署、删数据、对外发布）不在默认授权范围，仍须逐次确认，除非授权明确覆盖。
- 部署收口按证据层级：DB truth > 容器池状态 + 公网健康端点 > smoke 结果 > wrapper 退出码 / marker 文件，高层可推翻低层，反向禁止；三面一致性（Git synced / 部署 payload synced / Runtime deployed）逐面核销。
- 拓扑变更（路由/入口/部署改动）的任务清单必须包含「更新对应 smoke/监控断言」任务，否则旧 smoke 变永久假红或继续假绿守护已不存在的拓扑。
- `R_eff` 达标（文档质量门）≠ 可实施（实施门）：阻塞决策未拍板时 spec 可通过 FPF 但实施保持冻结。
- 标识符不变性：`offerId` / `promoId` / 交易类型 / 账本键永不改名、永不把业务数值编码进名字；业务数值变更改规则源，不动标识符。
- 验证失败先过三分诊再行动：真回归（修代码）/ 过期断言（更新断言至新 SSOT）/ 验证设施问题（修设施，回 Step 7.0）。混着修会把设施问题修成代码回退。

## 安装

纯提示词型 skill，无脚本、无 npm/pip 依赖。按仓库 README 的安装方式二选一（仓库 README 把 symlink 标为推荐）：

```bash
# 方式一：直接复制
cp -r skills/ameureka-spec-dev ~/.ai-config/skills/

# 方式二：symlink（推荐，改仓库即生效）
ln -s "$(pwd)/skills/ameureka-spec-dev" ~/.ai-config/skills/ameureka-spec-dev
```

目录内无 `references/` 与 `scripts/`，只有 `README.md` + `SKILL.md` + `operations/`（7 个 phase 文件）+ `templates/`（5 个 `*.template.md`）。

开工时按 SKILL.md「Reference Commands」初始化 spec 目录：

- 默认模式：`SPEC_DIR=.specs/{feature-name}`
- 需求矩阵模式：`SPEC_DIR=requirements-specs/{NN-layer}/{PREFIX-NNN-slug}`

模板要逐文件 `cp` 并重命名（`*.template.md` → `*.md`）；`SKILL_DIR` 按安装方式取 `skills/ameureka-spec-dev` 或 `~/.ai-config/skills/ameureka-spec-dev`。

矩阵模式（场景 5）消费上游 `/requirements-matrix-generator` 产出的 `requirements/` 需求矩阵，此时 `00-discovery.md` 默认跳过。

运行条件上需要能起 fresh-context 的新会话/新 subagent（Phase 5 FPF 审查者与 Phase 7 对抗验证者都必须是非作者实例），批量实施推荐用 Workflow 编排（一波一 Workflow）。

验证命令不硬编码包管理器，按项目的 `packageManager` 字段 / lockfile 取 `<pm>`。外部资源链接（EARS / INCOSE / Hypothesis / Kiro）在 SKILL.md 中已标注「可能失效」。

Related Skills：`/requirements-matrix-generator`（上游配套，矩阵模式消费其输出）、`/code-review`（代码审查）。

本 skill 目录内没有 `SOURCE-NOTE.md`（同仓库的 `blindspot-audit`、`enterprise-svg-architect` 有）。

运行时依赖：无。

License: MIT
