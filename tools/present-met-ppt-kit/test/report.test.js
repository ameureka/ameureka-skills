const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadFit, buildReport } = require("../scripts/report");

test("loadFit splits widths from __ov and tolerates missing fit.json", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "report-"));
  assert.deepEqual(loadFit(dir), { widths: {}, ov: {} });

  fs.writeFileSync(
    path.join(dir, "fit.json"),
    JSON.stringify({ "p02.html": 300, "p05.html": 180, __ov: { "p02.html": 4.5 } })
  );
  const fit = loadFit(dir);
  assert.deepEqual(fit.widths, { "p02.html": 300, "p05.html": 180 });
  assert.deepEqual(fit.ov, { "p02.html": 4.5 });
});

test("buildReport flags overflow and residual overflow as warn", () => {
  const slides = [
    { file: "p01.html", section: "开场", expectedPictures: 0 },
    { file: "p02.html", section: "图片", expectedPictures: 1 },
  ];
  const fit = { widths: { "p02.html": 240 }, ov: {} };
  const overflow = { "p01.html": 0, "p02.html": 6 }; // 6px > 2px 阈值 → 越界
  const report = buildReport(null, null, slides, fit, overflow, null);

  assert.equal(report.summary.total, 2);
  assert.equal(report.summary.ok, 1);
  assert.equal(report.summary.warn, 1);
  assert.deepEqual(report.summary.overflowPages, ["p02.html"]);
  assert.equal(report.pages[1].status, "warn");
  assert.match(report.pages[1].problems[0], /越界/);
});

test("buildReport marks residual __ov overflow as warn even without live overflow", () => {
  const slides = [{ file: "p01.html", section: "开场" }];
  const fit = { widths: {}, ov: { "p01.html": 3 } }; // 上轮越界残留
  const overflow = { "p01.html": 0 };
  const report = buildReport(null, null, slides, fit, overflow, null);
  assert.equal(report.pages[0].status, "warn");
  assert.match(report.pages[0].problems[0], /上轮越界/);
});

test("buildReport is ok when no overflow", () => {
  const slides = [{ file: "p01.html", section: "开场" }];
  const fit = { widths: {}, ov: {} };
  const overflow = { "p01.html": 0 };
  const report = buildReport(null, null, slides, fit, overflow, null);
  assert.equal(report.summary.ok, 1);
  assert.equal(report.summary.warn, 0);
  assert.deepEqual(report.pages[0].problems, []);
});