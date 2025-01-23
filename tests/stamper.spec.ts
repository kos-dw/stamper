import { expect, test } from '@playwright/test';

test('Documentsというタイトルを持っている', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page).toHaveTitle(/Document/);
});

test('ボタンがクリックできる', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // ダイアログが開かれるのを待機
  const dialogPromise = new Promise(resolve => {
    page.on('dialog', dialog => {
      resolve(dialog.message()); // ダイアログのメッセージを取得
      dialog.accept(); // ダイアログを閉じる
    });
  });

  await page.getByRole('button', { name: '追加' }).click();

  // ダイアログのメッセージが "preadd" であることを検証
  const message = await dialogPromise;
  expect(message).toBe('preadd');
});
