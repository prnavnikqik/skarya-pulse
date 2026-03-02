const runExplorer = require('./agents/explorer');
const runPopulator = require('./agents/populator');

async function main() {
    console.log('🔍 Running Explorer...');
    await runExplorer();

    console.log('🚀 Running Populator...');
    await runPopulator();
}

main();