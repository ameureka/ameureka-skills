---
name: fpf-reasoning
description: |
  FPF 第一性原理推理框架 - 基于 Quint Code MCP 服务。
  提供 6 阶段结构化推理流程：初始化→假设生成→逻辑验证→实证验证→信任审计→决策记录。
  使用场景：
  (1) 需要系统化的假设验证和决策记录
  (2) 用户说 "fpf"、"第一性原理"、"结构化推理"、"假设验证"
  (3) 需要计算 R_eff 信任度和 WLNK 最弱环节分析
  (4) 创建可审计的 DRR (Design Rationale Record)
---

# FPF-Reasoning Skill

基于 Quint Code 的第一性原理推理框架。本 Skill 引导你完成 6 阶段结构化推理流程。

## 前置条件

确保 Quint Code MCP 服务已启用。检查方法：
- 项目根目录存在 `.mcp.json` 配置 quint-code 服务
- 或运行 `quint-code serve` 确认服务可用

## 6 阶段状态机

| 阶段 | 名称 | Slash Command | 核心 MCP 工具 | 状态转换 |
|------|------|---------------|---------------|----------|
| Q0 | 初始化 | `/q0-init` | `quint_init`, `quint_record_context` | → 上下文已记录 |
| Q1 | 假设生成 | `/q1-hypothesize` | `quint_propose` | → L0 假设存在 |
| Q2 | 逻辑验证 | `/q2-verify` | `quint_verify` | L0 → L1 或 invalid |
| Q3 | 实证验证 | `/q3-validate` | `quint_test` | L1 → L2 或 invalid |
| Q4 | 信任审计 | `/q4-audit` | `quint_calculate_r`, `quint_audit_tree`, `quint_audit` | R_eff 计算完成 |
| Q5 | 决策记录 | `/q5-decide` | `quint_decide` | DRR 创建完成 |

## 快速开始

### 方式一：完整流程（推荐）

依次执行 Slash Commands：
```
/q0-init          # 初始化项目上下文
/q1-hypothesize   # 生成假设
/q2-verify        # 逻辑验证
/q3-validate      # 实证验证
/q4-audit         # 信任审计
/q5-decide        # 最终决策
```

### 方式二：状态检查后继续

```
# 检查当前状态
quint_status

# 根据状态跳转到对应阶段
/q{N}-xxx
```

### 方式三：证据衰减检查

```
# 检查 L2 假设的证据新鲜度
quint_check_decay

# 如有衰减，刷新证据
/q3-validate <hypothesis_id>
```

## 阶段详解

### Q0: 初始化 (Initialize)

**目标**：建立有界上下文 (Bounded Context)

**工具调用**：
```
quint_init()                           # 创建 .quint/ 目录
quint_record_context(                  # 记录上下文
  vocabulary="领域术语定义...",
  invariants="系统约束条件..."
)
```

**产出**：`.quint/context.md`

---

### Q1: 假设生成 (Hypothesize)

**目标**：生成 3-5 个竞争假设 (L0)

**工具调用**：
```
quint_propose(
  title="hypothesis-title-in-kebab-case",  # ⚠️ 必须是 kebab-case 英文
  content="方法描述",
  scope="适用范围",
  kind="system|episteme",
  rationale='{"anomaly":"问题","approach":"方案"}',
  decision_context="父决策ID",      # 可选：分组
  depends_on=["依赖ID1", "依赖ID2"]  # 可选：依赖
)
```

**产出**：`.quint/knowledge/L0/{title}.md`

**⚠️ 关键约束 - Title 命名规则**：
- **必须使用 kebab-case 英文**（如 `db-schema-validation`）
- **禁止使用中文**（会导致文件名解析失败）
- **禁止使用冒号 `:` 或 `：`**（会截断文件名）
- **禁止使用空格**（使用连字符 `-` 代替）
- Title 将作为 `hypothesis_id` 用于后续 `quint_verify`、`quint_test` 等工具
- 示例：`validate-db-schema`, `cleanup-pending-messages`, `worker-restart-cmd`

**其他约束**：
- 必须包含至少一个"保守"和一个"激进"方案
- kind 只能是 "system" 或 "episteme"

---

### Q2: 逻辑验证 (Verify)

**目标**：L0 → L1（通过逻辑检查）

**工具调用**：
```
quint_verify(
  hypothesis_id="假设ID",
  checks_json='{"type_check":"passed","constraint_check":"passed","logic_check":"passed"}',
  verdict="PASS|FAIL|REFINE"
)
```

**产出**：`.quint/knowledge/L1/*.md` 或移至 `invalid/`

**验证清单**：
- [ ] 类型检查：输入输出兼容？
- [ ] 约束检查：违反上下文不变量？
- [ ] 逻辑检查：方法能达成预期？

---

### Q3: 实证验证 (Validate)

**目标**：L1 → L2（通过实证测试）

**验证策略**：

| 策略 | 方法 | Congruence Level | R 惩罚 |
|------|------|------------------|--------|
| A: 内部测试 | 运行代码/脚本 | CL3 | 0% |
| B: 外部研究 | 文档/搜索 | CL1-2 | 10-30% |

**工具调用**：
```
quint_test(
  hypothesis_id="假设ID",
  test_type="internal|external",
  result="测试结果摘要",
  verdict="PASS|FAIL|REFINE"
)
```

**产出**：`.quint/knowledge/L2/*.md` + `.quint/evidence/`

---

### Q4: 信任审计 (Audit)

**目标**：计算 R_eff，识别最弱环节

**核心原理 - WLNK (Weakest Link)**：
```
R_eff = min(所有证据分数)  # 永远取最小值，不取平均
```

**工具调用**：
```
# 1. 计算 R_eff
quint_calculate_r(holon_id="假设ID")

# 2. 可视化依赖树
quint_audit_tree(holon_id="假设ID")

# 3. 记录审计结果
quint_audit(
  hypothesis_id="假设ID",
  risks="WLNK: 0.85, 最弱环节: 外部文档(CL1), 偏见: 无"
)
```

**产出**：审计报告 + 比较表

**比较表示例**：
| 假设 | R_eff | 最弱环节 |
|------|-------|----------|
| redis-caching | 0.85 | 内部测试 |
| cdn-edge | 0.72 | 外部文档(CL1惩罚) |

---

### Q5: 决策记录 (Decide)

**目标**：创建 DRR (Design Rationale Record)

**关键约束 - Transformer Mandate**：
> 系统不能自我转换。Claude 生成选项和证据，**人类做决策**。

**流程**：
1. 展示比较表给用户
2. **等待用户选择获胜者**
3. 调用工具记录决策

**工具调用**：
```
quint_decide(
  title="决策标题",
  winner_id="获胜假设ID",
  rejected_ids=["被拒假设ID1", "被拒假设ID2"],
  context="问题背景",
  decision="我们决定使用 X 因为...",
  rationale="它的 R_eff 最高且...",
  consequences="需要配置 X，延迟将降低..."
)
```

**产出**：`.quint/decisions/DRR-XXXX-title.md`

---

## 辅助工具

### 状态检查
```
quint_status              # 查看当前所有假设状态
```

### 证据衰减
```
quint_check_decay         # 检查 L2 证据新鲜度
/q3-validate <id>         # 刷新特定假设的证据
```

---

## 协议违规示例

### ❌ 违规：跳过工具调用
```
"我认为 Redis 方案更好，我们就用这个吧..."
[没有调用 quint_decide]

结果：决策未记录，不可审计，协议违规
```

### ❌ 违规：自主决策
```
"Redis 的 R_eff 更高，我直接实现它..."
[没有等待用户确认]

结果：违反 Transformer Mandate，协议违规
```

### ✅ 正确：完整流程
```
[调用 quint_calculate_r 获取各假设 R_eff]
[展示比较表]
"请问您选择哪个方案？"
[用户回复: "redis-caching"]
[调用 quint_decide 记录决策]
```

---

## 参考文档

详细说明请查看 `references/` 目录：
- `quint-tools.md` - 所有 MCP 工具参数详解
- `hypothesis-layers.md` - L0/L1/L2/invalid 层级转换规则
- `trust-calculus.md` - R_eff 计算和 WLNK 原理
- `decision-record.md` - DRR 格式和最佳实践
