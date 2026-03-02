const { chromium } = require('playwright');
const login = require('../utils/login');

// Helper to handle MUI dropdowns robustly
async function selectDropdown(page, labelText, optionText) {
    // Attempt to click the field by label or surrounding context
    try {
        // Mui selects usually have a label we can click, or an input we can target
        await page.locator(`label:has-text("${labelText}")`).click({ timeout: 2000 });
    } catch {
        // Fallback: finding the div/input acting as the combobox
        await page.locator(`text="${labelText}"`).first().click();
    }
    // Wait for the dropdown list to appear and click the option
    await page.locator(`li[role="option"]:has-text("${optionText}")`).first().click();
}

// Helper to handle dates robustly (bypassing the calendar clicking trap)
async function fillDate(page, labelText, dateStr) {
    // Mui date pickers usually have an underlying input field we can type into directly.
    try {
        const inputLocator = page.locator(`label:has-text("${labelText}")`).locator('..').locator('input');
        await inputLocator.click();
        await inputLocator.fill(dateStr);
    } catch {
        // If clicking the input doesn't work, we try to use evaluate to set the value, or click edit icon
        console.log(`Could not simply fill date for ${labelText}. You might need to adjust the CSS. Skipping date blocker.`);
    }
}

async function runSeeder() {
    const browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true',
        slowMo: 100 // Visual delay to see it working and prevent racing
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Log in
    await login(page);

    console.log("⏳ Waiting for dashboard to load...");
    await page.waitForTimeout(5000); // Wait for initial app load

    // We will organize our data to create
    const departments = [
        {
            name: "Development Department",
            boardTemplate: "Agile Development Board",
            projects: [
                {
                    name: "Client Portal Migration",
                    desc: "Migrating the legacy client portal to the new framework.",
                    priority: "High",
                    budget: "250000",
                    contractValue: "275000",
                    template: "Software Development"
                },
                {
                    name: "Mobile App Development",
                    desc: "Creating the new iOS and Android mobile app.",
                    priority: "High",
                    budget: "350000",
                    contractValue: "385000",
                    template: "Software Development"
                }
            ]
        },
        {
            name: "QA & Testing Department",
            boardTemplate: "Agile Development Board",
            projects: [
                {
                    name: "Automated Testing Framework",
                    desc: "Implement complete E2E testing framework",
                    priority: "Medium",
                    budget: "100000",
                    contractValue: "110000",
                    template: "Testing & QA"
                }
            ]
        }
    ];

    for (const dept of departments) {
        console.log(`🏗️ Creating Board: ${dept.name}`);
        try {
            // Go to home/boards page just in case
            await page.goto(`${process.env.BASE_URL}/boards`, { waitUntil: 'load' });
            await page.waitForTimeout(2000);

            // Click Add Board
            await page.locator('button:has-text("Add Board")').first().click();

            // Fill Board Name (assuming standard MUI textfield)
            await page.locator('input[type="text"]').first().fill(dept.name);

            // Next Choose Template
            await page.locator('button:has-text("Next: Choose Template")').first().click();

            // Select template
            await page.locator(`text="${dept.boardTemplate}"`).first().click();

            // Create Board
            await page.locator('button:has-text("Create Board")').first().click();

            console.log(`✅ Board '${dept.name}' created! Waiting for UI...`);
            await page.waitForTimeout(3000); // wait for redirect / load

            // Open the board if it didn't auto-open
            try {
                // If we are still on boards page, try to click the board card
                await page.locator(`h6:has-text("${dept.name}")`).first().click();
                await page.waitForTimeout(2000);
            } catch (e) {
                console.log("Assuming already inside the board.");
            }

            // Navigate to Projects tab/sidebar
            console.log(`📂 Navigating to projects for ${dept.name}`);
            await page.locator('text="Projects"').first().click();
            await page.waitForTimeout(2000);

            // Check if tour shows up and skip it
            try {
                await page.locator('button:has-text("Skip tour")').click({ timeout: 2000 });
                console.log("Skipped tour");
            } catch (e) { }

            for (const proj of dept.projects) {
                console.log(`  -> 🛠️ Creating Project: ${proj.name}`);

                // Add Project button
                await page.locator('button:has-text("Add Project"), button:has-text("Create New Project")').first().click();
                await page.waitForTimeout(1000);

                // Assuming the modal has standard inputs
                // Project Name
                await page.getByRole('textbox').first().fill(proj.name);

                // Description (often a textarea or second textbox)
                try {
                    await page.locator('textarea').first().fill(proj.desc);
                } catch (e) { }

                // Priorities
                await selectDropdown(page, 'Priority', proj.priority);

                // Dates: we bypass the calendar popup!
                // Mui date inputs can usually be typed into if you clear them or just type 
                // formatted as MM/DD/YYYY
                await fillDate(page, 'End Date', '12/31/2026');

                // Budget 
                try {
                    await page.locator('input[type="number"]').nth(0).fill(proj.budget);
                } catch (e) { }

                // Billing Model
                await selectDropdown(page, 'Billing Model', 'Fixed Price');

                // Contract Value
                try {
                    await page.locator('input[type="number"]').nth(1).fill(proj.contractValue);
                } catch (e) { }

                // Submit creation
                await page.locator('button:has-text("Create Project")').first().click();

                // Choose template for project
                await page.waitForTimeout(2000);
                await page.locator(`text="${proj.template}"`).first().click();

                await page.locator('button:has-text("Create")').last().click();
                console.log(`  ✅ Project '${proj.name}' created!`);

                await page.waitForTimeout(2000);
            }

        } catch (error) {
            console.error(`❌ Failed processing ${dept.name}: `, error.message);
        }
    }

    console.log("🎉 Seeding complete!");
    // Note: Do not close browser immediately so user can see result
    // await browser.close();
}

if (require.main === module) {
    runSeeder().catch(console.error);
}

module.exports = runSeeder;
