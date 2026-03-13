const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto('http://localhost:5656/', { waitUntil: 'networkidle0' });
    console.log("Loaded /");

    // Wait for sidebar
    await page.waitForSelector('.ni');

    // Click a recent chat history item
    const recentChats = await page.$$('.hi');
    if (recentChats.length > 0) {
        console.log("Found recent chats in sidebar. Clicking the first one...");
        await recentChats[0].click();

        // Wait for the UI view to flip
        await new Promise(r => setTimeout(r, 2000));

        // Check if messages list is rendered
        const msgs = await page.$$('.msg');
        console.log(`Successfully opened chat! Rendered ${msgs.length} messages.`);
    } else {
        console.log("No recent chats found in sidebar.");
    }

    // Click Daily Standup layout
    const navs = await page.$$('.ni');
    for (let n of navs) {
        const text = await page.evaluate(el => el.textContent, n);
        if (text && text.includes("Daily Standup")) {
            await n.click();
            console.log("Clicked Daily Standup Nav");
            break;
        }
    }

    await new Promise(r => setTimeout(r, 1500));
    const mainHtml = await page.evaluate(() => document.querySelector('.main')?.innerHTML || '');
    if (mainHtml.includes("Past Standups")) {
        console.log("SUCCESS: Past Standups section is visible.");
        if (mainHtml.includes("at ")) {
            console.log("-> Also found real past standup records in the grid.");
        }
    }

    console.log("Finished script.");
    await browser.close();
})();
