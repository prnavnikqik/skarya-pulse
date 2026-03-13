require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const authData = JSON.parse(fs.readFileSync('./skarya-auth.json', 'utf-8'));
const cookie = authData.cookie;
const boardId = process.env.PROTOTYPE_BOARD_ID;
const workspaceId = process.env.PROTOTYPE_WORKSPACE_ID;

const api = axios.create({
    baseURL: 'https://pulse.karyaa.ai',
    headers: { 
        'Cookie': cookie, 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    validateStatus: () => true
});

async function run() {
    // 1. Create task
    const res = await api.post(
        `/api/boardTask/createBoardTask?boardId=${boardId}&workspaceId=${workspaceId}`,
        { name: "Final Fix Probe", status: 'To Do', priority: 'Medium', statusCategory: 'not_started', type: 'User Story', createdBy: 'Probe', percentageCompletion: 0, taskNumber: "0", customFieldValues: {}, startDate: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000*7).toISOString() }
    );
    const taskId = res.data.data._id;
    console.log('Task created:', taskId);

    // 2. Try PUT with assignee (like fix_unassigned.js)
    const payloadAssign = {
        assigneePrimary: { email: 'pranav.patil@nikqik.com', name: 'Pranav' }
    };
    const r1 = await api.put(`/api/boardTask/updateBoardTask?id=${taskId}`, payloadAssign);
    console.log('[Assign PUT] =>', r1.status, r1.data?.success, r1.data?.message || '');

    // 3. Try PUT with status + boardId/workspaceId in body (maybe they are required in body for update?)
    const payloadStatus = {
        status: 'In Progress',
        statusCategory: 'in_progress',
        percentageCompletion: 40,
        boardId,
        workspaceId
    };
    const r2 = await api.put(`/api/boardTask/updateBoardTask?id=${taskId}`, payloadStatus);
    console.log('[Status PUT] =>', r2.status, r2.data?.success, r2.data?.message || '');

    // 4. Subtask check (we know taskId in query works)
    const subPayload = {
        name: "Subtask v5",
        taskId: taskId,
        priority: 'Medium', status: 'To Do',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        startDate: new Date().toISOString(),
        createdBy: 'Probe'
    };
    const r3 = await api.post(`/api/boardSubtask/createBoardSubtask?boardId=${boardId}&workspaceId=${workspaceId}&taskId=${taskId}`, subPayload);
    console.log('[Subtask POST] =>', r3.status, r3.data?.success);
}

run();
