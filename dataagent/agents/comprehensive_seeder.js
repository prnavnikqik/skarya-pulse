require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

async function selectDropdown(page, labelText, optionText) {
    try {
        await page.locator(`label:has-text("${labelText}")`).click({ timeout: 2000 });
    } catch {
        try {
            await page.locator(`text="${labelText}"`).first().click({ timeout: 2000 });
        } catch {
            return; // Skip if we can't find it
        }
    }
    try {
        await page.locator(`li[role="option"]:has-text("${optionText}")`).first().click({ timeout: 2000 });
    } catch { }
}

async function fillDate(page, labelText, dateStr) {
    try {
        const inputLocator = page.locator(`label:has-text("${labelText}")`).locator('..').locator('input');
        await inputLocator.click({ timeout: 1000 });
        await inputLocator.fill(dateStr);
    } catch {
        console.log(`Skipping date fill for ${labelText}`);
    }
}

async function runComprehensiveSeeder() {
    console.log("🚀 Starting Comprehensive IT Firm Seeder...");
    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    console.log("🌐 Logging in...");
    await page.goto(process.env.BASE_URL);
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="email"]', process.env.LOGIN_EMAIL);
    await page.fill('input[type="password"]', process.env.LOGIN_PASSWORD);
    await page.click('button:has-text("LOGIN")');
    await page.waitForTimeout(4000);

    const departments = [
        {
            name: "DevOps & Infrastructure",
            boardTemplate: "Agile Development Board",
            projects: [
                { name: "CI/CD Pipeline Setup", desc: "Setting up GitHub Actions", priority: "High", template: "Software Development" },
                { name: "Cloud Migration AWS", desc: "Moving specific on-prem assets to AWS", priority: "High", template: "Software Development" }
            ]
        },
        {
            name: "Design & UX",
            boardTemplate: "Agile Development Board",
            projects: [
                { name: "Brand Redesign", desc: "Global brand refresh", priority: "Medium", template: "Design & Creative" },
                { name: "Design System", desc: "Figma design system components", priority: "Low", template: "Design & Creative" }
            ]
        },
        {
            name: "Human Resources",
            boardTemplate: "HR & Recruitment Board",
            projects: [
                { name: "Q1 Recruitment Drive", desc: "Hiring new engineers", priority: "High", template: "HR Hiring & Onboarding" }
            ]
        }
    ];

    for (const dept of departments) {
        console.log(`\n🏗️  Creating Board: ${dept.name}`);
        try {
            await page.goto(`${process.env.BASE_URL}/boards`, { waitUntil: 'load' });
            await page.waitForTimeout(3000);
            await page.locator('button:has-text("Add Board")').first().click({ timeout: 15000 });
            await page.locator('input[type="text"]').first().fill(dept.name);
            await page.locator('button:has-text("Next: Choose Template")').first().click();
            await page.locator(`text="${dept.boardTemplate}"`).first().click();
            await page.locator('button:has-text("Create Board")').first().click();
            await page.waitForTimeout(3000);

            // Open Projects Sidebar
            await page.locator('text="Projects"').first().click();
            await page.waitForTimeout(2000);

            // Skip tour if present
            try { await page.locator('button:has-text("Skip tour")').click({ timeout: 1000 }); } catch (e) { }

            for (const proj of dept.projects) {
                console.log(`  -> 🛠️ Creating Project: ${proj.name}`);
                try {
                    await page.locator('button:has-text("Add Project"), button:has-text("Create New Project")').first().click();
                    await page.waitForTimeout(1000);

                    await page.getByRole('textbox').first().fill(proj.name);
                    try { await page.locator('textarea').first().fill(proj.desc); } catch (e) { }
                    await selectDropdown(page, 'Priority', proj.priority);

                    await page.locator('button:has-text("Create Project")').first().click();
                    await page.waitForTimeout(1500);
                    await page.locator(`text="${proj.template}"`).first().click();
                    await page.locator('button:has-text("Create")').last().click();
                    await page.waitForTimeout(1500);
                    console.log(`    ✅ Success: ${proj.name}`);
                } catch (e) {
                    console.error(`    ❌ Failed Project ${proj.name}`);
                }
            }
        } catch (error) {
            console.error(`❌ Failed Board ${dept.name}`, error);
        }
    }

    console.log("🎉 Boards & Projects Creation Complete!");

    // Now we bulk populate tasks into the most recently active board via API to show rich task data
    console.log("⚙️ Moving to API-based bulk task population to generate rich content...");

    try {
        const discoveredInfo = JSON.parse(fs.readFileSync('discoveredSchema.json'));
        const createEndpoint = discoveredInfo.createTaskEndpoint;
        const templatePayload = JSON.parse(discoveredInfo.sampleCreatePayload);

        if (createEndpoint && templatePayload) {
            // Wait to ensure auth token is fully initialized in standard requests
            await page.waitForTimeout(2000);

            // Build rich tasks
            const richTasks = [];
            const prefixes = ["Develop", "Deploy", "Debug", "Design", "Refactor", "Test", "Document"];
            const components = ["Auth Service", "DB Cluster", "UI Components", "API Gateway", "Email Service", "Payment Gateway"];
            const validNames = {
                "pranav.patil@nikqik.com": "Pranav",
                "prnv468@gmail.com": "Declan Rice",
                "puneet.pranav04@gmail.com": "Leawandowski"
            };
            const assignees = ["pranav.patil@nikqik.com", "prnv468@gmail.com", "puneet.pranav04@gmail.com"]; // Rich assignees

            const collaboratorsPool = [
                ["pranav.patil@nikqik.com", "prnv468@gmail.com"],
                ["puneet.pranav04@gmail.com", "pranav.patil@nikqik.com"],
                ["pranav.patil@nikqik.com", "prnv468@gmail.com", "puneet.pranav04@gmail.com"],
                ["puneet.pranav04@gmail.com"]
            ];

            // New arrays for requirements based on audio
            const labelsArray = ["Bug Report", "New Feature", "Improvement", "Documentation"];
            const deadlines = [
                new Date(Date.now() + 86400000).toISOString(),
                new Date(Date.now() + 3 * 86400000).toISOString(),
                new Date(Date.now() + 7 * 86400000).toISOString(),
                new Date(Date.now() + 14 * 86400000).toISOString()
            ];

            // Subtasks or Checklists could be added if supported, but let's definitely add assignees and collabs
            for (let i = 0; i < 150; i++) {
                const title = `${prefixes[i % prefixes.length]} ${components[i % components.length]} [Mock ${i}]`;
                richTasks.push({
                    ...templatePayload,
                    name: title,
                    description: `This is a highly detailed description for ${title}. It involves rigorous planning, execution, and testing across multiple stages to ensure compliance.
                    
## Acceptance Criteria:
- Unit tests pass with >80% coverage
- Code is documented
- Reviewed by QA`,
                    type: ["Task", "Bug", "Epic", "Feature"][i % 4],
                    status: ["To Do", "In Progress", "Done", "Backlog"][i % 4],
                    priority: ["Low", "Medium", "High", "Critical"][i % 4],
                    createdBy: "pranav.patil@nikqik.com",
                    assigneePrimary: { email: assignees[i % assignees.length], name: validNames[assignees[i % assignees.length]] }, // Rotating Assignee
                    collaborators: collaboratorsPool[i % collaboratorsPool.length].map(email => ({ email, name: validNames[email] })), // Rotating Collaborators
                    label: labelsArray[i % labelsArray.length],
                    dueDate: deadlines[i % deadlines.length],
                    taskNumber: Math.floor(Math.random() * 99999).toString(),
                    percentageCompletion: Math.floor(Math.random() * 100),
                    checklists: [
                        {
                            title: "Definition of Done",
                            items: [
                                { itemName: "Code Review Approved", isCompleted: i % 2 === 0 },
                                { itemName: "QA Passed", isCompleted: false },
                                { itemName: "Deployed to Staging", isCompleted: false }
                            ]
                        }
                    ]
                });
            }

            let successCount = 0;
            for (let i = 0; i < richTasks.length; i++) {
                const taskPayload = richTasks[i];
                try {
                    await page.evaluate(async ({ url, body }) => {
                        await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: body
                        });
                    }, { url: createEndpoint, body: JSON.stringify(taskPayload) });
                    successCount++;
                    if (i % 5 === 0) console.log(`    [API] Injected task ${i + 1}/${richTasks.length}`);
                } catch (err) {
                    console.error(`    ❌ Failed to inject task ${i}:`, err.message);
                }
                await page.waitForTimeout(100);
            }
            console.log(`✅ Bulk injected ${successCount} rich tasks with assignees and details!`);
        }
    } catch (e) {
        console.error("Failed API Task Population", e);
    }

    console.log("🎉 All Populating Done! Check the browser.");
}

runComprehensiveSeeder().catch(console.error);
