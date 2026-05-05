const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text().slice(0, 500)));
  
  await page.goto('http://localhost:3100/login');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.clear());
  
  // Monitor axios
  await page.evaluate(() => {
    const origPost = window.axios.post.bind(window.axios);
    window.axios.post = async function(url, data, config) {
      console.log('AXIOS POST:', url);
      const result = await origPost(url, data, config);
      console.log('AXIOS SUCCESS:', Object.keys(result.data || {}));
      return result;
    };
  });
  
  // Type credentials
  await page.locator('input[type=""text""]').click();
  await page.keyboard.type('admin', { delay: 5 });
  
  await page.locator('input[type=""password""]').click();
  await page.keyboard.type('Admin123!', { delay: 5 });
  
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  
  console.log('Final URL:', page.url());
  
  await browser.close();
})();
