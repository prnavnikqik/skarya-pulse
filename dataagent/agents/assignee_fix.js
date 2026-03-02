require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

async function runAssigneeFix() {
    console.log("🚀 Starting Assignee Fix Injector...");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    const login = require('../utils/login');
    await login(page);

    await page.waitForTimeout(3000);

    const discoveredInfo = JSON.parse(fs.readFileSync('discoveredSchema.json'));
    const createEndpoint = discoveredInfo.createTaskEndpoint;
    const templatePayload = JSON.parse(discoveredInfo.sampleCreatePayload);

    // The actual valid users in this board/workspace are:
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
        ["prnv468@gmail.com", "puneet.pranav04@gmail.com"],
        []
    ];

    console.log("⚙️ Injecting 15 perfectly allocated tasks with OBJECT assignees...");

    const richTasks = [];
    for (let i = 0; i < 15; i++) {
        const uEmail = validUsers[i % validUsers.length];
        const collabs = collaboratorsPool[i % collaboratorsPool.length];

        richTasks.push({
            ...templatePayload,
            name: `Assignee OBJECT Feature ${i}`,
            description: "Testing valid assignees mapped directly from the backend users list, passed as Objects.",
            type: "Task",
            status: "To Do",
            priority: "High",
            createdBy: "pranav.patil@nikqik.com",
            assigneePrimary: { email: uEmail, name: validNames[uEmail] },
            collaborators: collabs.map(email => ({ email: email, name: validNames[email] })),
            taskNumber: Math.floor(Math.random() * 99999).toString(),
        });
    }

    let successCount = 0;
    for (const taskPayload of richTasks) {
        try {
            await page.evaluate(async ({ url, body }) => {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: body
                });
            }, { url: createEndpoint, body: JSON.stringify(taskPayload) });
            successCount++;
        } catch (e) {
            console.error("Failed injection", e);
        }
    }

    console.log(`✅ Fixed! Injected ${successCount} tasks with REAL assignees As Objects!`);
    await browser.close();
}

runAssigneeFix();
