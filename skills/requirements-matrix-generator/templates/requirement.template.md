<!-- Template Version: 2.0 (2026-07-06) — requirements-matrix-generator -->

# {前缀}-{序号}: {标题}

## Document Info

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Draft |
| Last Updated | {YYYY-MM-DD} |
| Priority | P{0/1/2/3} |
| Source | {差距分析文档名} |
| runtime 复核 | {验证方式：grep / 实测 / 浏览器 / DB truth} + {YYYY-MM-DD} |

> Status 固定词汇：`Draft → Ready-for-Specs → Specs-Generated → Implemented → Gray-Verified → Closed`；
> 旁路：`Frozen (tripwire)` / `Blocked (decision)`。

## 阻塞决策

| 决策 ID | 问题 | 选项 | 状态 | 拍板值与日期 |
|---------|------|------|------|-------------|
| {D-XXX / 无} | {待拍板问题} | {方案 A / B / C} | open / decided | {拍板后回填} |

> 存在 open 决策时：本文档 Status 记 `Blocked (decision)`，需求写成条件组（方案 A/B/C 各一组）；
> 拍板后 Status 转出、拍板记录回填、未选分支保留存档。无阻塞决策则决策 ID 填「无」。

## 项目约束遵循

> 权威约束表见 [00-INDEX.md](../00-INDEX.md)「项目约束清单（权威单点）」；此处只声明遵循并登记差异项，禁止整表复制。

| 项 | 内容 |
|----|------|
| 遵循声明 | 遵循 00-INDEX.md 项目约束清单 v{N} |
| 差异项（新增/豁免/收紧） | {逐条列出；无则填「无」} |

## 1. 问题描述

### 现状

{引用差距分析中的证据 + runtime 复核结论}

**代码证据**：
```
{文件路径}:{行号}（核对日期 {YYYY-MM-DD}）
{代码片段或截图描述}
```

### 影响

{对用户/业务/性能的具体影响}

## 2. 实现方案

### 方案概述

{一段话描述解决方案}

### 关键步骤

1. {步骤1}
2. {步骤2}
3. {步骤3}

### 代码概要

```typescript
// 概要级代码片段（完整实现见 specs/02-design.md）
```

### 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/path/to/file.ts` | 修改/新建/删除 | {说明} |

## 3. 交叉引用

| 关联文档 | 关系 | 说明 |
|---------|------|------|
| {前缀}-{序号} | 依赖/被依赖/关联 | {说明} |

## 4. 验收标准

- [ ] {标准1}
- [ ] {标准2}
- [ ] {标准3}

## References

- 差距分析：{文档链接}
- Specs：`详见 ../../requirements-specs/{层级}-{类别}/{前缀}-{序号}-{slug}/02-design.md`
