# 文档模板库（讲解版）

> **权威源声明**：本文件不再保存模板全文副本（历史上此处与 `templates/` 各存一份，必然漂移）。
> 模板正文的唯一权威源是：
> - [templates/00-INDEX.template.md](../templates/00-INDEX.template.md)（模板版本 2.0）
> - [templates/requirement.template.md](../templates/requirement.template.md)（模板版本 2.0）
>
> 本文件只保留讲解性说明与易错点；改模板只改 `templates/` 一处。

## 1. 00-INDEX.md 结构讲解

权威源见 [templates/00-INDEX.template.md](../templates/00-INDEX.template.md)。要点：

- **必备节**：Document Info / 项目约束清单（权威单点）/ 决策台账 / 共享文件热点表 / 波次实施计划 / 文档矩阵概览 / 按任务类型快速定位 / 文档清单 / 开发优先级矩阵 / 空层不填充理由 / 跨切面实施告警 / AI 开发工作流 / 实施进度收口表 / 下游 Specs 生成
- **项目约束清单是全矩阵唯一权威约束表**：各需求文档只引用本表并登记差异项（新增/豁免/收紧），禁止整表复制——多份副本必然漂移
- **v2.0 新增四节**（决策台账 / 共享文件热点表 / 波次实施计划 / 实施进度收口表）的用途：
  - 决策台账承接阻塞决策的登记与拍板闭环（open|decided + 拍板值回填）
  - 共享文件热点表把实施期共享资源冲突提前到规划期静态预判（热点文件 → 合并者模式 / 分波错开）
  - 波次实施计划把"P0→P3 优先级列表"升级为带每波全量回归门与波间前提复核提示的可执行计划
  - 实施进度收口表落实完成判定纪律：无收口记录 = 未收口，Status 推进以表为准

## 2. 单个需求文档结构讲解

权威源见 [templates/requirement.template.md](../templates/requirement.template.md)。要点：

- **Document Info 含 runtime 复核行**（验证方式 + 日期）：未经 runtime 复核的文档断言不得直接矩阵化（runtime > canon）
- **阻塞决策表**（v2.0 新增）：存在 open 决策时 Status 记 `Blocked (decision)`，需求写成条件组（方案 A/B/C 各一组），拍板后回填并保留未选分支存档
- **项目约束遵循**改为单点引用模式：声明遵循 INDEX 权威表 + 登记本文档差异项
- **代码概要保持概要级**：完整实现代码属于下游 specs/02-design.md
- **相对链接易错点**：需求文档位于 `requirements/{层级编号}-{类别}/` 两级目录内，引用与 `requirements/` 同级的 specs 目录必须写 `../../requirements-specs/...`（历史版本误写 `../requirements-specs/` 导致断链，已在模板 2.0 修复）

## 3. 项目约束通用类别

首次使用时，从以下类别中选择适用项，与用户确认具体值；**批量授权模式下本确认降级为"输出约束表供事后审查"，不阻塞生成**（已有权威规则文件的项目优先直接引用，本工作区见 `.claude/rules/*`）：

| 类别 | 常见约束 | 示例 |
|------|---------|------|
| 导入路径 | 绝对/相对路径规范 | `@/` 绝对路径 |
| 主键生成 | ID 生成策略 | `nanoid()`, `uuid()`, `cuid()` |
| 价格单位 | 货币精度 | 整数分（cents） |
| i18n | 国际化方案 | `next-intl` 双语 zh/en |
| 认证中间件 | 权限检查方式 | `adminActionClient` / `userActionClient` |
| 输入验证 | 验证库 | Zod schema |
| 错误处理 | 错误响应格式 | `{ error: { type, message } }` |
| 状态管理 | 客户端状态方案 | React Server Components / Zustand |
| 样式方案 | CSS 方案 | Tailwind CSS |
| 组件库 | UI 组件来源 | shadcn/ui |
