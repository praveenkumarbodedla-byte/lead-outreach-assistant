import { chromium } from 'playwright'; // Playwright might be installed or we can try puppeteer
import fs from 'fs';

async function run() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE - ${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.error('[BROWSER RUNTIME ERROR]:', err);
    });

    console.log('Navigating to http://localhost:5173/dashboard...');
    await page.goto('http://localhost:5173/dashboard');
    
    // Wait for 3 seconds to let errors compile
    await page.waitForTimeout(3000);
    
    // Let's print DOM content to see what was rendered
    const content = await page.content();
    console.log('DOM Content length:', content.length);
    console.log('HTML snippet:', content.slice(0, 500));
  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
