#!/usr/bin/env node
// 通用页面生成器:读 <pptDir>/slides.config.js,应用 fit.json 图片宽度,写出 html/*.html
// 用法: NODE_PATH=$(npm root -g) node generate.js --dir <pptDir>
//        或在每期 ppt/scripts/ 里放薄封装调用
const fs = require("fs");
const path = require("path");
const { baseCSS } = require("../theme");
const { loadManifest } = require("./manifest");

function footer(n, total, left, section) {
  return `<div class="footer">
    <p style="flex:1;">${left}</p>
    <p style="flex:1; text-align:center;" class="muted">${section}</p>
    <p style="flex:1; text-align:right;">${String(n).padStart(2, "0")} / ${total}</p>
  </div>`;
}

async function main(pptDir) {
  const cfg = loadManifest(pptDir);
  const fitPath = path.join(pptDir, "fit.json");
  let fit = {};
  if (fs.existsSync(fitPath)) {
    try {
      fit = JSON.parse(fs.readFileSync(fitPath, "utf-8"));
    } catch (error) {
      throw new Error(`fit.json 格式无效: ${error.message}`);
    }
    if (!fit || typeof fit !== "object" || Array.isArray(fit)) {
      throw new Error("fit.json 必须是对象");
    }
  }
  const outDir = path.join(pptDir, "html");
  fs.mkdirSync(outDir, { recursive: true });
  const expectedFiles = new Set(cfg.slides.map((slide) => slide.file));
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".html") && !expectedFiles.has(entry.name)) {
      fs.unlinkSync(path.join(outDir, entry.name));
    }
  }
  const total = cfg.total || cfg.slides.length;
  const css = baseCSS(cfg.theme || {});

  let applied = 0; // 实际被注入 fit 宽度的图片框页数(只数 data-autofit 元素)
  cfg.slides.forEach((s, i) => {
    const footerMarkers = (s.body.match(/<!--FOOTER-->/g) || []).length;
    if (footerMarkers !== 1) {
      throw new Error(`${s.file} 必须恰好包含一个 <!--FOOTER--> 占位符(实际 ${footerMarkers})`);
    }
    let body = s.body.replace("<!--FOOTER-->", footer(i + 1, total, cfg.footerLeft, s.section));
    // fit.js 量出的图片框宽度,注入到 data-autofit 元素上
    // 守卫:仅当该页 body 确有 data-autofit 元素时才注入并计数,
    // 避免 fit.json 里的 __ov 键 / 陈旧条目被误当成图片框
    if (fit[s.file] && /data-autofit/.test(body)) {
      body = body.replace(
        /(<[^>]+data-autofit[^>]*style="[^"]*?width:\s*)[\d.]+pt/,
        `$1${fit[s.file]}pt`
      );
      applied++;
    }
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
    fs.writeFileSync(path.join(outDir, s.file), html, "utf-8");
  });

  console.log(`✅ 已生成 ${cfg.slides.length} 页 HTML 到 ${outDir}`);
  if (applied) console.log(`   (已应用 fit.json:${applied} 个图片框宽度)`);
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  main(dir).catch((e) => { console.error("❌", e.message); process.exit(1); });
}
module.exports = main;
