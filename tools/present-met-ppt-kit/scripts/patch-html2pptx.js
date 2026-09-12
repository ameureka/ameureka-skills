#!/usr/bin/env node
// html2pptx 中文路径补丁(幂等):img.src 百分号编码 → decodeURIComponent
// 症状:HTML 在含中文/空格的目录下,构建报 Unable to read media ... %E5%85%B4...
// build.js 每次构建前自动调用;也可 standalone 跑: node patch-html2pptx.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");
const { resolveHtml2Pptx } = require("./resolve-html2pptx");

function targetFrom(explicitPath) {
  return resolveHtml2Pptx(explicitPath);
}
const ANCHOR = "let imagePath = el.src.startsWith('file://') ? el.src.replace('file://', '') : el.src;";
const PATCH = "      imagePath = decodeURIComponent(imagePath); // Chromium returns img.src percent-encoded (breaks CJK paths)";

function patchSource(src) {
  if (src.includes("imagePath = decodeURIComponent(imagePath);")) return { source: src, changed: false };
  if (!src.includes(ANCHOR)) {
    throw new Error("html2pptx.js 版本已变,补丁锚点不匹配");
  }
  return { source: src.replace(ANCHOR, ANCHOR + "\n" + PATCH), changed: true };
}

function preparePatchedCopy(explicitPath) {
  const target = targetFrom(explicitPath);
  const source = fs.readFileSync(target, "utf-8");
  const result = patchSource(source);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "present-met-html2pptx-"));
  const copy = path.join(tempDir, path.basename(target));
  fs.writeFileSync(copy, result.source, "utf-8");
  return {
    path: copy,
    cleanup: () => fs.rmSync(tempDir, { recursive: true, force: true }),
    changed: result.changed,
  };
}

function loadPatchedModule(preparedPath, originalPath) {
  const originalDir = path.dirname(originalPath);
  const patchedModule = new Module(preparedPath, module.parent);
  patchedModule.filename = originalPath;
  patchedModule.paths = [
    ...Module._nodeModulePaths(originalDir),
    ...Module._nodeModulePaths(process.cwd()),
  ];
  patchedModule._compile(fs.readFileSync(preparedPath, "utf-8"), originalPath);
  return patchedModule.exports;
}

function ensurePatched(explicitPath) {
  const target = targetFrom(explicitPath);
  const source = fs.readFileSync(target, "utf-8");
  const result = patchSource(source);
  if (result.changed) fs.writeFileSync(target, result.source, "utf-8");
  return result.changed ? "patched" : "ok";
}

if (require.main === module) {
  const i = process.argv.indexOf("--html2pptx");
  const explicit = i > -1 ? process.argv[i + 1] : undefined;
  const r = ensurePatched(explicit);
  console.log(r === "ok" ? "✅ 补丁已存在,无需处理" : "✅ 已打补丁");
}
module.exports = ensurePatched;
module.exports.patchSource = patchSource;
module.exports.preparePatchedCopy = preparePatchedCopy;
module.exports.loadPatchedModule = loadPatchedModule;
