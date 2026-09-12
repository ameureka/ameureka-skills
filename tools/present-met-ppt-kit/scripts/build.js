#!/usr/bin/env node
// 构建 PPTX:自动确保 html2pptx 补丁 → 逐页转换 → 写出 → python 结构校验
// 用法: NODE_PATH=$(npm root -g) node build.js --dir <pptDir> [--thumb]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const pptxgen = require("pptxgenjs");

const { preparePatchedCopy, loadPatchedModule } = require("./patch-html2pptx");
const { resolveHtml2Pptx } = require("./resolve-html2pptx");
const { loadManifest, orderedSlides, expectedPictureCounts } = require("./manifest");

async function main(pptDir, opts = {}) {
  const manifest = loadManifest(pptDir);
  const htmlDir = path.join(pptDir, "html");
  const slides = orderedSlides(manifest, htmlDir, { requireAll: true, rejectOrphans: true });
  const html2pptxPath = resolveHtml2Pptx(opts.html2pptx);
  const prepared = preparePatchedCopy(html2pptxPath);
  let html2pptx;
  try {
    html2pptx = loadPatchedModule(prepared.path, html2pptxPath);
    if (typeof html2pptx !== "function") {
      throw new Error(`html2pptx.js 必须导出函数: ${html2pptxPath}`);
    }

    const out = path.join(pptDir, manifest.pptx || "deck.pptx");
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_16x9";
    for (let i = 0; i < slides.length; i++) {
      await html2pptx(slides[i].path, pptx);
      console.log(`✔ [${i + 1}/${slides.length}] ${slides[i].file}`);
    }
    await pptx.writeFile({ fileName: out });
    console.log(`\n✅ 已写出 ${out}(共 ${slides.length} 页)`);

    // 结构校验:页数 / 尺寸 / 空页 / 可选图片计数
    const verifyPy = path.join(__dirname, "verify_pptx.py");
    const verifyArgs = [verifyPy, out, "--expected-count", String(slides.length), "--aspect", "16:9"];
    const pictureCounts = expectedPictureCounts(manifest);
    if (pictureCounts) verifyArgs.push("--picture-counts", pictureCounts.join(","));
    execFileSync("python3", verifyArgs, { stdio: "inherit" });

    if (opts.thumb) {
      if (process.platform !== "darwin") {
        throw new Error("--thumb 仅支持 macOS 的 qlmanage");
      }
      const previewDir = path.join(pptDir, "preview");
      fs.mkdirSync(previewDir, { recursive: true });
      try {
        execFileSync("qlmanage", ["-t", "-s", "960", out, "-o", previewDir], {
          stdio: "inherit",
        });
      } catch (error) {
        throw new Error(`生成缩略图失败，请确认 qlmanage 可用: ${error.message}`);
      }
    }
  } finally {
    prepared.cleanup();
  }
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const h = process.argv.indexOf("--html2pptx");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  const html2pptx = h > -1 ? process.argv[h + 1] : undefined;
  main(dir, { thumb: process.argv.includes("--thumb"), html2pptx }).catch((e) => {
    console.error("❌ 构建失败:", e.message);
    process.exit(1);
  });
}
module.exports = main;
