# Changelog

## Unreleased — integrated pipeline and layout gates

- 新增 `pipeline` 命令，固定执行 `crop → generate → fit → generate → screenshot → build → report`。
- 新增 `validate` 命令，等价于 `pipeline --no-build`，可在不构建 PPTX 时运行完整 HTML/浏览器/布局门禁。
- CLI 新增 `--no-build`，并支持 `pipeline/validate` 与 `--json`、`--html2pptx`、`--thumb` 组合。
- orphan HTML 检查覆盖输出目录内全部 `.html`，兼容 `pNN-name.html` 与 `NN-name.html` 命名。
- generate 清理不在 manifest 中的陈旧 HTML，校验 `fit.json`，并要求每页恰好一个 `<!--FOOTER-->` 占位符。
- 新增 browser readiness helper：等待页面加载、字体和图片，并捕获 console/page 错误。
- measure 支持多个 `data-autofit` 元素和嵌套内容，保留 footer 顶边越界口径。
- report 将布局、浏览器、配置和 PPTX verifier 失败汇聚到 `summary.gateFailures`，统一决定非零退出码。
- 005 期已使用新 validate 流程验证：30 页 HTML/preview、无越界、PPTX 结构校验通过。

## 0.1.0 — 2026-08-15

- 从分享会 `_ppt-kit` 复制并独立封装。
- 增加 npm 元数据、显式 Node/Python 依赖说明和 CLI。
- 增加 `--dir` 与显式 `--html2pptx` 路径。
- 增加最小 fixture 与基础测试。
- 保持主题、footer 越界测量和图片 fit 语义不变。
- 第一阶段不切换004期旧 wrapper。

## Unreleased — quality gates

- 统一 manifest 校验和页面顺序，拒绝缺页、重复页、total 不一致及 orphan HTML。
- 强化 PPTX 页数、16:9、空页和可选图片计数校验。
- 普通 build 使用临时 converter 副本，避免修改外部源文件。
- 增加 manifest、CLI 参数和补丁变换测试。
- 增加真实 html2pptx build smoke test、converter SHA-256 不变检查和严格 verifier 测试。
- 修复临时 converter 副本的相对依赖解析，普通 build 不再因复制位置改变模块搜索路径。

## Unreleased — manifest + report 命令

- 新增 `manifest` 命令：独立校验 `slides.config.js` 与 `html/` 一致性，打印页面清单，退出码可接 CI。
- 新增 `report` 命令：聚合 manifest + fit.json + 越界测量 + verify_pptx 为逐页质量表，支持 `--json`。
- `checkManifest()` 返回结构化结果（不 throw），供 CLI 与 report 复用。
- CLI 支持 `--json` 选项，`report` 命令可输出机器可读报告。
- 新增 `test/report.test.js`（4 个纯函数测试）和 manifest CLI 测试（3 个）。
