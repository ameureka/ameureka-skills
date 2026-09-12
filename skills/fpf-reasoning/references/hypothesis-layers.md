# 假设层级系统

## 层级定义

| 层级 | 名称 | 含义 | 存储位置 |
|------|------|------|----------|
| L0 | 未验证 | 刚提出的假设，仅有初步想法 | `.quint/knowledge/L0/` |
| L1 | 逻辑验证 | 通过逻辑检查，理论上可行 | `.quint/knowledge/L1/` |
| L2 | 实证验证 | 通过实际测试，有证据支持 | `.quint/knowledge/L2/` |
| invalid | 无效 | 验证失败，已被否定 | `.quint/knowledge/invalid/` |

---

## 状态转换图

```
                    quint_propose
                         │
                         ▼
                   ┌─────────┐
          ┌──────▶│   L0    │◀────────┐
          │       └────┬────┘         │
          │            │              │
       REFINE    quint_verify      REFINE
          │            │              │
          │       ┌────┴────┐         │
          │       │         │         │
          │       ▼         ▼         │
          │  ┌─────────┐  ┌─────────┐ │
          └──│   L1    │  │ invalid │ │
             └────┬────┘  └─────────┘ │
                  │            ▲      │
             quint_test        │      │
                  │            │      │
             ┌────┴────┐       │      │
             │         │       │      │
             ▼         ▼       │      │
        ┌─────────┐   FAIL─────┘      │
        │   L2    │                   │
        └────┬────┘                   │
             │                        │
        quint_test (refresh)          │
             │                        │
             ▼                        │
        ┌─────────┐                   │
        │   L2    │───────FAIL────────┘
        │ (fresh) │   (考虑废弃)
        └─────────┘
```

---

## 层级转换规则

### L0 → L1 (quint_verify)

**前置条件**：
- 假设存在于 L0
- 已完成逻辑检查

**检查项**：
- [ ] **类型检查**：输入输出类型兼容
- [ ] **约束检查**：不违反上下文不变量
- [ ] **逻辑检查**：方法能达成预期结果

**verdict 选项**：
| verdict | 结果 | 说明 |
|---------|------|------|
| PASS | L0 → L1 | 逻辑验证通过 |
| FAIL | L0 → invalid | 逻辑上不可行 |
| REFINE | L0 → L0 | 需要修改后重新验证 |

---

### L1 → L2 (quint_test)

**前置条件**：
- 假设存在于 L1
- 已准备好测试方案

**测试策略**：

| 策略 | 方法 | CL | R 惩罚 | 优先级 |
|------|------|-----|--------|--------|
| 内部测试 | 运行代码/脚本/基准测试 | CL3 | 0% | 首选 |
| 外部研究 | 官方文档/权威资料 | CL2 | 10% | 次选 |
| 外部研究 | 第三方博客/论坛 | CL1 | 30% | 备选 |

**verdict 选项**：
| verdict | 结果 | 说明 |
|---------|------|------|
| PASS | L1 → L2 | 实证验证通过 |
| FAIL | L1 → L1 | 测试失败，记录原因 |
| REFINE | L1 → L1 | 需要调整测试方案 |

---

### L2 维护 (quint_test refresh)

**触发条件**：
- `quint_check_decay` 显示证据过期
- 外部环境发生变化
- 依赖项更新

**刷新流程**：
1. 运行 `quint_check_decay` 检查衰减
2. 对过期假设运行 `/q3-validate <id>`
3. 更新证据时间戳

**verdict 选项**：
| verdict | 结果 | 说明 |
|---------|------|------|
| PASS | L2 → L2 | 证据刷新成功 |
| FAIL | L2 → L2 | 刷新失败，考虑废弃 |

---

## 层级文件结构

```
.quint/knowledge/
├── L0/
│   ├── hypothesis-a.md
│   └── hypothesis-b.md
├── L1/
│   └── hypothesis-c.md
├── L2/
│   └── hypothesis-d.md
└── invalid/
    └── hypothesis-e.md
```

---

## 假设文件格式

每个假设文件包含：

```markdown
# {title}

## Metadata
- **ID**: {hypothesis-id}
- **Kind**: system | episteme
- **Layer**: L0 | L1 | L2 | invalid
- **Created**: {timestamp}
- **Updated**: {timestamp}

## Content
{方法描述}

## Scope
{适用范围}

## Rationale
{JSON 格式的理由}

## Evidence (L1+)
- {验证记录1}
- {验证记录2}

## Test Results (L2)
- **Type**: internal | external
- **Result**: {测试结果}
- **Timestamp**: {时间}

## Dependencies
- depends_on: [{依赖ID列表}]
- decision_context: {父决策ID}
```

---

## 最佳实践

### 1. 不要跳过层级

```
❌ 错误：L0 直接到 L2
✅ 正确：L0 → L1 → L2
```

### 2. 每个假设都要处理

```
❌ 错误：只验证"看起来好"的假设
✅ 正确：对每个 L0 调用 quint_verify
```

### 3. 优先内部测试

```
❌ 错误：直接搜索博客作为证据
✅ 正确：先尝试运行代码验证
```

### 4. 定期检查衰减

```
❌ 错误：L2 假设永远不更新
✅ 正确：定期运行 quint_check_decay
```

---

## 常见问题

### Q: 假设可以从 invalid 恢复吗？

A: 不能直接恢复。需要创建新假设（可能是修改版），重新走 L0 → L1 → L2 流程。

### Q: L2 假设失败后会怎样？

A: 保持在 L2 但记录失败。如果多次失败，应考虑废弃并创建新假设。

### Q: 如何处理相互依赖的假设？

A: 使用 `depends_on` 参数声明依赖。被依赖的假设应先完成验证。
