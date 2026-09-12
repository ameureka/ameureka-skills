const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const generate = require("../scripts/generate");

// 捕获 generate 的 console 输出,用于断言计数日志
async function captureGenerate(dir) {
  const logs = [];
  const orig = console.log;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await generate(dir);
  } finally {
    console.log = orig;
  }
  return logs.join("\n");
}

 test("generates footer and applies fit width", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "present-met-"));
  fs.cpSync(path.join(__dirname, "../fixtures/minimal"), dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "fit.json"), JSON.stringify({ "p02-image.html": 300 }));
  await generate(dir);
  const html = fs.readFileSync(path.join(dir, "html/p02-image.html"), "utf8");
  assert.match(html, /width:300pt/);
  assert.match(html, /02 \/ 2/);
  assert.doesNotMatch(html, /<!--FOOTER-->/);
});

test("__ov 键不被误计入图片框宽度", async () => {
  // fit.json 只有 __ov(无任何 data-autofit 页) → 不应打印"已应用 fit.json"
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "present-met-"));
  fs.cpSync(path.join(__dirname, "../fixtures/minimal"), dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "fit.json"), JSON.stringify({ __ov: {} }));
  const out = await captureGenerate(dir);
  assert.doesNotMatch(out, /已应用 fit.json/, `不应把 __ov 当图片框,实际输出:${out}`);
});

test("计数只统计有 data-autofit 的页,排除 __ov", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "present-met-"));
  fs.cpSync(path.join(__dirname, "../fixtures/minimal"), dir, { recursive: true });
  // p02-image.html 有 data-autofit;混入 __ov 不应使计数变成 2
  fs.writeFileSync(path.join(dir, "fit.json"), JSON.stringify({ "p02-image.html": 300, __ov: {} }));
  const out = await captureGenerate(dir);
  assert.match(out, /已应用 fit.json:1 个图片框宽度/);
  const html = fs.readFileSync(path.join(dir, "html/p02-image.html"), "utf8");
  assert.match(html, /width:300pt/);
});
