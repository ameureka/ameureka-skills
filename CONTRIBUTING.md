# 贡献指南

感谢你愿意贡献。本仓库同时收纳两类东西，它们的贡献方式不同：

- **`skills/`** — 提示词型 skill，主要是 Markdown，改起来轻，**但每一行都会被 AI 当指令执行**。
- **`tools/`** — 真实可运行的 CLI，改完要跑测试。

## 提 Issue 之前

- 先确认你的 AI Code Assistant 版本与本 skill 兼容。
- Skill 类问题请附上：触发词、你的输入、实际输出 vs 期望输出。
- 工具类问题请附上：操作系统、Node/Python 版本、完整报错。

## 改 Skill（skills/）

Skill 的质量取决于**AI 会不会照做**，所以：

1. **指令要可执行**。写「分析代码质量」不如写「列出超过 50 行的函数并逐个说明」。
2. **`description` 是唯一的分发开关**。YAML frontmatter 里的 `description` 决定 AI 何时触发这个 skill —— 改动它等于改变触发条件，请在 PR 里说明你新增/收窄了哪些触发场景。
3. **别用相对路径指向仓库外的东西**（如 `_skills/xxx`、`~/code/secret`）。全新 clone 上这些路径不存在，skill 会当场失效。
4. **正文语言**：现有 skill 正文为中文，术语/关键字保留英文。新增 skill 请沿用。
5. 改完请实际触发一次，确认它按预期跑完整个流程。

## 改工具（tools/）

```bash
# present-met-ppt-kit
cd tools/present-met-ppt-kit
npm test          # 必须全绿
npm run lint

# gpt-imageflow
cd tools/gpt-imageflow
python3 -m pytest
```

- 新功能请配测试。这两个工具的测试都是**不变量测试**（判的是「改坏了一定会错」的结构性事实），沿用这个思路比堆覆盖率有用。
- `present-met-ppt-kit` 的 `measure.js` 是越界测量的**唯一口径**，`fit` 和 `screenshot` 共用。改它等于改所有页面的判定结果，请特别谨慎。

## 提交规范

- 提交信息用中文或英文均可，一句话说清「改了什么 + 为什么」。
- 一个 PR 只做一件事。
- **不要提交**：真实凭据、`.env`、`node_modules/`、构建产物（`.pptx`、预览图）、`.DS_Store`。`.gitignore` 已覆盖，但 PR 前请自查：

```bash
git status --short
git diff --cached --name-only | grep -E "\.env$|node_modules|\.DS_Store"
```

如果你发现仓库里混入了真实凭据，请发邮件给维护者而**不要**开公开 issue——见 [SECURITY.md](SECURITY.md)。

## License

贡献即表示你同意你的代码以 [MIT](LICENSE) 协议发布。
