# 模板：大批量 Specs 无人值守执行 loop（旗舰）

> 适用：有限队列型长跑——N 套 specs/任务要全部执行完，质量达标，中断可续，最终出报告。
> 原语：`/goal`（评估模型守停止条件）。
>
> **⚠️ 双产物模式（v1.1，/goal 4000 字符上限实锤）**：本模板产出**两个文件**——
> 1. **执行契约**（`LOOP-执行契约-<date>.md`，放任务目录旁）：九块全文落盘，抗 compact 的磁盘真相源
> 2. **paste-ready /goal**（≤ 4000 字符，`wc -m` 实测）：契约绝对路径指针 + 内联精简停止条件（评估模型据此守门）+ 上限阀 + "开工与每次恢复第一步=完整重读契约"
>
> 使用方法：把「九块参数」填入下方骨架生成契约文件，再按「短 /goal 骨架」生成粘贴文本。文末附 009 支付链路 28 套 specs 的真实填充示例。

---

## 参数清单

> **校验项：所有路径参数必须为绝对路径，禁止相对路径与省略号**——compact 后 agent 只剩提示词本身，相对路径无法恢复。

| 参数 | 说明 | 示例 |
|------|------|------|
| `{{CONTRACT_PATH}}` | 执行契约文件绝对路径（产物 1 落盘位置） | `/Users/me/.../LOOP-执行契约-<date>.md` |
| `{{BRANCH}}` | 允许本地 commit 的唯一分支名 | feat/xxx |
| `{{REPO}}` | 代码库绝对路径 + 分支 | `/Users/me/code/token101-v2.1` @ feat/xxx |
| `{{SPECS_DIR}}` | specs 根目录绝对路径 | `/Users/me/code/013-专项/009-支付链路优化/requirements-specs` |
| `{{QUEUE_FILE}}` | 队列真相源（进度表）绝对路径 | `/Users/me/code/013-专项/009-支付链路优化/requirements/00-INDEX.md` 实施进度表 |
| `{{WAVE_PLAN}}` | 执行顺序（波次/优先级） | Wave 1..5 逐波 |
| `{{HOTFILE_TABLE}}` | 共享文件热点表位置（必填，防并行写冲突） | 同 QUEUE_FILE 内「共享文件热点表」 |
| `{{DECISION_SOURCE}}` | 自主决策依据源（绝对路径） | `/Users/me/.../00-总览与决策台账.md` §4 拍板值 |
| `{{QUALITY_GATES}}` | 回归门命令清单 + 评分阈值 + 环境预检 | tsc/test/build + R_eff ≥ 0.95 + DB 预检 |
| `{{STATUS_FIELD}}` | **目标 specs 收口记录模板里实际存在的状态字段名**（禁臆造；先 grep 确认） | `状态判定`（ameureka-spec-dev 五态） |
| `{{FORBIDDEN}}` | 禁止事项全量（项目红线；防降标/git 边界/契约完整性为骨架内置，不可删） | 禁部署/禁改标识符… |
| `{{FORBIDDEN_CRITICAL}}` | 从 FORBIDDEN 里挑"违反即不可逆"的 1-4 条，回显进短 /goal 常驻条件 | 禁改遗留标识符(R4)/禁 SQL 改余额 |
| `{{REPORT_PATH}}` | 终报输出路径（绝对路径，带满日期与 CONTRACT_PATH 对齐） | `/Users/me/.../EXECUTION-REPORT-2026-07-07.md` |
| `{{TURN_CAP}}` | 轮次上限 | stop after 150 turns |

---

## 短 /goal 骨架（产物 2：粘贴文本，≤ 4000 字符）

> 结构分区（对抗验证教训）：评估模型只读 /goal、不读契约，所以 /goal 必须**判据自包含**——判据里凡引用路径一律**绝对路径**（禁相对短名/省略号），字段名对齐磁盘既有模板（禁臆造）。「读契约/红线」是 preamble/约束、不是完成判据，须与判据句法隔离，否则评估模型可能把过程祈使误当永不满足的完成门。

```
按执行契约 {{CONTRACT_PATH，绝对路径}} 实施其登记的全部 {{N}} 套 specs，{{TURN_CAP}}。

[执行前提，非停止判据] 开工第一步与每次中断/compact 后恢复的第一步：完整阅读该契约并遵守其九块条款（契约是磁盘真相源）。契约、本 goal、终报三文件只读、非实施对象。硬红线（违反不可逆，常驻守）：{{FORBIDDEN_CRITICAL：1-4 条违反即不可逆的项目红线摘要，如禁改遗留标识符/禁 SQL 改余额}}；禁删/skip/放宽测试变绿；只本地 commit {{REPO}} 代码到 {{BRANCH}}，禁 push/切分支/碰 main；禁部署/真实切换。

[完成判定，评估模型只守这四项纯磁盘事实] 完成当且仅当四项全真：(i) {{SPECS_DIR，绝对路径}} 下 {{N}} 份 03-tasks.md 的收口记录「{{STATUS_FIELD}}」字段均已填为有效终态词（非占位符）；(ii) 每份收口记录含 R_eff 数值（达标件 ≥ {{SCORE}}）+ 回归门输出摘要 + 对抗验证结论行 + 前提复核结论行，任一缺失视为未收口；(iii) 跳过态（stale+deferred）合计 ≤ {{MAX_SKIP}}；(iv) {{QUEUE_FILE，绝对路径}} 收口表 {{N}} 行 Status 全为终态，且终报 {{REPORT_PATH，绝对路径}} 已写出。停止条件权威源为契约【7】，本处为其副本，改动须两处同步。
```

> 生成后 `wc -m` 实测 ≤ 4000（含绝对路径也远够用）；判据 (i)-(iv) 必须与契约【7】逐项语义一致（评估模型只看这里、契约是细则）。
> `{{STATUS_FIELD}}`：**必须核对目标 specs 收口记录模板里实际存在的状态字段名**（如 ameureka-spec-dev 生成的「状态判定」五态），禁自造新字段名——否则守门找不到字段、停止条件永假、loop 空转。
> `{{FORBIDDEN_CRITICAL}}`：只挑"违反即不可逆"的红线回显进 /goal（因它随 goal 常驻、抗 compact）；完整清单仍留契约【8】。

## 执行契约骨架（产物 1：九块全文，落盘为 LOOP-执行契约-<date>.md）

```
（文件头注明：本文件是 /goal 引用的执行契约；执行 agent 开工与每次恢复第一步=完整阅读本文件；本契约文件只读——禁修改、禁把契约/短goal/终报当待实施 spec）

【1 目标与范围】
按 {{QUEUE_FILE}} 登记的 {{N}} 套 specs 全部实施完毕。每套 spec 的任务清单在其 03-tasks.md，设计在 02-design.md，需求在 01-requirements.md。代码库：{{REPO}}（含分支名）。

【2 队列真相源】
{{QUEUE_FILE}} 的实施进度表是唯一队列与进度依据。队列 = 磁盘状态，不是对话记忆。每完成一套立即更新该表；Status 终态枚举 = {Implemented, Spec-Premise-Stale, Deferred-Non-Blocking}，三种终态都算"该行已更新"。收口表 Status ↔ 收口记录「{{STATUS_FIELD}}」映射：达标态 ↔ Implemented；spec-premise-stale ↔ Spec-Premise-Stale；deferred-non-blocking ↔ Deferred-Non-Blocking。

【3 单件循环（顺序固定，禁跳步）】
共享文件热点表见 {{HOTFILE_TABLE}}。实施默认波内逐件串行；仅当两件的热点文件集不相交时才允许并行；对抗验证子 agent 一律只读不写。按 {{WAVE_PLAN}} 逐波推进，波内每件：
a. 前提复核（Step 6.0）：该 spec 全部 file:line 锚点/键名/数量断言对当前 HEAD 重验；前提复核结论（全成立/漂移逐条）写入收口记录；无害漂移按现状实施并在偏差清单留痕；语义级冲突才允许标 spec-premise-stale——且必须在收口记录引用具体冲突证据（file:line + 冲突描述），然后跳到下一件（终报列出）。
b. 按 03-tasks.md 逐任务实施（Task 0 即前提复核）。涉及 migration 的件：生成迁移后必须 db:migrate 应用到本地库，再跑集成测试。
c. 对抗验证：实施完成后用新鲜上下文的子 agent 专门找茬（正确性/回归面/红线合规），发现问题修复后重验；对抗验证结论（finding 计数 + 是否全部修复）写入收口记录，作为守门可见的磁盘足迹。
d. 质量评分：对照 01/02 做实施后 FPF 复核，R_eff = min(D1..D5) 机械计算禁手调，必须 ≥ {{SCORE}}；不足先修复再重评，本件内闭环。
e. 波内回归门：{{QUALITY_GATES}}，转红即修，绿了才 commit（Conventional Commits）。
f. 收口记录：**复用该 spec 03-tasks.md 已预置的收口记录段（勿另立新字段，字段名对齐磁盘模板）**，把占位符替换为实值。守门必填：「{{STATUS_FIELD}}」填有效终态词（达标态 / 跳过态之一，非占位）；「验证证据」含 R_eff 数值（达标件 ≥ {{SCORE}}）+ 回归门输出摘要 + 对抗验证结论行 + 前提复核结论行；偏差清单留痕。写完同步更新队列真相源。收口状态字段仍为占位 = 未收口。跳过态（stale/deferred）准入：spec-premise-stale 须引用语义冲突证据；deferred-non-blocking 仅限 spec 自身标注 non-blocking 的任务/件，须写明依据。

【4 质量门】
{{QUALITY_GATES 展开：命令逐条 + 触发条件 + 环境预检}}
环境预检（第一件开工前）：探测依赖环境（DB/服务）可用性；不可用则先自行启动（项目启动脚本）；仍不可用时该波受影响的门记 blocked-env、降级执行其余门，并在收口记录与终报显著标注——禁止静默跳过。

【5 决策政策】
遇到实施决策：依据序列 = {{DECISION_SOURCE}} > specs 工作假设 > 项目红线下的保守选项。与依据源一致的直接执行；超出依据源的选保守项并记入终报决策附录。禁止停下来等人（{{TURN_CAP}} 内）。

【6 中断恢复协议】
任何中断/compact/上限命中后重新进入时：第一步重读本契约全文；第二步读 {{QUEUE_FILE}} 进度表；第三步逐件盘磁盘实态（收口记录「{{STATUS_FIELD}}」是否已填实值、文件是否已写），已完成的直接登记；绝不重做已收口件。自检命令：grep 计数 {{SPECS_DIR}}/*/*/03-tasks.md 中「{{STATUS_FIELD}}」后已填终态词的份数，对照进度表（判定以字段是否填了实值为准，非标签是否存在）。"Connection closed" 类瞬时错误重试当前件即可。

【7 停止条件】（**本节为 /goal 内联停止条件的权威源；短 goal 的 (i)-(iv) 是其副本，任何改动两处同步**）
同时满足四项：(i) 全部 {{N}} 套 specs 的 03-tasks.md 收口记录「{{STATUS_FIELD}}」字段均已填为有效终态词（非占位）；(ii) 每件含 R_eff 数值（达标件 ≥ {{SCORE}}）+ 回归门输出摘要 + 对抗验证结论行 + 前提复核结论行，任一缺失视为未收口；(iii) 跳过态（stale + deferred）合计 ≤ {{MAX_SKIP，建议 3}}，超过即视为未完成（终报列为异常升级并继续处理）；(iv) {{QUEUE_FILE}} 收口表 {{N}} 行 Status 全为终态（终态取值集见【2】），且 {{REPORT_PATH}} 终报已写出。

【8 禁止事项】
契约完整性（固定条款，不可删改）：本契约/短 goal/终报均只读、非实施对象——禁当待实施 spec；契约文件禁修改（进度只写 {{QUEUE_FILE}} 与各 spec 收口记录）。
防降标（固定条款，不可删改）：禁止删除/skip/放宽测试或断言来使回归门变绿；禁止篡改 R_eff 维度定义或评分口径；期望值取应然态，禁 pin 观察值。
git 边界（固定条款，不可删改）：只允许本地 commit {{REPO}} 内代码改动到指定分支；禁止 git push；禁止切换/新建分支；禁止触碰 main。若过程真相文件（契约/终报/队列/收口记录）与 {{REPO}} 非同一 git 树，落盘即生效、默认不纳入代码 commit。
{{FORBIDDEN 展开：项目红线}}

【9 终报】
写 {{REPORT_PATH}}：逐件评分表（ID/R_eff/{{STATUS_FIELD}}/commit/偏差数）、各波回归门最终结果（含 blocked-env 标注）、决策附录（每个自主决策一行：决策点/选择/依据）、遗留项与后续建议。
```

---

## 真实填充示例：009 支付链路 28 套 specs（2026-07-07 基线，双产物）

> 前提状态：42 项决策已全部拍板（决策台账 §4，拍板值 = specs 工作假设，零偏离）；Wave 1 五 spec 已过前提复核（4 处无害漂移已注记进契约【3.a】）。执行模型：Opus。
> **实战教训（两轮对抗验证）**：(1) 首跑九块全文内联进 /goal（4811 字符）被运行时拒绝 `Goal condition is limited to 4000 characters` → 改双产物。(2) 契约用臆造字段「最终状态」，磁盘 spec 收口记录实为「状态判定」五态 → 停止条件永假 loop 空转 → 字段名对齐磁盘。(3) 短 goal 用相对路径/丢红线 → 评估模型守不住 → 判据全绝对路径 + 红线回显。

**产物 1（执行契约，九块全文）**：随本 skill 分发的完整填充范例见 [`examples/009-contract-example.md`](examples/009-contract-example.md)（即本模板契约骨架的 009 完整填充：Wave 1-5 成员、4 处漂移注记、42 项拍板依据源、blocked-env 降级、契约完整性+防降标+git 边界+项目红线、状态字段对齐「状态判定」）。项目内实跑副本落在 `<009 专项目录>/LOOP-执行契约-2026-07-07.md`。

**产物 2（paste-ready /goal，1152 字符实测 ≤ 4000）**：

```
按执行契约 /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/LOOP-执行契约-2026-07-07.md 实施其登记的全部 28 套 specs，stop after 150 turns。

[执行前提，非停止判据] 开工第一步与每次中断/compact 后恢复的第一步：完整阅读该契约并遵守其九块条款（契约是磁盘真相源）。契约、本 goal、终报三文件只读、非实施对象。硬红线（违反不可逆，常驻守）：禁重命名遗留标识符 hotpricing/HOTPRICING_*/PROMO_FIRST_TOPUP_20/activation_hot_199（R4）；禁 SQL 直改余额；禁硬编码域名（走 getBaseUrl()/env）；禁 en/zh key 不对称；禁删/skip/放宽测试变绿；只本地 commit token101-v2.1 代码到 feat/finance-compliance-hub-specs，禁 push/切分支/碰 main；禁部署/canary/真实 live 切换。

[完成判定，评估模型只守这四项纯磁盘事实] 完成当且仅当四项全真：(i) /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/requirements-specs 下 28 份 03-tasks.md 的「## 收口记录」段「状态判定」字段均已填为五态之一（PASS / PARTIAL→已修复→PASS / FAIL→已修复 / spec-premise-stale / deferred-non-blocking，非占位符）；(ii) 每份收口记录「验证证据」含 R_eff 数值（达标件 ≥ 0.95）+ 回归门输出摘要 + 对抗验证结论行 + 前提复核结论行，任一缺失视为未收口；(iii) 状态判定为 spec-premise-stale 或 deferred-non-blocking 的合计 ≤ 3；(iv) /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/requirements/00-INDEX.md 收口表 28 行 Status 全为终态（Implemented/Spec-Premise-Stale/Deferred-Non-Blocking），且终报 /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/EXECUTION-REPORT-2026-07.md 已写出。停止条件权威源为契约【7】，本处为其副本，改动须两处同步。
```

### 操作手册（随提示词交付给用户）

- **模型**：`/model opus` 后粘贴（长跑执行档；本提示词生成期用的最强模型不必延续到执行期）。
- **环境**：开跑前本地 Postgres 起好（`psql postgresql://postgres:postgres@localhost:5432/token101 -c 'select 1'` 通）省一次 blocked-env 降级；不起也能跑（提示词已带降级分支）。
- **监控**：`/goal`（无参数）看轮次与 token；`/workflows` 看子 agent；`/usage` 看用量分布。
- **试跑**：Wave 1 第一件（BL-001）完成后建议人工抽查一次收口记录与 diff，再放手。
- **续跑**：150 turns 用尽或会话中断 → 原样重发同一 /goal 提示词（恢复协议保证从磁盘续跑，幂等）。
- **人工保留动作**：git push、灰度/生产部署、真实 live 切换——loop 结束后按终报清单人工执行。
