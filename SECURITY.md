# 安全政策

## 支持的版本

本仓库是 skills / 工具集合，没有固定的发布节奏。请始终使用 `main` 分支最新版本。

## 报告漏洞

**发现真实凭据泄露、或任何安全问题，请不要开公开 issue。**

请通过 GitHub 的 [Private Security Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) 私密报告。

报告时请包含：
- 问题类型（凭据泄露 / 路径穿越 / 命令注入 / 其他）
- 涉及的文件与行号
- 复现步骤
- **不要在报告里粘贴完整的真实凭据**——给前缀即可（如 `sk-ABcd…`，保留前 8 位）

## 已知的安全边界

### gpt-imageflow 需要你自备凭据

`tools/gpt-imageflow` 是**第三方 OpenAI 兼容中转**的客户端，它本身**不含任何密钥**，也不代为保管凭据。你需要：

1. 自行准备中转服务的 API key
2. 放到**仓库之外**（推荐 `~/.config/gpt-imageflow/.env`，权限 `600`），用 `--env-file` 指定
3. 定期轮换

`.gitignore` 已忽略 `*.env`，但这**只覆盖 git**。zip 打包、`rsync`、备份同步、`docker COPY`、`git add -f` 都不受它保护——这是你的责任，不是工具能兜住的。

### Skill 会执行 AI 指令

`skills/` 下的内容是给 AI 读的指令，AI 会按其行事。来自不可信来源的 skill 应当被当作**可执行代码**审阅后再安装——不要盲装第三方 skill。

### present-met-ppt-kit 依赖外部转换器

`build` 需要你显式提供 `html2pptx.js`（不随仓库分发）。构建时会把它复制到临时目录再打补丁，**不会修改你的原文件**；但如果该路径指向不可信脚本，等同于执行了它。请只指向你信任的转换器。
