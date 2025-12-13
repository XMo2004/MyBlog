const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logOperation } = require('../middleware/log.middleware');

exports.getColumns = async (req, res) => {
    try {
        const { search, status } = req.query
        const where = {}
        if (status) where.status = status
        if (search) where.OR = [
            { title: { contains: search } },
            { description: { contains: search } }
        ]
        const columns = await prisma.column.findMany({ where, orderBy: { order: 'asc' } })
        res.json(columns)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

exports.createColumn = async (req, res) => {
    try {
        const data = req.body
        if (!data.title || !data.description || !data.readTime || !data.color || !data.status) {
            return res.status(400).json({ message: 'Invalid column data' })
        }
        const column = await prisma.column.create({ data })
        await logOperation({ req, model: 'Column', action: 'create', targetId: column.id, before: null, after: column })
        res.json(column)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

exports.updateColumn = async (req, res) => {
    try {
        const { id } = req.params
        const before = await prisma.column.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: 'Not found' })
        const data = req.body
        const column = await prisma.column.update({ where: { id: parseInt(id) }, data })
        await logOperation({ req, model: 'Column', action: 'update', targetId: column.id, before, after: column })
        res.json(column)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

exports.deleteColumn = async (req, res) => {
    try {
        const { id } = req.params
        const before = await prisma.column.findUnique({ where: { id: parseInt(id) } })
        if (!before) return res.status(404).json({ message: 'Not found' })
        await prisma.column.delete({ where: { id: parseInt(id) } })
        await logOperation({ req, model: 'Column', action: 'delete', targetId: parseInt(id), before, after: null })
        res.json({ message: 'Column deleted' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

exports.bulkDeleteColumns = async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid ids' })
        const existing = await prisma.column.findMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        await prisma.column.deleteMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        for (const item of existing) {
            await logOperation({ req, model: 'Column', action: 'delete', targetId: item.id, before: item, after: null })
        }
        res.json({ deleted: ids.length })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Tree Management
exports.getColumnTree = async (req, res) => {
    try {
        const { id } = req.params;
        const column = await prisma.column.findUnique({ where: { id: parseInt(id) } });
        if (!column) return res.status(404).json({ message: 'Column not found' });

        const nodes = await prisma.columnNode.findMany({
            where: { columnId: parseInt(id) },
            orderBy: { order: 'asc' },
            include: { post: { select: { id: true, title: true, summary: true, published: true } } }
        });

        const buildTree = (nodes) => {
            const map = {};
            const roots = [];
            
            // Initialize map
            nodes.forEach(node => {
                map[node.id] = { ...node, children: [] };
            });

            // Build hierarchy
            nodes.forEach(node => {
                if (node.parentId && map[node.parentId]) {
                    map[node.parentId].children.push(map[node.id]);
                } else {
                    roots.push(map[node.id]);
                }
            });

            return roots;
        };

        const tree = buildTree(nodes);
        res.json({ ...column, tree });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createNode = async (req, res) => {
    try {
        const { id } = req.params; // columnId
        const { parentId, title, type, postId, order } = req.body;
        
        const node = await prisma.columnNode.create({
            data: {
                columnId: parseInt(id),
                parentId: parentId ? parseInt(parentId) : null,
                title,
                type, // 'category' or 'post'
                postId: postId ? parseInt(postId) : null,
                order: order || 0
            }
        });
        
        await logOperation({ req, model: 'ColumnNode', action: 'create', targetId: node.id, before: null, after: node });
        res.json(node);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateNode = async (req, res) => {
    try {
        const { nodeId } = req.params;
        const { title, parentId, order, postId } = req.body;
        
        const before = await prisma.columnNode.findUnique({ where: { id: parseInt(nodeId) } });
        if (!before) return res.status(404).json({ message: 'Node not found' });

        const node = await prisma.columnNode.update({
            where: { id: parseInt(nodeId) },
            data: {
                title,
                parentId: parentId !== undefined ? (parentId ? parseInt(parentId) : null) : undefined,
                order: order !== undefined ? parseInt(order) : undefined,
                postId: postId !== undefined ? (postId ? parseInt(postId) : null) : undefined
            }
        });

        await logOperation({ req, model: 'ColumnNode', action: 'update', targetId: node.id, before, after: node });
        res.json(node);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteNode = async (req, res) => {
    try {
        const { nodeId } = req.params;
        const before = await prisma.columnNode.findUnique({ where: { id: parseInt(nodeId) } });
        if (!before) return res.status(404).json({ message: 'Node not found' });

        await prisma.columnNode.delete({ where: { id: parseInt(nodeId) } });
        
        await logOperation({ req, model: 'ColumnNode', action: 'delete', targetId: parseInt(nodeId), before, after: null });
        res.json({ message: 'Node deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

