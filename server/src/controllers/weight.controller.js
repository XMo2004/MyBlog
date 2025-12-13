const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

exports.getWeights = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        const weights = await prisma.weightRecord.findMany({
            where,
            orderBy: { date: 'asc' }
        });
        res.json(weights);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.addWeight = async (req, res) => {
    try {
        const { date, weight, note } = req.body;
        // Normalize date to remove time part if needed, but client usually sends full date.
        // Assuming client sends YYYY-MM-DD or ISO string.
        // Prisma DateTime is ISO.
        
        const recordDate = new Date(date);
        
        // Check if date exists
        const existing = await prisma.weightRecord.findFirst({
            where: { date: recordDate }
        });

        let result;
        if (existing) {
             result = await prisma.weightRecord.update({
                where: { id: existing.id },
                data: { weight: parseFloat(weight), note }
            });
            await logOperation('WeightRecord', 'UPDATE', result.id, req.user?.id, JSON.stringify(existing), JSON.stringify(result), req.ip);
        } else {
             result = await prisma.weightRecord.create({
                data: {
                    date: recordDate,
                    weight: parseFloat(weight),
                    note
                }
            });
            await logOperation('WeightRecord', 'CREATE', result.id, req.user?.id, null, JSON.stringify(result), req.ip);
        }
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteWeight = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.weightRecord.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ message: 'Record not found' });

        await prisma.weightRecord.delete({ where: { id: parseInt(id) } });
        await logOperation('WeightRecord', 'DELETE', existing.id, req.user?.id, JSON.stringify(existing), null, req.ip);
        res.json({ message: 'Record deleted' });
    } catch (error) {
         console.error(error);
         res.status(500).json({ message: 'Server error', error: error.message });
    }
};
