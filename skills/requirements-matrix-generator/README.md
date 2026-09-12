# requirements-matrix-generator

把审计/差距分析报告里的扁平问题清单，按 10 层技术分类法重组成可追溯、可排期、可交接的需求矩阵（`00-INDEX.md` + N 个标准格式需求文档）。

## 触发场景

触发词：

- 生成需求矩阵
- 创建requirements
- 需求分层
- 技术分层需求
- requirements matrix
- 从审计报告生成需求
- gap to requirements
- 完成审计/差距分析后，需要生成结构化需求矩阵
- 用户提供了问题清单/审计报告，需要转化为可执行的需求文档

典型使用场景：

- FPF 审计报告、竞品差距分析、用户反馈汇总、技术债务清单已经产出，但其形态是一张扁平问题表，无法直接驱动实施。
- 需要把问题按技术层级（BL / API / DB / UI / INT / SEC / CODE / OPS / QA / DEP）归类、编号、定优先级，并排出 Wave 1 → Wave 3 的分波实施顺序（Wave 1 = P0 / Wave 2 = P1 / Wave 3 = P2、P3）。
- 需要为下游 `/ameureka-spec-dev` 准备输入：每个需求文档对应一组 4 文件 Kiro Specs（01-04）。
- 需要一份人人都从同一入口进入的导航枢纽，而不是散落各处、互相冲突的需求描述。

## 解决什么问题

审计/差距分析报告产出的往往是一张扁平的问题清单，无法直接驱动实施。本 skill 用 10 层技术分类法（BL/API/DB/UI/INT/SEC/CODE/OPS/QA/DEP）把问题重组成可追溯的需求矩阵，输出 `00-INDEX.md` 导航枢纽加 N 个标准格式需求文档，并强制 runtime 复核、决策台账、热点表与场景覆盖度审计，避免文档断言直接矩阵化和「分层全过但有断链」的假完备。

## 工作流程

1. **Step 1 分析输入文档（含 runtime 复核）**：识别输入类型（审计报告 / 差距分析 / 问题清单 / 用户反馈），提取所有问题并建立含「问题描述 | 优先级 | 证据/来源 | runtime 复核（方式+日期） | 技术层级（待分配）」列的问题清单表；对每个提取的问题做 runtime 抽查（grep/实测）并标注验证方式+日期，对老文档断言做对抗 confirm/refute（双向证伪）；暴露度检查先于优先级，已确认但休眠的问题记 `Frozen (tripwire)`；与用户确认项目约束（导入路径 / 主键生成 / i18n / 认证中间件 / 输入验证 / 错误处理），已有权威规则文件的项目优先引用（本工作区 `.claude/rules/*`）。
2. **Step 2 技术分层映射（含决策依赖识别）**：将每个问题映射到 10 层对应层级，分配编号 `{前缀}-{序号}`（如 `UI-001`、`DB-001`），逐问题标注阻塞决策 ID（无则填「无」），未拍板决策登记进 INDEX 决策台账、被阻塞需求写成条件组（方案 A/B/C 各一组，拍板后回填）；输出「问题 | → 层级 | 编号 | 文档标题 | 阻塞决策」映射表供用户确认，等待用户确认后再继续（批量授权模式下本确认门降级为「输出映射表供事后审查」）。
3. **Step 3 生成 `00-INDEX.md`**：使用 `templates/00-INDEX.template.md` 生成导航枢纽，必须包含文档矩阵概览（ASCII 图）+ 按任务类型快速定位表 + 文档清单、项目约束清单（全矩阵唯一权威单点）、决策台账、共享文件热点表、波次实施计划（P0→P3 分波，每波末尾设全量回归门 tsc + 全量测试 + 生产 build，波间提示前提复核）、空层不填充理由、跨切面实施告警。
4. **Step 4 逐个生成需求文档**：按优先级顺序 P0 → P3，使用 `templates/requirement.template.md` 逐个生成，每个文档含 Document Info（版本/状态/优先级/来源/runtime 复核方式+日期）、项目约束遵循表（只引用 INDEX 权威表并登记差异项）、阻塞决策表、问题描述（引用差距分析证据 + runtime 复核结论）、实现方案（概要级代码片段或流程图）、交叉引用；完成后输出 `/ameureka-spec-dev` 调用提示（4 文件 Kiro Specs，01-04）。
5. **Step 5 场景覆盖度审计**：列出该模块全部用户旅程（端到端，从入口动作到业务闭环），逐旅程逐步骤映射需求覆盖（哪一步由哪个需求 ID 承接），输出覆盖率 % + 断链清单（无任何需求承接的步骤），断链项回填 Step 2 重新映射或显式记入 INDEX（决策台账 / 空层不填充理由 / 已知缺口）。

## 输入 / 产出

输入：

| 输入 | 说明 |
| --- | --- |
| 结构化问题清单 | 任何来源：FPF 审计报告、竞品差距、用户反馈、技术债务等（差距分析文档 / 问题清单） |
| 问题证据 | 文件路径:行号 + 代码片段或截图描述（核对日期） |
| 项目约束具体值 | 首次使用时与用户确认，后续复用：导入路径、主键生成、i18n、认证中间件、输入验证、错误处理等 |
| 权威规则文件 | 已有项目的规则文件（本工作区 `.claude/rules/*`，优先引用而非重问） |
| 常设授权指令（可选） | 触发批量生成模式，如 `goal` / 「依次实施不要停止，自行做最优选择」 |

产出：

| 产出 | 路径 / 形态 |
| --- | --- |
| 导航枢纽 | `requirements/00-INDEX.md`（由 `templates/00-INDEX.template.md` 生成，全矩阵唯一入口） |
| 需求文档 | `requirements/{层级编号}-{类别}/{前缀}-{序号}-{中文标题}.md`，按 10 层分类组织，如 `40-frontend/UI-001-Dashboard模板残留清理.md`、`30-database/DB-001-Dashboard批量查询优化.md` |
| 下游 Specs 提示 | 对每个需求文档调用 `/ameureka-spec-dev` 生成 4 文件 Kiro Specs（01-04）的清单，输出到 `requirements-specs/{层级编号}-{类别}/{前缀}-{序号}-{英文slug}/` |
| 场景覆盖度审计报告 | 覆盖率 % + 断链清单（Step 5 产出，回填 Step 2 或记入 INDEX） |

## 目录结构

```text
requirements-matrix-generator/
├── SKILL.md                              # 主入口：10 层分类法主表、5 步标准工作流、批量生成模式、
│                                         #   文件命名规则、状态流转词汇表与 Critical Rules
│                                         #   （ALWAYS 6 条 / NEVER 4 条），含 v1.0→v2.0→v2.1 changelog
├── references/
│   ├── 10-layer-taxonomy.md              # 10 层分类法详解：每层职责、典型内容，Layer 10–70 附判断标准
│   │                                     #   （Layer 80/90/99 无），Layer 10 附边界案例；编号规则；
│   │                                     #   历史变体说明（20-api / 70-code / REQ-50-01 属遗留漂移，
│   │                                     #   不得沿用）；前缀对照表（指向 SKILL.md 主表）；跨层问题处理原则
│   ├── case-study.md                     # 完整案例：管理后台 FPF 审计（审计范围 11 个受保护页面）发现的
│   │                                     #   9 个问题 → 9 个需求文档的映射过程（含合并/拆分决策说明），
│   │                                     #   附 008 实施期验证（95 发现 → 12 需求 → 12/12 spec 全终态，
│   │                                     #   四机制实锤）
│   └── document-templates.md             # 模板讲解版：声明 templates/ 为唯一权威源（本文件不存模板副本，
│                                         #   避免双份漂移）；讲解 INDEX 必备节与需求文档结构、v2.0 新增四节用途、
│                                         #   相对链接易错点、项目约束通用类别表
└── templates/
    ├── 00-INDEX.template.md              # 00-INDEX.md 正文模板（版本 2.0, 2026-07-06）：Document Info、
    │                                     #   项目约束清单（权威单点）、决策台账、共享文件热点表、波次实施计划、
    │                                     #   文档矩阵概览、按任务类型快速定位、文档清单、开发优先级矩阵、
    │                                     #   空层不填充理由、跨切面实施告警、AI 开发工作流、实施进度/收口表、
    │                                     #   下游 Specs 生成
    └── requirement.template.md           # 单个需求文档正文模板（版本 2.0, 2026-07-06）：Document Info
                                          #   （含 runtime 复核行）、阻塞决策表、项目约束遵循（单点引用+差异项）、
                                          #   1. 问题描述、2. 实现方案、3. 交叉引用、4. 验收标准、References
```

无 `scripts/` 目录 —— 本 skill 为纯文档/提示词驱动，不含可执行脚本。

## 注意事项

- runtime > canon：每个从审计/文档提取的问题，矩阵化前必须 runtime 抽查（grep/实测）并在清单标注验证方式+日期；NEVER 把未经 runtime 复核的文档断言直接矩阵化。
- 对抗 confirm/refute（双向证伪）：历史实锤双向翻车——把「设计过但从未实现」当「已实现有 bug」，把文档「未接线」当真（实际已接线）。
- 暴露度检查先于优先级：已确认但休眠（无真实流量触达）的问题记 `Frozen (tripwire)`，挂数据触发条件 + 测量探针，而非立即 spec。
- ALWAYS 在 Step 2 等待用户确认映射（分类可能有歧义）；仅批量授权模式下降级为「输出映射表供事后审查」。
- 共享硬约束单点化：权威约束表只在 `00-INDEX.md` 维护一份，需求文档只声明「遵循 INDEX 项目约束清单」并登记差异项（新增/豁免/收紧），禁止整表复制造成多份漂移。
- NEVER 在需求文档中放完整实现代码 —— 完整代码属于下游 `specs/02-design.md`，需求文档只放概要级代码片段。
- NEVER 跳过 `00-INDEX.md`（整个矩阵的导航枢纽）；NEVER 使用模糊优先级，必须明确 P0/P1/P2/P3。
- 空层必须写「不填充理由」（确认无问题 vs 未审计到逐条写明），防止「空层」与「漏审」混淆。
- 相对链接易错点：需求文档位于 `requirements/{层级编号}-{类别}/` 两级目录内，引用与 `requirements/` 同级的 specs 目录必须写 `../../requirements-specs/...` 而非 `../requirements-specs/`（历史版本误写导致断链，模板 2.0 已修复）。
- 历史变体不作规范依据：`20-api` / `70-code` / `REQ-50-01` 等目录名与编号属遗留漂移，新矩阵一律用正典全名（`20-api-specs`、`70-code-standards`）与 `{PREFIX}-{NNN}` 编号。
- Status 固定词汇禁止自创变体：`Draft → Ready-for-Specs → Specs-Generated → Implemented → Gray-Verified → Closed`；旁路仅 `Frozen (tripwire)` 与 `Blocked (decision)`。
- 热点表不是参考而是依据：主改者字段必须落表，同波多需求碰同一文件指定主改者 + 其余申报差异；并行 agent 按文件不相交分组。
- structure-first 需求（全域替换 / 大范围结构调整）必须排 Wave 1 首个；波间必须做前提复核（`file:line` 锚点对当前 HEAD 重验），否则下游锚点漂移改错行。
- open 决策必须给默认分支（否则实施期卡死等拍板）；dormant 高危必须给触发器（否则要么被漏做、要么被强行做成白工）。
- 追溯表要覆盖不立需求的五类去向（拍板不立 / Frozen / 人工待办 / open 条件组 / 正向核销），否则「零遗漏」不可核销——「没写进任何需求」与「有意不立」必须可区分。
- 铁律：无收口记录 = 未收口；Status 推进以实施进度收口表为准，禁止只在对话里宣布完成。
- 批量生成模式下，不可逆/对外动作（生产部署、删数据、对外发布）不在默认授权范围，仍须逐次确认。
- 语言约定：正文一律中文；EARS/FPF/模板结构关键字保留英文（SHALL / WHEN / Status / Validates / P0-P3 等）。
- 不是每次都需要 10 层全部填充，按需选择相关层级（案例：12 需求只用 4 层 + 6 空层有理由）。
- 技术分层是组织视角不是完备性证明：002 批次实锤，纯技术分层自查全过，按用户旅程映射才暴露 55% 覆盖率与 3 个致命断链。

## 安装

纯 Markdown 提示词型 skill，无安装步骤、无构建、无可执行脚本（目录内无 `scripts/`）。把 `requirements-matrix-generator` 目录放到 AI Code Assistant 的 skills 目录（本仓库为 `skills/`）即可由 frontmatter description 触发。

复制方式：

```bash
cp -r /path/to/ameureka-skills/skills/requirements-matrix-generator ~/.ai-config/skills/requirements-matrix-generator
```

软链接方式（便于跟随仓库更新）：

```bash
ln -s /path/to/ameureka-skills/skills/requirements-matrix-generator ~/.ai-config/skills/requirements-matrix-generator
```

使用前提：

1. 依赖下游 skill `/ameureka-spec-dev` 才能把每个需求文档转成 4 文件 Kiro Specs，两 skill 需同时安装，输出路径 `requirements-specs/{层级编号}-{类别}/{前缀}-{序号}-{英文slug}/` 与 ameureka-spec-dev 的 `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/` 为同一路径。
2. Step 1 会向用户确认项目约束（导入路径 / 主键生成 / i18n / 认证中间件 / 输入验证 / 错误处理），已有权威规则文件的项目优先引用而非重问（本工作区见 `.claude/rules/*`）；若不愿被打断，可用常设授权指令（`goal` / 「依次实施不要停止，自行做最优选择」）启用批量生成模式。
3. 改模板只改 `templates/` 一处，`references/document-templates.md` 是讲解版不存副本。

运行时依赖：无（`runtimeDeps` 为空）。

License: MIT
