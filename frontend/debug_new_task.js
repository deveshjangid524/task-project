import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Redirect console logs
  page.on('console', msg => console.log(`PAGE LOG [${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Logging in...');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name=email]', 'test35@test.com');
  await page.fill('input[name=password]', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard');

  console.log('Navigating to tasks...');
  await page.goto('http://localhost:5173/tasks');
  await page.waitForSelector('button:has-text("New Task")');

  console.log('Clicking New Task button...');
  await page.click('button:has-text("New Task")');

  // Wait bit for modal animation/render
  await page.waitForTimeout(1000);

  const modalVisible = await page.isVisible('text="Create New Task"');
  console.log('Is "Create New Task" visible:', modalVisible);

  if (!modalVisible) {
    console.log('Modal not visible by text. Checking DOM...');
    const modalExists = await page.locator('.fixed.inset-0.z-50').count();
    console.log('Number of modal elements (.fixed.inset-0.z-50):', modalExists);
    
    if (modalExists > 0) {
        const opacity = await page.locator('.fixed.inset-0.z-50').evaluate(el => window.getComputedStyle(el).opacity);
        const display = await page.locator('.fixed.inset-0.z-50').evaluate(el => window.getComputedStyle(el).display);
        const zIndex = await page.locator('.fixed.inset-0.z-50').evaluate(el => window.getComputedStyle(el).zIndex);
        console.log(`Modal CSS - Display: ${display}, Opacity: ${opacity}, Z-Index: ${zIndex}`);
    }
  }

  await browser.close();
})();
