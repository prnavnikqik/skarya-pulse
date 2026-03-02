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

async function runMultiBoardSeeder() {
    console.log("🚀 Starting Multi-Board Seeder (Marketing & Testing)...");
    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🌐 Logging in...");
    await page.goto(process.env.BASE_URL);
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="email"]', process.env.LOGIN_EMAIL);
    await page.fill('input[type="password"]', process.env.LOGIN_PASSWORD);
    await page.locator('button:has-text("LOGIN")').click();
    await page.waitForTimeout(4000);

    const targetBoards = [
        {
            name: "Marketing Department",
            boardTemplate: "Agile Development Board",
            projects: [
                { name: "Q4 Digital Campaign", desc: "Running Google & Social Ads", priority: "High", template: "Software Development" },
                { name: "SEO Optimization", desc: "Technical content SEO pass", priority: "Medium", template: "Software Development" }
            ],
            taskPrefixes: ["Draft", "Review", "Publish", "Analyze", "A/B Test", "Design", "Outreach"],
            taskComponents: ["Social Posts", "Blog Article", "Landing Page", "Ad Copy", "Email Blast", "Video Asset"]
        },
        {
            name: "Testing Department",
            boardTemplate: "Agile Development Board",
            projects: [
                { name: "Automated Regression Suite", desc: "Cypress automated E2E testing", priority: "High", template: "Software Development" },
                { name: "Manual QA", desc: "Release validation passes", priority: "Medium", template: "Software Development" }
            ],
            taskPrefixes: ["Write Test", "Execute", "Verify Fix", "Report Bug", "Automate", "Review Coverage"],
            taskComponents: ["Login Flow", "Checkout Process", "API Gateway", "Dashboard UI", "Payment Gateway"]
        }
    ];

    const discoveredInfo = JSON.parse(fs.readFileSync('discoveredSchema.json'));
    const templatePayload = JSON.parse(discoveredInfo.sampleCreatePayload);

    for (const boardCfg of targetBoards) {
        console.log(`\n🏗️  Creating Board: ${boardCfg.name}`);
        try {
            await page.goto(process.env.BASE_URL, { waitUntil: 'load' });
            await page.waitForTimeout(4000);
            await page.locator('text=Boards').first().click();
            await page.waitForTimeout(4000);

            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);

            console.log("Clicking Add Board Natively");
            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Board'));
                if (btn) btn.click();
            });
            await page.waitForTimeout(1000);
            await page.evaluate((name) => {
                const i = document.querySelector('input');
                if (i) { i.value = name; i.dispatchEvent(new Event('input', { bubbles: true })); }
            }, boardCfg.name);
            await page.waitForTimeout(1000);

            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next: Choose Template'));
                if (btn) btn.click();
            });
            await page.waitForTimeout(2000);

            await page.evaluate((templateName) => {
                const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText === templateName);
                if (el) el.click();
            }, boardCfg.boardTemplate);
            await page.waitForTimeout(1000);

            await page.evaluate(() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Create Board');
                if (btn) btn.click();
            });
            await page.waitForTimeout(6000); // Give time for redirect

            // Fetch board/workspace ID directly from URL
            const currentUrl = page.url();
            console.log("After creation, URL is:", currentUrl);
            const urlParts = currentUrl.split('/');
            // URL format typically: https://pulse.karyaa.ai/:workspaceId/board/:boardId
            let workspaceId = urlParts[3];
            let boardIdField = urlParts[5];
            console.log("Extracted WorkspaceID:", workspaceId, "BoardID:", boardIdField);

            // Open Projects Sidebar
            try { await page.locator('text="Projects"').first().click({ timeout: 3000 }); } catch (e) { console.log('Could not find projects sidebar.') }
            await page.waitForTimeout(2000);

            // Skip tour if present
            try { await page.locator('button:has-text("Skip tour")').click({ timeout: 1000 }); } catch (e) { }

            for (const proj of boardCfg.projects) {
                console.log(`  -> 🛠️ Creating Project: ${proj.name}`);
                try {
                    await page.evaluate(() => {
                        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Project') || b.innerText.includes('Create New Project'));
                        if (btn) btn.click();
                    });

                    await page.waitForTimeout(1000);

                    await page.evaluate((p) => {
                        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
                        // Usually the first visible text input in the modal is the project name
                        const i = inputs.length > 0 ? inputs[inputs.length - 1] : null;
                        if (i) { i.value = p.name; i.dispatchEvent(new Event('input', { bubbles: true })); }
                        const t = document.querySelector('textarea');
                        if (t) { t.value = p.desc; t.dispatchEvent(new Event('input', { bubbles: true })); }
                    }, proj);

                    await selectDropdown(page, 'Priority', proj.priority);

                    await page.evaluate(() => {
                        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create Project'));
                        if (btn) btn.click();
                    });
                    await page.waitForTimeout(1500);

                    await page.evaluate((tmpl) => {
                        const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText === tmpl);
                        if (el) el.click();
                    }, proj.template);

                    await page.evaluate(() => {
                        const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText === 'Create');
                        if (btns.length > 0) btns[btns.length - 1].click();
                    });
                    await page.waitForTimeout(1500);
                    console.log(`    ✅ Success: ${proj.name}`);
                } catch (e) {
                    console.error(`    ❌ Failed Project ${proj.name}`);
                }
            }

            console.log(`  -> ⚙️ Rehydrating tasks via API for ${boardCfg.name}...`);
            await page.waitForTimeout(2000);

            // Build task creation endpoint for this specific board
            const createEndpoint = `https://pulse.karyaa.ai/api/boardTask/createBoardTask?boardId=${boardIdField}&workspaceId=${workspaceId}`;

            const validNames = {
                "pranav.patil@nikqik.com": "Pranav",
                "prnv468@gmail.com": "Declan Rice",
                "puneet.pranav04@gmail.com": "Leawandowski"
            };
            const assignees = ["pranav.patil@nikqik.com", "prnv468@gmail.com", "puneet.pranav04@gmail.com"];

            const collaboratorsPool = [
                ["pranav.patil@nikqik.com", "prnv468@gmail.com"],
                ["puneet.pranav04@gmail.com", "pranav.patil@nikqik.com"],
                ["pranav.patil@nikqik.com", "prnv468@gmail.com", "puneet.pranav04@gmail.com"],
                ["puneet.pranav04@gmail.com"]
            ];

            const labelsArray = ["Bug Report", "New Feature", "Improvement", "Documentation"];

            const richTasks = [];
            for (let i = 0; i < 75; i++) {
                const pfx = boardCfg.taskPrefixes[i % boardCfg.taskPrefixes.length];
                const cmp = boardCfg.taskComponents[i % boardCfg.taskComponents.length];
                const title = `${pfx} ${cmp} [Task ${i + 1}]`;

                const dueDate = new Date(Date.now() + (Math.floor(Math.random() * 30) + 1) * 86400000).toISOString();

                richTasks.push({
                    ...templatePayload,
                    name: title,
                    description: `Automatically generated task for ${boardCfg.name}.\n\nDetailed tracking for ${title}.\n- Review process\n- Complete implementation`,
                    type: ["Task", "Bug", "Epic", "Feature"][i % 4],
                    status: ["To Do", "In Progress", "Done", "Backlog"][i % 4],
                    priority: ["Low", "Medium", "High", "Critical"][i % 4],
                    createdBy: "pranav.patil@nikqik.com",
                    assigneePrimary: { email: assignees[i % assignees.length], name: validNames[assignees[i % assignees.length]] },
                    collaborators: collaboratorsPool[i % collaboratorsPool.length].map(email => ({ email, name: validNames[email] })),
                    label: labelsArray[i % labelsArray.length],
                    dueDate: dueDate,
                    taskNumber: Math.floor(Math.random() * 99999).toString(),
                    percentageCompletion: Math.floor(Math.random() * 100),
                    checklists: [
                        {
                            title: "Pre-Flight Checklist",
                            items: [
                                { itemName: "Review requirements", isCompleted: true },
                                { itemName: "Final QA", isCompleted: i % 2 === 0 },
                                { itemName: "Sign-off", isCompleted: false }
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
                    if ((i + 1) % 15 === 0) console.log(`    [API] Injected ${i + 1}/${richTasks.length}`);
                } catch (err) {
                    console.error(`    ❌ Failed to inject task ${i}:`, err.message);
                }
                await page.waitForTimeout(50);
            }
            console.log(`  ✅ Done with ${boardCfg.name}. Seeded 2 projects and ${successCount} tasks.\n`);

        } catch (error) {
            console.error(`❌ Complete failure on Board ${boardCfg.name}`, error.message);
        }
    }

    console.log("🎉 All Boards, Projects, and Tasks completely seeded! Please verify in the application.");
    await browser.close();
}

runMultiBoardSeeder().catch(console.error);
