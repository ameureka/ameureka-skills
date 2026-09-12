# Phase 2: 需求规范 (Requirements)

## 概述

需求规范阶段使用 EARS (Easy Approach to Requirements Syntax) 模式编写精确、可测试的需求，并确保符合 INCOSE (International Council on Systems Engineering) 标准。

## 输入

- **默认模式**：`00-discovery.md`（需求发现文档）+ 用户确认的术语表
- **矩阵模式**：上游需求文档（requirements/ 下的 {PREFIX}-{NNN} 文档，含 runtime 复核记录）+ INDEX 的项目约束与决策台账（00-discovery 默认跳过时，约束与术语以需求文档为准）

## 输出

按运行模式二选一（模式定义见 [SKILL.md](../SKILL.md)）：

- **默认模式**：`.specs/{feature-name}/01-requirements.md`
- **矩阵模式**：`requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/01-requirements.md`

## EARS 模式详解

### 模式 1: 普遍型 (Ubiquitous)

**格式**: `THE [system] SHALL [action]`

**适用场景**: 系统在任何情况下都必须满足的需求

**示例**:
```
THE I18nModule SHALL recognize 'zh' as a valid SupportedLanguage.
THE TranslationFile SHALL use simplified Chinese characters consistently.
```

**检查点**:
- [ ] 使用 THE 开头
- [ ] 使用 SHALL 表示强制
- [ ] 动作具体可验证

---

### 模式 2: 事件驱动型 (Event-Driven)

**格式**: `WHEN [trigger], THE [system] SHALL [action]`

**适用场景**: 系统响应特定事件的需求

**示例**:
```
WHEN the application initializes, THE I18nModule SHALL load Chinese translation resources.
WHEN a user selects '简体中文', THE I18nModule SHALL change the current language to 'zh'.
```

**检查点**:
- [ ] WHEN 触发条件明确
- [ ] 触发条件可检测
- [ ] 响应动作具体

---

### 模式 3: 条件型 (Conditional/Unwanted Behavior)

**格式**: `IF [condition], THEN THE [system] SHALL [action]`

**适用场景**: 特定条件下的系统行为，包括异常处理

**示例**:
```
IF a translation key is missing in Chinese, THEN THE I18nModule SHALL display the English translation.
IF both Chinese and English translations are missing, THEN THE I18nModule SHALL display the key itself.
```

**检查点**:
- [ ] IF 条件可判断
- [ ] 条件边界清晰
- [ ] 处理动作明确

---

### 模式 4: 可选特性型 (Optional Feature)

**格式**: `WHERE [feature is enabled], THE [system] SHALL [action]`

**适用场景**: 可配置或可选功能的需求

**示例**:
```
WHERE Chinese language support is enabled, THE LanguageSettings SHALL display '简体中文' option.
```

**检查点**:
- [ ] 特性开关明确
- [ ] 启用条件可配置
- [ ] 禁用时行为定义

---

### 模式 5: 复合型 (Complex)

**格式**: 组合多个模式

**示例**:
```
WHEN the language changes to 'zh', IF the component is mounted, THEN THE I18nModule SHALL immediately update all displayed UI text.
```

**检查点**:
- [ ] 逻辑关系清晰
- [ ] 不超过两层嵌套
- [ ] 可分解为简单需求

---

## INCOSE 合规性标准

### 标准 1: 主动语态 (Active Voice)

**正确** ✅:
```
THE system SHALL validate user input.
```

**错误** ❌:
```
User input shall be validated by the system.
```

---

### 标准 2: 单一思想 (Single Thought)

**正确** ✅:
```
Req 1.1: THE system SHALL validate email format.
Req 1.2: THE system SHALL check password strength.
```

**错误** ❌:
```
THE system SHALL validate email format and check password strength.
```

---

### 标准 3: 明确条件 (Explicit Conditions)

**正确** ✅:
```
IF the input length exceeds 100 characters, THEN THE system SHALL display an error.
```

**错误** ❌:
```
THE system SHALL handle long inputs appropriately.
```

---

### 标准 4: 定义术语 (Defined Terms)

**正确** ✅:
```
## Glossary
- **I18nModule**: 国际化模块，负责管理多语言翻译

## Requirements
THE I18nModule SHALL...
```

**错误** ❌:
```
THE internationalization component SHALL... (术语未定义)
```

---

### 标准 5: 一致术语 (Consistent Terms)

**正确** ✅:
```
Req 1.1: THE I18nModule SHALL load resources.
Req 1.2: THE I18nModule SHALL cache resources.
```

**错误** ❌:
```
Req 1.1: THE I18nModule SHALL load resources.
Req 1.2: THE i18n system SHALL cache resources. (术语不一致)
```

---

## 附加编写规范（历史事故教训固化）

以下三条规范来自批量实施的实锤事故，编写需求时逐条对照。

### 附加规范 1: 运行时值锚定 + 标识符不变性

**运行时值锚定**：需求中出现价格、比例、额度等业务数值时，写「以 X.ts 运行时值为准（现为 N）」，不冻结裸数字；由需求派生的守门测试，其期望值必须派生自 SSOT/运行时规则源，**禁止 pin 观察值**。

**标识符不变性**：标识符（offerId / promoId / 交易类型 / 账本键）**永不改名、永不把业务数值编码进名字**；业务数值变更时改运行时规则源，不动标识符。

**正确** ✅:
```
THE checkout SHALL price the pack at the runtime value of [pricing-config].ts (currently N).
```

**错误** ❌:
```
THE checkout SHALL price the pack at 1.99. (冻结数字，规则源一改即漂移)
THE system SHALL rename PROMO_X_20 to PROMO_X_10. (改名标识符，引入 migration/对账/历史兼容风险)
```

> 防止的失败类别：pin 观察值把 P0 定价 bug 冻结成合同（测试全绿反而守护错误值）；标识符编码数值后名义值与运行时真值漂移。

### 附加规范 2: 历史事故教训编码进 EARS 条款

- 编写前检索记忆文件 / 项目规则（本工作区见 `.claude/rules/*`）/ 既往收口记录中与本需求相关的事故教训
- 可复发的失败模式优先固化为 **WHEN 型 EARS 条款**（把处置动作写成 SHALL），并**引用事故日期/编号作为需求出处**，使教训获得追溯矩阵与测试覆盖
- 行为反转类需求必须显式点名被取代的旧行为（旧守门测试的翻转在 Phase 6 按裁决记录执行，非回归）

**示例**:
```
WHEN the schema generator produces duplicate columns due to meta drift,
THE implementation SHALL fall back to hand-written SQL with manual journal registration.
(出处: YYYY-MM-DD 迁移漂移事故)
```

> 防止的失败类别：教训只停留在记忆/复盘文档，得不到追溯矩阵与测试覆盖，同类事故复发。

### 附加规范 3: 条件组需求 (Conditional Requirement Groups)

被未拍板决策阻塞的需求，**既不留空也不抢跑**，写成条件组：

1. 方案 A/B/C 各写一组完整 EARS 需求（互斥分支，各自独立可测试）
2. 需求文档 Document Info 的「阻塞决策」行标注 Dx（状态 open）——本流程的 01-requirements.md 无独立 Status 字段，决策 ID 与状态由该行承载；带 Status 字段的文档（上游需求矩阵文档 / INDEX）Status 一律记 `Blocked (decision)`（固定拼写，与 requirements-matrix-generator 状态流转词汇表一致，禁止自创变体）
3. **拍板回填协议**：决策台账拍板后 —— (a) 「阻塞决策」行状态转 decided，上游文档 Status 从 `Blocked (decision)` 转出；(b) 拍板值 + 日期 + 理由回填到需求文档与决策台账；(c) 未选分支保留存档（标注 not-selected），不删除
4. 区分两道门：**R_eff 达标（文档质量门）≠ 可实施（实施门）**——阻塞决策未拍板时，spec 可通过 FPF 审查但实施保持冻结

> 防止的失败类别：决策未拍板导致需求空转或抢跑实施；拍板后无处回填导致规范与决策脱节、验证时把「按裁决正确未启用」误判为缺陷。

---

## 详细步骤

### Step 2.1: 从 Discovery 提取需求点

**操作**:
1. 阅读 `00-discovery.md`（矩阵模式下改读上游需求文档 + INDEX 约束，00-discovery 默认跳过）
2. 识别功能目标中的需求
3. 识别技术约束中的需求
4. 列出初步需求清单

**输出格式**:
```markdown
## 初步需求清单

### 功能需求
- [ ] 需求点1
- [ ] 需求点2

### 技术需求
- [ ] 需求点1
- [ ] 需求点2

### 约束需求
- [ ] 需求点1
```

---

### Step 2.2: 分类和编号

**操作**:
1. 按功能模块分组
2. 分配唯一编号
3. 确定优先级

**编号规则**:
```
Requirement [模块号].[序号]

示例:
- Req 1.1, 1.2, 1.3 - 语言配置
- Req 2.1, 2.2 - 资源注册
- Req 3.1, 3.2 - 翻译文件
```

---

### Step 2.3: 使用 EARS 模式编写

**操作**:
1. 为每个需求选择合适的 EARS 模式
2. 编写需求陈述
3. 检查 INCOSE 合规性

**模式选择指南**:
| 需求类型 | 推荐模式 |
|---------|---------|
| 系统必须具备的能力 | 普遍型 |
| 用户操作触发的行为 | 事件驱动型 |
| 异常和边界情况 | 条件型 |
| 可配置功能 | 可选特性型 |
| 历史事故的可复发失败模式 | WHEN 型 + 事故出处（见附加规范 2） |
| 被未拍板决策阻塞的需求 | 条件组（见附加规范 3） |

---

### Step 2.4: 添加验收标准

**操作**:
1. 为每个需求定义验收标准
2. 确保标准可测试
3. 关联测试方法

**格式**:
```markdown
### Requirement 1.1: [标题]

**User Story:** As a [角色], I want [功能], so that [价值].

#### Acceptance Criteria

1.1.1 WHEN [条件], THE [系统] SHALL [行为].
  - 验证方法: [如何测试]
  - 预期结果: [具体结果]

1.1.2 THE [系统] SHALL [行为].
  - 验证方法: [如何测试]
  - 预期结果: [具体结果]
```

---

### Step 2.5: 编写 01-requirements.md

**文档结构**:
```markdown
# Requirements Document: [功能名称]

## Document Info
[版本 / 日期 / 阻塞决策（决策 ID + 状态 + 拍板值，无则填「无」）——字段详见模板]

## Introduction
[功能简介和目的]

## Glossary
[从 00-discovery.md 复制术语表；矩阵模式下从上游需求文档继承]

## Requirements

### Requirement 1: [模块名称]

**User Story:** As a [角色], I want [功能], so that [价值].

#### Acceptance Criteria

1.1 [EARS 格式需求]
1.2 [EARS 格式需求]

### Requirement 2: [模块名称]
...

## Notes
[补充说明、假设、依赖]

## 审批状态
- [ ] 用户确认需求完整性
- [ ] 用户确认术语翻译
- [ ] 用户批准进入 Phase 3
（批量授权模式下由批次级一次性授权记录替代，见 SKILL.md「批量模式（Batch Mode）」）
```

---

## 验证检查清单

### EARS 合规检查

- [ ] **所有需求使用 EARS 模式**
  - 每个需求包含 SHALL
  - 模式选择正确

- [ ] **触发条件明确**
  - WHEN 条件可检测
  - IF 条件可判断

- [ ] **动作具体可验证**
  - 无模糊词汇
  - 可编写测试

### INCOSE 合规检查

- [ ] **主动语态**
  - 无被动句式

- [ ] **单一思想**
  - 每个需求只表达一个意思
  - 无 "and" 连接多个动作

- [ ] **术语一致**
  - 所有术语在 Glossary 中定义
  - 全文使用一致

### 完整性检查

- [ ] **覆盖所有功能目标**
  - 对照 00-discovery.md 检查

- [ ] **包含异常处理**
  - 边界情况有定义
  - 错误处理有需求

- [ ] **编号唯一且连续**
  - 无重复编号
  - 无跳号

### 附加规范检查

- [ ] **数值已锚定运行时源**
  - 业务数值写「以 X 运行时值为准（现为 N）」
  - 无冻结裸数字、无 pin 观察值的验收期望

- [ ] **标识符不变性**
  - 无改名标识符的需求
  - 新标识符不编码业务数值

- [ ] **历史教训已检索并固化**
  - 相关事故教训已固化为 WHEN 型条款并带出处
  - 行为反转已点名被取代的旧行为

- [ ] **阻塞决策已处理**
  - 阻塞决策已标注（决策 ID + 状态），或填「无」
  - 被阻塞需求已写成条件组，拍板回填协议明确

---

## 禁止词汇表

以下词汇在需求中**禁止使用**:

| 禁止词汇 | 原因 | 替代方案 |
|---------|------|---------|
| 可能 (may) | 不确定 | SHALL / SHALL NOT |
| 通常 (usually) | 不精确 | 具体条件 |
| 大概 (approximately) | 模糊 | 具体数值 |
| 应该能 (should be able to) | 弱约束 | SHALL |
| 等等 (etc.) | 不完整 | 列出所有项 |
| 适当的 (appropriate) | 主观 | 具体标准 |
| 用户友好 (user-friendly) | 主观 | 具体指标 |
| 快速 (fast) | 模糊 | 具体时间 (< 100ms) |
| 高效 (efficient) | 模糊 | 具体指标 |

---

## 常见问题

### Q1: 一个需求太复杂怎么办？

**解决方案**:
1. 拆分为多个简单需求
2. 使用父子编号 (1.1, 1.1.1)
3. 确保每个子需求独立可测试

### Q2: 如何处理非功能需求？

**解决方案**:
1. 性能需求: 使用具体数值
   ```
   THE system SHALL respond within 200ms.
   ```
2. 安全需求: 使用条件型
   ```
   IF unauthorized access is detected, THEN THE system SHALL log the attempt.
   ```

### Q3: 需求之间有依赖怎么办？

**解决方案**:
1. 在需求中明确引用
   ```
   Req 2.1 (depends on Req 1.1): WHEN Req 1.1 is satisfied, THE system SHALL...
   ```
2. 在 Notes 中说明依赖关系

---

## 时间估算

| 步骤 | 简单功能 | 中等功能 | 复杂功能 |
|------|---------|---------|---------|
| 提取需求点 | 15 min | 30 min | 45 min |
| 分类编号 | 10 min | 15 min | 30 min |
| EARS 编写 | 30 min | 60 min | 120 min |
| 验收标准 | 15 min | 30 min | 60 min |
| 文档整理 | 15 min | 30 min | 45 min |
| **总计** | **85 min** | **165 min** | **300 min** |

---

## 相关链接

- [返回主文档](../SKILL.md)
- [上一阶段: Phase 1 需求发现](./phase1-discovery.md)
- [下一阶段: Phase 3 技术设计](./phase3-design.md)
- [模板文件](../templates/01-requirements.template.md)
