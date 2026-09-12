# ameureka-skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-7-blue)](skills/)
[![Tools](https://img.shields.io/badge/tools-2-orange)](tools/)

> **English**: A curated collection of [AI Code Assistant](https://claude.com/claude-code) skills — seven
> prompt-driven workflow skills (spec-driven development, blind-spot auditing, requirements matrices,
> FPF reasoning, loop prompts, enterprise SVG diagrams, agent handoff) plus two standalone CLI tools
> (an image-generation client and an HTML→PPTX pipeline). All MIT licensed.

一套 AI Code Assistant Skills 集合：**7 个提示词型 skill + 2 个独立 CLI 工具**。

这些 skill 都来自真实项目里反复做过的事：规范驱动开发、重构前的盲区审计、把审计报告拆成需求矩阵、
给长跑任务写能停得下来的 loop 提示词。不是玩具示例，是踩过坑之后沉淀下来的流程。

## 目录结构

```
skills/   提示词型 skill —— 拷到 ~/.ai-config/skills/<name>/ 即可用，无需安装
tools/    独立命令行工具 —— 需要 npm install / pip install
assets/   独立素材（如教学示意图 HTML）
```

## 一条完整链路

其中 4 个 skill 是**串起来的**——前一个的产出就是后一个的输入，适合「先摸清现状，再落成代码」这类大改动：

```
blindspot-audit              → 审计文档集（含决策台账）
  ↓  （你在 00 文档里拍板 D-x 决策后）
requirements-matrix-generator → requirements/（需求矩阵）
  ↓
ameureka-spec-dev            → Kiro Specs 四件套
  ↓
loop-prompt-generator        → 无人值守批量执行提示词
```

其余 3 个（`fpf-reasoning`、`enterprise-svg-architect`、`cowork-sync`）独立使用，不在这条链上。

## 共同的设计取向

这套 skill 不是「让 AI 自由发挥」，而是**给 AI 装上刹车**。几个反复出现的机制：

- **量化而不是感觉**：`R_eff = min(D1..D5)` —— 取最弱环节，且**禁止手工上调**。分数不够就重做，不允许说服自己「差不多行了」。
- **对抗证伪**：先假设自己错了，主动去找反例，而不是找证据支持已有结论。
- **双证原则（runtime-first）**：代码里实际跑出来的行为优先于文档、注释和你我以为。
- **确定性停止条件**：长跑任务必须能判定「做完了」，不能无限循环下去。

## Skills

| Skill | 一句话 | 目录 |
|---|---|---|
| **ameureka-spec-dev** | 规范驱动开发：7 阶段流程（发现 → EARS 需求 → 设计 → 任务 → FPF 审查 → 实施 → 验证）把需求转化为双向可追溯的 spec | [skills/ameureka-spec-dev](skills/ameureka-spec-dev) |
| **blindspot-audit** | 重构/优化立项前的多维盲区审计：四象限扩维补全你没想到的维度，产出带对抗证伪与决策台账的审计文档集 | [skills/blindspot-audit](skills/blindspot-audit) |
| **requirements-matrix-generator** | 把差距分析/审计报告转成 10 层技术分类法（BL/API/DB/UI/INT/SEC/CODE/OPS/QA/DEP）的需求矩阵 | [skills/requirements-matrix-generator](skills/requirements-matrix-generator) |
| **fpf-reasoning** | 第一性原理推理：Q0–Q5 六阶段产出带 R_eff 信任度评分与可审计 DRR 决策记录 | [skills/fpf-reasoning](skills/fpf-reasoning) |
| **loop-prompt-generator** | 生成带确定性停止条件、可中断续跑的 loop 提示词（`/goal`、`/loop`、`/schedule`） | [skills/loop-prompt-generator](skills/loop-prompt-generator) |
| **enterprise-svg-architect** | 企业级架构/拓扑 SVG：信任边界分区、协议标注数据流、明暗双主题、可导出 2x PNG | [skills/enterprise-svg-architect](skills/enterprise-svg-architect) |
| **cowork-sync** | 读取 `.teams/` 下对方 Agent 的交接文档与共享上下文，接手继续协作 | [skills/cowork-sync](skills/cowork-sync) |

### 安装

```bash
# 方式一：直接复制
cp -r skills/<name> ~/.ai-config/skills/

# 方式二：symlink（推荐，改仓库即生效）
ln -s "$(pwd)/skills/<name>" ~/.ai-config/skills/<name>
```

## Tools

| 工具 | 一句话 | 环境要求 |
|---|---|---|
| **[gpt-imageflow](tools/gpt-imageflow)** | 经 OpenAI 兼容中转调用 gpt-image-2 出图（单张/批量/封面/能力探测），内置格式嗅探、错误分类与用量记账 | Python ≥ 3.10 |
| **[present-met-ppt-kit](tools/present-met-ppt-kit)** | HTML → PPTX 构建工具链，含裁切、图片自适应、截图越界质检与门禁报告 | Node ≥ 22.13、Python 3 + python-pptx、Chrome |

```bash
# gpt-imageflow
cd tools/gpt-imageflow && pip install -e .

# present-met-ppt-kit
cd tools/present-met-ppt-kit && npm install && pip install -r requirements.txt
```

两个工具的外部依赖与注意事项见各自 README：
- `gpt-imageflow` 需要**自备**第三方中转的 API key（[安全须知](tools/gpt-imageflow/README.md)）
- `present-met-ppt-kit` 需要**外部** `html2pptx.js`（不随仓库分发，见其 README）

## 快速校验

```bash
cd tools/present-met-ppt-kit && npm test        # 22 tests
cd tools/gpt-imageflow && python3 -m pytest     # 8 tests
```

## License

[MIT](LICENSE) © 2026 amerlin

各 skill 的溯源与授权定性见目录内的 `SOURCE-NOTE.md`。
