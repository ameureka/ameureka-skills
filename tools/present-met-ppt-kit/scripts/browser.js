const { pathToFileURL } = require("url");

async function waitForReady(page, filePath, timeout = 10000) {
  const errors = [];
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  };
  const onPageError = (error) => errors.push(`page: ${error.message}`);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    await page.goto(pathToFileURL(filePath).href, { waitUntil: "load", timeout });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const images = [...document.images];
      await Promise.all(images.map((image) => {
        if (image.complete) return image.decode ? image.decode().catch(() => {}) : undefined;
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }));
    });
    return { errors };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

module.exports = { waitForReady };
