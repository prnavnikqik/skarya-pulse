import { skaryaClient } from './src/integrations/skarya-client';
import { TaskReader } from './src/integrations/task-reader';

async function test() {
    const boardId = '69a2118ecf1d73e568280ba5';
    const workspaceId = '69a202afcf1d73e568280529';
    try {
        console.log("Calling getBoardHealth...");
        const health = await TaskReader.getBoardHealth(boardId, workspaceId);
        console.log("Health:", JSON.stringify(health, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
