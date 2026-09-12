# loop-prompt-generator

把「我想让 AI Code Assistant 一直跑下去把 X 做完」这类模糊诉求，翻译成一份可直接粘贴、可中断恢复、有确定性停止条件的 loop 提示词。

## 触发场景

| 触发词（原样） | 归类 |
| --- | --- |
| `/goal` | 原语 |
| `/loop <间隔>` | 原语 |
| `/schedule（云端）` | 原语 |
| `proactive 组合` | 原语 |
| 基于用户输入 + 动态上下文，生成可直接粘贴到 AI Code Assistant 的 loop 提示词。 | 意图 |
| 核心流程：任务画像 → loop 原语选型（turn/goal/time/proactive）→ 确定性停止条件与质量门设计 → 组装九块结构的 paste-ready 提示词 + 操作手册。 | 意图 |
| 将「我想让 AI Code Assistant 一直跑下去把 X 做完」翻译成一份**可直接粘贴、可中断恢复、有确定性停止条件**的 loop 提示词。 | 意图 |

典型使用场景：

1. 大批量 specs/任务队列要长时间无人值守跑完（旗舰场景，模板见 `templates/spec-batch-execution.template.md`）
2. 有可验证退出条件的目标收敛任务（`/goal`）
3. 定时监视外部系统或例行工作（`/loop`、`/schedule`）
4. 常驻事件驱动流水线（proactive 组合）

## 解决什么问题

把「我想让 AI 一直跑下去把 X 做完」这类模糊诉求，翻译成确定性停止条件 + 可中断续跑的 loop 提示词，解决 AI 自主长跑最容易出的两类事故：提前宣布完成（停止条件不可磁盘验证、评估模型守不住门）和中断即丢队列（进度只存在对话记忆里，compact 后队列消失）。它把停止条件拆成「完成判据 / 质量门 / 上限阀」三要素，并强制把队列真相源、恢复协议、红线写进提示词本体。

## 工作流程

1. **Step 1: 任务画像（intake）** —— 问清/探明四件事，用户没给就主动收集动态上下文（读状态表、ls 队列目录、查质量门命令）：(1) 任务形态（有限队列→Goal-based 长跑；目标收敛→Goal-based；监视外部→Time-based；常驻流水→Proactive）；(2) 队列/进度真相源在哪（哪个文件/表/目录能唯一回答「还剩什么没做」，没有就先让用户建或在提示词里指定第一步建立）；(3) 质量门是什么（可机械执行的验收命令/评分：`tsc`、测试命令、build、R_eff 阈值、Lighthouse 分数）；(4) 自主边界（哪些可自决、哪些永不自动：部署/对外发布/删数据/花钱）。
2. **Step 2: 原语选型（决策树）** —— 工作由外部事件/时间驱动？是 → 需要无人值守常驻？是：`/schedule`（+`/goal` 组合）；否：`/loop <间隔>`。否（一次触发跑到完）→ done 可确定性验证？是：`/goal`（首选，评估模型替你守停止条件）；否：先把 done 定义成可验证的（回到 Step 3），实在不行才用 turn-based + 自验证 skill。超长任务（预计超过单会话上下文）不必回避 `/goal`，只要队列真相源在磁盘、恢复协议写进提示词。
3. **Step 3: 停止条件与质量门设计（本 skill 的核心价值）** —— 三要素缺一不合格：完成判据（磁盘可验证 + 字段名对齐磁盘既有模板，先 `grep` 确认、禁臆造）、质量门（机械可执行 + 阈值明确 + 不达标动作）、上限阀（显式轮次/时间上限，如 stop after 150 turns；上限命中 ≠ 失败，重发同一提示词从磁盘续跑）。
4. **Step 4: 组装提示词（九块结构 + 契约文件模式）** —— 九块：①目标与范围清单 ②队列真相源 ③单件循环 ④质量门 ⑤决策政策 ⑥中断恢复协议 ⑦停止条件 ⑧禁止事项 ⑨终报格式。`/goal` 超 4000 字符走契约文件模式：九块全文落盘为执行契约，`/goal` 只装契约绝对路径指针 + 内联精简停止条件 + 常驻红线摘要 + 上限阀，并写明「开工与每次恢复第一步 = 完整重读契约」；轻量监视类可全文内联并裁剪到 4-5 块（仍须 ≤4000 字符）。生成后必须 `wc -m` 实测 ≤ 4000。
5. **Step 5: 输出** —— 交付两样东西：(1) paste-ready 提示词（代码块包裹，用户直接复制粘贴；`/goal` 形式则整条以 `/goal ` 开头）；(2) 操作手册（简短）：用什么模型跑（长跑执行建议 Opus，判断密集环节用最强模型）、怎么监控（`/goal` 无参数看轮次与 token、`/workflows` 看子 agent、`/usage` 看用量分布）、中断/上限命中后重发同一提示词、先试跑（第一件跑完人工抽查一次再放手，pilot before a large run）。

附：旗舰场景大批量 specs 无人值守执行要点速记 —— 队列真相源 = `requirements/00-INDEX.md` 的「实施进度 / 收口表」；单件循环 = Step 6.0 前提复核 → 按 `03-tasks.md` 实施 → 对抗验证 → 波内回归门 → commit → 收口记录写入 `03-tasks.md` 尾部；质量门 = 实施后 FPF 复核 R_eff ≥ 0.95 + 每波 `tsc`/全量测试/生产 build 三绿（含环境预检与 blocked-env 降级分支，禁静默跳过）。

## 输入 / 产出

| 输入 | 产出 |
| --- | --- |
| 任务目标（用户的一句话诉求，如「让 AI 一直跑下去把 X 做完」） | paste-ready 提示词（代码块包裹，`/goal` 形式整条以 `/goal ` 开头；实例为 1152 字符与 1902 字符的短 `/goal`） |
| 动态上下文：队列/进度真相源位置（哪个文件/表/目录能唯一回答「还剩什么没做」） | 操作手册（随提示词交付：模型选择/环境预检/监控命令/试跑/续跑/人工保留动作） |
| 动态上下文：质量门命令与阈值（`tsc`、测试命令、build、R_eff 阈值、Lighthouse 分数等） | 执行契约文件：`LOOP-执行契约-<date>.md`（九块全文落盘，放任务目录旁；实例 `LOOP-执行契约-2026-07-07.md`） |
| 动态上下文：自主边界与项目红线（可自决项 vs 永不自动项：部署/对外发布/删数据/花钱） | 终报：`EXECUTION-REPORT-<date>.md`（模板参数表示例 `EXECUTION-REPORT-2026-07-07.md`，009 真实例子 `EXECUTION-REPORT-2026-07.md`），含逐件评分表（ID/R_eff/状态判定/commit/偏差数）+ 各波回归门结果 + 决策附录 + 遗留项与后续建议 |
| 任务形态判断输入：有限队列 / 目标收敛 / 监视外部 / 常驻流水 | 队列进度表更新：`requirements/00-INDEX.md` 的「实施进度 / 收口表」（Status 终态枚举 {Implemented, Spec-Premise-Stale, Deferred-Non-Blocking}） |
| 共享文件热点表（HOTFILE_TABLE，必填，防并行写冲突） | 收口记录：写入每个 spec 的 `03-tasks.md` 尾部「## 收口记录」段（状态判定 + 验证证据 + 偏差清单），复用模板已预置字段 |
| 决策依据源（DECISION_SOURCE，如决策台账 §4 拍板值的绝对路径） | 监视类留痕日志示例：`.claude/pr-142-loop-log.md`（每个实际处理的变化追加一行） |
| 目标 specs 收口记录模板里实际存在的状态字段名（STATUS_FIELD，需先 `grep` 确认，禁臆造） | — |
| 执行参数：CONTRACT_PATH、BRANCH、REPO、SPECS_DIR、QUEUE_FILE、WAVE_PLAN、QUALITY_GATES、FORBIDDEN、FORBIDDEN_CRITICAL、REPORT_PATH、TURN_CAP（其中的路径类参数必须为绝对路径，禁止相对路径与省略号） | — |
| 用户没主动给时，由 skill 主动收集：读状态表、ls 队列目录、查质量门命令 | — |

## 目录结构

```
skills/loop-prompt-generator/
├── SKILL.md                                  # skill 主文件：frontmatter description、Quick Reference、
│                                             # 四类 loop 速查表、Standard Workflow 五步、旗舰场景要点、
│                                             # ALWAYS/NEVER Critical Rules、References 索引、Changelog（v1.0–v1.3）
├── references/
│   ├── loop-types.md                         # 官方 loop.pdf（ClaudeDevs《Getting started with loops》）蒸馏：
│   │                                         # Turn/Goal/Time/Proactive 四类详解、代码质量维护 4 条、
│   │                                         # token 用量管理 6 条、选型总表
│   └── project-lessons.md                    # 101code 项目长跑实战教训 19 条
│                                             # （A 进度与恢复 / B 质量门 / C 并发与冲突 / D 决策与边界 /
│                                             # E 008 端到端首跑实证）；多数条（19 条中 14 条）附「落法」小段
│                                             # 说明该写进提示词哪一块，第 8/9/14/15/18 条改用表格或要点给出
└── templates/
    ├── spec-batch-execution.template.md      # 旗舰模板：参数清单表 + 短 /goal 骨架（≤4000 字符）+
    │                                         # 执行契约九块骨架 + 009 支付链路 28 套 specs 真实填充示例 + 操作手册
    ├── goal-loop.template.md                 # 通用 /goal 目标收敛模板（五块：目标句/验证方式/工作方式/
    │                                         # 禁止事项/完成动作）+ 要点 + 填充示例
    ├── time-loop.template.md                 # /loop 与 /schedule 监视/例行模板（monitor 型五块骨架 +
    │                                         # /schedule 例行型骨架 + 要点 + 填充示例）
    └── examples/
        └── 009-contract-example.md           # 随 skill 分发的完整填充范例：009 支付链路 28 套 specs
                                              # 执行契约九块全文（Wave 1-5、4 处漂移注记、42 项拍板依据源、
                                              # blocked-env 降级、状态字段对齐「状态判定」）
```

## 注意事项

- `/goal` 条件硬上限 4000 字符（2026-07-07 实测，009 首跑 4811 字符被运行时直接拒绝 `Goal condition is limited to 4000 characters`）；生成后必须用 `wc -m` 实测 ≤ 4000，超限走契约文件模式。
- 契约间接层四条自伤（对抗验证实锤，必须规避）：(1) 评估模型只读 `/goal` 不读契约 → `/goal` 判据里路径必须全绝对（相对短名评估器不可解析，守门退化成信 agent 自报）；(2) 违反即不可逆的红线只放契约会被 compact 掉 → 必须回显进 `/goal` 常驻（挑 1-4 条）；(3) 判据字段名必须对齐磁盘既有模板（009 臆造「最终状态」而磁盘实为「状态判定」五态，磁盘 0/28 命中 → 守门永假 → loop 空转到 turn cap），生成前必须 `grep` 确认真实字段名与取值集；(4) `/goal` 里「读契约」等过程祈使要与「完成判据」句法分区（用 `[执行前提，非停止判据]` / `[完成判定，只守这四项纯磁盘事实]` 显式分区），否则评估模型可能误当永不满足的完成门。
- 契约稳健性与内联相当，不优于内联（都靠指针存活，且多一个「重读被跳过」的失败点）—— 唯一理由是 4000 上限，能内联就内联。skill 明确把 v1.1 的「契约优于内联」定性为 overclaim 并修正。
- 停止条件三要素缺一不合格：完成判据（磁盘可验证）、质量门（机械可执行 + 阈值）、上限阀（显式轮次/时间）。反例→正例：「全部做完」→「28 个 `03-tasks.md` 收口记录「状态判定」字段已填终态词」；「保证质量」→「每件 R_eff ≥ 0.95（机械 min 禁手调）+ 每波 `tsc`/全量测试/build 三绿」。
- NEVER 用模糊停止条件（「做完为止」「质量足够好」）—— 评估模型无法判定，循环会提前退出或永不退出。
- NEVER 让进度只存在于对话里 —— compact 后队列即丢。
- NEVER 在提示词里省略质量门命令 —— 「保证质量」没有命令支撑 = 没有质量门。
- NEVER 生成会并行写同一热点文件的循环 —— 共享文件冲突会互相覆盖（热点表强制同热点的件串行）。
- NEVER 把「跑到上限」当失败处理 —— 恢复协议 + 重发同一提示词即续跑，上限命中 = 续跑信号。
- 无收口记录 = 未收口：完成的唯一证据是写进文件的收口记录，不是对话宣布；收口状态字段仍为占位符即视为未收口。
- R_eff = min(D1..D5) 机械计算，禁止手工上调；修复历程（`PARTIAL→已修复`、`FAIL→已修复` 等五态词汇）写进证据栏，不混入状态值，否则评估模型无法机械裁决（「FAIL→已修复」既不在通过集也不在失败集）。
- 不可逆/对外动作永不进自主范围：部署（生产/灰度）、对外发布、删数据、真实付费操作 —— 即使用户说「全部自动」也保持人工确认；默认禁 `git push`，推送须用户显式授权并写进提示词本体（操作手册不随 `/goal` 进 agent 上下文，边界必须写在提示词里）。
- 防降标固定条款不可删改：禁止删除/skip/放宽测试或断言来变绿；禁止篡改 R_eff 维度定义或评分口径；期望值取应然态，禁 pin 当前观察值（pin 观察值会把 bug 固化成规范）。
- 运行中工作流绝不干预（008 假绿竞速红线）：`TaskList 空 ≠ 工作流死`，必须凭完成通知/终报落盘判定真结束才动同一工作树；宁等勿抢。
- 并发安全：单件循环里每个原子改动落地即 commit，不留长期未提交工作树（008 期间同分支另一 loop 的广域 `git add .` 两次扫走未提交编辑）；这条与「默认禁 push」不冲突。
- 五类中断必须分类处置（008 一轮全遇到）：周配额硬上限 → 主线程 solo 降级；并发破坏性 git → 待并发方收口后恢复；auth 掉线 → 先发 ALIVE 探针再 resume；会话/5h 限额 → 先盘磁盘再补 commit；误判工作流死 → 不动。黄金纪律：撞任何限先盘磁盘再动手。「Connection closed mid-response」是瞬时网络错误而非配额，单发补跑即可。
- stale + deferred 合计须设显式上限（008 用 ≤4，实际 2/12；旗舰模板建议 ≤3）—— 堵住「把做不动的件全标 deferred 提前退出」的后门。
- 契约文件/终报/短 goal 必须声明「只读、非实施对象」，否则落在被反复 commit 的目录里可能被 agent 好心改坏（恢复锚点污染）；对抗验证/前提复核的结论要写进收口记录，否则在守门通道零足迹、可被静默跳过。
- 环境预检不可省：探测 DB/服务可用性，不可用先自行启动，仍不可用时该波门记 blocked-env、降级执行其余门并显著标注 —— 禁止静默跳过。
- 所有路径参数必须为绝对路径，禁止相对路径与省略号（compact 后 agent 只剩提示词本身，相对路径无法恢复）。
- `/loop` 跑在本机（关机即停），要无人值守上云用 `/schedule`；`/loop` 不带间隔 = 动态节奏模式，agent 自定下次唤醒时机。PDF 明确标注 `/schedule` 与 dynamic workflows 为 research preview，生成 proactive 类提示词时要提醒用户确认可用性。
- 若下游 skill 有确认门，要在提示词里显式声明授权模式（`/goal` 常设授权会激活下游 skill 的批量授权模式），否则循环会卡在确认门上等人。
- 模板内部日期格式不一致（事实）：参数清单示例为 `EXECUTION-REPORT-2026-07-07.md`，009 真实填充示例为 `EXECUTION-REPORT-2026-07.md`；终报路径须与 CONTRACT_PATH 对齐。

## 安装

复制方式：

```bash
cp -r skills/loop-prompt-generator ~/.ai-config/skills/
```

推荐 symlink（改仓库即生效，无需重新复制）：

```bash
ln -s "$(pwd)/skills/loop-prompt-generator" ~/.ai-config/skills/loop-prompt-generator
```

说明：

- 纯提示词型 skill，无构建、无脚本目录（该 skill 目录下没有 `scripts/`，只有 `SKILL.md` + `references/` + `templates/`），目录内没有 `SOURCE-NOTE.md`。
- skill 仅靠 YAML frontmatter 的 `description` 触发，改它等于改触发条件。
- 运行依赖宿主 AI Code Assistant 的原语：`/goal`、`/loop`、`/schedule`、`/workflows`、`/usage`、`/model`；skill 自身不引入任何外部包（无运行时依赖）。
- v1.2 起把填充范例收进 `templates/examples/009-contract-example.md` 随分发，不再依赖仓库外绝对路径。
- 使用时两个硬性动作：生成 `/goal` 后用 `wc -m` 实测字符数；生成收口字段前先 `grep` 目标 spec 模板确认真实字段名。
- skill 正文为中文，loop 原语/状态词/命令关键字保留英文；正文里出现的 `/Users/ameureka/...` 均为 009 项目的历史示例路径，仅为参考，实际使用需替换为本机绝对路径。

License: MIT
