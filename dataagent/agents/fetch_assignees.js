require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

async function fetchAssignees() {
    console.log("🚀 Fetching Assignees...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const login = require('../utils/login');
    await login(page);

    await page.waitForTimeout(3000);

    const discoveredInfo = JSON.parse(fs.readFileSync('discoveredSchema.json'));
    const assigneeUrl = `https://pulse.karyaa.ai/api/boardTask/getFilteredAssignee?workspaceId=${discoveredInfo.workspaceId}&boardId=${discoveredInfo.boardId}`;

    try {
        const responseData = await page.evaluate(async (url) => {
            const res = await fetch(url);
            return await res.text();
        }, assigneeUrl);

        fs.writeFileSync('assignees.json', responseData);
        console.log("✅ Dumped assignees to assignees.json");
    } catch (err) {
        console.error("Failed", err);
    }
    await browser.close();
}

fetchAssignees();
