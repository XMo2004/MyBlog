const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || (global.prisma = new PrismaClient());
const { logOperation } = require('../middleware/log.middleware');

let settingsCache = null;
let settingsCacheTimestamp = 0;
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

// Get all site settings
exports.getSettings = async (req, res) => {
    try {
        const now = Date.now();
        if (settingsCache && now - settingsCacheTimestamp < SETTINGS_CACHE_TTL_MS) {
            return res.json(settingsCache);
        }
        const settings = await prisma.siteSettings.findMany();
        const settingsMap = {};
        settings.forEach(setting => {
            settingsMap[setting.key] = setting.value;
        });
        settingsCache = settingsMap;
        settingsCacheTimestamp = now;
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
        settingsCache = settingsMap;
        settingsCacheTimestamp = Date.now();

        await logOperation({ req, model: 'SiteSettings', action: 'bulkUpdate', targetId: null, before, after: settings });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
