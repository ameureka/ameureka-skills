# Quint Code MCP 工具速查

## 初始化工具

### quint_init
创建 `.quint/` 目录结构。

**参数**：无
**前置条件**：无
**后置条件**：`.quint/` 目录存在

---

### quint_record_context
记录项目上下文。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| vocabulary | string | 是 | 领域术语定义 |
| invariants | string | 是 | 系统约束条件 |

**示例**：
```
quint_record_context(
  vocabulary="User: 注册用户。Order: 购买意向。",
  invariants="必须使用 PostgreSQL。延迟 < 100ms。"
)
```

---

## 假设管理工具

### quint_propose
创建 L0 假设。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 假设标题 |
| content | string | 是 | 方法描述 |
| scope | string | 是 | 适用范围 |
| kind | string | 是 | "system" 或 "episteme" |
| rationale | string | 是 | JSON 格式的理由 |
| decision_context | string | 否 | 父决策 ID |
| depends_on | array | 否 | 依赖的假设 ID 列表 |
| dependency_cl | number | 否 | 依赖的 Congruence Level (1-3) |

**rationale JSON 格式**：
```json
{
  "anomaly": "问题描述",
  "approach": "解决方案",
  "alternatives_rejected": ["被排除的方案1", "被排除的方案2"]
}
```

---

### quint_verify
逻辑验证 L0 假设。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| hypothesis_id | string | 是 | 假设 ID |
| checks_json | string | 是 | JSON 格式的检查结果 |
| verdict | string | 是 | "PASS", "FAIL", 或 "REFINE" |

**checks_json 格式**：
```json
{
  "type_check": "passed|failed",
  "constraint_check": "passed|failed",
  "logic_check": "passed|failed",
  "notes": "补充说明"
}
```

**状态转换**：
- PASS: L0 → L1
- FAIL: L0 → invalid
- REFINE: L0 → L0 (带反馈)

---

### quint_test
实证验证 L1/L2 假设。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| hypothesis_id | string | 是 | 假设 ID |
| test_type | string | 是 | "internal" 或 "external" |
| result | string | 是 | 测试结果摘要 |
| verdict | string | 是 | "PASS", "FAIL", 或 "REFINE" |

**test_type 说明**：
- `internal`: 内部测试（运行代码、脚本、基准测试）- CL3，无惩罚
- `external`: 外部研究（文档、搜索、第三方资料）- CL1-2，有惩罚

**状态转换**：
- L1 + PASS → L2
- L1 + FAIL → L1 (记录失败)
- L2 + PASS → L2 (刷新证据)
- L2 + FAIL → L2 (记录失败，考虑废弃)

---

## 审计工具

### quint_calculate_r
计算假设的 R_eff（有效可靠性）。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| holon_id | string | 是 | 假设 ID |

**返回内容**：
- R_eff 分数 (0-1)
- 自身分数
- 最弱环节 (WLNK)
- 影响因素列表

---

### quint_audit_tree
可视化依赖树。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| holon_id | string | 是 | 根假设 ID |

**返回格式**：
```
hypothesis-a [R:0.72]
├── evidence-1 [R:0.85]
├── evidence-2 [R:0.72] ◄── WLNK
└── dependency-b [R:0.80] (CL:2)
    └── evidence-3 [R:0.90]
```

---

### quint_audit
记录审计结果。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| hypothesis_id | string | 是 | 假设 ID |
| risks | string | 是 | 风险分析摘要 |

**risks 示例**：
```
"WLNK: 0.72, 最弱环节: 外部文档(CL1惩罚30%), 偏见检查: 无 Pet Idea 倾向"
```

---

## 决策工具

### quint_decide
创建 DRR（设计理由记录）。

**参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 决策标题 |
| winner_id | string | 是 | 获胜假设 ID |
| rejected_ids | array | 是 | 被拒假设 ID 列表 |
| context | string | 是 | 问题背景 |
| decision | string | 是 | 决策声明 |
| rationale | string | 是 | 决策理由 |
| consequences | string | 是 | 后果和下一步 |
| characteristics | object | 否 | C.16 评分（可选） |

**产出**：`.quint/decisions/DRR-XXXX-title.md`

**关系创建**：
- `DRR --selects--> winner_id`
- `DRR --rejects--> rejected_id` (对每个被拒假设)

---

## 状态工具

### quint_status
查看所有假设状态。

**参数**：无

**返回内容**：
- L0 假设列表
- L1 假设列表
- L2 假设列表
- invalid 假设列表
- 各层级数量统计

---

### quint_check_decay
检查证据衰减。

**参数**：无

**返回内容**：
- 需要刷新的 L2 假设列表
- 每个假设的证据年龄
- 建议的刷新优先级

**后续操作**：
对需要刷新的假设运行 `/q3-validate <hypothesis_id>`

---

## 工具调用顺序

```
quint_init
    ↓
quint_record_context
    ↓
quint_propose (多次)
    ↓
quint_verify (每个 L0)
    ↓
quint_test (每个 L1)
    ↓
quint_calculate_r (每个 L2)
    ↓
quint_audit_tree (每个 L2)
    ↓
quint_audit (每个 L2)
    ↓
quint_decide (用户选择后)
```

---

## 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| "hypothesis not found in L0" | 假设不存在或已升级 | 检查假设 ID 和当前层级 |
| "hypothesis not found in L1" | 尝试测试未验证的假设 | 先运行 quint_verify |
| "no L2 hypotheses exist" | 没有通过实证验证的假设 | 先运行 quint_test |
| "context not recorded" | 跳过了初始化 | 先运行 quint_record_context |
