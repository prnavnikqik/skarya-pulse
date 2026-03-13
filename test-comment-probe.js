require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const authData = JSON.parse(fs.readFileSync('./skarya-auth.json', 'utf-8'));
const cookie = authData.cookie;
const boardId = process.env.PROTOTYPE_BOARD_ID;
const workspaceId = process.env.PROTOTYPE_WORKSPACE_ID;

const api = axios.create({
    baseURL: 'https://pulse.karyaa.ai',
    headers: { 'Cookie': cookie, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    validateStatus: () => true
});

async function run() {
    const res = await api.post(
        `/api/boardTask/createBoardTask?boardId=${boardId}&workspaceId=${workspaceId}`,
        { name: "Comment Test Task", status: 'To Do', priority: 'Medium', taskNumber: "0", percentageCompletion: 0 }
    );
    const taskId = res.data.data._id;
    console.log('Task:', taskId);

    const combos = [
        { label: 'Q:board+ws+taskId', url: `/api/boardTaskComment/createBoardTaskComment?boardId=${boardId}&workspaceId=${workspaceId}&taskId=${taskId}` },
        { label: 'Q:board+ws', url: `/api/boardTaskComment/createBoardTaskComment?boardId=${boardId}&workspaceId=${workspaceId}` },
        { label: 'Q:none', url: `/api/boardTaskComment/createBoardTaskComment` },
    ];

    const bodies = [
        { boardTaskId: taskId, text: 'Test Comment 1', isEdited: false, isRoadBlock: false },
        { boardTaskId: taskId, text: 'Test Comment 2', isEdited: false, isRoadBlock: false, boardId, workspaceId },
        { boardTaskId: taskId, content: { text: 'Test Comment 3' }, text: 'Test Comment 3', isEdited: false, isRoadBlock: false },
    ];

    for (const c of combos) {
        for (const b of bodies) {
            const r = await api.post(c.url, b);
            console.log(`${c.label} | ${JSON.stringify(b).substring(0, 30)}... => ${r.status} ${r.data?.success} | ${r.data?.message || ''}`);
            if (r.data?.success) console.log('  >>> FOUND IT!');
        }
    }
}
run();
