import playwright from "playwright";

(async () => {
  const browser = await playwright["chromium"].launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("http://localhost:3000/e2e/mock/index.html");
  await page.screenshot({ path: `example.png` });
  await browser.close();
})();
