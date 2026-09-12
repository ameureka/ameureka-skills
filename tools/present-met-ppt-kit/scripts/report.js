#!/usr/bin/env node
// 质检报告:聚合 manifest + fit.json + 越界测量(measureAll) + verify_pptx 结构校验,
// 产出逐页质量表。只读不改:不写 fit.json、不重渲、不 build。
// 用法: NODE_PATH=$(npm root -g) node report.js --dir <pptDir> [--json]
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");
const { measureAll } = require("./measure");
const { checkManifest, expectedPictureCounts } = require("./manifest");

// 读取 fit.json 的图片框宽度与 __ov 越界残留(不存在则为空)。
function loadFit(pptDir) {
  const fitPath = path.join(pptDir, "fit.json");
  if (!fs.existsSync(fitPath)) return { widths: {}, ov: {} };
  const raw = JSON.parse(fs.readFileSync(fitPath, "utf-8"));
  const widths = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith("__")));
  return { widths, ov: raw.__ov || {} };
}

// 用 measureAll 逐页量越界(与 screenshot.js 同口径、同系统 Chrome)。
async function measureOverflow(slides, pptDir) {
  const htmlDir = path.join(pptDir, "html");
  const launchOptions = {};
  if (process.platform === "darwin") launchOptions.channel = "chrome";
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const byFile = {};
  const errors = {};
  try {
    for (const s of slides) {
      const ready = await require("./browser").waitForReady(page, path.join(htmlDir, s.file));
      if (ready.errors.length) errors[s.file] = ready.errors;
      const m = await page.evaluate(measureAll);
      if (!m || m.error) {
        byFile[s.file] = null;
        errors[s.file] = [...(errors[s.file] || []), m?.error || "measurement-failed"];
      } else {
        byFile[s.file] = m.overflowPx;
      }
    }
  } finally {
    await browser.close();
  }
  return { byFile, errors };
}

// 若已 build 出 pptx,跑 verify_pptx.py 拿结构校验结果(页数/尺寸/空页/图片计数)。
// 未 build 时返回 null,不阻塞报告。
function runVerify(pptDir, manifest) {
  const pptxPath = path.join(pptDir, manifest.pptx || "deck.pptx");
  if (!fs.existsSync(pptxPath)) return null;
  const { execFileSync } = require("child_process");
  const verifyPy = path.join(__dirname, "verify_pptx.py");
  const args = [verifyPy, pptxPath, "--expected-count", String(manifest.slides.length), "--aspect", "16:9"];
  const counts = expectedPictureCounts(manifest);
  if (counts) args.push("--picture-counts", counts.join(","));
  try {
    const out = execFileSync("python3", args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, stdout: out.trim() };
  } catch (error) {
    return { ok: false, stdout: (error.stdout || "") + (error.stderr || "") };
  }
}

function buildReport(pptDir, manifest, slides, fit, overflow, verify) {
  const pages = slides.map((s) => {
    const ovPx = overflow[s.file];
    const width = fit.widths[s.file];
    const prevOv = fit.ov[s.file];
    const problems = [];
    if (ovPx !== null && ovPx > 2) problems.push(`越界 ${(ovPx * 0.75).toFixed(1)}pt`);
    if (prevOv !== undefined && prevOv > 1) problems.push(`上轮越界 ${prevOv.toFixed(1)}pt`);
    return {
      file: s.file,
      section: s.section,
      fit: width,
      overflowPx: ovPx,
      expectedPictures: s.expectedPictures,
      status: problems.length ? "warn" : "ok",
      problems,
    };
  });

  const summary = {
    total: pages.length,
    ok: pages.filter((p) => p.status === "ok").length,
    warn: pages.filter((p) => p.status === "warn").length,
    fitItems: Object.keys(fit.widths).length,
    overflowPages: pages.filter((p) => p.overflowPx !== null && p.overflowPx > 2).map((p) => p.file),
    configErrors: manifest ? 0 : 1,
  };

  const verifySummary = verify
    ? { ran: true, ok: verify.ok, output: verify.stdout || "" }
    : { ran: false, ok: null };
  const gateFailures = [];
  if (!manifest) gateFailures.push("manifest");
  if (verify && !verify.ok) gateFailures.push("pptx-verifier");
  if (pages.some((page) => page.status !== "ok")) gateFailures.push("layout");
  summary.gateFailures = gateFailures;
  summary.ok = pages.filter((p) => p.status === "ok").length;

  return { summary, verify: verifySummary, pages };
}

function printText(report) {
  console.log(`📋 质检报告(${report.summary.total} 页)`);
  console.log(`   通过 ${report.summary.ok} · 越界 ${report.summary.overflowPages.length} · fit 项 ${report.summary.fitItems}`);
  if (report.verify.ran) {
    console.log(`   PPTX 结构校验:${report.verify.ok ? "✅ 通过" : "❌ 失败"}`);
  } else {
    console.log(`   PPTX 结构校验:未 build(跳过)`);
  }
  console.log("");
  for (const p of report.pages) {
    const fit = p.fit === undefined ? "—" : `${p.fit}pt`;
    const ov = p.overflowPx === null ? "—" : `${(p.overflowPx * 0.75).toFixed(1)}pt`;
    const pics = p.expectedPictures === undefined ? "—" : String(p.expectedPictures);
    const mark = p.status === "warn" ? "⚠️ " : "   ";
    console.log(`${mark}${p.file}\tfit=${fit}\t越界=${ov}\tpictures=${pics}\t[${p.section || "—"}]`);
  }
  if (report.summary.overflowPages.length) {
    console.log("\n❌ 越界页面:");
    report.summary.overflowPages.forEach((f) => console.log("   - " + f));
  }
  if (report.browserErrors && Object.keys(report.browserErrors).length) {
    console.log("\n❌ 页面资源/布局错误:");
    for (const [file, errors] of Object.entries(report.browserErrors)) {
      console.log(`   - ${file}: ${errors.join("; ")}`);
    }
  }
}

async function main(pptDir, opts = {}) {
  const check = checkManifest(pptDir);
  if (!check.ok) {
    // 配置/HTML 本身有错,仍输出报告结构供 --json 消费,但人类输出先报错
    const report = {
      summary: { total: 0, ok: 0, warn: 0, fitItems: 0, overflowPages: [], configErrors: check.errors.length },
      verify: { ran: false, ok: null },
      configErrors: check.errors,
      pages: [],
    };
    if (opts.json) return console.log(JSON.stringify(report, null, 2));
    console.log("❌ 配置校验失败:");
    check.errors.forEach((e) => console.log("   - " + e));
    process.exitCode = 1;
    return;
  }

  const manifest = check.manifest;
  const slides = check.slides;
  let fit;
  try {
    fit = loadFit(pptDir);
  } catch (error) {
    const report = {
      summary: { total: slides.length, ok: 0, warn: 0, fitItems: 0, overflowPages: [], configErrors: 0, gateFailures: ["fit"] },
      verify: { ran: false, ok: null },
      configErrors: [`fit.json 格式无效: ${error.message}`],
      pages: [],
    };
    if (opts.json) console.log(JSON.stringify(report, null, 2));
    else console.log(`❌ fit.json 格式无效: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const measured = await measureOverflow(slides, pptDir);
  const overflow = measured.byFile;
  const verify = runVerify(pptDir, manifest);
  const report = buildReport(pptDir, manifest, slides, fit, overflow, verify);
  report.browserErrors = measured.errors;
  if (Object.keys(measured.errors).length) {
    report.summary.gateFailures = [...new Set([...(report.summary.gateFailures || []), "browser"] )];
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }
  if (report.summary.gateFailures && report.summary.gateFailures.length) process.exitCode = 1;
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  main(dir, { json: process.argv.includes("--json") }).catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
  });
}
module.exports = { main, loadFit, buildReport, checkManifest };