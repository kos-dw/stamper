import { expect, test } from "@playwright/test";

const rootSelector = "[stamper=mock]";
const tempSelector = "[s-temp=mock]";
const crateSelector = "[s-crate=mock]";
const castSelector = "[s-cast=mock]";
const deleteSelector = "[s-delete=mock]";
const sequenceSelector = "[s-sequence]";

test.describe("Stamperの動作テスト", () => {
  test("初期レンダリング時に必要な要素が存在するか確認", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const rootEl = await page.$(rootSelector);
    const tempEl = await page.$(tempSelector);
    const crateEl = await page.$(crateSelector);
    const castEl = await page.$(castSelector);

    expect(rootEl).not.toBeNull();
    expect(tempEl).not.toBeNull();
    expect(crateEl).not.toBeNull();
    expect(castEl).not.toBeNull();
  });

  test("要素追加ボタンをクリックしたら要素が追加される", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const crateEl = page.locator(crateSelector).first();
    const castEl = page.locator(castSelector).first();

    const beforeCount = await crateEl.evaluate((el) => el.children.length);

    await castEl.click();

    const afterCount = await crateEl.evaluate((el) => el.children.length);

    expect(afterCount).toBeGreaterThan(beforeCount);
  });

  test("[s-sequence]が正しい連番になっている", async ({ page }) => {
    await page.goto("http://localhost:3000");
    const castEl = page.locator(castSelector).first();
    const sequenceEls = await page.locator(sequenceSelector).all();

    await castEl.click();

    for (const [index, el] of sequenceEls.entries()) {
      const text = await el.textContent();
      expect(text).toBe((index + 1).toString());
    }
  });

  test("要素削除ボタンをクリックしたら要素が削除される", async ({ page }) => {
    await page.goto("http://localhost:3000");
    const crateEl = page.locator(crateSelector).first();
    const castEl = page.locator(castSelector).first();

    // ダイアログのイベントを監視
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await castEl.click(); // 要素を追加

    const deleteEls = page.locator(deleteSelector);
    const elsCount = await deleteEls.count();

    // 最初に取得した要素でループを回すと、要素自体も削除されるためエラーになる
    // そのため、毎回取得し直す
    for (let i = 0; i < elsCount; i++) {
      await page.locator(deleteSelector).first().click();
    }

    const remainingChildren = await crateEl.evaluate(
      (el) => el.children.length
    );

    expect(remainingChildren).toBe(0);
  });

  test("preAddとpostaddが機能している", async ({ page }) => {
    const messageArray: string[] = [];
    await page.goto("http://localhost:3000");
    const castEl = page.locator(castSelector).first();

    // ダイアログのイベントを監視
    page.on("dialog", async (dialog) => {
      messageArray.push(dialog.message());
      await dialog.accept();
    });
    await castEl.click();

    expect(messageArray).toEqual(["preadd", "postadd"]);
  });

  test("[s-predelete]と[s-postdelete]が正しく動作している", async ({
    page,
  }) => {
    const messageArray: string[] = [];
    await page.goto("http://localhost:3000");
    const crateEl = page.locator(crateSelector).first();
    const castEl = page.locator(castSelector).first();

    await castEl.click(); // 要素を追加

    // ダイアログのイベントを監視
    page.on("dialog", async (dialog) => {
      if(dialog.type() === "alert") {
        messageArray.push(dialog.message());
      }
      await dialog.accept();
    });

    const deleteEls = page.locator(deleteSelector);
    const elsCount = await deleteEls.count();

    // 最初に取得した要素でループを回すと、要素自体も削除されるためエラーになる
    // そのため、毎回取得し直す
    for (let i = 0; i < elsCount; i++) {
      await page.locator(deleteSelector).first().click();
    }

    const messageArrayChunk: string[][] = [];
    for (let i = 0; i < messageArray.length / 2; i++) {
      messageArrayChunk.push(messageArray.splice(0, 2));
    }

    messageArrayChunk.forEach((chunk) => {
      expect(chunk).toEqual(["predelete", "postdelete"]);
    });
  });
});
