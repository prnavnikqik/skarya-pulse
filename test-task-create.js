require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function testTaskCreate() {
    try {
        const authData = JSON.parse(fs.readFileSync('./skarya-auth.json', 'utf-8'));
        const cookie = authData.cookie;
        
        const boardId = process.env.PROTOTYPE_BOARD_ID;
        const workspaceId = process.env.PROTOTYPE_WORKSPACE_ID;
        
        console.log("Cookie:", cookie.substring(0, 30) + '...');
        console.log(`Board: ${boardId}, Workspace: ${workspaceId}`);
        
        const payload = {
            name: "Test Task via API Script",
            description: '',
            assigneePrimary: null,
            assigneeGroup: null,
            collaborators: [],
            startDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // +7 days
            status: 'To Do',
            priority: 'Medium',
            label: '',
            actualEffort: '',
            allocatedEffort: '',
            dealValue: 0,
            relation: [],
            dependency: [],
            milestone: false,
            percentageCompletion: 0,
            taskNumber: "0", 
            customFieldValues: {},
            checklists: [],
            type: 'User Story',
            recurrence: {
                enabled: false,
                frequency: 'weekly',
                interval: 1,
                endType: 'never',
                endAfter: 10,
                endOn: new Date().toISOString(),
                weekDays: [],
                monthDay: 1,
                yearMonth: 1,
                customPattern: ''
            },
            createdBy: 'Developer',
            statusCategory: 'not_started'
        };
        
        const response = await axios.post(
            `https://pulse.karyaa.ai/api/boardTask/createBoardTask?boardId=${boardId}&workspaceId=${workspaceId}`,
            payload,
            { headers: { Cookie: cookie, 'Content-Type': 'application/json' } }
        );
        
        console.log("Success! Response:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Failed:", err.response ? err.response.data : err.message);
    }
}

testTaskCreate();
