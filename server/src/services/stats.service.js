const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || (global.prisma = new PrismaClient());

const stripMd = (s) => {
    if (!s) return '';
    s = s.replace(/```[\s\S]*?```/g, '')
    s = s.replace(/`[^`]*`/g, '')
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    s = s.replace(/^#{1,6}\s+/gm, '')
    s = s.replace(/^\s{0,3}[-*+]\s+/gm, '')
    s = s.replace(/^>\s+/gm, '')
    s = s.replace(/[*_~`]+/g, '')
    s = s.replace(/<\/?[^>]+>/g, '')
    return s
}

const countWords = (s) => {
    s = stripMd(s || '')
    const cn = (s.match(/[\u4e00-\u9fa5]/g) || []).length
    const en = (s.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) || []).length
    return cn + en
}

// 重新计算所有文章字数
const recalculatePostWordCounts = async () => {
    console.log('Starting word count recalculation...');
    const posts = await prisma.post.findMany({
        select: { id: true, content: true }
    });

    let updated = 0;
    for (const post of posts) {
        const count = countWords(post.content);
        await prisma.post.update({
            where: { id: post.id },
            data: { wordCount: count }
        });
        updated++;
    }
    console.log(`Updated word counts for ${updated} posts.`);
    return updated;
};

// 聚合每日统计数据 (Full rebuild or incremental)
const aggregateDailyStats = async (daysToLookBack = 365) => {
    console.log(`Starting daily stats aggregation for last ${daysToLookBack} days...`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate date range
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToLookBack);

    // We will process day by day
    let processed = 0;
    for (let i = 0; i <= daysToLookBack; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const year = dayStart.getFullYear();
        const month = String(dayStart.getMonth() + 1).padStart(2, '0');
        const day = String(dayStart.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        // 1. Visits (PV/UV)
        const visits = await prisma.visitLog.findMany({
            where: {
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd
                }
            },
            select: { ip: true }
        });
        const pv = visits.length;
        const uv = new Set(visits.map(v => v.ip).filter(Boolean)).size;

        // 2. Posts created
        const postsCount = await prisma.post.count({
            where: {
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd
                },
                published: true
            }
        });

        // 3. Comments created
        const commentsCount = await prisma.comment.count({
            where: {
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        });

        // Upsert into DailyStat
        await prisma.dailyStat.upsert({
            where: { date: dateKey },
            update: {
                pv,
                uv,
                posts: postsCount,
                comments: commentsCount,
                updatedAt: new Date()
            },
            create: {
                date: dateKey,
                pv,
                uv,
                posts: postsCount,
                comments: commentsCount,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
        processed++;
    }
    console.log(`Aggregated stats for ${processed} days.`);
    return processed;
};

// 验证数据完整性
const verifyDataIntegrity = async () => {
    const results = {
        valid: true,
        issues: []
    };

    // 1. Check if Recent DailyStats match actual logs (Sample check for yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));

    const year = yesterdayStart.getFullYear();
    const month = String(yesterdayStart.getMonth() + 1).padStart(2, '0');
    const day = String(yesterdayStart.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

    const stat = await prisma.dailyStat.findUnique({ where: { date: dateKey } });

    if (stat) {
        const actualPV = await prisma.visitLog.count({
            where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } }
        });

        if (stat.pv !== actualPV) {
            results.valid = false;
            results.issues.push(`PV mismatch for ${dateKey}: stored ${stat.pv}, actual ${actualPV}`);
        }
    }

    // 2. Check Post Word Counts
    const postsWithoutWordCount = await prisma.post.count({
        where: { wordCount: null }
    });
    if (postsWithoutWordCount > 0) {
        results.valid = false; // It's okay if 0 (default is 0? no, default is 0 but we added it as nullable first maybe? schema said Int? @default(0), so existing rows might be 0, which is fine, but newly created might be null if not handled? Prisma default handles it.)
        // Actually schema says Int? @default(0), so existing rows get 0.
        // But if logic expects > 0 for content...
        // Let's check if wordCount is 0 but content length is > 100
        const suspiciousPosts = await prisma.post.count({
            where: {
                wordCount: 0,
                content: {
                    contains: ' ' // simple check
                }
            }
        });
        if (suspiciousPosts > 5) { // Threshold
            results.issues.push(`Found ${suspiciousPosts} posts with 0 word count but likely content.`);
        }
    }

    return results;
};

module.exports = {
    recalculatePostWordCounts,
    aggregateDailyStats,
    verifyDataIntegrity,
    countWords
};
