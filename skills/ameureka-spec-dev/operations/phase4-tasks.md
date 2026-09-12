# Phase 4: 任务清单 (Tasks)

## 概述

任务清单阶段将设计分解为可执行的具体任务，建立完整的追溯矩阵，确保每个任务都能追溯到需求和设计属性。

## 输入

- `00-discovery.md` - 需求发现文档（矩阵模式下由需求文档替代，默认缺省）
- `01-requirements.md` - 需求规范文档
- `02-design.md` - 技术设计文档

## 输出

- 默认模式: `.specs/{feature-name}/03-tasks.md`
- 矩阵模式: `requirements-specs/{NN-layer}/{PREFIX-NNN-slug}/03-tasks.md`

## 任务分解原则

### 原则 1: 适当粒度

**目标**: 每个任务 2-4 小时可完成

**判断标准**:
- ✅ 可以在一个工作会话内完成
- ✅ 有明确的开始和结束
- ✅ 可以独立验证
- ❌ 太大: 需要多天完成
- ❌ 太小: 几分钟就完成

---

### 原则 2: 独立可测试

**目标**: 每个任务完成后可以独立验证

**检查点**:
- [ ] 有明确的验收标准
- [ ] 可以编写测试
- [ ] 不依赖未完成的任务

---

### 原则 3: 完整追溯

**目标**: 每个任务都能追溯到需求

**追溯链**:
```
Requirement → Design Property → Task → Test
```

---

### 原则 4: 优先级排序

**目标**: 按依赖关系和重要性排序

**优先级规则**:
1. 基础设施任务优先
2. 核心功能任务次之
3. 增强功能任务最后
4. 有依赖的任务排在依赖项之后

---

## 任务格式

### 标准任务格式

```markdown
### Task X.Y: [任务名称]

**Description**:
[具体描述要做什么]

**Files to modify**:
- `path/to/file1.ts` - [修改说明]
- `path/to/file2.ts` - [修改说明]

**Acceptance Criteria**:
- [ ] AC1: [具体标准]（oracle: 源码 grep（仓库级不变量）/ HTTP 抓取 / 浏览器 DOM（Playwright）/ DB truth / 执行证据；环境: dev / prod build（pnpm start）/ standalone 容器 / 灰度）
- [ ] AC2: [具体标准]

**Evidence Gate**: local（本地 tsc/测试/grep 可核销）| external（需部署环境/第三方平台/真实流量证据，列明所需证据）

**Validates**: Req X.Y, Property Z

**Dependencies**: Task X.Y (如有)

**Estimated effort**: [S/M/L]
```

### 任务类型

#### 类型 1: 配置任务

**特点**: 修改配置文件，添加常量

**示例**:
```markdown
### Task 1.1: 添加中文语言配置

**Description**:
在 i18n 配置中添加中文作为支持的语言选项。

**Files to modify**:
- `src/shared/constants/i18n.ts` - 添加 'zh' 到 SupportedLanguage 类型和 AVAILABLE_LANGUAGES 数组

**Acceptance Criteria**:
- [ ] SupportedLanguage 类型包含 'zh'
- [ ] AVAILABLE_LANGUAGES 包含中文条目
- [ ] TypeScript 编译通过

**Validates**: Req 1.1, Req 1.2, Property 1, Property 2

**Estimated effort**: S
```

---

#### 类型 2: 实现任务

**特点**: 编写新代码，实现功能

**示例**:
```markdown
### Task 2.1: 创建中文翻译文件

**Description**:
创建所有 8 个命名空间的中文翻译文件。

**Files to modify**:
- `src/shared/i18n/locales/zh/common.json` - 创建
- `src/shared/i18n/locales/zh/navigation.json` - 创建
- ... (其他 6 个文件)

**Acceptance Criteria**:
- [ ] 所有 8 个文件已创建
- [ ] JSON 格式正确
- [ ] 键结构与英文版一致

**Validates**: Req 3.1-3.8, Property 3, Property 4

**Dependencies**: Task 1.1

**Estimated effort**: L
```

---

#### 类型 3: 集成任务

**特点**: 连接组件，注册资源

**示例**:
```markdown
### Task 3.1: 注册中文翻译资源

**Description**:
在 i18n 初始化中导入并注册中文翻译资源。

**Files to modify**:
- `src/shared/i18n/index.ts` - 添加中文资源导入和注册

**Acceptance Criteria**:
- [ ] 所有中文资源已导入
- [ ] resources.zh 包含所有命名空间
- [ ] 应用启动无错误

**Validates**: Req 2.1, Req 2.2, Req 2.3, Property 3

**Dependencies**: Task 2.1

**Estimated effort**: S
```

---

#### 类型 4: 测试任务

**特点**: 编写测试代码

**示例**:
```markdown
### Task 5.1: 编写属性测试

**Description**:
为正确性属性编写自动化测试。

**Files to modify**:
- `src/__tests__/i18n/chinese-support.test.ts` - 创建
- `src/__tests__/i18n/translation-completeness.test.ts` - 创建

**Acceptance Criteria**:
- [ ] Property 1-5 都有对应测试
- [ ] 所有测试通过
- [ ] 测试覆盖率 > 80%

**Validates**: Property 1-5

**Dependencies**: Task 3.1

**Estimated effort**: M
```

---

## AC 质量规则（验收标准编写守则）

### 规则 1: 仓库级不变量判据 + oracle 声明

验收判据必须写成**仓库级不变量**（如"全仓 grep 归零（白名单外）"），文件清单只是工作项不是验证边界。每条 AC 声明 **oracle 类型**（源码 grep（仓库级不变量）/ HTTP 抓取 / 浏览器 DOM（Playwright）/ DB truth / 执行证据）与**验证环境**（dev / prod build（pnpm start）/ standalone 容器 / 灰度）。CSR-bailout 内容用源码 grep 或真浏览器，勿用 curl。
> 依据：007 教训——orange 字面值藏在 messages.json 翻译串里，逃过了 6 文件圈定的 grep。

### 规则 2: 门命令基线试跑 + 验证工具存在性确认

AC 的门命令必须先对基线试跑（确认工具存在、基线通过/失败方向符合预期），并把基线值写进 AC；grep/计数类门写成"基线值 → 目标值"的增量式，scope 外命中显式排除。AC 依赖的验证工具/库必须实测存在于仓库（查 package.json 与既有测试用法；不存在则改用仓库已验证手段，或显式降级为评审型 AC）。
> 依据：004 批次实锤——全仓 grep 门因基线实有 9 处而本轮只删 3 处永不可过；~7 条 AC 的唯一自动化验证手段指向根本不在 package.json 的测试库。

### 规则 3: 浏览器/人工证据类 AC 集中一次证据采集轮

批量实施时，浏览器截图/深链/人工核验类 AC 不要分散绑在每套 spec 里（实证会被系统性跳过），改为排一个**集中证据采集轮**：单个浏览器证据脚本一次覆盖所有 UI spec 的可视验收点，产物归档（evidence.json + 截图）。
> 依据：004 批次 QA-001——多套 UI spec 的截图证据面系统性跳过，最终以一次合并证据轮（6 区块截图 + 8 条重定向断言）一次收齐。

### 规则 4: 不可执行 AC 的 waiver 协议

AC 依赖时间窗/外部条件而当下不可执行时，二选一处理：

1. **显式 deferred** — 状态不升级，收口记录判 `deferred-non-blocking`（延期不阻塞，列明登记去处）
2. **等价证据包** — 命名必须含「equivalent evidence / not X」（如「S8 equivalent evidence pack / not 24h observation」），禁止把等价证据写成原 AC 完成

waiver 约束：需用户明确批准；文档状态词只能写 `waiver`，**禁升级为 completed**；必须附**自动失效条件**（如出现负毛利/漂移等任一预定义信号即 waiver 自动失效，AC 回到待执行）。
> 依据：S8 24h 连续观察案例——等价证据协议端到端成功，收口报告始终保持「deferred…equivalent evidence」表述未升格。

---

## 任务状态双态

任务完成状态必须区分两态（完成判定纪律）：

| 状态 | 含义 | 核销依据 |
|------|------|---------|
| `✅ 本地完成` | 本地门（tsc / 测试 / build / grep）全绿 | 本地命令输出 |
| `外部门待验` | 需部署环境 / 第三方平台 / 真实流量证据的门尚未闭合 | 外部证据归档后方可关闭 |

铁律：**发布 ≠ 完成**。外部证据门未闭合时，任务最多标 `✅ 本地完成`，禁止标记为最终完成。
> 依据：105 R3 批次以「✅ 本地完成 / 外部门待验」双栏状态，防止了 R2 式「代码合了=完成」虚标复发。

---

## 追溯矩阵

### 矩阵格式

```markdown
## Traceability Matrix

| Requirement | Design Property | Task | Test |
|-------------|-----------------|------|------|
| Req 1.1 | Property 1 | Task 1.1 | test_language_type |
| Req 1.2 | Property 2 | Task 1.1 | test_available_languages |
| Req 2.1 | Property 3 | Task 3.1 | test_namespace_registration |
```

### 矩阵验证

**完整性检查**:
- [ ] 每个 Requirement 至少有一个 Task
- [ ] 每个 Property 至少有一个 Test
- [ ] 无空白单元格

**一致性检查**:
- [ ] Task 的 Validates 字段与矩阵一致
- [ ] Test 名称与实际测试文件一致

---

## 详细步骤

### Step 4.1: 分析设计文档

**操作**:
1. 阅读 `02-design.md`
2. 识别所有需要修改的文件
3. 识别所有需要创建的文件
4. 列出所有正确性属性

**输出**:
```markdown
## 文件变更清单

### 需要修改的文件
- [ ] file1.ts - [修改内容]
- [ ] file2.ts - [修改内容]

### 需要创建的文件
- [ ] new-file1.ts - [文件用途]
- [ ] new-file2.ts - [文件用途]

### 正确性属性
- Property 1: [名称]
- Property 2: [名称]
```

---

### Step 4.2: 分组和排序

**操作**:
1. 按功能模块分组
2. 识别依赖关系
3. 确定执行顺序

**分组示例**:
```markdown
## 任务分组

### Group 1: 配置层 (优先级: 高)
- Task 1.1: 语言配置
- Task 1.2: 常量定义

### Group 2: 数据层 (优先级: 高)
- Task 2.1: 翻译文件
- Task 2.2: 数据验证

### Group 3: 集成层 (优先级: 中)
- Task 3.1: 资源注册
- Task 3.2: 组件集成

### Group 4: 测试层 (优先级: 中)
- Task 4.1: 单元测试
- Task 4.2: 属性测试
```

---

### Step 4.3: 编写任务详情

**操作**:
1. 为每个任务编写详细描述
2. 列出要修改的文件
3. 定义验收标准
4. 关联需求和属性

**检查点**:
- [ ] 描述清晰具体
- [ ] 文件路径正确
- [ ] 验收标准可验证（仓库级不变量判据 + oracle 声明，见「AC 质量规则」）
- [ ] 门命令已对基线试跑、验证工具已确认存在于仓库
- [ ] Evidence Gate 已标注（local / external）
- [ ] Validates 字段完整

---

### Step 4.4: 构建追溯矩阵

**操作**:
1. 列出所有需求
2. 关联设计属性
3. 关联实现任务
4. 关联测试用例

**验证**:
- [ ] 无遗漏需求
- [ ] 无孤立任务
- [ ] 追溯链完整

---

### Step 4.5: 估算工作量

**操作**:
1. 评估每个任务的复杂度
2. 分配工作量标签
3. 计算总工作量

**工作量标签**:
| 标签 | 时间 | 说明 |
|------|------|------|
| S (Small) | 1-2 小时 | 简单修改 |
| M (Medium) | 2-4 小时 | 中等复杂度 |
| L (Large) | 4-8 小时 | 复杂任务 |
| XL (Extra Large) | 8+ 小时 | 需要拆分 |

**注意**: XL 任务应该拆分为更小的任务

---

### Step 4.6: 编写 03-tasks.md

**文档结构**:
```markdown
# Task List: [功能名称]

## Overview

**总任务数**: X
**预计工作量**: Y 小时
**优先级分布**: 高(A) / 中(B) / 低(C)

## Task Groups

### Group 1: [组名]

#### Task 1.1: [任务名]
[任务详情]

#### Task 1.2: [任务名]
[任务详情]

### Group 2: [组名]
...

## Traceability Matrix
[追溯矩阵]

## Implementation Order
[推荐执行顺序]

## 收口记录
[实施闭环时写入——无收口记录 = 未收口；字段骨架见 templates/03-tasks.template.md]

## 审批状态
- [ ] 用户确认任务完整性
- [ ] 用户确认工作量估算
- [ ] 用户批准进入 Phase 5 (FPF 审查)
（批量授权模式下由批次级一次性授权记录替代，见 SKILL.md「批量模式（Batch Mode）」）
```

---

## 验证检查清单

### 任务完整性

- [ ] **所有需求有对应任务**
  - 对照 01-requirements.md 检查
  - 追溯矩阵无空白

- [ ] **所有属性有对应测试任务**
  - 对照 02-design.md 检查
  - 测试任务覆盖所有属性

- [ ] **所有文件变更有对应任务**
  - 对照 02-design.md 的 File Changes Summary
  - 无遗漏文件

### 任务质量

- [ ] **粒度适当**
  - 无 XL 任务
  - 每个任务 2-4 小时

- [ ] **描述清晰**
  - 无模糊词汇
  - 可以独立理解

- [ ] **验收标准可验证**
  - 每个标准可以测试
  - 标准具体明确
  - 判据为仓库级不变量而非文件清单，门命令已对基线试跑
  - 不可执行 AC 已按 waiver 协议处理（显式 deferred 或等价证据包，禁升级 completed）

### 追溯完整性

- [ ] **追溯矩阵完整**
  - 所有需求已追溯
  - 所有属性已追溯

- [ ] **Validates 字段正确**
  - 与追溯矩阵一致
  - 格式正确

---

## 常见问题

### Q1: 任务太大怎么拆分？

**解决方案**:
1. 按文件拆分: 每个文件一个任务
2. 按功能拆分: 每个子功能一个任务
3. 按层次拆分: 配置/实现/测试分开

**示例**:
```
原任务: 实现中文支持 (XL)
拆分后:
- Task 1: 添加语言配置 (S)
- Task 2: 创建翻译文件 (L)
- Task 3: 注册资源 (S)
- Task 4: 编写测试 (M)
```

### Q2: 任务之间有循环依赖怎么办？

**解决方案**:
1. 重新分析依赖关系
2. 提取公共部分为独立任务
3. 使用接口/mock 解耦

### Q3: 如何处理不确定的任务？

**解决方案**:
1. 添加 "调研" 任务
2. 在描述中说明不确定性
3. 预留缓冲时间

---

## 时间估算

| 步骤 | 简单功能 | 中等功能 | 复杂功能 |
|------|---------|---------|---------|
| 分析设计 | 15 min | 30 min | 45 min |
| 分组排序 | 10 min | 20 min | 30 min |
| 编写任务 | 30 min | 60 min | 120 min |
| 追溯矩阵 | 15 min | 30 min | 45 min |
| 工作量估算 | 10 min | 15 min | 30 min |
| 文档整理 | 10 min | 20 min | 30 min |
| **总计** | **90 min** | **175 min** | **300 min** |

---

## 相关链接

- [返回主文档](../SKILL.md)
- [上一阶段: Phase 3 技术设计](./phase3-design.md)
- [下一阶段: Phase 5 FPF 审查](./phase5-fpf-review.md)
- [模板文件](../templates/03-tasks.template.md)
