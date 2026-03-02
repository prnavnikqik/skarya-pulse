require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

async function runApiPopulator() {
    const discoveredInfo = JSON.parse(fs.readFileSync('discoveredSchema.json'));

    // We captured the create endpoint and payload payload from your manual task!
    const createEndpoint = discoveredInfo.createTaskEndpoint;
    const samplePayloadStr = discoveredInfo.sampleCreatePayload;

    if (!createEndpoint || !samplePayloadStr) {
        console.error("❌ Could not find the create endpoint or sample payload in discoveredSchema.json");
        return;
    }

    const templatePayload = JSON.parse(samplePayloadStr);

    console.log("🚀 Starting fast API task populator...");

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

    // We can execute requests directly in the page context where all cookies/tokens exist!
    console.log("⚙️ Executing API Tasks Creation...");

    // Let's create realistic dev tasks
    const tasks = [
        { name: "Design REST API schema for User module", description: "Design the initial REST endpoints and request/response shapes for User authentication and profiles.", type: "Epic", status: "Backlog" },
        { name: "Setup PostgreSQL database", description: "Spin up RDS postgres instance and run init scripts.", type: "Task", status: "In Progress" },
        { name: "Implement User Login Endpoint", description: "Create POST /api/login", type: "User Story", status: "To Do" },
        { name: "Implement User Register Endpoint", description: "Create POST /api/register", type: "User Story", status: "To Do" },
        { name: "Fix password reset bug", description: "Password reset link throws 500 when clicked twice.", type: "Bug", status: "Backlog" },
        { name: "Create Dashboard UI Wireframes", description: "Design the main analytics dashboard wireframes in Figma", type: "Task", status: "Done" },
        { name: "Develop Dashboard Frontend Component", description: "React component for the main view", type: "Feature", status: "To Do" },
        { name: "Setup CI/CD pipeline in GitHub Actions", description: "Create github actions workflows for lint, test, and build", type: "Task", status: "In Progress" },
        { name: "Write unit tests for Auth service", description: "Reach 80% coverage on auth module", type: "Task", status: "To Do" },
        { name: "Refactor database connection pool", description: "Current connection pool is leaking connections", type: "Enhancement", status: "Blocked" },
        { name: "Update API Documentation", description: "Update Swagger docs with new user endpoints.", type: "Documentation", status: "Backlog" },
    ];

    let successCount = 0;

    for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];

        // Customizing the payload
        const taskPayload = {
            ...templatePayload,
            name: t.name,
            description: t.description,
            type: t.type,
            status: t.status,
            taskNumber: Math.floor(Math.random() * 10000).toString(),
            // Advance dates to show varying timelines
            startDate: new Date(Date.now() + i * 86400000).toISOString(),
            dueDate: new Date(Date.now() + (i + 3) * 86400000).toISOString(),
        };

        try {
            // Run fetch natively inside the page so we automatically pass all CSRF and auth headers
            const resData = await page.evaluate(async ({ url, body }) => {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/plain, */*'
                    },
                    body: body
                });
                return res.text();
            }, { url: createEndpoint, body: JSON.stringify(taskPayload) });

            console.log(`✅ Created: ${t.name}`);
            successCount++;
            await page.waitForTimeout(500); // polite delay

        } catch (e) {
            console.error(`❌ Failed to create task: ${t.name}`, e.message);
        }
    }

    console.log(`🎉 API Seeder Finished! Created ${successCount}/${tasks.length} tasks.`);
    await browser.close();
}

if (require.main === module) {
    runApiPopulator().catch(console.error);
}

module.exports = runApiPopulator;
