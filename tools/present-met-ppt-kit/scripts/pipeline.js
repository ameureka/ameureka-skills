#!/usr/bin/env node
const path = require("path");
const { execFileSync } = require("child_process");
const { checkManifest } = require("./manifest");

function runNode(script, dir, extra = []) {
  execFileSync(process.execPath, [path.join(__dirname, script), "--dir", dir, ...extra], { stdio: "inherit" });
}

async function main(pptDir, opts = {}) {
  const check = checkManifest(pptDir);
  if (!check.ok && !opts.allowMissingHtml) {
    // 允许首次运行时 generate 负责创建 html；配置本身仍必须可加载。
    if (!check.manifest) throw new Error(check.errors.join("; "));
  }

  runNode("crop.js", pptDir);
  runNode("generate.js", pptDir);
  let fitExit = 0;
  try {
    runNode("fit.js", pptDir);
  } catch (error) {
    fitExit = error.status || 1;
    if (fitExit !== 2) throw error;
  }
  runNode("generate.js", pptDir);
  runNode("screenshot.js", pptDir);
  if (!opts.noBuild) {
    const buildArgs = [];
    if (opts.html2pptx) buildArgs.push("--html2pptx", opts.html2pptx);
    if (opts.thumb) buildArgs.push("--thumb");
    runNode("build.js", pptDir, buildArgs);
  }
  runNode("report.js", pptDir, opts.json ? ["--json"] : []);
  if (fitExit) process.exitCode = fitExit;
}

if (require.main === module) {
  const i = process.argv.indexOf("--dir");
  const h = process.argv.indexOf("--html2pptx");
  const dir = path.resolve(i > -1 ? process.argv[i + 1] : process.cwd());
  main(dir, {
    html2pptx: h > -1 ? process.argv[h + 1] : undefined,
    thumb: process.argv.includes("--thumb"),
    json: process.argv.includes("--json"),
    noBuild: process.argv.includes("--no-build"),
  }).catch((error) => {
    console.error("❌ 流水线失败:", error.message);
    process.exit(1);
  });
}

module.exports = main;
