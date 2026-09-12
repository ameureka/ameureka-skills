# enterprise-svg-architect

画企业级架构 / 拓扑 SVG 的提示词型 skill：固定坐标与配色规范、信任边界分区、明暗双主题、可导出 2x PNG。

## 触发场景

SKILL.md frontmatter 的 `description` 是唯一分发 / 触发开关，其中显式声明的 `Trigger phrases —` 原样只有下面这些：

| 中文 | 英文 |
|---|---|
| 架构图 | enterprise architecture diagram |
| 拓扑图 | topology diagram |
| 部署图 | zero-trust access diagram |
| 集成图 | SSO integration diagram |
| 接入图 | — |
| 信任边界 | — |
| 最终效果图 | — |

`description` 前半段的 Use-when 句还覆盖了这些**描述性触发**（不是 `Trigger phrases` 原样项，但同样会命中）：

- `system architecture`
- `network topology`
- `deployment diagram`
- `integration or 接入 diagram`
- `an auth/login flow at the architectural level`
- `trust boundaries`
- `how system X integrates into system Y`

典型使用场景：

- 身份与认证类：SSO 集成、identity federation、OIDC / SAML 登录流在架构层的表达
- 零信任与无端（clientless）访问：公网 / DMZ / 内网之间的访问路径与信任边界
- 反向代理 / 网关收敛：多个入口如何汇聚到统一网关
- 系统集成与接入：system X 如何接入 system Y
- 部署拓扑：hub-and-spoke 形态的服务分布

## 解决什么问题

画企业级架构 / 拓扑图时，通用 SVG 生成往往产出「好看但无信息」的图：框重叠、中文标签溢出、没有信任边界、明暗主题下文字变不可读、导出 PNG 后中文变豆腐块。本 skill 用一套固定的坐标 / 配色 / 字宽规范、现成骨架模板和导出脚本，把架构图变成可复现、能在深色模式下正常显示、并能导出 2x PNG 用于文档 / PPT 的产物。

## 工作流程

1. **Scope the diagram**：确认三件事 —— (a) 涉及的系统 / 组件、(b) 每个组件所在的信任域（public / DMZ / internal / partner）、(c) 要展示的主流程；只在不确定时才问。数一数名词，若组件 >8 个，拆成 overview + 每流程细节图，而不是塞进一张密集画布（SKILL.md Workflow 1）。
2. **Pick a topology pattern**：读 `references/architecture-patterns.md`，从 zoned-lanes / reverse-proxy convergence / zero-trust (clientless) access / SSO identity federation / hub-and-spoke 中选一个，不要从零发明布局（SKILL.md Workflow 2）。
3. **写 SVG 之前先做布局数学**：读 `references/svg-conventions.md` 的坐标系、CJK 字宽校准、box-sizing 公式、zone 嵌套规则与 viewBox 检查清单；先算宽度和间距（挤在一起 / 重叠是第一大失败）（SKILL.md Workflow 3）。
4. **从模板起步**：复制 `assets/template.svg`（已含 light+dark `<style>`、arrow marker、zone / node / flow / legend 示例 —— 实际是 2 个 zone + 2 个节点 + 1 条 flow + 2 项 legend），然后填节点和流程（SKILL.md Workflow 4）。
5. **按 z-order 绘制**：zones → components → flows → legend。Zones 是大的虚线容器（每条一个色带）；components 是按类别着色的实心节点；flows 是带短协议标签的箭头，标签放在空白处；只要颜色或线型承载了含义，就加一行 legend（SKILL.md Workflow 5）。
6. **核验**：用 `references/svg-conventions.md` 底部的 Pre-flight verification checklist 逐条核对 —— viewBox 装得下、无重叠、无箭头穿过无关方框、每个 `text` 都有 class、CJK 标签装得进盒子、每个颜色都有 dark-mode override（SKILL.md Workflow 6）。
7. **写 `.svg` 文件并导出 PNG**：`scripts/svg_to_png.py <file.svg>`（默认 2x）；回读 PNG 目视确认 CJK 已渲染（无豆腐块）且没有被裁切（SKILL.md Workflow 7）。
8. **渲染与交付**：若 visualize 插件可用，把 SVG 源码传给 `show_widget` 做 inline 渲染；并 / 或交付 `.svg` + `@2x.png` 两个文件（SKILL.md Workflow 8）。

交付：把 `.svg`（自适应源）和 `@2x.png`（便携版）保存在用户相关文件旁，用带日期的描述性命名，例如 `<project>_<subject>_架构图_YYYYMMDD.svg`；呈现前必须目视验证导出的 PNG（SKILL.md Delivery）。

## 输入 / 产出

**输入**

| 输入 | 说明 |
|---|---|
| 用户描述 | 对「系统 / 组件、各自所在信任域、主流程」的口述或文档描述（Workflow 步骤 1 要确认的三项） |
| `assets/template.svg` | 作为起点骨架直接复制 |
| `references/architecture-patterns.md` | 布局模式，先读后选 |
| `references/svg-conventions.md` | 坐标系 / 调色板 / 字宽表，先读后算 |
| `scripts/svg_to_png.py` 入参 | input `.svg` 路径，可选 `-s/--scale`（默认 2.0）、`-o/--output` |

**产出**

| 产出 | 说明 |
|---|---|
| `<project>_<subject>_架构图_YYYYMMDD.svg` | 自适应明暗主题的自包含 SVG 源文件（Delivery 节指定的命名格式） |
| `input@2x.png` | 脚本默认导出产物（base + `@` + scale + `x.png`；`-s 3` 时得到 `@3x.png`，`-o` 可显式指定路径） |
| 图内 legend | 当颜色或线型承载含义时必附的一行图例 |
| inline 渲染结果 | 若 visualize 插件可用，通过 `show_widget` 传入 SVG 源码 |

## 目录结构

```
skills/enterprise-svg-architect/
├── SKILL.md                          # 技能主文件：frontmatter description（唯一分发/触发开关）、
│                                     #   Overview、8 步 Workflow、Core rules、Bundled resources、Delivery 规范
├── SOURCE-NOTE.md                    # 溯源与授权定性说明：来源路径 ~/.ai-config/skills/enterprise-svg-architect、
│                                     #   快照日 2026-07-16、License 定性 self-authored（🟢 green）、
│                                     #   敏感值扫描结论（2026-07-16 通过）、运行时依赖说明
│                                     #   （原文写 rsvg-convert / ImageMagick / Chrome 之一；按「仓库为权威」
│                                     #    以脚本为准，脚本只探测 rsvg-convert 与 Chrome/Chromium/Edge）
├── references/
│   ├── svg-conventions.md            # 画图前必读的硬规范：坐标系与 680 宽 viewBox、9 条色带 light+dark hex 表、
│   │                                 #   自主题 <style> 样板、文本 class 与 CJK 字宽校准、box sizing 公式、
│   │                                 #   zone 嵌套规则、箭头与流程标签、导出前 11 项 Pre-flight checklist
│   └── architecture-patterns.md      # 5 种企业拓扑模式（zoned-lanes、reverse-proxy/gateway convergence、
│                                     #   zero-trust/clientless 无端访问、SSO/identity federation、
│                                     #   deployment hub-and-spoke），每种给出 when-to-use、680 坐标下的布局草图、
│                                     #   节点/流程约定，以及第 6 节「Choosing & combining」
├── assets/
│   └── template.svg                  # copy-to-start 骨架：已含 light+dark <style>（gray/blue/purple 三类）、
│   │                                 #   <defs> 里的 arrow marker、2 个 zone（公网 coral / 内网 teal）
│   │                                 #   + 2 个节点 + 1 条带 HTTPS 标签的 flow + 2 项 legend，替换示例内容即可
└── scripts/
    └── svg_to_png.py                 # SVG → PNG 导出脚本（Python 3 标准库）：先试 rsvg-convert（-z scale），
                                      #   失败则回退 headless Chrome/Chromium/Edge，只渲染 light 模式
                                      #   （忽略 @media dark），默认 2x，支持 -s/--scale 与 -o/--output
```

## 注意事项

- viewBox 宽度必须锁死 680（1:1 映射 inline 宿主宽度，14px 文字才是 14px）；内容偏窄就居中（如 x=140..540），**不要缩小 viewBox**。安全区 x=40..640、y=40..(H-24)，禁止负坐标，H = 最低元素 + 24px 且要算出来不能猜。
- CJK 是宽字符：14px 时约 15px/字，12px 时约 13px/字（拉丁约 8px/7px，标点空格约 4px/3.5px）。`box_width = max(title_W, subtitle_W) + 32`；不做字宽计算中文标签**一定**溢出。
- SVG 文字永不换行。需要两行必须用显式 `<tspan x=".." dy="1.2em">`，但优先缩短文案；副标题 ≤ ~14 个汉字。
- 必须 XML 转义：`&` → `&amp;`、`<` → `&lt;`、`>` → `&gt;`。裸 `&`（如「目录 & 账号」）是非法 XML，会让 rsvg-convert、严格解析器和 visualize 宿主直接失败（浏览器宽容不等于安全）。可用 `·` / `+` 规避；`→` `⇄` `↔` 和 `·` 是安全字面量。
- 每个 `<text>` 必须同时有尺寸 class（`t` / `th` 14px、`ts` 12px）和颜色 class（`tx-*`）；只允许 14/12 两种字号；禁止 `fill="inherit"`。
- 每个颜色 class 都必须有 `@media (prefers-color-scheme:dark)` 覆盖；禁止渐变、阴影、模糊、emoji，以及任何没有 dark 对应项的颜色。心智测试：在近黑背景上每个标签是否仍可读。
- 颜色编码类别而非顺序：≤2 条有含义色带 + gray 用于中性 / 结构元素；green=ok / 允许、amber=warning / 待定、red=danger / 阻断 是语义保留色，只在节点真的表达该含义时才用。信任域默认：公网=red/coral（不可信）、DMZ=amber、内网=green/teal（可信）、partner=purple。
- 彩底上的文字用同色带 800/900（light）/100（dark），绝不用黑色或灰色；同一盒子里标题与副标题必须是两个不同色阶（标题更深、副标题更浅）。
- 箭头不许穿过无关方框，需要时用 L/Z 折线 `<path>` 且必须 `fill="none"`；流程标签 ≤3 词、放在箭头中点附近的空白处、偏移 8–10px，**不能压在线上**；含义自明时可省略标签；flow 总体保持单向。
- Zone（信任边界）是 rx=16 的大虚线圆角矩形，标签放**左上角内侧**（zone_x+16, zone_y+20）；最多 2 层嵌套（zone → component），组件距 zone 边 ≥20px，且 zone 必须画在其子元素之前（z-order）。
- Zone 填充最稳妥的选择是 `fill="none"`；若要浅色 tint 必须配 `fill-opacity="0.4"` 且不得在 dark 模式下依赖它（靠虚线描边 + 标签承载）。Zone 描边用 mid 色阶内联（如 coral `#993C1D` / amber `#BA7517` / teal `#0F6E56`），明暗两态都可接受，因此 zone 无需 dark 覆盖。
- 背景透明 —— 绝不画外层背景 rect，底色由宿主 / 卡片提供。
- arrow marker 用固定 gray（`#888780`），这样导出 PNG 时箭头头部不会被丢掉。
- 同行排布检查：Σ(宽) + Σ(间距) ≤ 600（安全跨度）；否则缩小盒子、去掉副标题、折成两行或拆分图。间距：同级盒子水平 ≥24px，上下堆叠 ≥34px（箭头走间隙，箭头尖与盒子留约 10px）。
- hub-and-spoke 的 spoke **绝不能**画成字面意义上的径向圆环 —— 规范里没有环形碰撞检测；要排成左右两列 + 用 zone 分组。
- 一个图只用一个 backbone 模式；若用户同时要拓扑和时序，交付两张图 + 中间用文字衔接，绝不做 hybrid。如果用户要的是按时间排序的握手过程而不是拓扑，那是时序图 —— 明确说明并单独提供。
- 导出脚本只渲染 light 模式（忽略 `@media prefers-color-scheme:dark`），这是刻意为之，共享 PNG 就要这个效果。
- 导出后必须回读 PNG，确认 CJK 字形渲染正常（不是 □ 豆腐块）且无裁切。
- `<title>` 与 `<desc>` 必须是根 `<svg>`（`role="img"`）的前两个子元素，供屏幕阅读器使用。
- 本 skill 自包含，不依赖 visualize 插件预置的 CSS class（`c-blue` / `t` / `ts`）—— 那些只存在于该宿主内部；必须自己定义带具体 hex 的 `<style>`。

## 安装

prompt 型 skill，无需 npm / pip 安装，两种方式任选其一：

```bash
# 方式一：直接复制
cp -r skills/enterprise-svg-architect ~/.ai-config/skills/

# 方式二：symlink（推荐，改仓库即生效）
ln -s "$(pwd)/skills/enterprise-svg-architect" ~/.ai-config/skills/enterprise-svg-architect
```

说明：`SOURCE-NOTE.md` 记录了来源路径 `~/.ai-config/skills/enterprise-svg-architect`（并写明「真值方向：仓库为权威，用户级将换 symlink 指向本目录」），推荐用 symlink 把用户级目录指向本目录。脚本为纯 Python 3 标准库（`argparse` / `os` / `shutil` / `subprocess` / `sys`），无第三方包，直接 `python3 scripts/svg_to_png.py input.svg` 即可，必要时 `chmod +x`。

按仓库 `CONTRIBUTING.md`：frontmatter 的 `description` 是唯一分发开关，改动它等于改变触发条件，改 skill 后要实际触发跑通一次。

### 运行时依赖

| 依赖 | 必要性 | 说明 |
|---|---|---|
| Python 3 | 必需 | 脚本仅用标准库 `argparse` / `os` / `shutil` / `subprocess` / `sys`，无第三方包 |
| `rsvg-convert`（librsvg） | PNG 导出二选一 | 首选渲染器，经 `shutil.which` 在 PATH 中查找，macOS 用 `brew install librsvg` |
| headless Google Chrome / Chromium / Microsoft Edge | PNG 导出二选一 | rsvg 不可用时的回退渲染器，`find_chrome()` 依次探测三个 `/Applications/...` 绝对路径与 PATH 中的 `google-chrome` / `chromium` / `chromium-browser`；两者都没有会报错退出 |
| 中文字体 PingFang SC / Microsoft YaHei | CJK 正确渲染 | 经 fontconfig，保证 CJK 不出现豆腐块 |
| visualize 插件的 `show_widget` | 可选 | 仅用于 inline 渲染，不影响 `.svg` + `@2x.png` 的交付 |

> 注：`SOURCE-NOTE.md` 原文把运行时依赖写成「rsvg-convert / ImageMagick / Chrome 之一」，但脚本里没有任何 ImageMagick / `convert` / `magick` 探测逻辑；按 SOURCE-NOTE 自身「仓库为权威」的真值方向，以脚本为准。

License: MIT
