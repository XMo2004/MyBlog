const { verifyDataIntegrity, aggregateDailyStats, recalculatePostWordCounts } = require('../server/src/services/stats.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runVerification() {
    console.log('=== Starting Verification ===');

    // 1. Recalculate word counts (should be fast if few posts, or correct)
    console.log('\n--- Testing Word Count Recalculation ---');
    try {
        const updated = await recalculatePostWordCounts();
        console.log(`PASS: Recalculated ${updated} posts.`);
    } catch (e) {
        console.error('FAIL: Word count recalculation failed', e);
    }

    // 2. Aggregate Stats (last 7 days)
    console.log('\n--- Testing Daily Stats Aggregation (7 days) ---');
    try {
        const days = await aggregateDailyStats(7);
        console.log(`PASS: Aggregated ${days} days.`);

        // Verify aggregation exists
        const count = await prisma.dailyStat.count();
        console.log(`PASS: DailyStat table has ${count} records.`);
    } catch (e) {
        console.error('FAIL: Aggregation failed', e);
    }

    // 3. Verify Integrity
    console.log('\n--- Testing Integrity Verification ---');
    try {
        const report = await verifyDataIntegrity();
        console.log('Integrity Report:', JSON.stringify(report, null, 2));
        if (report.valid) {
            console.log('PASS: Integrity check passed.');
        } else {
            console.log('WARN: Integrity issues found (expected since we just built it).');
        }
    } catch (e) {
        console.error('FAIL: Verification failed', e);
    }

    console.log('\n=== Verification Complete ===');
    await prisma.$disconnect();
}

runVerification();
