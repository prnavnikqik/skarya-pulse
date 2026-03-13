/**
 * authenticator.js — Skarya Pulse Authenticator Agent
 *
 * Logs into pulse.karyaa.ai using credentials from .env,
 * extracts the real __Secure-next-auth.session-token cookie,
 * fetches available workspace boards, and writes everything
 * to skarya-auth.json in the project root.
 *
 * Run this once to initialize, then again any time you see:
 *   "Unauthorized" / "Please log in" errors in the app.
 *
 * Usage:
 *   node dataagent/agents/authenticator.js
 */
require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── Credentials ────────────────────────────────────────────────────────────
const email = process.env.LOGIN_EMAIL || process.env.PROTOTYPE_USER_EMAIL || '';
const password = process.env.LOGIN_PASSWORD || '';
const workspaceId = process.env.PROTOTYPE_WORKSPACE_ID || '';

if (!email || !password) {
    console.error('❌ ERROR: LOGIN_EMAIL and LOGIN_PASSWORD must be set in .env!');
    console.error('   Add these lines to your .env file:');
    console.error('   LOGIN_EMAIL=your@email.com');
    console.error('   LOGIN_PASSWORD=yourpassword');
    process.exit(1);
}

const AUTH_OUTPUT = path.join(process.cwd(), 'skarya-auth.json');

// ─── Main ────────────────────────────────────────────────────────────────────
async function runAuthenticator() {
    console.log('🤖 [Authenticator Agent] Starting up...');
    console.log(`👤 Target: ${email}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // ── Step 1: Navigate and Login ───────────────────────────────────────────
    console.log('🌐 Navigating to pulse.karyaa.ai...');
    await page.goto('https://pulse.karyaa.ai', { waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('🔑 Entering credentials...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.locator('button[type="submit"], button:has-text("LOGIN"), button:has-text("Sign in")').first().click();

    // ── Step 2: Wait for full post-login redirect ────────────────────────────
    console.log('⏳ Waiting for session to establish...');
    try {
        await page.waitForURL('**/post/**', { timeout: 20000 });
        console.log('✅ Logged in! Final URL:', page.url());
    } catch (e) {
        console.warn('⚠️  Timeout waiting for redirect. Continuing anyway. URL:', page.url());
    }
    await page.waitForTimeout(3000); // Let all post-login API calls finish

    // ── Step 3: Extract the real session cookie ──────────────────────────────
    const allCookies = await context.cookies();
    const sessionCookie = allCookies.find(c => c.name === '__Secure-next-auth.session-token');
    const csrfCookie = allCookies.find(c => c.name === '__Host-next-auth.csrf-token');
    const callbackCookie = allCookies.find(c => c.name === '__Secure-next-auth.callback-url');

    if (!sessionCookie) {
        console.error('❌ Session cookie NOT found after login. Login may have failed.');
        console.error('   All cookies found:', allCookies.map(c => `${c.name}@${c.domain}`).join(', '));
        await browser.close();
        process.exit(1);
    }
    console.log(`🍪 Session cookie captured! (${sessionCookie.value.length} chars)`);

    // Build full cookie string (session token is the critical one)
    const cookieParts = [];
    if (callbackCookie) cookieParts.push(`${callbackCookie.name}=${callbackCookie.value}`);
    if (csrfCookie) cookieParts.push(`${csrfCookie.name}=${csrfCookie.value}`);
    cookieParts.push(`${sessionCookie.name}=${sessionCookie.value}`); // Most important one last
    const cookieStr = cookieParts.join('; ');

    // ── Step 4: Fetch boards using the authenticated browser session ─────────
    console.log('📋 Fetching available boards...');
    const boardsResult = await page.evaluate(async ({ wId, userEmail }) => {
        try {
            const res = await fetch(`/api/boards/getBoardByUser?workspaceId=${wId}&email=${encodeURIComponent(userEmail)}&subdomain=pulse`);
            const json = await res.json();
            return json;
        } catch (e) {
            return { error: e.message };
        }
    }, { wId: workspaceId, userEmail: email });

    let boards = [];
    if (boardsResult && boardsResult.success && boardsResult.data) {
        // Handle both possible response shapes
        const raw = Array.isArray(boardsResult.data) ? boardsResult.data : (boardsResult.data.boards || []);
        boards = raw.map(b => ({ id: b._id, name: b.name }));
    } else if (boardsResult && boardsResult.error) {
        console.warn('⚠️  Boards fetch failed:', boardsResult.error);
    }

    console.log(`📂 Discovered ${boards.length} board(s).`);

    // ── Step 5: Write output ─────────────────────────────────────────────────
    const output = {
        lastRefreshed: new Date().toISOString(),
        email,
        workspaceId,
        cookie: cookieStr,
        sessionTokenLength: sessionCookie.value.length,
        boards,
    };

    fs.writeFileSync(AUTH_OUTPUT, JSON.stringify(output, null, 2));
    console.log(`\n✅ skarya-auth.json saved to: ${AUTH_OUTPUT}`);
    if (boards.length > 0) {
        console.log('📌 Boards:');
        boards.forEach(b => console.log(`   • [${b.id}] ${b.name}`));
    }

    await browser.close();
    console.log('\n🚀 Authenticator complete! Your app session is now live.');
}

runAuthenticator().catch(err => {
    console.error('❌ Authenticator failed:', err.message);
    process.exit(1);
});
