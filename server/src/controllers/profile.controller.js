const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

// Get profile (assuming single user profile for now, id=1)
exports.getProfile = async (req, res) => {
    try {
        const profile = await prisma.profile.findFirst();
        if (!profile) {
            // Return empty structure if not found/initialized
            return res.json({
                name: '',
                title: '',
                location: '',
                bio: '',
                skills: '[]',
                interests: '[]',
                experience: '[]',
                education: '[]',
                social: {}
            });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const payload = req.body || {};

        const data = {
            name: payload.name || '',
            title: payload.title || '',
            location: payload.location || '',
            bio: payload.bio || '',
            avatar: payload.avatar || null,
            email: payload.email || null,
            github: payload.github || null,
            twitter: payload.twitter || null,
            linkedin: payload.linkedin || null,
            skills: typeof payload.skills === 'string' ? payload.skills : JSON.stringify(Array.isArray(payload.skills) ? payload.skills : []),
            interests: typeof payload.interests === 'string' ? payload.interests : JSON.stringify(Array.isArray(payload.interests) ? payload.interests : []),
            experience: typeof payload.experience === 'string' ? payload.experience : JSON.stringify(Array.isArray(payload.experience) ? payload.experience : []),
            education: typeof payload.education === 'string' ? payload.education : JSON.stringify(Array.isArray(payload.education) ? payload.education : []),
        };

        const existing = await prisma.profile.findFirst();

        let profile;
        if (existing) {
            const before = existing;
            profile = await prisma.profile.update({ where: { id: existing.id }, data });
            await logOperation({ req, model: 'Profile', action: 'update', targetId: profile.id, before, after: profile });
        } else {
            profile = await prisma.profile.create({ data });
            await logOperation({ req, model: 'Profile', action: 'create', targetId: profile.id, before: null, after: profile });
        }

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
