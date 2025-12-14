const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || (global.prisma = new PrismaClient());
const { logOperation } = require('../middleware/log.middleware');

const buildTree = (nodes) => {
    const map = new Map();
    nodes.forEach(n => map.set(n.id, { ...n, children: [] }));
    const roots = [];
    nodes.forEach(n => {
        if (n.parentId) {
            const parent = map.get(n.parentId);
            if (parent) parent.children.push(map.get(n.id));
        } else {
            roots.push(map.get(n.id));
        }
    });
    return roots;
};

const getDescendantIds = async (categoryId) => {
    const level1 = await prisma.category.findMany({ where: { parentId: categoryId }, select: { id: true } });
    const level1Ids = level1.map(c => c.id);
    const level2 = await prisma.category.findMany({ where: { parentId: { in: level1Ids } }, select: { id: true } });
    const level2Ids = level2.map(c => c.id);
    return [categoryId, ...level1Ids, ...level2Ids];
};

// Get all categories with post count
exports.getAllCategories = async (req, res) => {
    try {
        const { search } = req.query
        const where = {}
        if (search) where.name = { contains: search }
        const categories = await prisma.category.findMany({
            where,
            include: { _count: { select: { posts: true } } },
            orderBy: { name: 'asc' }
        })
        res.json(categories)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
};

exports.getPublicCategories = async (req, res) => {
    try {
        const { search } = req.query
        const where = {}
        if (search) where.name = { contains: search }
        const categories = await prisma.category.findMany({
            where,
            include: { posts: { where: { published: true }, select: { id: true } } },
            orderBy: { name: 'asc' }
        })
        const result = categories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            parentId: c.parentId,
            level: c.level,
            _count: { posts: c.posts.length }
        }))
        res.json(result)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

exports.getCategoryTree = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { posts: true } } },
            orderBy: { name: 'asc' }
        });
        const tree = buildTree(categories);
        res.json(tree);
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
};

// Create a category
exports.createCategory = async (req, res) => {
    try {
        const { name, description, parentId } = req.body
        if (!name) return res.status(400).json({ message: 'Category name is required' })

        const existing = await prisma.category.findUnique({ where: { name } })
        if (existing) return res.status(400).json({ message: 'Category already exists' })

        let level = 1
        let parent = null
        if (parentId) {
            parent = await prisma.category.findUnique({ where: { id: parseInt(parentId) } })
            if (!parent) return res.status(400).json({ message: 'Parent category not found' })
            if (parent.level >= 3) return res.status(400).json({ message: 'Category level cannot exceed 3' })
            level = parent.level + 1
        }

        const category = await prisma.category.create({
            data: { name, description, parentId: parent ? parent.id : null, level }
        })
        await logOperation({ req, model: 'Category', action: 'create', targetId: category.id, before: null, after: category })
        res.json(category)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

// Update a category
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, parentId } = req.body
        if (!name) return res.status(400).json({ message: 'Category name is required' })

        const before = await prisma.category.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: 'Category not found' })

        let newParentId = parentId ? parseInt(parentId) : null
        let level = 1
        if (newParentId) {
            if (newParentId === before.id) return res.status(400).json({ message: 'Category cannot be its own parent' })
            const descendants = await getDescendantIds(before.id)
            if (descendants.includes(newParentId)) return res.status(400).json({ message: 'Cannot set parent to a descendant category' })
            const parent = await prisma.category.findUnique({ where: { id: newParentId } })
            if (!parent) return res.status(400).json({ message: 'Parent category not found' })
            if (parent.level >= 3) return res.status(400).json({ message: 'Category level cannot exceed 3' })
            level = parent.level + 1
        }

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { name, description, parentId: newParentId, level }
        })
        await logOperation({ req, model: 'Category', action: 'update', targetId: category.id, before, after: category })
        res.json(category)
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

// Delete a category
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params
        const categoryId = parseInt(id)
        const existingCategory = await prisma.category.findUnique({
            where: { id: categoryId }
        })
        if (!existingCategory) return res.status(404).json({ message: 'Category not found' })

        await prisma.category.delete({ where: { id: categoryId } })
        await logOperation({ req, model: 'Category', action: 'delete', targetId: categoryId, before: existingCategory, after: null })
        res.json({ message: 'Category deleted' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
};

// Bulk delete categories
exports.bulkDeleteCategories = async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid IDs' })

        let deleted = 0
        for (const rawId of ids) {
            const id = parseInt(rawId)
            const existing = await prisma.category.findUnique({
                where: { id }
            })
            if (existing) {
                try {
                    await prisma.category.delete({ where: { id } })
                    await logOperation({ req, model: 'Category', action: 'delete', targetId: id, before: existing, after: null })
                    deleted++
                } catch (e) {
                }
            }
        }
        res.json({ deleted })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}
