const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

exports.getProjects = async (req, res) => {
    try {
        const { search, status } = req.query
        const where = {}
        if (status) where.status = status
        if (search) where.OR = [
            { name: { contains: search } },
            { description: { contains: search } }
        ]
        const projects = await prisma.project.findMany({ where, orderBy: { order: 'asc' } })
        res.json(projects)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

exports.createProject = async (req, res) => {
    try {
        const data = req.body
        if (!data.name || !data.description || !data.tech || !data.status || !data.color) {
            return res.status(400).json({ message: 'Invalid project data' })
        }
        const project = await prisma.project.create({ data })
        await logOperation({ req, model: 'Project', action: 'create', targetId: project.id, before: null, after: project })
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const before = await prisma.project.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: 'Not found' })
        const data = req.body
        const project = await prisma.project.update({ where: { id: parseInt(id) }, data })
        await logOperation({ req, model: 'Project', action: 'update', targetId: project.id, before, after: project })
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const before = await prisma.project.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: 'Not found' })
        await prisma.project.delete({ where: { id: parseInt(id) } })
        await logOperation({ req, model: 'Project', action: 'delete', targetId: parseInt(id), before, after: null })
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.bulkDeleteProjects = async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid ids' })
        const existing = await prisma.project.findMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        await prisma.project.deleteMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        for (const item of existing) {
            await logOperation({ req, model: 'Project', action: 'delete', targetId: item.id, before: item, after: null })
        }
        res.json({ deleted: ids.length })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
