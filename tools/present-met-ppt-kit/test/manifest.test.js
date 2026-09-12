const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { validateManifest, orderedSlides, checkManifest } = require("../scripts/manifest");

function manifest(overrides = {}) {
  return validateManifest({
    total: 2,
    slides: [
      { file: "p10.html", body: "<div class=slide></div>" },
      { file: "p02.html", body: "<div class=slide></div>" },
    ],
    ...overrides,
  }, "fixture");
}

test("preserves manifest order and rejects orphan HTML", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"));
  const html = path.join(dir, "html");
  fs.mkdirSync(html);
  fs.writeFileSync(path.join(html, "p10.html"), "");
  fs.writeFileSync(path.join(html, "p02.html"), "");
  fs.writeFileSync(path.join(html, "p99.html"), "");
  const cfg = manifest();
  assert.deepEqual(orderedSlides(cfg, html).map((slide) => slide.file), ["p10.html", "p02.html"]);
  assert.throws(() => orderedSlides(cfg, html, { requireAll: true, rejectOrphans: true }), /声明/);
});

test("rejects duplicate files and total mismatch", () => {
  assert.throws(() => manifest({ total: 3 }), /total/);
  assert.throws(() => validateManifest({ slides: [
    { file: "same.html", body: "" },
    { file: "same.html", body: "" },
  ] }), /重复/);
});

test("allows legacy manifest without total or picture metadata", () => {
  const cfg = validateManifest({ slides: [{ file: "p01.html", body: "" }] });
  assert.equal(cfg.total, 1);
});

test("checkManifest reports ok with page map when html/ is consistent", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"));
  const html = path.join(dir, "html");
  fs.mkdirSync(html);
  fs.writeFileSync(path.join(dir, "slides.config.js"), `
    module.exports = {
      total: 2,
      slides: [
        { file: "p01.html", section: "开场", body: "" },
        { file: "p02.html", section: "图片", expectedPictures: 1, body: "" },
      ],
    };`);
  fs.writeFileSync(path.join(html, "p01.html"), "");
  fs.writeFileSync(path.join(html, "p02.html"), "");
  const result = checkManifest(dir);
  assert.equal(result.ok, true);
  assert.equal(result.slides.length, 2);
  assert.equal(result.slides[0].section, "开场");
  assert.equal(result.slides[1].expectedPictures, 1);
});

test("checkManifest reports missing html as error, not throw", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"));
  const html = path.join(dir, "html");
  fs.mkdirSync(html);
  fs.writeFileSync(path.join(dir, "slides.config.js"), `
    module.exports = {
      total: 1,
      slides: [{ file: "p01.html", body: "" }],
    };`);
  const result = checkManifest(dir);
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /缺少配置页面 HTML/);
});

test("checkManifest reports orphan html", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"));
  const html = path.join(dir, "html");
  fs.mkdirSync(html);
  fs.writeFileSync(path.join(dir, "slides.config.js"), `
    module.exports = {
      total: 1,
      slides: [{ file: "p01.html", body: "" }],
    };`);
  fs.writeFileSync(path.join(html, "p01.html"), "");
  fs.writeFileSync(path.join(html, "p99.html"), "");
  const result = checkManifest(dir);
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /声明/);
});
