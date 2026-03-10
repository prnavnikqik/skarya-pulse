const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('http://localhost:5656/pulse', { waitUntil: 'networkidle0' });
    const recentChats = await page.$$('.hi');
    if (recentChats.length > 0) {
        await recentChats[0].click();
        await new Promise(r => setTimeout(r, 2000));
        const msgs = await page.$$('.msg');
        console.log(`Rendered msgs count: ${msgs.length}`);
    }
    await browser.close();
})();
