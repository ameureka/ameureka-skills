# cowork-sync

读取项目 `.teams/` 目录下对方 Agent 留下的交接文档与 shared-context，把「对方做了什么 / 正在做什么 / 等你接手什么」汇总成一份同步报告，让你像交接班一样直接接着干。

## 触发场景

| 触发词 | 说明 |
|---|---|
| `cowork sync` | 显式调用本 skill |
| `同步` | 同步对方的最新进展 |
| `接手` | 接手对方未完成的工作 |
| `sync` | `cowork sync` 的简写 |
| `继续对方的工作` | 接续另一位 Agent 的会话 |

典型使用场景：

- AI Code Assistant 与 Codex 组队，你需要接手 Codex 那一半工作，但手上只有它留下的文件。
- 一个跨会话的长任务中断后，你想知道上一轮做到哪一步、哪些任务还没动。
- 你不想再向 Agent 复述一遍项目背景，希望它自己去读交接文档和项目状态。

## 解决什么问题

AI Code Assistant 与 Codex 等 Agent 组队时，无法实时共享会话上下文，只能靠对方留下的文件来接续工作。本 skill 读取项目 `.teams/` 目录下对方 Agent 的最新交接文档与 shared-context，把「对方做了什么 / 正在做什么 / 等你接手什么」汇总成同步报告。你不需要再复述背景，看完报告就能直接进入工作状态。

## 工作流程

1. **Step 1: 定位项目根目录下的 `.teams/`** —— 关键规则：必须在项目目录下，绝不能去 `~/` 或系统根目录找。定位方式按优先级：① 运行 `find "$(pwd)" -maxdepth 3 -type d -name ".teams" | head -1`；② 当前目录没有则向上查找 `../.teams/`、`../../.teams/` 直到找到；③ 都找不到则提示 `⚠️ 未找到 .teams/ 目录，无法同步`，并给出初始化命令 `mkdir -p .teams/projects/{bridge,logs,shared-context}`。找到后记为 `$TEAMS_DIR`（绝对路径），后续所有文件操作基于此路径。
2. **Step 2: 读取最新交接文档** —— 用 Glob 查找 `$TEAMS_DIR/projects/bridge/handoff-*.md`（绝对路径），按文件名时间戳排序取最新一个，用 Read 读取完整内容；若没有任何交接文档则告知 `⚠️ 暂无交接文档。对方尚未执行"交接"操作。`
3. **Step 3: 读取共享上下文** —— 用 Read（绝对路径，若存在）读取 `$TEAMS_DIR/projects/shared-context/project-state.md`（项目状态）与 `$TEAMS_DIR/projects/shared-context/decisions.md`（架构决策）。
4. **Step 4: 读取历史交接（可选）** —— 若最新交接文档中有「进行中」或「待接手」引用了更早的文档，一并读取以获得完整上下文，最多向前追溯 3 份文档。
5. **Step 5: 汇总展示** —— 向用户输出格式化的同步报告，模板固定为 `🔄 === Cowork Sync ===` 开头，含 `📁 Teams 路径`、`📋 最新交接`（`handoff-{timestamp}-from-{agent}.md`）、`⏰ 交接时间`、`👤 来源`，正文分「## 对方完成了什么 🟢」「## 正在进行的工作 🟡」「## 需要你接手的任务 🔵」「## 注意事项 ⚠️」「## 关键文件」，末尾追加 `📊 项目当前状态`（`project-state.md` 内容摘要）与 `=== Sync 完成 ===`。
6. **Step 6: 主动进入工作状态** —— 同步完成后主动提出建议：① 有「待接手」任务则询问是否从第一个开始；② 有「进行中」任务则提醒可继续；③ 没有明确任务则展示项目状态并等待指示。
7. **Step 7: 记录同步日志** —— 用 Write 工具写入 `$TEAMS_DIR/projects/logs/session-{YYYYMMDD_HHMMSS}-claude-code.md`（绝对路径），内容为含 `# Session Log` / `**时间**` / `**Agent**: claude-code` / `**动作**: cowork-sync` / `**同步的交接文档**` / `**接手任务数**` 的 markdown。

## 输入 / 产出

| | 内容 |
|---|---|
| **输入** | 用户的触发语句（如 `cowork sync`、`同步`、`接手`、`sync`、`继续对方的工作`） |
| | 项目根目录下的 `.teams/` 目录（`$TEAMS_DIR`，必须为项目内绝对路径） |
| | `$TEAMS_DIR/projects/bridge/handoff-*.md` —— 对方 Agent 的交接文档（取时间戳最新的一份，可向前追溯最多 3 份） |
| | `$TEAMS_DIR/projects/shared-context/project-state.md` —— 项目状态（若存在） |
| | `$TEAMS_DIR/projects/shared-context/decisions.md` —— 架构决策（若存在） |
| | 交接文档中列出的关键文件（需在 Step 5 验证其确实存在） |
| **产出** | 终端输出的格式化同步报告（模板：`🔄 === Cowork Sync ===` … `=== Sync 完成 ===`） |
| | `$TEAMS_DIR/projects/logs/session-{YYYYMMDD_HHMMSS}-claude-code.md` —— 本次同步的 session 日志（Write 工具写入，Agent 字段固定为 `claude-code`，动作字段固定为 `cowork-sync`） |

## 目录结构

```
skills/cowork-sync/
└── SKILL.md    # skill 唯一文件：YAML frontmatter（name/description + 触发场景）
                # + 教学注释 + 触发词清单 + Step 1–7 执行步骤
                # （定位 .teams / 读交接文档 / 读 shared-context / 追历史交接
                #  / 汇总展示报告模板 / 主动进入工作状态 / 写同步日志）
                # + 6 条重要规则
                # 目录下不存在 references/、templates/、scripts/ 子目录
```

依赖的项目侧目录（由 `mkdir -p .teams/projects/{bridge,logs,shared-context}` 初始化，不属于本 skill 仓库）：

```
<项目根目录>/.teams/
└── projects/
    ├── bridge/            # 交接文档 handoff-{timestamp}-from-{agent}.md
    ├── logs/              # 同步日志 session-{YYYYMMDD_HHMMSS}-claude-code.md
    └── shared-context/    # project-state.md、decisions.md
```

## 注意事项

- ❌ 错误：`.teams/` 定位到 `~/.teams/`、`/Users/<用户名>/.teams/` 或使用相对路径 `.teams/`；✅ 正确只能是 `<项目绝对路径>/.teams/` —— Step 1 明确标注为「关键规则」。
- 所有文件操作（含 `/tmp/`）必须在项目目录下 `.teams/` 的绝对路径内 —— 重要规则第 1 条。
- Read/Write/Glob 工具一律需要绝对路径，必须先用 Step 1 确定 `$TEAMS_DIR` 再基于它拼路径 —— 重要规则第 2 条。
- 必须读取完整的交接文档，不要跳过任何部分 —— 重要规则第 3 条。
- 不能只做文本搬运，要主动理解对方工作并给出建议 —— 重要规则第 4 条。
- 交接文档里列出的关键文件必须验证其确实存在 —— 重要规则第 5 条。
- 同步后要像接力一样自然继续，不应要求用户再解释背景 —— 重要规则第 6 条。
- 教学注释中标注的学员常见误区：认为「sync」是实时协作，实际上它是**基于文件的交接机制**。
- 追溯历史交接有硬上限：最多向前追溯 3 份文档。
- 前置依赖未满足时的两个失败路径：找不到 `.teams/` 目录 → 直接告知无法同步并给出 `mkdir` 初始化命令；找不到任何交接文档 → 告知对方尚未执行「交接」操作。
- 教学注释标注本 skill 属 L2-G「Skill 集成实战」模块，建议 demo 用时 8min。

## 安装

提示词型 skill，无需安装，纯 Markdown —— 按仓库 README 的两种方式之一放置即可。

```bash
# 方式一：直接复制
cp -r skills/cowork-sync ~/.ai-config/skills/

# 方式二：symlink（推荐，改仓库即生效）
ln -s "$(pwd)/skills/cowork-sync" ~/.ai-config/skills/cowork-sync
```

运行前置条件：目标项目必须已初始化 Teams 协作目录，否则 skill 在 Step 1 即中止：

```bash
mkdir -p .teams/projects/{bridge,logs,shared-context}
```

其中 `bridge` 存交接文档、`logs` 存同步日志、`shared-context` 存项目状态。

触发开关完全由 `SKILL.md` frontmatter 的 `description` 决定（CONTRIBUTING.md 指出改动 `description` 等于改变触发条件）。本 skill 目录为单文件结构：`SKILL.md` 之外无 `references/`、`templates/`、`scripts/`。

运行时依赖：无（`runtimeDeps` 为空）。

License: MIT
