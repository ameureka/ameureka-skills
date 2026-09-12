---
name: cowork-sync
description: |
  Claude Code ↔ Codex 组队协作：同步接手对方的工作。
  当用户说"cowork sync"、"同步"、"接手"、"sync"、"继续对方的工作"时触发。
  读取项目目录下 .teams/projects/bridge/ 的最新交接文档和 shared-context，
  展示对方的工作成果并准备继续协作。
---

<!-- 教学注释
模块: L2-G Skill集成实战
教学要点:
  - 本 Skill 演示了多Agent协作的同步接手流程
  - 学员常见误区: 认为"sync"就是实时协作，实际是基于文件的交接机制
  - 建议用时: 8min demo
  - 降维对照: 同步接手 = 交接班 — 上一班写好交接记录，下一班读记录继续干
-->

# Cowork Sync — 同步接手

## 触发词
用户说以下任一关键词时触发本 Skill：
- `cowork sync`
- `同步`
- `接手`
- `sync`
- `继续对方的工作`

## 执行步骤

### Step 1: 定位项目根目录下的 .teams/

**关键规则：`.teams/` 必须在项目目录下，绝对不能去 `~/` 或系统根目录找。**

定位方式（按优先级）：
1. 运行 `find "$(pwd)" -maxdepth 3 -type d -name ".teams" | head -1` 查找当前工作目录下的 `.teams/`
2. 如果当前目录没有，向上查找：检查 `../.teams/`、`../../.teams/` 直到找到
3. 如果都找不到，告知用户：
   > ⚠️ 未找到 .teams/ 目录，无法同步。请确认项目中已初始化 Teams 协作系统。
   > 初始化命令：`mkdir -p .teams/projects/{bridge,logs,shared-context}`

找到后，将该路径记为 `$TEAMS_DIR`（绝对路径），后续所有文件操作都基于此路径。

**示例：**
- ✅ 正确：`<项目绝对路径>/.teams/`
- ❌ 错误：`~/.teams/`、`/Users/<用户名>/.teams/`、`.teams/`（相对路径）

### Step 2: 读取最新交接文档

1. 用 Glob 工具查找 `$TEAMS_DIR/projects/bridge/handoff-*.md` 所有文件（使用绝对路径）
2. 按文件名时间戳排序，取最新的一个
3. 用 Read 工具读取完整内容（使用绝对路径）
4. 如果没有任何交接文档，告知用户：
   > ⚠️ 暂无交接文档。对方尚未执行"交接"操作。

### Step 3: 读取共享上下文

用 Read 工具读取以下文件（使用绝对路径，如果存在）：
- `$TEAMS_DIR/projects/shared-context/project-state.md` — 项目状态
- `$TEAMS_DIR/projects/shared-context/decisions.md` — 架构决策

### Step 4: 读取历史交接（可选）

如果最新交接文档中有"进行中"或"待接手"引用了更早的文档，也一并读取，以获得完整上下文。最多向前追溯 3 份文档。

### Step 5: 汇总展示

向用户输出格式化的同步报告：

```
🔄 === Cowork Sync ===

📁 Teams 路径: {$TEAMS_DIR}
📋 最新交接: handoff-{timestamp}-from-{agent}.md
⏰ 交接时间: {时间}
👤 来源: {agent名称}

---

## 对方完成了什么 🟢
{已完成列表}

## 正在进行的工作 🟡
{进行中列表，包含进度说明}

## 需要你接手的任务 🔵
{待接手列表，包含前置条件}

## 注意事项 ⚠️
{对方留下的提醒}

## 关键文件
{文件变更列表}

---

📊 项目当前状态:
{project-state.md 的内容摘要}

=== Sync 完成 ===
```

### Step 6: 主动进入工作状态

同步完成后，**主动提出建议**：
1. 如果有"待接手"任务，询问用户是否从第一个开始
2. 如果有"进行中"任务，提醒用户可以继续
3. 如果没有明确任务，展示项目状态并等待指示

### Step 7: 记录同步日志

用 Write 工具写入 `$TEAMS_DIR/projects/logs/session-{YYYYMMDD_HHMMSS}-claude-code.md`（使用绝对路径）：

```markdown
# Session Log
**时间**: {时间}
**Agent**: claude-code
**动作**: cowork-sync
**同步的交接文档**: {filename}
**接手任务数**: {count}
```

## 重要规则

1. **所有文件操作必须使用项目目录下 `.teams/` 的绝对路径** — 绝对不能去 `~/.teams/`、`/tmp/` 或任何项目外的位置读写
2. **Read/Write/Glob 工具需要绝对路径** — 先用 Step 1 确定 `$TEAMS_DIR` 的绝对路径，后续全部基于它
3. **必须读取完整的交接文档** — 不要跳过任何部分
4. **主动理解上下文** — 不是简单展示文本，要理解对方的工作并给出建议
5. **关键文件要验证存在** — 读取交接文档中列出的关键文件，确认它们确实存在
6. **自然过渡** — 同步后应该像接力一样自然地继续工作，不需要用户再额外解释背景
