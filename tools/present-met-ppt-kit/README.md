# present-met-ppt-kit

分享会专属 presentation 工具链：将每期的 `slides.config.js` 和 `crops.config.js` 渲染为 HTML、预览图和 PPTX。

本项目从工作区旧版 `_ppt-kit` 独立复制而来，第一阶段保持主题、footer 越界测量和图片 fit 语义不变；004期仍使用旧 wrapper，不会自动切换。

## 安装

```bash
npm install
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

`fit` 和 `screenshot` 在 macOS 使用系统 Chrome；其他平台需准备 Playwright 浏览器。`build` 还需要一个外部 `html2pptx.js` 和 `python-pptx`。页面顺序始终以 `slides.config.js` 的 `slides` 数组为准。

## 命令

在任意目录执行，使用 `--dir` 指向某一期的 `ppt/` 目录：

```bash
npx ppt-kit crop --dir ./my-deck
npx ppt-kit generate --dir ./my-deck
npx ppt-kit fit --dir ./my-deck
npx ppt-kit generate --dir ./my-deck
npx ppt-kit screenshot --dir ./my-deck
npx ppt-kit build --dir ./my-deck --html2pptx /absolute/path/html2pptx.js
npx ppt-kit manifest --dir ./my-deck      # 校验配置 + HTML 一致性,打印页面清单
npx ppt-kit report --dir ./my-deck        # 汇总质检报告(manifest+fit+越界+结构)
npx ppt-kit report --dir ./my-deck --json # 机器可读报告
# 一键验证（不构建 PPTX）
npx ppt-kit validate --dir ./my-deck --no-build --json
# 一键生产：裁切、生成、fit、截图、构建、报告
npx ppt-kit pipeline --dir ./my-deck --html2pptx /absolute/path/html2pptx.js --json
```

`check` 是 `screenshot` 的别名；`build` 可附加 `--thumb` 生成 macOS `qlmanage` 缩略图。也可直接运行 `node scripts/<command>.js --dir <dir>`。

### manifest —— 独立配置校验

`manifest` 校验 `slides.config.js` 与 `html/` 目录的一致性：缺页、重复 `file`、`total` 不一致、
未声明的孤儿 HTML、`expectedPictures` 非负。通过后逐页打印 `file / section / pictures` 清单。
退出码 0 = 全通过；1 = 有错误（可接 CI）。

### report —— 质检报告

`report` 聚合四路信息产出一张逐页质量表，**只读不改**（不写 fit.json、不重渲、不 build）：

| 来源 | 展示 |
|---|---|
| manifest | 每页 file / section / expectedPictures |
| fit.json | 图片框宽度 + `__ov` 上轮越界残留 |
| 越界测量（`measure.js` 的 `measureAll`） | 每页 overflowPx |
| `verify_pptx.py`（若已 build） | 页数 / 尺寸 / 空页 / 图片计数 |

`--json` 输出结构化对象 `{ summary, verify, pages[] }`，供 CI/脚本消费。结构校验失败、页面错误、残留越界或布局 warning 会进入 `summary.gateFailures` 并返回非零退出码。

### pipeline / validate —— 一键流水线

`pipeline` 将人工串联的 `crop → generate → fit → generate → screenshot → build → report` 固定为一个可复现入口；`validate` 是不构建 PPTX 的别名（等价于 `pipeline --no-build`）。首次运行仍允许由 `generate` 创建 HTML；后续运行会清理不在 manifest 中的陈旧 HTML。`--no-build`、`--html2pptx`、`--thumb` 和 `--json` 可组合使用。

## 输入与产物

每期目录至少包含：

- `slides.config.js`：页面 HTML body、总页数、页脚和 PPTX 文件名
- `crops.config.js`：可选的原图裁切表
- `STORYBOARD.md`：内容和讲者分镜（文档，不由工具读取）

工具生成：`assets/`、`html/`、`preview/`、`fit.json` 和配置指定的 `.pptx`。生成物通常不提交；`fit.json` 是可复现布局状态，建议提交。

## html2pptx 路径

为避免不同机器静默使用不同转换器，独立 kit 不再回退到 `~/.codex/skills/...`。构建必须显式提供：

```bash
ppt-kit build --dir ./my-deck --html2pptx /absolute/path/html2pptx.js
# 或
HTML2PPTX_PATH=/absolute/path/html2pptx.js ppt-kit build --dir ./my-deck
```

构建前会将**指定的** converter 复制到本次构建的临时目录，并只对临时副本执行幂等中文路径补丁；原 converter 文件保持不变。路径不存在、不是普通文件或补丁锚点不匹配时会立即失败，不会修改用户目录中的未知文件。

可选的 standalone `patch-html2pptx.js --html2pptx <path>` 仍是显式原地补丁命令；普通 `build` 不调用它。

## 质量门禁

- `measure.js` 是 `fit` 和 `screenshot` 共用的唯一测量口径，越界以 footer 顶边为准。
- `fit.js` 返回码 `2` 表示布局停滞，需要人工调整；`screenshot.js` 返回码 `1` 表示越界。
- `verify_pptx.py` 检查页数、16:9 尺寸和空页；在每页声明 `expectedPictures` 时额外严格检查每页图片数量。
- `--thumb` 只在 macOS 且存在 `qlmanage` 时可用；缩略图失败会使构建失败，不会伪装成成功。
- LibreOffice 不属于本管道；使用 Playwright、`qlmanage` 和 `python-pptx`。

## 开发

```bash
npm test
npm run lint
```

最小 fixture 位于 `fixtures/minimal`，不依赖兴趣小组工作区。第一阶段暂不迁移004期、不 vendor `html2pptx.js`、不改写 fit 算法。
