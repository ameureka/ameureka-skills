#!/usr/bin/env node
const path = require("path");

const COMMANDS = new Set(["crop", "generate", "fit", "screenshot", "check", "build", "manifest", "report", "pipeline", "validate"]);

function parseArgs(argv) {
  const args = { command: argv[0], dir: process.cwd(), thumb: false, json: false };
  if (argv[0] === "--help" || argv[0] === "-h") {
    args.command = undefined;
    args.help = true;
    return args;
  }
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) throw new Error("缺少 --dir 的路径");
      args.dir = argv[++i];
    } else if (arg === "--html2pptx") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) throw new Error("缺少 --html2pptx 的路径");
      args.html2pptx = argv[++i];
    }
    else if (arg === "--thumb") args.thumb = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--no-build") args.noBuild = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`未知参数: ${arg}`);
  }
  args.dir = path.resolve(args.dir);
  return args;
}

function usage() {
  console.log(`用法: ppt-kit <command> [options]\n\n命令: crop, generate, fit, screenshot, check, build, manifest, report, pipeline, validate\n选项: --dir <pptDir> [--html2pptx <path>] [--thumb] [--json] [--no-build]`);
}

async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    usage();
    return;
  }
  if (!COMMANDS.has(args.command)) throw new Error(`未知命令: ${args.command}`);
  const command = args.command === "check" ? "screenshot" : args.command === "validate" ? "pipeline" : args.command;
  const mod = require(path.join(__dirname, "..", "scripts", `${command}.js`));
  const fn = typeof mod === "function" ? mod : mod.main;
  if (typeof fn !== "function") throw new Error(`命令脚本必须导出 main 函数: ${command}`);
  const opts = { thumb: args.thumb, html2pptx: args.html2pptx, json: args.json, noBuild: args.noBuild };
  await fn(args.dir, opts);
}

if (require.main === module) {
  run().catch((error) => {
    console.error(`❌ ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { parseArgs, run };
