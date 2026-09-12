const fs = require("fs");
const path = require("path");

function loadManifest(pptDir) {
  const configPath = path.join(pptDir, "slides.config.js");
  let cfg;
  try {
    cfg = require(configPath);
  } catch (error) {
    throw new Error(`无法加载 slides.config.js: ${configPath}: ${error.message}`);
  }
  return validateManifest(cfg, pptDir);
}

function validateManifest(cfg, pptDir = "<deck>") {
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    throw new Error(`slides.config.js 必须导出对象: ${pptDir}`);
  }
  if (!Array.isArray(cfg.slides) || cfg.slides.length === 0) {
    throw new Error(`slides.config.js 的 slides 必须是非空数组: ${pptDir}`);
  }
  const files = new Set();
  const slides = cfg.slides.map((slide, index) => {
    if (!slide || typeof slide !== "object") {
      throw new Error(`第 ${index + 1} 页配置必须是对象: ${pptDir}`);
    }
    if (typeof slide.file !== "string" || !slide.file.trim()) {
      throw new Error(`第 ${index + 1} 页缺少 file: ${pptDir}`);
    }
    if (path.basename(slide.file) !== slide.file || !/^[^/\\]+\.html$/.test(slide.file)) {
      throw new Error(`页面 file 必须是单层 HTML 文件名: ${slide.file}`);
    }
    if (files.has(slide.file)) {
      throw new Error(`页面 file 重复: ${slide.file}`);
    }
    files.add(slide.file);
    if (typeof slide.body !== "string") {
      throw new Error(`页面缺少 body: ${slide.file}`);
    }
    if (slide.expectedPictures !== undefined &&
        (!Number.isInteger(slide.expectedPictures) || slide.expectedPictures < 0)) {
      throw new Error(`expectedPictures 必须是非负整数: ${slide.file}`);
    }
    return slide;
  });

  const total = cfg.total === undefined ? slides.length : cfg.total;
  if (!Number.isInteger(total) || total !== slides.length) {
    throw new Error(`total 必须等于 slides.length (${slides.length}): ${pptDir}`);
  }
  return { ...cfg, total, slides, files: [...files] };
}

function orderedSlides(manifest, htmlDir, { requireAll = false, rejectOrphans = false } = {}) {
  const expected = manifest.slides.map((slide) => slide.file);
  if (requireAll) {
    const missing = expected.filter((file) => !fs.existsSync(path.join(htmlDir, file)));
    if (missing.length) throw new Error(`缺少配置页面 HTML: ${missing.join(", ")}`);
  }
  if (rejectOrphans && fs.existsSync(htmlDir)) {
    // 页面命名既支持旧版 pNN-name.html，也支持 005 的 NN-name.html；
    // orphan 检查不能依赖某一种命名，否则陈旧页面会静默混入构建目录。
    const actual = fs.readdirSync(htmlDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => entry.name);
    const extras = actual.filter((file) => !manifest.files.includes(file));
    if (extras.length) throw new Error(`发现未在 slides.config.js 声明的 HTML: ${extras.join(", ")}`);
  }
  return manifest.slides.map((slide) => ({
    ...slide,
    path: path.join(htmlDir, slide.file),
  }));
}

function expectedPictureCounts(manifest) {
  if (!manifest.slides.some((slide) => slide.expectedPictures !== undefined)) return null;
  return manifest.slides.map((slide) => slide.expectedPictures ?? 0);
}

// 独立校验:返回结构化结果(不 throw),供 CLI 与 report 命令复用。
// 结果: { ok, errors[], slides[] } —— slides 为逐页 {file, section, expectedPictures, path}。
function checkManifest(pptDir) {
  const errors = [];
  let manifest = null;
  let slides = [];
  try {
    manifest = loadManifest(pptDir);
  } catch (error) {
    return { ok: false, errors: [error.message], slides: [] };
  }
  const htmlDir = path.join(pptDir, "html");
  try {
    slides = orderedSlides(manifest, htmlDir, { requireAll: true, rejectOrphans: true }).map((slide) => ({
      file: slide.file,
      section: slide.section || "",
      expectedPictures: slide.expectedPictures,
      path: slide.path,
    }));
  } catch (error) {
    errors.push(error.message);
  }
  return { ok: errors.length === 0, errors, slides, manifest };
}

// 独立命令: `ppt-kit manifest --dir <pptDir>` —— 校验配置 + HTML 一致性,打印页面清单。
// 退出码 0 = 全通过;1 = 有错误(可接 CI)。
async function main(pptDir) {
  const result = checkManifest(pptDir);
  if (result.errors.length) {
    console.log("❌ 配置校验失败:");
    result.errors.forEach((e) => console.log("   - " + e));
  } else {
    console.log(`✅ 配置校验通过(${result.slides.length} 页)`);
  }
  for (const s of result.slides) {
    const pics = s.expectedPictures === undefined ? "—" : String(s.expectedPictures);
    console.log(`   ${s.file}\t[${s.section || "—"}]\tpictures=${pics}`);
  }
  if (result.errors.length) process.exitCode = 1;
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  main(dir).catch((e) => { console.error("❌", e.message); process.exit(1); });
}

module.exports = { loadManifest, validateManifest, orderedSlides, expectedPictureCounts, checkManifest, main };
