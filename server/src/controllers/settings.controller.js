const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

// Get all site settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await prisma.siteSettings.findMany();
        const settingsMap = {};
        settings.forEach(setting => {
            settingsMap[setting.key] = setting.value;
        });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update site settings (bulk update)
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body; // Expecting { key: value, key2: value2 }
        const keys = Object.keys(updates);

        const transactions = keys.map(key => {
            return prisma.siteSettings.upsert({
                where: { key },
                update: { value: String(updates[key]) },
                create: { key, value: String(updates[key]) },
            });
        });

        const before = await prisma.siteSettings.findMany();
        await prisma.$transaction(transactions);

        // Return updated settings
        const settings = await prisma.siteSettings.findMany();
        const settingsMap = {};
        settings.forEach(setting => {
            settingsMap[setting.key] = setting.value;
        });

        await logOperation({ req, model: 'SiteSettings', action: 'bulkUpdate', targetId: null, before, after: settings });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
