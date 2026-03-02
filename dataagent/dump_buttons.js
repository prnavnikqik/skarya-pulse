const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        await page.goto('https://pulse.karyaa.ai');
        await page.waitForSelector('input[type="password"]');
        const buttonsHTML = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn'));
            return buttons.map(b => b.outerHTML);
        });
        console.log("BUTTONS:", buttonsHTML);
    } catch (e) {
        console.error(e);
    }
    await browser.close();
})();
