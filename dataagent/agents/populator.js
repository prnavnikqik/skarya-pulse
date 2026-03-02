require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const login = require('../utils/login');

function randomTitle(i) {
    const words = ['Build', 'Fix', 'Design', 'Deploy', 'Refactor', 'Test'];
    return `${words[Math.floor(Math.random() * words.length)]} Task ${i}`;
}

function distributeStatus(options, index, total) {
    const third = Math.floor(total / 3);
    if (index < third) return options[0]?.value;
    if (index < third * 2) return options[1]?.value;
    return options[2]?.value;
}

async function runPopulator() {
    const schema = JSON.parse(fs.readFileSync('formSchema.json'));

    const browser = await chromium.launch({
        headless: process.env.HEADLESS === 'true'
    });

    const page = await browser.newPage();

    await login(page);

    await page.goto(`${process.env.BASE_URL}/tasks`);

    const TOTAL = 150;

    for (let i = 0; i < TOTAL; i++) {
        console.log(`Creating task ${i + 1}/${TOTAL}`);

        for (const field of schema) {
            const selector = field.name
                ? `[name="${field.name}"]`
                : field.id
                    ? `#${field.id}`
                    : null;

            if (!selector) continue;

            if (field.tag === 'input' && field.type === 'text') {
                await page.fill(selector, randomTitle(i));
            }

            if (field.tag === 'textarea') {
                await page.fill(selector, `Auto-generated description ${i}`);
            }

            if (field.tag === 'select' && field.options) {
                const value = distributeStatus(field.options, i, TOTAL);
                if (value) await page.selectOption(selector, value);
            }
        }

        await page.click('button[type="submit"]');

        // Safe UI delay
        await page.waitForTimeout(350);
    }

    console.log('🎉 150 Tasks Created');

    await browser.close();
}

module.exports = runPopulator;