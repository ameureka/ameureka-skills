#!/usr/bin/env node
// 截图质检 + 溢出自动报告:渲染 html/*.html 到 preview/*.png (960x540)
// 任何一页 body 超出 540px 即列入溢出清单,退出码 1(可接 CI)
// 用法: NODE_PATH=$(npm root -g) node screenshot.js --dir <pptDir>
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");
const { measureAll } = require("./measure");
const { waitForReady } = require("./browser");
const { loadManifest, orderedSlides } = require("./manifest");

async function main(pptDir) {
  const htmlDir = path.join(pptDir, "html");
  const outDir = path.join(pptDir, "preview");
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = loadManifest(pptDir);
  const slides = orderedSlides(manifest, htmlDir, { requireAll: true, rejectOrphans: true });

  const launchOptions = {};
  if (process.platform === "darwin") launchOptions.channel = "chrome";
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

  const overflow = [];
  const errors = [];
  for (const slide of slides) {
    const f = slide.file;
    const ready = await waitForReady(page, slide.path);
    if (ready.errors.length) errors.push(`${f}: ${ready.errors.join("; ")}`);
    const m = await page.evaluate(measureAll);
    await page.screenshot({ path: path.join(outDir, f.replace(".html", ".png")) });
    if (m.error) {
      errors.push(`${f}: ${m.error === "missing-slide" ? "缺少 .slide 根节点" : "缺少 .footer 页脚"}`);
    } else if (m.overflowPx > 2) {
      overflow.push(`${f}: 侵入页脚区 ${(m.overflowPx * 0.75).toFixed(1)}pt`);
    }
  }
  await browser.close();

  console.log(`✅ 截图完成(${slides.length} 页)-> ${outDir}`);
  if (overflow.length) {
    console.log("❌ 越界页面:");
    overflow.forEach((s) => console.log("   - " + s));
  }
  if (errors.length) {
    console.log("❌ 页面错误:");
    errors.forEach((s) => console.log("   - " + s));
  }
  if (!overflow.length && !errors.length) {
    console.log("✅ 无越界");
  }
  if (overflow.length || errors.length) process.exitCode = 1;
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  main(dir).catch((e) => { console.error("❌", e.message); process.exit(1); });
}
module.exports = main;
