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
