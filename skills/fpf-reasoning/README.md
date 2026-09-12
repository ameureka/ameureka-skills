# FPF-Reasoning Skill

基于 Quint Code 的第一性原理推理框架 (First Principles Framework)。

## 功能概述

FPF 是一个结构化的决策推理框架，通过 6 个阶段将模糊的问题转化为有证据支持的决策：

```
问题 → 假设 → 验证 → 测试 → 审计 → 决策
```

## 前置条件

- Quint Code MCP 服务已安装并启用
- 项目根目录存在 `.mcp.json` 配置

## 快速开始

### 完整流程

```bash
/q0-init          # 初始化上下文
/q1-hypothesize   # 生成假设
/q2-verify        # 逻辑验证
/q3-validate      # 实证验证
/q4-audit         # 信任审计
/q5-decide        # 最终决策
```

### 状态检查

```bash
quint_status        # 查看假设状态
quint_check_decay   # 检查证据衰减
```

## 6 阶段说明

| 阶段 | 命令 | 输入 | 输出 |
|------|------|------|------|
| Q0 | `/q0-init` | 项目信息 | `.quint/context.md` |
| Q1 | `/q1-hypothesize` | 问题描述 | L0 假设 |
| Q2 | `/q2-verify` | L0 假设 | L1 假设 |
| Q3 | `/q3-validate` | L1 假设 | L2 假设 |
| Q4 | `/q4-audit` | L2 假设 | R_eff 分数 |
| Q5 | `/q5-decide` | 用户选择 | DRR 记录 |

## 核心概念

- **假设层级**: L0 (未验证) → L1 (逻辑验证) → L2 (实证验证)
- **R_eff**: 有效可靠性分数，基于 WLNK (最弱环节) 原则
- **DRR**: 设计理由记录，决策的最终文档
- **Transformer Mandate**: 人类决策，AI 记录

## 参考文档

- [quint-tools.md](references/quint-tools.md) - MCP 工具速查
- [hypothesis-layers.md](references/hypothesis-layers.md) - 假设层级系统
- [trust-calculus.md](references/trust-calculus.md) - 信任计算原理
- [decision-record.md](references/decision-record.md) - DRR 格式规范

## 目录结构

```
.quint/
├── context.md          # 项目上下文
├── knowledge/
│   ├── L0/             # 未验证假设
│   ├── L1/             # 逻辑验证假设
│   ├── L2/             # 实证验证假设
│   └── invalid/        # 无效假设
├── evidence/           # 验证证据
├── decisions/          # DRR 记录
└── quint.db            # SQLite 数据库
```

## 版本

- **Version**: 1.0
- **Updated**: 2024-12-26
- **Based on**: Quint Code MCP
