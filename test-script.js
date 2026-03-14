const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Go directly to signin page to authenticate with firebase
  await page.goto('http://localhost:3001/signin', { waitUntil: 'networkidle0' });

  // click toggle to sign up
  const toggleBtn = await page.$$('button[type="button"]');
  await toggleBtn[0].click();

  // fill out sign up
  await page.type('#firstName', 'Test');
  await page.type('#lastName', 'Admin');
  await page.type('#email', `testadmin${Date.now()}@example.com`);
  await page.type('#password', 'password123');

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  // Go to admin
  await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle0' });

  let isLoginPage = await page.$('#password');
  if (isLoginPage) {
    await page.type('#password', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.admin-tabs', { timeout: 5000 });
  }

  // Go to courses tab
  const buttons = await page.$$('.admin-tabs button');
  for (let btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'Manage Courses') {
      await btn.click();
      break;
    }
  }

  // Wait for the form
  await page.waitForSelector('#courseName', { timeout: 5000 });

  // Let's add an alert handler
  page.on('dialog', dialog => {
    console.log("ALERT:", dialog.message());
    dialog.accept();
  });

  // Fill the form
  await page.type('#courseName', 'New Prod Course Auth Test');

  // Submit the form
  const submitBtns = await page.$$('.form-section button[type="submit"]');
  for (let btn of submitBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'Add Course') {
      await btn.click();
      break;
    }
  }

  await page.waitForTimeout(3000);

  // Check courses table
  const courseRows = await page.$$('.data-table tbody tr');
  let found = false;
  if (courseRows) {
    for (let row of courseRows) {
      const text = await page.evaluate(el => el.textContent, row);
      if (text && text.includes('New Prod Course Auth Test')) {
        found = true;
        break;
      }
    }
  }

  console.log("Course added?", found);

  await browser.close();
})();
