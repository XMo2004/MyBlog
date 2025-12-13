const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

// Get all tags with post count
exports.getAllTags = async (req, res) => {
    try {
        const { search } = req.query
        const where = {}
        if (search) where.name = { contains: search }
        const tags = await prisma.tag.findMany({
            where,
            include: { _count: { select: { posts: true } } },
            orderBy: { name: 'asc' }
        })
        res.json(tags)
    } catch (error) {
        res.status(500).json({ message: '服务器错误' })
    }
};

// Public: tags with published post count
exports.getPublicTags = async (req, res) => {
    try {
        const { search } = req.query
        const where = {}
        if (search) where.name = { contains: search }
        const tags = await prisma.tag.findMany({
            where,
            include: { posts: { where: { published: true }, select: { id: true } } },
            orderBy: { name: 'asc' }
        })
        const result = tags.map(t => ({
            id: t.id,
            name: t.name,
            _count: { posts: t.posts.length }
        }))
        res.json(result)
    } catch (error) {
        res.status(500).json({ message: '服务器错误' })
    }
}

// Delete a tag
exports.deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        const existingTag = await prisma.tag.findUnique({ where: { id: parseInt(id) } })
        if (!existingTag) return res.status(404).json({ message: '标签不存在' })
        await prisma.tag.delete({ where: { id: parseInt(id) } })
        await logOperation({ req, model: 'Tag', action: 'delete', targetId: parseInt(id), before: existingTag, after: null })
        res.json({ message: '标签已删除' })
    } catch (error) {
        res.status(500).json({ message: '服务器错误' })
    }
};

exports.createTag = async (req, res) => {
    try {
        const { name } = req.body
        if (!name) return res.status(400).json({ message: '标签名不能为空' })
        const tag = await prisma.tag.create({ data: { name } })
        await logOperation({ req, model: 'Tag', action: 'create', targetId: tag.id, before: null, after: tag })
        res.json(tag)
    } catch (error) {
        res.status(500).json({ message: '服务器错误' })
    }
}

exports.updateTag = async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body
        if (!name) return res.status(400).json({ message: '标签名不能为空' })
        const before = await prisma.tag.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: '标签不存在' })
        const tag = await prisma.tag.update({ where: { id: parseInt(id) }, data: { name } })
        await logOperation({ req, model: 'Tag', action: 'update', targetId: tag.id, before, after: tag })
        res.json(tag)
    } catch (error) {
        res.status(500).json({ message: '服务器错误' })
    }
}

exports.bulkDeleteTags = async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: '参数错误' })
        const existing = await prisma.tag.findMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        await prisma.tag.deleteMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        for (const item of existing) {
            await logOperation({ req, model: 'Tag', action: 'delete', targetId: item.id, before: item, after: null })
        }
        res.json({ deleted: ids.length })
    } catch (error) {
        res.status(500).json({ message: '服务器错误' })
    }
}
