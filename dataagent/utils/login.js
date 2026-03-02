require('dotenv').config();

async function login(page) {
    const { BASE_URL, LOGIN_EMAIL, LOGIN_PASSWORD } = process.env;

    console.log("🌐 Opening login page...");
    await page.goto(BASE_URL);

    // Wait for login form
    await page.waitForSelector('input[type="password"]');

    console.log("✍️ Filling credentials...");
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);

    console.log("🚀 Clicking login...");
    await page.click('button:has-text("LOGIN")');

    // Just wait till the dashboard container or some other element appears
    await page.waitForTimeout(4000);

    console.log("✅ Logged in successfully!");
}

module.exports = login;