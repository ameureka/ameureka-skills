# 009 支付链路 28 套 Specs — 执行契约（/goal 引用的磁盘真相源）

> 本文件是 `/goal` 执行提示词引用的**执行契约**：/goal 条件受 4000 字符上限约束，只装指针+精简判据+上限阀；全部操作条款在此文件。
> **本契约文件只读——执行 agent 禁止修改本文件、禁止把本契约/短 goal/终报当作待实施 spec；进度只写 00-INDEX 收口表与各 spec 的收口记录。**
> 执行 agent：开工第一步与每次中断/compact 后恢复的第一步 = **完整阅读本文件**，严格遵守九块条款。
> 生成：2026-07-07（loop-prompt-generator v1.2 契约文件模式，字段名对齐磁盘），内容经两轮共 37 findings 三视角对抗验证闭环。

---

【1 目标与范围】
按 /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/requirements/00-INDEX.md「实施进度 / 收口表」登记的 28 套 specs（BL-001..007 / UI-001..006 / INT-001..003 / SEC-001..005 / CODE-001 / OPS-001..005 / QA-001）全部实施完毕。每套 spec 四件套在 requirements-specs/{层}/{ID}-{slug}/01..04。代码库：/Users/ameureka/Desktop/101code/token101-v2.1（分支 feat/finance-compliance-hub-specs）。

【2 队列真相源】
上述 00-INDEX.md 的「实施进度 / 收口表」是唯一队列与进度依据；队列 = 磁盘状态，不是对话记忆。每完成一套立即更新该行：Status 从 Specs-Generated 推进为终态之一 {Implemented, Spec-Premise-Stale, Deferred-Non-Blocking}（三种终态都算"该行已更新"），并填实施 commit / 收口记录指针 / 验证证据三列。收口表 Status 终态 ↔ 收口记录「状态判定」映射：达标（PASS / PARTIAL→已修复→PASS / FAIL→已修复）↔ Implemented；spec-premise-stale ↔ Spec-Premise-Stale；deferred-non-blocking ↔ Deferred-Non-Blocking。

【3 单件循环（顺序固定，禁跳步）】
共享文件热点表见 00-INDEX.md「共享文件热点表」（stripe.ts 被 6 个 spec 触碰，另有 settings-registry/runtime-controls、messages/{en,zh}.json、cron.d、src/credits/**、schema-token101.ts）。实施默认波内逐件串行；仅当两件热点文件集不相交时才允许并行实施；对抗验证子 agent 一律只读不写。按 00-INDEX.md「波次实施计划」逐波推进：Wave 1（BL-001→BL-002→BL-003→OPS-002→QA-001，全串行——BL-001/BL-002/BL-003 均触碰 stripe.ts，热点表合并者模式）→ Wave 2（BL-007, OPS-005, BL-004, BL-006, BL-005, OPS-001）→ Wave 3（INT-001, INT-002, UI-005）→ Wave 4（SEC-001..005, UI-006, OPS-003, INT-003, UI-001）→ Wave 5（UI-002, UI-003, UI-004, CODE-001, OPS-004）。波内每件：

a. 前提复核（Step 6.0）：锚点对当前 HEAD 重验。Wave 1 五件已复核通过（2026-07-07），直接采用 4 处无害漂移：BL-002 updateOneTimePayment=:3131；DB 集成参照测试实名 hotpricing-weekly-grant-db.test.ts；QA-001 uidx=schema.ts:365（credit_transaction_payment_id_type_uidx，spec 原写 :366）；OPS-002 cron.schedule 注册数 spec 基线 10 → 当前 HEAD 实测 13（Task 0 按 13 采用）。其余波实施前必须现场复核，尤其被早波触碰过的 stripe.ts/settings-registry.ts 锚点。前提复核结论（锚点全成立 / 漂移逐条）写入收口记录。无害漂移按现状实施并在偏差清单留痕；语义级冲突才允许标 spec-premise-stale，且收口记录必须引用具体冲突证据（file:line + 冲突描述），然后跳到下一件。

b. 按 03-tasks.md 逐任务实施。涉及 migration 的（OPS-001/BL-006/OPS-005，与 00-INDEX 跨切面告警一致；OPS-002 零迁移）：pnpm db:generate 生成正式迁移，同波多迁移协调编号，一波一迁移文件优先；生成后必须 pnpm db:migrate 应用到本地库，再跑集成测试。

c. 对抗验证：每件完成后派新鲜上下文子 agent 找茬（资金正确性/幂等/红线 R4R5R6/回归面），发现问题修复后重验。对抗验证结论（子 agent finding 计数 + 是否全部修复/仍存）写入收口记录，作为守门可见的磁盘足迹。

d. 质量评分：实施后 FPF 复核 R_eff = min(D1..D5) 机械计算禁手调，必须 ≥ 0.95；不足先修复再重评，本件内闭环。

e. 波内回归门：pnpm exec tsc --noEmit && pnpm test && pnpm build 三绿；触碰计费/结算/策略门控的波（Wave 1/2）加 pnpm test:integration:api；Wave 3 加 payment-preflight 门（脚本由 INT-001 落地，--expected-mode 按当前环境，INT-001 收口后该波回归门必须含此项）；改 content/docs 的（UI-005）加 pnpm docs:validate。转红即修，绿了才 commit（Conventional Commits，禁把红着的树带进下一件）。

f. 收口记录：**复用该 spec 03-tasks.md 已预置的 `## 收口记录` 段（不另立新字段）**，把占位符替换为实值。守门相关必填字段：
   - **状态判定**（五态词汇，磁盘模板既有字段）：PASS / PARTIAL→已修复→PASS / FAIL→已修复 / spec-premise-stale / deferred-non-blocking，选其一（禁留占位）。达标 = 前三者；跳过态 = 后两者（计入停止条件 iii 的 ≤3 上限）。
   - **验证证据**：须含 R_eff 数值（达标件 ≥ 0.95）+ 回归门命令输出摘要 + **对抗验证结论行**（c 步 finding 计数/结论）+ **前提复核结论行**（a 步锚点重验结果）。
   - **偏差清单**：无害漂移的"等价实施偏差"留痕。
   写完同步更新 00-INDEX 收口表。无收口记录（状态判定仍为占位）= 未收口。deferred-non-blocking 准入：仅限 spec 自身标注 non-blocking 的任务/件，须写明依据。

波间前提复核：下一波开工前对其 specs 锚点重验（BL-001 与 OPS-001 是 structure-first，其下游 UI-001/SEC-005/OPS-003/BL-006 锚点必须重验）。

【4 质量门】
命令见 3.e。环境预检（第一件开工前）：探测本地 Postgres 可用性（psql 'postgresql://postgres:postgres@localhost:5432/token101' -c 'select 1' 或等价）；不可用则先自行启动（原生 PG17/Redis 或 ./scripts/dev-up.sh）；仍不可用时 Wave 1/2 的集成门记 blocked-env、降级为单测+build 双绿，并在收口记录与终报显著标注——禁止静默跳过。commerce/幂等相关单测参照各 spec 内列明的测试文件（如 BL-001 新建 tests/unit/purchase-gate-coverage-matrix.test.ts）；期望值一律取应然态，禁 pin 当前观察值。

【5 决策政策】
全部 42 项决策已拍板（/Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/00-支付链路优化总览与决策台账.md §4，2026-07-07，拍板值=specs 工作假设）。实施中遇到决策：依据序列 = 台账 §4 拍板值 > spec 阻塞决策表工作假设 > 红线（R4 标识符禁写业务数值 / R5 credit=$0.01 汇率仅展示 / R6 订阅判定必经 snapshot-lapse 守卫）下的保守选项。一致则直接执行；超出依据源的选保守项并记入终报决策附录。不停下来等人。

【6 中断恢复协议】
任何中断/compact/上限命中后重新进入：第一步重读本契约全文；第二步读 00-INDEX.md 收口表；第三步逐件盘磁盘（03-tasks.md 的 `## 收口记录` 段「状态判定」字段是否已填实值、代码/测试文件是否已落、git log），已完成的登记不重做。自检命令：`grep -c '状态判定.*\(PASS\|stale\|deferred\)' /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/requirements-specs/*/*/03-tasks.md` 应随进度增长（注意模板段本身含"状态判定"标签行，判定以其后是否填了五态实值为准，不是标签存在与否）。"Connection closed mid-response" 是瞬时网络错误，重试当前件；真限额则收敛当前件到可 commit 状态再停。

【7 停止条件】（**本节为 /goal 内联停止条件的权威源；短 goal 的 (i)-(iv) 是其副本，任何改动必须两处同步**）
同时满足四项：
(i) 28 套 specs 的 03-tasks.md `## 收口记录` 段「状态判定」字段均已填为五态之一（PASS / PARTIAL→已修复→PASS / FAIL→已修复 / spec-premise-stale / deferred-non-blocking，非占位）；
(ii) 每件收口记录「验证证据」含 R_eff 数值（达标件 ≥ 0.95）+ 回归门输出摘要 + 对抗验证结论行 + 前提复核结论行，任一缺失视为未收口；
(iii) 状态判定为 spec-premise-stale 或 deferred-non-blocking 的合计 ≤ 3，超过即视为未完成（终报列为异常升级并继续处理）；
(iv) /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/requirements/00-INDEX.md 收口表 28 行 Status 全部为终态 {Implemented, Spec-Premise-Stale, Deferred-Non-Blocking}（映射见【2】：达标↔Implemented），且终报 /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/EXECUTION-REPORT-2026-07.md 已写出。
四者缺一不算完成。

【8 禁止事项】
契约完整性（固定条款，不可删改）：本契约文件、短 goal 文件、终报文件均只读/非实施对象——禁止把它们当作待实施 spec 处理；契约文件禁修改（进度只写 00-INDEX 收口表与各 spec 收口记录）。
防降标（固定条款）：禁止删除/skip/放宽测试或断言来使回归门变绿；禁止篡改 R_eff 维度定义或评分口径；期望值取应然态，禁 pin 观察值。
git 边界（固定条款）：只允许本地 commit token101-v2.1 内代码改动到 feat/finance-compliance-hub-specs；禁止 git push；禁止切换/新建分支；禁止触碰 main。009 专项目录（含本契约/终报/收口表/收口记录）与代码库非同一 git 提交面，属过程真相落盘即生效，默认不纳入代码 commit。
项目红线（违反不可逆，逐条守）：禁止任何部署动作（deploy-with-verification.sh / canary / 生产 compose 一律不碰；INT-001 只实施 checklist+preflight 接线，永不执行真实 live 切换）；禁止重命名 hotpricing/HOTPRICING_*/PROMO_FIRST_TOPUP_20/activation_hot_199 等遗留标识符（R4）；禁止 SQL 直改余额；禁止硬编码域名（走 getBaseUrl()/env）；禁止把 en.json/zh.json 改出 key 不对称；禁止跳过收口记录宣布完成；DL-5 冻结=本轮禁止在 stripe.ts 私有 createCheckoutSession 实施低层兜底。

【9 终报】
写 /Users/ameureka/Desktop/101code/013-新一轮优化专项/009-支付链路优化/EXECUTION-REPORT-2026-07.md：逐件表（ID/R_eff/状态判定/commit/偏差数）、五波回归门结果（含 blocked-env 标注）、决策附录（每个自主决策一行：决策点/选择/依据）、遗留项（spec-premise-stale 与 deferred 项的处置建议）、下一步建议（灰度发布与 git push 为独立人工动作，列出发布物清单即可）。
