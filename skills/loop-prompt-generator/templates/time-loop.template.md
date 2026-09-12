# 模板：/loop 与 /schedule 监视/例行 loop

> 适用：工作由外部系统或时间驱动——盯 CI/PR、定时对账、例行巡检、持续进来的工作流。
> `/loop` 跑在本机（关机即停）；要无人值守上云用 `/schedule`。`/loop` 不带间隔 = 动态节奏（agent 自定下次唤醒）。

---

## 提示词骨架（monitor 型，五块）

```
/loop {{间隔，如 5m/30m；或留空走动态节奏}} {{监视对象 + 触发时做什么}}

【每 tick 动作】
1. 检查 {{外部状态：命令/URL/文件}}
2. 无变化 → 本 tick 结束（不做多余动作、不重复汇报）
3. 有变化 → {{处理动作，含质量门}}

【停止条件】
{{工作完成态：PR 合并/队列空/全绿}} 时停止 loop 并总结；或由用户手动取消。

【禁止事项】
{{红线 + 防打扰：无变化不产出噪音}}

【留痕】
每次实际处理过的变化，追加一行到 {{日志文件路径}}。
```

## 提示词骨架（/schedule 例行型）

```
/schedule {{频率，如 every hour / every morning 9am}}: {{例行任务一句话}}. /goal {{单次任务的 done 判据}}，stop after {{N}} tries。
```

## 要点

- **间隔匹配事物的真实变化频率**（官方：don't run routines more often than you need）——CI 一轮 ~8 分钟就别 1m 轮询。
- 尽量**按事件而非时间反应**：tick 里先廉价检查（一条命令/一个状态位），无变化立即结束，token 花在真有变化的 tick 上。
- monitor 型的停止条件常是"外部工作完成"（官方示例：the PR merges, the queue is empty）——写清楚，否则 loop 永不自停。
- 例行环节可路由到更小的模型，判断/修复环节用最强模型（proactive loops 的用量管理）。

## 填充示例（官方原型 + 本项目化）

```
/loop 5m 盯 PR #142：处理 review 评论并修复失败的 CI

【每 tick 动作】
1. gh pr view 142 --json state,reviews,statusCheckRollup 检查新 review 评论与 CI 状态
2. 无新评论且 CI 绿/仍在跑 → 本 tick 结束
3. 有新评论 → 逐条处理并回复；CI 红 → 读日志修复，push 后等下一 tick 验证

【停止条件】
PR 状态变为 MERGED 时停止并总结本轮所有处理；CLOSED（未合）时停止并报告原因。

【禁止事项】
禁止 force-push；禁止改动 PR 范围外的文件；禁止在无变化 tick 产出任何汇报噪音。

【留痕】
每个实际处理的评论/修复，追加一行到 .claude/pr-142-loop-log.md。
```
