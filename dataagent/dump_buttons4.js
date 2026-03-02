const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        await page.goto('https://pulse.karyaa.ai');
        await page.waitForSelector('input[type="password"]');
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, input[type="submit"]')).map(b => ({
                outerHTML: b.outerHTML
            }));
        });
        fs.writeFileSync('D:\\repofixs\\Mediator\\dataagent\\buttons.json', JSON.stringify(buttons, null, 2));
    } catch (e) {
        console.error(e);
    }
    await browser.close();
})();
