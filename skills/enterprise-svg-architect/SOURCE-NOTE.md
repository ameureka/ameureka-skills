# SOURCE-NOTE — enterprise-svg-architect

- **来源**: `~/.claude/skills/enterprise-svg-architect`
- **快照日**: 2026-07-16
- **License 定性**: `self-authored`（自研，无第三方内容）→ 🟢 green
- **对 YouTube 线的角色**: 企业级架构/拓扑 SVG 图（信任边界/协议流/明暗双主题/2x PNG 导出）——003 技术解说的系统图解直接可用，与 003 CLI 图解工具集互补（分桶 B·素材生成类）。
- **真值方向**: **仓库为权威**（D-1a）。用户级将换 symlink 指向本目录。
- **敏感值扫描**: 2026-07-16 通过（"token/assertion exchange" 为 SSO 概念表述，无凭据值）。
- **运行时依赖**: `scripts/svg_to_png.py` 需系统有 rsvg-convert / ImageMagick / Chrome 之一（脚本内自探测）。
