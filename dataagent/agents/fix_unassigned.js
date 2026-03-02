require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

async function fixAllUnassignedTasks() {
    console.log("🚀 Starting Bulk Task Assigner...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    const login = require('../utils/login');
    await login(page);

    await page.waitForTimeout(3000);

    const discoveredInfo = JSON.parse(fs.readFileSync('discoveredSchema.json'));

    // Actual users parsed before
    const validUsers = [
        "pranav.patil@nikqik.com",
        "prnv468@gmail.com",
        "puneet.pranav04@gmail.com"
    ];

    const validNames = {
        "pranav.patil@nikqik.com": "Pranav",
        "prnv468@gmail.com": "Declan Rice",
        "puneet.pranav04@gmail.com": "Leawandowski"
    };

    const collaboratorsPool = [
        ["prnv468@gmail.com"],
        ["puneet.pranav04@gmail.com"],
        ["pranav.patil@nikqik.com", "puneet.pranav04@gmail.com"],
        []
    ];

    // Let's sweep all pages to find tasks that need assigning:
    let allTasks = [];
    let currentPage = 1;
    let hasMore = true;

    console.log("🔍 Fetching all tasks across board...");

    while (hasMore) {
        const url = `https://pulse.karyaa.ai/api/boardTask/getKanbanTasksPaginated?boardId=${discoveredInfo.boardId}&workspaceId=${discoveredInfo.workspaceId}&page=${currentPage}&limit=50`;

        const responseData = await page.evaluate(async (u) => {
            const res = await fetch(u);
            return await res.json();
        }, url);

        if (responseData && responseData.data && responseData.data.tasks) {
            allTasks = allTasks.concat(responseData.data.tasks);
            console.log(`- Page ${currentPage} fetched. Total tasks so far: ${allTasks.length}`);
            hasMore = responseData.data.pagination.hasMore;
            currentPage++;
        } else {
            hasMore = false;
        }
    }

    console.log(`\n📋 Found ${allTasks.length} total tasks.`);

    // Filter tasks that need fixes (no assignee or assignee is a string instead of object)
    const tasksToFix = allTasks.filter(t => {
        if (!t.assigneePrimary) return true;
        if (typeof t.assigneePrimary === 'string') return true;
        if (typeof t.assigneePrimary === 'object' && !t.assigneePrimary.email) return true;
        return false;
    });

    console.log(`⚠️ ${tasksToFix.length} tasks identified as UNASSIGNED or invalid. Patching them now...`);

    let successCount = 0;

    for (let i = 0; i < tasksToFix.length; i++) {
        const task = tasksToFix[i];
        const uEmail = validUsers[i % validUsers.length];
        const collabs = collaboratorsPool[i % collaboratorsPool.length];

        try {
            const patchUrl = `https://pulse.karyaa.ai/api/boardTask/updateBoardTask?id=${task._id}`;
            const payload = {
                assigneePrimary: { email: uEmail, name: validNames[uEmail] }
            };

            const status = await page.evaluate(async ({ url, body }) => {
                const res = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: body
                });
                return res.status;
            }, { url: patchUrl, body: JSON.stringify(payload) });

            if (status === 200) {
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`✅ Patched ${successCount} tasks...`);
                }
            } else {
                console.error(`❌ Failed to patch task ${task.taskNumber} (HTTP ${status})`);
            }
        } catch (e) {
            console.error(`❌ Network error patching task ${task.taskNumber}`, e.message);
        }
    }

    console.log(`\n🎉 FINISHED! Successfully patched ${successCount} of ${tasksToFix.length} unassigned tasks!`);
    await browser.close();
}

fixAllUnassignedTasks();
