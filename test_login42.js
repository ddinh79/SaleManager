const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3100/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.clear());
  
  // Get Login.js content to verify our fix is in the bundle
  const response = await fetch('/src/pages/Login.js');
  const code = await response.text();
  console.log('Login.js length:', code.length);
  console.log('Contains response.data.token:', code.includes('response.data.token'));
  
  await browser.close();
})();
