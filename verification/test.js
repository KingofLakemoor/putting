const { test, expect } = require('@playwright/test');

test('test', async ({ page }) => {
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);
});
