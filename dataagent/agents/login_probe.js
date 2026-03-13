require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const email = process.env.LOGIN_EMAIL || process.env.PROTOTYPE_USER_EMAIL || 'pranav.patil@nikqik.com';
const password = process.env.LOGIN_PASSWORD;

async function main() {
    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();

    const setCookieLog = [];
    context.on('response', async (response) => {
        try {
            const headers = response.headers();
            if (headers['set-cookie']) {
                setCookieLog.push({ url: response.url().split('?')[0], status: response.status(), cookie: headers['set-cookie'].substring(0, 100) });
            }
        } catch(e) {}
    });

    const page = await context.newPage();
    await page.goto('https://pulse.karyaa.ai', { waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('button[type="submit"], button:has-text("LOGIN"), button:has-text("Sign in")').first().click();

    // Wait for navigation after login
    try { await page.waitForURL('**/post/workspace/**', { timeout: 20000 }); } catch(e) {}
    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    const allCookies = await context.cookies();

    const byDomain = {};
    allCookies.forEach(c => {
        if (!byDomain[c.domain]) byDomain[c.domain] = [];
        byDomain[c.domain].push(c.name);
    });

    const outputPath = path.join(process.cwd(), 'probe_result.json');
    fs.writeFileSync(outputPath, JSON.stringify({ finalUrl, setCookieLog, byDomain, allCookies }, null, 2));
    console.log('Done! Written to probe_result.json. Final URL:', finalUrl);

    await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
