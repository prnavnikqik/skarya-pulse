import { skaryaClient } from './src/integrations/skarya-client';

async function test() {
    const boardId = '69a2118ecf1d73e568280ba5';
    const workspaceId = '69a202afcf1d73e568280529';
    try {
        const response = await skaryaClient.get<any>('/api/boardTask/getBoardTask', { boardId, workspaceId });
        console.log("Response:", JSON.stringify(response, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
