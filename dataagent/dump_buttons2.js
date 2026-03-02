const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        await page.goto('https://pulse.karyaa.ai');
        await page.waitForSelector('input[type="password"]');
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => ({
                text: b.innerText,
                className: b.className,
                type: b.getAttribute('type')
            }));
        });
        console.log("BUTTONS INFO:");
        console.log(JSON.stringify(buttons, null, 2));
    } catch (e) {
        console.error(e);
    }
    await browser.close();
})();
