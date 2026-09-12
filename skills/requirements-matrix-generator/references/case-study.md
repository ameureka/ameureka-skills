# 案例：管理后台审计 → 需求矩阵

## 输入：FPF 审计报告

来源：`001-管理后台FPF审计报告.md`
审计范围：11 个受保护页面
发现问题：9 个（P0×3, P1×2, P2×2, P3×2）

### 问题清单

| # | 问题 | 优先级 | 证据 |
|---|------|--------|------|
| 1 | SectionCards 假数据 | P0 | section-cards.tsx 硬编码 $1,250.00 |
| 2 | ChartAreaInteractive 假数据 | P0 | 90行硬编码 2024 年访客数据 |
| 3 | DataTable + data.json 假数据 | P0 | 803行假表格 + 614行假数据 |
| 4 | Dashboard N+1 查询 | P1 | Promise.all(enrollments.map(async...)) |
| 5 | Admin Courses 操作无反馈 | P1 | redirect() 无 loading/toast |
| 6 | Admin 缺少运营概览 | P2 | dashboard 无 role 条件判断 |
| 7 | Admin 缺少订单管理 | P2 | sidebar 只有 Users + Courses |
| 8 | Admin Courses 信息密度高 | P3 | Stripe ID 直接展示 |
| 9 | Dashboard 空状态简陋 | P3 | 只有虚线边框 |

## Step 2: 技术分层映射

| 问题 | → 层级 | 编号 | 文档标题 | 理由 |
|------|--------|------|---------|------|
| #1-3 合并 | 40-frontend | UI-001 | Dashboard模板残留清理 | 删除 UI 组件 |
| #4 | 30-database | DB-001 | Dashboard批量查询优化 | 查询性能问题 |
| #5 | 40-frontend | UI-004 | Admin课程操作反馈 | 交互体验 |
| #6 | 10-business-logic | BL-001 | Admin运营数据聚合 | 数据聚合逻辑 |
| #6 | 40-frontend | UI-002 | Admin运营概览面板 | 展示组件 |
| #7 | 20-api-specs | API-001 | Admin订单查询端点 | 查询接口 |
| #7 | 40-frontend | UI-003 | Admin订单管理页面 | 页面结构 |
| #7 | 70-code-standards | NAV-001 | 侧边栏扩展 | 导航配置 |
| 权限补齐 | 60-security | SEC-001 | Admin权限统一检查 | 安全加固 |

### 映射决策说明

- **#1-3 合并为 UI-001**：三个假数据组件都是"删除 UI 残留"，技术本质相同
- **#6 拆分为 BL-001 + UI-002**：数据聚合是业务逻辑（BL），展示面板是前端（UI）
- **#7 拆分为 API-001 + UI-003 + NAV-001**：查询端点（API）、页面（UI）、导航（NAV）各归其位
- **SEC-001 新增**：审计发现 `listAdminCourses()` 缺少权限检查，补充安全需求
- **#8/#9（P3）不生成需求文档**：经暴露度/收益评估记入 00-INDEX.md「已知缺口」登记（Step 5 场景覆盖度审计要求缺口显式化，不允许静默消失）

## 输出：9 个需求文档

```
requirements/
├── 00-INDEX.md
├── 10-business-logic/
│   └── BL-001-Admin运营数据聚合.md          # P2
├── 20-api-specs/
│   └── API-001-Admin订单查询端点.md          # P2
├── 30-database/
│   └── DB-001-Dashboard批量查询优化.md       # P1
├── 40-frontend/
│   ├── UI-001-Dashboard模板残留清理.md       # P0
│   ├── UI-002-Admin运营概览面板.md           # P2
│   ├── UI-003-Admin订单管理页面.md           # P2
│   └── UI-004-Admin课程操作反馈.md           # P1
├── 60-security/
│   └── SEC-001-Admin权限统一检查.md          # P2
└── 70-code-standards/
    └── NAV-001-侧边栏扩展.md                # P2
```

## 下游提示

```
✅ 需求矩阵已生成，共 9 个需求文档。

接下来请对每个需求文档调用 /ameureka-spec-dev 生成 4 文件 Kiro Specs
（01-04；矩阵模式下 00-discovery 由需求文档替代，默认跳过）：

1. /ameureka-spec-dev → UI-001-Dashboard模板残留清理.md (P0)
2. /ameureka-spec-dev → DB-001-Dashboard批量查询优化.md (P1)
3. /ameureka-spec-dev → UI-004-Admin课程操作反馈.md (P1)
4. /ameureka-spec-dev → BL-001-Admin运营数据聚合.md (P2)
5. /ameureka-spec-dev → API-001-Admin订单查询端点.md (P2)
6. /ameureka-spec-dev → UI-002-Admin运营概览面板.md (P2)
7. /ameureka-spec-dev → UI-003-Admin订单管理页面.md (P2)
8. /ameureka-spec-dev → SEC-001-Admin权限统一检查.md (P2)
9. /ameureka-spec-dev → NAV-001-侧边栏扩展.md (P2)

输出目录：requirements-specs/{层级编号}-{类别}/{前缀}-{序号}-{英文slug}/
```

---

## 附：008 实施期验证（2026-07-08 · SSD 全链首次端到端）

上例是「审计 → 矩阵」的静态映射。008 docs 优化专项把矩阵一路带到 **12/12 spec 全终态**，
首次在**实施期**回证了 v2.0 四个核心机制真实生效（无机制返工）。下面是可复用的实施期证据。

### 输入规模

- 8 维 runtime-first 审计、95 条发现（4 P0 组全 CONFIRMED）→ 本 skill 生成 **12 需求文档**（UI×8 / SEC×1 / CODE×2 / DEP×1，4 层 + 6 空层有理由）
- 下游：12 套 Kiro Specs（R_eff 0.95-0.97）→ loop 无人值守 4 波实施 → 12/12 全终态

### 机制① 共享文件热点表 → 零冲突实施合约

热点表预判 `billing.mdx` 被 **UI-002 / UI-004 / UI-005 / SEC-001** 四需求跨 3 波触碰，登记「合并者模式：UI-004 为主改者，其余申报差异」。
实施期四波串行改同一文件**零冲突**——主改者一次性重写计费披露，其余需求只申报各自差异行（术语 / 端点口径 / 禁词）。

> 固化：热点表的**主改者字段**是并行/串行分组的依据，不是备注。同波多需求碰同一文件 → 指定主改者 + 其余申报差异；跨波碰同一文件 → 晚波实施前重验早波改后的行号。

### 机制② 波次 structure-first 标注 → 下游锚点漂移防线

CODE-001（全域 252 处 `token101.ai → token.ppthub.shop`，32 文件）标注 structure-first、排 Wave 1 首个。
落地（`8ba094ed`）后下游 11 需求的 file:line 锚点全部漂移；波次计划「structure-first 先行 + 波间前提复核」在实施期兑现——下游逐一对当前 HEAD 重验锚点后再动手，无一处改错行。

> 固化：任何**全域替换 / 大范围结构调整类需求**必须标 structure-first 并排波首；INDEX 波次计划的「波间前提复核」提示不是客套话，是防漂移的硬门。

### 机制③ 追溯表 → 实施期可核对的「零遗漏」账本

95 发现 → 12 承接 + **8 条 INDEX 显式登记**（LEK-1/BS-4 拍板不立、BS-7/BS-8 Frozen、SEO-8 人工、COV-10/11 open 条件组、SEO-9 正向核销）。
实施收口时逐条回填 Status，无一发现掉队。

> 固化：追溯表要覆盖**不立需求的去向**（拍板不立 / Frozen / 人工待办 / open 条件组 / 正向核销五类都要有承接列），否则「零遗漏」在实施期不可核销——「没写进任何需求」与「有意不立」必须可区分。

### 机制④ 决策依赖（条件组）+ Frozen(tripwire) → 实施期正确解卡

- **open 决策给默认分支**：COV-10（plans 是否公开）/COV-11（Chat Completions 专属页）未拍板，条件组写明默认分支 → UI-002/UI-006 走默认分支落地，实施**不阻塞**。
- **dormant 高危给触发器**：BS-7（法务连接）/BS-8（fumadocs 升级）/ 截图族（LEK-4/5/15，依赖产品 UI 先修）登记 Frozen(tripwire)，实施期触发器未命中 → 正确「不做」，既不漏也不过度工程。

> 固化：open 决策**必须**给默认分支（否则实施期卡死等拍板）；dormant 高危**必须**给触发器（否则要么被漏做、要么被强行做成白工——如截图族改了 UI 缺陷还在）。

### 一句话

v2.0 的热点表 / 波次 / 追溯表 / 决策依赖四机制，008 实施期**全部实锤兑现、零机制返工**——矩阵阶段多花的结构化功夫，在 12 波串行实施里换来零冲突、零漂移改错、零遗漏。
