const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || (global.prisma = new PrismaClient());

exports.recordVisit = async (req, res) => {
    try {
        const { path } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        await prisma.visitLog.create({
            data: {
                ip,
                path: path || '/',
                userAgent
            }
        });

        res.status(200).json({ message: 'Visit recorded' });
    } catch (error) {
        console.error('Record visit error:', error);
        res.status(500).json({ message: 'Failed to record visit' });
    }
};

// 获取访问统计概览
exports.getAnalytics = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const daysNum = parseInt(days);

        const toLocalYMD = (date) => {
            const d = new Date(date);
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateKeyToday = toLocalYMD(today);

        // 1. Trend Data (PV/UV) - Direct query from VisitLog for real-time accuracy
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - (daysNum - 1));

        // Fetch all visits from the period
        const visits = await prisma.visitLog.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            select: {
                createdAt: true,
                ip: true,
                path: true,
                userAgent: true
            }
        });

        // Build trend map
        const trendMap = new Map();
        for (let i = daysNum - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const k = toLocalYMD(d);
            trendMap.set(k, { date: k, pv: 0, uv: new Set() });
        }

        // Aggregate visits by local date
        visits.forEach(v => {
            const k = toLocalYMD(v.createdAt);
            if (trendMap.has(k)) {
                const entry = trendMap.get(k);
                entry.pv++;
                if (v.ip) entry.uv.add(v.ip);
            }
        });

        // Convert Sets to counts
        const trendData = Array.from(trendMap.values()).map(item => ({
            date: item.date,
            pv: item.pv,
            uv: item.uv.size
        }));

        // Today's stats
        const todayEntry = trendData.find(t => t.date === dateKeyToday) || { pv: 0, uv: 0 };
        const todayPV = todayEntry.pv;
        const todayUV = todayEntry.uv;

        // 4. Summaries
        // Yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = toLocalYMD(yesterday);
        const yesterdayStat = trendMap.get(yesterdayKey) || { pv: 0, uv: 0 };
        const yesterdayPV = yesterdayStat.pv;
        const yesterdayUV = yesterdayStat.uv;

        // Week (Last 7 days inc today)
        const weekData = trendData.slice(-7);
        const weekPV = weekData.reduce((acc, cur) => acc + cur.pv, 0);
        const weekUV = weekData.reduce((acc, cur) => acc + cur.uv, 0); // Note: Simple sum of daily UVs

        // Total (Period)
        const totalPV = trendData.reduce((acc, cur) => acc + cur.pv, 0);
        const totalUV = trendData.reduce((acc, cur) => acc + cur.uv, 0);

        // 5. Details (Top Pages, Devices, etc.) - Still need specific logs
        // For performance, we might limit this analysis to "recent 7 days" or "today" if 30 days is too much?
        // Or if we must analyze 30 days, we query VisitLogs for 30 days.
        // Let's optimize: 'topPages' using groupBy.

        // This query might be heavy if million rows.
        const pageStats = await prisma.visitLog.groupBy({
            by: ['path'],
            where: { createdAt: { gte: startDate } },
            _count: { path: true },
            orderBy: { _count: { path: 'desc' } },
            take: 10
        });

        const topPages = pageStats.map(p => ({
            path: p.path,
            count: p._count.path
        }));

        // Device/Browser/Hourly - We need the logs. 
        // Strategy: If days > 7, maybe only analyze last 7 days for these detailed charts? 
        // Or fetch all but select minimal fields.
        // Let's fetch last 7 days for detailed breakdown to be fast.
        const detailStartDate = new Date(today);
        detailStartDate.setDate(detailStartDate.getDate() - 7);

        const recentVisits = await prisma.visitLog.findMany({
            where: { createdAt: { gte: detailStartDate } },
            select: { userAgent: true, createdAt: true }
        });

        // Hourly
        const hourlyDistribution = new Array(24).fill(0);
        recentVisits.forEach(v => {
            const h = new Date(v.createdAt).getHours();
            hourlyDistribution[h]++;
        });

        // Device & Browser
        const deviceMap = { desktop: 0, mobile: 0, tablet: 0, other: 0 };
        const browserMap = new Map();

        recentVisits.forEach(v => {
            const ua = (v.userAgent || '').toLowerCase();
            // Device
            if (/mobile|android|iphone|ipod/.test(ua) && !/ipad|tablet/.test(ua)) deviceMap.mobile++;
            else if (/ipad|tablet/.test(ua)) deviceMap.tablet++;
            else if (/windows|macintosh|linux/.test(ua)) deviceMap.desktop++;
            else deviceMap.other++;

            // Browser
            let browser = '其他';
            if (ua.includes('edg/')) browser = 'Edge';
            else if (ua.includes('chrome')) browser = 'Chrome';
            else if (ua.includes('firefox')) browser = 'Firefox';
            else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
            else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
            browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
        });

        const deviceData = [
            { name: '桌面端', value: deviceMap.desktop },
            { name: '移动端', value: deviceMap.mobile },
            { name: '平板', value: deviceMap.tablet },
            { name: '其他', value: deviceMap.other }
        ].filter(d => d.value > 0);

        const browserData = Array.from(browserMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        res.json({
            summary: {
                todayPV,
                todayUV,
                yesterdayPV,
                yesterdayUV,
                weekPV,
                weekUV,
                totalPV,
                totalUV,
                pvGrowth: yesterdayPV > 0 ? ((todayPV - yesterdayPV) / yesterdayPV * 100).toFixed(1) : 0,
                uvGrowth: yesterdayUV > 0 ? ((todayUV - yesterdayUV) / yesterdayUV * 100).toFixed(1) : 0
            },
            trendData,
            topPages,
            hourlyDistribution,
            deviceData,
            browserData,
            note: "Detailed breakdowns (device/browser/hourly) are based on the last 7 days."
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: '获取统计数据失败' });
    }
};

// 获取实时访问记录
exports.getRecentVisits = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const visits = await prisma.visitLog.findMany({
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                ip: true,
                path: true,
                userAgent: true,
                createdAt: true
            }
        });

        res.json(visits);
    } catch (error) {
        console.error('Get recent visits error:', error);
        res.status(500).json({ message: '获取访问记录失败' });
    }
};
