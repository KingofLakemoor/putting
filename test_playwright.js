const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/signin');

  // sign up
  await page.click('button:has-text("Sign Up")');
  await page.fill('input#firstName', 'Test');
  await page.fill('input#lastName', 'User');
  await page.fill('input#email', 'test11@example.com');
  await page.fill('input#password', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(5000);

  await page.goto('http://localhost:3001/admin');
  await page.waitForTimeout(2000);

  // click away error overlay
  try {
      await page.evaluate(() => {
        const overlay = document.querySelector('iframe');
        if (overlay) overlay.remove();
      });
  } catch(e) {}

  // Login to admin
  try {
      await page.fill('input[type="password"]', 'admin');
      await page.click('button[type="submit"]');
      console.log('Logged into admin area');
  } catch(e) {}

  await page.waitForTimeout(2000);

  try {
      await page.evaluate(() => {
        const overlay = document.querySelector('iframe');
        if (overlay) overlay.remove();
      });
  } catch(e) {}

  // click manage courses
  try {
      await page.click('text=Manage Courses');
      console.log('Clicked manage courses');
  } catch(e) { console.log('Click manage courses error:', e.message); }

  await page.waitForTimeout(1000);

  try {
      await page.waitForSelector('input#courseName');
      await page.fill('input#courseName', 'Playwright Course 2');
      console.log('Filling out form with Playwright Course');
  } catch(e) { console.log('Course form error:', e.message); }

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Submit
  try {
      await page.click('button:has-text("Add Course")');
      console.log('Clicked Add Course');
  } catch(e) { console.log('Click Add Course error:', e.message); }

  // Wait
  await page.waitForTimeout(2000);

  const content = await page.content();
  console.log('Contains Playwright Course 2:', content.includes('Playwright Course 2'));

  await browser.close();
})();
