#!/usr/bin/env node
// 通用裁切器:读 <pptDir>/crops.config.js,sharp extract 到 <pptDir>/assets/
// 用法: NODE_PATH=$(npm root -g) node crop.js --dir <pptDir>
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main(pptDir) {
  const cfg = require(path.join(pptDir, "crops.config.js"));
  const srcRoot = path.resolve(pptDir, cfg.srcDir);
  const outDir = path.join(pptDir, "assets");
  fs.mkdirSync(outDir, { recursive: true });

  // 格式 A: { src, out, left, top, width, height } — extract 真裁切
  const crops = cfg.crops || [];
  for (const c of crops) {
    const outPath = path.join(outDir, c.out);
    await sharp(path.join(srcRoot, c.src))
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .png()
      .toFile(outPath);
    const meta = await sharp(outPath).metadata();
    console.log(`✔ ${c.out}  ${meta.width}x${meta.height}  (${(c.width / c.height).toFixed(2)}:1)`);
  }

  // 格式 B: { file, src?, width, height } — 按宽高等比 resize(文件已是成品图时)
  const sizes = cfg.sizes || [];
  for (const s of sizes) {
    const srcName = s.src || s.file;
    const outPath = path.join(outDir, s.file);
    await sharp(path.join(srcRoot, srcName))
      .resize(s.width, s.height, { fit: "inside", withoutEnlargement: true })
      .png()
      .toFile(outPath);
    const meta = await sharp(outPath).metadata();
    console.log(`✔ ${s.file}  ${meta.width}x${meta.height}  (resize)`);
  }

  const total = crops.length + sizes.length;
  if (total === 0) {
    console.log(`ℹ️  无裁切配置 -> ${outDir}`);
  } else {
    console.log(`✅ 素材处理完成(${total} 张:crops=${crops.length} sizes=${sizes.length}) -> ${outDir}`);
  }
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  main(dir).catch((e) => { console.error("❌", e.message); process.exit(1); });
}
module.exports = main;
