require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const authData = JSON.parse(fs.readFileSync('./skarya-auth.json', 'utf-8'));
const cookie = authData.cookie;
const boardId = process.env.PROTOTYPE_BOARD_ID;
const workspaceId = process.env.PROTOTYPE_WORKSPACE_ID;

const api = axios.create({
    baseURL: 'https://pulse.karyaa.ai',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    validateStatus: s => s < 500
});

const results = [];
function log(op, success, detail) {
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${op}: ${detail}`);
    results.push({ op, success, detail });
}

async function runAll() {
    let parentTaskId = null;

    // ─── 1. CREATE TASK ───
    try {
        const res = await api.post(
            `/api/boardTask/createBoardTask?boardId=${boardId}&workspaceId=${workspaceId}`,
            {
                name: "Validation Parent Task v2",
                status: 'To Do', priority: 'High', statusCategory: 'not_started',
                type: 'User Story', createdBy: 'Validator', percentageCompletion: 0,
                startDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
                taskNumber: "0", customFieldValues: {}, checklists: [],
                recurrence: { enabled: false, frequency: 'weekly', interval: 1, endType: 'never', endAfter: 10, endOn: new Date().toISOString(), weekDays: [], monthDay: 1, yearMonth: 1, customPattern: '' }
            }
        );
        if (res.data.success) {
            parentTaskId = res.data.data._id;
            log('CREATE TASK', true, `Created "${res.data.data.name}" (${res.data.data.taskNumber}) id=${parentTaskId}`);
        } else {
            log('CREATE TASK', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('CREATE TASK', false, e.message); }

    if (!parentTaskId) { console.log('\n⛔ Cannot continue without a parent task.'); return; }

    // ─── 2. CREATE SUBTASK (fixed endpoint) ───
    try {
        const res = await api.post(
            `/api/boardSubtask/createBoardSubtask?boardId=${boardId}&workspaceId=${workspaceId}`,
            {
                name: "Validation Subtask v2",
                taskId: parentTaskId,
                priority: 'Medium', status: 'To Do',
                dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
                startDate: new Date().toISOString(),
                description: '', checklist: [],
                createdBy: 'Validator'
            }
        );
        console.log('  [Subtask raw response]', JSON.stringify(res.data).substring(0, 200));
        if (res.data.success) {
            log('CREATE SUBTASK', true, `Created subtask`);
        } else {
            log('CREATE SUBTASK', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('CREATE SUBTASK', false, e.message); }

    // ─── 3. UPDATE TASK STATUS (fixed: needs boardId, workspaceId, taskId in query) ───
    try {
        const res = await api.patch(
            `/api/boardTask/updateBoardTask?id=${parentTaskId}&boardId=${boardId}&workspaceId=${workspaceId}`,
            { status: 'In Progress', statusCategory: 'in_progress', percentageCompletion: 30 }
        );
        console.log('  [Update Status raw]', JSON.stringify(res.data).substring(0, 200));
        if (res.data.success) {
            log('UPDATE STATUS', true, 'Set to "In Progress" (30%)');
        } else {
            log('UPDATE STATUS', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('UPDATE STATUS', false, e.message); }

    // ─── 4. UPDATE TASK PRIORITY ───
    try {
        const res = await api.patch(
            `/api/boardTask/updateBoardTask?id=${parentTaskId}&boardId=${boardId}&workspaceId=${workspaceId}`,
            { priority: 'Critical' }
        );
        if (res.data.success) {
            log('UPDATE PRIORITY', true, 'Set to "Critical"');
        } else {
            log('UPDATE PRIORITY', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('UPDATE PRIORITY', false, e.message); }

    // ─── 5. SET TASK DATES ───
    try {
        const res = await api.patch(
            `/api/boardTask/updateBoardTask?id=${parentTaskId}&boardId=${boardId}&workspaceId=${workspaceId}`,
            {
                startDate: new Date().toISOString(),
                dueDate: new Date(Date.now() + 86400000 * 14).toISOString()
            }
        );
        if (res.data.success) {
            log('SET DATES', true, 'Due date extended to +14 days');
        } else {
            log('SET DATES', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('SET DATES', false, e.message); }

    // ─── 6. ADD COMMENT (fixed: needs boardId, taskId, workspaceId in query) ───
    try {
        const res = await api.post(
            `/api/boardTaskComment/createBoardTaskComment?boardId=${boardId}&taskId=${parentTaskId}&workspaceId=${workspaceId}`,
            {
                boardTaskId: parentTaskId,
                text: '**Progress Update:** Validation test comment from automated suite',
                isEdited: false,
                isRoadBlock: false
            }
        );
        console.log('  [Comment raw]', JSON.stringify(res.data).substring(0, 200));
        if (res.data.success) {
            log('ADD COMMENT', true, 'Progress comment posted');
        } else {
            log('ADD COMMENT', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('ADD COMMENT', false, e.message); }

    // ─── 7. ASSIGN TASK ───
    try {
        const res = await api.patch(
            `/api/boardTask/updateBoardTask?id=${parentTaskId}&boardId=${boardId}&workspaceId=${workspaceId}`,
            { assigneePrimary: { email: 'pranav.patil@nikqik.com', name: 'Pranav Patil' } }
        );
        if (res.data.success) {
            log('ASSIGN TASK', true, 'Assigned to pranav.patil@nikqik.com');
        } else {
            log('ASSIGN TASK', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('ASSIGN TASK', false, e.message); }

    // ─── 8. READ TASKS (GET) ───
    try {
        const res = await api.get(
            `/api/boardTask/getBoardTask?boardId=${boardId}&workspaceId=${workspaceId}`
        );
        if (res.data.success) {
            const tasks = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.tasks || []);
            log('READ TASKS', true, `Fetched ${tasks.length} tasks from board`);
        } else {
            log('READ TASKS', false, res.data.message || JSON.stringify(res.data));
        }
    } catch (e) { log('READ TASKS', false, e.message); }

    // ─── SUMMARY ───
    console.log('\n═══════════════════════════════════════');
    console.log('       VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════');
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    results.forEach(r => {
        console.log(`  ${r.success ? '✅' : '❌'} ${r.op}`);
    });
    console.log(`\n  Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
    console.log('═══════════════════════════════════════\n');
}

runAll();
