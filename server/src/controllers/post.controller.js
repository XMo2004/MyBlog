const { PrismaClient } = require('@prisma/client');
const prisma = global.prisma || (global.prisma = new PrismaClient());
const { logOperation } = require('../middleware/log.middleware');

exports.getAllPosts = async (req, res) => {
    try {
        const { search, category, categoryId, tag, sort } = req.query
        const where = { published: true }
        if (search) where.OR = [
            { title: { contains: search } },
            { content: { contains: search } }
        ]
        if (category || categoryId) {
            let target
            if (categoryId) {
                target = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } })
            } else {
                target = await prisma.category.findUnique({ where: { name: category } })
            }
            if (target) {
                // collect descendants up to 2 levels (max depth 3)
                const level1 = await prisma.category.findMany({ where: { parentId: target.id }, select: { id: true } })
                const level1Ids = level1.map(c => c.id)
                const level2 = await prisma.category.findMany({ where: { parentId: { in: level1Ids } }, select: { id: true } })
                const level2Ids = level2.map(c => c.id)
                where.categoryId = { in: [target.id, ...level1Ids, ...level2Ids] }
            }
        }
        if (tag) {
            where.tags = { some: { name: tag } }
        }
        const orderBy = {}
        if (sort === 'oldest') {
            orderBy.createdAt = 'asc'
        } else {
            orderBy.createdAt = 'desc'
        }
        const posts = await prisma.post.findMany({
            where,
            include: { author: { select: { username: true, nickname: true, avatar: true } }, tags: true, category: true },
            orderBy
        })
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all posts including drafts (for admin)
exports.getAllPostsAdmin = async (req, res) => {
    try {
        const { search, published, tagId, categoryId, sort } = req.query
        const where = {}
        if (published === 'true') where.published = true
        if (published === 'false') where.published = false
        if (search) where.OR = [
            { title: { contains: search } },
            { content: { contains: search } }
        ]
        if (tagId) {
            where.tags = { some: { id: parseInt(tagId) } }
        }
        if (categoryId) {
            const target = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } })
            if (target) {
                const level1 = await prisma.category.findMany({ where: { parentId: target.id }, select: { id: true } })
                const level1Ids = level1.map(c => c.id)
                const level2 = await prisma.category.findMany({ where: { parentId: { in: level1Ids } }, select: { id: true } })
                const level2Ids = level2.map(c => c.id)
                where.categoryId = { in: [target.id, ...level1Ids, ...level2Ids] }
            }
        }

        const orderBy = {}
        if (sort === 'oldest') {
            orderBy.createdAt = 'asc'
        } else {
            orderBy.createdAt = 'desc'
        }

        const posts = await prisma.post.findMany({ include: { author: { select: { username: true, nickname: true, avatar: true } }, tags: true, category: true }, orderBy, where })
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single post
exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) },
            include: { 
                author: { select: { username: true, nickname: true, avatar: true } }, 
                tags: true, 
                category: true, 
                comments: { 
                    include: { 
                        user: { select: { username: true, nickname: true, avatar: true } },
                        likes: { select: { userId: true } } 
                    } 
                } 
            }
        });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Process comments to add like count and isLiked status
        const userId = req.user ? req.user.userId : null;
        if (post.comments) {
            post.comments = post.comments.map(comment => {
                const likeCount = comment.likes.length;
                const isLiked = userId ? comment.likes.some(like => like.userId === userId) : false;
                // Remove the raw likes array to keep response clean (optional, but good practice if list is huge)
                // For now, let's keep it simple or remove it. 
                // Ideally we shouldn't send all userIds who liked it.
                delete comment.likes; 
                return { ...comment, likeCount, isLiked };
            });
        }

        // Check access permission
        if (post.accessLevel && post.accessLevel !== 'regular') {
            const user = req.user; // populated by verifyTokenOptional
            const userLevel = user ? user.membershipType : 'regular';
            const userRole = user ? user.role : 'guest';

            if (userRole !== 'admin') {
                if (post.accessLevel === 'pro' && userLevel !== 'pro') {
                    return res.status(403).json({ message: 'This post requires Pro membership', requiredLevel: 'pro' });
                }
                if (post.accessLevel === 'plus' && userLevel !== 'plus' && userLevel !== 'pro') {
                    return res.status(403).json({ message: 'This post requires Plus membership', requiredLevel: 'plus' });
                }
            }
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Create post
exports.createPost = async (req, res) => {
    try {
        const { title, content, published, tags, categories, summary, categoryId, accessLevel } = req.body;
        
        // 输入验证
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ message: '文章标题不能为空' });
        }
        
        if (title.trim().length > 200) {
            return res.status(400).json({ message: '文章标题不能超过200个字符' });
        }
        
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ message: '文章内容不能为空' });
        }
        
        // 验证 accessLevel
        const validAccessLevels = ['regular', 'plus', 'pro'];
        const safeAccessLevel = validAccessLevels.includes(accessLevel) ? accessLevel : 'regular';

        let tagData = [];
        if (tags && Array.isArray(tags)) {
            // 过滤空标签并限制数量
            const validTags = tags
                .filter(tag => typeof tag === 'string' && tag.trim())
                .map(tag => tag.trim().slice(0, 50)) // 标签最大 50 字符
                .slice(0, 20); // 最多 20 个标签
            
            tagData = validTags.map(tag => ({
                where: { name: tag },
                create: { name: tag }
            }));
        }

        let catId = null;
        if (categoryId) {
            catId = parseInt(categoryId)
        } else if (categories && Array.isArray(categories) && categories.length > 0) {
            const firstCat = categories[0]
            const cat = await prisma.category.upsert({
                where: { name: firstCat },
                update: {},
                create: { name: firstCat }
            })
            catId = cat.id
        }

        const data = {
            title: title.trim(),
            content: content.trim(),
            published: !!published,
            authorId: req.user.userId,
            categoryId: catId ?? null,
            accessLevel: safeAccessLevel
        }
        if (typeof summary !== 'undefined') data.summary = summary ? summary.trim().slice(0, 500) : null
        if (tagData && tagData.length > 0) {
            data.tags = { connectOrCreate: tagData }
        }
        const post = await prisma.post.create({ data, include: { tags: true, category: true } });
        await logOperation({ req, model: 'Post', action: 'create', targetId: post.id, before: null, after: post })
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Server error' });
    }
};

// Update post
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, published, tags, categories, summary, categoryId, accessLevel } = req.body;

        // 验证 ID
        const postId = parseInt(id);
        if (isNaN(postId) || postId <= 0) {
            return res.status(400).json({ message: '无效的文章ID' });
        }

        // Check ownership
        const existingPost = await prisma.post.findUnique({
            where: { id: postId },
            include: { tags: true, category: true }
        });
        if (!existingPost) return res.status(404).json({ message: 'Post not found' });
        if (existingPost.authorId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updateData = {}
        
        // 验证并清理输入
        if (typeof title !== 'undefined') {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({ message: '文章标题不能为空' });
            }
            if (title.trim().length > 200) {
                return res.status(400).json({ message: '文章标题不能超过200个字符' });
            }
            updateData.title = title.trim();
        }
        
        if (typeof content !== 'undefined') {
            if (typeof content !== 'string') {
                return res.status(400).json({ message: '无效的文章内容' });
            }
            updateData.content = content.trim();
        }
        
        if (typeof published !== 'undefined') updateData.published = !!published
        if (typeof summary !== 'undefined') updateData.summary = summary ? summary.trim().slice(0, 500) : null
        
        // 验证 accessLevel
        if (typeof accessLevel !== 'undefined') {
            const validAccessLevels = ['regular', 'plus', 'pro'];
            updateData.accessLevel = validAccessLevels.includes(accessLevel) ? accessLevel : 'regular';
        }

        if (tags && Array.isArray(tags)) {
            // 过滤空标签并限制数量
            const validTags = tags
                .filter(tag => typeof tag === 'string' && tag.trim())
                .map(tag => tag.trim().slice(0, 50))
                .slice(0, 20);
            
            const currentTagNames = existingPost.tags.map(t => t.name);
            const tagsToDisconnect = currentTagNames.filter(name => !validTags.includes(name));
            const tagsToConnect = validTags.filter(name => !currentTagNames.includes(name));

            updateData.tags = {
                disconnect: tagsToDisconnect.map(name => ({ name })),
                connectOrCreate: tagsToConnect.map(name => ({
                    where: { name },
                    create: { name }
                }))
            };
        }

        if (typeof categoryId !== 'undefined' || (categories && Array.isArray(categories))) {
            let catId = null
            if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
                const parsedCatId = parseInt(categoryId);
                if (!isNaN(parsedCatId) && parsedCatId > 0) {
                    catId = parsedCatId;
                }
            } else if (categories && categories.length > 0) {
                const firstCat = String(categories[0]).trim();
                if (firstCat) {
                    const cat = await prisma.category.upsert({
                        where: { name: firstCat },
                        update: {},
                        create: { name: firstCat }
                    })
                    catId = cat.id
                }
            }
            updateData.categoryId = catId
        }

        const post = await prisma.post.update({
            where: { id: postId },
            data: updateData,
            include: { tags: true, category: true }
        });
        await logOperation({ req, model: 'Post', action: 'update', targetId: post.id, before: existingPost, after: post })
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error?.message || 'Server error' });
    }
};

// Delete post
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const existingPost = await prisma.post.findUnique({ where: { id: parseInt(id) } });
        if (!existingPost) return res.status(404).json({ message: 'Post not found' });
        if (existingPost.authorId !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await prisma.post.delete({ where: { id: parseInt(id) } });
        await logOperation({ req, model: 'Post', action: 'delete', targetId: parseInt(id), before: existingPost, after: null })
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.bulkDeletePosts = async (req, res) => {
    try {
        const { ids } = req.body
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Invalid ids' })
        const existing = await prisma.post.findMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        await prisma.post.deleteMany({ where: { id: { in: ids.map(i => parseInt(i)) } } })
        for (const item of existing) {
            await logOperation({ req, model: 'Post', action: 'delete', targetId: item.id, before: item, after: null })
        }
        res.json({ deleted: ids.length })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}
