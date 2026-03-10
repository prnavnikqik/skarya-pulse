const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto('http://localhost:5656/pulse', { waitUntil: 'networkidle0' });
    console.log("Loaded /pulse");

    // Wait for sidebar
    await page.waitForSelector('.ni');

    // Let's create a standup chat
    const standupBtn = await page.$$('.ni');
    await standupBtn[1].click(); // Click Daily Standup nav item
    console.log("Clicked Daily Standup");

    await new Promise(r => setTimeout(r, 1000));

    await page.waitForSelector('.stbtn');
    await page.click('.stbtn'); // Start Standup button
    console.log("Started Standup");

    await new Promise(r => setTimeout(r, 2000));

    // Type something
    await page.keyboard.type("I am working on the pulse layout.");
    await page.keyboard.press("Enter");
    console.log("Sent message to pulse");

    // wait for response stream to settle
    await new Promise(r => setTimeout(r, 8000));

    // Refresh page
    await page.goto('http://localhost:5656/pulse', { waitUntil: 'networkidle0' });
    console.log("Reloaded page");

    await new Promise(r => setTimeout(r, 2000));

    // Read sidebars
    const sidebarHtml = await page.evaluate(() => document.querySelector('#sb')?.innerHTML || '');
    if (sidebarHtml.includes('working on the pulse')) {
        console.log("SUCCESS: Found the chat title in the sidebar!");
    } else {
        console.log("Chat not found in sidebar HTML... it might just have 'New Conversation' title or it's missing.");
        console.log("Sidebar snippet:", sidebarHtml.substring(0, 500));
    }

    // Click daily standup to see layout list
    await page.evaluate(() => {
        document.querySelectorAll('.ni')[1].click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const layoutHtml = await page.evaluate(() => document.querySelector('.main')?.innerHTML || '');
    if (layoutHtml.includes('Past Standups')) {
        console.log("SUCCESS: Past Standups section is visible.");
    }

    console.log("Finished script.");
    await browser.close();
})();
