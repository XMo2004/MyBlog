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
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);
        startDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // 获取所有访问记录
        const visits = await prisma.visitLog.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            select: {
                ip: true,
                path: true,
                userAgent: true,
                createdAt: true
            }
        });

        // 今日数据
        const todayVisits = visits.filter(v => new Date(v.createdAt) >= today);
        const todayPV = todayVisits.length;
        const todayUV = new Set(todayVisits.map(v => v.ip)).size;

        // 昨日数据
        const yesterdayVisits = visits.filter(v => {
            const d = new Date(v.createdAt);
            return d >= yesterday && d < today;
        });
        const yesterdayPV = yesterdayVisits.length;
        const yesterdayUV = new Set(yesterdayVisits.map(v => v.ip)).size;

        // 本周数据
        const weekVisits = visits.filter(v => new Date(v.createdAt) >= weekAgo);
        const weekPV = weekVisits.length;
        const weekUV = new Set(weekVisits.map(v => v.ip)).size;

        // 总计
        const totalPV = visits.length;
        const totalUV = new Set(visits.map(v => v.ip)).size;

        // 按天统计趋势
        const trendMap = new Map();
        for (let i = daysNum - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            trendMap.set(dateKey, { date: dateKey, pv: 0, uv: new Set() });
        }

        visits.forEach(v => {
            const dateKey = new Date(v.createdAt).toISOString().split('T')[0];
            if (trendMap.has(dateKey)) {
                const entry = trendMap.get(dateKey);
                entry.pv++;
                if (v.ip) entry.uv.add(v.ip);
            }
        });

        const trendData = Array.from(trendMap.values()).map(item => ({
            date: item.date,
            pv: item.pv,
            uv: item.uv.size
        }));

        // 热门页面
        const pathCountMap = new Map();
        visits.forEach(v => {
            const path = v.path || '/';
            pathCountMap.set(path, (pathCountMap.get(path) || 0) + 1);
        });
        const topPages = Array.from(pathCountMap.entries())
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // 按小时分布（最近7天）
        const hourlyDistribution = new Array(24).fill(0);
        weekVisits.forEach(v => {
            const hour = new Date(v.createdAt).getHours();
            hourlyDistribution[hour]++;
        });

        // 设备分析（简单解析userAgent）
        const deviceMap = { desktop: 0, mobile: 0, tablet: 0, other: 0 };
        visits.forEach(v => {
            const ua = (v.userAgent || '').toLowerCase();
            if (/mobile|android|iphone|ipod/.test(ua) && !/ipad|tablet/.test(ua)) {
                deviceMap.mobile++;
            } else if (/ipad|tablet/.test(ua)) {
                deviceMap.tablet++;
            } else if (/windows|macintosh|linux/.test(ua)) {
                deviceMap.desktop++;
            } else {
                deviceMap.other++;
            }
        });

        const deviceData = [
            { name: '桌面端', value: deviceMap.desktop },
            { name: '移动端', value: deviceMap.mobile },
            { name: '平板', value: deviceMap.tablet },
            { name: '其他', value: deviceMap.other }
        ].filter(d => d.value > 0);

        // 浏览器分析
        const browserMap = new Map();
        visits.forEach(v => {
            const ua = (v.userAgent || '').toLowerCase();
            let browser = '其他';
            if (ua.includes('edg/')) browser = 'Edge';
            else if (ua.includes('chrome')) browser = 'Chrome';
            else if (ua.includes('firefox')) browser = 'Firefox';
            else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
            else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
            browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
        });
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
            browserData
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
