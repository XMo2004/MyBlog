const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

exports.getResources = async (req, res) => {
    try {
        const resources = await prisma.resource.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createResource = async (req, res) => {
    try {
        const data = req.body
        if (!data.name || !data.url || !data.type || !data.category) {
            return res.status(400).json({ message: 'Invalid resource data' })
        }
        const resource = await prisma.resource.create({ data })
        await logOperation({ req, model: 'Resource', action: 'create', targetId: resource.id, before: null, after: resource })
        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const before = await prisma.resource.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: 'Not found' })
        const data = req.body
        const resource = await prisma.resource.update({ where: { id: parseInt(id) }, data })
        await logOperation({ req, model: 'Resource', action: 'update', targetId: resource.id, before, after: resource })
        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        const before = await prisma.resource.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: 'Not found' })
        await prisma.resource.delete({ where: { id: parseInt(id) } })
        await logOperation({ req, model: 'Resource', action: 'delete', targetId: parseInt(id), before, after: null })
        res.json({ message: 'Resource deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.bulkDeleteResources = async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid ids' })
        const existing = await prisma.resource.findMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        await prisma.resource.deleteMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        for (const item of existing) {
            await logOperation({ req, model: 'Resource', action: 'delete', targetId: item.id, before: item, after: null })
        }
        res.json({ deleted: ids.length })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.getResources = async (req, res) => {
    try {
        const { search, category, type } = req.query
        const where = {}
        if (category) where.category = category
        if (type) where.type = type
        if (search) where.OR = [
            { name: { contains: search } },
            { description: { contains: search } }
        ]
        const resources = await prisma.resource.findMany({ where, orderBy: { order: 'asc' } })
        res.json(resources)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
