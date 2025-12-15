const { getMigrationHistory } = require('./src/services/migration.service');

async function main() {
    console.log("Fetching migration history...");
    try {
        const history = await getMigrationHistory();
        console.log("Migration History:", JSON.stringify(history, null, 2));
    } catch (error) {
        console.error("Error fetching history:", error);
    }
}

main();
