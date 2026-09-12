# Loop 类型详解（官方 loop.pdf 蒸馏）

> 来源：ClaudeDevs《Getting started with loops》（_skills/loop.pdf，2026-07 存档）。
> 官方定义：**loops = agents repeating cycles of work until a stop condition is met**。
> 分类维度：如何触发 / 如何停止 / 用什么 Claude Code 原语 / 适合什么任务。
> 总原则：不是所有任务都需要复杂 loop——从最简单的方案开始，按需取用这些模式。

---

## 1. Turn-based loops（回合制）

- **触发**: 一条用户提示
- **停止**: Claude 判断任务完成或需要更多上下文
- **适用**: 不属于常规流程/日程的较短任务
- **用量管理**: 写具体的提示词；用 skills 改进验证以减少轮数

每条提示都开启一个由你逐轮把关的手动循环：Claude 收集上下文 → 行动 → 检查工作 → 必要时重复 → 响应（agentic loop）。

**关键杠杆：把你的人工检查步骤编码成 SKILL.md**，让 Claude 端到端自查。skill 应包含让 Claude 能"看到、测量、交互"结果的工具/连接器。**检查越量化，越容易自我验证**。

官方示例（verify-frontend-change skill）：
```markdown
---
name: verify-frontend-change
description: Verify any UI change end-to-end before declaring it done.
---
# Verifying frontend changes
Never report a UI change as complete based on a successful edit alone. Verify:
1. Start the dev server and open the edited page in the browser.
2. Interact with the change directly. For a new control (button, input, toggle)...
3. Check the browser console: zero new errors or warnings.
4. Use the Chrome Devtools MCP, run a performance trace and audit Core Web Vitals...
If any step fails, fix the issue and rerun from step 1 — do not hand back partial work.
```

---

## 2. Goal-based loop（/goal）

- **触发**: 一次手动提示
- **停止**: 目标达成 OR 达到你定义的最大轮次
- **适用**: **有可验证退出条件的任务**
- **用量管理**: 设定具体完成判据 + 显式轮次上限（"stop after 5 tries"）

机制：你定义 done 长什么样后，Claude 不必自行判断"够好了没"而提前结束。**每次 Claude 试图停止时，一个评估模型（evaluator model）检查你的条件，不满足就把它送回去继续干**，直到目标达成或轮次用尽。

**确定性判据（deterministic criteria）最有效**：通过的测试数、清过某个分数阈值等。

官方示例：
```bash
/goal get the homepage Lighthouse score to 90 or above, stop after 5 tries.
```

---

## 3. Time-based loop（/loop 与 /schedule）

- **触发**: 指定时间间隔
- **停止**: 你取消，或工作完成（PR 合了、队列空了）
- **适用**: 例行工作，或与外部环境/系统交互
- **用量管理**: 拉长间隔；尽量按事件而非时间反应

适合两类：任务不变只有输入在变（每天早上总结 Slack）；依赖外部系统（按间隔检查 PR 的 review/CI 变化并反应）。

官方示例：
```bash
/loop 5m check my PR, address review comments, and fix failing CI
```

`/loop` 跑在你的电脑上——关掉即停。要挪到云端，用 `/schedule` 建 routine。

> 补充（Claude Code 运行时行为）：`/loop` 不带间隔 = 动态节奏模式，agent 自行决定下次唤醒时机。

---

## 4. Proactive loops（主动式）

- **触发**: 事件或日程，无人实时在场
- **停止**: 每个任务达成目标即退出；routine 本身直到你关闭
- **适用**: 定义清晰的重复工作流：bug 报告、issue 分诊、迁移、依赖升级
- **用量管理**: 例行环节路由到更小更快的模型，判断环节用最强模型

组合拳（处理持续进来的反馈）：
1. `/schedule`（research preview）跑定时 routine 检查新报告
2. `/goal` 定义 done + skills 定义怎么验证
3. dynamic workflows（research preview）编排 agent 分诊、修复、评审
4. auto mode 让 routine 不停下来要权限

> 注意：PDF 明确标注 `/schedule` 与 dynamic workflows 为 **research preview**——功能可能变动或在部分环境不可用，生成 proactive 类提示词时提醒用户确认可用性。

官方示例：
```bash
/schedule every hour: check the project-feedback channel for bug reports. /goal ...
```

---

## 维护代码质量（loop 输出质量取决于围绕它的系统）

1. **保持代码库本身干净** — Claude 遵循代码库里已存在的模式与约定
2. **给 Claude 自我验证的手段** — 用 skills 编码"好的样子"
3. **让文档触手可及** — 框架/库文档就位
4. **用第二个 agent 做代码评审** — 新鲜上下文的评审者更少偏见、不受主 agent 推理影响（内置 /code-review skill）

（PDF 收尾原则，原文为段落非 bullet）个别结果不达标时，不要只修个案——把它编码进系统，让所有后续迭代受益。

## 管理 token 用量（loop 要有清晰边界）

1. **选对原语和模型** — 小任务不需要多 agent/loop；有些任务可用更便宜更快的模型
2. **定义清晰的成功与停止判据** — 对 done 越具体，Claude 越早收敛（但不会过早）
3. **大规模前先试跑** — dynamic workflows 可能孵出数百 agent，先在小切片上估算用量
4. **确定性工作用脚本** — 跑脚本比逐步推理便宜（如 PDF skill 附带表单填充脚本，每次直接跑而非重新推导）
5. **routine 频率不要超过所需** — 间隔匹配被监视事物的实际变化频率
6. **复查用量** — `/usage` 按 skills/subagents/MCPs 分解；`/goal`（无参数）看轮次与 token；`/workflows` 看每个 agent 的用量并可随时停掉

## 选型总表

| Loop | 你交出的 | 适用时机 | 用什么 |
|------|---------|---------|--------|
| Turn-based | The check | 你在探索或决策中 | 自定义验证 skills |
| Goal-based | The stop condition | 你知道 done 长什么样 | `/goal` |
| Time-based | The trigger | 工作发生在项目之外/按日程 | `/loop`、`/schedule` |
| Proactive | The prompt | 工作重复且定义清晰 | 以上全部 + dynamic workflows |

入门路径：看你已经在做的工作，挑一个你是瓶颈的任务，问哪一环可以交出去——验证检查写得出来吗？目标够清晰吗？工作按日程到达吗？有想法就跑起来，观察它在哪里卡住或过度伸手，大胆迭代。

更多信息见 Claude Code 官方文档：running agents in parallel，以及 loop / schedule / goal / dynamic workflows 各页。
