require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const login = require('../utils/login');

async function runExplorer() {
    const browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true'
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const discovered = {
        apiCalls: [],
        workspaceId: null,
        boardId: null,
        createTaskEndpoint: null,
        sampleCreatePayload: null,
        statuses: null,
        priorities: null
    };

    // 🔥 Intercept ALL API calls
    page.on('request', req => {
        if (req.url().includes('/api/')) {
            discovered.apiCalls.push({
                url: req.url(),
                method: req.method()
            });

            // Detect workspace & board IDs from query
            const url = new URL(req.url());

            if (url.searchParams.get('workspaceId')) {
                discovered.workspaceId = url.searchParams.get('workspaceId');
            }

            if (url.searchParams.get('boardId')) {
                discovered.boardId = url.searchParams.get('boardId');
            }

            // Detect create task endpoint
            if (req.method() === 'POST' && req.url().toLowerCase().includes('task')) {
                discovered.createTaskEndpoint = req.url();
                discovered.sampleCreatePayload = req.postData();
            }
        }
    });

    page.on('response', async res => {
        const url = res.url();

        try {
            if (url.includes('getAllStatPrioLabTyp')) {
                const json = await res.json();
                discovered.statuses = json?.status || null;
                discovered.priorities = json?.priority || null;
            }
        } catch (e) { }
    });

    console.log("🌐 Logging in...");
    await login(page);

    console.log("⏳ Waiting for dashboard API activity...");
    await page.waitForTimeout(8000);

    console.log("📌 Please manually CREATE ONE TASK now...");
    console.log("⏳ You have 25 seconds...");
    await page.waitForTimeout(25000);

    fs.writeFileSync(
        'discoveredSchema.json',
        JSON.stringify(discovered, null, 2)
    );

    console.log("✅ Explorer finished.");
    console.log("📁 Saved → discoveredSchema.json");

    await browser.close();
}

if (require.main === module) {
    runExplorer();
}

module.exports = runExplorer;