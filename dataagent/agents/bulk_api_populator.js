require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

async function runBulkiApiPopulator() {
    const discoveredInfo = JSON.parse(fs.readFileSync('discoveredSchema.json'));

    // Captured the create endpoint and payload payload from your manual task!
    const createEndpoint = discoveredInfo.createTaskEndpoint;
    const samplePayloadStr = discoveredInfo.sampleCreatePayload;

    if (!createEndpoint || !samplePayloadStr) {
        console.error("❌ Could not find the create endpoint or sample payload in discoveredSchema.json");
        return;
    }

    const templatePayload = JSON.parse(samplePayloadStr);

    console.log("🚀 Starting BULK API task populator...");

    // Launch browser to get the auth cookies
    const browser = await chromium.launch({ headless: process.env.HEADLESS === 'true' });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Logging in...
    const login = require('../utils/login');
    await login(page);

    console.log("⏳ Getting Session Cookies...");
    // Just navigate to dashboard so we have the auth cookies
    await page.waitForTimeout(3000);

    console.log("⚙️ Executing Bulk Tasks Creation...");

    // Create large arrays of tasks matching an IT firm
    const adjectives = ["Core", "Frontend", "Backend", "Mobile", "DevOps", "Security", "Legacy", "Database", "API", "Auth"];
    const actions = ["Refactor", "Implement", "Design", "Test", "Deploy", "Audit", "Migrate", "Fix", "Optimize", "Document"];
    const nouns = ["Service", "Component", "Module", "Pipeline", "Cluster", "Endpoint", "Dashboard", "Framework", "System"];

    const types = ["User Story", "Task", "Bug", "Epic", "Feature", "Documentation"];
    const statuses = ["Backlog", "To Do", "In Progress", "Blocked", "Done"];
    const priorities = ["Low", "Medium", "High", "Critical"];

    const generateRandomTask = (i) => {
        const title = `${actions[Math.floor(Math.random() * actions.length)]} ${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]} [${i}]`;
        const desc = `Automatically generated task description for IT firm scale operations. Focus on stability and testing requirements for ${title}.`;

        return {
            ...templatePayload,
            name: title,
            description: desc,
            type: types[Math.floor(Math.random() * types.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            taskNumber: Math.floor(Math.random() * 99999).toString(),
            startDate: new Date(Date.now() + i * 1864000).toISOString(),
            dueDate: new Date(Date.now() + (i + 50) * 8864000).toISOString(),
        };
    };

    let successCount = 0;
    const TOTAL_TO_CREATE = 100; // Create 100 mock tasks

    for (let i = 0; i < TOTAL_TO_CREATE; i++) {
        const taskPayload = generateRandomTask(i);

        try {
            // Run fetch natively inside the page 
            await page.evaluate(async ({ url, body }) => {
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/plain, */*'
                    },
                    body: body
                });
            }, { url: createEndpoint, body: JSON.stringify(taskPayload) });

            if (i % 10 === 0) {
                console.log(`✅ Created task ${i}...`);
            }
            successCount++;
            await page.waitForTimeout(50); // fast loop

        } catch (e) {
            console.error(`❌ Failed to create task ${i}`, e.message);
        }
    }

    console.log(`🎉 BULK API Seeder Finished! Created ${successCount}/${TOTAL_TO_CREATE} tasks.`);
    await browser.close();
}

if (require.main === module) {
    runBulkiApiPopulator().catch(console.error);
}

module.exports = runBulkiApiPopulator;
